/** Host-only process-tree ownership. Callers own bounded output and scratch lifetimes. */
import { spawn, spawnSync, type ChildProcess } from "node:child_process";
import { createHash, randomUUID } from "node:crypto";
import {
  lstat,
  mkdir,
  mkdtemp,
  opendir,
  realpath,
  rename,
  rmdir,
  unlink,
  writeFile,
} from "node:fs/promises";
import { basename, dirname, isAbsolute, join, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { Schema } from "effect";
import { boundedRead, fileDigest, hasCode, safePath, withCacheLock } from "./cache-io.ts";
import {
  borrowTemporaryWorkspace,
  createTemporaryWorkspace,
  type TemporaryWorkspaceParent,
} from "./temporary-workspace.ts";

const implementationRoot = fileURLToPath(new URL("../../", import.meta.url));
const nativeDirectory = ".cache/native";
const legacyNativeDirectory = ".cache/verification/native-owned-process";
/** UTF-16 units, with room below MAX_PATH for the .NET host's adjacent metadata names. */
export const windowsNativePathLimit = 248;
export function assertWindowsNativePath(
  path: string,
  platform: NodeJS.Platform = process.platform,
): void {
  if (platform === "win32" && path.length > windowsNativePathLimit)
    throw new Error("Windows native supervisor path exceeds the 248-unit compatibility bound");
}
const Completion = Schema.Struct({
  version: Schema.Literal(1),
  token: Schema.String.check(
    Schema.isPattern(/^[a-f0-9]{8}-[a-f0-9]{4}-4[a-f0-9]{3}-[89ab][a-f0-9]{3}-[a-f0-9]{12}$/u),
  ),
  code: Schema.Int.check(Schema.isGreaterThanOrEqualTo(0), Schema.isLessThanOrEqualTo(255)),
});
const builds = new Map<string, Promise<string>>();
/** Trusted test observation only; never supplied by CLI, environment or project configuration. */
export type OwnedPreparationObserver = (
  phase: "optimistic-complete" | "optimistic-absent" | "optimistic-invalid" | "locked",
) => void | Promise<void>;
const samePath = (a: string, b: string): boolean =>
  process.platform === "win32" ? a.toLowerCase() === b.toLowerCase() : a === b;
const digest = (value: string | Uint8Array): string =>
  createHash("sha256").update(value).digest("hex");

/** A cooperative native drain receipt never authorizes cleanup of another lease. */
export async function inspectOwnedProcessCompletion(
  workspace: TemporaryWorkspaceParent,
  status: number | null,
): Promise<void> {
  try {
    await borrowTemporaryWorkspace(workspace.root, workspace.path, workspace.token);
    const info = await lstat(join(workspace.path, "completion.json"));
    if (!info.isFile() || info.isSymbolicLink() || info.nlink !== 1)
      throw new Error("Completion must be a private regular file");
    const text = new TextDecoder("utf-8", { fatal: true, ignoreBOM: true }).decode(
      await boundedRead(workspace.path, "completion.json", 256),
    );
    if (text.includes("\r") || !text.endsWith("\n")) throw new Error("Completion must use LF");
    const receipt = Schema.decodeUnknownSync(Schema.fromJsonString(Completion), {
      onExcessProperty: "error",
    })(text);
    if (receipt.token !== workspace.token || receipt.code !== status || receipt.code === 253)
      throw new Error("Completion identity or status mismatch");
    await borrowTemporaryWorkspace(workspace.root, workspace.path, workspace.token);
  } catch {
    throw new Error("Owned native completion could not be confirmed");
  }
}

/** Cache ownership is explicit; neither the command cwd nor environment chooses it. */
async function physicalProjectDirectory(path: string): Promise<string> {
  if (!isAbsolute(path)) throw new Error("Owned project root requires an absolute path");
  const full = resolve(path);
  const info = await lstat(full);
  if (!info.isDirectory() || info.isSymbolicLink() || !samePath(await realpath(full), full))
    throw new Error("Owned project root must be a physical directory");
  return full;
}

async function physicalExecutable(path: string): Promise<string> {
  if (!isAbsolute(path)) throw new Error("Owned executable requires an absolute path");
  const full = resolve(path);
  const info = await lstat(full);
  if (!info.isFile() || info.isSymbolicLink() || !samePath(await realpath(full), full))
    throw new Error("Owned executable must be a physical regular file");
  return full;
}

/** Read-only artifact boundary; fixture roots do not confer executable launch authority. */
export async function inspectOwnedProcessArtifact(
  project: string,
  directory: string,
): Promise<{ readonly path: string; readonly digest: string } | undefined> {
  return await inspectNativeArtifact(project, directory, "run.exe");
}
async function inspectNativeArtifact(
  project: string,
  directory: string,
  binary: "run.exe" | "owned-process.exe",
): Promise<{ readonly path: string; readonly digest: string } | undefined> {
  let present = false;
  try {
    const folder = await safePath(project, directory);
    present = true;
    const entries = await opendir(folder);
    const names = new Set<string>();
    for await (const entry of entries) {
      if (
        names.size >= 2 ||
        !["binary.sha256", binary].includes(entry.name) ||
        !entry.isFile() ||
        entry.isSymbolicLink()
      )
        throw new Error("Native supervisor artifacts require explicit inspection");
      names.add(entry.name);
    }
    if (!names.size) return undefined;
    if (names.size !== 2)
      throw new Error("Incomplete native supervisor artifacts require explicit inspection");
    const receipt = new TextDecoder("utf-8", { fatal: true }).decode(
      await boundedRead(project, `${directory}/binary.sha256`, 128),
    );
    if (!/^[a-f0-9]{64}\n$/u.test(receipt))
      throw new Error("Native supervisor receipt requires explicit inspection");
    const path = `${directory}/${binary}`;
    const checksum = await fileDigest(project, path, 16 * 1024 * 1024);
    if (checksum !== receipt.trim())
      throw new Error("Native supervisor integrity requires explicit inspection");
    return { path: await physicalExecutable(await safePath(project, path)), digest: checksum };
  } catch (error) {
    if (!present && hasCode(error, "ENOENT")) return undefined;
    throw error;
  }
}

async function nativeCapacity(project: string, key: string): Promise<void> {
  const parent = await safePath(project, nativeDirectory, true);
  await mkdir(parent, { recursive: true });
  await safePath(project, nativeDirectory);
  let entries = 0;
  let existing = false;
  for (const location of [legacyNativeDirectory, nativeDirectory]) {
    let directory: Awaited<ReturnType<typeof opendir>>;
    try {
      directory = await opendir(await safePath(project, location));
    } catch (error) {
      if (hasCode(error, "ENOENT")) continue;
      throw error;
    }
    for await (const entry of directory) {
      if (
        ++entries > 32 ||
        !/^[a-f0-9]{64}$/u.test(entry.name) ||
        !entry.isDirectory() ||
        entry.isSymbolicLink()
      )
        throw new Error("Native supervisor cache requires inspection; no artifacts were removed");
      if (location === legacyNativeDirectory) {
        if (
          !(await inspectNativeArtifact(project, `${location}/${entry.name}`, "owned-process.exe"))
        )
          throw new Error(
            "Incomplete legacy native supervisor artifacts require explicit inspection",
          );
      } else if (entry.name === key) existing = true;
    }
  }
  if (entries >= 32 && !existing)
    throw new Error("Native supervisor cache capacity requires explicit inspection");
}

/** The native compiler and source are provisioned inputs, never installed or fetched here. */
async function windowsSupervisor(
  project: string,
  observe?: OwnedPreparationObserver,
): Promise<string> {
  // Reject unsupported project layouts before compiling or launching a managed executable.
  assertWindowsNativePath(join(project, nativeDirectory, "0".repeat(64), "run.exe"));
  const system = process.env.SystemRoot ?? process.env.SYSTEMROOT;
  if (!system || !isAbsolute(system)) throw new Error("Windows SystemRoot is unavailable");
  const compiler = await physicalExecutable(
    join(system, "Microsoft.NET/Framework64/v4.0.30319/csc.exe"),
  );
  assertWindowsNativePath(compiler);
  const references = await Promise.all(
    ["mscorlib.dll", "System.dll"].map((name) => physicalExecutable(join(dirname(compiler), name))),
  );
  const source = "app/check/owned-process-windows.cs";
  const before = async (): Promise<string> => {
    // Fixed independent inputs use the shared streaming reader budget. Settle every
    // digest before reporting failure, and retain the original identity order.
    const inputs = await Promise.allSettled([
      fileDigest(implementationRoot, source, 1024 * 1024),
      fileDigest(implementationRoot, "app/check/owned-process.ts", 1024 * 1024),
      fileDigest(dirname(compiler), "csc.exe", 64 * 1024 * 1024),
      fileDigest(dirname(compiler), "csc.exe.config", 64 * 1024),
      ...references.map((path) => fileDigest(dirname(path), basename(path), 64 * 1024 * 1024)),
    ]);
    const values: string[] = [];
    const failures: unknown[] = [];
    for (const result of inputs) {
      if (result.status === "fulfilled") values.push(result.value);
      else {
        const reason: unknown = result.reason;
        failures.push(reason);
      }
    }
    if (failures.length === 1) throw failures[0];
    if (failures.length) throw new AggregateError(failures, "Native input fingerprinting failed");
    return digest(
      JSON.stringify([...values, process.arch, process.versions.bun ?? process.version]),
    );
  };
  const key = await before();
  await physicalProjectDirectory(project);
  const buildKey = `${process.platform === "win32" ? project.toLowerCase() : project}\0${key}`;
  const existing = builds.get(buildKey);
  if (existing) return existing;
  const build = (async () => {
    await physicalProjectDirectory(project);
    const folder = `${nativeDirectory}/${key}`;
    const reuse = async (installed: {
      readonly path: string;
      readonly digest: string;
    }): Promise<string> => {
      if ((await before()) !== key)
        throw new Error("Native supervisor inputs changed during reuse");
      await physicalProjectDirectory(project);
      const verified = await inspectOwnedProcessArtifact(project, folder);
      if (
        !verified ||
        verified.digest !== installed.digest ||
        !samePath(verified.path, installed.path)
      )
        throw new Error("Native supervisor artifact changed during reuse");
      return verified.path;
    };
    let optimistic: Awaited<ReturnType<typeof inspectOwnedProcessArtifact>>;
    let invalid: { readonly error: unknown } | undefined;
    try {
      optimistic = await inspectOwnedProcessArtifact(project, folder);
    } catch (error) {
      invalid = { error };
    }
    await observe?.(
      optimistic ? "optimistic-complete" : invalid ? "optimistic-invalid" : "optimistic-absent",
    );
    if (optimistic) return await reuse(optimistic);
    return await withCacheLock(project, "native-owned-process", async () => {
      await observe?.("locked");
      await physicalProjectDirectory(project);
      const installed = await inspectOwnedProcessArtifact(project, folder);
      if (installed) return await reuse(installed);
      // A concurrent publisher may finish valid evidence while we wait. Missing or
      // empty evidence after an invalid observation never authorizes rebuilding it.
      if (invalid) throw invalid.error;
      await nativeCapacity(project, key);
      await mkdir(await safePath(project, folder, true), { recursive: true });
      // The exclusive staging child belongs to this project and the existing publication lock.
      const staging = await mkdtemp(join(await safePath(project, nativeDirectory), "compile-"));
      const stagingRelative = `${nativeDirectory}/${basename(staging)}`;
      const pending = `${stagingRelative}/run.exe`;
      const pendingReceipt = `${folder}/${randomUUID()}.sha256`;
      const failures: unknown[] = [];
      let executable: string | undefined;
      let compilerClosed = true;
      try {
        const output = await safePath(project, pending, true);
        assertWindowsNativePath(output);
        compilerClosed = false;
        const compiled = spawnSync(
          compiler,
          [
            "/nologo",
            "/noconfig",
            "/nostdlib+",
            "/optimize+",
            "/target:exe",
            ...references.map((path) => `/reference:${path}`),
            `/out:${output}`,
            await safePath(implementationRoot, source),
          ],
          {
            shell: false,
            windowsHide: true,
            encoding: "utf8",
            timeout: 30_000,
            maxBuffer: 64 * 1024,
          },
        );
        compilerClosed = !compiled.error && compiled.status !== null;
        if (compiled.error || compiled.status !== 0)
          throw new Error("Windows owned-process supervisor compilation failed");
        if ((await before()) !== key)
          throw new Error("Native supervisor inputs changed during compilation");
        await physicalProjectDirectory(project);
        const checksum = await fileDigest(project, pending, 16 * 1024 * 1024);
        await writeFile(await safePath(project, pendingReceipt, true), `${checksum}\n`, {
          flag: "wx",
          mode: 0o600,
        });
        await rename(
          await safePath(project, pending),
          await safePath(project, `${folder}/run.exe`, true),
        );
        await rename(
          await safePath(project, pendingReceipt),
          await safePath(project, `${folder}/binary.sha256`, true),
        );
        const verified = await inspectOwnedProcessArtifact(project, folder);
        if (!verified) throw new Error("Native supervisor output failed integrity validation");
        executable = verified.path;
      } catch (error) {
        failures.push(error);
      }
      if (compilerClosed) {
        for (const path of [pending, pendingReceipt]) {
          try {
            await physicalProjectDirectory(project);
            await unlink(await safePath(project, path, true));
          } catch (error) {
            if (!hasCode(error, "ENOENT")) failures.push(error);
          }
        }
        try {
          await physicalProjectDirectory(project);
          // No recursive deletion: unexpected staging entries remain available for inspection.
          await rmdir(await safePath(project, stagingRelative));
        } catch (error) {
          failures.push(error);
        }
      } else
        failures.push(
          new Error("Native compiler outcome is unconfirmed; project-owned staging was retained"),
        );
      if (failures.length === 1) throw failures[0];
      if (failures.length)
        throw new AggregateError(failures, "Native preparation and pending-file cleanup failed");
      if (!executable) throw new Error("Native supervisor preparation returned no artifact");
      return executable;
    });
  })();
  builds.set(buildKey, build);
  try {
    return await build;
  } finally {
    builds.delete(buildKey);
  }
}

/** Live source/compiler/artifact identity; this never installs or repairs a prerequisite. */
export async function ownedProcessIdentity(
  projectRoot = implementationRoot,
  observe?: OwnedPreparationObserver,
): Promise<string> {
  const project = await physicalProjectDirectory(projectRoot);
  if (process.platform !== "win32")
    return digest(JSON.stringify(["owned-posix-process-group-v1", process.platform, process.arch]));
  const executable = await windowsSupervisor(project, observe);
  const folder = relative(project, dirname(executable)).replaceAll("\\", "/");
  const artifact = await inspectOwnedProcessArtifact(project, folder);
  if (!artifact) throw new Error("Native supervisor disappeared during prerequisite validation");
  return digest(
    JSON.stringify(["owned-windows-job-v3", basename(dirname(executable)), artifact.digest]),
  );
}

export type OwnedExit = {
  readonly code: number | null;
  readonly signal: NodeJS.Signals | null;
  readonly error?: Error;
  readonly termination: "closed" | "unconfirmed";
};
export type OwnedProcess = {
  readonly child: ChildProcess;
  readonly closed: Promise<OwnedExit>;
  readonly stop: (reason?: string) => Promise<void>;
};
export type OwnedProcessOptions = {
  readonly cwd: string;
  /** Physical consumer owning native artifacts; defaults to the implementation checkout. */
  readonly projectRoot?: string;
  readonly env?: NodeJS.ProcessEnv;
  readonly stdio: "inherit" | "pipe";
  readonly signal?: AbortSignal;
  readonly timeoutMs?: number;
};

/** Adapted from fd399cca: share signaling and disappearance, including failed completion. */
export function createPosixGroupCompletion(operations: {
  readonly terminate: () => boolean;
  readonly exists: () => boolean;
  readonly wait: () => Promise<void>;
  readonly now: () => number;
  readonly timeoutMs: number;
}): () => Promise<void> {
  let completion: Promise<void> | undefined;
  return () => {
    completion ??= (async () => {
      // Once absent, this numeric group ID may be reused by an unrelated process.
      if (!operations.terminate()) return;
      const deadline = operations.now() + operations.timeoutMs;
      while (operations.exists()) {
        if (operations.now() >= deadline) throw new Error("Owned process group cleanup timed out");
        await operations.wait();
      }
    })();
    return completion;
  };
}

/** Windows owns descendants atomically at creation; POSIX owns a detached process group. */
export async function spawnOwned(
  executable: string,
  args: readonly string[],
  options: OwnedProcessOptions,
): Promise<OwnedProcess> {
  const command = await physicalExecutable(executable);
  if (
    args.length > 4096 ||
    args.some((argument) => argument.includes("\0")) ||
    args.reduce((sum, argument) => sum + Buffer.byteLength(argument), 0) > 1024 * 1024
  )
    throw new Error("Owned process arguments exceed bounds");
  if (
    options.timeoutMs !== undefined &&
    (!Number.isSafeInteger(options.timeoutMs) ||
      options.timeoutMs <= 0 ||
      options.timeoutMs > 3_600_000)
  )
    throw new Error("Owned process timeout is invalid");
  options.signal?.throwIfAborted();
  const project = await physicalProjectDirectory(options.projectRoot ?? implementationRoot);
  const supervisor = process.platform === "win32" ? await windowsSupervisor(project) : undefined;
  if (supervisor) assertWindowsNativePath(supervisor);
  options.signal?.throwIfAborted();
  const completion = supervisor ? await createTemporaryWorkspace(project, "completion") : undefined;
  const cancellation = `Local\\TeamagentOwned-${randomUUID()}`;
  let child: ChildProcess;
  try {
    options.signal?.throwIfAborted();
    child = spawn(
      supervisor ?? command,
      completion
        ? [
            String(process.pid),
            cancellation,
            join(completion.path, "completion.json"),
            completion.token,
            command,
            ...args,
          ]
        : [...args],
      {
        cwd: resolve(options.cwd),
        ...(options.env ? { env: options.env } : {}),
        stdio: options.stdio,
        shell: false,
        windowsHide: true,
        detached: process.platform !== "win32",
      },
    );
  } catch (error) {
    try {
      await completion?.dispose();
    } catch {
      throw new Error("Owned process launch and completion-scope cleanup failed");
    }
    throw error;
  }
  const joined = Promise.withResolvers<OwnedExit>();
  let failure: Error | undefined;
  let complete = false;
  let stopping: Promise<void> | undefined;
  let timer: ReturnType<typeof setTimeout> | undefined;
  let forced = false;
  const fail = (error: unknown): void => {
    failure ??= error instanceof Error ? error : new Error("Owned process cleanup failed");
  };
  async function finish(
    code: number | null,
    signal: NodeJS.Signals | null,
    confirmed: boolean,
  ): Promise<void> {
    if (complete) return;
    complete = true;
    if (timer) clearTimeout(timer);
    options.signal?.removeEventListener("abort", abort);
    if (!confirmed) fail(new Error("Owned descendant shutdown could not be confirmed"));
    if (confirmed && completion) {
      try {
        await completion.dispose();
      } catch {
        fail(new Error("Owned completion-scope cleanup failed"));
      }
    }
    joined.resolve({
      code,
      signal,
      termination: confirmed ? "closed" : "unconfirmed",
      ...(failure ? { error: failure } : {}),
    });
  }
  function endUnconfirmedTransport(): void {
    if (complete) return;
    forced = true;
    fail(new Error("Owned process transport exceeded its cleanup deadline"));
    try {
      child.kill("SIGKILL");
    } catch (error) {
      fail(error);
    }
    // Closing only our streams bounds a broken transport, never proves descendant exit.
    for (const stream of [child.stdin, child.stdout, child.stderr]) {
      try {
        stream?.destroy();
      } catch (error) {
        fail(error);
      }
    }
    try {
      child.unref();
    } catch (error) {
      fail(error);
    }
    void finish(child.exitCode, child.signalCode, false);
  }
  function signalGroup(signal: NodeJS.Signals | 0): boolean {
    if (child.pid === undefined) return false;
    try {
      process.kill(-child.pid, signal);
      return true;
    } catch (error) {
      if (!hasCode(error, "ESRCH")) throw error;
      return false;
    }
  }
  const joinGroup = createPosixGroupCompletion({
    terminate: () => signalGroup("SIGKILL"),
    exists: () => signalGroup(0),
    wait: () => new Promise<void>((done) => setTimeout(done, 10)),
    now: () => performance.now(),
    timeoutMs: 5000,
  });
  let groupCompletion: Promise<boolean> | undefined;
  function completeGroup(): Promise<boolean> {
    groupCompletion ??= joinGroup().then(
      () => true,
      (error: unknown) => {
        fail(error);
        return false;
      },
    );
    return groupCompletion;
  }
  function stop(reason = "Owned process cancelled"): Promise<void> {
    if (complete) return joined.promise.then(() => {});
    if (stopping) return stopping;
    failure ??= new Error(reason);
    stopping = (async () => {
      const force = setTimeout(endUnconfirmedTransport, 6000);
      try {
        try {
          if (supervisor && child.pid !== undefined) {
            const result = spawnSync(supervisor, ["--stop", cancellation, String(child.pid)], {
              shell: false,
              windowsHide: true,
              encoding: "utf8",
              timeout: 5000,
              maxBuffer: 8192,
            });
            if (result.error || result.status !== 0) {
              // The supervisor may have drained and closed its cancellation event
              // just before this request. Observe that completion before forcing it.
              let closingTimer: ReturnType<typeof setTimeout> | undefined;
              try {
                await Promise.race([
                  joined.promise,
                  new Promise<void>((done) => {
                    closingTimer = setTimeout(done, 100);
                  }),
                ]);
              } finally {
                if (closingTimer) clearTimeout(closingTimer);
              }
              if (!complete) forced = child.kill("SIGKILL");
            }
          } else if (!supervisor) void completeGroup();
        } catch (error) {
          fail(error);
          endUnconfirmedTransport();
        }
        await joined.promise;
      } finally {
        clearTimeout(force);
      }
    })();
    return stopping;
  }
  const requestStop = (reason: string): void => {
    void stop(reason).catch((error: unknown) => {
      fail(error);
      forced = true;
      child.kill("SIGKILL");
    });
  };
  const abort = (): void => requestStop("Owned process aborted");
  child.once("error", fail);
  child.once("exit", () => {
    if (!supervisor) void completeGroup();
  });
  child.once("close", (code, signal) => {
    void (async () => {
      let confirmed = false;
      if (completion) {
        if (
          !forced &&
          signal === null &&
          code !== null &&
          code >= 0 &&
          code <= 255 &&
          code !== 253
        ) {
          await inspectOwnedProcessCompletion(completion, code);
          confirmed = !forced;
        }
      } else confirmed = await completeGroup();
      await finish(code, signal, confirmed);
    })().catch((error: unknown) => {
      fail(error);
      return finish(code, signal, false);
    });
  });
  options.signal?.addEventListener("abort", abort, { once: true });
  if (options.signal?.aborted) abort();
  if (options.timeoutMs)
    timer = setTimeout(() => requestStop("Owned process timed out"), options.timeoutMs);
  return { child, closed: joined.promise, stop };
}
