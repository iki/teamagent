import { mkdtemp } from "./temporary.ts";
import { test } from "bun:test";
import assert from "node:assert/strict";
import { mkdir, readFile, readdir, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { Effect, Schema } from "effect";
import { createMediaHost } from "../app/media/index.ts";
import { parseMediaConfig } from "../app/media/config.ts";
import { discoverMedia } from "../app/media/catalog.ts";
import { createMediaStaging, digest, readInput } from "../app/media/files.ts";
import { executeHeyGen, heyGenAudioUrl, resumeHeyGen } from "../app/media/heygen.ts";
import { diagnoseHeyGen, executeHeyGenVoice } from "../app/media/heygen-lifecycle.ts";
import { createMediaReceiptStore, MediaReceiptFailure } from "../app/media/receipts.ts";
import { providerRequest } from "../app/media/providers.ts";
import { MediaHttpFailure, type MediaTransport } from "../app/media/transport.ts";
import type { MediaExecution } from "../app/media/local.ts";

function wave(): Uint8Array {
  const b = Buffer.alloc(3244);
  b.write("RIFF");
  b.writeUInt32LE(3236, 4);
  b.write("WAVEfmt ", 8);
  b.writeUInt32LE(16, 16);
  b.writeUInt16LE(1, 20);
  b.writeUInt16LE(1, 22);
  b.writeUInt32LE(16000, 24);
  b.writeUInt32LE(32000, 28);
  b.writeUInt16LE(2, 32);
  b.writeUInt16LE(16, 34);
  b.write("data", 36);
  b.writeUInt32LE(3200, 40);
  return b;
}
const json = (data: unknown, status = 200) => ({
  status,
  contentType: "application/json",
  requestId: "fixture-request",
  bytes: new TextEncoder().encode(JSON.stringify(data)),
});
const settings = { apiKeyEnv: "FIXTURE_KEY" };
async function fixture(overrides: Partial<MediaTransport> = {}) {
  const root = await mkdtemp(join(tmpdir(), "heygen-recovery-"));
  await mkdir(join(root, "output"));
  await writeFile(join(root, "reference.bin"), wave());
  const raw = {
    inputRoot: root,
    outputRoot: join(root, "output"),
    heygen: settings,
    recovery: { directory: join(root, "receipts"), keyEnv: "RECOVERY_KEY" },
  };
  const config = parseMediaConfig(raw, root);
  const calls: { url: string; method: string; body: Uint8Array }[] = [];
  const transport: MediaTransport = {
    environment: (name) =>
      name === "FIXTURE_KEY"
        ? "fixture-secret"
        : name === "RECOVERY_KEY"
          ? Buffer.alloc(32, 7).toString("base64")
          : undefined,
    process: async () => {
      throw new Error("unexpected process");
    },
    download: async () => ({
      status: 200,
      contentType: "audio/wav",
      requestId: null,
      bytes: wave(),
    }),
    ...overrides,
    request: async (url, options) => {
      calls.push({ url, method: options.method ?? "POST", body: options.body });
      if (overrides.request !== undefined) return overrides.request(url, options);
      if (url.endsWith("/api_keys/self"))
        return json({
          data: {
            key_id: "fixture-key",
            status: "active",
            scope_mode: "custom",
            scopes: ["voices:write"],
          },
        });
      if (options.method === "GET")
        return json({
          data: {
            voice_id: url.split("/").at(-1),
            status: "ACTIVE",
            mode: "instant",
            language: "cs",
          },
        });
      throw new Error("unexpected mutation");
    },
  };
  const store = await createMediaReceiptStore({
    directory: join(root, "receipts"),
    key: Buffer.alloc(32, 7),
  });
  const api = await Effect.runPromise(createMediaHost({ config: raw, transport }));
  async function context(request: unknown): Promise<MediaExecution & { receipts: typeof store }> {
    const plan = await Effect.runPromise(api.plan(request));
    const reference =
      "reference" in plan.request && plan.request.reference !== undefined
        ? await readInput(
            root,
            plan.request.reference,
            config.limits.inputBytes,
            new AbortController().signal,
          )
        : undefined;
    return {
      plan,
      config,
      transport,
      receipts: store,
      stage: await createMediaStaging(config.outputRoot),
      availability: await discoverMedia(config, transport),
      signal: new AbortController().signal,
      input: undefined,
      reference,
      provenance: {
        inputSha256: null,
        referenceSha256: reference?.sha256 ?? null,
        providerRequestId: null,
        toolVersion: null,
        elapsedMs: 0,
        limitations: [],
      },
    };
  }
  return {
    root,
    config,
    transport,
    store,
    api,
    calls,
    context,
    cleanup: () => rm(root, { recursive: true, force: true, maxRetries: 8, retryDelay: 100 }),
  };
}
const synthesis = {
  operation: "synthesize",
  backend: "heygen",
  voice: "voice123",
  text: "Hello",
  allowTraining: true,
};
const clone = {
  operation: "clone",
  backend: "heygen",
  reference: "reference.bin",
  name: "Fixture",
  allowTraining: true,
};
const key = () =>
  json({
    data: {
      key_id: "fixture-key",
      status: "active",
      scope_mode: "custom",
      scopes: ["voices:write"],
    },
  });
const active = (id = "voice123", mode = "instant") =>
  json({ data: { voice_id: id, status: "ACTIVE", mode, language: "cs" } });

test("HeyGen WAV regression changes only declared MIME and preserves exact bytes and digest", async () => {
  let mutations = 0;
  const f = await fixture({
    request: async (url, options) => {
      if (url.endsWith("/api_keys/self")) return key();
      mutations++;
      const Body = Schema.Struct({
        audio: Schema.Array(Schema.Struct({ media_type: Schema.String, data: Schema.String })),
        similarity: Schema.optional(Schema.String),
        language: Schema.optional(Schema.String),
      });
      const body = Schema.decodeUnknownSync(Body)(
        JSON.parse(new TextDecoder().decode(options.body)),
      );
      const audio = body.audio[0];
      assert.ok(audio);
      assert.deepEqual(Buffer.from(audio.data, "base64"), Buffer.from(wave()));
      if (audio.media_type === "audio/wav")
        return json(
          {
            error: {
              code: "invalid_parameter",
              message: "Content type not match audio/wav != audio/x-wav",
            },
          },
          400,
        );
      assert.equal(audio.media_type, "audio/x-wav");
      assert.equal(body.similarity, "max");
      assert.equal(body.language, "cs");
      return json({ data: { voice_id: "createdvoice" } }, 202);
    },
  });
  try {
    const ctx = await f.context({ ...clone, language: "cs", idempotencyKey: "same.fixture.key" });
    await assert.rejects(
      providerRequest(
        ctx,
        "https://api.heygen.com/v3/models/audio/voices",
        "FIXTURE_KEY",
        "x-api-key",
        "application/json",
        new TextEncoder().encode(
          JSON.stringify({
            audio: [{ media_type: "audio/wav", data: Buffer.from(wave()).toString("base64") }],
          }),
        ),
        4096,
      ),
      (error) =>
        error instanceof MediaHttpFailure &&
        error.diagnostic.status === 400 &&
        error.diagnostic.providerMessage === "Content type not match audio/wav != audio/x-wav",
    );
    const result = await executeHeyGen(ctx, settings);
    assert.equal(result.operation, "clone");
    if (result.operation !== "clone") throw new Error("unexpected result");
    assert.equal(result.declaredReferenceMimeType, "audio/x-wav");
    assert.equal(result.provenance.referenceSha256, digest(wave()));
    assert.equal(result.requiresVerification, null);
    assert.ok(result.receiptId);
    assert.equal(mutations, 2);
    await assert.rejects(
      executeHeyGen(ctx, settings),
      (error) => error instanceof MediaReceiptFailure && error.receiptId === result.receiptId,
    );
    assert.equal(mutations, 2);
    assert.deepEqual(await readFile(join(f.root, "reference.bin")), Buffer.from(wave()));
  } finally {
    await f.cleanup();
  }
});

test("HeyGen preflight rejects malformed content, unsupported voice controls and existing output before mutation", async () => {
  let posts = 0;
  let mode = "instant";
  let status = "ACTIVE";
  const f = await fixture({
    request: async (url, options) => {
      if (options.method !== "GET") {
        posts++;
        throw new Error("unexpected mutation");
      }
      if (url.endsWith("/api_keys/self")) return key();
      return json({ data: { voice_id: "voice123", status, mode } });
    },
  });
  try {
    await writeFile(join(f.root, "fake.wav"), "not a waveform");
    await assert.rejects(
      executeHeyGen(await f.context({ ...clone, reference: "fake.wav" }), settings),
      /not supported/,
    );
    await writeFile(join(f.root, "output", "occupied.wav"), wave());
    await assert.rejects(
      executeHeyGen(await f.context({ ...synthesis, output: "occupied.wav" }), settings),
      /already exists/,
    );
    await assert.rejects(
      executeHeyGen(await f.context({ ...synthesis, text: 'Hello <break time="1s"/>' }), settings),
      /Break markup/,
    );
    status = "PENDING";
    await assert.rejects(executeHeyGen(await f.context(synthesis), settings), /not ACTIVE/);
    status = "ACTIVE";
    mode = "professional";
    await assert.rejects(
      executeHeyGen(await f.context({ ...synthesis, model: "heygen-voice-1-turbo" }), settings),
      /professional voices/,
    );
    await assert.rejects(
      executeHeyGen(await f.context({ ...synthesis, expressivenessBoost: 0.5 }), settings),
      /verified instant/,
    );
    for (const field of ["speed", "pitch", "break"])
      await assert.rejects(Effect.runPromise(f.api.plan({ ...synthesis, [field]: 1 })));
    assert.equal(posts, 0);
  } finally {
    await f.cleanup();
  }
});

test("HeyGen records generated audio before failed download and resumes without regeneration", async () => {
  let posts = 0;
  let downloads = 0;
  const f = await fixture({
    request: async (url, options) => {
      if (url.endsWith("/api_keys/self")) return key();
      if (options.method === "GET") return active();
      posts++;
      const body: unknown = JSON.parse(new TextDecoder().decode(options.body));
      assert.deepEqual(body, {
        model: "heygen-voice-1",
        voice_id: "voice123",
        text: "Hello",
        language: "en",
        expressiveness_boost: 0.5,
        with_timestamps: true,
      });
      return json({
        data: {
          audio_url: "https://resource2.heygen.ai/text_to_speech/test.wav?signature=private",
          duration: 0.12,
          original_words: [{ text: "Hello", start_time: 0, end_time: 0.1 }],
        },
      });
    },
    download: async () => {
      downloads++;
      return downloads === 1
        ? json({ error: { code: "access_denied", message: "private raw echo" } }, 403)
        : { status: 200, contentType: "audio/wav", requestId: null, bytes: wave() };
    },
  });
  try {
    const ctx = await f.context({
      ...synthesis,
      language: "en",
      withTimestamps: true,
      output: "speech.wav",
    });
    await assert.rejects(
      executeHeyGen(ctx, settings),
      (error) =>
        error instanceof MediaReceiptFailure &&
        error.outcome === "generated-awaiting-download" &&
        error.diagnostic?.status === 403,
    );
    const records = await f.store.list();
    const receipt = records[0];
    assert.ok(receipt);
    assert.equal(receipt.state, "generated-awaiting-download");
    assert.ok(!JSON.stringify(records).includes("signature=private"));
    assert.ok(!JSON.stringify(records).includes("Hello"));
    const resumed = await resumeHeyGen(ctx, receipt.id);
    if (resumed.operation !== "synthesize") throw new Error("unexpected result");
    assert.equal(resumed.audio?.durationSeconds, 0.1);
    assert.equal(resumed.providerDurationSeconds, 0.12);
    assert.equal(resumed.alignment?.words[0]?.text, "Hello");
    assert.equal(resumed.artifact.sha256, digest(wave()));
    assert.equal(posts, 1);
    assert.equal(downloads, 2);
    const again = await resumeHeyGen(ctx, receipt.id);
    assert.equal(again.operation, "synthesize");
    assert.equal(posts, 1);
    assert.equal(downloads, 2);
    assert.equal((await f.store.load(receipt.id)).state, "published");
  } finally {
    await f.cleanup();
  }
});

test("HeyGen exact CDN pairs reject cross-pairs, encoded traversal, redirects and secret-bearing origins", () => {
  for (const url of [
    "https://files.heygen.ai/generated/test.wav",
    "https://resource2.heygen.ai/text_to_speech/test.wav",
  ])
    assert.equal(heyGenAudioUrl(url), url);
  for (const url of [
    "https://resource2.heygen.ai/generated/test.wav",
    "https://files.heygen.ai/text_to_speech/test.wav",
    "https://files.heygen.ai/generated/%2f..%2fsecret",
    "https://files.heygen.ai.evil.invalid/generated/a.wav",
    "https://user:secret@resource2.heygen.ai/text_to_speech/a.wav",
    "https://resource2.heygen.ai:444/text_to_speech/a.wav",
    "https://resource2.heygen.ai/text_to_speech/a.wav#fragment",
  ])
    assert.throws(() => heyGenAudioUrl(url));
});

test("HeyGen accepted enrollment retains asset identity and reconciliation only reads", async () => {
  let posts = 0;
  const f = await fixture({
    request: async (url, options) => {
      if (url.endsWith("/api_keys/self")) return key();
      if (options.method === "GET") return active("createdvoice");
      posts++;
      return json({ data: { voice_id: "createdvoice", asset_ids: ["asset1"] } }, 202);
    },
  });
  try {
    const ctx = await f.context(clone);
    const result = await executeHeyGen(ctx, settings);
    assert.ok(result.receiptId);
    const reconciled = await resumeHeyGen(ctx, result.receiptId);
    if (reconciled.operation !== "clone") throw new Error("unexpected result");
    assert.equal(reconciled.readiness, "ready");
    assert.deepEqual(reconciled.referenceAssetIds, ["asset1"]);
    assert.equal(posts, 1);
    const uncertain = await f.store.begin({
      backend: "heygen",
      operation: "clone",
      model: "instant",
      requestDigest: "a".repeat(64),
      referenceSha256: digest(wave()),
    });
    await f.store.fail(uncertain.receipt.id, new Error("network"));
    await assert.rejects(resumeHeyGen(ctx, uncertain.receipt.id), /history manually/);
    assert.equal(posts, 1);
  } finally {
    await f.cleanup();
  }
});

test("HeyGen alignment omission is explicit and unsupported URL remains encrypted and recoverable", async () => {
  let mode = "missing";
  let posts = 0;
  let downloads = 0;
  const f = await fixture({
    request: async (url, options) => {
      if (url.endsWith("/api_keys/self")) return key();
      if (options.method === "GET") return active();
      posts++;
      return json({
        data: {
          audio_url:
            mode === "missing"
              ? "https://files.heygen.ai/generated/a.wav"
              : "https://unreviewed.invalid/a.wav?secret=hidden",
          duration: 0.1,
          private_echo: "should-not-persist",
        },
      });
    },
    download: async () => {
      downloads++;
      return { status: 200, contentType: "audio/wav", requestId: null, bytes: wave() };
    },
  });
  try {
    const first = await executeHeyGen(
      await f.context({ ...synthesis, withTimestamps: true }),
      settings,
    );
    assert.ok(first.provenance.limitations.some((note) => note.includes("no timing was invented")));
    mode = "unsupported";
    const ctx = await f.context({ ...synthesis, text: "Different fixture" });
    await assert.rejects(
      executeHeyGen(ctx, settings),
      (error) =>
        error instanceof MediaReceiptFailure && error.outcome === "generated-awaiting-download",
    );
    const receipts = await f.store.list();
    const retained = receipts.find((r) => r.state === "generated-awaiting-download");
    assert.ok(retained);
    assert.ok(!JSON.stringify(receipts).includes("hidden"));
    assert.ok(!JSON.stringify(await f.store.load(retained.id)).includes("should-not-persist"));
    await assert.rejects(resumeHeyGen(ctx, retained.id));
    assert.equal(posts, 2);
    assert.equal(downloads, 1);
  } finally {
    await f.cleanup();
  }
});

test("HeyGen lifecycle lists pagination, waits boundedly, preserves status and deletes only explicitly", async () => {
  let reads = 0;
  let deletes = 0;
  const f = await fixture({
    request: async (url, options) => {
      if (options.method === "DELETE") {
        deletes++;
        return json({ data: { status: "ok" } });
      }
      if (url.includes("?")) {
        assert.ok(url.includes("token=cursor1"));
        return json({
          data: [
            {
              voice_id: "voice123",
              status: "PENDING",
              mode: "instant",
              requires_verification: true,
              reference_asset_ids: ["asset1"],
            },
          ],
          has_more: true,
          next_token: "next2",
        });
      }
      reads++;
      return reads === 1
        ? json({ data: { voice_id: "voice123", status: "PENDING", mode: "instant" } })
        : active();
    },
  });
  try {
    const ctx = { config: f.config, transport: f.transport, signal: new AbortController().signal };
    const listed = await executeHeyGenVoice(ctx, settings, {
      backend: "heygen",
      action: "list",
      cursor: "cursor1",
      limit: 1,
    });
    assert.equal(listed.nextCursor, "next2");
    assert.equal(listed.voices[0]?.requiresVerification, true);
    assert.deepEqual(listed.voices[0]?.referenceAssetIds, ["asset1"]);
    const waited = await executeHeyGenVoice(ctx, settings, {
      backend: "heygen",
      action: "wait",
      voiceId: "voice123",
      timeoutMs: 300,
      pollIntervalMs: 100,
    });
    assert.equal(waited.voices[0]?.readiness, "ready");
    assert.equal(reads, 2);
    assert.equal(deletes, 0);
    const deleted = await executeHeyGenVoice(ctx, settings, {
      backend: "heygen",
      action: "delete",
      voiceId: "voice123",
    });
    assert.equal(deleted.deleted, true);
    assert.equal(deletes, 1);
  } finally {
    await f.cleanup();
  }
});

test("HeyGen authenticated diagnosis uses key metadata and preserves unknown inference access", async () => {
  const f = await fixture({
    request: async (url, options) => {
      assert.equal(options.method, "GET");
      assert.equal(url, "https://api.heygen.com/v3/api_keys/self");
      return key();
    },
  });
  try {
    const result = await diagnoseHeyGen(
      { config: f.config, transport: f.transport, signal: new AbortController().signal },
      settings,
      { backend: "heygen" },
    );
    assert.equal(result.authenticated, true);
    assert.equal(result.accountId, null);
    assert.equal(result.credentialBinding, "fixture-key");
    assert.deepEqual(result.scopes, ["voices:write"]);
    assert.ok(result.models.every((m) => m.access === "unknown"));
    assert.equal(f.calls.length, 1);
    assert.ok(!JSON.stringify(result).includes("fixture-secret"));
    assert.equal((await readdir(join(f.root, "output"))).length, 0);
  } finally {
    await f.cleanup();
  }
});

test("HeyGen bounded waits report pending and cancellation does not repeat enrollment", async () => {
  let requests = 0;
  const f = await fixture({
    request: async (_url, options) => {
      requests++;
      assert.equal(options.method, "GET");
      assert.ok(options.timeoutMs <= 100);
      return json({ data: { voice_id: "voice123", status: "PENDING", mode: "instant" } });
    },
  });
  try {
    const ctx = { config: f.config, transport: f.transport, signal: new AbortController().signal };
    const waited = await executeHeyGenVoice(ctx, settings, {
      backend: "heygen",
      action: "wait",
      voiceId: "voice123",
      timeoutMs: 100,
      pollIntervalMs: 100,
    });
    assert.equal(waited.voices[0]?.readiness, "pending");
    assert.ok(waited.voices[0]?.limitations.some((note) => note.includes("bounded wait ended")));
    assert.equal(requests, 1);
    const controller = new AbortController();
    const waiting = executeHeyGenVoice({ ...ctx, signal: controller.signal }, settings, {
      backend: "heygen",
      action: "wait",
      voiceId: "voice123",
      timeoutMs: 100,
      pollIntervalMs: 100,
    });
    controller.abort();
    await assert.rejects(waiting);
    assert.equal(requests, 2);
  } finally {
    await f.cleanup();
  }
});

test("HeyGen persists accepted malformed outcomes and refuses mutation when receipt begin fails", async () => {
  let posts = 0;
  const f = await fixture({
    request: async (url, options) => {
      if (url.endsWith("/api_keys/self")) return key();
      if (options.method === "GET") return active();
      posts++;
      return json({
        data: {
          audio_url: "https://files.heygen.ai/generated/kept.wav?signature=secret",
          duration: "invalid",
          voice_id: "retainedvoice",
          echo: "never-store-this",
        },
      });
    },
  });
  try {
    const ctx = await f.context(synthesis);
    await assert.rejects(
      executeHeyGen(ctx, settings),
      (error) =>
        error instanceof MediaReceiptFailure && error.outcome === "generated-awaiting-download",
    );
    const summary = (await f.store.list())[0];
    assert.ok(summary);
    const receipt = await f.store.load(summary.id);
    assert.equal(receipt.response?.voiceId, "retainedvoice");
    assert.equal(receipt.response?.duration, null);
    assert.ok(receipt.response?.audioUrl?.includes("signature=secret"));
    assert.ok(!JSON.stringify(receipt).includes("never-store-this"));
    const recovered = await resumeHeyGen(ctx, receipt.id);
    if (recovered.operation !== "synthesize") throw new Error("unexpected result");
    assert.equal(recovered.audio?.durationSeconds, 0.1);
    assert.equal(recovered.providerDurationSeconds, undefined);
    assert.ok(
      recovered.provenance.limitations.some((note) => note.includes("only measured WAV duration")),
    );
    assert.equal(posts, 1);
    const blocked = {
      ...ctx,
      receipts: {
        ...f.store,
        begin: async () => {
          throw new Error("fixture storage failure");
        },
      },
    };
    await assert.rejects(executeHeyGen(blocked, settings));
    assert.equal(posts, 1);
  } finally {
    await f.cleanup();
  }
});

test("HeyGen retains immediate ACTIVE state and verification separately from readiness", async () => {
  const f = await fixture({
    request: async (url) =>
      url.endsWith("/api_keys/self")
        ? key()
        : json(
            {
              data: {
                voice_id: "activevoice",
                status: "ACTIVE",
                requires_verification: true,
                asset_ids: ["retainedasset"],
              },
            },
            202,
          ),
  });
  try {
    const result = await executeHeyGen(await f.context(clone), settings);
    if (result.operation !== "clone") throw new Error("unexpected result");
    assert.equal(result.readiness, "ready");
    assert.equal(result.requiresVerification, true);
    assert.equal(result.providerStatus, "ACTIVE");
    assert.deepEqual(result.referenceAssetIds, ["retainedasset"]);
    assert.ok(result.receiptId);
    assert.equal((await f.store.load(result.receiptId)).response?.requiresVerification, true);
  } finally {
    await f.cleanup();
  }
});

test("HeyGen host refuses ambiguous same-request replay even with a different output filename", async () => {
  let posts = 0;
  const f = await fixture({
    request: async (url, options) => {
      if (url.endsWith("/api_keys/self")) return key();
      if (options.method === "GET") return active();
      posts++;
      throw new Error("simulated ambiguous connection loss");
    },
  });
  try {
    await assert.rejects(Effect.runPromise(f.api.run({ ...synthesis, output: "first.wav" })));
    const first = (await f.store.list())[0];
    assert.ok(first);
    assert.equal(first.state, "uncertain");
    await assert.rejects(
      Effect.runPromise(f.api.run({ ...synthesis, output: "second.wav" })),
      (error) => error instanceof Error && JSON.stringify(error).includes(first.id),
    );
    assert.equal(posts, 1);
    assert.equal((await f.store.list()).length, 1);
    assert.deepEqual(await readdir(join(f.root, "output")), []);
  } finally {
    await f.cleanup();
  }
});

test("HeyGen polling uses absolute targets despite deterministic early timer wakeups", async () => {
  for (const timeoutMs of [100, 300]) {
    let now = 0.25;
    const startedAt = now;
    const requests: number[] = [];
    let sleeps = 0;
    const f = await fixture({
      request: async (_url, options) => {
        assert.equal(options.method, "GET");
        requests.push(now);
        now += 0.25;
        return json({ data: { voice_id: "voice123", status: "PENDING", mode: "instant" } });
      },
    });
    try {
      const clock = {
        now: () => now,
        sleep: async (milliseconds: number, signal: AbortSignal) => {
          signal.throwIfAborted();
          sleeps++;
          assert.ok(Number.isInteger(milliseconds));
          assert.ok(milliseconds >= 1);
          now += Math.max(0.25, milliseconds - 0.75);
        },
      };
      const result = await executeHeyGenVoice(
        { config: f.config, transport: f.transport, signal: new AbortController().signal },
        settings,
        { backend: "heygen", action: "wait", voiceId: "voice123", timeoutMs, pollIntervalMs: 100 },
        clock,
      );
      assert.equal(result.voices[0]?.readiness, "pending");
      assert.equal(requests.length, timeoutMs === 100 ? 1 : 3);
      assert.ok(requests.every((time) => time < startedAt + timeoutMs));
      for (let index = 1; index < requests.length; index++) {
        const previous = requests[index - 1],
          current = requests[index];
        assert.ok(previous !== undefined && current !== undefined);
        assert.ok(current - previous >= 100.25);
      }
      assert.ok(sleeps > 1);
      assert.ok(now >= startedAt + timeoutMs);
    } finally {
      await f.cleanup();
    }
  }
});
