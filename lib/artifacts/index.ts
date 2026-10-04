import { Schema } from "effect";

export { cli } from "./cli.ts";

export const ArtifactNameSchema = Schema.String.check(
  Schema.isMinLength(1),
  Schema.isMaxLength(160),
  Schema.isPattern(/^[^/\\\p{Cc}]+$/u),
);
export const MediaTypeSchema = Schema.String.check(
  Schema.isMaxLength(120),
  Schema.isPattern(/^[a-z0-9][a-z0-9!#$&^_.+-]*\/[a-z0-9][a-z0-9!#$&^_.+-]*$/),
);
export const ArtifactSchema = Schema.Struct({
  id: Schema.NonEmptyString,
  taskId: Schema.NonEmptyString,
  name: ArtifactNameSchema,
  mediaType: MediaTypeSchema,
  size: Schema.Int.check(Schema.isGreaterThanOrEqualTo(0), Schema.isLessThanOrEqualTo(4_194_304)),
  sha256: Schema.String.check(Schema.isPattern(/^[a-f0-9]{64}$/)),
  createdAt: Schema.NonEmptyString,
});
export type Artifact = typeof ArtifactSchema.Type;
export const ArtifactInputSchema = Schema.Struct({
  name: ArtifactNameSchema,
  mediaType: MediaTypeSchema,
  content: Schema.instanceOf(Uint8Array),
});
export type ArtifactInput = typeof ArtifactInputSchema.Type;
