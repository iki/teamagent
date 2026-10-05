import { Context, Effect, Schema } from "effect";

export { cli } from "./cli.ts";
export { identifierWords, retrievalTerms, rankLexicalCandidates } from "./retrieval.ts";
export {
  ExtractorConfigSchema,
  ExtractorProfileSchema,
  ExternalExtractorProfileSchema,
  ExtractorProfileIdSchema,
  type ExtractorConfig,
  type ExtractorProfile,
  type ExternalExtractorProfile,
} from "./extractors.ts";

export const memoryLimits = {
  fileBytes: 16_777_216,
  captureBytes: 67_108_864,
  captureFiles: 256,
  sources: 2_000,
  versionsPerSource: 1_000,
  searchResults: 50,
  searchCharacters: 2_000,
} as const;

export const MemoryIdSchema = Schema.String.check(
  Schema.isMinLength(1),
  Schema.isMaxLength(160),
  Schema.isPattern(/^[a-zA-Z0-9_.:-]+$/),
);
export const SourceKindSchema = Schema.Literals(["url", "file", "folder", "git"]);
export const InputKindSchema = Schema.Literals(["auto", "url", "file", "folder", "git"]);
export const LocatorSchema = Schema.String.check(
  Schema.isMinLength(1),
  Schema.isMaxLength(8_192),
  Schema.isPattern(/^[^\p{Cc}]+$/u),
);
export const MemoryPathSchema = Schema.String.check(
  Schema.isMinLength(1),
  Schema.isMaxLength(1_024),
  Schema.isPattern(/^[^\p{Cc}\\:]+$/u),
);
export const Sha256Schema = Schema.String.check(Schema.isPattern(/^[a-f0-9]{64}$/));
export const ImportInputSchema = Schema.Struct({
  locator: LocatorSchema,
  kind: Schema.optional(InputKindSchema),
  convert: Schema.optional(Schema.Boolean),
});
export type ImportInput = typeof ImportInputSchema.Type;
const ParserIdentitySchema = Schema.String.check(Schema.isMinLength(1), Schema.isMaxLength(256));
export const ExtractionProvenanceSchema = Schema.Struct({
  policy: ParserIdentitySchema,
  parsers: Schema.Array(ParserIdentitySchema).check(
    Schema.isMaxLength(8),
    Schema.makeFilter((parsers: readonly string[]) =>
      parsers.every((parser, index) => index === 0 || parser > (parsers[index - 1] ?? ""))
        ? undefined
        : "Parser identities must be distinct and sorted",
    ),
  ),
});
export type ExtractionProvenance = typeof ExtractionProvenanceSchema.Type;
export const ProvenanceSchema = Schema.Struct({
  etag: Schema.NullOr(Schema.String.check(Schema.isMaxLength(2_048))),
  lastModified: Schema.NullOr(Schema.String.check(Schema.isMaxLength(128))),
  repositoryCommit: Schema.NullOr(Schema.String.check(Schema.isPattern(/^[a-f0-9]{40,64}$/))),
  parserVersion: ParserIdentitySchema,
  extraction: Schema.optional(ExtractionProvenanceSchema),
  warnings: Schema.Array(Schema.String.check(Schema.isMaxLength(2_000))).check(
    Schema.isMaxLength(256),
  ),
});
export type Provenance = typeof ProvenanceSchema.Type;
export const FileRoleSchema = Schema.Literals(["original", "markdown", "image"]);
export const MemoryFileSchema = Schema.Struct({
  path: MemoryPathSchema,
  role: FileRoleSchema,
  mediaType: Schema.String.check(Schema.isMinLength(1), Schema.isMaxLength(256)),
  size: Schema.Int.check(
    Schema.isGreaterThanOrEqualTo(0),
    Schema.isLessThanOrEqualTo(memoryLimits.fileBytes),
  ),
  sha256: Sha256Schema,
  origin: Schema.NullOr(LocatorSchema),
});
export type MemoryFile = typeof MemoryFileSchema.Type;
export const SourceVersionSchema = Schema.Struct({
  id: MemoryIdSchema,
  sourceId: MemoryIdSchema,
  workspaceId: MemoryIdSchema,
  number: Schema.Int.check(Schema.isGreaterThanOrEqualTo(1)),
  contentHash: Sha256Schema,
  retrievedAt: Schema.NonEmptyString,
  provenance: ProvenanceSchema,
  files: Schema.Array(MemoryFileSchema).check(Schema.isMaxLength(memoryLimits.captureFiles)),
});
export type SourceVersion = typeof SourceVersionSchema.Type;
export const MemorySourceSchema = Schema.Struct({
  id: MemoryIdSchema,
  workspaceId: MemoryIdSchema,
  locator: LocatorSchema,
  inputLocator: LocatorSchema,
  kind: SourceKindSchema,
  convert: Schema.Boolean,
  createdAt: Schema.NonEmptyString,
  checkedAt: Schema.NonEmptyString,
  lastProvenance: ProvenanceSchema,
  currentVersionId: MemoryIdSchema,
  revision: Schema.Int.check(Schema.isGreaterThanOrEqualTo(1)),
});
export type MemorySource = typeof MemorySourceSchema.Type;
export const ImportResultSchema = Schema.Struct({
  status: Schema.Literals(["created", "updated", "unchanged"]),
  source: MemorySourceSchema,
  version: SourceVersionSchema,
});
export type ImportResult = typeof ImportResultSchema.Type;
export const MemoryPageInputSchema = Schema.Struct({
  offset: Schema.optional(
    Schema.Int.check(
      Schema.isGreaterThanOrEqualTo(0),
      Schema.isLessThanOrEqualTo(memoryLimits.sources),
    ),
  ),
  limit: Schema.optional(
    Schema.Int.check(Schema.isGreaterThanOrEqualTo(1), Schema.isLessThanOrEqualTo(100)),
  ),
});
export const VersionPageInputSchema = Schema.Struct({
  offset: Schema.optional(
    Schema.Int.check(
      Schema.isGreaterThanOrEqualTo(0),
      Schema.isLessThanOrEqualTo(memoryLimits.versionsPerSource),
    ),
  ),
  limit: Schema.optional(
    Schema.Int.check(Schema.isGreaterThanOrEqualTo(1), Schema.isLessThanOrEqualTo(10)),
  ),
});
const pageFields = {
  total: Schema.Int.check(Schema.isGreaterThanOrEqualTo(0)),
  nextOffset: Schema.NullOr(Schema.Int.check(Schema.isGreaterThanOrEqualTo(0))),
};
export const SourcePageSchema = Schema.Struct({
  sources: Schema.Array(MemorySourceSchema).check(Schema.isMaxLength(100)),
  ...pageFields,
});
export type SourcePage = typeof SourcePageSchema.Type;
export const SourceDetailsSchema = Schema.Struct({
  source: MemorySourceSchema,
  versions: Schema.Array(SourceVersionSchema).check(Schema.isMaxLength(10)),
  ...pageFields,
});
export type SourceDetails = typeof SourceDetailsSchema.Type;
export const SearchInputSchema = Schema.Struct({
  query: Schema.String.check(
    Schema.isMinLength(1),
    Schema.isMaxLength(512),
    Schema.isPattern(/\S/),
  ),
  limit: Schema.optional(
    Schema.Int.check(
      Schema.isGreaterThanOrEqualTo(1),
      Schema.isLessThanOrEqualTo(memoryLimits.searchResults),
    ),
  ),
  sourceId: Schema.optional(MemoryIdSchema),
});
export const SearchHitSchema = Schema.Struct({
  sourceId: MemoryIdSchema,
  versionId: MemoryIdSchema,
  locator: LocatorSchema,
  path: MemoryPathSchema,
  lineStart: Schema.Int.check(Schema.isGreaterThanOrEqualTo(1)),
  lineEnd: Schema.Int.check(Schema.isGreaterThanOrEqualTo(1)),
  excerpt: Schema.String.check(Schema.isMaxLength(memoryLimits.searchCharacters)),
  citation: Schema.NonEmptyString,
});
export type SearchHit = typeof SearchHitSchema.Type;

