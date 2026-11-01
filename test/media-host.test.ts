import { mkdtemp } from "./temporary.ts";
import { test } from "bun:test";
import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { mkdir, readFile, readdir, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { Effect, Fiber, Schema } from "effect";
import {
  createMediaHost as createHost,
  type MediaHostOptions,
  loadMediaConfig,
  requestMedia,
  downloadMedia,
  runMediaProcess,
  type MediaTransport,
} from "../app/media/index.ts";

import type { TrainingAccountConfig, TrainingBinding, TrainingEvidence } from "@/media";
import { mediaTrainingReview, resolveMediaTrainingPolicy } from "../app/media/training.ts";

/** Documentary and authenticated identity fixtures; these never assert real account policy. */
function openAiTrainingFixture(): TrainingAccountConfig {
  const account = { accountId: "fixture-account", revision: "fixture-account-v1", evidence: [] };
  const routes = [
    { operation: "transcribe", model: "gpt-transcribe" },
    { operation: "synthesize", model: "gpt-4o-mini-tts" },
  ];
  const evidence: TrainingEvidence[] = routes.map((route) => {
    const policy = resolveMediaTrainingPolicy({ backendId: "openai", ...route, account });
    return {
      id: "fixture-" + route.operation,
      scope: policy.scope,
      policyRevision: policy.revision,
      credentialBinding: "fixture-key-id",
      accountRevision: account.revision,
      condition: "sharing-disabled",
      effect: "excluded",
      kind: "document-review",
      reviewedAt: mediaTrainingReview.reviewedAt,
      expiresAt: mediaTrainingReview.expiresAt,
      invalidated: false,
      sourceUrl: "https://example.invalid/fixture-document",
      artifactSha256: "a".repeat(64),
      reviewer: "fixture-reviewer",
      reference:
        "Synthetic test evidence; no real credentials, accounts or provider were contacted.",
    };
  });
  return { ...account, evidence };
}
function createMediaHost(options: MediaHostOptions) {
  return createHost({
    ...options,
    trainingVerifier: async (backendId, signal): Promise<TrainingBinding | undefined> => {
      signal.throwIfAborted();
      if (backendId !== "openai") return undefined;
      const now = Date.now();
      return {
        backendId: "openai",
        host: "api.openai.com",
        accountId: "fixture-account",
        credentialBinding: "fixture-key-id",
        verifiedAt: now,
        expiresAt: now + 60000,
        verification: "authenticated-account",
      };
    },
  });
}
function wav(): Uint8Array {
  const bytes = Buffer.alloc(3244);
  bytes.write("RIFF");
  bytes.writeUInt32LE(3236, 4);
  bytes.write("WAVEfmt ", 8);
  bytes.writeUInt32LE(16, 16);
  bytes.writeUInt16LE(1, 20);
  bytes.writeUInt16LE(1, 22);
  bytes.writeUInt32LE(16000, 24);
  bytes.writeUInt32LE(32000, 28);
  bytes.writeUInt16LE(2, 32);
  bytes.writeUInt16LE(16, 34);
  bytes.write("data", 36);
  bytes.writeUInt32LE(3200, 40);
  return bytes;
}
const hash = (bytes: Uint8Array): string => createHash("sha256").update(bytes).digest("hex");
const json = (value: unknown): Uint8Array => new TextEncoder().encode(JSON.stringify(value));
async function fixture() {
  const root = await mkdtemp(join(tmpdir(), "teamagent-media-"));
  await mkdir(join(root, "output"));
  await writeFile(join(root, "source.wav"), wav());
  await writeFile(join(root, "model.bin"), "fixture model");
  await writeFile(join(root, "voice.onnx"), "fixture model");
  await writeFile(join(root, "voice.onnx.json"), "{}");
  const base = {
    training: { openai: openAiTrainingFixture() },
    inputRoot: root,
    outputRoot: join(root, "output"),
    ffmpeg: { executable: process.execPath, probeExecutable: process.execPath },
  };
  return {
    root,
    base,
    cleanup: () => rm(root, { recursive: true, force: true, maxRetries: 8, retryDelay: 100 }),
  };
}
const unavailableTransport: Partial<MediaTransport> = {
  environment: () => undefined,
  process: async () => {
    throw new Error("unexpected process");
  },
  request: async () => {
    throw new Error("unexpected request");
  },
};
async function rejectCode(work: Promise<unknown>, code: string): Promise<void> {
  await assert.rejects(
    work,
    (error: unknown) => error instanceof Error && JSON.stringify(error).includes(code),
  );
}
test("media discovery reads only configured key references and never invokes backends", async () => {
  const f = await fixture();
  try {
    const names: string[] = [];
    const api = await Effect.runPromise(
      createMediaHost({
        config: { ...f.base, openai: { apiKeyEnv: "EXPLICIT_FIXTURE_KEY" } },
        transport: {
          ...unavailableTransport,
          environment: (name) => {
            names.push(name);
            return undefined;
          },
        },
      }),
    );
    const catalog = await Effect.runPromise(api.listBackends());
    assert.equal(catalog.find((backend) => backend.id === "ffmpeg")?.available, true);
    assert.equal(catalog.find((backend) => backend.id === "openai")?.available, false);
    assert.equal(catalog.find((backend) => backend.id === "whisper-cpp")?.available, false);
    assert.deepEqual(names, ["EXPLICIT_FIXTURE_KEY"]);
    await rejectCode(
      Effect.runPromise(
        api.run({ operation: "transcribe", input: "source.wav", locality: "local" }),
      ),
      "unsupported",
    );
  } finally {
    await f.cleanup();
  }
});
test("media configuration is explicit, schema-checked and resolves beside its file", async () => {
  const f = await fixture();
  try {
    const file = join(f.root, "media.json");
    await writeFile(file, JSON.stringify({ inputRoot: ".", outputRoot: "output" }));
    const config = await Effect.runPromise(loadMediaConfig(file, tmpdir()));
    assert.equal(config.inputRoot, f.root);
    assert.equal(config.outputRoot, join(f.root, "output"));
    await rejectCode(
      Effect.runPromise(
        createMediaHost({ config: { ...f.base, openai: { apiKey: "not-allowed" } } }),
      ),
      "invalid",
    );
    await rejectCode(
      Effect.runPromise(createMediaHost({ config: { ...f.base, limits: { timeoutMs: 0 } } })),
      "invalid",
    );
  } finally {
    await f.cleanup();
  }
});
test("FFprobe inspection preserves original evidence and constrains demuxers", async () => {
  const f = await fixture();
  try {
    const api = await Effect.runPromise(
      createMediaHost({
        config: f.base,
        transport: {
          ...unavailableTransport,
          process: async (_executable, args) => {
            assert.ok(args.includes("-format_whitelist"));
            assert.ok(args.includes("file,pipe"));
            return json({
              format: { format_name: "wav", duration: "0.1" },
              streams: [
                { codec_type: "audio", codec_name: "pcm_s16le", sample_rate: "16000", channels: 1 },
              ],
              program_version: { version: "fixture-1" },
            });
          },
        },
      }),
    );
    const result = await Effect.runPromise(api.run({ operation: "inspect", input: "source.wav" }));
    assert.equal(result.operation, "inspect");
    if (result.operation !== "inspect") throw new Error("unexpected result");
    assert.equal(result.media.durationSeconds, 0.1);
    assert.equal(result.provenance.inputSha256, hash(wav()));
    assert.equal(result.provenance.toolVersion, "fixture-1");
    assert.deepEqual(await readdir(join(f.root, "output")), []);
  } finally {
    await f.cleanup();
  }
});
test("FFmpeg conversion publishes once and rejects output traversal before execution", async () => {
  const f = await fixture();
  let calls = 0;
  try {
    const api = await Effect.runPromise(
      createMediaHost({
        config: f.base,
        transport: {
          ...unavailableTransport,
          process: async (_executable, args) => {
            calls += 1;
            const target = args.at(-1);
            assert.ok(target);
            assert.ok(args.includes("-n"));
            assert.ok(args.includes("-ar"));
            await writeFile(target, wav());
            return new Uint8Array();
          },
        },
      }),
    );
    const result = await Effect.runPromise(
      api.run({
        operation: "convert",
        input: "source.wav",
        format: "wav",
        output: "converted.wav",
        sampleRate: 16000,
      }),
    );
    assert.equal(result.operation, "convert");
    if (result.operation !== "convert") throw new Error("unexpected result");
    assert.equal(result.artifact.sha256, hash(wav()));
    await rejectCode(
      Effect.runPromise(
        api.run({
          operation: "convert",
          input: "source.wav",
          format: "wav",
          output: "converted.wav",
        }),
      ),
      "conflict",
    );
    await rejectCode(
      Effect.runPromise(
        api.run({
          operation: "convert",
          input: "source.wav",
          format: "wav",
          output: "../escape.wav",
        }),
      ),
      "invalid",
    );
    assert.equal(calls, 1);
    assert.deepEqual(await readFile(join(f.root, "source.wav")), Buffer.from(wav()));
  } finally {
    await f.cleanup();
  }
});
test("whisper.cpp normalizes input and decodes millisecond segment offsets", async () => {
  const f = await fixture();
  const calls: readonly string[][] = [];
  const seen: string[][] = [...calls];
  try {
    const api = await Effect.runPromise(
      createMediaHost({
        config: {
          ...f.base,
          whisperCpp: { executable: process.execPath, modelPath: join(f.root, "model.bin") },
        },
        transport: {
          ...unavailableTransport,
          process: async (_executable, args) => {
            seen.push([...args]);
            if (args.includes("-oj")) {
              const prefix = args[args.indexOf("-of") + 1];
              assert.ok(prefix);
              await writeFile(
                prefix + ".json",
                JSON.stringify({
                  result: { language: "en" },
                  transcription: [{ text: "Hello", offsets: { from: 100, to: 750 } }],
                }),
              );
            } else {
              const target = args.at(-1);
              assert.ok(target);
              await writeFile(target, wav());
            }
            return new Uint8Array();
          },
        },
      }),
    );
    const result = await Effect.runPromise(
      api.run({
        operation: "transcribe",
        input: "source.wav",
        backend: "whisper-cpp",
        timestamps: "segment",
      }),
    );
    assert.equal(result.operation, "transcribe");
    if (result.operation !== "transcribe") throw new Error("unexpected result");
    assert.equal(result.text, "Hello");
    assert.equal(result.segments[0]?.startSeconds, 0.1);
    assert.equal(result.segments[0]?.endSeconds, 0.75);
    assert.equal(result.provenance.inputSha256, hash(wav()));
    assert.ok(seen[0]?.includes("16000"));
    assert.equal(seen.length, 2);
    await rejectCode(
      Effect.runPromise(
        api.run({
          operation: "transcribe",
          input: "source.wav",
          backend: "whisper-cpp",
          timestamps: "word",
        }),
      ),
      "unsupported",
    );
    assert.equal(seen.length, 2);
  } finally {
    await f.cleanup();
  }
});
test("Piper uses stdin and explicit output without reference voice claims", async () => {
  const f = await fixture();
  try {
    const api = await Effect.runPromise(
      createMediaHost({
        config: {
          ...f.base,
          piper: { executable: process.execPath, modelPath: join(f.root, "voice.onnx") },
        },
        transport: {
          ...unavailableTransport,
          process: async (_executable, args, options) => {
            assert.equal(new TextDecoder().decode(options.input), "Hello fixture\n");
            assert.ok(args.includes("--output-file"));
            const target = args[args.indexOf("--output-file") + 1];
            assert.ok(target);
            await writeFile(target, wav());
            return new Uint8Array();
          },
        },
      }),
    );
    const result = await Effect.runPromise(
      api.run({ operation: "synthesize", text: "Hello fixture", backend: "piper", format: "wav" }),
    );
    assert.equal(result.operation, "synthesize");
    await rejectCode(
      Effect.runPromise(
        api.run({
          operation: "synthesize",
          text: "Hello",
          backend: "piper",
          reference: "source.wav",
        }),
      ),
      "unsupported",
    );
  } finally {
    await f.cleanup();
  }
});
test("OpenAI current file STT uses explicit credentials, language arrays and fixed origin", async () => {
  const f = await fixture();
  let calls = 0;
  try {
    const api = await Effect.runPromise(
      createMediaHost({
        config: { ...f.base, openai: { apiKeyEnv: "MEDIA_FIXTURE_KEY" } },
        transport: {
          ...unavailableTransport,
          environment: (name) => (name === "MEDIA_FIXTURE_KEY" ? "fixture-secret" : undefined),
          request: async (url, options) => {
            calls += 1;
            assert.equal(url, "https://api.openai.com/v1/audio/transcriptions");
            assert.equal(options.headers.authorization, "Bearer fixture-secret");
            assert.ok(new TextDecoder().decode(options.body).includes('name="languages[]"'));
            return {
              status: 200,
              contentType: "application/json",
              requestId: "fixture-request",
              bytes: json({ text: "Bonjour", languages: [{ code: "fr" }] }),
            };
          },
        },
      }),
    );
    const result = await Effect.runPromise(
      api.run({ operation: "transcribe", backend: "openai", input: "source.wav", language: "fr" }),
    );
    assert.equal(result.operation, "transcribe");
    if (result.operation !== "transcribe") throw new Error("unexpected result");
    assert.equal(result.language, "fr");
    assert.equal(result.model, "gpt-transcribe");
    assert.equal(result.provenance.providerRequestId, "fixture-request");
    assert.equal(calls, 1);
    assert.ok(!JSON.stringify(result).includes("fixture-secret"));
  } finally {
    await f.cleanup();
  }
});
test("provider redirects and permission failures are sanitized without fallback or retry", async () => {
  const f = await fixture();
  try {
    for (const status of [302, 403, 429]) {
      let calls = 0;
      const api = await Effect.runPromise(
        createMediaHost({
          config: { ...f.base, openai: { apiKeyEnv: "KEY" }, elevenlabs: { apiKeyEnv: "KEY" } },
          transport: {
            ...unavailableTransport,
            environment: () => "fixture-secret",
            request: async () => {
              calls += 1;
              return {
                status,
                contentType: "application/json",
                requestId: null,
                bytes: json({ error: "fixture-secret raw payload" }),
              };
            },
          },
        }),
      );
      await assert.rejects(
        Effect.runPromise(
          api.run({ operation: "transcribe", backend: "openai", input: "source.wav" }),
        ),
        (error: unknown) =>
          error instanceof Error && !JSON.stringify(error).includes("fixture-secret"),
      );
      assert.equal(calls, 1);
    }
    await assert.rejects(
      requestMedia("https://example.invalid/audio", {
        headers: {},
        body: new Uint8Array(),
        signal: new AbortController().signal,
        maxBytes: 1024,
        timeoutMs: 100,
      }),
      /origin/,
    );
  } finally {
    await f.cleanup();
  }
});
test("ElevenLabs supports word/speaker evidence and enrollment verification state", async () => {
  const f = await fixture();
  const urls: string[] = [];
  try {
    const api = await Effect.runPromise(
      createMediaHost({
        config: { ...f.base, elevenlabs: { apiKeyEnv: "KEY", voiceId: "voice123" } },
        transport: {
          ...unavailableTransport,
          environment: () => "fixture-key",
          request: async (url, options) => {
            urls.push(url);
            assert.equal(options.headers["xi-api-key"], "fixture-key");
            return {
              status: 200,
              contentType: "application/json",
              requestId: null,
              bytes: url.endsWith("/voices/add")
                ? json({ voice_id: "enrolled123", requires_verification: true })
                : json({
                    text: "Hello",
                    language_code: "eng",
                    words: [
                      { text: "Hello", start: 0, end: 1, speaker_id: "speaker_0", type: "word" },
                    ],
                  }),
            };
          },
        },
      }),
    );
    const transcript = await Effect.runPromise(
      api.run({
        operation: "transcribe",
        backend: "elevenlabs",
        allowTraining: true,
        input: "source.wav",
        diarization: true,
      }),
    );
    assert.equal(transcript.operation, "transcribe");
    if (transcript.operation !== "transcribe") throw new Error("unexpected result");
    assert.equal(transcript.timestamps, "word");
    assert.equal(transcript.segments[0]?.speaker, "speaker_0");
    const enrollment = await Effect.runPromise(
      api.run({
        operation: "clone",
        backend: "elevenlabs",
        allowTraining: true,
        reference: "source.wav",
        name: "Fixture voice",
        voiceAuthorization: "Fixture permission record",
      }),
    );
    assert.equal(enrollment.operation, "clone");
    if (enrollment.operation !== "clone") throw new Error("unexpected result");
    assert.equal(enrollment.requiresVerification, true);
    assert.equal(enrollment.provenance.referenceSha256, hash(wav()));
    assert.equal(enrollment.provenance.voiceAuthorization, "Fixture permission record");
    assert.deepEqual(urls, [
      "https://api.elevenlabs.io/v1/speech-to-text",
      "https://api.elevenlabs.io/v1/voices/add",
    ]);
  } finally {
    await f.cleanup();
  }
});
test("explicit legacy OpenAI TTS validates audio and prevents overwrites", async () => {
  const f = await fixture();
  let calls = 0;
  try {
    const api = await Effect.runPromise(
      createMediaHost({
        config: {
          ...f.base,
          openai: { apiKeyEnv: "KEY", allowLegacySpeech: true, speechModel: "gpt-4o-mini-tts" },
        },
        transport: {
          ...unavailableTransport,
          environment: () => "fixture-key",
          request: async (url) => {
            calls += 1;
            assert.equal(url, "https://api.openai.com/v1/audio/speech");
            return { status: 200, contentType: "audio/wav", requestId: null, bytes: wav() };
          },
        },
      }),
    );
    const result = await Effect.runPromise(
      api.run({
        operation: "synthesize",
        backend: "openai",
        text: "Hello",
        format: "wav",
        output: "speech.wav",
      }),
    );
    assert.equal(result.operation, "synthesize");
    assert.ok(result.provenance.limitations.some((note) => note.includes("2027-01-06")));
    await rejectCode(
      Effect.runPromise(
        api.run({
          operation: "synthesize",
          backend: "openai",
          text: "Hello",
          format: "wav",
          output: "speech.wav",
        }),
      ),
      "conflict",
    );
    assert.equal(calls, 1);
  } finally {
    await f.cleanup();
  }
});
test("media cancellation joins worker cleanup and removes staged source copies", async () => {
  const f = await fixture();
  let entered: () => void = () => undefined;
  const ready = new Promise<void>((resolve) => {
    entered = resolve;
  });
  let joined = false;
  try {
    const api = await Effect.runPromise(
      createMediaHost({
        config: f.base,
        transport: {
          ...unavailableTransport,
          process: async (_exe, _args, options) => {
            entered();
            await new Promise<void>((resolve) =>
              options.signal.addEventListener("abort", () => setTimeout(resolve, 30), {
                once: true,
              }),
            );
            joined = true;
            throw new Error("cancelled");
          },
        },
      }),
    );
    const fiber = Effect.runFork(api.run({ operation: "inspect", input: "source.wav" }));
    await ready;
    await Effect.runPromise(Fiber.interrupt(fiber));
    assert.equal(joined, true);
    assert.deepEqual(await readdir(join(f.root, "output")), []);
  } finally {
    await f.cleanup();
  }
});
test("native media process output and timeout limits terminate bounded work", async () => {
  const f = await fixture();
  try {
    const options = {
      cwd: f.root,
      signal: new AbortController().signal,
      maxBytes: 1024,
      timeoutMs: 1000,
    };
    await assert.rejects(
      runMediaProcess(process.execPath, ["-e", "process.stdout.write('x'.repeat(8192))"], options),
      /limit/,
    );
    await assert.rejects(
      runMediaProcess(process.execPath, ["-e", "setInterval(() => {}, 1000)"], {
        ...options,
        timeoutMs: 100,
      }),
      /limit/,
    );
  } finally {
    await f.cleanup();
  }
}, 20_000);
test("Chatterbox plans require a reference and invoke only the isolated local worker", async () => {
  const f = await fixture();
  try {
    const packageRoot = join(f.root, "package");
    const weights = join(f.root, "weights");
    await mkdir(join(packageRoot, "chatterbox"), { recursive: true });
    await mkdir(weights);
    await writeFile(join(packageRoot, "chatterbox", "tts.py"), "# fixture");
    for (const name of [
      "ve.safetensors",
      "t3_cfg.safetensors",
      "s3gen.safetensors",
      "tokenizer.json",
    ])
      await writeFile(join(weights, name), "fixture");
    let workerCalls = 0;
    const api = await Effect.runPromise(
      createMediaHost({
        config: {
          ...f.base,
          chatterbox: {
            pythonExecutable: process.execPath,
            packageRoot,
            weightsDirectory: weights,
          },
        },
        transport: {
          ...unavailableTransport,
          process: async (_exe, args, options) => {
            if (args[0]?.endsWith("chatterbox-worker.py")) {
              workerCalls += 1;
              const Payload = Schema.Struct({
                output: Schema.String,
                reference: Schema.String,
                device: Schema.String,
              });
              const dynamic: unknown = JSON.parse(new TextDecoder().decode(options.input));
              const payload = Schema.decodeUnknownSync(Payload)(dynamic);
              assert.equal(payload.device, "cpu");
              assert.ok(payload.reference.endsWith("normalized-reference.wav"));
              await writeFile(payload.output, wav());
            } else {
              const target = args.at(-1);
              assert.ok(target);
              await writeFile(target, wav());
            }
            return new Uint8Array();
          },
        },
      }),
    );
    await rejectCode(
      Effect.runPromise(
        api.plan({ operation: "synthesize", backend: "chatterbox", text: "Hello" }),
      ),
      "unsupported",
    );
    const result = await Effect.runPromise(
      api.run({
        operation: "synthesize",
        backend: "chatterbox",
        text: "Hello",
        reference: "source.wav",
      }),
    );
    assert.equal(result.operation, "synthesize");
    assert.equal(workerCalls, 1);
    assert.equal(result.provenance.referenceSha256, hash(wav()));
  } finally {
    await f.cleanup();
  }
});

test("media policy preferences and explicit configured priorities cannot bypass unverified remote policy during passive selection", async () => {
  const f = await fixture();
  try {
    const config = {
      ...f.base,
      whisperCpp: { executable: process.execPath, modelPath: join(f.root, "model.bin") },
      openai: { apiKeyEnv: "KEY" },
    };
    const transport = { ...unavailableTransport, environment: () => "fixture-key" };
    const api = await Effect.runPromise(createMediaHost({ config, transport }));
    assert.equal(
      (
        await Effect.runPromise(
          api.plan({ operation: "transcribe", input: "source.wav", preference: "cost" }),
        )
      ).backend.id,
      "whisper-cpp",
    );
    assert.equal(
      (
        await Effect.runPromise(
          api.plan({ operation: "transcribe", input: "source.wav", preference: "quality" }),
        )
      ).backend.id,
      "whisper-cpp",
    );
    const override = await Effect.runPromise(
      createMediaHost({
        config: {
          ...config,
          priorities: {
            openai: { balanced: 0, quality: 0, latency: 0, cost: 0 },
            "whisper-cpp": { balanced: 10, quality: 10, latency: 10, cost: 10 },
          },
        },
        transport,
      }),
    );
    assert.equal(
      (
        await Effect.runPromise(
          override.plan({ operation: "transcribe", input: "source.wav", preference: "cost" }),
        )
      ).backend.id,
      "whisper-cpp",
    );
  } finally {
    await f.cleanup();
  }
});
test("microphone capture requires an explicit platform device and bounded duration", async () => {
  const f = await fixture();
  let calls = 0;
  try {
    const inputFormat =
      process.platform === "win32"
        ? "dshow"
        : process.platform === "darwin"
          ? "avfoundation"
          : "alsa";
    const api = await Effect.runPromise(
      createMediaHost({
        config: f.base,
        transport: {
          ...unavailableTransport,
          process: async (_exe, args) => {
            calls += 1;
            assert.ok(args.includes("fixture-device"));
            assert.ok(args.includes(inputFormat));
            assert.ok(args.includes("-t"));
            const output = args.at(-1);
            assert.ok(output);
            await writeFile(output, wav());
            return new Uint8Array();
          },
        },
      }),
    );
    await rejectCode(
      Effect.runPromise(api.run({ operation: "record", inputFormat, durationSeconds: 1 })),
      "invalid",
    );
    await rejectCode(
      Effect.runPromise(
        api.run({
          operation: "record",
          device: "fixture-device",
          inputFormat,
          durationSeconds: 300,
        }),
      ),
      "limit",
    );
    assert.equal(calls, 0);
    const result = await Effect.runPromise(
      api.run({
        operation: "record",
        device: "fixture-device",
        inputFormat,
        durationSeconds: 1,
        output: "recording.wav",
      }),
    );
    assert.equal(result.operation, "record");
    assert.equal(result.provenance.inputSha256, null);
    assert.equal(calls, 1);
  } finally {
    await f.cleanup();
  }
});
test("input and response byte limits reject before unsafe output publication", async () => {
  const f = await fixture();
  let calls = 0;
  try {
    const tooSmall = await Effect.runPromise(
      createMediaHost({
        config: { ...f.base, limits: { inputBytes: 1024 } },
        transport: unavailableTransport,
      }),
    );
    await rejectCode(
      Effect.runPromise(tooSmall.run({ operation: "inspect", input: "source.wav" })),
      "limit",
    );
    const api = await Effect.runPromise(
      createMediaHost({
        config: { ...f.base, openai: { apiKeyEnv: "KEY" }, limits: { processOutputBytes: 1024 } },
        transport: {
          ...unavailableTransport,
          environment: () => "fixture-key",
          request: async () => {
            calls += 1;
            return {
              status: 200,
              contentType: "application/json",
              requestId: null,
              bytes: json({ text: "x".repeat(2048) }),
            };
          },
        },
      }),
    );
    await rejectCode(
      Effect.runPromise(
        api.run({ operation: "transcribe", backend: "openai", input: "source.wav" }),
      ),
      "limit",
    );
    assert.equal(calls, 1);
    assert.deepEqual(await readdir(join(f.root, "output")), []);
    const artifact = join(f.root, "oversized.bin");
    await assert.rejects(
      runMediaProcess(
        process.execPath,
        ["-e", "require('node:fs').writeFileSync(process.argv[1], Buffer.alloc(4096))", artifact],
        {
          cwd: f.root,
          signal: new AbortController().signal,
          maxBytes: 1024,
          timeoutMs: 2000,
          outputs: [{ path: artifact, maxBytes: 1024 }],
        },
      ),
      /limit/,
    );
  } finally {
    await f.cleanup();
  }
}, 20_000);

test("atomic publication preserves a destination created during backend work", async () => {
  const f = await fixture();
  try {
    const target = join(f.root, "output", "raced.wav");
    const api = await Effect.runPromise(
      createMediaHost({
        config: f.base,
        transport: {
          ...unavailableTransport,
          process: async (_exe, args) => {
            const stage = args.at(-1);
            assert.ok(stage);
            await writeFile(stage, wav());
            await writeFile(target, "independent writer");
            return new Uint8Array();
          },
        },
      }),
    );
    await rejectCode(
      Effect.runPromise(
        api.run({ operation: "convert", input: "source.wav", format: "wav", output: "raced.wav" }),
      ),
      "conflict",
    );
    assert.equal(await readFile(target, "utf8"), "independent writer");
    assert.deepEqual(await readdir(join(f.root, "output")), ["raced.wav"]);
  } finally {
    await f.cleanup();
  }
});

test("input root must be a directory and local model filenames remain valid identifiers", async () => {
  const f = await fixture();
  try {
    await rejectCode(
      Effect.runPromise(
        createMediaHost({
          config: { ...f.base, inputRoot: join(f.root, "source.wav") },
        }),
      ),
      "invalid",
    );
    await writeFile(join(f.root, ".model"), "fixture model");
    await writeFile(join(f.root, "_voice.onnx"), "fixture model");
    await writeFile(join(f.root, "_voice.onnx.json"), "{}");
    const api = await Effect.runPromise(
      createMediaHost({
        config: {
          ...f.base,
          whisperCpp: { executable: process.execPath, modelPath: join(f.root, ".model") },
          piper: { executable: process.execPath, modelPath: join(f.root, "_voice.onnx") },
        },
        transport: unavailableTransport,
      }),
    );
    const catalog = await Effect.runPromise(api.listBackends());
    assert.equal(catalog.find((backend) => backend.id === "ffmpeg")?.available, true);
    assert.equal(
      catalog.find((backend) => backend.id === "whisper-cpp")?.capabilities[0]?.model,
      "local-.model",
    );
    assert.equal(
      catalog.find((backend) => backend.id === "piper")?.capabilities[0]?.model,
      "local-_voice.onnx",
    );
  } finally {
    await f.cleanup();
  }
});

test("raw PCM artifacts carry exact local and provider sample formats", async () => {
  const f = await fixture();
  try {
    const api = await Effect.runPromise(
      createMediaHost({
        config: {
          ...f.base,
          openai: { apiKeyEnv: "KEY", allowLegacySpeech: true, speechModel: "gpt-4o-mini-tts" },
          elevenlabs: { apiKeyEnv: "KEY", voiceId: "fixturevoice" },
        },
        transport: {
          ...unavailableTransport,
          environment: () => "fixture-key",
          process: async (_exe, args) => {
            assert.ok(args.includes("pcm_s16le"));
            const output = args.at(-1);
            assert.ok(output);
            const custom = args[args.indexOf("-ar") + 1] === "48000";
            assert.equal(args[args.indexOf("-ar") + 1], custom ? "48000" : "16000");
            assert.equal(args[args.indexOf("-ac") + 1], custom ? "2" : "1");
            await writeFile(output, new Uint8Array(8));
            return new Uint8Array();
          },
          request: async (url) => {
            if (url.includes("elevenlabs")) assert.ok(url.endsWith("output_format=pcm_24000"));
            return {
              status: 200,
              contentType: "audio/pcm",
              requestId: null,
              bytes: new Uint8Array(8),
            };
          },
        },
      }),
    );
    for (const custom of [false, true]) {
      const result = await Effect.runPromise(
        api.run({
          operation: "convert",
          input: "source.wav",
          format: "pcm",
          ...(custom ? { sampleRate: 48000, channels: 2 } : {}),
        }),
      );
      if (result.operation !== "convert") throw new Error("unexpected result");
      assert.deepEqual(result.artifact.pcm, {
        encoding: "pcm_s16le",
        sampleRate: custom ? 48000 : 16000,
        channels: custom ? 2 : 1,
      });
    }
    for (const backend of ["openai", "elevenlabs"]) {
      const result = await Effect.runPromise(
        api.run({
          operation: "synthesize",
          backend,
          text: "Fixture",
          format: "pcm",
          allowTraining: backend === "elevenlabs",
        }),
      );
      if (result.operation !== "synthesize") throw new Error("unexpected result");
      assert.deepEqual(result.artifact.pcm, {
        encoding: "pcm_s16le",
        sampleRate: 24000,
        channels: 1,
      });
    }
  } finally {
    await f.cleanup();
  }
});

test("uncertain enrollment outcomes require an account check and never retry", async () => {
  const f = await fixture();
  try {
    for (const malformed of [false, true]) {
      let calls = 0;
      const api = await Effect.runPromise(
        createMediaHost({
          config: { ...f.base, elevenlabs: { apiKeyEnv: "KEY" } },
          transport: {
            ...unavailableTransport,
            environment: () => "fixture-key",
            request: async () => {
              calls += 1;
              if (!malformed) throw new Error("fixture-secret private response");
              return {
                status: 200,
                contentType: "application/json",
                requestId: null,
                bytes: json({ voice_id: "created-but-unconfirmed" }),
              };
            },
          },
        }),
      );
      await assert.rejects(
        Effect.runPromise(
          api.run({
            operation: "clone",
            backend: "elevenlabs",
            allowTraining: true,
            reference: "source.wav",
            name: "Fixture",
          }),
        ),
        (error: unknown) =>
          error instanceof Error &&
          JSON.stringify(error).includes("Check the provider account") &&
          !JSON.stringify(error).includes("fixture-secret"),
      );
      assert.equal(calls, 1);
    }
  } finally {
    await f.cleanup();
  }
});

test("Piper configuration must remain adjacent to its voice model", async () => {
  const f = await fixture();
  try {
    const modelPath = join(f.root, "voice.onnx");
    const customPath = join(f.root, "custom.json");
    await writeFile(customPath, "{}");
    await rejectCode(
      Effect.runPromise(
        createMediaHost({
          config: {
            ...f.base,
            piper: { executable: process.execPath, modelPath, configPath: customPath },
          },
          transport: unavailableTransport,
        }),
      ),
      "invalid",
    );
    const api = await Effect.runPromise(
      createMediaHost({
        config: {
          ...f.base,
          piper: { executable: process.execPath, modelPath, configPath: modelPath + ".json" },
        },
        transport: unavailableTransport,
      }),
    );
    const catalog = await Effect.runPromise(api.listBackends());
    assert.equal(catalog.find((backend) => backend.id === "piper")?.available, true);
  } finally {
    await f.cleanup();
  }
});

test("native media downloads reject non-CDN and malformed locations before network access", async () => {
  const options = { signal: new AbortController().signal, maxBytes: 4096, timeoutMs: 1000 };
  for (const url of [
    "not a URL",
    "http://files.heygen.ai/generated/audio.wav",
    "https://files.heygen.ai.evil.example/generated/audio.wav",
    "https://files.heygen.ai./generated/audio.wav",
    "https://user:secret@files.heygen.ai/generated/audio.wav",
    "https://files.heygen.ai:444/generated/audio.wav",
    "https://files.heygen.ai/generated/%2e%2e/private.wav",
    "https://files.heygen.ai/generated/audio.wav#fragment",
    "https://api.heygen.com/generated/audio.wav",
    "https://files.heygen.ai/private.wav",
  ])
    await assert.rejects(downloadMedia(url, options));
});

test("media host blocks training defaults, unverified and assertion-only policy even with backend/model selection", async () => {
  const f = await fixture();
  let posts = 0;
  try {
    const transport = {
      ...unavailableTransport,
      environment: () => "fixture-key",
      request: async () => {
        posts++;
        throw new Error("must not upload");
      },
    };
    for (const backend of ["heygen", "fish", "elevenlabs"]) {
      const provider = { apiKeyEnv: "KEY", voiceId: "voice123" };
      const api = await Effect.runPromise(
        createHost({ config: { ...f.base, training: {}, [backend]: provider }, transport }),
      );
      await rejectCode(
        Effect.runPromise(
          api.run({ operation: "synthesize", backend, text: "Private fixture", voice: "voice123" }),
        ),
        "policy",
      );
    }
    const documentary = openAiTrainingFixture();
    for (const training of [
      {},
      { openai: documentary },
      {
        openai: {
          ...documentary,
          evidence: documentary.evidence.map((item) => ({ ...item, kind: "user-assertion" })),
        },
      },
    ]) {
      const api = await Effect.runPromise(
        createHost({ config: { ...f.base, training, openai: { apiKeyEnv: "KEY" } }, transport }),
      );
      for (const allowTraining of [false, true])
        await rejectCode(
          Effect.runPromise(
            api.run({
              operation: "transcribe",
              backend: "openai",
              model: "gpt-transcribe",
              input: "source.wav",
              allowTraining,
            }),
          ),
          "policy",
        );
    }
    const unknown = await Effect.runPromise(
      createHost({ config: { ...f.base, training: {}, heygen: { apiKeyEnv: "KEY" } }, transport }),
    );
    await assert.rejects(
      Effect.runPromise(
        unknown.run({
          operation: "synthesize",
          backend: "heygen",
          model: "unknown-model",
          voice: "voice123",
          text: "Fixture",
          allowTraining: true,
        }),
      ),
    );
    assert.equal(posts, 0);
  } finally {
    await f.cleanup();
  }
});

test("media authenticated evidence is rechecked before upload and passive selection does not authenticate", async () => {
  const f = await fixture();
  let posts = 0;
  let verifications = 0;
  try {
    const api = await Effect.runPromise(
      createHost({
        config: { ...f.base, openai: { apiKeyEnv: "KEY" } },
        transport: {
          ...unavailableTransport,
          environment: () => "fixture-key",
          request: async () => {
            posts++;
            throw new Error("must not upload");
          },
        },
        trainingVerifier: async () => {
          verifications++;
          const now = Date.now();
          return {
            backendId: "openai",
            host: "api.openai.com",
            accountId: "fixture-account",
            credentialBinding: verifications === 1 ? "fixture-key-id" : "rotated-key",
            verifiedAt: now,
            expiresAt: now + 60000,
            verification: "authenticated-account",
          };
        },
      }),
    );
    await Effect.runPromise(api.listBackends());
    await Effect.runPromise(
      api.explain({ operation: "transcribe", backend: "openai", input: "source.wav" }),
    );
    await assert.rejects(
      Effect.runPromise(
        api.plan({ operation: "transcribe", backend: "openai", input: "source.wav" }),
      ),
    );
    assert.equal(verifications, 0);
    await rejectCode(
      Effect.runPromise(
        api.run({ operation: "transcribe", backend: "openai", input: "source.wav" }),
      ),
      "policy",
    );
    assert.equal(verifications, 2);
    assert.equal(posts, 0);
    let reads = 0;
    const diagnostic = await Effect.runPromise(
      createHost({
        config: { ...f.base, training: {}, heygen: { apiKeyEnv: "KEY" } },
        transport: {
          ...unavailableTransport,
          environment: () => "fixture-key",
          request: async (url, options) => {
            reads++;
            assert.equal(options.method, "GET");
            assert.equal(url, "https://api.heygen.com/v3/api_keys/self");
            return {
              status: 200,
              contentType: "application/json",
              requestId: null,
              bytes: json({
                data: {
                  key_id: "read-only-fixture",
                  status: "active",
                  scope_mode: "custom",
                  scopes: ["voices:read"],
                },
              }),
            };
          },
        },
      }),
    );
    await Effect.runPromise(diagnostic.listBackends());
    await Effect.runPromise(
      diagnostic.explain({
        operation: "synthesize",
        backend: "heygen",
        voice: "voice123",
        text: "Fixture",
      }),
    );
    assert.equal(reads, 0);
    const result = await Effect.runPromise(diagnostic.diagnose({ backend: "heygen" }));
    assert.equal(reads, 1);
    assert.equal(result.authenticated, true);
    assert.ok(result.models.every((model) => model.access === "unknown"));
    assert.equal(posts, 0);
  } finally {
    await f.cleanup();
  }
});

function heyGenTrainingFixture(): TrainingAccountConfig {
  const account = { accountId: "fixture-account", revision: "fixture-account-v1", evidence: [] };
  const policy = resolveMediaTrainingPolicy({
    backendId: "heygen",
    operation: "synthesize",
    model: "heygen-voice-1",
    account,
  });
  return {
    ...account,
    evidence: [
      {
        id: "fixture-heygen-exclusion",
        scope: policy.scope,
        policyRevision: policy.revision,
        credentialBinding: "fixture-key-id",
        accountRevision: account.revision,
        condition: "confirmed-opt-out",
        effect: "excluded",
        kind: "document-review",
        reviewedAt: mediaTrainingReview.reviewedAt,
        expiresAt: mediaTrainingReview.expiresAt,
        invalidated: false,
        sourceUrl: "https://example.invalid/fixture-opt-out",
        artifactSha256: "a".repeat(64),
        reviewer: "fixture-reviewer",
        reference: "Synthetic reviewed exclusion; not a statement about any real provider account.",
      },
    ],
  };
}

test("media blocks credential rotation after policy verification and before upload", async () => {
  const f = await fixture();
  let credential = "original-fixture-key";
  let posts = 0;
  let reads = 0;
  try {
    const api = await Effect.runPromise(
      createHost({
        config: {
          ...f.base,
          training: { heygen: heyGenTrainingFixture() },
          heygen: { apiKeyEnv: "KEY" },
          recovery: { directory: join(f.root, "receipts"), keyEnv: "RECOVERY_KEY" },
        },
        trainingVerifier: async () => {
          const now = Date.now();
          return {
            backendId: "heygen",
            host: "api.heygen.com",
            accountId: "fixture-account",
            credentialBinding: "fixture-key-id",
            verifiedAt: now,
            expiresAt: now + 60000,
            verification: "authenticated-account",
          };
        },
        transport: {
          ...unavailableTransport,
          environment: (name) =>
            name === "KEY"
              ? credential
              : name === "RECOVERY_KEY"
                ? Buffer.alloc(32, 7).toString("base64")
                : undefined,
          request: async (url, options) => {
            if (options.method !== "GET") {
              posts++;
              throw new Error("must not upload");
            }
            reads++;
            assert.equal(options.headers["x-api-key"], "original-fixture-key");
            if (url.endsWith("/api_keys/self")) {
              credential = "rotated-fixture-key";
              return {
                status: 200,
                contentType: "application/json",
                requestId: null,
                bytes: json({
                  data: {
                    key_id: "fixture-key-id",
                    status: "active",
                    scope_mode: "custom",
                    scopes: ["voices:write"],
                  },
                }),
              };
            }
            return {
              status: 200,
              contentType: "application/json",
              requestId: null,
              bytes: json({ data: { voice_id: "voice123", status: "ACTIVE", mode: "instant" } }),
            };
          },
        },
      }),
    );
    await rejectCode(
      Effect.runPromise(
        api.run({
          operation: "synthesize",
          backend: "heygen",
          voice: "voice123",
          text: "Private fixture",
        }),
      ),
      "policy",
    );
    assert.ok(reads >= 1);
    assert.equal(posts, 0);
  } finally {
    await f.cleanup();
  }
});

test("media rechecks policy expiration immediately before upload after a slow read-only preflight", async () => {
  const f = await fixture();
  let expiration = 0;
  let posts = 0;
  let reads = 0;
  let verifications = 0;
  try {
    const api = await Effect.runPromise(
      createHost({
        config: {
          ...f.base,
          training: { heygen: heyGenTrainingFixture() },
          heygen: { apiKeyEnv: "KEY" },
          recovery: { directory: join(f.root, "receipts"), keyEnv: "RECOVERY_KEY" },
        },
        trainingVerifier: async () => {
          verifications++;
          const now = Date.now();
          expiration = now + 200;
          return {
            backendId: "heygen",
            host: "api.heygen.com",
            accountId: "fixture-account",
            credentialBinding: "fixture-key-id",
            verifiedAt: now,
            expiresAt: expiration,
            verification: "authenticated-account",
          };
        },
        transport: {
          ...unavailableTransport,
          environment: (name) =>
            name === "KEY"
              ? "fixture-key"
              : name === "RECOVERY_KEY"
                ? Buffer.alloc(32, 7).toString("base64")
                : undefined,
          request: async (url, options) => {
            if (options.method !== "GET") {
              posts++;
              throw new Error("must not upload");
            }
            reads++;
            if (url.endsWith("/api_keys/self")) {
              await new Promise<void>((resolve) =>
                setTimeout(resolve, Math.max(1, expiration - Date.now() + 10)),
              );
              return {
                status: 200,
                contentType: "application/json",
                requestId: null,
                bytes: json({
                  data: {
                    key_id: "fixture-key-id",
                    status: "active",
                    scope_mode: "custom",
                    scopes: ["voices:write"],
                  },
                }),
              };
            }
            return {
              status: 200,
              contentType: "application/json",
              requestId: null,
              bytes: json({ data: { voice_id: "voice123", status: "ACTIVE", mode: "instant" } }),
            };
          },
        },
      }),
    );
    await rejectCode(
      Effect.runPromise(
        api.run({
          operation: "synthesize",
          backend: "heygen",
          voice: "voice123",
          text: "Private fixture",
        }),
      ),
      "policy",
    );
    assert.ok(reads >= 1);
    assert.equal(verifications, 2);
    assert.equal(posts, 0);
  } finally {
    await f.cleanup();
  }
});
