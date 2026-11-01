import { execFile } from "node:child_process";
import { createHash, randomUUID } from "node:crypto";
import { constants } from "node:fs";
import { lstat, mkdir, open, opendir, realpath, unlink, link } from "node:fs/promises";
import { dirname, isAbsolute, join, relative, resolve, sep } from "node:path";
import { Effect, Schema } from "effect";
import { DependencyError, dependencyLimits } from "./model.ts";

export const digest = (value: Uint8Array | string): string =>
  createHash("sha256").update(value).digest("hex");

export function dependencyFailure(error: unknown): DependencyError {
  return error instanceof DependencyError
    ? error
    : new DependencyError({
        code: "io",
        message: "Dependency operation failed; private diagnostics are not exposed.",
      });
}

export function checkedPath(root: string, value: string): string {
  if (value.length > 4096)
    throw new DependencyError({ code: "limit", message: "Dependency path is too long." });
  const path = resolve(root, value);
  const part = relative(root, path);
  if (part === "" || part === ".." || part.startsWith(`..${sep}`) || isAbsolute(part))
    throw new DependencyError({
      code: "invalid",
      message: "Dependency path must remain inside the project.",
    });
  return path;
}

export async function regularPath(
  root: string,
  path: string,
  createParents = false,
): Promise<void> {
  const target = checkedPath(root, path);
  const parts = relative(root, target).split(sep);
  if (parts.length > 32)
    throw new DependencyError({ code: "limit", message: "Dependency path is too deep." });
  let cursor = root;
  const rootInfo = await lstat(root);
  if (
    !rootInfo.isDirectory() ||
    rootInfo.isSymbolicLink() ||
    resolve(await realpath(root)) !== resolve(root)
  )
    throw new DependencyError({
      code: "invalid",
      message: "Dependency root must be a canonical regular directory.",
    });
  for (const [index, part] of parts.entries()) {
    cursor = join(cursor, part);
    const final = index === parts.length - 1;
    let info;
    try {
      info = await lstat(cursor);
    } catch (error) {
      if (!Schema.is(Schema.Struct({ code: Schema.Literal("ENOENT") }))(error)) throw error;
      if (final) return;
      if (!createParents) throw error;
      await mkdir(cursor);
      info = await lstat(cursor);
    }
    if (
      info.isSymbolicLink() ||
      resolve(await realpath(cursor)) !== resolve(cursor) ||
      (!final && !info.isDirectory())
    )
      throw new DependencyError({
        code: "invalid",
        message: "Dependency paths cannot contain links or non-directory ancestors.",
      });
  }
}

export async function readBounded(
  root: string,
  value: string,
  limit: number = dependencyLimits.inputBytes,
): Promise<Uint8Array> {
  const path = checkedPath(root, value);
  await regularPath(root, path);
  const handle = await open(path, constants.O_RDONLY | constants.O_NOFOLLOW);
  try {
    const info = await handle.stat();
    if (!info.isFile() || info.size > limit)
      throw new DependencyError({
        code: "limit",
        message: "Dependency input is not a regular bounded file.",
      });
    const buffer = new Uint8Array(limit + 1);
    let length = 0;
    while (length < buffer.length) {
      const result = await handle.read(buffer, length, buffer.length - length, null);
      if (result.bytesRead === 0) break;
      length += result.bytesRead;
    }
    if (length > limit)
      throw new DependencyError({
        code: "limit",
        message: "Dependency input exceeded its byte limit while reading.",
      });
    return buffer.slice(0, length);
  } finally {
    await handle.close();
  }
}

export function utf8(value: Uint8Array): string {
  try {
    return new TextDecoder("utf-8", { fatal: true }).decode(value);
  } catch {
    throw new DependencyError({ code: "invalid", message: "Dependency text must be valid UTF-8." });
  }
}

export function json(value: Uint8Array): unknown {
  try {
    return Schema.decodeUnknownSync(Schema.fromJsonString(Schema.Unknown))(utf8(value));
  } catch {
    throw new DependencyError({
      code: "invalid",
      message: "Dependency input must contain valid JSON.",
    });
  }
}

