import { createHash, randomUUID } from "node:crypto";
import { link, lstat, mkdir, open, opendir, rename, unlink, writeFile } from "node:fs/promises";
import { dirname, join, relative, resolve, isAbsolute } from "node:path";
import { withMetadataLock } from "../check/metadata-lock.ts";

export const digest = (value: string | Uint8Array): string =>
  createHash("sha256").update(value).digest("hex");
export const lf = (value: string): string => value.replace(/\r\n?/gu, "\n");
export const taskKey = (session: string, task: string): string =>
  digest(JSON.stringify([session, task]));

/** Preserve evidence when full. Callers may lower the limits for deterministic fixtures. */
export async function workflowCapacity(
  root: string,
  reserveBytes = 0,
  limits: { bytes?: number; files?: number } = {},
): Promise<void> {
  const maximumBytes = limits.bytes ?? 256 * 1024 * 1024;
  const maximumFiles = limits.files ?? 20000;
  if (
    !Number.isSafeInteger(maximumBytes) ||
    maximumBytes < 1 ||
    maximumBytes > 256 * 1024 * 1024 ||
    !Number.isSafeInteger(maximumFiles) ||
    maximumFiles < 1 ||
    maximumFiles > 20000 ||
    !Number.isSafeInteger(reserveBytes) ||
    reserveBytes < 0
  )
    throw new Error("Invalid workflow cache bound");
  let bytes = reserveBytes,
    files = 1,
    directories = 0;
  const inspect = async (path: string, depth: number): Promise<void> => {
    if (depth > 4 || ++directories > 128)
      throw new Error(
        "Workflow cache directory limit reached; preserve and inspect existing evidence",
      );
    const entries = await opendir(path);
    for await (const entry of entries) {
      const target = join(path, entry.name);
      const info = await lstat(target);
      if (info.isSymbolicLink()) throw new Error("Linked workflow cache entry is unsupported");
      if (info.isDirectory()) await inspect(target, depth + 1);
      else if (info.isFile()) {
        files++;
        bytes += info.size;
      } else throw new Error("Unsupported workflow cache entry");
      if (files > maximumFiles || bytes > maximumBytes)
        throw new Error("Workflow cache capacity reached; existing evidence retained");
    }
  };
  const directory = await containedPath(root, ".cache/workflow");
  let exists = true;
  try {
    await lstat(directory);
  } catch (error) {
    if (error instanceof Error && "code" in error && error.code === "ENOENT") exists = false;
    else throw error;
  }
  if (exists) await inspect(directory, 0);
  if (files > maximumFiles || bytes > maximumBytes)
    throw new Error("Workflow cache capacity reached; existing evidence retained");
}

export async function boundedText(path: string, maximum = 8 * 1024 * 1024): Promise<string> {
  const info = await lstat(path);
  if (!info.isFile() || info.isSymbolicLink() || info.size > maximum)
    throw new Error("Invalid or oversized workflow file");
  const file = await open(path, "r");
  try {
    const bytes = new Uint8Array(Math.min(maximum, info.size) + 1);
    let length = 0;
    while (length < bytes.length) {
      const result = await file.read(bytes, length, bytes.length - length, null);
      if (result.bytesRead === 0) break;
      length += result.bytesRead;
    }
    if (length > info.size || length > maximum)
      throw new Error("Workflow file changed or limit exceeded");
    return new TextDecoder("utf-8", { fatal: true }).decode(bytes.subarray(0, length));
  } finally {
    await file.close();
  }
}

export async function containedPath(root: string, path: string): Promise<string> {
  if (
    !path ||
    /[\\:\0]/u.test(path) ||
    path.split("/").some((part) => !part || part === "." || part === "..")
  )
    throw new Error("Expected a contained relative path");
  const result = resolve(root, path);
  const child = relative(root, result);
  if (isAbsolute(child) || child.startsWith("..")) throw new Error("Path escapes repository");
  let cursor = root;
  for (const part of path.split("/")) {
    cursor = join(cursor, part);
    try {
      if ((await lstat(cursor)).isSymbolicLink())
        throw new Error("Linked workflow paths are not supported");
    } catch (error) {
      if (!(error instanceof Error && "code" in error && error.code === "ENOENT")) throw error;
    }
  }
  return result;
}

export async function atomicText(path: string, content: string): Promise<void> {
  await mkdir(dirname(path), { recursive: true });
  const temporary = path + "." + randomUUID() + ".tmp";
  await writeFile(temporary, lf(content), { flag: "wx", mode: 0o600 });
  try {
    for (const delay of [0, 10, 25, 50, 100, 200, 400]) {
      if (delay) await new Promise<void>((done) => setTimeout(done, delay));
      try {
        await rename(temporary, path);
        return;
      } catch (error) {
        if (
          !(
            process.platform === "win32" &&
            error instanceof Error &&
            "code" in error &&
            ["EPERM", "EACCES", "EBUSY"].includes(String(error.code))
          )
        )
          throw error;
      }
    }
    throw new Error("Atomic workflow publication failed; previous file retained");
  } finally {
    await unlink(temporary).catch(() => {});
  }
}

/** Publish a complete immutable receipt without ever replacing an existing name. */
export async function exclusiveText(path: string, content: string): Promise<void> {
  await mkdir(dirname(path), { recursive: true });
  const temporary = path + "." + randomUUID() + ".tmp";
  await writeFile(temporary, lf(content), { flag: "wx", mode: 0o600 });
  try {
    await link(temporary, path);
  } finally {
    await unlink(temporary).catch(() => {});
  }
}

/** Confirmed absent owners are retained in quarantine before a new exclusive acquisition. */
export async function withLock<T>(
  directory: string,
  action: () => Promise<T>,
  waitMs = 5000,
): Promise<T> {
  return withMetadataLock(directory, action, { waitMs });
}

/** Public archive and strict diagnostic directories retain recovery evidence in the project's owned cache. */
export async function withWorkflowLock<T>(
  root: string,
  directory: string,
  action: () => Promise<T>,
  waitMs = 5000,
): Promise<T> {
  const evidenceRoot = await containedPath(root, ".cache/workflow/.lock-recovery");
  return withMetadataLock(directory, action, { waitMs, evidenceRoot });
}
