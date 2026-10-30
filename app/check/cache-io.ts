/** Bounded host I/O for cooperative verification evidence; never publication authority. */
import { spawnSync } from "node:child_process";
import { createHash, randomUUID } from "node:crypto";
import { lstat, mkdir, open, readdir, rename, unlink } from "node:fs/promises";
import { hostname } from "node:os";
import { dirname, isAbsolute, relative, resolve } from "node:path";

export const cacheLimits = {
  files: 25_000,
  fileBytes: 64 * 1024 ** 2,
  totalBytes: 256 * 1024 ** 2,
  depth: 32,
  receiptBytes: 64 * 1024,
  outputFileBytes: 256 * 1024 ** 2,
};
export const cacheDirectory = ".cache/verification";
export const receiptDirectory = ".verification";
export const digest = (value: string | Uint8Array): string =>
  createHash("sha256").update(value).digest("hex");
export const encodedDigest = (value: unknown): string => digest(JSON.stringify(value));
export const hasCode = (error: unknown, code: string): boolean =>
  error instanceof Error && "code" in error && error.code === code;
export const slash = (path: string): string => path.replaceAll("\\", "/");
export const contains = (scope: string, path: string): boolean =>
  scope === "." || path === scope || path.startsWith(`${scope}/`);

function containsControlCharacter(value: string): boolean {
  for (let index = 0; index < value.length; index++) if (value.charCodeAt(index) < 32) return true;
  return false;
}