export class MemoryError extends Schema.TaggedError<MemoryError>()("MemoryError", {
  code: Schema.Literals([
    "invalid",
    "not_found",
    "conflict",
    "capacity",
    "storage",
    "integrity",
    "network",
    "unsupported",
    "cancelled",
  ]),
  message: Schema.String,
}) {}

export interface CaptureRequest {
  readonly locator: string;
  readonly kind: typeof InputKindSchema.Type;
  readonly convert: boolean;
  readonly previous?: SourceVersion;
  readonly workspaceRoot: string;
  readonly temporaryDirectory: string;
  readonly dataDirectory: string;
}
export interface CapturedFile {
  readonly path: string;
  readonly role: typeof FileRoleSchema.Type;
  readonly mediaType: string;
  readonly bytes: Uint8Array;
  readonly origin?: string;
}
export type CaptureResult =
  | { readonly status: "unchanged"; readonly provenance: Provenance }
  | {
      readonly status: "captured";
      readonly kind: typeof SourceKindSchema.Type;
      readonly locator: string;
      readonly files: readonly CapturedFile[];
      readonly provenance: Provenance;
    };
export type SourceCapture = (request: CaptureRequest) => Effect.Effect<CaptureResult, MemoryError>;

export interface MemoryRead {
  readonly source: MemorySource;
  readonly version: SourceVersion;
  readonly file: MemoryFile;
  readonly bytes: Uint8Array;
}
export interface MemoryExport {
  readonly directory: string;
  readonly source: MemorySource;
  readonly version: SourceVersion;
}
export interface MemoryApi {
  readonly get: (input: unknown) => Effect.Effect<ImportResult, MemoryError>;
  readonly sync: (sourceId: string) => Effect.Effect<ImportResult, MemoryError>;
  readonly list: (input?: unknown) => Effect.Effect<SourcePage, MemoryError>;
  readonly show: (sourceId: string, input?: unknown) => Effect.Effect<SourceDetails, MemoryError>;
  readonly read: (
    sourceId: string,
    path?: string,
    versionId?: string,
  ) => Effect.Effect<MemoryRead, MemoryError>;
  readonly search: (input: unknown) => Effect.Effect<readonly SearchHit[], MemoryError>;
  readonly export: (
    sourceId: string,
    directory: string,
    versionId?: string,
  ) => Effect.Effect<MemoryExport, MemoryError>;
  readonly delete: (sourceId: string) => Effect.Effect<void, MemoryError>;
  readonly close: () => Effect.Effect<void, MemoryError>;
}
export class MemoryService extends Context.Service<MemoryService, MemoryApi>()(
  "teamagent/memory/MemoryService",
) {}

export const validateImportInput = Effect.fnUntraced(function* (input: unknown) {
  return yield* Schema.decodeUnknownEffect(ImportInputSchema)(input, {
    onExcessProperty: "error",
  }).pipe(
    Effect.mapError(
      () => new MemoryError({ code: "invalid", message: "Invalid source import input." }),
    ),
  );
});
