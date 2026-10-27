import { test } from "bun:test";
import { parseMediaConfig } from "../app/media/config.ts";
import { providerRequest } from "../app/media/providers.ts";
import assert from "node:assert/strict";
import { Database } from "bun:sqlite";
import { randomBytes } from "node:crypto";
import { IncomingMessage } from "node:http";
import { Socket } from "node:net";
import { mkdir, mkdtemp, readFile, readdir, rm, writeFile } from "node:fs/promises";
import { join, resolve } from "node:path";
import { Effect, Schema } from "effect";
import { createMediaHost } from "../app/media/index.ts";
import {
  createMediaReceiptStore,
  mediaRequestDigest,
  MediaReceiptFailure,
} from "../app/media/receipts.ts";
import {
  classifyMediaHttp,
  collectMediaResponse,
  mediaArtifactUrl,
  MediaHttpFailure,
  MediaPolicyFailure,
  requestMedia,
  type MediaHttpResponse,
} from "../app/media/transport.ts";

const json = (value: unknown): Uint8Array => new TextEncoder().encode(JSON.stringify(value));
const response = (body: unknown, status = 200): MediaHttpResponse => ({
  status,
  contentType: "application/json",
  requestId: null,
  bytes: json(body),
});
const clone = {
  backend: "heygen",
  operation: "clone",
  model: null,
  requestDigest: mediaRequestDigest({ reference: "fixture-hash", account: "fixture-account" }),
  idempotencyKey: "caller.key-01",
} as const;
async function fixture(maximumReceipts?: number) {
  const cache = resolve(".cache");
  await mkdir(cache, { recursive: true });
  const directory = await mkdtemp(join(cache, "media-receipt-test-"));
  const key = randomBytes(32);
  const store = await createMediaReceiptStore({
    directory,
    key,
    ...(maximumReceipts === undefined ? {} : { maximumReceipts }),
  });
  return {
    directory,
    key,
    store,
    cleanup: () => rm(directory, { recursive: true, force: true, maxRetries: 8, retryDelay: 100 }),
  };
}
test("media receipts atomically bind caller idempotency before submission and reject mismatched replay", async () => {
  const f = await fixture();
  try {
    const results = await Promise.all(Array.from({ length: 5 }, () => f.store.begin(clone)));
    assert.equal(results.filter((item) => item.created).length, 1);
    assert.equal(new Set(results.map((item) => item.receipt.id)).size, 1);
    const first = results[0];
    assert.ok(first);
    assert.equal(first.receipt.state, "submitting");
    assert.equal(first.receipt.idempotencyKey, clone.idempotencyKey);
    await assert.rejects(
      f.store.begin({ ...clone, requestDigest: "a".repeat(64) }),
      /different request/,
    );
    await assert.rejects(
      f.store.begin({ ...clone, operation: "synthesize" }),
      /no idempotency guarantee/,
    );
    const reopened = await createMediaReceiptStore({ directory: f.directory, key: f.key });
    assert.equal((await reopened.begin(clone)).created, false);
  } finally {
    await f.cleanup();
  }
});
test("media receipts encrypt signed URLs and alignment but exclude echoed uploads and secrets", async () => {
  const f = await fixture();
  try {
    const created = await f.store.begin({
      backend: "heygen",
      operation: "synthesize",
      model: "heygen-voice-1",
      requestDigest: "b".repeat(64),
      withTimestamps: true,
      output: "private-target.wav",
      voiceAuthorization: "fixture authorization",
    });
    const url =
      "https://resource2.heygen.ai/text_to_speech/private-name.wav?Signature=fixture-signed-token";
    await f.store.captureResponse(
      created.receipt.id,
      response({
        data: {
          audio_url: url,
          duration: 1,
          original_words: [{ text: "Private fixture words", start_time: 0, end_time: 1 }],
          echoed_audio: "DO_NOT_PERSIST_AUDIO_BASE64",
          api_key: "DO_NOT_PERSIST_API_KEY",
        },
      }),
    );
    const internal = await f.store.load(created.receipt.id);
    assert.equal(internal.state, "generated-awaiting-download");
    assert.equal(internal.response?.audioUrl, url);
    assert.equal(internal.response?.originalWords[0]?.text, "Private fixture words");
    assert.equal(JSON.stringify(internal).includes("DO_NOT_PERSIST"), false);
    const publicText = JSON.stringify(await f.store.public(internal.id));
    for (const secret of [
      "Signature",
      "fixture-signed-token",
      "private-name",
      "Private fixture words",
      "private-target",
      "fixture authorization",
    ])
      assert.equal(publicText.includes(secret), false);
    assert.equal(
      (await f.store.public(internal.id)).artifactLocation?.path,
      "/text_to_speech/[redacted]",
    );
    for (const name of await readdir(f.directory)) {
      const bytes = await readFile(join(f.directory, name));
      for (const secret of [
        url,
        "Private fixture words",
        "DO_NOT_PERSIST",
        "fixture authorization",
      ])
        assert.equal(bytes.includes(Buffer.from(secret)), false);
    }
  } finally {
    await f.cleanup();
  }
});
test("media receipts retain completed generation on download rejection or cancellation and never downgrade publication", async () => {
  const f = await fixture();
  try {
    const { receipt } = await f.store.begin({
      backend: "heygen",
      operation: "synthesize",
      model: null,
      requestDigest: "c".repeat(64),
    });
    await f.store.captureResponse(
      receipt.id,
      response({
        data: { audio_url: "https://unapproved.example/generated/private?secret=fixture" },
      }),
    );
    assert.throws(() =>
      mediaArtifactUrl("https://unapproved.example/generated/private?secret=fixture"),
    );
    const failed = await f.store.fail(
      receipt.id,
      new MediaHttpFailure({
        category: "cancelled",
        status: null,
        requestId: null,
        providerCode: null,
        providerMessage: null,
        contentType: null,
        retryable: false,
        bodyTruncated: false,
      }),
    );
    assert.equal(failed.state, "generated-awaiting-download");
    assert.equal(new MediaReceiptFailure(failed).receiptId, receipt.id);
    await assert.rejects(f.store.update(receipt.id, { state: "uncertain" }), /downgraded/);
    const artifact = {
      path: "output.wav",
      mimeType: "audio/wav",
      sha256: "d".repeat(64),
      sizeBytes: 44,
    };
    await f.store.update(receipt.id, { state: "published", artifact });
    assert.equal((await f.store.fail(receipt.id, new Error("private failure"))).state, "published");
    await assert.rejects(
      f.store.update(receipt.id, {
        state: "published",
        artifact: { ...artifact, sha256: "e".repeat(64) },
      }),
      /cannot be replaced/,
    );
  } finally {
    await f.cleanup();
  }
});
test("media receipt key mismatch and encrypted tampering fail closed before fresh begin", async () => {
  const f = await fixture();
  try {
    const { receipt } = await f.store.begin(clone);
    await assert.rejects(
      createMediaReceiptStore({ directory: f.directory, key: randomBytes(32) }),
      /key does not match/,
    );
    const db = new Database(join(f.directory, "media-receipts.sqlite"));
    try {
      const raw: unknown = db.query("SELECT payload FROM receipts WHERE id=?").get(receipt.id);
      const row = Schema.decodeUnknownSync(Schema.Struct({ payload: Schema.Uint8Array }))(raw);
      const changed = Buffer.from(row.payload);
      changed[30] = (changed[30] ?? 0) ^ 1;
      db.query("UPDATE receipts SET payload=? WHERE id=?").run(changed, receipt.id);
    } finally {
      db.close();
    }
    await assert.rejects(f.store.load(receipt.id), /Encrypted media receipt storage failed/);
  } finally {
    await f.cleanup();
  }
});
test("media receipt transaction crashes roll back and release locks while committed intent survives", async () => {
  const f = await fixture();
  try {
    const { receipt } = await f.store.begin(clone);
    const script = join(f.directory, "crash.ts");
    await writeFile(
      script,
      'import { Database } from "bun:sqlite"; const db = new Database(' +
        JSON.stringify(join(f.directory, "media-receipts.sqlite")) +
        '); db.exec("BEGIN IMMEDIATE"); db.query("INSERT INTO receipts(id,key_digest,payload) VALUES (?,?,?)").run("uncommitted",null,new Uint8Array([1])); process.exit(17);',
    );
    const child = Bun.spawn([process.execPath, script], {
      cwd: process.cwd(),
      stdout: "ignore",
      stderr: "ignore",
    });
    assert.equal(await child.exited, 17);
    const reopened = await createMediaReceiptStore({ directory: f.directory, key: f.key });
    assert.equal((await reopened.load(receipt.id)).state, "submitting");
    assert.equal((await reopened.list()).length, 1);
    const failed = await reopened.fail(
      receipt.id,
      new MediaHttpFailure({
        category: "network",
        status: null,
        requestId: null,
        providerCode: null,
        providerMessage: null,
        contentType: null,
        retryable: false,
        bodyTruncated: false,
      }),
    );
    assert.equal(failed.state, "uncertain");
    assert.equal((await reopened.begin(clone)).created, false);
  } finally {
    await f.cleanup();
  }
});
test("media receipts bound storage and retain malformed success without arbitrary raw content", async () => {
  const f = await fixture(1);
  try {
    const { receipt } = await f.store.begin(clone);
    await assert.rejects(
      f.store.begin({ ...clone, idempotencyKey: "another-key", requestDigest: "f".repeat(64) }),
      /storage limit/,
    );
    const captured = await f.store.captureResponse(receipt.id, {
      status: 200,
      contentType: "application/json",
      requestId: null,
      bytes: new Uint8Array([255, 254]),
    });
    assert.equal(captured.state, "accepted");
    assert.equal(captured.diagnostic?.category, "malformed-response");
    assert.equal(captured.requestId, null);
    assert.equal(captured.response?.audioUrl, null);
  } finally {
    await f.cleanup();
  }
});
test("HTTP diagnostics preserve reviewed MIME mismatch and redact arbitrary provider echoes", () => {
  const known = classifyMediaHttp(
    response(
      { code: "invalid_parameter", message: "Content type not match audio/wav != audio/x-wav" },
      400,
    ),
  );
  assert.equal(known.category, "bad-request");
  assert.equal(known.providerCode, "invalid_parameter");
  assert.equal(known.providerMessage, "Content type not match audio/wav != audio/x-wav");
  assert.equal(known.requestId, null);
  const echoed = classifyMediaHttp(
    response(
      {
        code: "invalid_parameter",
        message: "secret private input https://signed.example/a?token=secret",
        echo: "voice_not_ready",
      },
      400,
    ),
  );
  assert.equal(echoed.category, "bad-request");
  assert.equal(JSON.stringify(echoed).includes("secret private"), false);
  assert.equal(
    classifyMediaHttp(response({ error: { code: "voice_not_ready" } }, 409)).category,
    "voice-not-ready",
  );
  for (const [status, category] of [
    [401, "authentication"],
    [403, "permission"],
    [429, "rate-limit"],
    [503, "transient"],
    [302, "redirect"],
  ] as const)
    assert.equal(classifyMediaHttp(response({}, status)).category, category);
});
test("native HTTP response collector retains bounded rejection bytes and request ID", async () => {
  const incoming = new IncomingMessage(new Socket());
  incoming.statusCode = 400;
  incoming.headers = { "content-type": "application/json", "x-request-id": "fixture-request" };
  incoming.push(
    Buffer.from(
      JSON.stringify({
        code: "invalid_parameter",
        message: "Content type not match audio/wav != audio/x-wav",
      }),
    ),
  );
  incoming.push(null);
  const result = await collectMediaResponse(incoming, {
    signal: new AbortController().signal,
    maxBytes: 1024,
    timeoutMs: 1000,
  });
  assert.equal(result.status, 400);
  assert.equal(result.requestId, "fixture-request");
  assert.equal(classifyMediaHttp(result).providerCode, "invalid_parameter");
  const large = new IncomingMessage(new Socket());
  large.statusCode = 503;
  large.headers = { "content-type": "text/plain" };
  large.push(Buffer.alloc(10000, 65));
  large.push(null);
  const bounded = await collectMediaResponse(large, {
    signal: new AbortController().signal,
    maxBytes: 1024,
    timeoutMs: 1000,
  });
  assert.equal(bounded.bytes.byteLength, 1024);
  assert.equal(bounded.bodyTruncated, true);
  assert.equal(bounded.status, 503);
});
test("artifact allowlist accepts exact reviewed CDN pairs and rejects auth, redirects targets and traversal", async () => {
  for (const value of [
    "https://files.heygen.ai/generated/a.wav?signature=fixture",
    "https://resource2.heygen.ai/text_to_speech/a.wav?signature=fixture",
  ])
    assert.equal(mediaArtifactUrl(value), value);
  for (const value of [
    "http://files.heygen.ai/generated/a",
    "https://resource2.heygen.ai/generated/a",
    "https://files.heygen.ai/text_to_speech/a",
    "https://files.heygen.ai/generated/%2fprivate",
    "https://files.heygen.ai/generated/name%2ewav",
    "https://files.heygen.ai/generated/sub/%2e%2e/inside.wav",
    "https://files.heygen.ai/generated/%252e%252e/private",
    "https://user:secret@files.heygen.ai/generated/a",
    "https://files.heygen.ai/generated/../private",
    "https://files.heygen.ai.evil.test/generated/a",
    "https://files.heygen.ai/generated/a#token",
  ])
    assert.throws(() => mediaArtifactUrl(value));
  await assert.rejects(
    requestMedia("https://api.heygen.com/v3/unreviewed", {
      signal: new AbortController().signal,
      timeoutMs: 1000,
      maxBytes: 1024,
      headers: {},
      body: new Uint8Array(),
      method: "GET",
    }),
    /endpoint/,
  );
});
test("receipt fingerprints block ambiguous repeats with new keys and keep rejected keys immutable", async () => {
  const f = await fixture();
  try {
    const first = await f.store.begin(clone);
    const repeat = await f.store.begin({ ...clone, idempotencyKey: "different-caller-key" });
    assert.equal(repeat.created, false);
    assert.equal(repeat.receipt.id, first.receipt.id);
    assert.equal(repeat.receipt.idempotencyKey, clone.idempotencyKey);
    await f.store.fail(
      first.receipt.id,
      new MediaHttpFailure(classifyMediaHttp(response({ code: "invalid_parameter" }, 400))),
    );
    assert.equal((await f.store.begin(clone)).created, false);
    const next = await f.store.begin({ ...clone, idempotencyKey: "new-deliberate-key" });
    assert.equal(next.created, true);
    assert.notEqual(next.receipt.id, first.receipt.id);
  } finally {
    await f.cleanup();
  }
});

