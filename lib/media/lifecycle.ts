import { Effect, Schema } from "effect";
import { MediaBackendIdSchema, MediaError } from "./contracts.ts";

const Id = Schema.String.check(Schema.isPattern(/^[A-Za-z0-9_-]{1,256}$/));
const Note = Schema.String.check(Schema.isMaxLength(1000));
export const MediaVoiceRequestSchema = Schema.Struct({
  action: Schema.Literals(["get", "list", "wait", "delete"]),
  backend: MediaBackendIdSchema,
  voiceId: Schema.optional(Id),
  cursor: Schema.optional(
    Schema.String.check(Schema.isMaxLength(512), Schema.isPattern(/^[^\p{Cc}]+$/u)),
  ),
  limit: Schema.optional(Schema.Int.check(Schema.isBetween({ minimum: 1, maximum: 100 }))),
  timeoutMs: Schema.optional(Schema.Int.check(Schema.isBetween({ minimum: 100, maximum: 900000 }))),
  pollIntervalMs: Schema.optional(
    Schema.Int.check(Schema.isBetween({ minimum: 100, maximum: 30000 })),
  ),
});
export type MediaVoiceRequest = typeof MediaVoiceRequestSchema.Type;
export const VoiceResourceSchema = Schema.Struct({
  id: Id,
  name: Schema.NullOr(Schema.String.check(Schema.isMaxLength(256))),
  status: Schema.String.check(Schema.isMaxLength(64)),
  readiness: Schema.Literals(["ready", "pending", "failed", "unknown"]),
  requiresVerification: Schema.NullOr(Schema.Boolean),
  language: Schema.NullOr(Schema.String.check(Schema.isMaxLength(64))),
  mode: Schema.NullOr(Schema.String.check(Schema.isMaxLength(64))),
  referenceAssetIds: Schema.Array(Id).check(Schema.isMaxLength(100)),
  limitations: Schema.Array(Note).check(Schema.isMaxLength(32)),
});
export const MediaVoiceResultSchema = Schema.Struct({
  action: Schema.Literals(["get", "list", "wait", "delete"]),
  backend: MediaBackendIdSchema,
  voices: Schema.Array(VoiceResourceSchema).check(Schema.isMaxLength(100)),
  nextCursor: Schema.NullOr(Schema.String.check(Schema.isMaxLength(512))),
  deleted: Schema.Boolean,
});
export type MediaVoiceResult = typeof MediaVoiceResultSchema.Type;
export const MediaDiagnosticRequestSchema = Schema.Struct({
  backend: MediaBackendIdSchema,
  voiceId: Schema.optional(Id),
});
export type MediaDiagnosticRequest = typeof MediaDiagnosticRequestSchema.Type;
export const MediaDiagnosticResultSchema = Schema.Struct({
  backend: MediaBackendIdSchema,
  authenticated: Schema.Boolean,
  credentialBinding: Schema.NullOr(Id),
  accountId: Schema.NullOr(Id),
  scopes: Schema.NullOr(
    Schema.Array(Schema.String.check(Schema.isMaxLength(128))).check(Schema.isMaxLength(128)),
  ),
  models: Schema.Array(
    Schema.Struct({
      id: Schema.String.check(Schema.isMaxLength(256)),
      access: Schema.Literals(["verified", "unknown"]),
    }),
  ).check(Schema.isMaxLength(100)),
  checkedAt: Schema.String.check(Schema.isPattern(/^\d{4}-\d{2}-\d{2}T/)),
  limitations: Schema.Array(Note).check(Schema.isMaxLength(32)),
});
export type MediaDiagnosticResult = typeof MediaDiagnosticResultSchema.Type;
export const validateMediaVoiceRequest = Effect.fnUntraced(function* (input: unknown) {
  const request = yield* Schema.decodeUnknownEffect(MediaVoiceRequestSchema)(input, {
    onExcessProperty: "error",
  }).pipe(
    Effect.mapError(
      () => new MediaError({ code: "invalid", message: "Invalid voice lifecycle request." }),
    ),
  );
  if (
    (request.action === "list" ? request.voiceId !== undefined : request.voiceId === undefined) ||
    (request.action !== "list" && (request.cursor !== undefined || request.limit !== undefined)) ||
    (request.action !== "wait" &&
      (request.timeoutMs !== undefined || request.pollIntervalMs !== undefined))
  )
    return yield* new MediaError({
      code: "invalid",
      message: "Voice lifecycle options do not match the requested action.",
    });
  return request;
});
