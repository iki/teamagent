import { describe, expect, test } from "bun:test";
import { rejects } from "node:assert/strict";
import { Effect } from "effect";
import {
  Media,
  MediaError,
  makeMedia,
  mediaLayer,
  mediaLimits,
  planMedia,
  validateMediaBackends,
  validateMediaRequest,
  type MediaBackend,
  type MediaCapability,
  type MediaPlan,
  type MediaPort,
} from "@/media";

const hash = "a".repeat(64);
const policy = { balanced: 10, quality: 10, latency: 10, cost: 10 };
function capability(
  operation: MediaCapability["operation"],
  overrides: Partial<MediaCapability> = {},
): MediaCapability {
  return {
    operation,
    model: null,
    default: true,
    formats: ["convert", "synthesize", "record"].includes(operation) ? ["wav"] : [],
    timestamps: [],
    diarization: false,
    referenceVoice: false,
    policy,
    limitations: [],
    ...overrides,
  };
}
function backend(
  id: string,
  capabilities: readonly MediaCapability[],
  overrides: Partial<MediaBackend> = {},
): MediaBackend {
  return {
    id,
    label: id,
    locality: "local",
    available: true,
    unavailableReason: null,
    capabilities: capabilities.map((item): MediaCapability => ({
      ...item,
      training: {
        version: "media-training/1",
        state: "excluded",
        defaultState: "excluded",
        scope: {
          backendId: id,
          provider: id,
          host: "fixture.invalid",
          operation: item.operation,
          model: item.model,
          accountId: null,
          routeRevision: "synthetic-test/1",
        },
        revision: "synthetic-test/1",
        accountRevision: null,
        reviewedAt: 0,
        expiresAt: Number.MAX_SAFE_INTEGER,
        sources: ["https://example.invalid/synthetic-test"],
        conditions: [],
        evidence: [],
        explanation: "Synthetic reviewed route for portable contract fixtures only.",
      },
    })),
    limitations: [],
    ...overrides,
  };
}
const local = backend("whisper-cpp", [
  capability("transcribe", {
    model: "base",
    timestamps: ["segment"],
    policy: { balanced: 1, quality: 20, latency: 5, cost: 1 },
  }),
]);
const remote = backend(
  "openai",
  [
    capability("transcribe", {
      model: "standard",
      policy: { balanced: 5, quality: 1, latency: 1, cost: 8 },
    }),
    capability("transcribe", {
      model: "diarize",
      default: false,
      timestamps: ["segment"],
      diarization: true,
    }),
  ],
  { locality: "remote" },
);
const provenance = {
  inputSha256: hash,
  referenceSha256: null,
  toolVersion: "fixture/1",
  providerRequestId: null,
  elapsedMs: 1,
  limitations: [],
};
function transcript(plan: MediaPlan) {
  return {
    operation: "transcribe",
    backend: plan.backend.id,
    model: plan.model,
    provenance,
    text: "Hello.",
    language: "en",
    timestamps: "none",
    diarization: false,
    segments: [],
  };
}
async function errorCode<A>(effect: Effect.Effect<A, MediaError>): Promise<MediaError["code"]> {
  return (await Effect.runPromise(Effect.flip(effect))).code;
}

