import { spawn, spawnSync } from "node:child_process";
import { mkdir, mkdtemp, readdir, rm } from "node:fs/promises";
import { availableParallelism, freemem } from "node:os";
import { resolve } from "node:path";
import { Schema } from "effect";
import { cacheDirectory, safePath } from "./cache-io.ts";

export function unitEnvironment(base: NodeJS.ProcessEnv, pycache: string): NodeJS.ProcessEnv {
  const env = { ...base };
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
  const isolated = isolateAnalysis
    ? ["test/research-git.test.ts", "test/workflow.test.ts", "test/analysis-sync.test.ts"]
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
): Promise<void> {
  if (!Number.isInteger(concurrency) || concurrency < 1 || concurrency > 3)
    throw new Error("Test concurrency must be between one and three");
  if (concurrency === 1) {
    await run({ name: "all", files });
    return;
  }
  const batches = [...testBatches(files, concurrency === 3)];
  const failures: unknown[] = [];
  async function worker(): Promise<void> {
    for (let batch = batches.shift(); batch; batch = batches.shift()) {
      try {
        await run(batch);
      } catch (error) {
        failures.push(error);
      }
    }
  }
  await Promise.all(Array.from({ length: Math.min(concurrency, batches.length) }, worker));
  if (failures.length)
    throw new Error(`${failures.length} test batch(es) failed; every scheduled child was joined`);
}
function boundedTests(
  root: string,
  files: readonly string[],
  signal: AbortSignal,
  env: NodeJS.ProcessEnv,
): Promise<void> {
  signal.throwIfAborted();
  return new Promise((done, fail) => {
    const child = spawn(
      process.execPath,
      ["test", "--timeout", "120000", ...files.map((file) => `./${file}`)],
      {
        cwd: root,
        env,
        shell: false,
        windowsHide: true,
        detached: true,
        stdio: ["ignore", "pipe", "pipe"],
      },
    );
    let bytes = 0;
    let problem: Error | undefined;
    function stop(): void {
      if (child.exitCode === null && child.signalCode === null && child.pid) {
        if (process.platform === "win32")
          spawnSync(
            resolve(process.env.SystemRoot ?? "C:\\Windows", "System32/taskkill.exe"),
            ["/PID", String(child.pid), "/T", "/F"],
            {
              shell: false,
              windowsHide: true,
              stdio: "ignore",
              timeout: 10_000,
            },
          );
        else {
          try {
            process.kill(-child.pid, "SIGKILL");
          } catch {
            child.kill("SIGKILL");
          }
        }
        child.kill("SIGKILL");
      }
      // A dead parent with inherited open pipes cannot establish descendant cleanup.
      // Bound stream ownership and fail; never turn that uncertainty into success.
      child.stdout.destroy();
      child.stderr.destroy();
    }
    const abort = (): void => {
      problem ??= new Error(
        "Complete unit phase exceeded its 240-second deadline or was cancelled",
      );
      stop();
    };
    signal.addEventListener("abort", abort, { once: true });
    if (signal.aborted) abort();
    function outputWriter(): { write: (chunk: unknown) => void; finish: () => void } {
      const decoder = new TextDecoder("utf-8", { fatal: true });
      let pending = "";
      const publish = (text: string, final = false): void => {
        const combined = pending + text;
        pending = !final && combined.endsWith("\r") ? "\r" : "";
        process.stderr.write(
          (pending ? combined.slice(0, -1) : combined)
            .replaceAll("\r\n", "\n")
            .replaceAll("\r", "\n"),
        );
      };
      const write = (chunk: unknown): void => {
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
    child.stdout.on("data", stdout.write);
    child.stderr.on("data", stderr.write);
    child.on("error", (error) => {
      problem = error;
    });
    child.on("close", (status) => {
      signal.removeEventListener("abort", abort);
      try {
        stdout.finish();
        stderr.finish();
      } catch {
        problem = new Error("Unit output ended with malformed UTF-8");
      }
      if (problem || status !== 0)
        fail(problem ?? new Error(`Unit child exited ${status ?? "without status"}`));
      else done();
    });
  });
}
export async function runUnitTests(root: string): Promise<void> {
  const files = (await readdir(resolve(root, "test")))
    .filter((file) => file.endsWith(".test.ts"))
    .sort()
    .map((file) => `test/${file}`);
  if (!files.length || files.length > 1000)
    throw new Error("Test discovery returned an empty or oversized inventory");
  let concurrency = 1;
  try {
    concurrency = testConcurrency({ cpus: availableParallelism(), memoryBytes: freemem() });
  } catch {
    /* Unknown resource availability stays sequential. */
  }
  process.stderr.write(
    `Unit inventory: ${files.length} files, ${concurrency} process(es); unchanged 240-second phase deadline\n`,
  );
  const controller = new AbortController();
  const cache = await safePath(root, cacheDirectory, true);
  await mkdir(cache, { recursive: true });
  const pycache = await mkdtemp(resolve(cache, "python-unit-"));
  const env = unitEnvironment(process.env, pycache);
  const interrupt = (): void => controller.abort();
  process.once("SIGINT", interrupt);
  process.once("SIGTERM", interrupt);
  const timer = setTimeout(() => controller.abort(), 240_000);
  try {
    await scheduleTestBatches(files, concurrency, (batch) =>
      boundedTests(root, batch.files, controller.signal, env),
    );
  } finally {
    clearTimeout(timer);
    process.removeListener("SIGINT", interrupt);
    process.removeListener("SIGTERM", interrupt);
    await rm(pycache, { recursive: true, force: true });
  }
}
