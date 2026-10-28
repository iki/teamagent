import { createHash } from "node:crypto";
import { Schema } from "effect";
import {
  MemoryFileSchema,
  MemoryPathSchema,
  MemorySourceSchema,
  Sha256Schema,
  SourceVersionSchema,
  memoryLimits,
  type MemoryFile,
} from "@/memory";

export const textNormalizationPolicy = "utf8-lf-v1";
export const normalizeLf = (text: string): string => text.replace(/\r\n?/g, "\n");

const NormalizedFileSchema = Schema.Struct({
  path: MemoryPathSchema,
  sourceSha256: Sha256Schema,
  sourceSize: MemoryFileSchema.fields.size,
  sha256: Sha256Schema,
  size: MemoryFileSchema.fields.size,
});
export type NormalizedExportFile = typeof NormalizedFileSchema.Type;
const exportFields = { source: MemorySourceSchema, version: SourceVersionSchema };
export const MemoryExportManifestSchema = Schema.Union([
  Schema.Struct({ format: Schema.Literal("teamagent-memory-export-v1"), ...exportFields }),
  Schema.Struct({
    format: Schema.Literal("teamagent-memory-export-v2"),
    ...exportFields,
    normalization: Schema.Struct({
      policy: Schema.Literal(textNormalizationPolicy),
      files: Schema.Array(NormalizedFileSchema).check(
        Schema.isMaxLength(memoryLimits.captureFiles),
      ),
    }),
  }),
]);
export type MemoryExportManifest = typeof MemoryExportManifestSchema.Type;

const checksum = (bytes: Uint8Array): string => createHash("sha256").update(bytes).digest("hex");

/** Only declared UTF-8 text without NUL is eligible; opaque and binary media bytes stay exact. */
export function normalizedExportText(bytes: Uint8Array, mediaType: string): Uint8Array | undefined {
  const type = mediaType.split(";")[0]?.trim().toLowerCase() ?? "";
  if (
    !type.startsWith("text/") &&
    type !== "image/svg+xml" &&
    !/^application\/(?:json|xml|javascript|x-javascript|[^/]+\+json|[^/]+\+xml)$/.test(type)
  )
    return undefined;
  let text: string;
  try {
    text = new TextDecoder("utf-8", { fatal: true, ignoreBOM: true }).decode(bytes);
  } catch {
    return undefined;
  }
  if (text.includes("\0")) return undefined;
  return text.includes("\r") ? new TextEncoder().encode(normalizeLf(text)) : bytes;
}

export function exportFileRepresentation(file: MemoryFile, bytes: Uint8Array) {
  if (bytes.byteLength !== file.size || checksum(bytes) !== file.sha256)
    throw new Error("Export source bytes differ from their immutable manifest.");
  const normalized = normalizedExportText(bytes, file.mediaType);
  if (normalized === undefined || normalized === bytes) return { bytes, normalization: undefined };
  const normalization: NormalizedExportFile = {
    path: file.path,
    sourceSha256: file.sha256,
    sourceSize: file.size,
    sha256: checksum(normalized),
    size: normalized.byteLength,
  };
  return { bytes: normalized, normalization };
}

/** Check migration coverage before any path is selected or a raw-file exemption is trusted. */
export function validateExportNormalization(manifest: MemoryExportManifest): void {
  if (manifest.format === "teamagent-memory-export-v1") return;
  const paths = new Set<string>();
  for (const entry of manifest.normalization.files) {
    const file = manifest.version.files.find((candidate) => candidate.path === entry.path);
    if (
      paths.has(entry.path) ||
      file === undefined ||
      file.sha256 !== entry.sourceSha256 ||
      file.size !== entry.sourceSize ||
      entry.sha256 === entry.sourceSha256 ||
      entry.size > entry.sourceSize
    )
      throw new Error("Export normalization does not match its immutable file coverage.");
    paths.add(entry.path);
  }
}

export function exportNormalizationFor(manifest: MemoryExportManifest, file: MemoryFile) {
  return manifest.format === "teamagent-memory-export-v2"
    ? manifest.normalization.files.find((entry) => entry.path === file.path)
    : undefined;
}

/** Verify both byte representations and the exact derivation, not just self-declared new hashes. */
export function verifyExportFile(
  manifest: MemoryExportManifest,
  file: MemoryFile,
  bytes: Uint8Array,
  raw?: Uint8Array,
): void {
  const normalized = exportNormalizationFor(manifest, file);
  const expected = normalized ?? file;
  if (bytes.byteLength !== expected.size || checksum(bytes) !== expected.sha256)
    throw new Error("Export file checksum differs from its manifest.");
  if (normalized === undefined) {
    if (raw !== undefined) throw new Error("Unexpected retained raw representation.");
    const lf = normalizedExportText(bytes, file.mediaType);
    if (lf !== undefined && lf !== bytes)
      throw new Error("Active text export requires an LF-derived representation.");
    return;
  }
  if (raw === undefined || raw.byteLength !== file.size || checksum(raw) !== file.sha256)
    throw new Error("Retained raw export checksum differs from immutable source evidence.");
  const derived = normalizedExportText(raw, file.mediaType);
  if (
    derived === undefined ||
    derived === raw ||
    derived.byteLength !== bytes.byteLength ||
    checksum(derived) !== normalized.sha256
  )
    throw new Error("Export bytes do not match their recorded LF transformation.");
}
