import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { mkdir, mkdtemp, readFile, readdir, realpath, rm, writeFile } from "node:fs/promises";
import { cpus, release, tmpdir, totalmem } from "node:os";
import { dirname, isAbsolute, join, relative, resolve, sep } from "node:path";
import { cli } from "cleye";
import { Effect } from "effect";
import { type MemoryApi, type MemoryError, type SourceVersion } from "@/memory";
import { importDoctor } from "../imports/documents.ts";
import { openMemoryHost } from "../runtime/memory.ts";
import { CodeManifestSchema } from "./contracts.ts";
import { cache, directoryBytes, readJson, repository, sha256, writeJson } from "./io.ts";

interface Check {
  readonly name: string;
  readonly passed: boolean;
  readonly detail: string;
}
interface Timing {
  readonly name: string;
  readonly elapsedMs: number;
  readonly phase: "initial" | "warm" | "lifecycle";
  readonly completed: boolean;
}
interface RepositoryReceipt {
  readonly repository: string;
  readonly commit: string;
  readonly sourceId: string;
  readonly versionId: string;
  readonly contentHash: string;
  readonly expectedFiles: number;
  readonly originals: number;
  readonly markdown: number;
  readonly bytes: number;
  readonly parserVersion: string;
  readonly warnings: readonly string[];
  readonly evidenceSpans: number;
  readonly preservedEvidenceSpans: number;
}
type Outcome<A> =
  | { readonly ok: true; readonly value: A }
  | { readonly ok: false; readonly error: MemoryError };

function contained(root: string, target: string): boolean {
  const part = relative(root, target);
  return part !== "" && !isAbsolute(part) && part !== ".." && !part.startsWith(`..${sep}`);
}

function sourcePath(root: string, path: string): string {
  if (
    path.length === 0 ||
    /[\\:\p{Cc}]/u.test(path) ||
    path.split("/").some((part) => part === "" || part === "." || part === "..")
  )
    throw new Error("Invalid committed source path in benchmark manifest");
  const target = resolve(root, path);
  if (!contained(root, target)) throw new Error("Committed source path escaped its staging root");
  return target;
}

const options = cli({
  name: "memory-lifecycle-benchmark",
  strictFlags: true,
  flags: {
    output: {
      type: String,
      default: join(cache, "lifecycle-baseline.json"),
      description: "New immutable result JSON path",
    },
    python: { type: String, description: "Explicit configured document converter interpreter" },
  },
});
if (options._.length !== 0) throw new Error("This benchmark accepts flags only");

const checks: Check[] = [];
const timings: Timing[] = [];
const receipts: RepositoryReceipt[] = [];
const startedAt = new Date().toISOString();
const benchmarkSignal = AbortSignal.timeout(900_000);
const temporaryParent = await realpath(tmpdir());
const temporary = await realpath(
  await mkdtemp(join(temporaryParent, "teamagent-memory-benchmark-")),
);
const workspace = join(temporary, "workspace");
const otherWorkspace = join(temporary, "other-workspace");
const data = join(temporary, "private-state");
const hosts: MemoryApi[] = [];
let failure: string | null = null;
let stateBytes = 0;
let details: Readonly<Record<string, unknown>> = {};

function check(name: string, passed: boolean, detail: string): void {
  checks.push({ name, passed, detail });
}

async function timed<A>(
  name: string,
  phase: Timing["phase"],
  operation: () => Promise<A>,
): Promise<A> {
  const start = performance.now();
  let completed = false;
  try {
    const result = await operation();
    completed = true;
    return result;
  } finally {
    timings.push({ name, phase, elapsedMs: performance.now() - start, completed });
  }
}

function run<A>(operation: Effect.Effect<A, MemoryError>): Promise<A> {
  return Effect.runPromise(operation, { signal: benchmarkSignal });
}

function observe<A>(operation: Effect.Effect<A, MemoryError>): Promise<Outcome<A>> {
  return run(
    operation.pipe(
      Effect.match({
        onFailure: (error): Outcome<A> => ({ ok: false, error }),
        onSuccess: (value): Outcome<A> => ({ ok: true, value }),
      }),
    ),
  );
}

async function open(root: string, allowRoot: readonly string[] = []): Promise<MemoryApi> {
  const memory = await run(
    openMemoryHost({
      root,
      data,
      mcp: true,
      allowRoot,
      allowPrivateNetwork: true,
      ...(options.flags.python === undefined ? {} : { python: options.flags.python }),
    }),
  );
  hosts.push(memory);
  return memory;
}

async function verifyVersion(memory: MemoryApi, sourceId: string, version: SourceVersion) {
  const contents = new Map<string, Uint8Array>();
  for (const file of version.files) {
    const read = await run(memory.read(sourceId, file.path, version.id));
    assert.equal(read.version.id, version.id);
    assert.equal(read.source.id, sourceId);
    assert.equal(read.bytes.byteLength, file.size);
    assert.equal(sha256(read.bytes), file.sha256);
    contents.set(file.path, read.bytes);
  }
  return contents;
}

