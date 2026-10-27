import { describe, expect, test } from "bun:test";
import { rejects } from "node:assert/strict";
import { Effect } from "effect";
import {
  ChannelError,
  createChannelService,
  initialSpeechState,
  applySpeechEvent,
  type ChannelAttachment,
  type ChannelBinding,
  type ChannelClaim,
  type ChannelEnvelope,
  type ChannelLedger,
  type ChannelReceipt,
  type ChannelTurn,
  type ProcessedAttachment,
  type SpeechState,
} from "@/channels";

const hash = "b".repeat(64);
const binding: ChannelBinding = {
  channel: "cli",
  account: "local",
  conversation: "conversation",
  principal: "user",
  authentication: "local",
};
function attachment(id = "audio"): ChannelAttachment {
  return { id, kind: "audio", locator: `${id}.wav`, sha256: hash };
}
function envelope(
  attachments: readonly ChannelAttachment[] = [],
  text = "User request",
): ChannelEnvelope {
  return {
    version: 1,
    channel: "cli",
    account: "local",
    conversation: "conversation",
    sender: "user",
    messageId: "message",
    text,
    attachments,
  };
}
function processed(input: ChannelAttachment): ProcessedAttachment {
  return {
    id: input.id,
    kind: input.kind,
    sha256: hash,
    text: "Transcribed speech",
    backend: "fixture",
    model: "fixture-model",
    sourceId: null,
    versionId: null,
    warnings: [],
  };
}
function ledgerFixture() {
  const state: {
    phase: "missing" | "processing" | "complete" | "failed";
    turn: ChannelTurn | null;
    claims: number;
    completions: number;
    failures: number;
    failWrite: boolean;
    completeWrite: boolean;
    events: string[];
  } = {
    phase: "missing",
    turn: null,
    claims: 0,
    completions: 0,
    failures: 0,
    failWrite: false,
    completeWrite: false,
    events: [],
  };
  const ledger: ChannelLedger = {
    claim: Effect.fnUntraced(function* (): Effect.fn.Return<ChannelClaim, ChannelError> {
      state.claims += 1;
      if (state.phase === "processing")
        return yield* new ChannelError({ code: "busy", message: "Already processing." });
      if (state.phase === "complete" && state.turn !== null)
        return { status: "complete", result: state.turn };
      state.phase = "processing";
      return { status: "reserved", token: "reservation" };
    }),
    complete: Effect.fnUntraced(function* (_token: string, turn: ChannelTurn) {
      if (state.completeWrite)
        return yield* new ChannelError({ code: "storage", message: "Completion storage failed." });
      state.completions += 1;
      state.turn = turn;
      state.phase = "complete";
    }),
    fail: Effect.fnUntraced(function* () {
      state.failures += 1;
      state.events.push("failure-receipt");
      if (state.failWrite)
        return yield* new ChannelError({ code: "storage", message: "Failure storage failed." });
      state.phase = "failed";
    }),
    status: () =>
      Effect.succeed(
        state.phase === "missing" ? null : { status: state.phase, result: state.turn },
      ),
  };
  return { state, ledger };
}
async function errorCode<A>(effect: Effect.Effect<A, ChannelError>): Promise<ChannelError["code"]> {
  return (await Effect.runPromise(Effect.flip(effect))).code;
}

async function fixture(
  processor: (input: ChannelAttachment) => Effect.Effect<unknown, ChannelError> = (input) =>
    Effect.succeed(processed(input)),
) {
  const owned = ledgerFixture();
  const service = await Effect.runPromise(
    createChannelService({ binding, ledger: owned.ledger, processAttachment: processor }),
  );
  return { ...owned, service };
}