/** Complete bytes publish exclusively; an interrupted staging file is never a valid receipt. */
function outputPath(root: string, value: string): string {
  const path = checkedPath(root, value);
  const part = relative(root, path).split(sep).join("/");
  if (!part.startsWith(".cache/dependencies/"))
    throw new DependencyError({
      code: "invalid",
      message: "Dependency outputs must be inside .cache/dependencies/.",
    });
  return path;
}

async function cacheBudget(root: string, addition: number): Promise<void> {
  let entries = 0;
  let bytes = addition;
  const walk = async (path: string, depth: number): Promise<void> => {
    if (depth > 16)
      throw new DependencyError({
        code: "limit",
        message: "Dependency cache depth limit exceeded.",
      });
    const directory = await opendir(path);
    for await (const entry of directory) {
      entries++;
      if (entries > 4096)
        throw new DependencyError({
          code: "limit",
          message: "Dependency cache entry limit exceeded; archive reviewed old receipts.",
        });
      const child = join(path, entry.name);
      await regularPath(root, child);
      const info = await lstat(child);
      if (info.isDirectory()) await walk(child, depth + 1);
      else if (info.isFile()) bytes += info.size;
      else
        throw new DependencyError({
          code: "invalid",
          message: "Dependency cache contains an unsupported entry.",
        });
      if (bytes > 67_108_864)
        throw new DependencyError({
          code: "limit",
          message: "Dependency cache byte limit exceeded; archive reviewed old receipts.",
        });
    }
  };
  await walk(checkedPath(root, ".cache/dependencies"), 0);
}

export async function publish(root: string, value: string, bytes: Uint8Array): Promise<string> {
  if (bytes.byteLength > dependencyLimits.processBytes)
    throw new DependencyError({ code: "limit", message: "Dependency output byte limit exceeded." });
  const path = outputPath(root, value);
  const part = relative(root, path).split(sep).join("/");
  await regularPath(root, path, true);
  await cacheBudget(root, bytes.byteLength);
  const temporary = join(dirname(path), `.pending-${randomUUID()}`);
  const handle = await open(temporary, "wx", 0o600);
  try {
    try {
      await handle.writeFile(bytes);
      await handle.sync();
    } finally {
      await handle.close();
    }
    await link(temporary, path);
  } finally {
    await unlink(temporary);
  }
  return part;
}

export async function publishJson(root: string, path: string, value: unknown): Promise<string> {
  const text = JSON.stringify(value, null, 2) + "\n";
  return publish(root, path, new TextEncoder().encode(text));
}

export interface CommandResult {
  readonly status: number | null;
  readonly stdout: Uint8Array;
  readonly stderr: Uint8Array;
  readonly uncertain: boolean;
}
export interface CommandRequest {
  readonly executable: "aube" | "git";
  /** Trusted host-resolved Aube path; command JSON never selects an executable. */
  readonly physicalExecutable?: string;
  readonly arguments: readonly string[];
  readonly cwd: string;
  readonly timeoutMs: number;
  readonly bytes: number;
  readonly signal: AbortSignal;
  readonly isolatedGit?: boolean;
}
export type CommandRunner = (request: CommandRequest) => Promise<CommandResult>;

function commandEnvironment(git: boolean): NodeJS.ProcessEnv {
  if (!git) return { ...process.env, NO_COLOR: "1", CI: "true" };
  const env: NodeJS.ProcessEnv = {};
  for (const name of ["PATH", "SystemRoot", "SYSTEMROOT", "WINDIR", "TEMP", "TMP", "LANG"])
    if (process.env[name] !== undefined) env[name] = process.env[name];
  return {
    ...env,
    GIT_CONFIG_NOSYSTEM: "1",
    GIT_CONFIG_GLOBAL: process.platform === "win32" ? "NUL" : "/dev/null",
    GIT_TERMINAL_PROMPT: "0",
    GCM_INTERACTIVE: "Never",
    GIT_NO_LAZY_FETCH: "1",
    GIT_OPTIONAL_LOCKS: "0",
  };
}

