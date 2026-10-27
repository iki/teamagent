import { Schema } from "effect";
import { MediaArtifactSchema, MediaBackendIdSchema, MediaPathSchema } from "./contracts.ts";
const Id = Schema.String.check(Schema.isPattern(/^[A-Za-z0-9][A-Za-z0-9_-]{0,255}$/));
import { MediaHttpDiagnosticSchema } from "./diagnostics.ts";
export const PublicMediaReceiptSchema = Schema.Struct({
  id: Id,
  backend: MediaBackendIdSchema,
  operation: Schema.Literals(["clone", "synthesize"]),
  model: Schema.NullOr(Schema.String.check(Schema.isMaxLength(256))),
  state: Schema.Literals([
    "submitting",
    "accepted",
    "pending",
    "rejected",
    "uncertain",
    "generated-awaiting-download",
    "published",
  ]),
  revision: Schema.Int,
  createdAt: Schema.String,
  updatedAt: Schema.String,
  requestId: Schema.NullOr(Id),
  voiceId: Schema.NullOr(Id),
  diagnostic: Schema.NullOr(MediaHttpDiagnosticSchema),
  artifactLocation: Schema.NullOr(
    Schema.Struct({
      origin: Schema.NullOr(Schema.String.check(Schema.isMaxLength(256))),
      path: Schema.NullOr(Schema.String.check(Schema.isMaxLength(256))),
    }),
  ),
  artifactSha256: Schema.NullOr(Schema.String.check(Schema.isPattern(/^[a-f0-9]{64}$/))),
  artifactSizeBytes: Schema.NullOr(Schema.Int),
  hasIdempotencyKey: Schema.Boolean,
});
export type PublicMediaReceipt = typeof PublicMediaReceiptSchema.Type;
export const MediaRecoveryRequestSchema = Schema.Struct({
  action: Schema.Literals(["list", "get", "resume"]),
  receiptId: Schema.optional(Id),
  output: Schema.optional(MediaPathSchema),
});
export type MediaRecoveryRequest = typeof MediaRecoveryRequestSchema.Type;
export const RecoveredArtifactSchema = MediaArtifactSchema;