describe("portable media contracts and selection", () => {
  test("decodes bounded operation-specific requests and rejects ambiguous or external-path input", async () => {
    const request = await Effect.runPromise(
      validateMediaRequest({
        operation: "convert",
        input: "audio.wav",
        format: "mp3",
        sampleRate: 24000,
        channels: 1,
        startSeconds: 0.5,
        durationSeconds: 20,
      }),
    );
    expect(request.operation).toBe("convert");
    expect(
      (
        await Effect.runPromise(
          validateMediaRequest({ operation: "synthesize", text: "Hello\nworld" }),
        )
      ).operation,
    ).toBe("synthesize");
    const invalid: readonly unknown[] = [
      { operation: "inspect", input: "https://example.com/audio.wav" },
      { operation: "inspect", input: "a.wav", modelCommand: "execute" },
      { operation: "convert", input: "a.wav", output: "a.wav", format: "wav" },
      {
        operation: "convert",
        input: "a.wav",
        format: "wav",
        durationSeconds: Number.POSITIVE_INFINITY,
      },
      { operation: "convert", input: "a.wav", format: "wav", sampleRate: 1 },
      { operation: "synthesize", text: " " },
      { operation: "synthesize", text: "hello\u0000world" },
      { operation: "synthesize", text: "hello", voice: "alloy", reference: "voice.wav" },
      { operation: "synthesize", text: "hello", referenceText: "reference" },
      { operation: "clone", name: "Voice" },
      { operation: "record", durationSeconds: 5, inputFormat: "pulse" },
      { operation: "record", device: "default", durationSeconds: 301, inputFormat: "pulse" },
      { operation: "record", device: "default", durationSeconds: 1, inputFormat: "unknown" },
      { operation: "transcribe", input: "a.wav", language: "en" + "-abcd".repeat(20) },
    ];
    for (const value of invalid)
      expect(await errorCode(validateMediaRequest(value))).toBe("invalid");
    expect(
      (
        await Effect.runPromise(
          validateMediaRequest({
            operation: "record",
            device: "default",
            inputFormat: "pulse",
            durationSeconds: 5,
          }),
        )
      ).operation,
    ).toBe("record");
  });

  test("rejects ambiguous or internally inconsistent capability catalogs", async () => {
    expect(await errorCode(validateMediaBackends([local, local]))).toBe("invalid");
    expect(
      await errorCode(
        validateMediaBackends([backend("bad", [capability("inspect", { diarization: true })])]),
      ),
    ).toBe("invalid");
    expect(
      await errorCode(
        validateMediaBackends([backend("bad", [capability("record", { formats: ["mp3"] })])]),
      ),
    ).toBe("invalid");
    expect(await errorCode(validateMediaBackends([{ ...local, available: false }]))).toBe(
      "invalid",
    );
    expect(
      await errorCode(
        validateMediaBackends([
          backend("bad", [
            capability("transcribe", { model: "a" }),
            capability("transcribe", { model: "b" }),
          ]),
        ]),
      ),
    ).toBe("invalid");
    expect(
      await errorCode(
        validateMediaBackends(
          Array.from({ length: mediaLimits.backends + 1 }, (_, index) =>
            backend(`b-${index}`, [capability("inspect")]),
          ),
        ),
      ),
    ).toBe("invalid");
  });

  test("ranks task-capable candidates deterministically using explicit policy, locality and model overrides", async () => {
    const request = { operation: "transcribe", input: "private-input.wav" };
    const balanced = await Effect.runPromise(planMedia(request, [remote, local]));
    const permuted = await Effect.runPromise(planMedia(request, [local, remote]));
    expect(balanced.backend.id).toBe("whisper-cpp");
    expect(permuted.candidates).toEqual(balanced.candidates);
    expect(balanced.policy.kind).toBe("configured-policy-not-benchmark");
    expect(JSON.stringify(balanced.candidates)).not.toContain("private-input.wav");
    const quality = await Effect.runPromise(
      planMedia({ ...request, preference: "quality" }, [local, remote]),
    );
    expect(quality.backend.id).toBe("openai");
    expect(
      (
        await Effect.runPromise(
          planMedia({ ...request, preference: "quality", locality: "local" }, [remote, local]),
        )
      ).backend.id,
    ).toBe("whisper-cpp");
    expect(
      (await Effect.runPromise(planMedia({ ...request, model: "diarize" }, [remote, local]))).model,
    ).toBe("diarize");
    expect(await errorCode(planMedia({ ...request, model: "missing" }, [remote, local]))).toBe(
      "unsupported",
    );
    expect(await errorCode(planMedia({ ...request, backend: "missing" }, [remote, local]))).toBe(
      "unavailable",
    );
    expect(
      await errorCode(
        planMedia({ ...request, backend: "openai", locality: "local" }, [remote, local]),
      ),
    ).toBe("unsupported");
  });

  test("does not transfer diarization, timestamps or reference-voice support between models or operations", async () => {
    const request = { operation: "transcribe", input: "source.wav", diarization: true };
    expect((await Effect.runPromise(planMedia(request, [local, remote]))).model).toBe("diarize");
    expect(
      await errorCode(
        planMedia({ ...request, backend: "openai", model: "standard" }, [local, remote]),
      ),
    ).toBe("unsupported");
    expect(
      await errorCode(
        planMedia({ operation: "transcribe", input: "source.wav", timestamps: "word" }, [
          local,
          remote,
        ]),
      ),
    ).toBe("unsupported");
    const piper = backend("piper", [capability("synthesize")]);
    const enrolling = backend("elevenlabs", [capability("clone")], { locality: "remote" });
    const reference = backend("reference-fixture", [
      capability("synthesize", { referenceVoice: true, referenceRequired: true }),
    ]);
    const synthesis = { operation: "synthesize", text: "Hello", reference: "reference.wav" };
    expect(await errorCode(planMedia(synthesis, [piper, enrolling]))).toBe("unsupported");
    expect(
      (await Effect.runPromise(planMedia(synthesis, [piper, enrolling, reference]))).backend.id,
    ).toBe("reference-fixture");
    expect(
      await errorCode(planMedia({ operation: "synthesize", text: "Hello" }, [reference])),
    ).toBe("unsupported");
    const explicitVoice = backend("voice-provider", [
      capability("synthesize", { requiresVoice: true }),
    ]);
    expect(
      await errorCode(planMedia({ operation: "synthesize", text: "Hello" }, [explicitVoice])),
    ).toBe("unsupported");
    expect(
      (
        await Effect.runPromise(
          planMedia({ operation: "synthesize", text: "Hello", voice: "voice-id" }, [explicitVoice]),
        )
      ).backend.id,
    ).toBe("voice-provider");
    expect(
      (
        await Effect.runPromise(
          planMedia({ operation: "clone", reference: "voice.wav", name: "Voice" }, [
            piper,
            enrolling,
          ]),
        )
      ).backend.id,
    ).toBe("elevenlabs");
  });

  test("rejects unsupported requests before execution and never retries a different backend after failure", async () => {
    let executions = 0;
    let catalogs = 0;
    const port: MediaPort = {
      listBackends: () =>
        Effect.sync(() => {
          catalogs += 1;
          return [local, remote];
        }),
      execute: () =>
        Effect.sync(() => {
          executions += 1;
        }).pipe(
          Effect.andThen(
            Effect.fail(new MediaError({ code: "network", message: "Fixture transport failed." })),
          ),
        ),
    };
    const media = makeMedia(port);
    expect(catalogs).toBe(0);
    expect(await errorCode(media.run({ operation: "inspect", input: "x", unexpected: true }))).toBe(
      "invalid",
    );
    expect(catalogs).toBe(0);
    expect(
      await errorCode(media.run({ operation: "transcribe", input: "a.wav", timestamps: "word" })),
    ).toBe("unsupported");
    expect(executions).toBe(0);
    expect(await errorCode(media.run({ operation: "transcribe", input: "a.wav" }))).toBe("network");
    expect(executions).toBe(1);
    const offline = makeMedia({
      ...port,
      listBackends: () =>
        Effect.succeed([
          { ...local, available: false, unavailableReason: "Not configured." },
          remote,
        ]),
    });
    expect(
      await errorCode(
        offline.run({ operation: "transcribe", input: "a.wav", backend: "whisper-cpp" }),
      ),
    ).toBe("unavailable");
    expect(executions).toBe(1);
  });

  test("validates provider identity, source provenance, transcript bounds and timing evidence", async () => {
    let mode = "valid";
    const media = makeMedia({
      listBackends: () => Effect.succeed([local]),
      execute: (plan) => {
        const base = transcript(plan);
        if (mode === "identity") return Effect.succeed({ ...base, backend: "other" });
        if (mode === "provenance")
          return Effect.succeed({ ...base, provenance: { ...provenance, inputSha256: null } });
        if (mode === "oversize")
          return Effect.succeed({
            ...base,
            text: "a".repeat(mediaLimits.transcriptCharacters + 1),
          });
        if (mode === "missing-timing") return Effect.succeed({ ...base, timestamps: "segment" });
        if (mode === "backwards")
          return Effect.succeed({
            ...base,
            timestamps: "segment",
            segments: [{ startSeconds: 2, endSeconds: 1, text: "Hello", speaker: null }],
          });
        if (mode === "unordered")
          return Effect.succeed({
            ...base,
            timestamps: "segment",
            segments: [
              { startSeconds: 2, endSeconds: 3, text: "Hello", speaker: null },
              { startSeconds: 1, endSeconds: 2, text: "Again", speaker: null },
            ],
          });
        return Effect.succeed(base);
      },
    });
    expect(
      (await Effect.runPromise(media.run({ operation: "transcribe", input: "a.wav" }))).operation,
    ).toBe("transcribe");
    for (mode of ["identity", "provenance", "oversize", "missing-timing", "backwards", "unordered"])
      expect(await errorCode(media.run({ operation: "transcribe", input: "a.wav" }))).toBe(
        "integrity",
      );
  });

  test("retains pending voice verification and rejects artifact format or authorization-provenance mismatch", async () => {
    const enrolling = backend("elevenlabs", [capability("clone")], { locality: "remote" });
    const media = makeMedia({
      listBackends: () => Effect.succeed([enrolling]),
      execute: (plan) =>
        Effect.succeed({
          operation: "clone",
          backend: plan.backend.id,
          model: null,
          provenance: { ...provenance, inputSha256: null, referenceSha256: hash },
          voiceId: "voice-1",
          requiresVerification: true,
        }),
    });
    const result = await Effect.runPromise(
      media.run({ operation: "clone", reference: "voice.wav", name: "Example" }),
    );
    if (result.operation !== "clone") throw new Error("Expected enrollment result.");
    expect(result.requiresVerification).toBe(true);
    expect(
      await errorCode(
        media.run({
          operation: "clone",
          reference: "voice.wav",
          name: "Example",
          voiceAuthorization: "Supplied by user",
        }),
      ),
    ).toBe("integrity");
    const recorder = makeMedia({
      listBackends: () => Effect.succeed([backend("ffmpeg", [capability("record")])]),
      execute: () =>
        Effect.succeed({
          operation: "record",
          backend: "ffmpeg",
          model: null,
          provenance: { ...provenance, inputSha256: null },
          artifact: { path: "out.mp3", mimeType: "audio/mpeg", sha256: hash, sizeBytes: 100 },
        }),
    });
    expect(
      await errorCode(
        recorder.run({
          operation: "record",
          device: "default",
          inputFormat: "pulse",
          durationSeconds: 1,
        }),
      ),
    ).toBe("integrity");
  });

  test("requires unambiguous raw PCM interpretation and matching requested sample layout", async () => {
    let pcm: unknown = undefined;
    let mimeType = "audio/pcm";
    let sizeBytes = 100;
    const media = makeMedia({
      listBackends: () =>
        Effect.succeed([backend("ffmpeg", [capability("convert", { formats: ["pcm", "wav"] })])]),
      execute: () =>
        Effect.succeed({
          operation: "convert",
          backend: "ffmpeg",
          model: null,
          provenance,
          artifact: {
            path: "output",
            mimeType,
            sha256: hash,
            sizeBytes,
            ...(pcm === undefined ? {} : { pcm }),
          },
        }),
    });
    const request = { operation: "convert", input: "input.wav", format: "pcm" };
    expect(await errorCode(media.run(request))).toBe("integrity");
    pcm = { encoding: "pcm_s16le", sampleRate: 24000, channels: 1 };
    const result = await Effect.runPromise(media.run(request));
    if (result.operation !== "convert") throw new Error("Expected converted PCM.");
    expect(result.artifact.pcm?.sampleRate).toBe(24000);
    expect(await errorCode(media.run({ ...request, sampleRate: 16000 }))).toBe("integrity");
    sizeBytes = 99;
    expect(await errorCode(media.run(request))).toBe("integrity");
    sizeBytes = 100;
    mimeType = "audio/wav";
    expect(await errorCode(media.run({ ...request, format: "wav" }))).toBe("integrity");
  });
  test("composes as an Effect service and preserves adapter cancellation cleanup", async () => {
    const started = Promise.withResolvers<void>();
    let cleaned = false;
    const port: MediaPort = {
      listBackends: () => Effect.succeed([local]),
      execute: () =>
        Effect.sync(() => started.resolve()).pipe(
          Effect.andThen(Effect.never),
          Effect.ensuring(
            Effect.sync(() => {
              cleaned = true;
            }),
          ),
        ),
    };
    const catalog = await Effect.runPromise(
      Effect.gen(function* () {
        return yield* (yield* Media).listBackends();
      }).pipe(Effect.provide(mediaLayer(port))),
    );
    expect(catalog[0]?.id).toBe("whisper-cpp");
    const controller = new AbortController();
    const pending = Effect.runPromise(
      makeMedia(port).run({ operation: "transcribe", input: "a.wav" }),
      { signal: controller.signal },
    );
    await started.promise;
    controller.abort();
    await rejects(pending);
    expect(cleaned).toBe(true);
  });
});

