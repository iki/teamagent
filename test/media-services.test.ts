import { test } from "bun:test";
import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { mkdtemp, mkdir, readFile, readdir, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { Effect, Fiber, Schema } from "effect";
import {
  createMediaHost as createHost,
  type MediaHostOptions,
  type MediaTransport,
} from "../app/media/index.ts";
import { encodeFishReferenceRequest } from "../app/media/fish.ts";
import { heyGenAudioUrl } from "../app/media/heygen.ts";

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
function jsonResponse(value: unknown) {
  return {
    status: 200,
    contentType: "application/json",
    requestId: "fixture-request",
    bytes: json(value),
  };
}
const unavailable: Partial<MediaTransport> = {
  environment: (name) =>
    name === "RECOVERY_KEY"
      ? Buffer.alloc(32, 7).toString("base64")
      : name === "SERVICE_KEY"
        ? "fixture-secret"
        : undefined,
  process: async () => {
    throw new Error("unexpected local work");
  },
  request: async () => {
    throw new Error("unexpected request");
  },
  download: async () => {
    throw new Error("unexpected download");
  },
};
/** Existing mutation fixtures explicitly supply successful read-only key/voice preflight. */
function createMediaHost(options: MediaHostOptions) {
  return createHost({
    ...options,
    transport: {
      ...options.transport,
      request: async (url, request) => {
        if (request.method === "GET" && url === "https://api.heygen.com/v3/api_keys/self")
          return jsonResponse({
            data: {
              key_id: "fixture-key",
              status: "active",
              scope_mode: "custom",
              scopes: ["voices:write"],
            },
          });
        if (
          request.method === "GET" &&
          url.startsWith("https://api.heygen.com/v3/models/audio/voices/")
        )
          return jsonResponse({
            data: {
              voice_id: url.split("/").at(-1),
              status: "ACTIVE",
              mode: "instant",
              language: "en",
            },
          });
        if (options.transport?.request === undefined) throw new Error("unexpected fixture request");
        return options.transport.request(url, request);
      },
    },
  });
}
async function fixture() {
  const root = await mkdtemp(join(tmpdir(), "teamagent-media-services-"));
  await mkdir(join(root, "output"));
  await writeFile(join(root, "source.wav"), wav());
  return {
    root,
    base: {
      inputRoot: root,
      outputRoot: join(root, "output"),
      ffmpeg: { executable: process.execPath, probeExecutable: process.execPath },
      recovery: { directory: join(root, "receipts"), keyEnv: "RECOVERY_KEY" },
      heygen: { apiKeyEnv: "SERVICE_KEY" },
      fish: { apiKeyEnv: "SERVICE_KEY" },
    },
    cleanup: () => rm(root, { recursive: true, force: true, maxRetries: 8, retryDelay: 100 }),
  };
}
async function rejectCode(work: Promise<unknown>, code: string): Promise<void> {
  await assert.rejects(
    work,
    (error: unknown) => error instanceof Error && JSON.stringify(error).includes(code),
  );
}

test("Fish fixed MessagePack encoding matches independent specification vectors", () => {
  const encoded = encodeFishReferenceRequest("A", "wav", 24000, new Uint8Array([0, 1]), "B");
  assert.equal(
    Buffer.from(encoded).toString("hex"),
    "84a474657874a141a6666f726d6174a3776176ab73616d706c655f72617465cd5dc0aa7265666572656e6365739182a5617564696fc4020001a474657874a142",
  );
  for (const [text, prefix] of [
    ["x".repeat(31), "bf"],
    ["x".repeat(32), "d920"],
    ["é".repeat(128), "da0100"],
  ]) {
    assert.ok(text !== undefined && prefix !== undefined);
    const bytes = Buffer.from(
      encodeFishReferenceRequest(text, "mp3", 44100, new Uint8Array([1]), "B"),
    );
    assert.ok(bytes.subarray(6).toString("hex").startsWith(prefix));
  }
  for (const [size, prefix] of [
    [255, "c4ff"],
    [256, "c50100"],
    [65536, "c600010000"],
  ]) {
    assert.equal(typeof size, "number");
    assert.equal(typeof prefix, "string");
    if (typeof size !== "number" || typeof prefix !== "string") throw new Error("invalid vector");
    const bytes = Buffer.from(
      encodeFishReferenceRequest("A", "wav", 24000, new Uint8Array(size), "B"),
    );
    const marker = Buffer.from("a5617564696f", "hex");
    const start = bytes.indexOf(marker);
    assert.ok(start >= 0);
    assert.ok(
      bytes
        .subarray(start + marker.length)
        .toString("hex")
        .startsWith(prefix),
    );
  }
  assert.throws(
    () => encodeFishReferenceRequest("A", "wav", 44100, new Uint8Array([1]), " "),
    /bounded/,
  );
  assert.throws(
    () => encodeFishReferenceRequest("A", "wav", 96000, new Uint8Array([1]), "B"),
    /bounded/,
  );
});

test("service discovery rejects unknown Fish models and plans explicit voice/reference requirements", async () => {
  const f = await fixture();
  try {
    await rejectCode(
      Effect.runPromise(
        createMediaHost({
          config: {
            ...f.base,
            fish: { apiKeyEnv: "SERVICE_KEY", speechModel: "silent-fallback-typo" },
          },
          transport: unavailable,
        }),
      ),
      "invalid",
    );
    const api = await Effect.runPromise(
      createMediaHost({ config: f.base, transport: unavailable }),
    );
    for (const backend of ["heygen", "fish"]) {
      await rejectCode(
        Effect.runPromise(
          api.plan({ operation: "synthesize", allowTraining: true, backend, text: "Fixture" }),
        ),
        "unsupported",
      );
    }
    await rejectCode(
      Effect.runPromise(
        api.plan({
          operation: "synthesize",
          allowTraining: true,
          backend: "fish",
          text: "Fixture",
          reference: "source.wav",
        }),
      ),
      "unsupported",
    );
    const fish = await Effect.runPromise(
      api.plan({
        operation: "synthesize",
        allowTraining: true,
        backend: "fish",
        text: "Fixture",
        voice: "fishvoice",
      }),
    );
    assert.equal(fish.model, "s2.1-pro");
    const heygen = await Effect.runPromise(
      api.plan({
        operation: "synthesize",
        allowTraining: true,
        backend: "heygen",
        text: "Fixture",
        voice: "heygenvoice",
      }),
    );
    assert.equal(heygen.model, "heygen-voice-1");
  } finally {
    await f.cleanup();
  }
});

test("HeyGen speech downloads only a bounded credential-free generated WAV", async () => {
  const f = await fixture();
  let requests = 0;
  let downloads = 0;
  try {
    const api = await Effect.runPromise(
      createMediaHost({
        config: { ...f.base, heygen: { apiKeyEnv: "SERVICE_KEY", voiceId: "configuredvoice" } },
        transport: {
          ...unavailable,
          request: async (url, options) => {
            requests += 1;
            assert.equal(url, "https://api.heygen.com/v3/models/audio/tts");
            assert.equal(options.headers["x-api-key"], "fixture-secret");
            const body: unknown = JSON.parse(new TextDecoder().decode(options.body));
            assert.deepEqual(body, {
              model: "heygen-voice-1",
              voice_id: "overridevoice",
              text: "Hello fixture",
              expressiveness_boost: 0.5,
            });
            return jsonResponse({
              data: {
                audio_url: "https://files.heygen.ai/generated/fixture.wav?signature=fixture",
                duration: 0.1,
              },
            });
          },
          download: async (url, options) => {
            downloads += 1;
            assert.equal(url, "https://files.heygen.ai/generated/fixture.wav?signature=fixture");
            assert.ok(!("headers" in options));
            assert.ok(options.maxBytes > 0);
            return { status: 200, contentType: "audio/wav", requestId: null, bytes: wav() };
          },
        },
      }),
    );
    const result = await Effect.runPromise(
      api.run({
        operation: "synthesize",
        allowTraining: true,
        backend: "heygen",
        text: "Hello fixture",
        voice: "overridevoice",
        output: "speech.wav",
      }),
    );
    if (result.operation !== "synthesize") throw new Error("unexpected result");
    assert.equal(result.artifact.sha256, hash(wav()));
    assert.equal(result.provenance.providerRequestId, "fixture-request");
    assert.ok(!JSON.stringify(result).includes("fixture-secret"));
    assert.ok(!JSON.stringify(result).includes("signature=fixture"));
    await rejectCode(
      Effect.runPromise(
        api.run({
          operation: "synthesize",
          allowTraining: true,
          backend: "heygen",
          text: "Hello fixture",
          output: "speech.wav",
        }),
      ),
      "conflict",
    );
    assert.equal(requests, 1);
    assert.equal(downloads, 1);
  } finally {
    await f.cleanup();
  }
});

test("HeyGen rejects untrusted download locations, redirects and unsupported inline synthesis", async () => {
  const f = await fixture();
  try {
    for (const url of [
      "http://files.heygen.ai/generated/test.wav",
      "https://files.heygen.ai.attacker.invalid/generated/test.wav",
      "https://user:secret@files.heygen.ai/generated/test.wav",
      "https://files.heygen.ai/assets/test.wav",
      "https://files.heygen.ai/generated/test.wav#fragment",
      "https://127.0.0.1/generated/test.wav",
    ])
      assert.throws(() => heyGenAudioUrl(url), /not allowed/);
    let downloads = 0;
    let requests = 0;
    const api = await Effect.runPromise(
      createMediaHost({
        config: f.base,
        transport: {
          ...unavailable,
          request: async () => {
            requests += 1;
            return jsonResponse({
              data: { audio_url: "https://attacker.invalid/output.wav", duration: 1 },
            });
          },
          download: async () => {
            downloads += 1;
            throw new Error("must not download");
          },
        },
      }),
    );
    await rejectCode(
      Effect.runPromise(
        api.run({
          operation: "synthesize",
          allowTraining: true,
          backend: "heygen",
          text: "Fixture",
          voice: "voice123",
        }),
      ),
      "recovery",
    );
    await rejectCode(
      Effect.runPromise(
        api.run({
          operation: "synthesize",
          allowTraining: true,
          backend: "heygen",
          text: "Fixture",
          reference: "source.wav",
        }),
      ),
      "unsupported",
    );
    assert.equal(requests, 1);
    assert.equal(downloads, 0);
    const redirect = await Effect.runPromise(
      createMediaHost({
        config: f.base,
        transport: {
          ...unavailable,
          request: async () =>
            jsonResponse({
              data: { audio_url: "https://files.heygen.ai/generated/fixture.wav", duration: 1 },
            }),
          download: async () => ({
            status: 302,
            contentType: "text/plain",
            requestId: null,
            bytes: json("fixture-secret"),
          }),
        },
      }),
    );
    await rejectCode(
      Effect.runPromise(
        redirect.run({
          operation: "synthesize",
          allowTraining: true,
          backend: "heygen",
          text: "Redirect fixture",
          voice: "voice123",
        }),
      ),
      "recovery",
    );
    assert.deepEqual(await readdir(join(f.root, "output")), []);
  } finally {
    await f.cleanup();
  }
});

test("HeyGen instant enrollment returns accepted pending state with retained-source provenance", async () => {
  const f = await fixture();
  let calls = 0;
  try {
    const api = await Effect.runPromise(
      createMediaHost({
        config: f.base,
        transport: {
          ...unavailable,
          request: async (url, options) => {
            calls += 1;
            assert.equal(url, "https://api.heygen.com/v3/models/audio/voices");
            assert.match(options.headers["idempotency-key"] ?? "", /^[a-f0-9-]{36}$/);
            const Request = Schema.Struct({
              mode: Schema.Literal("instant"),
              name: Schema.String,
              audio: Schema.Array(
                Schema.Struct({
                  type: Schema.Literal("base64"),
                  media_type: Schema.Literal("audio/x-wav"),
                  data: Schema.String,
                }),
              ),
            });
            const unknownBody: unknown = JSON.parse(new TextDecoder().decode(options.body));
            const body = Schema.decodeUnknownSync(Request)(unknownBody);
            assert.equal(body.name, "Fixture voice");
            assert.equal(body.audio[0]?.data, Buffer.from(wav()).toString("base64"));
            return { ...jsonResponse({ data: { voice_id: "newvoice123" } }), status: 202 };
          },
        },
      }),
    );
    const result = await Effect.runPromise(
      api.run({
        operation: "clone",
        allowTraining: true,
        backend: "heygen",
        reference: "source.wav",
        name: "Fixture voice",
        voiceAuthorization: "Fixture authorization",
      }),
    );
    if (result.operation !== "clone") throw new Error("unexpected result");
    assert.equal(result.readiness, "pending");
    assert.equal(result.requiresVerification, null);
    assert.equal(result.provenance.referenceSha256, hash(wav()));
    assert.equal(result.provenance.voiceAuthorization, "Fixture authorization");
    assert.ok(result.provenance.limitations.some((note) => note.includes("retains inline")));
    assert.equal(calls, 1);
  } finally {
    await f.cleanup();
  }
});

test("Fish voice-ID synthesis sends the exact model header and a self-describing WAV", async () => {
  const f = await fixture();
  try {
    const api = await Effect.runPromise(
      createMediaHost({
        config: {
          ...f.base,
          fish: { apiKeyEnv: "SERVICE_KEY", voiceId: "fishvoice", speechModel: "s2.1-pro-free" },
        },
        transport: {
          ...unavailable,
          request: async (url, options) => {
            assert.equal(url, "https://api.fish.audio/v1/tts");
            assert.equal(options.headers.model, "s2.1-pro-free");
            assert.equal(options.headers.authorization, "Bearer fixture-secret");
            const body: unknown = JSON.parse(new TextDecoder().decode(options.body));
            assert.deepEqual(body, {
              text: "Fixture",
              reference_id: "fishvoice",
              format: "wav",
              sample_rate: 44100,
            });
            return {
              status: 200,
              contentType: "audio/wav",
              requestId: "fish-request",
              bytes: wav(),
            };
          },
        },
      }),
    );
    const result = await Effect.runPromise(
      api.run({
        operation: "synthesize",
        allowTraining: true,
        backend: "fish",
        text: "Fixture",
        format: "wav",
      }),
    );
    if (result.operation !== "synthesize") throw new Error("unexpected result");
    assert.equal(result.artifact.mimeType, "audio/wav");
    assert.equal(result.model, "s2.1-pro-free");
    assert.equal(result.provenance.providerRequestId, "fish-request");
  } finally {
    await f.cleanup();
  }
});

test("Fish inline synthesis sends raw MessagePack audio and preserves original evidence", async () => {
  const f = await fixture();
  let calls = 0;
  try {
    const api = await Effect.runPromise(
      createMediaHost({
        config: f.base,
        transport: {
          ...unavailable,
          request: async (url, options) => {
            calls += 1;
            assert.equal(url, "https://api.fish.audio/v1/tts");
            assert.equal(options.headers["content-type"], "application/msgpack");
            assert.equal(options.headers.model, "s2.1-pro");
            assert.equal(options.body[0], 0x84);
            const bytes = Buffer.from(options.body);
            assert.ok(bytes.includes(Buffer.from(wav())));
            assert.ok(bytes.includes(Buffer.from("Reference transcript")));
            assert.ok(!bytes.includes(Buffer.from("fixture-secret")));
            return { status: 200, contentType: "audio/wav", requestId: null, bytes: wav() };
          },
        },
      }),
    );
    const result = await Effect.runPromise(
      api.run({
        operation: "synthesize",
        allowTraining: true,
        backend: "fish",
        text: "New words",
        format: "wav",
        reference: "source.wav",
        referenceText: "Reference transcript",
        voiceAuthorization: "Fixture authorization",
      }),
    );
    if (result.operation !== "synthesize") throw new Error("unexpected result");
    assert.equal(result.provenance.referenceSha256, hash(wav()));
    assert.equal(result.provenance.voiceAuthorization, "Fixture authorization");
    assert.equal(calls, 1);
  } finally {
    await f.cleanup();
  }
});

test("Fish persistent enrollment is private and distinguishes ready from pending", async () => {
  const f = await fixture();
  try {
    for (const state of ["trained", "created", "training"]) {
      let calls = 0;
      const api = await Effect.runPromise(
        createMediaHost({
          config: f.base,
          transport: {
            ...unavailable,
            request: async (url, options) => {
              calls += 1;
              assert.equal(url, "https://api.fish.audio/model");
              const form = Buffer.from(options.body).toString("utf8");
              assert.ok(form.includes('name="visibility"\r\n\r\nprivate'));
              assert.ok(form.includes('name="train_mode"\r\n\r\nfast'));
              assert.ok(form.includes('name="voices"; filename="input.wav"'));
              return {
                ...jsonResponse({ _id: "privatevoice", state, visibility: "private" }),
                status: 201,
              };
            },
          },
        }),
      );
      const result = await Effect.runPromise(
        api.run({
          operation: "clone",
          allowTraining: true,
          backend: "fish",
          reference: "source.wav",
          name: "Fixture voice",
        }),
      );
      if (result.operation !== "clone") throw new Error("unexpected result");
      assert.equal(result.readiness, state === "trained" ? "ready" : "pending");
      assert.equal(result.requiresVerification, false);
      assert.equal(result.provenance.referenceSha256, hash(wav()));
      assert.equal(calls, 1);
    }
  } finally {
    await f.cleanup();
  }
});

test("service enrollment distinguishes confirmed rejection from uncertain outcomes without retry", async () => {
  const f = await fixture();
  try {
    for (const backend of ["heygen", "fish"]) {
      for (const failure of ["network", "permission", "malformed", "public"]) {
        let calls = 0;
        const api = await Effect.runPromise(
          createMediaHost({
            config: f.base,
            transport: {
              ...unavailable,
              request: async () => {
                calls += 1;
                if (failure === "network") throw new Error("fixture-secret raw provider failure");
                if (failure === "permission")
                  return { ...jsonResponse({ error: "fixture-secret" }), status: 403 };
                return jsonResponse(
                  failure === "public"
                    ? { _id: "voice", state: "trained", visibility: "public" }
                    : { private_payload: "fixture-secret" },
                );
              },
            },
          }),
        );
        const error = await Effect.runPromise(
          Effect.flip(
            api.run({
              operation: "clone",
              allowTraining: true,
              backend,
              reference: "source.wav",
              name: "Fixture " + backend + " " + failure,
            }),
          ),
        );
        assert.ok(!JSON.stringify(error).includes("fixture-secret"));
        if (failure === "permission") {
          assert.equal(error.code, "rejected");
          assert.equal(error.diagnostic?.status, 403);
          assert.equal(error.diagnostic?.category, "permission");
          assert.equal(error.diagnostic?.requestId, "fixture-request");
          if (backend === "heygen") assert.equal(error.outcome, "rejected");
        } else if (backend === "heygen") {
          assert.equal(error.outcome, failure === "network" ? "uncertain" : "accepted");
          assert.equal(error.code, failure === "network" ? "uncertain" : "network");
        } else {
          assert.equal(error.code, "uncertain");
          assert.ok(error.message.includes("Check the provider account"));
        }
        if (backend === "heygen") assert.ok(error.receiptId);
        assert.equal(calls, 1);
      }
    }
  } finally {
    await f.cleanup();
  }
});

test("HeyGen download cancellation joins cleanup without publishing partial audio", async () => {
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
          ...unavailable,
          request: async () =>
            jsonResponse({
              data: { audio_url: "https://files.heygen.ai/generated/fixture.wav", duration: 1 },
            }),
          download: async (_url, options) => {
            entered();
            await new Promise<void>((resolve) =>
              options.signal.addEventListener("abort", () => setTimeout(resolve, 20), {
                once: true,
              }),
            );
            joined = true;
            throw new Error("cancelled");
          },
        },
      }),
    );
    const fiber = Effect.runFork(
      api.run({
        operation: "synthesize",
        allowTraining: true,
        backend: "heygen",
        text: "Fixture",
        voice: "voice123",
      }),
    );
    await ready;
    await Effect.runPromise(Fiber.interrupt(fiber));
    assert.equal(joined, true);
    assert.deepEqual(await readdir(join(f.root, "output")), []);
    assert.deepEqual(await readFile(join(f.root, "source.wav")), Buffer.from(wav()));
  } finally {
    await f.cleanup();
  }
});