export function scopePath(path: string): string {
  const value = slash(path).replace(/^\.\//u, "").replace(/\/$/u, "");
  if (
    !value ||
    isAbsolute(path) ||
    value.includes(":") ||
    containsControlCharacter(value) ||
    value
      .split("/")
      .some(
        (part) =>
          !part ||
          part === ".." ||
          part.toLowerCase() === ".git" ||
          (part === "." && value !== ".") ||
          (part !== "." &&
            (/[. ]$/u.test(part) ||
              part !== part.trim() ||
              /^(?:con|prn|aux|nul|com[1-9]|lpt[1-9])(?:\.|$)/iu.test(part))),
      ) ||
    value.split("/").length > cacheLimits.depth ||
    contains(".git", value)
  )
    throw new Error("Cache paths must be bounded repository-relative paths without traversal");
  return value;
}

export function gitBytes(
  root: string,
  args: readonly string[],
  options: { readonly indexFile?: string; readonly input?: Uint8Array } = {},
): Uint8Array {
  const env = {
    ...process.env,
    GIT_OPTIONAL_LOCKS: "0",
    GIT_TERMINAL_PROMPT: "0",
    GCM_INTERACTIVE: "never",
    GIT_NO_LAZY_FETCH: "1",
  };
  for (const name of Object.keys(env))
    if (
      /^GIT_(?:DIR|WORK_TREE|INDEX_FILE|COMMON_DIR|OBJECT_DIRECTORY|ALTERNATE_OBJECT_DIRECTORIES|NAMESPACE|PREFIX|CONFIG(?:_.*)?|QUARANTINE_PATH|INTERNAL_SUPER_PREFIX|IMPLICIT_WORK_TREE|SHALLOW_FILE|GRAFT_FILE|REPLACE_REF_BASE)$/u.test(
        name,
      )
    )
      Reflect.deleteProperty(env, name);
  const result = spawnSync(
    "git",
    [
      "--no-optional-locks",
      "--no-pager",
      "-c",
      "core.fsmonitor=false",
      "-c",
      "core.untrackedCache=false",
      "-c",
      "core.quotePath=false",
      "-c",
      "log.showSignature=false",
      ...args,
    ],
    {
      cwd: root,
      env: { ...env, ...(options.indexFile ? { GIT_INDEX_FILE: resolve(options.indexFile) } : {}) },
      shell: false,
      windowsHide: true,
      timeout: 30_000,
      maxBuffer: 16 * 1024 ** 2,
      ...(options.input ? { input: options.input } : {}),
    },
  );
  if (result.error || result.status !== 0)
    throw new Error(
      `Verification Git inspection failed (exit ${result.status ?? "unavailable"}); no result can be reused`,
    );
  return result.stdout;
}
export const gitText = (
  root: string,
  args: readonly string[],
  options: { readonly indexFile?: string } = {},
): string => new TextDecoder("utf-8", { fatal: true }).decode(gitBytes(root, args, options));

/** No symlink/reparse traversal in owned source, receipt or output paths. */
export async function safePath(root: string, path: string, missing = false): Promise<string> {
  const normalized = scopePath(path);
  let target = resolve(root);
  if ((await lstat(target)).isSymbolicLink())
    throw new Error("Linked cache repository roots are unsupported");
  for (const part of normalized === "." ? [] : normalized.split("/")) {
    target = resolve(target, part);
    try {
      if ((await lstat(target)).isSymbolicLink())
        throw new Error(`Linked cache path is unsupported: ${normalized}`);
    } catch (error) {
      if (!(missing && hasCode(error, "ENOENT"))) throw error;
    }
  }
  const scoped = relative(resolve(root), target);
  if (isAbsolute(scoped) || scoped.startsWith(".."))
    throw new Error("Cache path escaped the repository");
  return target;
}

export async function boundedRead(
  root: string,
  path: string,
  maximum = cacheLimits.fileBytes,
): Promise<Uint8Array> {
  const target = await safePath(root, path);
  const handle = await open(target, "r");
  try {
    const before = await handle.stat();
    if (!before.isFile() || before.size > maximum)
      throw new Error(`Cache input exceeds file bounds: ${path}`);
    const bytes = new Uint8Array(before.size);
    let offset = 0;
    while (offset < bytes.length) {
      const read = await handle.read(
        bytes,
        offset,
        Math.min(64 * 1024, bytes.length - offset),
        offset,
      );
      if (!read.bytesRead) throw new Error(`Cache input changed while reading: ${path}`);
      offset += read.bytesRead;
    }
    const after = await handle.stat();
    if (
      before.size !== after.size ||
      before.mtimeMs !== after.mtimeMs ||
      before.ctimeMs !== after.ctimeMs
    )
      throw new Error(`Cache input changed while reading: ${path}`);
    return bytes;
  } finally {
    await handle.close();
  }
}

export async function inventory(
  root: string,
  paths: readonly string[],
  required = false,
): Promise<string> {
  const rows: Array<readonly [string, string, string]> = [];
  let bytes = 0;
  const visited = new Set<string>();
  async function visit(path: string, depth: number): Promise<void> {
    if (visited.has(path)) return;
    visited.add(path);
    if (visited.size > cacheLimits.files || depth > cacheLimits.depth)
      throw new Error("Cache inventory exceeded path bounds");
    let stat;
    try {
      stat = await lstat(await safePath(root, path));
    } catch (error) {
      if (!hasCode(error, "ENOENT")) throw error;
      if (required) throw new Error(`Required cache output is missing: ${path}`);
      rows.push([path, "missing", ""]);
      return;
    }
    if (stat.isDirectory()) {
      rows.push([path, "directory", ""]);
      const children = await readdir(resolve(root, path));
      if (children.length + visited.size > cacheLimits.files)
        throw new Error("Cache inventory exceeded path bounds");
      for (const name of children.sort()) await visit(scopePath(`${path}/${name}`), depth + 1);
    } else {
      if (!stat.isFile()) throw new Error(`Unsupported cache inventory entry: ${path}`);
      bytes += stat.size;
      if (bytes > cacheLimits.totalBytes) throw new Error("Cache inventory exceeded byte bounds");
      rows.push([
        path,
        process.platform === "win32" ? "file" : String(stat.mode & 0o777),
        await fileDigest(root, path, cacheLimits.outputFileBytes),
      ]);
    }
  }
  for (const path of [...new Set(paths.map(scopePath))].sort()) await visit(path, 0);
  return encodedDigest(rows);
}

export async function fileDigest(root: string, path: string, maximum: number): Promise<string> {
  const handle = await open(await safePath(root, path), "r");
  try {
    const before = await handle.stat();
    if (!before.isFile() || before.size > maximum)
      throw new Error(`Cache file exceeds byte bound: ${path}`);
    const hash = createHash("sha256"),
      chunk = new Uint8Array(64 * 1024);
    let size = 0;
    for (;;) {
      const read = await handle.read(chunk, 0, chunk.length, size);
      if (!read.bytesRead) break;
      size += read.bytesRead;
      if (size > maximum) throw new Error(`Cache file grew beyond byte bound: ${path}`);
      hash.update(chunk.subarray(0, read.bytesRead));
    }
    const after = await handle.stat();
    if (
      size !== before.size ||
      before.size !== after.size ||
      before.mtimeMs !== after.mtimeMs ||
      before.ctimeMs !== after.ctimeMs
    )
      throw new Error(`Cache file changed during inspection: ${path}`);
    return hash.digest("hex");
  } finally {
    await handle.close();
  }
}

export async function atomicJson(root: string, path: string, value: unknown): Promise<void> {
  await atomicWrite(root, path, new TextEncoder().encode(`${JSON.stringify(value)}\n`));
}

/** Preserve a validated receipt snapshot without changing its JSON representation. */
export async function atomicReceiptText(
  root: string,
  path: string,
  bytes: Uint8Array,
): Promise<void> {
  if (bytes.length > cacheLimits.receiptBytes)
    throw new Error("Verification receipt exceeds byte bound");
  if (new TextDecoder("utf-8", { fatal: true }).decode(bytes).includes("\r"))
    throw new Error("Verification receipt promotion requires LF text");
  await atomicWrite(root, path, bytes);
}

async function atomicWrite(root: string, path: string, bytes: Uint8Array): Promise<void> {
  const destination = await safePath(root, path, true);
  await mkdir(dirname(destination), { recursive: true });
  await safePath(root, path, true);
  const temporaryPath = `${path}.${randomUUID()}.tmp`;
  const temporary = await safePath(root, temporaryPath, true);
  const handle = await open(temporary, "wx", 0o600);
  try {
    await handle.writeFile(bytes);
    await handle.sync();
  } finally {
    await handle.close();
  }
  try {
    for (let attempt = 0; ; attempt++) {
      try {
        await rename(temporary, destination);
        break;
      } catch (error) {
        if (attempt >= 4 || !["EBUSY", "EPERM", "EACCES"].some((code) => hasCode(error, code)))
          throw error;
        await new Promise<void>((done) => setTimeout(done, 20 * (attempt + 1)));
      }
    }
  } finally {
    await unlink(temporary).catch((error: unknown) => {
      if (!hasCode(error, "ENOENT")) throw error;
    });
  }
}

/** Fail closed on live, dead or foreign leftover locks; age never authorizes stealing. */
export async function withCacheLock<T>(
  root: string,
  id: string,
  run: () => Promise<T>,
  options: { readonly waitMs?: number } = {},
): Promise<T> {
  const waitMs = options.waitMs ?? 5_000;
  if (!Number.isFinite(waitMs) || waitMs < 0 || waitMs > 5_000)
    throw new Error("Cache lock wait must be between zero and 5000 ms");
  const directory = await safePath(root, cacheDirectory, true);
  await mkdir(directory, { recursive: true });
  const path = `${cacheDirectory}/${id}.lock`;
  const token = randomUUID();
  const owner = `${JSON.stringify({ pid: process.pid, hostname: hostname(), token })}\n`;
  const started = performance.now();
  for (;;) {
    try {
      const handle = await open(await safePath(root, path, true), "wx", 0o600);
      try {
        await handle.writeFile(owner, "utf8");
      } finally {
        await handle.close();
      }
      break;
    } catch (error) {
      if (!hasCode(error, "EEXIST")) throw error;
      if (performance.now() - started >= waitMs)
        throw new Error(
          `Verification cache is locked: ${path}. Inspect ownership before explicit recovery; lock age is not permission to reclaim it.`,
        );
      await new Promise<void>((done) => setTimeout(done, 50));
    }
  }
  const release = async (): Promise<void> => {
    const current = new TextDecoder().decode(await boundedRead(root, path, 4096));
    if (current !== owner) throw new Error("Verification cache lock ownership changed");
    await unlink(await safePath(root, path));
  };
  try {
    return await run();
  } finally {
    await release();
  }
}
