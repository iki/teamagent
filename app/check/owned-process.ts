/** Host-only process-tree ownership. Callers own bounded output and scratch lifetimes. */
import { spawn, spawnSync, type ChildProcess } from "node:child_process";
import { createHash, randomUUID } from "node:crypto";
import { lstat, mkdir, opendir, realpath, rename, unlink, writeFile } from "node:fs/promises";
import { basename, dirname, isAbsolute, join, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { boundedRead, fileDigest, hasCode, safePath, withCacheLock } from "./cache-io.ts";

const root = fileURLToPath(new URL("../../", import.meta.url));
const nativeDirectory = ".cache/verification/native-owned-process";
const builds = new Map<string, Promise<string>>();
const samePath = (a: string, b: string): boolean =>
  process.platform === "win32" ? a.toLowerCase() === b.toLowerCase() : a === b;
const digest = (value: string | Uint8Array): string =>
  createHash("sha256").update(value).digest("hex");

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
  let present = false;
  try {
    const folder = await safePath(project, directory);
    present = true;
    const entries = await opendir(folder);
    const names = new Set<string>();
    for await (const entry of entries) {
      if (
        names.size >= 2 ||
        !["binary.sha256", "owned-process.exe"].includes(entry.name) ||
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
    const path = `${directory}/owned-process.exe`;
    const checksum = await fileDigest(project, path, 16 * 1024 * 1024);
    if (checksum !== receipt.trim())
      throw new Error("Native supervisor integrity requires explicit inspection");
    return { path: await physicalExecutable(await safePath(project, path)), digest: checksum };
  } catch (error) {
    if (!present && hasCode(error, "ENOENT")) return undefined;
    throw error;
  }
}

async function nativeCapacity(key: string): Promise<void> {
  const parent = await safePath(root, nativeDirectory, true);
  await mkdir(parent, { recursive: true });
  await safePath(root, nativeDirectory);
  let entries = 0;
  let existing = false;
  const directory = await opendir(parent);
  for await (const entry of directory) {
    if (
      ++entries > 32 ||
      !/^[a-f0-9]{64}$/u.test(entry.name) ||
      !entry.isDirectory() ||
      entry.isSymbolicLink()
    )
      throw new Error("Native supervisor cache requires inspection; no artifacts were removed");
    if (entry.name === key) existing = true;
  }
  if (entries >= 32 && !existing)
    throw new Error("Native supervisor cache capacity requires explicit inspection");
}

/** The native compiler and source are provisioned inputs, never installed or fetched here. */
async function windowsSupervisor(): Promise<string> {
  const system = process.env.SystemRoot ?? process.env.SYSTEMROOT;
  if (!system || !isAbsolute(system)) throw new Error("Windows SystemRoot is unavailable");
  const compiler = await physicalExecutable(
    join(system, "Microsoft.NET/Framework64/v4.0.30319/csc.exe"),
  );
  const references = await Promise.all(
    ["mscorlib.dll", "System.dll"].map((name) => physicalExecutable(join(dirname(compiler), name))),
  );
  const source = "app/check/owned-process-windows.cs";
  const before = async (): Promise<string> =>
    digest(
      JSON.stringify([
        await fileDigest(root, source, 1024 * 1024),
        await fileDigest(root, "app/check/owned-process.ts", 1024 * 1024),
        await fileDigest(dirname(compiler), "csc.exe", 64 * 1024 * 1024),
        await fileDigest(dirname(compiler), "csc.exe.config", 64 * 1024),
        ...(await Promise.all(
          references.map((path) => fileDigest(dirname(path), basename(path), 64 * 1024 * 1024)),
        )),
        process.arch,
        process.versions.bun ?? process.version,
      ]),
    );
  const key = await before();
  const existing = builds.get(key);
  if (existing) return existing;
  const build = withCacheLock(root, "native-owned-process", async () => {
    const folder = `${nativeDirectory}/${key}`;
    const installed = await inspectOwnedProcessArtifact(root, folder);
    if (installed) {
      if ((await before()) !== key)
        throw new Error("Native supervisor inputs changed during reuse");
      return installed.path;
    }
    await nativeCapacity(key);
    await mkdir(await safePath(root, folder, true), { recursive: true });
    const pending = `${folder}/${randomUUID()}.exe`;
    const pendingReceipt = `${folder}/${randomUUID()}.sha256`;
    const failures: unknown[] = [];
    let executable: string | undefined;
    try {
      const compiled = spawnSync(
        compiler,
        [
          "/nologo",
          "/noconfig",
          "/nostdlib+",
          "/optimize+",
          "/target:exe",
          ...references.map((path) => `/reference:${path}`),
          `/out:${await safePath(root, pending, true)}`,
          await safePath(root, source),
        ],
        {
          shell: false,
          windowsHide: true,
          encoding: "utf8",
          timeout: 30_000,
          maxBuffer: 64 * 1024,
        },
      );
      if (compiled.error || compiled.status !== 0)
        throw new Error("Windows owned-process supervisor compilation failed");
      if ((await before()) !== key)
        throw new Error("Native supervisor inputs changed during compilation");
      const checksum = await fileDigest(root, pending, 16 * 1024 * 1024);
      await writeFile(await safePath(root, pendingReceipt, true), `${checksum}\n`, {
        flag: "wx",
        mode: 0o600,
      });
      await rename(
        await safePath(root, pending),
        await safePath(root, `${folder}/owned-process.exe`, true),
      );
      await rename(
        await safePath(root, pendingReceipt),
        await safePath(root, `${folder}/binary.sha256`, true),
      );
      const verified = await inspectOwnedProcessArtifact(root, folder);
      if (!verified) throw new Error("Native supervisor output failed integrity validation");
      executable = verified.path;
    } catch (error) {
      failures.push(error);
    }
    for (const path of [pending, pendingReceipt]) {
      try {
        await unlink(await safePath(root, path, true));
      } catch (error) {
        if (!hasCode(error, "ENOENT")) failures.push(error);
      }
    }
    if (failures.length === 1) throw failures[0];
    if (failures.length)
      throw new AggregateError(failures, "Native preparation and pending-file cleanup failed");
    if (!executable) throw new Error("Native supervisor preparation returned no artifact");
    return executable;
  });
  builds.set(key, build);
  try {
    return await build;
  } finally {
    builds.delete(key);
  }
}

/** Live source/compiler/artifact identity; this never installs or repairs a prerequisite. */
export async function ownedProcessIdentity(): Promise<string> {
  if (process.platform !== "win32")
    return digest(JSON.stringify(["owned-posix-process-group-v1", process.platform, process.arch]));
  const executable = await windowsSupervisor();
  const folder = relative(root, dirname(executable)).replaceAll("\\", "/");
  const artifact = await inspectOwnedProcessArtifact(root, folder);
  if (!artifact) throw new Error("Native supervisor disappeared during prerequisite validation");
  return digest(
    JSON.stringify(["owned-windows-job-v1", basename(dirname(executable)), artifact.digest]),
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
  readonly env?: NodeJS.ProcessEnv;
  readonly stdio: "inherit" | "pipe";
  readonly signal?: AbortSignal;
  readonly timeoutMs?: number;
};

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
  const supervisor = process.platform === "win32" ? await windowsSupervisor() : undefined;
  options.signal?.throwIfAborted();
  const cancellation = `Local\\TeamagentOwned-${randomUUID()}`;
  const child = spawn(
    supervisor ?? command,
    supervisor ? [String(process.pid), cancellation, command, ...args] : [...args],
    {
      cwd: resolve(options.cwd),
      ...(options.env ? { env: options.env } : {}),
      stdio: options.stdio,
      shell: false,
      windowsHide: true,
      detached: process.platform !== "win32",
    },
  );
  const joined = Promise.withResolvers<OwnedExit>();
  let failure: Error | undefined;
  let complete = false;
  let stopping: Promise<void> | undefined;
  let timer: ReturnType<typeof setTimeout> | undefined;
  let forced = false;
  const fail = (error: unknown): void => {
    failure ??= error instanceof Error ? error : new Error("Owned process cleanup failed");
  };
  function finish(code: number | null, signal: NodeJS.Signals | null, confirmed: boolean): void {
    if (complete) return;
    complete = true;
    if (timer) clearTimeout(timer);
    options.signal?.removeEventListener("abort", abort);
    if (!confirmed) fail(new Error("Owned descendant shutdown could not be confirmed"));
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
    finish(child.exitCode, child.signalCode, false);
  }
  function killGroup(): void {
    if (child.pid === undefined) return;
    try {
      process.kill(-child.pid, "SIGKILL");
    } catch (error) {
      if (!hasCode(error, "ESRCH")) throw error;
    }
  }
  async function groupStopped(): Promise<boolean> {
    if (child.pid === undefined) return true;
    const deadline = performance.now() + 5000;
    while (performance.now() < deadline) {
      try {
        process.kill(-child.pid, 0);
      } catch (error) {
        return hasCode(error, "ESRCH");
      }
      await new Promise<void>((done) => setTimeout(done, 10));
    }
    return false;
  }
  function stop(reason = "Owned process cancelled"): Promise<void> {
    if (complete) return joined.promise.then(() => {});
    if (stopping) return stopping;
    failure ??= new Error(reason);
    stopping = (async () => {
      const force = setTimeout(endUnconfirmedTransport, 6000);
      try {
        try {
          if (supervisor) {
            const result = spawnSync(supervisor, ["--stop", cancellation], {
              shell: false,
              windowsHide: true,
              encoding: "utf8",
              timeout: 5000,
              maxBuffer: 8192,
            });
            if (result.error || result.status !== 0) {
              forced = true;
              child.kill("SIGKILL");
            }
          } else killGroup();
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
    if (!supervisor) {
      try {
        killGroup();
      } catch (error) {
        fail(error);
      }
    }
  });
  child.once("close", (code, signal) => {
    void (async () => {
      const confirmed = supervisor
        ? !forced && signal === null && code !== null && code >= 0 && code <= 255 && code !== 253
        : await groupStopped();
      finish(code, signal, confirmed);
    })().catch((error: unknown) => {
      fail(error);
      finish(code, signal, false);
    });
  });
  options.signal?.addEventListener("abort", abort, { once: true });
  if (options.signal?.aborted) abort();
  if (options.timeoutMs)
    timer = setTimeout(() => requestStop("Owned process timed out"), options.timeoutMs);
  return { child, closed: joined.promise, stop };
}