try {
  await Promise.all([mkdir(workspace), mkdir(otherWorkspace)]);
  const manifest = await readJson(
    join(repository, "app/benchmark/cases-code.json"),
    CodeManifestSchema,
  );
  const manifestBytes = await readFile(join(repository, "app/benchmark/cases-code.json"));
  const doctor = await Effect.runPromise(
    importDoctor(options.flags.python === undefined ? {} : { python: options.flags.python }),
    { signal: benchmarkSignal },
  );
  check(
    "converter-ready",
    doctor.available,
    "Explicit converter doctor; no dependency installation during measurement",
  );
  assert.ok(doctor.available, "Configured document converter is unavailable");
  const memory = await open(workspace);
  for (const repo of manifest.repos) {
    assert.match(repo.id, /^[a-z][a-z0-9-]{0,80}$/);
    assert.match(repo.commit, /^[a-f0-9]{40,64}$/);
    const staged = join(workspace, repo.id);
    await mkdir(staged);
    await timed(`${repo.id}:stage-committed-bytes`, "initial", async () => {
      for (const file of repo.files) {
        assert.match(file.sha256, /^[a-f0-9]{64}$/);
        assert.ok(file.bytes >= 0 && file.bytes <= 16_777_216);
        const target = sourcePath(staged, file.path);
        const content = execFileSync(
          "git",
          ["-C", repo.root, "show", `${repo.commit}:${file.path}`],
          {
            timeout: 15_000,
            maxBuffer: 16_777_217,
            windowsHide: true,
            stdio: ["ignore", "pipe", "pipe"],
          },
        );
        assert.equal(content.byteLength, file.bytes);
        assert.equal(sha256(content), file.sha256);
        await mkdir(dirname(target), { recursive: true });
        await writeFile(target, content, { flag: "wx" });
      }
    });
    const imported = await timed(`${repo.id}:get-folder-converted`, "initial", () =>
      run(memory.get({ locator: staged, kind: "folder", convert: true })),
    );
    const contents = await verifyVersion(memory, imported.source.id, imported.version);
    const originals = imported.version.files.filter((file) => file.role === "original");
    const markdown = imported.version.files.filter((file) => file.role === "markdown");
    let preservedOriginals = 0;
    const searchable = new Map<string, string>();
    for (const expected of repo.files) {
      const original = originals.find((file) => file.path === `original/${expected.path}`);
      if (original?.sha256 === expected.sha256 && original.size === expected.bytes)
        preservedOriginals += 1;
      const derivative = markdown.find(
        (file) => original !== undefined && file.origin === original.origin,
      );
      const bytes = derivative === undefined ? undefined : contents.get(derivative.path);
      if (bytes !== undefined)
        searchable.set(expected.path, new TextDecoder("utf-8", { fatal: true }).decode(bytes));
    }
    const evidence = manifest.cases
      .filter((entry) => entry.repo === repo.id)
      .flatMap((entry) => entry.evidence);
    const preservedEvidence = evidence.filter((entry) => {
      const text = searchable.get(entry.path);
      return text !== undefined && entry.contains.every((quote) => text.includes(quote));
    });
    check(
      `${repo.id}:exact-original-coverage`,
      preservedOriginals === repo.files.length && originals.length === repo.files.length,
      `${preservedOriginals}/${repo.files.length} original paths, byte lengths and hashes match the pinned commit`,
    );
    check(
      `${repo.id}:searchable-file-coverage`,
      searchable.size === repo.files.length,
      `${searchable.size}/${repo.files.length} files have readable Markdown derivatives`,
    );
    check(
      `${repo.id}:gold-extraction-coverage`,
      preservedEvidence.length === evidence.length,
      `${preservedEvidence.length}/${evidence.length} frozen evidence spans survive extraction; no retrieval results consulted`,
    );
    check(
      `${repo.id}:source-version-scope`,
      imported.status === "created" &&
        imported.version.sourceId === imported.source.id &&
        imported.version.workspaceId === imported.source.workspaceId,
      "Created source and immutable version retain the same source and workspace identities",
    );
    receipts.push({
      repository: repo.id,
      commit: repo.commit,
      sourceId: imported.source.id,
      versionId: imported.version.id,
      contentHash: imported.version.contentHash,
      expectedFiles: repo.files.length,
      originals: originals.length,
      markdown: markdown.length,
      bytes: repo.files.reduce((sum, file) => sum + file.bytes, 0),
      parserVersion: imported.version.provenance.parserVersion,
      warnings: imported.version.provenance.warnings,
      evidenceSpans: evidence.length,
      preservedEvidenceSpans: preservedEvidence.length,
    });
    const unchanged = await timed(`${repo.id}:unchanged-sync`, "warm", () =>
      run(memory.sync(imported.source.id)),
    );
    check(
      `${repo.id}:unchanged-version`,
      unchanged.status === "unchanged" &&
        unchanged.version.id === imported.version.id &&
        unchanged.version.contentHash === imported.version.contentHash,
      "A repeat native folder retrieval does not publish a duplicate version",
    );
  }

  const lifecycleDirectory = join(workspace, "lifecycle-fixture");
  await mkdir(lifecycleDirectory);
  const note = join(lifecycleDirectory, "note.txt");
  const oldMarker = "cobaltriverbeforequartz";
  const newMarker = "cobaltriverafterzircon";
  await writeFile(note, `Lifecycle fixture ${oldMarker}\n`, { flag: "wx" });
  const initial = await timed("fixture:get", "initial", () =>
    run(memory.get({ locator: note, convert: true })),
  );
  const original = initial.version.files.find((file) => file.role === "original");
  assert.ok(original !== undefined);
  const before = await run(memory.search({ query: oldMarker, sourceId: initial.source.id }));
  check(
    "fixture:initial-search",
    before.length > 0,
    "Planted initial marker is searchable before update",
  );
  await writeFile(note, `Lifecycle fixture ${newMarker}\n`);
  const changed = await timed("fixture:changed-sync", "lifecycle", () =>
    run(memory.sync(initial.source.id)),
  );
  check(
    "fixture:changed-version",
    changed.status === "updated" &&
      changed.version.number === initial.version.number + 1 &&
      changed.version.id !== initial.version.id &&
      changed.source.id === initial.source.id,
    "A changed file advances exactly one immutable version under the same source id",
  );
  const historical = await timed("fixture:historical-read", "lifecycle", () =>
    run(memory.read(initial.source.id, original.path, initial.version.id)),
  );
  check(
    "fixture:historical-integrity",
    sha256(historical.bytes) === original.sha256 &&
      new TextDecoder().decode(historical.bytes).includes(oldMarker),
    "Old version bytes and hash remain available after a successful refresh",
  );
  const oldHits = await timed("fixture:old-marker-search", "warm", () =>
    run(memory.search({ query: oldMarker, sourceId: initial.source.id })),
  );
  const newHits = await timed("fixture:new-marker-search", "warm", () =>
    run(memory.search({ query: newMarker, sourceId: initial.source.id })),
  );
  check(
    "fixture:search-freshness",
    oldHits.length === 0 && newHits.length > 0,
    "The current index removes the old marker and includes the replacement",
  );
  check(
    "fixture:search-citation-scope",
    newHits.every(
      (hit) =>
        hit.sourceId === initial.source.id &&
        hit.versionId === changed.version.id &&
        hit.citation.startsWith(
          `memory://${changed.source.workspaceId}/${initial.source.id}/${changed.version.id}/`,
        ),
    ),
    "Search hits and citations identify the current source, immutable version and workspace",
  );
  await verifyVersion(memory, changed.source.id, changed.version);

  const isolated = await open(otherWorkspace);
  const isolatedList = await run(isolated.list());
  const isolatedRead = await observe(isolated.read(initial.source.id, original.path));
  const escaped = await observe(isolated.get({ locator: note, convert: false }));
  check(
    "workspace:isolation",
    isolatedList.total === 0 && !isolatedRead.ok && isolatedRead.error.code === "not_found",
    "A second workspace sharing the database sees neither records nor bytes from the first",
  );
  check(
    "workspace:source-root-enforced",
    !escaped.ok,
    "MCP-bound acquisition rejects a file outside its explicit root",
  );

  await timed("fixture:delete", "lifecycle", () => run(memory.delete(initial.source.id)));
  const deletedShow = await observe(memory.show(initial.source.id));
  const deletedHistorical = await observe(
    memory.read(initial.source.id, original.path, initial.version.id),
  );
  const deletedHits = await run(memory.search({ query: newMarker }));
  check(
    "fixture:deletion-visible",
    !deletedShow.ok &&
      deletedShow.error.code === "not_found" &&
      !deletedHistorical.ok &&
      deletedHistorical.error.code === "not_found" &&
      deletedHits.length === 0,
    "Deletion removes current/history API visibility and search; physical orphan-blob garbage collection is not claimed",
  );

  const initialCount = (await run(memory.list())).total;
  const received = Promise.withResolvers<void>();
  let requestReceived = false;
  const server = Bun.serve({
    hostname: "127.0.0.1",
    port: 0,
    fetch: () => {
      requestReceived = true;
      received.resolve();
      return new Response(
        new ReadableStream<Uint8Array>({
          start(controller) {
            controller.enqueue(new TextEncoder().encode("incomplete fixture"));
          },
        }),
      );
    },
  });
  const cancellation = new AbortController();
  const cancellationTimer = setTimeout(() => cancellation.abort(), 10_000);
  try {
    const cancelled = Effect.runPromise(
      memory.get({ locator: `${server.url.href}pending.txt`, kind: "url", convert: false }),
      { signal: AbortSignal.any([benchmarkSignal, cancellation.signal]) },
    ).then(
      () => false,
      () => true,
    );
    await Promise.race([received.promise, cancelled.then(() => undefined)]);
    const interrupted = await timed("fixture:cancellation-cleanup", "lifecycle", async () => {
      cancellation.abort();
      return cancelled;
    });
    const leftovers = await readdir(join(data, "memory", "temporary"));
    check(
      "fixture:cancellation-atomicity",
      requestReceived &&
        interrupted &&
        (await run(memory.list())).total === initialCount &&
        leftovers.length === 0,
      "Cancellation leaves no published source and awaits private temporary-file cleanup",
    );
  } finally {
    clearTimeout(cancellationTimer);
    cancellation.abort();
    await server.stop(true);
  }

  const fullRepository = manifest.repos.find((repo) => repo.id === "pi");
  assert.ok(fullRepository !== undefined);
  const fullRepositoryHead = execFileSync("git", ["-C", fullRepository.root, "rev-parse", "HEAD"], {
    encoding: "utf8",
    timeout: 15_000,
    maxBuffer: 1024,
    windowsHide: true,
  }).trim();
  assert.equal(
    fullRepositoryHead,
    fullRepository.commit,
    "Whole-repository scale trial requires the pinned HEAD",
  );
  const fullRepoHost = await open(workspace, [fullRepository.root]);
  const fullResult = await timed("pi:whole-repository-capacity", "lifecycle", () =>
    observe(fullRepoHost.get({ locator: fullRepository.root, kind: "git", convert: false })),
  );
  check(
    "pi:whole-repository-explicit-rejection",
    !fullResult.ok && (await run(memory.list())).total === initialCount,
    fullResult.ok
      ? `Whole repository imported ${fullResult.value.version.files.length} files; inspect changed scale assumptions`
      : `Actual committed repository rejected atomically: ${fullResult.error.code}: ${fullResult.error.message}`,
  );
  stateBytes = await directoryBytes(data);
  details = {
    runtime: {
      bun: Bun.version,
      platform: process.platform,
      arch: process.arch,
      osRelease: release(),
      cpu: cpus()[0]?.model ?? "unknown",
      logicalCpus: cpus().length,
      totalMemoryBytes: totalmem(),
    },
    manifestSha256: sha256(manifestBytes),
    converter: doctor,
    stateBytes,
    limitations: [
      "Serial single-machine lifecycle samples; no latency percentile or production SLA claim",
      "Native source acquisition is distinct from the equal-passage retrieval comparison",
      "Folder snapshots retain exact pinned commit bytes; folder source provenance is supplemented by the benchmark manifest",
      "Whole-repository rejection is reported as a current capacity limitation, not complete ingestion",
    ],
  };
} catch (error) {
  failure = error instanceof Error ? error.message : "Unknown benchmark failure";
} finally {
  for (const [index, host] of hosts.toReversed().entries()) {
    try {
      await Effect.runPromise(host.close());
      check(`cleanup:host-${index}`, true, "Memory host closed after pending lifecycle work");
    } catch {
      check(`cleanup:host-${index}`, false, "Memory host failed to close");
    }
  }
  try {
    const canonical = await realpath(temporary);
    if (
      canonical !== temporary ||
      !contained(temporaryParent, canonical) ||
      !relative(temporaryParent, canonical).startsWith("teamagent-memory-benchmark-")
    ) {
      check(
        "cleanup:temporary-fixtures",
        false,
        "Refused cleanup because the canonical benchmark directory changed or escaped its parent",
      );
    } else {
      await rm(canonical, { recursive: true, force: true });
      check(
        "cleanup:temporary-fixtures",
        true,
        "Removed only the canonically contained benchmark temporary directory",
      );
    }
  } catch {
    check(
      "cleanup:temporary-fixtures",
      false,
      "Could not safely remove the benchmark temporary directory",
    );
  }
}
await writeJson(resolve(options.flags.output), {
  format: "teamagent-memory-lifecycle-benchmark-v1",
  startedAt,
  completedAt: new Date().toISOString(),
  ...details,
  selectedRepositories: receipts,
  checks,
  timings,
  failure,
  success: failure === null && checks.every((entry) => entry.passed),
});
process.stdout.write(
  `${JSON.stringify({ output: resolve(options.flags.output), checks: checks.length, failed: checks.filter((entry) => !entry.passed).length, failure })}\n`,
);
if (failure !== null || checks.some((entry) => !entry.passed)) process.exitCode = 1;