test("speech dedup requires reconciliation before a deliberate new published candidate", async () => {
  const f = await fixture();
  try {
    const speech = {
      backend: "heygen",
      operation: "synthesize",
      model: "heygen-voice-1",
      requestDigest: "9".repeat(64),
      output: "candidate-01.wav",
    } as const;
    const trainingDecision = {
      effective: "excluded",
      eligible: true,
      usedTrainingOptIn: false,
      verification: "source-reviewed",
      reasons: ["Fixture policy"],
      evidenceIds: [],
      assertionIds: [],
    } as const;
    const first = await f.store.begin({ ...speech, trainingDecision });
    assert.deepEqual((await f.store.load(first.receipt.id)).trainingDecision, trainingDecision);
    assert.equal(
      (await f.store.begin({ ...speech, output: "candidate-02.wav", newCandidate: true })).created,
      false,
    );
    await f.store.captureResponse(
      first.receipt.id,
      response({
        data: { audio_url: "https://files.heygen.ai/generated/fixture.wav?private=fixture" },
      }),
    );
    assert.equal(
      (await f.store.begin({ ...speech, output: "candidate-02.wav", newCandidate: true })).created,
      false,
    );
    await f.store.update(first.receipt.id, {
      state: "published",
      artifact: {
        path: speech.output,
        mimeType: "audio/wav",
        sha256: "8".repeat(64),
        sizeBytes: 44,
      },
    });
    assert.equal((await f.store.begin({ ...speech, newCandidate: true })).created, false);
    assert.equal((await f.store.begin({ ...speech, output: "candidate-02.wav" })).created, false);
    const second = await f.store.begin({
      ...speech,
      output: "candidate-02.wav",
      newCandidate: true,
    });
    assert.equal(second.created, true);
    assert.notEqual(second.receipt.id, first.receipt.id);
    assert.equal(
      (await f.store.begin({ ...speech, output: "candidate-03.wav", newCandidate: true })).created,
      false,
    );
  } finally {
    await f.cleanup();
  }
});
test("receipt projection preserves verification and readiness without arbitrary response fields", async () => {
  const f = await fixture();
  try {
    const { receipt } = await f.store.begin(clone);
    const captured = await f.store.captureResponse(
      receipt.id,
      response({
        data: {
          voice_id: "fixture-voice",
          status: "ACTIVE",
          requires_verification: true,
          asset_id: "fixture-asset",
          arbitrary: "not-retained",
        },
      }),
    );
    assert.equal(captured.voiceId, "fixture-voice");
    assert.equal(captured.response?.status, "ACTIVE");
    assert.equal(captured.response?.requiresVerification, true);
    assert.deepEqual(captured.response?.assetIds, ["fixture-asset"]);
    assert.equal(JSON.stringify(captured).includes("not-retained"), false);
  } finally {
    await f.cleanup();
  }
});
test("receipt failures preserve successful HTTP evidence and never replace generation request ID with download ID", async () => {
  const f = await fixture();
  try {
    const first = await f.store.begin({
      backend: "heygen",
      operation: "synthesize",
      model: null,
      requestDigest: "6".repeat(64),
    });
    await f.store.captureResponse(first.receipt.id, {
      ...response({
        data: { audio_url: "https://resource2.heygen.ai/text_to_speech/fixture.wav" },
      }),
      requestId: "generation-request",
    });
    const invalid = await f.store.fail(first.receipt.id, new Error("private parser detail"));
    assert.equal(invalid.state, "generated-awaiting-download");
    assert.equal(invalid.diagnostic?.category, "malformed-response");
    assert.equal(invalid.diagnostic?.status, 200);
    assert.equal(invalid.diagnostic?.contentType, "application/json");
    assert.equal(invalid.diagnostic?.requestId, "generation-request");
    const failedDownload = await f.store.fail(
      first.receipt.id,
      new MediaHttpFailure(
        classifyMediaHttp({
          ...response({ code: "permission_denied" }, 403),
          requestId: "download-request",
        }),
      ),
    );
    assert.equal(failedDownload.requestId, "generation-request");
    assert.equal(failedDownload.diagnostic?.requestId, "download-request");
    assert.equal(failedDownload.diagnostic?.status, 403);
    const empty = await f.store.begin({
      ...clone,
      idempotencyKey: "empty-success-key",
      requestDigest: "7".repeat(64),
    });
    await f.store.captureResponse(empty.receipt.id, {
      status: 200,
      contentType: "application/json",
      requestId: null,
      bytes: new Uint8Array(),
    });
    const emptyFailed = await f.store.fail(empty.receipt.id, new Error("invalid JSON"));
    assert.equal(emptyFailed.state, "accepted");
    assert.equal(emptyFailed.diagnostic?.status, 200);
    assert.equal(emptyFailed.diagnostic?.contentType, "application/json");
    assert.equal(emptyFailed.requestId, null);
  } finally {
    await f.cleanup();
  }
});

