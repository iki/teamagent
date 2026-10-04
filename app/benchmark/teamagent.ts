import { mkdir, readFile } from "node:fs/promises";
import { join } from "node:path";
import { cpus, totalmem, release } from "node:os";
import { Effect } from "effect";
import { MemoryError, type SourceCapture } from "@/memory";
import { openMemory } from "../memory/index.ts";
import { CorpusSchema, type SystemResult } from "./contracts.ts";
import { cache, directoryBytes, readJson, repository, sha256, writeJson } from "./io.ts";

export async function runTeamagent(label: string, corpusPath?: string): Promise<void> {
  if (!/^[a-z][a-z0-9-]{0,50}$/.test(label)) throw new Error("Invalid benchmark run label");
  const corpus = await readJson(corpusPath ?? join(cache, "corpus.json"), CorpusSchema);
  const directory = join(cache, label);
  await mkdir(directory, { recursive: false });
  const groups = new Map<string, typeof corpus.passages>();
  for (let index = 0; index < corpus.passages.length; index += 100)
    groups.set(`benchmark:batch:${index / 100}`, corpus.passages.slice(index, index + 100));
  const capture: SourceCapture = (request) => {
    const passages = groups.get(request.locator);
    if (passages === undefined)
      return Effect.fail(new MemoryError({ code: "invalid", message: "Unknown benchmark batch" }));
    return Effect.succeed({
      status: "captured",
      kind: "folder",
      locator: request.locator,
      files: passages.map((passage) => ({
        path: `${passage.id}.txt`,
        role: "original",
        mediaType: "text/plain",
        bytes: new TextEncoder().encode(passage.text),
        origin: `benchmark://${passage.sourceId}/${passage.id}`,
      })),
      provenance: {
        etag: null,
        lastModified: null,
        repositoryCommit: null,
        parserVersion: "benchmark-neutral-passages-v1",
        warnings: [],
      },
    });
  };
  const open = () =>
    Effect.runPromise(
      openMemory({
        dataDirectory: directory,
        workspaceRoot: repository,
        workspaceId: "benchmark",
        capture,
      }),
    );
  const setupStarted = performance.now();
  let memory = await open();
  const setupMs = performance.now() - setupStarted;
  const start = performance.now();
  for (const locator of groups.keys())
    await Effect.runPromise(memory.get({ locator, kind: "folder", convert: false }));
  const ingestMs = performance.now() - start;
  await Effect.runPromise(memory.close());
  memory = await open();
  const queries: { id: string; runs: SystemResult["queries"][number]["runs"][number][] }[] =
    corpus.cases.map((task) => ({ id: task.id, runs: [] }));
  try {
    for (let index = 0; index < corpus.cases.length; index += 1) {
      for (let repeat = 0; repeat < 4; repeat += 1) {
        const task = corpus.cases[index];
        const query = queries[index];
        if (task === undefined || query === undefined) throw new Error("Case/result mismatch");
        const started = performance.now();
        try {
          const hits = await Effect.runPromise(memory.search({ query: task.query, limit: 10 }));
          query.runs.push({
            elapsedMs: performance.now() - started,
            hits: hits.map((hit, rank) => ({
              id: hit.path.replace(/\.txt$/, ""),
              score: 1 / (rank + 1),
            })),
          });
        } catch (error) {
          query.runs.push({
            elapsedMs: performance.now() - started,
            hits: [],
            error: error instanceof MemoryError ? error.code : "unexpected",
          });
        }
      }
    }
  } finally {
    await Effect.runPromise(memory.close());
  }
  await writeJson(join(directory, "result.json"), {
    systems: [
      {
        system: label,
        mode: "public MemoryApi; SQLite FTS5; common neutral passages",
        ingestMs,
        setupMs,
        queries,
      },
    ],
    provenance: {
      at: new Date().toISOString(),
      bun: Bun.version,
      platform: process.platform,
      release: release(),
      cpu: cpus()[0]?.model,
      cpuThreads: cpus().length,
      memoryBytes: totalmem(),
      corpusHash: sha256(JSON.stringify(corpus)),
      memoryCodeHash: sha256(await readFile(join(repository, "app/memory/index.ts"))),
      retrievalCodeHash: sha256(await readFile(join(repository, "lib/memory/retrieval.ts"))),
      lockfileHash: sha256(await readFile(join(repository, "aube-lock.yaml"))),
      queryOrder: "declared order; initial then three immediate warm repetitions per query",
      clock: "performance.now; serial wall milliseconds; OS cache not evicted",
      storageBytes: await directoryBytes(directory),
      rssAfterBytes: process.memoryUsage.rss(),
      peakRssBytes: process.resourceUsage().maxRSS * 1024,
    },
  });
  process.stdout.write(
    JSON.stringify({
      system: label,
      ingestMs,
      queries: queries.length,
      output: join(directory, "result.json"),
    }) + "\n",
  );
}