describe("portable channel ingress", () => {
  test("inspection verifies binding and input bounds without reserving or processing anything", async () => {
    const { state, service } = await fixture();
    expect((await Effect.runPromise(service.inspect(envelope()))).sender).toBe("user");
    expect(state.claims).toBe(0);
    expect(await errorCode(service.inspect({ ...envelope(), sender: "other" }))).toBe(
      "unauthorized",
    );
    expect(await errorCode(service.inspect({ ...envelope(), account: "other" }))).toBe(
      "unauthorized",
    );
    expect(await errorCode(service.inspect({ ...envelope(), conversation: "other" }))).toBe(
      "unauthorized",
    );
    expect(await errorCode(service.inspect({ ...envelope(), extra: true }))).toBe("invalid");
    expect(await errorCode(service.inspect(envelope([], " ")))).toBe("invalid");
    expect(await errorCode(service.inspect(envelope([attachment(), attachment()])))).toBe(
      "invalid",
    );
    expect(
      await errorCode(
        service.inspect(envelope(Array.from({ length: 9 }, (_, index) => attachment(`a${index}`)))),
      ),
    ).toBe("invalid");
    expect(state.claims).toBe(0);
    expect(
      await errorCode(
        createChannelService({
          binding: { ...binding, untrusted: true },
          ledger: ledgerFixture().ledger,
          processAttachment: (input) => Effect.succeed(processed(input)),
        }),
      ),
    ).toBe("invalid");
  });

  test("completed duplicate messages reuse the checked turn without processing attachments again", async () => {
    let calls = 0;
    const { service, state } = await fixture((input) =>
      Effect.sync(() => {
        calls += 1;
        return processed(input);
      }),
    );
    const input = envelope([attachment()]);
    const first = await Effect.runPromise(service.ingest(input));
    const duplicate = await Effect.runPromise(service.ingest(input));
    expect(first.duplicate).toBe(false);
    expect(duplicate.duplicate).toBe(true);
    expect(duplicate.turn).toEqual(first.turn);
    expect(first.turn.text).toBe("User request\n\nTranscribed speech");
    expect(calls).toBe(1);
    expect(state.completions).toBe(1);
    expect(state.failures).toBe(0);
    expect((await Effect.runPromise(service.status("message")))?.status).toBe("complete");
  });

  test("an in-flight duplicate stays busy and cannot acquire a second processing attempt", async () => {
    const started = Promise.withResolvers<void>();
    const finish = Promise.withResolvers<unknown>();
    let calls = 0;
    const { service, state } = await fixture(() =>
      Effect.promise(() => {
        calls += 1;
        started.resolve();
        return finish.promise;
      }),
    );
    const input = envelope([attachment()]);
    const first = Effect.runPromise(service.ingest(input));
    await started.promise;
    expect(await errorCode(service.ingest(input))).toBe("busy");
    finish.resolve(processed(attachment()));
    expect((await first).duplicate).toBe(false);
    expect(calls).toBe(1);
    expect(state.failures).toBe(0);
  });

  test("malformed, mismatched and incomplete attachment provenance fails the owned reservation", async () => {
    const source = attachment();
    const valid = processed(source);
    for (const value of [
      { id: "missing-fields" },
      { ...valid, unexpected: true },
      { ...valid, id: "different" },
      { ...valid, kind: "image" },
      { ...valid, sha256: "c".repeat(64) },
      { ...valid, sourceId: "source", versionId: null },
      { ...valid, backend: null },
    ]) {
      const { service, state } = await fixture(() => Effect.succeed(value));
      expect(await errorCode(service.ingest(envelope([source])))).toBe("processing");
      expect(state.phase).toBe("failed");
      expect(state.failures).toBe(1);
      expect(state.completions).toBe(0);
    }
  });

  test("aggregate text bounds and late processor failure never publish a partial completed turn", async () => {
    const { service, state } = await fixture((input) =>
      Effect.succeed({ ...processed(input), text: "a".repeat(70_000) }),
    );
    expect(
      await errorCode(service.ingest(envelope([attachment("first"), attachment("second")]))),
    ).toBe("capacity");
    expect(state.phase).toBe("failed");
    expect(state.turn).toBeNull();
    let calls = 0;
    const late = await fixture((input) => {
      calls += 1;
      return input.id === "second"
        ? Effect.fail(
            new ChannelError({ code: "processing", message: "Second attachment failed." }),
          )
        : Effect.succeed(processed(input));
    });
    expect(
      await errorCode(late.service.ingest(envelope([attachment("first"), attachment("second")]))),
    ).toBe("processing");
    expect(calls).toBe(2);
    expect(late.state.completions).toBe(0);
    expect(late.state.failures).toBe(1);
  });

  test("replayed and status results must be strict, complete and bound to the same principal", async () => {
    const owned = await fixture();
    const input = envelope([attachment()]);
    const { turn } = await Effect.runPromise(owned.service.ingest(input));
    for (const result of [
      { ...turn, unexpected: true },
      { ...turn, sender: "other" },
      { ...turn, text: "Changed payload" },
    ]) {
      const service = await Effect.runPromise(
        createChannelService({
          binding,
          ledger: { ...owned.ledger, claim: () => Effect.succeed({ status: "complete", result }) },
          processAttachment: (item) => Effect.succeed(processed(item)),
        }),
      );
      expect(["storage", "conflict"]).toContain(await errorCode(service.ingest(input)));
    }
    const invalidReceipts: readonly ChannelReceipt[] = [
      { status: "complete", result: null },
      { status: "failed", result: turn },
      { status: "complete", result: { ...turn, sender: "other" } },
    ];
    for (const receipt of invalidReceipts) {
      const service = await Effect.runPromise(
        createChannelService({
          binding,
          ledger: { ...owned.ledger, status: () => Effect.succeed(receipt) },
          processAttachment: (item) => Effect.succeed(processed(item)),
        }),
      );
      expect(["storage", "conflict"]).toContain(await errorCode(service.status("message")));
    }
  });

  test("cleanup storage failures remain typed and completion failures mark the reservation failed", async () => {
    const owned = await fixture(() =>
      Effect.fail(new ChannelError({ code: "processing", message: "Processing failed." })),
    );
    owned.state.failWrite = true;
    expect(await errorCode(owned.service.ingest(envelope([attachment()])))).toBe("storage");
    expect(owned.state.failures).toBe(1);
    expect(owned.state.phase).toBe("processing");
    const completion = await fixture();
    completion.state.completeWrite = true;
    expect(await errorCode(completion.service.ingest(envelope()))).toBe("storage");
    expect(completion.state.phase).toBe("failed");
  });

  test("cancellation waits for processor cleanup and records failure before returning", async () => {
    const started = Promise.withResolvers<void>();
    const owned = ledgerFixture();
    const service = await Effect.runPromise(
      createChannelService({
        binding,
        ledger: owned.ledger,
        processAttachment: () =>
          Effect.sync(() => started.resolve()).pipe(
            Effect.andThen(Effect.never),
            Effect.ensuring(
              Effect.sync(() => {
                owned.state.events.push("processor-cleanup");
              }),
            ),
          ),
      }),
    );
    const controller = new AbortController();
    const pending = Effect.runPromise(service.ingest(envelope([attachment()])), {
      signal: controller.signal,
    });
    await started.promise;
    controller.abort();
    await rejects(pending);
    expect(owned.state.phase).toBe("failed");
    expect(owned.state.events).toEqual(["processor-cleanup", "failure-receipt"]);
    expect(owned.state.completions).toBe(0);
  });
});

