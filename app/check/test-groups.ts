import { spawnOwned } from "./owned-process.ts";
import { createTemporaryWorkspace, temporaryParent } from "./temporary-workspace.ts";
import { mkdir, readdir } from "node:fs/promises";
import { availableParallelism, freemem } from "node:os";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { Schema } from "effect";
import { verificationLocaleEnvironment, verificationWriteVariable } from "./verification-policy.ts";

export function unitEnvironment(base: NodeJS.ProcessEnv, pycache: string): NodeJS.ProcessEnv {
  const env = verificationLocaleEnvironment(base);
  Reflect.deleteProperty(env, verificationWriteVariable);
  for (const name of Object.keys(env))
    if (
      /^GIT_(?:DIR|WORK_TREE|INDEX_FILE|COMMON_DIR|OBJECT_DIRECTORY|ALTERNATE_OBJECT_DIRECTORIES|NAMESPACE|PREFIX|CONFIG(?:_.*)?|QUARANTINE_PATH|INTERNAL_SUPER_PREFIX|IMPLICIT_WORK_TREE|SHALLOW_FILE|GRAFT_FILE|REPLACE_REF_BASE)$/u.test(
        name,
      )
    )
      Reflect.deleteProperty(env, name);
  return {
    ...env,
    GIT_CONFIG_NOSYSTEM: "1",
    GIT_CONFIG_GLOBAL: process.platform === "win32" ? "NUL" : "/dev/null",
    GIT_OPTIONAL_LOCKS: "0",
    PYTHONDONTWRITEBYTECODE: "1",
    PYTHONPYCACHEPREFIX: pycache,
  };
}

export interface TestBatch {
  readonly name: string;
  readonly files: readonly string[];
}
export function testBatches(
  files: readonly string[],
  isolateAnalysis = true,
): readonly TestBatch[] {
  // The cache suite uses private fixtures and restores its process-local mutations.
  // Queue it after the other audited suites only in the measured three-worker mode.
  const isolated = isolateAnalysis
    ? [
        "test/research-git.test.ts",
        "test/workflow.test.ts",
        "test/analysis-sync.test.ts",
        "test/verification-cache.test.ts",
      ]
    : ["test/research-git.test.ts", "test/workflow.test.ts"];
  return [
    { name: "remaining", files: files.filter((file) => !isolated.includes(file)) },
    ...isolated.map((file) => ({ name: file, files: files.filter((item) => item === file) })),
  ].filter((batch) => batch.files.length > 0);
}
/** Conservative admission policy; preliminary timings do not establish an optimal cap. */
export function testConcurrency(resources: {
  readonly cpus: number;
  readonly memoryBytes: number;
}): number {
  if (
    Number.isFinite(resources.memoryBytes) &&
    resources.memoryBytes >= 0 &&
    resources.memoryBytes < 1024 ** 3
  )
    return 0;
  if (
    !Number.isInteger(resources.cpus) ||
    resources.cpus < 2 ||
    !Number.isFinite(resources.memoryBytes) ||
    resources.memoryBytes < 2 * 1024 ** 3
  )
    return 1;
  return resources.cpus >= 4 && resources.memoryBytes >= 4 * 1024 ** 3 ? 3 : 2;
}
export async function scheduleTestBatches(
  files: readonly string[],
  concurrency: number,
  run: (batch: TestBatch) => Promise<void>,
  resources?: () => { readonly cpus: number; readonly memoryBytes: number },
): Promise<void> {
  if (!Number.isInteger(concurrency) || concurrency < 1 || concurrency > 3)
    throw new Error("Test concurrency must be between one and three");
  const batches =
    concurrency === 1 ? [{ name: "all", files }] : [...testBatches(files, concurrency === 3)];
  const failures: unknown[] = [];
  const active = new Set<Promise<void>>();
  let incompleteFiles = 0;
  while (batches.length || active.size) {
    let admitted = concurrency;
    if (resources) {
      try {
        admitted = Math.min(concurrency, testConcurrency(resources()));
      } catch {
        admitted = 1;
      }
    }
    if (batches.length && active.size < admitted) {
      const batch = batches.shift();
      if (!batch) throw new Error("Test batch inventory changed unexpectedly");
      const work = (async () => {
        try {
          await run(batch);
        } catch (error) {
          failures.push(error);
        }
      })();
      active.add(work);
      void work.then(() => {
        active.delete(work);
      });
      continue;
    }
    if (active.size) {
      await Promise.race(active);
      continue;
    }
    incompleteFiles = batches.reduce((count, batch) => count + batch.files.length, 0);
    break;
  }
  if (incompleteFiles)
    throw new Error(
      `${incompleteFiles} test file(s) not run: insufficient available memory (at least 1 GiB required); ${failures.length} batch(es) failed; running children were joined and verification remains incomplete`,
    );
  if (failures.length)
    throw new Error(`${failures.length} test batch(es) failed; every scheduled child was joined`);
}

/** Preserve native line boundaries when CRLF or lone CR spans output chunks. */
export function normalizeOutputChunk(
  text: string,
  pendingCR: boolean,
  final = false,
): { text: string; pendingCR: boolean } {
  const combined = (pendingCR ? "\r" : "") + text;
  const trailingCR = !final && combined.endsWith("\r");
  return {
    text: (trailingCR ? combined.slice(0, -1) : combined).replace(/\r\n?/gu, "\n"),
    pendingCR: trailingCR,
  };
}

