import { Schema } from "effect";
import { MemoryError, type MemoryFile, type SourceVersion } from "@/memory";
import { digest, importLimits, safeRelative } from "./limits.ts";

/** Trusted host callback; returned bytes still cross a validated integrity boundary. */
export type PreviousFileReader = (
  version: SourceVersion,
  file: MemoryFile,
  signal: AbortSignal,
) => Promise<unknown>;

export async function readPreviousFile(
  version: SourceVersion,
  file: MemoryFile,
  read: PreviousFileReader,
  signal: AbortSignal,
): Promise<Uint8Array> {
  signal.throwIfAborted();
  if (
    !safeRelative(file.path) ||
    file.size > importLimits.fileBytes ||
    !version.files.some(
      (candidate) =>
        candidate.path === file.path &&
        candidate.sha256 === file.sha256 &&
        candidate.size === file.size &&
        candidate.origin === file.origin &&
        candidate.role === file.role &&
        candidate.mediaType === file.mediaType,
    )
  )
    throw new MemoryError({ code: "integrity", message: "Retained file identity is invalid." });
  let bytes: Uint8Array;
  try {
    bytes = Schema.decodeUnknownSync(Schema.Uint8Array)(await read(version, file, signal));
  } catch (error) {
    signal.throwIfAborted();
    if (error instanceof MemoryError) throw error;
    throw new MemoryError({
      code: "integrity",
      message: "Retained source bytes are unavailable or invalid.",
    });
  }
  signal.throwIfAborted();
  if (bytes.byteLength !== file.size || digest(bytes) !== file.sha256)
    throw new MemoryError({
      code: "integrity",
      message: "Retained source bytes failed size or checksum verification.",
    });
  return bytes;
}
