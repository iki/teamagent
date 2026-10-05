import { Schema } from "effect";

export const ExtractorProfileIdSchema = Schema.String.check(
  Schema.isMinLength(1),
  Schema.isMaxLength(64),
  Schema.isPattern(/^[a-z0-9][a-z0-9._-]*$/),
);
const argument = Schema.String.check(Schema.isMaxLength(8_192), Schema.isPattern(/^[^\p{Cc}]*$/u));
const argumentsSchema = Schema.Array(argument).check(Schema.isMaxLength(128));

export const ExternalExtractorProfileSchema = Schema.Struct({
  id: ExtractorProfileIdSchema,
  engine: Schema.Literals(["xberg", "marker", "mineru", "docling", "opendataloader"]),
  version: Schema.String.check(
    Schema.isMinLength(1),
    Schema.isMaxLength(64),
    Schema.isPattern(/^[a-zA-Z0-9._+-]+$/),
  ),
  command: argument.check(Schema.isMinLength(1)),
  args: argumentsSchema,
  outputMode: Schema.optional(Schema.Literals(["directory", "stdout"])),
  mediaTypes: Schema.optional(
    Schema.Array(Schema.String.check(Schema.isPattern(/^[a-z0-9.+-]+\/[a-z0-9.+-]+$/))).check(
      Schema.isMinLength(1),
      Schema.isMaxLength(32),
    ),
  ),
  env: Schema.optional(Schema.Record(Schema.String, argument)),
  timeoutMs: Schema.optional(
    Schema.Int.check(Schema.isGreaterThanOrEqualTo(100), Schema.isLessThanOrEqualTo(1_800_000)),
  ),
  outputMarkdown: Schema.optional(argument.check(Schema.isMinLength(1))),
  versionArgs: Schema.optional(argumentsSchema),
  versionCommand: Schema.optional(argument.check(Schema.isMinLength(1))),
});
export type ExternalExtractorProfile = typeof ExternalExtractorProfileSchema.Type;
export const ExtractorProfileSchema = Schema.Union([
  Schema.Struct({ id: ExtractorProfileIdSchema, engine: Schema.Literal("builtin") }),
  ExternalExtractorProfileSchema,
]);
export type ExtractorProfile = typeof ExtractorProfileSchema.Type;
export const ExtractorConfigSchema = Schema.Struct({
  version: Schema.Literal(1),
  defaultProfile: ExtractorProfileIdSchema,
  profiles: Schema.Array(ExtractorProfileSchema).check(
    Schema.isMinLength(1),
    Schema.isMaxLength(128),
  ),
});
export type ExtractorConfig = typeof ExtractorConfigSchema.Type;
