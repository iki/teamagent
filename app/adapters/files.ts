import { createHash, randomUUID } from "node:crypto";
import { link, lstat, open, opendir, realpath, rename, unlink } from "node:fs/promises";
import { dirname, isAbsolute, join, relative, resolve, sep } from "node:path";
import { Schema } from "effect";

export const FilePathSchema = Schema.String.check(Schema.isMinLength(1), Schema.isMaxLength(1000));
export const ReadFileSchema = Schema.Struct({ path: FilePathSchema });
export const WriteFileSchema = Schema.Struct({
  path: FilePathSchema,
  content: Schema.String.check(Schema.isMaxLength(128000)),
  expectedSha256: Schema.optional(Schema.String.check(Schema.isPattern(/^[a-f0-9]{64}$/))),
});
const excluded = new Set([
  ".git",
  ".env",
  ".ssh",
  ".aws",
  ".codex",
  ".teamagent",
  "node_modules",
  "target",
  "dist",
]);
const blocked = (name: string) =>
  excluded.has(name.toLowerCase()) || name.toLowerCase().startsWith(".env.");
export const hash = (bytes: Uint8Array) => createHash("sha256").update(bytes).digest("hex");

export async function safePath(root: string, input: string, newFile = false): Promise<string> {
  Schema.decodeUnknownSync(FilePathSchema)(input);
  if (
    isAbsolute(input) ||
    input.includes(":") ||
    input.split("").some((character) => character.charCodeAt(0) < 32)
  )
    throw new Error("Use a relative workspace path");
  const parts = input.replaceAll("\\", "/").split("/");
  if (
    parts.some(
      (part) =>
        !part ||
        part === "." ||
        part === ".." ||
        blocked(part) ||
        /[. ]$/.test(part) ||
        /^(con|prn|aux|nul|com[1-9]|lpt[1-9])(?:\.|$)/i.test(part),
    )
  )
    throw new Error("Path is outside the allowed file scope");
  const canonicalRoot = await realpath(root);
  if (relative(root, canonicalRoot) !== "") throw new Error("Registered workspace root changed");
  let current = canonicalRoot;
  for (const [index, part] of parts.entries()) {
    current = join(current, part);
    try {
      const info = await lstat(current);
      if (info.isSymbolicLink()) throw new Error("Symbolic links are outside the file scope");
      if (index < parts.length - 1 && !info.isDirectory())
        throw new Error("Parent is not a directory");
    } catch (error) {
      if (
        !(
          newFile &&
          index === parts.length - 1 &&
          error instanceof Error &&
          "code" in error &&
          error.code === "ENOENT"
        )
      )
        throw error;
    }
  }
  const inside = relative(canonicalRoot, resolve(current));
  if (!inside || inside.startsWith(`..${sep}`) || isAbsolute(inside))
    throw new Error("Path escapes workspace");
  return current;
}

export async function readWorkspaceFile(root: string, input: unknown, signal: AbortSignal) {
  const { path } = Schema.decodeUnknownSync(ReadFileSchema)(input, { onExcessProperty: "error" });
  signal.throwIfAborted();
  const file = await open(await safePath(root, path), "r");
  try {
    const info = await file.stat();
    if (!info.isFile() || info.size > 128000)
      throw new Error("File must be regular and at most 128000 bytes");
    const buffer = Buffer.alloc(128001);
    let size = 0;
    while (size < buffer.length) {
      signal.throwIfAborted();
      const result = await file.read(buffer, size, buffer.length - size, size);
      if (result.bytesRead === 0) break;
      size += result.bytesRead;
    }
    if (size > 128000) throw new Error("File grew beyond the byte limit");
    signal.throwIfAborted();
    const bytes = buffer.subarray(0, size);
    const content = new TextDecoder("utf-8", { fatal: true, ignoreBOM: true }).decode(bytes);
    if (content.includes("\0")) throw new Error("Binary files are not supported");
    return { path, content, sha256: hash(bytes) };
  } finally {
    await file.close();
  }
}

export async function listWorkspaceFiles(root: string, signal: AbortSignal) {
  const files: string[] = [];
  const pending = [""];
  let directories = 0;
  let examined = 0;
  let omitted = false;
  while (pending.length > 0) {
    signal.throwIfAborted();
    const directory = pending.shift();
    if (directory === undefined) break;
    if (++directories > 128) {
      omitted = true;
      break;
    }
    const path = directory ? await safePath(root, directory) : await realpath(root);
    if (!directory && relative(root, path) !== "")
      throw new Error("Registered workspace root changed");
    const entries = await opendir(path);
    for await (const entry of entries) {
      signal.throwIfAborted();
      if (++examined > 8192) return { files: files.sort(), truncated: true };
      if (blocked(entry.name) || entry.isSymbolicLink()) continue;
      const name = directory ? `${directory}/${entry.name}` : entry.name;
      if (entry.isDirectory()) {
        if (name.split("/").length <= 4 && pending.length < 128) pending.push(name);
        else omitted = true;
      } else if (entry.isFile()) {
        files.push(name);
        if (files.length === 500) return { files: files.sort(), truncated: true };
      }
    }
  }
  return { files: files.sort(), truncated: omitted };
}

export async function writeWorkspaceFile(root: string, input: unknown, signal: AbortSignal) {
  const value = Schema.decodeUnknownSync(WriteFileSchema)(input, { onExcessProperty: "error" });
  const bytes = Buffer.from(value.content, "utf8");
  if (bytes.length > 128000) throw new Error("File exceeds 128000 bytes");
  const path = await safePath(root, value.path, true);
  signal.throwIfAborted();
  let exists = true;
  try {
    await lstat(path);
  } catch (error) {
    if (error instanceof Error && "code" in error && error.code === "ENOENT") exists = false;
    else throw error;
  }
  if (exists) {
    const previous = await readWorkspaceFile(root, { path: value.path }, signal);
    if (!value.expectedSha256 || previous.sha256 !== value.expectedSha256)
      throw new Error("Existing file changed; read it and supply its current sha256");
  } else if (value.expectedSha256) throw new Error("Expected file is missing");
  const temporary = join(dirname(path), `.teamagent-${randomUUID()}.tmp`);
  try {
    const file = await open(temporary, "wx", 0o600);
    try {
      await file.writeFile(bytes);
      await file.sync();
    } finally {
      await file.close();
    }
    signal.throwIfAborted();
    await safePath(root, value.path, true);
    // Recheck optimistic revision just before publication; this is not an OS sandbox.
    if (exists) {
      const previous = await readWorkspaceFile(root, { path: value.path }, signal);
      if (previous.sha256 !== value.expectedSha256)
        throw new Error("File changed before publication");
      await rename(temporary, path);
    } else {
      await link(temporary, path);
      await unlink(temporary);
    }
    return { path: value.path, sha256: hash(bytes), bytes: bytes.length };
  } catch (error) {
    await unlink(temporary).catch(() => undefined);
    throw error;
  }
}