export const runCommand: CommandRunner = (request) => {
  const executable =
    request.executable === "aube" ? request.physicalExecutable : request.executable;
  if (
    !executable ||
    (request.executable === "aube" && !isAbsolute(executable)) ||
    (request.executable === "git" && request.physicalExecutable !== undefined)
  )
    return Promise.reject(
      new DependencyError({
        code: "blocked",
        message:
          "Dependency commands require a host-resolved absolute Aube path or the fixed Git operation.",
      }),
    );
  return new Promise((done) => {
    execFile(
      executable,
      [...request.arguments],
      {
        cwd: request.cwd,
        encoding: "buffer",
        windowsHide: true,
        timeout: request.timeoutMs,
        maxBuffer: request.bytes,
        signal: request.signal,
        killSignal: "SIGKILL",
        env: commandEnvironment(request.isolatedGit === true),
      },
      (error, stdout, stderr) => {
        done({
          status: error === null ? 0 : typeof error.code === "number" ? error.code : null,
          stdout,
          stderr,
          uncertain: error !== null && (error.killed === true || typeof error.code !== "number"),
        });
      },
    );
  });
};

export function diagnostic(result: CommandResult) {
  return {
    status: result.status,
    uncertain: result.uncertain,
    stdoutBytes: result.stdout.byteLength,
    stderrBytes: result.stderr.byteLength,
    stdoutSha256: digest(result.stdout),
    stderrSha256: digest(result.stderr),
    providerCodes: [
      ...new Set(
        new TextDecoder().decode(result.stderr).match(/\bERR_AUBE_[A-Z0-9_]{1,80}\b/g) ?? [],
      ),
    ].slice(0, 16),
  };
}

/** Cancellation joins subprocess completion; uncertain mutations retain their lease. */
export function hostOperation<A>(
  work: (signal: AbortSignal) => Promise<A>,
): Effect.Effect<A, DependencyError> {
  return Effect.acquireUseRelease(
    Effect.sync(() => {
      const controller = new AbortController();
      const pending = Promise.resolve().then(() => {
        controller.signal.throwIfAborted();
        return work(controller.signal);
      });
      return { controller, pending };
    }),
    ({ pending }) => Effect.tryPromise({ try: () => pending, catch: dependencyFailure }),
    ({ controller, pending }) =>
      Effect.promise(async () => {
        controller.abort();
        await pending.catch(() => undefined);
      }),
  );
}

export async function reserveOutput(root: string, path: string): Promise<void> {
  const target = outputPath(root, path);
  await regularPath(root, target, true);
  try {
    await lstat(target);
    throw new DependencyError({
      code: "conflict",
      message: "Dependency output already exists; choose a new candidate path.",
    });
  } catch (error) {
    if (Schema.is(Schema.Struct({ code: Schema.Literal("ENOENT") }))(error)) return;
    throw error;
  }
}

export async function acquireLease(root: string, receipt: string): Promise<() => Promise<void>> {
  const path = checkedPath(root, ".cache/dependencies/active.json");
  await regularPath(root, path, true);
  const handle = await open(path, "wx", 0o600).catch(() => {
    throw new DependencyError({
      code: "conflict",
      message:
        "A dependency lease exists. Reconcile its owner, receipt and repository state before another apply; age alone cannot reclaim it.",
    });
  });
  const bytes = new TextEncoder().encode(
    JSON.stringify({ pid: process.pid, receipt, nonce: randomUUID() }) + "\n",
  );
  try {
    await handle.writeFile(bytes);
    await handle.sync();
  } finally {
    await handle.close();
  }
  return async () => {
    if (digest(await readBounded(root, path, 1024)) !== digest(bytes))
      throw new DependencyError({
        code: "conflict",
        message: "Dependency lease ownership changed; it was retained.",
      });
    await unlink(path);
  };
}
