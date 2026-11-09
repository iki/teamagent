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
  // The outer runner keeps CI trust policy; private fixtures exercise their own.
  Reflect.deleteProperty(env, "GITHUB_ACTIONS");
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
// Only audited private-fixture suites leave the ordered remaining batch.
const single = (file: string): TestBatch => ({ name: file, files: [file] });
const workflow = single("test/workflow.test.ts");
const revisions = single("test/workflow-revisions.test.ts");
const research = single("test/research-git.test.ts");
const parallelGroups = [
  single("test/parallel-workflow-integration.test.ts"),
  single("test/parallel-workflow-failures.test.ts"),
  single("test/parallel-workflow-recovery.test.ts"),
  single("test/parallel-workflow-pr.test.ts"),
];
const heavyBatchNames = new Set(parallelGroups.map((batch) => batch.name));
const parallelBootstrap: TestBatch = {
  name: "parallel-workflow-bootstrap",
  files: ["test/parallel-workflow.test.ts", "test/parallel-workflow-migration.test.ts"],
};
const workflowBatchNames = new Set([
  workflow.name,
  revisions.name,
  ...parallelGroups.map((batch) => batch.name),
  parallelBootstrap.name,
]);
// Research runs first and alone; then fill free slots with compatible audited batches.
// Heavy Git scenarios cap all active batches at two; other work retains the overall cap.
// Longer ordinary groups lead the fixed queue to reduce the gap between heavy admissions.
// This priority changes neither group membership nor live resource admission.
const auditedGroups: readonly TestBatch[] = [
  research,
  workflow,
  revisions,
  single("test/verification-cache.test.ts"),
  single("test/analysis-sync.test.ts"),
  single("test/pre-commit.test.ts"),
  single("test/imports.test.ts"),
  {
    name: "owned-launchers",
    files: [
      "test/native-lifetime.test.ts",
      "test/owned-process.test.ts",
      "test/owned-process-project.test.ts",
      "test/project-launcher.test.ts",
      "test/project-environment.test.ts",
    ],
  },
  parallelBootstrap,
  {
    name: "http-and-memory-cli",
    files: ["test/import-http-cache.test.ts", "test/memory-cli-mcp.test.ts"],
  },
  ...parallelGroups,
];
const batchLabels = new Set(["all", "remaining", ...auditedGroups.map((batch) => batch.name)]);
function compatibleBatch(name: string, active: ReadonlySet<string>): boolean {
  if (name === research.name) return active.size === 0;
  if (active.has(research.name)) return false;
  const heavy =
    heavyBatchNames.has(name) || [...active].some((label) => heavyBatchNames.has(label));
  if (heavy && active.size >= 2) return false;
  const workflows = [...active].filter((label) => workflowBatchNames.has(label)).length;
  return !workflowBatchNames.has(name) || workflows < 2;
}
const failureReasons = [
  "deadline",
  "cancelled",
  "output-limit",
  "transport",
  "launch",
  "cleanup",
  "exit",
  "unknown",
] as const;
type TestBatchFailureReason = (typeof failureReasons)[number];

/** Only fixed internal reasons reach the scheduler summary, never child diagnostics. */
export class TestBatchFailure extends Error {
  constructor(readonly reason: TestBatchFailureReason) {
    super("Unit batch failed");
  }
}

function failureReason(error: unknown): TestBatchFailureReason {
  return error instanceof TestBatchFailure && failureReasons.includes(error.reason)
    ? error.reason
    : "unknown";
}

function signalFailure(signal: AbortSignal): TestBatchFailure {
  return new TestBatchFailure(
    failureReason(signal.reason) === "deadline" ? "deadline" : "cancelled",
  );
}

