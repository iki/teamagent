import { Effect, Schema } from "effect";
import { ChannelError } from "./errors.ts";
const Id = Schema.String.check(
  Schema.isMinLength(1),
  Schema.isMaxLength(160),
  Schema.isPattern(/^[^\p{Cc}]+$/u),
);
const Text = Schema.String.check(Schema.isMaxLength(16_000));
const Sequence = Schema.Int.check(
  Schema.isGreaterThanOrEqualTo(0),
  Schema.isLessThanOrEqualTo(1_000_000),
);
const Time = Schema.Number.check(
  Schema.isFinite(),
  Schema.isGreaterThanOrEqualTo(0),
  Schema.isLessThanOrEqualTo(86_400_000),
);
const common = { sessionId: Id, sequence: Sequence };
const utterance = {
  utteranceId: Id,
  text: Text,
  startMs: Schema.optional(Time),
  endMs: Schema.optional(Time),
};
export const SpeechEventSchema = Schema.Union([
  Schema.Struct({ ...common, type: Schema.Literal("partial"), utteranceId: Id, text: Text }),
  Schema.Struct({ ...common, type: Schema.Literal("final"), ...utterance }),
  Schema.Struct({ ...common, type: Schema.Literal("end") }),
  Schema.Struct({ ...common, type: Schema.Literal("cancel") }),
]);
export type SpeechEvent = typeof SpeechEventSchema.Type;
export const SpeechStateSchema = Schema.Struct({
  sessionId: Id,
  phase: Schema.Literals(["listening", "ended", "cancelled"]),
  nextSequence: Sequence,
  partial: Schema.NullOr(Schema.Struct({ utteranceId: Id, text: Text })),
  finalized: Schema.Array(Schema.Struct(utterance)).check(Schema.isMaxLength(256)),
  text: Schema.String.check(Schema.isMaxLength(128_000)),
  lastEvent: Schema.NullOr(SpeechEventSchema),
});
export type SpeechState = typeof SpeechStateSchema.Type;
function sameUtterance(
  a: SpeechState["finalized"][number],
  b: SpeechState["finalized"][number],
): boolean {
  return (
    a.utteranceId === b.utteranceId &&
    a.text === b.text &&
    a.startMs === b.startMs &&
    a.endMs === b.endMs
  );
}
function sameEvent(a: SpeechEvent, b: SpeechEvent): boolean {
  if (a.type !== b.type || a.sessionId !== b.sessionId || a.sequence !== b.sequence) return false;
  switch (a.type) {
    case "partial":
      return b.type === "partial" && a.utteranceId === b.utteranceId && a.text === b.text;
    case "final":
      return b.type === "final" && sameUtterance(a, b);
    case "end":
    case "cancel":
      return true;
  }
}
function consistentState(state: SpeechState): boolean {
  if (
    state.text !==
      state.finalized
        .map((item) => item.text)
        .filter(Boolean)
        .join(" ") ||
    new Set(state.finalized.map((item) => item.utteranceId)).size !== state.finalized.length ||
    state.finalized.some(
      (item) =>
        (item.startMs === undefined) !== (item.endMs === undefined) ||
        (item.startMs !== undefined && item.endMs !== undefined && item.endMs < item.startMs),
    ) ||
    (state.partial !== null &&
      state.finalized.some((item) => item.utteranceId === state.partial?.utteranceId))
  )
    return false;
  if (state.nextSequence === 0)
    return (
      state.lastEvent === null &&
      state.phase === "listening" &&
      state.partial === null &&
      state.finalized.length === 0
    );
  const last = state.lastEvent;
  if (
    last === null ||
    last.sessionId !== state.sessionId ||
    last.sequence !== state.nextSequence - 1 ||
    state.nextSequence < state.finalized.length
  )
    return false;
  switch (last.type) {
    case "partial":
      return (
        state.phase === "listening" &&
        state.partial !== null &&
        state.nextSequence > state.finalized.length &&
        state.partial.utteranceId === last.utteranceId &&
        state.partial.text === last.text
      );
    case "final": {
      const finalized = state.finalized.at(-1);
      return (
        state.phase === "listening" &&
        state.partial === null &&
        finalized !== undefined &&
        sameUtterance(finalized, last)
      );
    }
    case "end":
      return (
        state.phase === "ended" &&
        state.partial === null &&
        state.nextSequence > state.finalized.length
      );
    case "cancel":
      return (
        state.phase === "cancelled" &&
        state.partial === null &&
        state.nextSequence > state.finalized.length
      );
  }
}
export const initialSpeechState = Effect.fnUntraced(function* (sessionId: unknown) {
  const id = yield* Schema.decodeUnknownEffect(Id)(sessionId).pipe(
    Effect.mapError(
      () => new ChannelError({ code: "invalid", message: "Invalid speech session ID." }),
    ),
  );
  const state: SpeechState = {
    sessionId: id,
    phase: "listening",
    nextSequence: 0,
    partial: null,
    finalized: [],
    text: "",
    lastEvent: null,
  };
  return state;
});
/** Partial hypotheses never enter finalized text; final events alone can become a user turn. */
export const applySpeechEvent = Effect.fnUntraced(function* (
  stateInput: unknown,
  eventInput: unknown,
) {
  const decodeFailure = () =>
    new ChannelError({ code: "invalid", message: "Invalid speech state or event." });
  const state = yield* Schema.decodeUnknownEffect(SpeechStateSchema)(stateInput, {
    onExcessProperty: "error",
  }).pipe(Effect.mapError(decodeFailure));
  const event = yield* Schema.decodeUnknownEffect(SpeechEventSchema)(eventInput, {
    onExcessProperty: "error",
  }).pipe(Effect.mapError(decodeFailure));
  if (!consistentState(state))
    return yield* new ChannelError({
      code: "invalid",
      message: "Speech state timing, text, identities or event history are inconsistent.",
    });
  if (event.sessionId !== state.sessionId)
    return yield* new ChannelError({
      code: "unauthorized",
      message: "Speech event belongs to another session.",
    });
  if (
    event.sequence === state.nextSequence - 1 &&
    state.lastEvent !== null &&
    sameEvent(event, state.lastEvent)
  )
    return state;
  if (state.phase !== "listening")
    return yield* new ChannelError({
      code: "conflict",
      message: "Speech session is already closed.",
    });
  if (event.sequence !== state.nextSequence)
    return yield* new ChannelError({
      code: "conflict",
      message: "Speech event is stale or has a sequence gap.",
    });
  if (state.nextSequence >= 1_000_000)
    return yield* new ChannelError({
      code: "capacity",
      message: "Speech event count exceeded its bound.",
    });
  let next: SpeechState = { ...state, nextSequence: state.nextSequence + 1, lastEvent: event };
  if (event.type === "partial" || event.type === "final") {
    if (state.finalized.some((item) => item.utteranceId === event.utteranceId))
      return yield* new ChannelError({
        code: "conflict",
        message: "Finalized speech cannot be revised by a later event.",
      });
    if (state.partial !== null && state.partial.utteranceId !== event.utteranceId)
      return yield* new ChannelError({
        code: "conflict",
        message: "An unfinished utterance must be finalized or cancelled before another starts.",
      });
  }
  switch (event.type) {
    case "partial":
      next = { ...next, partial: { utteranceId: event.utteranceId, text: event.text } };
      break;
    case "final": {
      if (
        (event.startMs === undefined) !== (event.endMs === undefined) ||
        (event.startMs !== undefined && event.endMs !== undefined && event.endMs < event.startMs)
      )
        return yield* new ChannelError({
          code: "invalid",
          message: "Speech timing must contain an ordered start/end pair.",
        });
      const finalized = [
        ...state.finalized,
        {
          utteranceId: event.utteranceId,
          text: event.text,
          ...(event.startMs === undefined ? {} : { startMs: event.startMs }),
          ...(event.endMs === undefined ? {} : { endMs: event.endMs }),
        },
      ];
      next = {
        ...next,
        partial: null,
        finalized,
        text: finalized
          .map((item) => item.text)
          .filter(Boolean)
          .join(" "),
      };
      break;
    }
    case "end":
      if (state.partial !== null)
        return yield* new ChannelError({
          code: "conflict",
          message:
            "Ending with an unfinished hypothesis would lose speech; finalize or cancel it explicitly.",
        });
      next = { ...next, phase: "ended" };
      break;
    case "cancel":
      next = { ...next, phase: "cancelled", partial: null };
      break;
  }
  return yield* Schema.decodeUnknownEffect(SpeechStateSchema)(next).pipe(
    Effect.mapError(
      () =>
        new ChannelError({
          code: "capacity",
          message: "Speech session exceeds its retained-text or utterance bounds.",
        }),
    ),
  );
});
