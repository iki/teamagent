import { Context, Effect, Exit, Schema } from "effect";
export { cli } from "./cli.ts";
import { ChannelError } from "./errors.ts";
export { ChannelError } from "./errors.ts";
export {
  SpeechEventSchema,
  SpeechStateSchema,
  initialSpeechState,
  applySpeechEvent,
} from "./speech.ts";
export type { SpeechEvent, SpeechState } from "./speech.ts";

const Identifier = Schema.String.check(
  Schema.isMinLength(1),
  Schema.isMaxLength(160),
  Schema.isPattern(/^[^\p{Cc}]+$/u),
);
const Text = Schema.String.check(Schema.isMaxLength(128_000));
export const ChannelKindSchema = Schema.Literals([
  "cli",
  "web",
  "desktop",
  "mobile",
  "telegram",
  "slack",
  "discord",
  "api",
]);
export const ChannelAttachmentSchema = Schema.Struct({
  id: Identifier,
  kind: Schema.Literals(["audio", "video", "image", "document"]),
  sha256: Schema.optional(Schema.String.check(Schema.isPattern(/^[a-f0-9]{64}$/))),
  locator: Schema.String.check(
    Schema.isMinLength(1),
    Schema.isMaxLength(4096),
    Schema.isPattern(/^[^\p{Cc}]+$/u),
  ),
});
export type ChannelAttachment = typeof ChannelAttachmentSchema.Type;
export const ChannelEnvelopeSchema = Schema.Struct({
  version: Schema.Literal(1),
  channel: ChannelKindSchema,
  account: Identifier,
  conversation: Identifier,
  sender: Identifier,
  messageId: Identifier,
  text: Schema.optional(Text),
  attachments: Schema.Array(ChannelAttachmentSchema).check(Schema.isMaxLength(8)),
});
export type ChannelEnvelope = typeof ChannelEnvelopeSchema.Type;
export const ChannelBindingSchema = Schema.Struct({
  channel: ChannelKindSchema,
  account: Identifier,
  conversation: Identifier,
  principal: Identifier,
  authentication: Schema.Literals(["local", "verified"]),
});
export type ChannelBinding = typeof ChannelBindingSchema.Type;
export const ProcessedAttachmentSchema = Schema.Struct({
  id: Identifier,
  kind: ChannelAttachmentSchema.fields.kind,
  sha256: Schema.String.check(Schema.isPattern(/^[a-f0-9]{64}$/)),
  text: Text,
  backend: Schema.NullOr(Identifier),
  model: Schema.NullOr(Identifier),
  sourceId: Schema.NullOr(Identifier),
  versionId: Schema.NullOr(Identifier),
  warnings: Schema.Array(Schema.String.check(Schema.isMaxLength(2000))).check(
    Schema.isMaxLength(32),
  ),
});
export type ProcessedAttachment = typeof ProcessedAttachmentSchema.Type;
export const ChannelTurnSchema = Schema.Struct({
  version: Schema.Literal(1),
  channel: ChannelKindSchema,
  account: Identifier,
  conversation: Identifier,
  sender: Identifier,
  messageId: Identifier,
  authentication: ChannelBindingSchema.fields.authentication,
  text: Text,
  attachments: Schema.Array(ProcessedAttachmentSchema).check(Schema.isMaxLength(8)),
  warnings: Schema.Array(Schema.String.check(Schema.isMaxLength(2000))).check(
    Schema.isMaxLength(256),
  ),
});
export type ChannelTurn = typeof ChannelTurnSchema.Type;
export const ChannelReceiptSchema = Schema.Struct({
  status: Schema.Literals(["processing", "complete", "failed"]),
  result: Schema.NullOr(ChannelTurnSchema),
});
export type ChannelReceipt = typeof ChannelReceiptSchema.Type;
export interface ChannelApi {
  readonly inspect: (input: unknown) => Effect.Effect<ChannelEnvelope, ChannelError>;
  readonly ingest: (
    input: unknown,
  ) => Effect.Effect<{ readonly duplicate: boolean; readonly turn: ChannelTurn }, ChannelError>;
  readonly status: (messageId: string) => Effect.Effect<ChannelReceipt | null, ChannelError>;
}
export class ChannelService extends Context.Service<ChannelService, ChannelApi>()(
  "teamagent/channels/ChannelService",
) {}