export function testBatches(files: readonly string[]): readonly TestBatch[] {
  const groups = auditedGroups;
  const isolated = new Set(groups.flatMap((batch) => batch.files));
  return [
    { name: research.name, files: files.filter((file) => research.files.includes(file)) },
    { name: "remaining", files: files.filter((file) => !isolated.has(file)) },
    ...groups
      .filter((batch) => batch.name !== research.name)
      .map((batch) => ({
        name: batch.name,
        files: files.filter((file) => batch.files.includes(file)),
      })),
  ].filter((batch) => batch.files.length > 0);
}
const decodeUnitWorkerLimit = Schema.decodeUnknownSync(Schema.Literals([1, 2, 3]));
export function unitWorkerLimit(input: unknown): 1 | 2 | 3 {
  try {
    return decodeUnitWorkerLimit(input === undefined ? 3 : input);
  } catch {
    throw new Error("Unit worker limit must be 1, 2 or 3");
  }
}
/** Conservative admission policy; preliminary timings do not establish an optimal cap. */
export function testConcurrency(
  resources: { readonly cpus: number; readonly memoryBytes: number },
  workers: unknown = 3,
): number {
  const limit = unitWorkerLimit(workers);
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
  return Math.min(limit, resources.cpus >= 4 && resources.memoryBytes >= 4 * 1024 ** 3 ? 3 : 2);
}
export async function scheduleTestBatches(
  files: readonly string[],
  concurrency: number,
  run: (batch: TestBatch) => Promise<void>,
  resources?: () => { readonly cpus: number; readonly memoryBytes: number },
): Promise<void> {
  if (!Number.isInteger(concurrency) || concurrency < 1 || concurrency > 3)
    throw new Error("Test concurrency must be between one and three");
  const batches = concurrency === 1 ? [{ name: "all", files }] : [...testBatches(files)];
  const failures: Array<{ batch: string; reason: TestBatchFailureReason }> = [];
  const active = new Set<Promise<void>>();
  const activeLabels = new Set<string>();
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
    const eligible =
      active.size < admitted
        ? batches.findIndex((batch) => compatibleBatch(batch.name, activeLabels))
        : -1;
    if (eligible !== -1) {
      const [batch] = batches.splice(eligible, 1);
      if (!batch) throw new Error("Test batch inventory changed unexpectedly");
      const label = batchLabels.has(batch.name) ? batch.name : "unknown";
      activeLabels.add(label);
      const work = (async () => {
        try {
          await run(batch);
        } catch (error) {
          failures.push({ batch: label, reason: failureReason(error) });
        }
      })();
      active.add(work);
      void work.then(() => {
        active.delete(work);
        activeLabels.delete(label);
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
  const details = failures.length
    ? `; failures: ${failures.map(({ batch, reason }) => `${batch}=${reason}`).join(", ")}`
    : "";
  if (incompleteFiles)
    throw new Error(
      `${incompleteFiles} test file(s) not run: insufficient available memory (at least 1 GiB required); ${failures.length} batch(es) failed; running children were joined and verification remains incomplete${details}`,
    );
  if (failures.length)
    throw new Error(
      `${failures.length} test batch(es) failed; every scheduled child was joined${details}`,
    );
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
  if (signal.aborted) throw signalFailure(signal);
  let owned: Awaited<ReturnType<typeof spawnOwned>>;
  try {
    owned = await spawnOwned(
      process.execPath,
      ["test", "--timeout", "120000", ...files.map((file) => `./${file}`)],
      { cwd: root, env, stdio: "pipe", signal },
    );
  } catch {
    throw signal.aborted ? signalFailure(signal) : new TestBatchFailure("launch");
  }
  const { child } = owned;
  const stdoutStream = child.stdout,
    stderrStream = child.stderr;
  if (!stdoutStream || !stderrStream || !child.stdin) {
    try {
      await owned.stop("Missing unit streams");
    } catch {
      unconfirmed();
      throw new TestBatchFailure("cleanup");
    }
    if ((await owned.closed).termination !== "closed") {
      unconfirmed();
      throw new TestBatchFailure("cleanup");
    }
    throw new TestBatchFailure("transport");
  }
  let bytes = 0;
  let problem: TestBatchFailure | undefined;
  let stopping: Promise<void> | undefined;
  const stop = (): void => {
    stopping ??= owned.stop("Unit verification stopped").catch(() => {
      unconfirmed();
      problem = new TestBatchFailure("cleanup");
    });
  };
  const abort = (): void => {
    problem ??= signalFailure(signal);
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
        if (additional > 1024 * 1024 - lineBytes) throw new TestBatchFailure("output-limit");
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
        if (bytes > 16 * 1024 ** 2) throw new TestBatchFailure("output-limit");
        publish(decoder.decode(value, { stream: true }));
      } catch (error) {
        problem = error instanceof TestBatchFailure ? error : new TestBatchFailure("transport");
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
    problem ??= new TestBatchFailure("transport");
    stop();
  });
  child.on("error", () => {
    problem = new TestBatchFailure("transport");
  });
  signal.addEventListener("abort", abort, { once: true });
  try {
    if (signal.aborted) abort();
    child.stdin.end();
    const result = await owned.closed;
    await stopping;
    if (result.termination !== "closed") {
      unconfirmed();
      throw new TestBatchFailure("cleanup");
    }
    try {
      stdout.finish();
      stderr.finish();
    } catch (error) {
      problem ??= error instanceof TestBatchFailure ? error : new TestBatchFailure("transport");
    }
    if (problem) throw problem;
    if (result.error || result.code === null) throw new TestBatchFailure("transport");
    if (result.code !== 0) throw new TestBatchFailure("exit");
  } finally {
    signal.removeEventListener("abort", abort);
  }
}
export async function runUnitTests(root: string, workers?: unknown): Promise<void> {
  const workerLimit = unitWorkerLimit(workers);
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
    concurrency = testConcurrency(resources(), workerLimit);
  } catch {
    /* Unknown resource availability stays sequential. */
  }
  process.stderr.write(
    `Unit inventory: ${files.length} files, ${concurrency} process(es); 720-second phase deadline\n`,
  );
  const controller = new AbortController();
  const resourceRoot = fileURLToPath(new URL("../../", import.meta.url));
  const parent = await temporaryParent(process.env, resourceRoot);
  const workspace = await createTemporaryWorkspace(resourceRoot, "unit", parent);
  let safeToDispose = true;
  const interrupt = (): void => controller.abort(new TestBatchFailure("cancelled"));
  process.once("SIGINT", interrupt);
  process.once("SIGTERM", interrupt);
  const timer = setTimeout(() => controller.abort(new TestBatchFailure("deadline")), 720_000);
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
