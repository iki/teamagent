import { execFileSync } from "node:child_process";
import { readFile, mkdir } from "node:fs/promises";
import { resolve, join } from "node:path";
import { Effect } from "effect";
import { openMemoryHost } from "../runtime/memory.ts";
import {
  CodeManifestSchema,
  DocumentManifestSchema,
  type Corpus,
  type Passage,
} from "./contracts.ts";
import { cache, readJson, repository, sha256, writeJson } from "./io.ts";

/** Neutral input units shared by all engines; source lines remain separate from the display header. */
export function passagesFor(sourceId: string, path: string, text: string): Passage[] {
  const lines = text.split(/\r?\n/);
  const passages: Passage[] = [];
  let start = 0;
  while (start < lines.length) {
    let end = start;
    let content = "";
    while (end < lines.length && end - start < 30) {
      const line = lines[end] ?? "";
      if (content.length > 0 && content.length + line.length + 1 > 1600) break;
      content += `${content.length === 0 ? "" : "\n"}${line}`;
      end += 1;
      if (content.length >= 1600) break;
    }
    for (let offset = 0; offset < content.length; offset += 1600) {
      const body = content.slice(offset, offset + 1600);
      if (body.trim().length === 0) continue;
      passages.push({
        id: sha256(`${sourceId}\0${path}\0${start}\0${offset}`).slice(0, 32),
        sourceId,
        path,
        lineStart: start + 1,
        lineEnd: end,
        text: `Source: ${sourceId}/${path}\n${body}`,
      });
    }
    if (end >= lines.length) break;
    start = Math.max(start + 1, end - 5);
  }
  return passages;
}

export async function prepare(output?: string): Promise<void> {
  const code = await readJson(
    join(repository, "app/benchmark/cases-code.json"),
    CodeManifestSchema,
  );
  const documents = await readJson(
    join(repository, "app/benchmark/cases-documents.json"),
    DocumentManifestSchema,
  );
  if (code.cases.length < 40 || documents.cases.length < 30)
    throw new Error("Gold case manifests are not complete");
  const passages: Passage[] = [];
  const selected: { source: string; path: string; sha256: string; bytes: number }[] = [];
  for (const repo of code.repos) {
    const root = resolve(repository, repo.root);
    for (const file of repo.files) {
      if (
        !/^[a-f0-9]{40,64}$/.test(repo.commit) ||
        file.path.startsWith("-") ||
        file.path.includes("..")
      )
        throw new Error("Invalid committed source selection");
      const bytes = execFileSync("git", ["-C", root, "show", `${repo.commit}:${file.path}`], {
        timeout: 20_000,
        maxBuffer: 16_777_216,
        windowsHide: true,
      });
      if (sha256(bytes) !== file.sha256 || bytes.length !== file.bytes)
        throw new Error(`Source drift: ${repo.id}/${file.path}`);
      const text = new TextDecoder("utf8", { fatal: true }).decode(bytes);
      if (text.includes("\0")) throw new Error(`Binary selected for coding text: ${file.path}`);
      passages.push(...passagesFor(repo.id, file.path, text));
      selected.push({ source: repo.id, path: file.path, sha256: file.sha256, bytes: bytes.length });
    }
  }
  await mkdir(cache, { recursive: true });
  const memory = await Effect.runPromise(
    openMemoryHost({ data: join(cache, "pdf-import-state"), root: repository }),
  );
  const extraction = [];
  try {
    for (const source of documents.sources) {
      const path = resolve(repository, source.path);
      const bytes = await readFile(path);
      if (sha256(bytes) !== source.sha256 || bytes.length !== source.bytes)
        throw new Error(`PDF source drift: ${source.id}`);
      const start = performance.now();
      const receipt = await Effect.runPromise(memory.get({ locator: path, kind: "file" }));
      const elapsedMs = performance.now() - start;
      const markdown = receipt.version.files.find((file) => file.role === "markdown");
      if (markdown === undefined) throw new Error(`PDF conversion unavailable: ${source.id}`);
      const read = await Effect.runPromise(
        memory.read(receipt.source.id, markdown.path, receipt.version.id),
      );
      const text = new TextDecoder("utf8", { fatal: true }).decode(read.bytes);
      passages.push(...passagesFor(source.id, source.id, text));
      selected.push({
        source: source.id,
        path: source.path,
        sha256: source.sha256,
        bytes: bytes.length,
      });
      extraction.push({
        id: source.id,
        pages: source.pages,
        inputBytes: bytes.length,
        markdownBytes: read.bytes.length,
        imageCount: receipt.version.files.filter((file) => file.role === "image").length,
        elapsedMs,
        status: receipt.status,
        warnings: receipt.version.provenance.warnings,
        parser: receipt.version.provenance.parserVersion,
        version: receipt.version.contentHash,
      });
    }
  } finally {
    await Effect.runPromise(memory.close());
  }
  if (passages.length > 30_000) throw new Error("Corpus exceeds benchmark's 30,000 passage bound");
  const corpus: Corpus = {
    format: "teamagent-memory-benchmark-v1",
    createdAt: new Date().toISOString(),
    passages,
    cases: [...code.cases, ...documents.cases],
  };
  if (new Set(corpus.cases.map((task) => task.id)).size !== corpus.cases.length)
    throw new Error("Duplicate case IDs");
  if (new Set(passages.map((passage) => passage.id)).size !== passages.length)
    throw new Error("Duplicate passage IDs");
  const corpusPath = resolve(output ?? join(cache, "corpus.json"));
  await writeJson(corpusPath, corpus);
  await writeJson(`${corpusPath}.preparation.json`, {
    codeManifestHash: sha256(JSON.stringify(code)),
    documentManifestHash: sha256(JSON.stringify(documents)),
    corpusHash: sha256(JSON.stringify(corpus)),
    selected,
    extraction,
  });
  process.stdout.write(
    JSON.stringify({
      files: selected.length,
      passages: passages.length,
      cases: corpus.cases.length,
      output: corpusPath,
    }) + "\n",
  );
}