export const validateChannelEnvelope = Effect.fnUntraced(function* (input: unknown) {
  const envelope = yield* Schema.decodeUnknownEffect(ChannelEnvelopeSchema)(input, {
    onExcessProperty: "error",
  }).pipe(
    Effect.mapError(
      () => new ChannelError({ code: "invalid", message: "Invalid channel envelope." }),
    ),
  );
  if (!envelope.text?.trim() && envelope.attachments.length === 0)
    return yield* new ChannelError({
      code: "invalid",
      message: "Channel input needs text or an attachment.",
    });
  if (new Set(envelope.attachments.map((item) => item.id)).size !== envelope.attachments.length)
    return yield* new ChannelError({ code: "invalid", message: "Attachment IDs must be unique." });
  return envelope;
});
export type ChannelClaim =
  | { readonly status: "reserved"; readonly token: string }
  | { readonly status: "complete"; readonly result: unknown };
export interface ChannelLedger {
  /** Atomically reserve the exact envelope, rejecting an existing message ID with changed input. */
  readonly claim: (envelope: ChannelEnvelope) => Effect.Effect<ChannelClaim, ChannelError>;
  readonly complete: (token: string, result: ChannelTurn) => Effect.Effect<void, ChannelError>;
  /** Fail only the processing reservation owned by this token; never downgrade a committed turn. */
  readonly fail: (token: string) => Effect.Effect<void, ChannelError>;
  readonly status: (
    binding: ChannelBinding,
    messageId: string,
  ) => Effect.Effect<ChannelReceipt | null, ChannelError>;
}
const ClaimSchema = Schema.Union([
  Schema.Struct({ status: Schema.Literal("reserved"), token: Identifier }),
  Schema.Struct({ status: Schema.Literal("complete"), result: Schema.Unknown }),
]);
function consistentAttachment(attachment: ProcessedAttachment): boolean {
  return (
    (attachment.sourceId === null) === (attachment.versionId === null) &&
    (attachment.model === null || attachment.backend !== null)
  );
}
function matchesAttachment(processed: ProcessedAttachment, input: ChannelAttachment): boolean {
  return (
    processed.id === input.id &&
    processed.kind === input.kind &&
    (input.sha256 === undefined || processed.sha256 === input.sha256)
  );
}
const validateStoredTurn = Effect.fnUntraced(function* (
  input: unknown,
  binding: ChannelBinding,
  messageId: string,
  envelope?: ChannelEnvelope,
) {
  const turn = yield* Schema.decodeUnknownEffect(ChannelTurnSchema)(input, {
    onExcessProperty: "error",
  }).pipe(
    Effect.mapError(
      () =>
        new ChannelError({ code: "storage", message: "Stored channel result failed validation." }),
    ),
  );
  if (
    turn.channel !== binding.channel ||
    turn.account !== binding.account ||
    turn.conversation !== binding.conversation ||
    turn.sender !== binding.principal ||
    turn.messageId !== messageId ||
    turn.authentication !== binding.authentication
  )
    return yield* new ChannelError({
      code: "conflict",
      message: "Stored channel result belongs to another binding.",
    });
  if (
    new Set(turn.attachments.map((item) => item.id)).size !== turn.attachments.length ||
    turn.attachments.some((item) => !consistentAttachment(item))
  )
    return yield* new ChannelError({
      code: "storage",
      message: "Stored attachment provenance is inconsistent.",
    });
  if (
    envelope !== undefined &&
    (turn.attachments.length !== envelope.attachments.length ||
      turn.attachments.some((item, index) => {
        const original = envelope.attachments[index];
        return original === undefined || !matchesAttachment(item, original);
      }) ||
      turn.text !==
        [envelope.text ?? "", ...turn.attachments.map((item) => item.text)]
          .filter(Boolean)
          .join("\n\n"))
  )
    return yield* new ChannelError({
      code: "conflict",
      message: "Stored result does not match its requested input.",
    });
  return turn;
});

