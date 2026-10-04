import { lstat, open, opendir, realpath } from "node:fs/promises";
import { basename, join, relative, resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import type { CaptureRequest, CapturedFile } from "@/memory";
import { contained, excludedName, importLimits, safeRelative, sourceMediaType } from "./limits.ts";

export async function authorizeLocal(
  input: string,
  request: CaptureRequest,
  allowedRoots?: readonly string[],
): Promise<string> {
  const path = input.startsWith("file:")
    ? fileURLToPath(input)
    : resolve(request.workspaceRoot, input);
  if ((await lstat(path)).isSymbolicLink())
    throw new Error("Symbolic link sources are not supported");
  const canonical = await realpath(path);
  const privateRoot = await realpath(request.dataDirectory);
  if (contained(privateRoot, canonical))
    throw new Error("A source cannot overlap private harness data");
  if (canonical.split(/[\\/]/).some(excludedName))
    throw new Error("Source is inside an excluded private or generated directory");
  if (allowedRoots !== undefined) {
    const roots = await Promise.all(allowedRoots.map((root) => realpath(root)));
    if (!roots.some((root) => contained(root, canonical)))
      throw new Error("Source is outside configured import roots");
  }
  return canonical;
}

export async function readLocalFile(
  path: string,
  signal: AbortSignal,
): Promise<{ bytes: Uint8Array; modified: string }> {
  signal.throwIfAborted();
  const before = await lstat(path);
  if (!before.isFile() || before.isSymbolicLink() || before.size > importLimits.fileBytes)
    throw new Error("Source must be a regular file within the import byte limit");
  const file = await open(path, "r");
  try {
    const info = await file.stat();
    if (
      !info.isFile() ||
      info.size > importLimits.fileBytes ||
      before.dev !== info.dev ||
      before.ino !== info.ino
    )
      throw new Error("Source changed while opening");
    const buffer = Buffer.alloc(importLimits.fileBytes + 1);
    let size = 0;
    while (size < buffer.byteLength) {
      signal.throwIfAborted();
      const result = await file.read(buffer, size, buffer.byteLength - size, size);
      if (result.bytesRead === 0) break;
      size += result.bytesRead;
    }
    const after = await file.stat();
    if (
      size > importLimits.fileBytes ||
      after.size !== size ||
      info.mtimeMs !== after.mtimeMs ||
      info.ctimeMs !== after.ctimeMs
    )
      throw new Error("Source changed during retrieval");
    return { bytes: buffer.subarray(0, size), modified: after.mtime.toISOString() };
  } finally {
    await file.close();
  }
}

export async function collectFolder(
  root: string,
  signal: AbortSignal,
  privateRoot: string,
): Promise<{ files: CapturedFile[]; warnings: string[]; modified: string | null }> {
  const files: CapturedFile[] = [];
  const warnings: string[] = [];
  let entries = 0;
  let directories = 0;
  let bytes = 0;
  let modified: string | null = null;
  const pending = [{ path: root, depth: 0 }];
  while (pending.length > 0) {
    const current = pending.shift();
    if (current === undefined) break;
    signal.throwIfAborted();
    directories += 1;
    if (directories > importLimits.directories || current.depth > importLimits.depth)
      throw new Error("Folder depth or directory limit exceeded");
    if (
      (await lstat(current.path)).isSymbolicLink() ||
      !contained(root, await realpath(current.path))
    )
      throw new Error("Folder changed outside source scope");
    const directory = await opendir(current.path);
    for await (const entry of directory) {
      entries += 1;
      if (entries > importLimits.entries) throw new Error("Folder entry limit exceeded");
      const full = join(current.path, entry.name);
      const path = relative(root, full).replaceAll("\\", "/");
      if (
        excludedName(entry.name) ||
        !safeRelative(path) ||
        entry.isSymbolicLink() ||
        contained(privateRoot, full)
      ) {
        if (warnings.length < 255) warnings.push(`Excluded source entry: ${path.slice(0, 1000)}`);
        else throw new Error("Exclusion manifest limit exceeded");
        continue;
      }
      if (entry.isDirectory()) pending.push({ path: full, depth: current.depth + 1 });
      else if (entry.isFile()) {
        if (files.length >= importLimits.files) throw new Error("Folder file limit exceeded");
        if (!contained(root, await realpath(full)))
          throw new Error("File changed outside source scope");
        const file = await readLocalFile(full, signal);
        bytes += file.bytes.byteLength;
        if (bytes > importLimits.totalBytes) throw new Error("Folder total byte limit exceeded");
        if (modified === null || file.modified > modified) modified = file.modified;
        files.push({
          path: `original/${path}`,
          mediaType: sourceMediaType(path, file.bytes),
          bytes: file.bytes,
          role: "original",
          origin: pathToFileURL(full).href,
        });
      } else warnings.push(`Unsupported source entry: ${path.slice(0, 1000)}`);
    }
  }
  files.sort((a, b) => a.path.localeCompare(b.path, "en"));
  return { files, warnings, modified };
}

export function originalName(path: string): string {
  const name = basename(path);
  return safeRelative(name) ? name : "source.bin";
}