test("selection requires reference transcripts and respects voice-or-reference alternatives", async () => {
  const omni = backend("omnivoice", [
    capability("synthesize", {
      model: "omnivoice-local",
      referenceVoice: true,
      referenceRequired: true,
      referenceTextRequired: true,
      referenceTextSupported: true,
    }),
  ]);
  const fish = backend(
    "fish",
    [
      capability("synthesize", {
        model: "s2.1-pro",
        referenceVoice: true,
        referenceTextRequired: true,
        referenceTextSupported: true,
        requiresVoiceOrReference: true,
      }),
    ],
    { locality: "remote" },
  );
  const text = { operation: "synthesize", text: "Hello" };
  for (const request of [text, { ...text, reference: "voice.wav" }])
    expect(await errorCode(planMedia(request, [omni, fish]))).toBe("unsupported");
  const reference = await Effect.runPromise(
    planMedia(
      { ...text, reference: "voice.wav", referenceText: "Recorded words", backend: "omnivoice" },
      [omni, fish],
    ),
  );
  expect(reference.backend.id).toBe("omnivoice");
  const voice = await Effect.runPromise(planMedia({ ...text, voice: "enrolled" }, [omni, fish]));
  expect(voice.backend.id).toBe("fish");
  expect(
    await errorCode(
      validateMediaBackends([
        backend("bad", [capability("transcribe", { referenceTextRequired: true })]),
      ]),
    ),
  ).toBe("invalid");
  expect(
    await errorCode(
      validateMediaBackends([
        backend("bad", [capability("synthesize", { requiresVoiceOrReference: true })]),
      ]),
    ),
  ).toBe("invalid");
});

test("automatic synthesis selection preserves supplied reference text instead of choosing an incompatible local worker", async () => {
  const chatterbox = backend("chatterbox", [
    capability("synthesize", {
      referenceVoice: true,
      referenceRequired: true,
      policy: { balanced: 0, quality: 0, latency: 0, cost: 0 },
    }),
  ]);
  const omnivoice = backend("omnivoice", [
    capability("synthesize", {
      referenceVoice: true,
      referenceRequired: true,
      referenceTextRequired: true,
      referenceTextSupported: true,
    }),
  ]);
  const request = {
    operation: "synthesize",
    text: "New words",
    reference: "voice.wav",
    referenceText: "Recorded words",
  };
  const selected = await Effect.runPromise(planMedia(request, [chatterbox, omnivoice]));
  expect(selected.backend.id).toBe("omnivoice");
  expect(
    selected.candidates.find((candidate) => candidate.backendId === "chatterbox")?.eligible,
  ).toBe(false);
  expect(
    await errorCode(planMedia({ ...request, backend: "chatterbox" }, [chatterbox, omnivoice])),
  ).toBe("unsupported");
});