export const createChannelService = Effect.fnUntraced(function* (options: {
  readonly binding: unknown;
  readonly ledger: ChannelLedger;
  readonly processAttachment: (
    attachment: ChannelAttachment,
  ) => Effect.Effect<unknown, ChannelError>;
}) {
  const binding = yield* Schema.decodeUnknownEffect(ChannelBindingSchema)(options.binding, {
    onExcessProperty: "error",
  }).pipe(
    Effect.mapError(
      () => new ChannelError({ code: "invalid", message: "Invalid trusted channel binding." }),
    ),
  );
  const inspect = Effect.fnUntraced(function* (input: unknown) {
    const envelope = yield* validateChannelEnvelope(input);
    if (
      envelope.channel !== binding.channel ||
      envelope.account !== binding.account ||
      envelope.conversation !== binding.conversation ||
      envelope.sender !== binding.principal
    )
      return yield* new ChannelError({
        code: "unauthorized",
        message: "Input identity does not match its trusted channel binding.",
      });
    return envelope;
  });
  const ingest = Effect.fnUntraced(function* (input: unknown) {
    const envelope = yield* inspect(input);
    return yield* Effect.uninterruptibleMask((restore) =>
      Effect.gen(function* () {
        const claim = yield* Schema.decodeUnknownEffect(ClaimSchema)(
          yield* options.ledger.claim(envelope),
          { onExcessProperty: "error" },
        ).pipe(
          Effect.mapError(
            () =>
              new ChannelError({
                code: "storage",
                message: "Channel reservation failed validation.",
              }),
          ),
        );
        if (claim.status === "complete")
          return {
            duplicate: true,
            turn: yield* validateStoredTurn(claim.result, binding, envelope.messageId, envelope),
          };
        const attempt = yield* Effect.exit(
          Effect.gen(function* () {
            const turn = yield* restore(
              Effect.gen(function* () {
                const attachments: ProcessedAttachment[] = [];
                for (const attachment of envelope.attachments) {
                  const processed = yield* options.processAttachment(attachment);
                  const decoded = yield* Schema.decodeUnknownEffect(ProcessedAttachmentSchema)(
                    processed,
                    { onExcessProperty: "error" },
                  ).pipe(
                    Effect.mapError(
                      () =>
                        new ChannelError({
                          code: "processing",
                          message: "Attachment processor returned an invalid result.",
                        }),
                    ),
                  );
                  if (!matchesAttachment(decoded, attachment) || !consistentAttachment(decoded))
                    return yield* new ChannelError({
                      code: "processing",
                      message:
                        "Attachment processor returned different identity or inconsistent provenance.",
                    });
                  attachments.push(decoded);
                }
                const result: ChannelTurn = {
                  version: 1,
                  channel: envelope.channel,
                  account: envelope.account,
                  conversation: envelope.conversation,
                  sender: envelope.sender,
                  messageId: envelope.messageId,
                  authentication: binding.authentication,
                  text: [envelope.text ?? "", ...attachments.map((item) => item.text)]
                    .filter(Boolean)
                    .join("\n\n"),
                  attachments,
                  warnings: attachments.flatMap((item) => item.warnings),
                };
                return yield* Schema.decodeUnknownEffect(ChannelTurnSchema)(result, {
                  onExcessProperty: "error",
                }).pipe(
                  Effect.mapError(
                    () =>
                      new ChannelError({
                        code: "capacity",
                        message: "Combined channel input exceeds its text or attachment bounds.",
                      }),
                  ),
                );
              }),
            );
            yield* options.ledger.complete(claim.token, turn);
            return { duplicate: false, turn };
          }),
        );
        if (Exit.isFailure(attempt)) {
          const cleanup = yield* Effect.exit(options.ledger.fail(claim.token));
          if (Exit.isFailure(cleanup))
            return yield* new ChannelError({
              code: "storage",
              message: "Channel processing failed and its failure receipt could not be stored.",
            });
          return yield* Effect.failCause(attempt.cause);
        }
        return attempt.value;
      }),
    );
  });
  const status = Effect.fnUntraced(function* (messageId: string) {
    const id = yield* Schema.decodeUnknownEffect(Identifier)(messageId).pipe(
      Effect.mapError(
        () => new ChannelError({ code: "invalid", message: "Invalid channel message ID." }),
      ),
    );
    const raw = yield* options.ledger.status(binding, id);
    if (raw === null) return null;
    const receipt = yield* Schema.decodeUnknownEffect(ChannelReceiptSchema)(raw, {
      onExcessProperty: "error",
    }).pipe(
      Effect.mapError(
        () =>
          new ChannelError({
            code: "storage",
            message: "Stored channel receipt failed validation.",
          }),
      ),
    );
    if (receipt.status === "complete") {
      if (receipt.result === null)
        return yield* new ChannelError({
          code: "storage",
          message: "Completed channel receipt is missing its turn.",
        });
      return {
        status: receipt.status,
        result: yield* validateStoredTurn(receipt.result, binding, id),
      };
    }
    if (receipt.result !== null)
      return yield* new ChannelError({
        code: "storage",
        message: "An incomplete channel receipt cannot expose a completed turn.",
      });
    return receipt;
  });
  return ChannelService.of({ inspect, ingest, status });
});
