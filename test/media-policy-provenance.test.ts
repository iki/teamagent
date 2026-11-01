import { mkdtemp } from "./temporary.ts";
import { describe, expect, test } from "bun:test";
import { rejects } from "node:assert/strict";
import { mkdir, writeFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { Clock, Effect } from "effect";
import {
  evaluateTrainingPolicy,
  makeMedia,
  type MediaBackend,
  type MediaResult,
  type TrainingAccountConfig,
  type TrainingEvidence,
} from "@/media";
import { createMediaHost } from "../app/media/index.ts";
import { defaultHeyGenSpeechModel } from "../app/media/heygen.ts";
import { mediaTrainingReview, resolveMediaTrainingPolicy } from "../app/media/training.ts";

const now = mediaTrainingReview.reviewedAt + 60_000;
const clock: Clock.Clock = {
  currentTimeMillisUnsafe: () => now,
  currentTimeMillis: Effect.succeed(now),
  currentTimeNanosUnsafe: () => BigInt(now) * 1_000_000n,
  currentTimeNanos: Effect.succeed(BigInt(now) * 1_000_000n),
  monotonicTimeNanosUnsafe: () => 1_000_000n,
  monotonicTimeNanos: Effect.succeed(1_000_000n),
  sleep: () => Effect.void,
};
const training = resolveMediaTrainingPolicy({
  backendId: "ffmpeg",
  operation: "inspect",
  model: null,
});
const authorized = evaluateTrainingPolicy(training, { now });
const backend: MediaBackend = {
  id: "ffmpeg",
  label: "Synthetic local inspection",
  locality: "local",
  available: true,
  unavailableReason: null,
  limitations: [],
  capabilities: [
    {
      operation: "inspect",
      model: null,
      default: true,
      formats: [],
      timestamps: [],
      diarization: false,
      referenceVoice: false,
      policy: { balanced: 0, quality: 0, latency: 0, cost: 0 },
      training,
      limitations: [],
    },
  ],
};
const result: MediaResult = {
  operation: "inspect",
  backend: "ffmpeg",
  model: null,
  media: { format: "wav", durationSeconds: 1, sizeBytes: 48, streams: [] },
  provenance: {
    inputSha256: "a".repeat(64),
    referenceSha256: null,
    toolVersion: null,
    providerRequestId: null,
    elapsedMs: 1,
    limitations: ["Synthetic result; no file or provider was inspected."],
  },
};
function inspect(value: MediaResult) {
  const media = makeMedia({
    listBackends: () => Effect.succeed([backend]),
    execute: () => Effect.succeed(value),
  });
  return Effect.runPromise(
    Effect.provideService(
      media.run({ operation: "inspect", input: "fixture.wav" }),
      Clock.Clock,
      clock,
    ),
  );
}

describe("media result policy provenance", () => {
  test("contradictory supplied training disclosure is rejected", async () => {
    await rejects(
      inspect({
        ...result,
        provenance: {
          ...result.provenance,
          trainingDecision: { ...authorized, effective: "permitted", usedTrainingOptIn: true },
        },
      }),
    );
  });

  test("missing disclosure is normalized from authorized plan without claiming provider authentication", async () => {
    const normalized = await inspect(result);
    expect(normalized.provenance.trainingDecision).toEqual(authorized);
    expect(normalized.provenance.trainingDecision?.verification).toBe("source-reviewed");
    expect(normalized.provenance.trainingDecision?.usedTrainingOptIn).toBe(false);
  });
});

function wav(): Uint8Array {
  const bytes = Buffer.alloc(364);
  bytes.write("RIFF");
  bytes.writeUInt32LE(356, 4);
  bytes.write("WAVEfmt ", 8);
  bytes.writeUInt32LE(16, 16);
  bytes.writeUInt16LE(1, 20);
  bytes.writeUInt16LE(1, 22);
  bytes.writeUInt32LE(16000, 24);
  bytes.writeUInt32LE(32000, 28);
  bytes.writeUInt16LE(2, 32);
  bytes.writeUInt16LE(16, 34);
  bytes.write("data", 36);
  bytes.writeUInt32LE(320, 40);
  return bytes;
}
function heyGenAccount(): TrainingAccountConfig {
  const account = { accountId: "fixture-account", revision: "fixture-account-v1", evidence: [] };
  const policy = resolveMediaTrainingPolicy({
    backendId: "heygen",
    operation: "synthesize",
    model: defaultHeyGenSpeechModel,
    account,
  });
  const evidence: TrainingEvidence = {
    id: "fixture-exclusion",
    scope: policy.scope,
    policyRevision: policy.revision,
    accountRevision: account.revision,
    credentialBinding: "fixture-key-id",
    condition: "confirmed-opt-out",
    effect: "excluded",
    kind: "document-review",
    reviewedAt: mediaTrainingReview.reviewedAt,
    expiresAt: mediaTrainingReview.expiresAt,
    invalidated: false,
    sourceUrl: "https://example.invalid/fixture-policy",
    artifactSha256: "b".repeat(64),
    reviewer: "fixture-reviewer",
    reference: "Synthetic policy fixture, not an actual account claim.",
  };
  return { ...account, evidence: [evidence] };
}

test("failed remote identity check does not prevent an eligible automatic local route or cause POST", async () => {
  const directory = await mkdtemp(join(tmpdir(), "teamagent-policy-auto-"));
  let uploads = 0;
  let diagnoses = 0;
  let localRuns = 0;
  try {
    await mkdir(join(directory, "output"));
    const model = join(directory, "voice.onnx");
    await writeFile(model, "fixture model");
    await writeFile(model + ".json", "{}");
    const media = await Effect.runPromise(
      createMediaHost({
        config: {
          inputRoot: directory,
          outputRoot: join(directory, "output"),
          ffmpeg: { executable: process.execPath, probeExecutable: process.execPath },
          piper: { executable: process.execPath, modelPath: model },
          heygen: { apiKeyEnv: "FIXTURE_HEYGEN_KEY", voiceId: "fixture-voice" },
          training: { heygen: heyGenAccount() },
        },
        transport: {
          environment: (name) =>
            name === "FIXTURE_HEYGEN_KEY" ? "synthetic-not-a-credential" : undefined,
          request: async (_url, options) => {
            if (options.method === "POST" || options.method === undefined) uploads += 1;
            else diagnoses += 1;
            return {
              status: 503,
              contentType: "application/json",
              requestId: null,
              bytes: new TextEncoder().encode(
                JSON.stringify({ error: { message: "Synthetic metadata service unavailable." } }),
              ),
            };
          },
          process: async (_executable, args) => {
            const target = args[args.indexOf("--output-file") + 1];
            if (!args.includes("--output-file") || target === undefined)
              throw new Error("Unexpected fixture process.");
            localRuns += 1;
            await writeFile(target, wav());
            return new Uint8Array();
          },
          download: async () => {
            throw new Error("Unexpected fixture download.");
          },
        },
      }),
    );
    const output = await Effect.runPromise(
      media.run({ operation: "synthesize", text: "Local fixture output.", output: "auto.wav" }),
    );
    expect(output.backend).toBe("piper");
    expect(diagnoses).toBeGreaterThan(0);
    expect(uploads).toBe(0);
    expect(localRuns).toBe(1);
    await rejects(
      Effect.runPromise(
        media.run({
          operation: "synthesize",
          backend: "heygen",
          text: "Explicit remote selection must fail.",
        }),
      ),
    );
    expect(uploads).toBe(0);
    expect(localRuns).toBe(1);
  } finally {
    await rm(directory, { recursive: true, force: true, maxRetries: 8, retryDelay: 100 });
  }
});
