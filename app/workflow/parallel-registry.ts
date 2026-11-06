import { lstat, opendir } from "node:fs/promises";
import { join } from "node:path";
import { boundedText } from "./storage.ts";

/** Inspect only owned metadata, never unrelated Git state or source worktrees. */
export async function inspectParallelRegistry(
  directory: string,
  reserveBytes = 0,
  limits: { bytes?: number; files?: number } = {},
): Promise<void> {
  const maximumBytes = limits.bytes ?? 64 * 1024 * 1024;
  const maximumFiles = limits.files ?? 20000;
  if (
    !Number.isSafeInteger(maximumBytes) ||
    maximumBytes < 1 ||
    maximumBytes > 64 * 1024 * 1024 ||
    !Number.isSafeInteger(maximumFiles) ||
    maximumFiles < 1 ||
    maximumFiles > 20000 ||
    !Number.isSafeInteger(reserveBytes) ||
    reserveBytes < 0
  )
    throw new Error("Invalid parallel registry capacity bound");
  let bytes = reserveBytes,
    files = reserveBytes > 0 ? 2 : 0,
    directories = 0;
  const capacity = (): void => {
    if (bytes > maximumBytes || files > maximumFiles)
      throw new Error("Parallel registry capacity exceeded; preserve all existing evidence");
  };
  capacity();
  const visit = async (path: string, depth: number): Promise<void> => {
    if (depth > 3 || ++directories > 4096)
      throw new Error("Parallel registry directory capacity exceeded");
    const entries = await opendir(path);
    for await (const entry of entries) {
      const target = join(path, entry.name);
      const info = await lstat(target);
      if (info.isSymbolicLink())
        throw new Error("Linked parallel registry metadata is unsupported");
      if (info.isDirectory()) await visit(target, depth + 1);
      else if (info.isFile()) {
        files++;
        bytes += info.size;
        capacity();
        if ((await boundedText(target, 16384)).includes("\r"))
          throw new Error("Parallel registry metadata must use LF");
      } else throw new Error("Unsupported parallel registry metadata");
    }
  };
  try {
    const info = await lstat(directory);
    if (!info.isDirectory() || info.isSymbolicLink())
      throw new Error("Parallel registry must be a physical directory");
  } catch (error) {
    if (error instanceof Error && "code" in error && error.code === "ENOENT") return;
    throw error;
  }
  await visit(directory, 0);
}