describe("portable speech event state", () => {
  test("partial text stays provisional and semantically duplicate finals/end events are idempotent", async () => {
    let state = await Effect.runPromise(initialSpeechState("session"));
    state = await Effect.runPromise(
      applySpeechEvent(state, {
        type: "partial",
        sessionId: "session",
        sequence: 0,
        utteranceId: "u1",
        text: "Hel",
      }),
    );
    expect(state.text).toBe("");
    state = await Effect.runPromise(
      applySpeechEvent(state, {
        type: "partial",
        sessionId: "session",
        sequence: 1,
        utteranceId: "u1",
        text: "Hello",
      }),
    );
    const event = {
      type: "final",
      sessionId: "session",
      sequence: 2,
      utteranceId: "u1",
      text: "Hello world",
      startMs: 0,
      endMs: 1000,
    };
    state = await Effect.runPromise(applySpeechEvent(state, event));
    expect(state.text).toBe("Hello world");
    expect(state.partial).toBeNull();
    expect(
      await Effect.runPromise(
        applySpeechEvent(state, {
          endMs: 1000,
          text: "Hello world",
          startMs: 0,
          utteranceId: "u1",
          sequence: 2,
          sessionId: "session",
          type: "final",
        }),
      ),
    ).toEqual(state);
    state = await Effect.runPromise(
      applySpeechEvent(state, { type: "end", sessionId: "session", sequence: 3 }),
    );
    expect(state.phase).toBe("ended");
    expect(
      await Effect.runPromise(
        applySpeechEvent(state, { sequence: 3, sessionId: "session", type: "end" }),
      ),
    ).toEqual(state);
    expect(
      await errorCode(
        applySpeechEvent(state, {
          type: "partial",
          sessionId: "session",
          sequence: 4,
          utteranceId: "u2",
          text: "later",
        }),
      ),
    ).toBe("conflict");
  });

  test("rejects stale, gapped, cross-session or conflicting utterances without losing partial speech", async () => {
    const initial = await Effect.runPromise(initialSpeechState("session"));
    expect(
      await errorCode(applySpeechEvent(initial, { type: "end", sessionId: "other", sequence: 0 })),
    ).toBe("unauthorized");
    expect(
      await errorCode(
        applySpeechEvent(initial, { type: "end", sessionId: "session", sequence: 1 }),
      ),
    ).toBe("conflict");
    const partial = await Effect.runPromise(
      applySpeechEvent(initial, {
        type: "partial",
        sessionId: "session",
        sequence: 0,
        utteranceId: "u1",
        text: "draft",
      }),
    );
    expect(
      await errorCode(
        applySpeechEvent(partial, {
          type: "partial",
          sessionId: "session",
          sequence: 0,
          utteranceId: "u1",
          text: "changed",
        }),
      ),
    ).toBe("conflict");
    expect(
      await errorCode(
        applySpeechEvent(partial, {
          type: "partial",
          sessionId: "session",
          sequence: 1,
          utteranceId: "u2",
          text: "different",
        }),
      ),
    ).toBe("conflict");
    expect(
      await errorCode(
        applySpeechEvent(partial, { type: "end", sessionId: "session", sequence: 1 }),
      ),
    ).toBe("conflict");
    const cancelled = await Effect.runPromise(
      applySpeechEvent(partial, { type: "cancel", sessionId: "session", sequence: 1 }),
    );
    expect(cancelled.text).toBe("");
    expect(cancelled.partial).toBeNull();
    expect(
      await Effect.runPromise(
        applySpeechEvent(cancelled, { type: "cancel", sessionId: "session", sequence: 1 }),
      ),
    ).toEqual(cancelled);
    expect(
      await errorCode(
        applySpeechEvent(cancelled, { type: "end", sessionId: "session", sequence: 2 }),
      ),
    ).toBe("conflict");
  });

  test("rejects malformed retained timing, sequence history and private extra fields", async () => {
    const initial = await Effect.runPromise(initialSpeechState("session"));
    const event = {
      type: "final",
      sessionId: "session",
      sequence: 0,
      utteranceId: "u1",
      text: "hello",
      startMs: 10,
      endMs: 20,
    };
    const valid = await Effect.runPromise(applySpeechEvent(initial, event));
    const invalidStates: readonly unknown[] = [
      { ...initial, nextSequence: 1 },
      { ...valid, text: "different" },
      { ...valid, phase: "ended" },
      { ...valid, lastEvent: { ...event, sessionId: "other" } },
      { ...valid, finalized: [{ utteranceId: "u1", text: "hello", startMs: 20, endMs: 10 }] },
      { ...valid, finalized: [{ utteranceId: "u1", text: "hello", startMs: 10 }] },
      { ...valid, partial: { utteranceId: "u1", text: "revision" } },
    ];
    for (const state of invalidStates)
      expect(
        await errorCode(
          applySpeechEvent(state, { type: "end", sessionId: "session", sequence: 1 }),
        ),
      ).toBe("invalid");
    expect(await errorCode(applySpeechEvent(initial, { ...event, endMs: 5 }))).toBe("invalid");
    expect(
      await errorCode(applySpeechEvent(initial, { ...event, privateExtra: "untrusted" })),
    ).toBe("invalid");
    expect(await errorCode(applySpeechEvent(valid, { ...event, sequence: 1 }))).toBe("conflict");
  });

  test("bounds individual text, accumulated text, retained utterances and event sequences", async () => {
    let state = await Effect.runPromise(initialSpeechState("session"));
    expect(
      await errorCode(
        applySpeechEvent(state, {
          type: "partial",
          sessionId: "session",
          sequence: 0,
          utteranceId: "u",
          text: "x".repeat(16_001),
        }),
      ),
    ).toBe("invalid");
    for (let sequence = 0; sequence < 7; sequence += 1)
      state = await Effect.runPromise(
        applySpeechEvent(state, {
          type: "final",
          sessionId: "session",
          sequence,
          utteranceId: `u${sequence}`,
          text: "x".repeat(16_000),
        }),
      );
    expect(
      await errorCode(
        applySpeechEvent(state, {
          type: "final",
          sessionId: "session",
          sequence: 7,
          utteranceId: "u7",
          text: "x".repeat(16_000),
        }),
      ),
    ).toBe("capacity");
    const finalized = Array.from({ length: 256 }, (_, index) => ({
      utteranceId: `u${index}`,
      text: "x",
    }));
    const full: SpeechState = {
      sessionId: "session",
      phase: "listening",
      nextSequence: 256,
      partial: null,
      finalized,
      text: finalized.map((item) => item.text).join(" "),
      lastEvent: {
        type: "final",
        sessionId: "session",
        sequence: 255,
        utteranceId: "u255",
        text: "x",
      },
    };
    expect(
      await errorCode(
        applySpeechEvent(full, {
          type: "final",
          sessionId: "session",
          sequence: 256,
          utteranceId: "u256",
          text: "x",
        }),
      ),
    ).toBe("capacity");
    const maxEvents: SpeechState = {
      sessionId: "session",
      phase: "listening",
      nextSequence: 1_000_000,
      partial: { utteranceId: "u", text: "x" },
      finalized: [],
      text: "",
      lastEvent: {
        type: "partial",
        sessionId: "session",
        sequence: 999_999,
        utteranceId: "u",
        text: "x",
      },
    };
    expect(
      await errorCode(
        applySpeechEvent(maxEvents, { type: "cancel", sessionId: "session", sequence: 1_000_000 }),
      ),
    ).toBe("capacity");
  });
});