test("diagnostic code vocabulary does not expose arbitrary lowercase secrets", () => {
  const result = classifyMediaHttp(
    response({ code: "privatecredentialvalue", message: "privatecredentialvalue" }, 401),
  );
  assert.equal(result.providerCode, null);
  assert.equal(
    result.providerMessage,
    "Provider message redacted because it may contain request data.",
  );
  assert.equal(JSON.stringify(result).includes("privatecredentialvalue"), false);
  const direct = new MediaHttpFailure({ ...result, providerCode: "anothersecretvalue" });
  assert.equal(direct.diagnostic.providerCode, null);
  assert.equal(JSON.stringify(direct.diagnostic).includes("anothersecretvalue"), false);
});
test("local upload policy rejection sends no POST and records no fabricated HTTP failure", async () => {
  const f = await fixture();
  try {
    let requests = 0;
    let credentialRead = false;
    const context = {
      config: parseMediaConfig({}, process.cwd()),
      signal: new AbortController().signal,
      transport: {
        process: async () => new Uint8Array(),
        download: async () => response({}),
        request: async () => {
          requests += 1;
          return response({});
        },
        environment: () => {
          credentialRead = true;
          return "fixture-not-a-real-key";
        },
      },
      authorizeUpload: () => {
        assert.equal(credentialRead, true);
        throw new MediaPolicyFailure();
      },
    };
    const { receipt } = await f.store.begin(clone);
    await assert.rejects(
      providerRequest(
        context,
        "https://api.heygen.com/v3/models/audio/voices",
        "FIXTURE_KEY",
        "x-api-key",
        "application/json",
        json({ input: "synthetic" }),
        4096,
      ),
      MediaPolicyFailure,
    );
    assert.equal(requests, 0);
    const failed = await f.store.fail(receipt.id, new MediaPolicyFailure());
    assert.equal(failed.state, "rejected");
    assert.equal(new MediaReceiptFailure(failed, new MediaPolicyFailure()).policyDenied, true);
    assert.equal(failed.diagnostic, null);
    assert.equal(failed.requestId, null);
    await providerRequest(
      context,
      "https://api.heygen.com/v3/api_keys/self",
      "FIXTURE_KEY",
      "x-api-key",
      "application/json",
      new Uint8Array(),
      4096,
      {},
      "GET",
    );
    assert.equal(requests, 1);
    const next = await f.store.begin({ ...clone, idempotencyKey: "new-policy-attempt" });
    await f.store.captureResponse(
      next.receipt.id,
      response({ data: { voice_id: "accepted-voice" } }),
    );
    const accepted = await f.store.fail(next.receipt.id, new MediaPolicyFailure());
    assert.equal(accepted.state, "accepted");
    assert.equal(accepted.diagnostic?.status, 200);
  } finally {
    await f.cleanup();
  }
});
test("ElevenLabs enrollment preserves a confirmed HTTP rejection instead of an uncertain retry warning", async () => {
  const f = await fixture();
  try {
    await writeFile(join(f.directory, "source.wav"), new Uint8Array([82, 73, 70, 70]));
    let calls = 0;
    const api = await Effect.runPromise(
      createMediaHost({
        config: {
          inputRoot: f.directory,
          outputRoot: f.directory,
          elevenlabs: { apiKeyEnv: "FIXTURE_KEY" },
        },
        transport: {
          environment: () => "fixture-key",
          process: async () => {
            throw new Error("No process should be needed");
          },
          download: async () => {
            throw new Error("No download should be needed");
          },
          request: async () => {
            calls += 1;
            return response(
              { code: "invalid_parameter", message: "private rejected request" },
              400,
            );
          },
        },
      }),
    );
    const result = await Effect.runPromise(
      api
        .run({
          operation: "clone",
          backend: "elevenlabs",
          allowTraining: true,
          reference: "source.wav",
          name: "Fixture",
        })
        .pipe(
          Effect.match({
            onFailure: (error) => ({
              code: error.code,
              diagnostic: error.diagnostic,
              message: error.message,
            }),
            onSuccess: () => ({
              code: "unexpected-success",
              diagnostic: undefined,
              message: "unexpected",
            }),
          }),
        ),
    );
    assert.equal(result.code, "rejected");
    assert.equal(result.diagnostic?.status, 400);
    assert.equal(result.diagnostic?.providerCode, "invalid_parameter");
    assert.equal(result.message.includes("outcome could not be confirmed"), false);
    assert.equal(JSON.stringify(result).includes("private rejected request"), false);
    assert.equal(calls, 1);
  } finally {
    await f.cleanup();
  }
});
