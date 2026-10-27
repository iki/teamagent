import { Schema } from "effect";
const Id = Schema.String.check(Schema.isPattern(/^[A-Za-z0-9][A-Za-z0-9_-]{0,255}$/));
export const MediaHttpDiagnosticSchema = Schema.Struct({
  category: Schema.Literals([
    "authentication",
    "permission",
    "voice-not-ready",
    "rate-limit",
    "transient",
    "bad-request",
    "not-found",
    "redirect",
    "network",
    "timeout",
    "cancelled",
    "malformed-response",
    "unknown",
  ]),
  status: Schema.NullOr(Schema.Int.check(Schema.isBetween({ minimum: 100, maximum: 599 }))),
  requestId: Schema.NullOr(Id),
  providerCode: Schema.NullOr(Schema.String.check(Schema.isMaxLength(128))),
  providerMessage: Schema.NullOr(Schema.String.check(Schema.isMaxLength(512))),
  contentType: Schema.NullOr(Schema.String.check(Schema.isMaxLength(256))),
  retryable: Schema.Boolean,
  bodyTruncated: Schema.Boolean,
});