async function boundedTests(
  root: string,
  files: readonly string[],
  signal: AbortSignal,
  env: NodeJS.ProcessEnv,
  unconfirmed: () => void,
): Promise<void> {
  signal.throwIfAborted();
  const owned = await spawnOwned(
    process.execPath,
    ["test", "--timeout", "120000", ...files.map((file) => `./${file}`)],
    { cwd: root, env, stdio: "pipe", signal },
  );
  const { child } = owned;
  const stdoutStream = child.stdout,
    stderrStream = child.stderr;
  if (!stdoutStream || !stderrStream || !child.stdin) {
    await owned.stop("Missing unit streams");
    if ((await owned.closed).termination !== "closed") unconfirmed();
    throw new Error("Unit streams are unavailable");
  }
  let bytes = 0;
  let problem: Error | undefined;
  let stopping: Promise<void> | undefined;
  const stop = (): void => {
    stopping ??= owned.stop("Unit verification stopped").catch(() => {
      unconfirmed();
      problem ??= new Error("Unit descendant cleanup could not be confirmed");
    });
  };
  const abort = (): void => {
    problem ??= new Error("Complete unit phase exceeded its 240-second deadline or was cancelled");
    stop();
  };
  function outputWriter() {
    const decoder = new TextDecoder("utf-8", { fatal: true });
    let line = "";
    let lineBytes = 0;
    let pendingCR = false;
    const publish = (text: string, final = false): void => {
      const normalized = normalizeOutputChunk(text, pendingCR, final);
      pendingCR = normalized.pendingCR;
      const parts = normalized.text.split("\n");
      for (const [index, part] of parts.entries()) {
        const additional = Buffer.byteLength(part);
        if (additional > 1024 * 1024 - lineBytes)
          throw new Error("Unit child output exceeded its line bound");
        line += part;
        lineBytes += additional;
        if (index !== parts.length - 1) {
          process.stderr.write(line + "\n");
          line = "";
          lineBytes = 0;
        }
      }
      if (final && line) {
        process.stderr.write(line + "\n");
        line = "";
        lineBytes = 0;
      }
    };
    const write = (chunk: unknown): void => {
      if (problem) return;
      try {
        const value = Schema.decodeUnknownSync(Schema.instanceOf(Uint8Array))(chunk);
        bytes += value.byteLength;
        if (bytes > 16 * 1024 ** 2) throw new Error("Unit child output exceeded 16 MiB");
        publish(decoder.decode(value, { stream: true }));
      } catch {
        problem = new Error("Unit child output exceeded its validated boundary");
        stop();
      }
    };
    return { write, finish: () => publish(decoder.decode(), true) };
  }
  const stdout = outputWriter(),
    stderr = outputWriter();
  stdoutStream.on("data", stdout.write);
  stderrStream.on("data", stderr.write);
  child.stdin.on("error", () => {
    problem ??= new Error("Unit input stream failed");
    stop();
  });
  child.on("error", (error) => {
    problem = error;
  });
  signal.addEventListener("abort", abort, { once: true });
  try {
    if (signal.aborted) abort();
    child.stdin.end();
    const result = await owned.closed;
    await stopping;
    if (result.termination !== "closed") {
      unconfirmed();
      throw new Error("Unit descendant cleanup could not be confirmed");
    }
    try {
      stdout.finish();
      stderr.finish();
    } catch {
      problem ??= new Error("Unit output ended with malformed UTF-8");
    }
    if (problem || result.error || result.code !== 0)
      throw (
        problem ?? result.error ?? new Error(`Unit child exited ${result.code ?? "without status"}`)
      );
  } finally {
    signal.removeEventListener("abort", abort);
  }
}
export async function runUnitTests(root: string): Promise<void> {
  const files = (await readdir(resolve(root, "test")))
    .filter((file) => file.endsWith(".test.ts"))
    .sort()
    .map((file) => `test/${file}`);
  if (!files.length || files.length > 1000)
    throw new Error("Test discovery returned an empty or oversized inventory");
  const resources = () => ({
    cpus: availableParallelism(),
    memoryBytes: Math.min(freemem(), process.availableMemory()),
  });
  let concurrency = 1;
  try {
    concurrency = testConcurrency(resources());
  } catch {
    /* Unknown resource availability stays sequential. */
  }
  process.stderr.write(
    `Unit inventory: ${files.length} files, ${concurrency} process(es); unchanged 240-second phase deadline\n`,
  );
  const controller = new AbortController();
  const resourceRoot = fileURLToPath(new URL("../../", import.meta.url));
  const parent = await temporaryParent(process.env, resourceRoot);
  const workspace = await createTemporaryWorkspace(resourceRoot, "unit", parent);
  let safeToDispose = true;
  const interrupt = (): void => controller.abort();
  process.once("SIGINT", interrupt);
  process.once("SIGTERM", interrupt);
  const timer = setTimeout(() => controller.abort(), 240_000);
  try {
    const pycache = resolve(workspace.path, "python");
    await mkdir(pycache);
    const env = unitEnvironment(workspace.environment(process.env), pycache);
    await scheduleTestBatches(
      files,
      Math.max(1, concurrency),
      (batch) =>
        boundedTests(root, batch.files, controller.signal, env, () => {
          safeToDispose = false;
        }),
      resources,
    );
  } finally {
    clearTimeout(timer);
    process.removeListener("SIGINT", interrupt);
    process.removeListener("SIGTERM", interrupt);
    if (safeToDispose) await workspace.dispose();
  }
}
