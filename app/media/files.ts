import { createHash, randomUUID } from "node:crypto";

import { link, lstat, mkdir, mkdtemp, open, realpath } from "node:fs/promises";
import { dirname, extname, isAbsolute, join, relative, resolve } from "node:path";
import type { AudioFormat, MediaArtifact, PcmAudio } from "@/media";
import { MediaHostFailure } from "./transport.ts";

export const digest = (bytes: Uint8Array): string =>
  createHash("sha256").update(bytes).digest("hex");
export function contained(root: string, path: string): boolean {
  const part = relative(root, path);
  return (
    part === "" ||
    (!isAbsolute(part) && part !== ".." && !part.startsWith("../") && !part.startsWith("..\\"))
  );
}
export async function regularFile(path: string): Promise<boolean> {
  try {
    const info = await lstat(path);
    return info.isFile() && !info.isSymbolicLink();
  } catch {
    return false;
  }
}
export async function executable(path: string): Promise<string | null> {
  const found = isAbsolute(path) || /[\\/]/.test(path) ? path : Bun.which(path);
  if (
    found === null ||
    /[\\/]\.?(?:mise[\\/])?shims[\\/]/i.test(found) ||
    !(await regularFile(found))
  )
    return null;
  return realpath(found);
}
export async function readBytes(
  path: string,
  limit: number,
  signal: AbortSignal,
  root?: string,
): Promise<Uint8Array> {
  signal.throwIfAborted();
  const before = await lstat(path);
  if (!before.isFile() || before.isSymbolicLink() || before.size === 0 || before.size > limit)
    throw new MediaHostFailure(
      "limit",
      "Media input must be a nonempty regular file within the byte limit.",
    );
  const handle = await open(path, "r");
  try {
    const info = await handle.stat();
    if (info.dev !== before.dev || info.ino !== before.ino || info.size !== before.size)
      throw new MediaHostFailure("conflict", "Media input changed while opening.");
    if (root !== undefined) {
      await validateInputPath(root, path);
      const current = await lstat(path);
      if (current.dev !== info.dev || current.ino !== info.ino)
        throw new MediaHostFailure("conflict", "Media input changed after opening.");
    }
    const output = Buffer.alloc(Math.min(limit + 1, info.size + 1));
    let size = 0;
    while (size < output.byteLength) {
      signal.throwIfAborted();
      const chunk = await handle.read(output, size, output.byteLength - size, size);
      if (chunk.bytesRead === 0) break;
      size += chunk.bytesRead;
    }
    const after = await handle.stat();
    if (
      size > limit ||
      size !== after.size ||
      info.mtimeMs !== after.mtimeMs ||
      info.ctimeMs !== after.ctimeMs
    )
      throw new MediaHostFailure("conflict", "Media input changed during retrieval.");
    return output.subarray(0, size);
  } finally {
    await handle.close();
  }
}
async function validateInputPath(root: string, path: string): Promise<void> {
  if (!contained(root, path))
    throw new MediaHostFailure("invalid", "Media input is outside its configured root.");
  let current = root;
  for (const part of relative(root, path).split(/[\\/]/).filter(Boolean)) {
    current = join(current, part);
    if ((await lstat(current)).isSymbolicLink())
      throw new MediaHostFailure("invalid", "Media input contains a symbolic link.");
  }
  if (!contained(root, await realpath(path)))
    throw new MediaHostFailure("invalid", "Media input resolves outside its configured root.");
}
export interface MediaFile {
  readonly path: string;
  readonly bytes: Uint8Array;
  readonly sha256: string;
  readonly extension: string;
}
export async function readInput(
  root: string,
  input: string,
  limit: number,
  signal: AbortSignal,
): Promise<MediaFile> {
  if (/^[a-z][a-z0-9+.-]*:\/\//i.test(input))
    throw new MediaHostFailure("invalid", "Media input must be a local file.");
  const path = resolve(root, input);
  await validateInputPath(root, path);
  const bytes = await readBytes(path, limit, signal, root);
  const extension = extname(path).toLowerCase();
  return {
    path,
    bytes,
    sha256: digest(bytes),
    extension: /^\.[a-z0-9]{1,8}$/.test(extension) ? extension : ".bin",
  };
}
export async function createMediaStaging(root: string): Promise<string> {
  await mkdir(root, { recursive: true });
  const info = await lstat(root);
  if (!info.isDirectory() || info.isSymbolicLink())
    throw new MediaHostFailure("invalid", "Media output root must be a regular directory.");
  return mkdtemp(join(await realpath(root), ".media-"));
}
export async function outputPath(
  root: string,
  requested: string | undefined,
  format: AudioFormat,
): Promise<string> {
  const path = resolve(root, requested ?? randomUUID() + "." + format);
  if (!contained(root, path) || path === root)
    throw new MediaHostFailure("invalid", "Media output is outside its configured root.");
  const parent = dirname(path);
  // Require an existing parent and reject every symlink below the configured output root.
  for (
    let current = parent;
    contained(root, current) && current !== root;
    current = dirname(current)
  ) {
    if ((await lstat(current)).isSymbolicLink())
      throw new MediaHostFailure("invalid", "Media output contains a symbolic link.");
  }
  if (!contained(root, await realpath(parent)))
    throw new MediaHostFailure("invalid", "Media output resolves outside its configured root.");
  try {
    await lstat(path);
  } catch (error: unknown) {
    if (error instanceof Error && "code" in error && error.code === "ENOENT") return path;
    throw error;
  }
  throw new MediaHostFailure("conflict", "Media output already exists.");
}
export const audioMime: Readonly<Record<AudioFormat, string>> = {
  wav: "audio/wav",
  mp3: "audio/mpeg",
  flac: "audio/flac",
  ogg: "audio/ogg",
  opus: "audio/ogg",
  m4a: "audio/mp4",
  pcm: "audio/pcm",
};
export function verifyAudio(bytes: Uint8Array, format: AudioFormat): void {
  const head = Buffer.from(bytes.subarray(0, 16)).toString("latin1");
  const valid =
    format === "wav"
      ? head.startsWith("RIFF") && head.slice(8, 12) === "WAVE"
      : format === "flac"
        ? head.startsWith("fLaC")
        : format === "ogg" || format === "opus"
          ? head.startsWith("OggS")
          : format === "m4a"
            ? head.slice(4, 8) === "ftyp"
            : format === "mp3"
              ? head.startsWith("ID3") || (bytes[0] === 255 && ((bytes[1] ?? 0) & 224) === 224)
              : bytes.length > 0 && bytes.length % 2 === 0;
  if (!valid)
    throw new MediaHostFailure("io", "Media output does not match its declared audio format.");
}
export async function publishAudio(
  stage: string,
  destination: string,
  format: AudioFormat,
  limit: number,
  signal: AbortSignal,
  pcm?: PcmAudio,
): Promise<MediaArtifact> {
  const bytes = await readBytes(stage, limit, signal);
  verifyAudio(bytes, format);
  if (
    (format === "pcm") !== (pcm !== undefined) ||
    (pcm !== undefined && bytes.byteLength % (2 * pcm.channels) !== 0)
  )
    throw new MediaHostFailure(
      "io",
      "Raw PCM requires explicit format metadata and complete channel frames.",
    );
  signal.throwIfAborted();
  const ready = join(dirname(stage), "publish-" + randomUUID());
  try {
    const file = await open(ready, "wx", 0o600);
    try {
      await file.writeFile(bytes);
      await file.sync();
    } finally {
      await file.close();
    }
    signal.throwIfAborted();
    // Atomic no-replace publication on the same filesystem. Failed writes remain only in owned staging.
    await link(ready, destination);
  } catch (error: unknown) {
    if (error instanceof Error && "code" in error && error.code === "EEXIST")
      throw new MediaHostFailure("conflict", "Media output already exists.");
    throw new MediaHostFailure(
      "io",
      "Media output could not be published atomically; its destination was not overwritten.",
    );
  }
  return {
    path: destination,
    mimeType: audioMime[format],
    sha256: digest(bytes),
    sizeBytes: bytes.byteLength,
    ...(pcm === undefined ? {} : { pcm }),
  };
}
