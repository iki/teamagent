import { assertTemporaryFixture, mkdtemp } from "./temporary.ts";
import { afterAll, beforeAll, describe, expect, test } from "bun:test";
import assert from "node:assert/strict";
import { Database } from "bun:sqlite";
import { copyFile, mkdir, realpath, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { Effect, Schema } from "effect";
import {
  MemoryError,
  ProvenanceSchema,
  type CaptureRequest,
  type CaptureResult,
  type ExternalExtractorProfile,
  type MemoryApi,
  type Provenance,
  type SourceCapture,
  type SourceVersion,
} from "@/memory";
import { defaultImportPython, parserVersion } from "../app/imports/documents.ts";
import { extractorProfileIdentity } from "../app/imports/extractors.ts";
import { createSourceCapture } from "../app/imports/index.ts";
import { digest } from "../app/imports/limits.ts";
import { runProcess } from "../app/imports/process.ts";
import { openMemory } from "../app/memory/index.ts";

let directory = "";
let workspace = "";
let temporary = "";
let worker = "";
const stores: MemoryApi[] = [];
const legacyProvenance: Provenance = {
  etag: null,
  lastModified: null,
  repositoryCommit: null,
  parserVersion: "fixture-parser/1",
  warnings: [],
};
const detailedProvenance: Provenance = {
  ...legacyProvenance,
  extraction: { policy: "fixture-policy/1", parsers: ["fixture-parser/1"] },
};

function profile(overrides: Partial<ExternalExtractorProfile> = {}): ExternalExtractorProfile {
  return {
    id: "pdf-fixture",
    engine: "xberg",
    version: "1.0.0",
    command: process.execPath,
    args: [worker, "{input}", "{outputDir}"],
    versionArgs: [worker, "--version"],
    ...overrides,
  };
}

function request(locator: string, overrides: Partial<CaptureRequest> = {}): CaptureRequest {
  return {
    locator,
    kind: "auto",
    convert: true,
    workspaceRoot: workspace,
    dataDirectory: join(directory, "state"),
    temporaryDirectory: temporary,
    ...overrides,
  };
}

function captured(result: CaptureResult) {
  if (result.status !== "captured") throw new Error("Expected a complete capture");
  return result;
}

function previous(result: Extract<CaptureResult, { status: "captured" }>): SourceVersion {
  return {
    id: "fixture-version",
    sourceId: "fixture-source",
    workspaceId: "fixture-workspace",
    number: 1,
    contentHash: "a".repeat(64),
    retrievedAt: "2026-10-04T00:00:00.000Z",
    provenance: result.provenance,
    files: result.files.map((file) => ({
      path: file.path,
      role: file.role,
      mediaType: file.mediaType,
      size: file.bytes.byteLength,
      sha256: digest(file.bytes),
      origin: file.origin ?? null,
    })),
  };
}

function fixtureCapture(provenance: Provenance): CaptureResult {
  return {
    status: "captured",
    kind: "file",
    locator: "fixed.txt",
    provenance,
    files: [
      {
        path: "original/fixed.txt",
        role: "original",
        mediaType: "text/plain",
        bytes: new TextEncoder().encode("Unchanged evidence"),
      },
    ],
  };
}

async function memory(name: string, capture: SourceCapture) {
  const options = {
    dataDirectory: join(directory, name),
    workspaceId: "provenance-fixture",
    workspaceRoot: workspace,
    capture,
  };
  const store = await Effect.runPromise(openMemory(options));
  stores.push(store);
  return { store, options };
}

beforeAll(async () => {
  directory = await realpath(await mkdtemp(join(tmpdir(), "teamagent-provenance-tests-")));
  workspace = join(directory, "workspace");
  temporary = join(directory, "temporary");
  worker = join(directory, "extractor.mjs");
  await mkdir(workspace);
  await mkdir(temporary);
  await mkdir(join(directory, "state"));
  await runProcess(
    defaultImportPython(),
    ["-I", "-B", join(import.meta.dir, "import-fixtures.py"), workspace],
    {
      signal: AbortSignal.timeout(30_000),
      bytes: 1_048_576,
    },
  );
  await writeFile(
    worker,
    `import { writeFile } from "node:fs/promises";
import { join } from "node:path";
const [input, output] = process.argv.slice(2);
if (input === "--version") process.stdout.write("fixture 1.0.0\\n");
else await writeFile(join(output, "document.md"), "# External PDF evidence\\n");
`,
  );
  await writeFile(
    join(workspace, "page.html"),
    "<html><body><h1>Builtin HTML evidence</h1></body></html>",
  );
  const mixed = join(workspace, "mixed");
  await mkdir(mixed);
  await copyFile(join(workspace, "sample.pdf"), join(mixed, "sample.pdf"));
  await copyFile(join(workspace, "sample.docx"), join(mixed, "sample.docx"));
});

afterAll(async () => {
  for (const store of stores) await Effect.runPromise(store.close());
  await assertTemporaryFixture(directory);
  await rm(directory, { recursive: true, force: true });
});

describe("source extraction provenance", () => {
  test("normalizes plain and external Markdown derivatives without altering source bytes", async () => {
    const text = "\uFEFFFirst\r\nSecond\rThird\n";
    await writeFile(join(workspace, "line-endings.txt"), text);
    const plain = captured(
      await Effect.runPromise(createSourceCapture()(request("line-endings.txt"))),
    );
    const original = plain.files.find((file) => file.role === "original");
    const derivative = plain.files.find((file) => file.role === "markdown");
    if (original === undefined || derivative === undefined)
      throw new Error("Missing text representation.");
    expect(new TextDecoder("utf-8", { ignoreBOM: true }).decode(original.bytes)).toBe(text);
    expect(new TextDecoder("utf-8", { ignoreBOM: true }).decode(derivative.bytes)).toBe(
      "\uFEFFFirst\nSecond\nThird\n",
    );
    expect(plain.provenance.extraction?.parsers).toEqual(["teamagent-import/text/2"]);
    const externalWorker = join(directory, "line-endings-extractor.mjs");
    await writeFile(externalWorker, 'process.stdout.write("# External\\r\\nSecond\\rThird\\n");\n');
    const external = captured(
      await Effect.runPromise(
        createSourceCapture({
          extractor: profile({
            args: [externalWorker, "{input}"],
            outputMode: "stdout",
          }),
        })(request("sample.pdf")),
      ),
    );
    const markdown = external.files.find((file) => file.role === "markdown");
    if (markdown === undefined) throw new Error("Missing external Markdown.");
    expect(new TextDecoder().decode(markdown.bytes)).toBe("# External\nSecond\nThird\n");
    expect(external.provenance.extraction?.policy).toMatch(/^teamagent-routing\/2;/);
  });

  test("accepts legacy metadata and rejects excessive, duplicate, unsorted or unknown parser details", () => {
    expect(Schema.is(ProvenanceSchema)(legacyProvenance)).toBe(true);
    for (const extraction of [
      { policy: "policy", parsers: ["duplicate", "duplicate"] },
      { policy: "policy", parsers: ["z", "a"] },
      { policy: "policy", parsers: Array.from({ length: 9 }, (_, index) => String(index)) },
      { policy: "policy", parsers: ["x".repeat(257)] },
      { policy: "policy", parsers: [], secret: "not-a-supported-field" },
    ]) {
      expect(() =>
        Schema.decodeUnknownSync(ProvenanceSchema)(
          { ...legacyProvenance, extraction },
          { onExcessProperty: "error" },
        ),
      ).toThrow();
    }
  });

  test("records real builtin DOCX and HTML parsers under a PDF-only external policy", async () => {
    const selected = profile({ command: join(directory, "must-not-execute.exe") });
    const capture = createSourceCapture({ extractor: selected });
    for (const [name, evidence] of [
      ["sample.docx", "Document alpha"],
      ["page.html", "Builtin HTML evidence"],
    ]) {
      if (name === undefined || evidence === undefined) throw new Error("Invalid fixture");
      const result = captured(await Effect.runPromise(capture(request(name))));
      expect(result.provenance.extraction?.parsers).toEqual([parserVersion]);
      expect(result.provenance.parserVersion).toMatch(/^teamagent-capture\/1;[a-f0-9]{64}$/);
      expect(result.provenance.extraction?.policy).toMatch(/^teamagent-routing\/2;[a-f0-9]{64}$/);
      const text = result.files
        .filter((file) => file.role === "markdown")
        .map((file) => new TextDecoder().decode(file.bytes))
        .join("\n");
      expect(text).toContain(evidence);
      expect(result.provenance.warnings).toEqual([]);
    }
    const failed = captured(
      await Effect.runPromise(
        createSourceCapture({ extractor: selected, python: join(directory, "missing-python.exe") })(
          request("sample.docx"),
        ),
      ),
    );
    expect(failed.provenance.extraction?.parsers).toEqual([]);
    expect(failed.files).toHaveLength(1);
  });

  test("records both actual parsers for a mixed PDF and DOCX folder", async () => {
    const selected = profile();
    const result = captured(
      await Effect.runPromise(createSourceCapture({ extractor: selected })(request("mixed"))),
    );
    expect(result.provenance.extraction?.parsers).toEqual(
      [parserVersion, extractorProfileIdentity(selected)].sort(),
    );
    const text = result.files
      .filter((file) => file.role === "markdown")
      .map((file) => new TextDecoder().decode(file.bytes))
      .join("\n");
    expect(text).toContain("External PDF evidence");
    expect(text).toContain("Document alpha");
    expect(result.provenance.warnings).toEqual([]);
  });

  test("sync keeps identical output and policy stable but versions changed options with the same bytes", async () => {
    let selected = profile();
    const { store } = await memory("option-state", (input) =>
      createSourceCapture({ extractor: selected })(input),
    );
    const first = await Effect.runPromise(store.get({ locator: "sample.pdf" }));
    const same = await Effect.runPromise(store.sync(first.source.id));
    expect(same.status).toBe("unchanged");
    expect(same.version.id).toBe(first.version.id);
    selected = profile({ env: { EXTRACTOR_OPTION: "different-option-same-output" } });
    const next = await Effect.runPromise(store.sync(first.source.id));
    expect(next.status).toBe("updated");
    expect(next.version.files).toEqual(first.version.files);
    expect(next.version.provenance.extraction?.policy).not.toBe(
      first.version.provenance.extraction?.policy,
    );
    expect(next.version.provenance.extraction?.parsers).toEqual([
      extractorProfileIdentity(selected),
    ]);
    expect(
      (await Effect.runPromise(store.read(first.source.id, undefined, first.version.id))).version
        .contentHash,
    ).toBe(first.version.contentHash);
  });

  test("versions actual-parser metadata and rejects a false unchanged response while allowing validator updates", async () => {
    let result = fixtureCapture(detailedProvenance);
    const { store } = await memory("unchanged-state", () => Effect.succeed(result));
    const first = await Effect.runPromise(store.get({ locator: "fixed.txt" }));
    for (const changed of [
      { ...detailedProvenance, parserVersion: "changed-parser/2" },
      {
        ...detailedProvenance,
        extraction: { policy: "changed-policy/2", parsers: ["fixture-parser/1"] },
      },
      {
        ...detailedProvenance,
        extraction: { policy: "fixture-policy/1", parsers: ["fixture-parser/2"] },
      },
    ]) {
      result = { status: "unchanged", provenance: changed };
      await assert.rejects(
        Effect.runPromise(store.sync(first.source.id)),
        (error: unknown) => error instanceof MemoryError && error.code === "integrity",
      );
      expect((await Effect.runPromise(store.show(first.source.id))).source).toEqual(first.source);
    }
    result = { status: "unchanged", provenance: { ...detailedProvenance, etag: "new-validator" } };
    const refreshed = await Effect.runPromise(store.sync(first.source.id));
    expect(refreshed.version.id).toBe(first.version.id);
    expect(refreshed.source.lastProvenance.etag).toBe("new-validator");
    result = fixtureCapture({
      ...detailedProvenance,
      extraction: { policy: "fixture-policy/1", parsers: ["fixture-parser/2"] },
    });
    const updated = await Effect.runPromise(store.sync(first.source.id));
    expect(updated.status).toBe("updated");
    expect(updated.version.provenance.parserVersion).toBe(first.version.provenance.parserVersion);
    expect(updated.version.files).toEqual(first.version.files);
  });

  test("preserves legacy manifest hashes and detects tampering with new extraction metadata", async () => {
    let result = fixtureCapture(legacyProvenance);
    const { store, options } = await memory("integrity-state", () => Effect.succeed(result));
    const first = await Effect.runPromise(store.get({ locator: "fixed.txt" }));
    const legacyHash = digest(
      JSON.stringify({
        files: first.version.files,
        parserVersion: legacyProvenance.parserVersion,
        repositoryCommit: null,
      }),
    );
    expect(first.version.contentHash).toBe(legacyHash);
    result = fixtureCapture(detailedProvenance);
    const next = await Effect.runPromise(store.sync(first.source.id));
    expect(next.status).toBe("updated");
    await Effect.runPromise(store.close());
    const database = new Database(join(options.dataDirectory, "memory", "memory.sqlite"));
    try {
      database.query("UPDATE versions SET value=? WHERE id=?").run(
        JSON.stringify({
          ...next.version,
          provenance: {
            ...next.version.provenance,
            extraction: { policy: "tampered-policy", parsers: ["fixture-parser/1"] },
          },
        }),
        next.version.id,
      );
    } finally {
      database.close();
    }
    const reopened = await Effect.runPromise(openMemory(options));
    stores.push(reopened);
    expect(
      (await Effect.runPromise(reopened.read(first.source.id, undefined, first.version.id))).version
        .contentHash,
    ).toBe(legacyHash);
    await assert.rejects(
      Effect.runPromise(reopened.read(first.source.id)),
      (error: unknown) => error instanceof MemoryError && error.code === "integrity",
    );
  });

  test("HTTP validators are reused only for a matching precomputed routing policy", async () => {
    const validators: (string | null)[] = [];
    const server = Bun.serve({
      hostname: "127.0.0.1",
      port: 0,
      fetch: (incoming) => {
        const validator = incoming.headers.get("if-none-match");
        validators.push(validator);
        return validator === '"fixed"'
          ? new Response(null, { status: 304, headers: { etag: '"fixed"' } })
          : new Response("Raw source evidence", {
              headers: { etag: '"fixed"', "content-type": "text/plain" },
            });
      },
    });
    try {
      const capture = createSourceCapture({
        allowPrivateNetwork: true,
        extractor: profile(),
        readPreviousFile: async () => new TextEncoder().encode("Raw source evidence"),
      });
      const input = request(new URL("file.txt", server.url).href, { kind: "url", convert: false });
      const first = captured(await Effect.runPromise(capture(input)));
      const prior = previous(first);
      expect(first.provenance.extraction?.parsers).toEqual([]);
      expect((await Effect.runPromise(capture({ ...input, previous: prior }))).status).toBe(
        "unchanged",
      );
      const stale = {
        ...prior,
        provenance: {
          ...prior.provenance,
          extraction: { policy: "previous-builtin-or-handler-version", parsers: [] },
        },
      };
      expect((await Effect.runPromise(capture({ ...input, previous: stale }))).status).toBe(
        "captured",
      );
      const legacy = {
        ...prior,
        provenance: {
          ...legacyProvenance,
          etag: '"fixed"',
          parserVersion: "teamagent-import/raw/1",
        },
      };
      expect((await Effect.runPromise(capture({ ...input, previous: legacy }))).status).toBe(
        "captured",
      );
      expect(validators).toEqual([null, '"fixed"', null, null]);
    } finally {
      await server.stop(true);
    }
  });
});
