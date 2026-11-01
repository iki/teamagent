import { createHash } from "node:crypto";
import { mkdir, readFile, readdir, realpath, stat, writeFile } from "node:fs/promises";
import { dirname, join, relative, resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { Predicate, Schema } from "effect";

const expectedCommit = "80d4e823adebbe1e758b558522e3da20312a66cc";
const root = resolve(dirname(fileURLToPath(import.meta.url)), "../../..");
const reference = resolve(root, "../ai-agents-mem/context-mode");
const inputSchema = Schema.Struct({
  passages: Schema.Array(Schema.Struct({ id: Schema.NonEmptyString, text: Schema.NonEmptyString })),
  queries: Schema.Array(Schema.Struct({ id: Schema.NonEmptyString, query: Schema.NonEmptyString })),
  outputDirectory: Schema.NonEmptyString,
  repeat: Schema.Int,
});
const hitSchema = Schema.Array(Schema.Struct({ source: Schema.String, rank: Schema.Number }));
interface ContentStore {
  index(options: { content: string; source: string }): unknown;
  searchWithFallback(query: string, limit: number): unknown;
  getStats(): unknown;
  close(): void;
}
interface ContentStoreConstructor {
  new (path: string): ContentStore;
}
// Trusted upstream API, pinned below by commit and clean working tree. The callable
// shape is the audited src/store.ts API; every dynamic search result is decoded.
const moduleSchema = Schema.Struct({
  ContentStore: Schema.declare<ContentStoreConstructor>((value): value is ContentStoreConstructor =>
    Predicate.isFunction(value),
  ),
});

async function git(args: readonly string[]): Promise<string> {
  const child = Bun.spawn(
    ["git", "-c", `safe.directory=${reference.replaceAll("\\", "/")}`, "-C", reference, ...args],
    { stdout: "pipe", stderr: "pipe", windowsHide: true },
  );
  const [out, error, exit] = await Promise.all([
    new Response(child.stdout).text(),
    new Response(child.stderr).text(),
    child.exited,
  ]);
  if (exit !== 0) throw new Error(`Reference Git inspection failed: ${error.slice(0, 1000)}`);
  return out.trim();
}

async function main(): Promise<void> {
  const inputPath = process.argv[2];
  const outputPath = process.argv[3];
  if (!inputPath || !outputPath || process.argv.length !== 4)
    throw new Error("Expected input.json output.json");
  const raw = await readFile(inputPath);
  if (raw.byteLength > 64 * 1024 * 1024) throw new Error("Benchmark input exceeds 64 MiB");
  const parsed: unknown = JSON.parse(raw.toString("utf8"));
  const input = Schema.decodeUnknownSync(inputSchema)(parsed);
  if (
    input.repeat !== 3 ||
    input.passages.length > 20000 ||
    input.queries.length > 1000 ||
    input.passages.some((p) => p.text.length > 4000)
  )
    throw new Error("Benchmark input outside bounds");
  const ids = new Set(input.passages.map((p) => p.id));
  if (ids.size !== input.passages.length) throw new Error("Duplicate passage ID");
  const workspace = await realpath(root);
  const destination = await realpath(input.outputDirectory);
  const local = relative(workspace, destination);
  if (local.startsWith("..") || resolve(workspace, local) !== destination)
    throw new Error("Output must be inside workspace");
  const [commit, dirty] = await Promise.all([
    git(["rev-parse", "HEAD"]),
    git(["status", "--porcelain"]),
  ]);
  if (commit !== expectedCommit || dirty !== "")
    throw new Error("Reference source changed; review and repin before benchmarking");
  const setupStarted = performance.now();
  const imported: unknown = await import(pathToFileURL(join(reference, "src/store.ts")).href);
  const api = Schema.decodeUnknownSync(moduleSchema)(imported);
  const directory = join(destination, "context-mode");
  await mkdir(directory);
  const store = new api.ContentStore(join(directory, "memory.sqlite"));
  const setupMs = performance.now() - setupStarted;
  let closed = false;
  try {
    const start = performance.now();
    for (const passage of input.passages)
      store.index({ content: passage.text, source: passage.id });
    const ingestMs = performance.now() - start;
    const queries = [];
    for (const query of input.queries) {
      const runs = [];
      for (let repetition = 0; repetition <= input.repeat; repetition++) {
        const began = performance.now();
        try {
          const hits = Schema.decodeUnknownSync(hitSchema)(
            store.searchWithFallback(query.query, 10),
          );
          const selected = new Set<string>();
          const result = [];
          for (const hit of hits) {
            if (!ids.has(hit.source)) throw new Error("Upstream returned unknown passage ID");
            if (!Number.isFinite(hit.rank)) throw new Error("Upstream returned non-finite score");
            if (!selected.has(hit.source)) {
              selected.add(hit.source);
              result.push({ id: hit.source, score: hit.rank });
            }
          }
          runs.push({ elapsedMs: performance.now() - began, hits: result });
        } catch (error) {
          runs.push({
            elapsedMs: performance.now() - began,
            hits: [],
            error: error instanceof Error ? error.message : "Unknown reference error",
          });
        }
      }
      queries.push({ id: query.id, runs });
    }
    store.close();
    closed = true;
    const files = await Promise.all(
      (await readdir(directory)).map(async (name) => ({
        name,
        bytes: (await stat(join(directory, name))).size,
      })),
    );
    await writeFile(
      outputPath,
      JSON.stringify(
        {
          inputSha256: createHash("sha256").update(raw).digest("hex"),
          systems: [
            {
              system: "context-mode",
              mode: "upstream ContentStore.searchWithFallback: porter/trigram RRF + proximity + fuzzy fallback",
              ingestMs,
              setupMs,
              queries,
            },
          ],
          stats: {
            commit,
            license: "Elastic-2.0",
            runtime: Bun.version,
            passages: input.passages.length,
            warmRepetitions: input.repeat,
            initialPassIsNotOSCold: true,
            nativeChunkingWithinCommonPassage: true,
            peakRssBytes: process.resourceUsage().maxRSS * 1024,
            peakRssScope: "complete Bun worker process, including ingestion and all query runs",
            diskBytes: files.reduce((total, file) => total + file.bytes, 0),
            diskFiles: files,
            diskMeasuredAfterClose: true,
          },
        },
        null,
        2,
      ) + "\n",
      { flag: "wx" },
    );
  } finally {
    if (!closed) store.close();
  }
}

await main();
