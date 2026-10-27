import { randomUUID } from "node:crypto";
import { writeFile } from "node:fs/promises";
import { join } from "node:path";
import { Schema } from "effect";
import type { MediaProvenance, MediaResult } from "@/media";
import { detectReferenceAudio, inspectWave } from "./audio.ts";
import { digest, outputPath, publishAudio, readInput } from "./files.ts";
import { getHeyGenKey, getHeyGenVoice } from "./heygen-lifecycle.ts";
import type { MediaExecution } from "./local.ts";
import { providerRequest, requireJson } from "./providers.ts";
import {
  MediaReceiptFailure,
  mediaRequestDigest,
  type MediaReceipt,
  type MediaReceiptStore,
} from "./receipts.ts";
import {
  MediaHostFailure,
  MediaHttpFailure,
  classifyMediaHttp,
  mediaArtifactUrl,
} from "./transport.ts";

export const heyGenSpeechModels = [
  "heygen-voice-1",
  "heygen-voice-1-turbo",
  "heygen-voice-1-turbo-free",
] as const;
export const defaultHeyGenSpeechModel = "heygen-voice-1";
export interface HeyGenSettings {
  readonly apiKeyEnv: string;
  readonly voiceId?: string | undefined;
  readonly speechModel?: string | undefined;
}
const SpeechResponse = Schema.Struct({
  data: Schema.Struct({
    audio_url: Schema.NonEmptyString.check(Schema.isMaxLength(8192)),
    duration: Schema.Number.check(
      Schema.isFinite(),
      Schema.isGreaterThan(0),
      Schema.isLessThanOrEqualTo(86400),
    ),
  }),
});
const CloneResponse = Schema.Struct({
  data: Schema.Struct({
    voice_id: Schema.String.check(Schema.isPattern(/^[A-Za-z0-9_-]{1,256}$/)),
  }),
});
const DownloadResponse = Schema.Struct({
  status: Schema.Int,
  contentType: Schema.String.check(Schema.isMaxLength(500)),
  requestId: Schema.NullOr(Schema.String),
  bodyTruncated: Schema.optional(Schema.Boolean),
  bytes: Schema.Uint8Array,
});
export type HeyGenRecoveryContext = Pick<
  MediaExecution,
  "config" | "transport" | "signal" | "stage"
> & { readonly receipts: MediaReceiptStore };
/** Exact reviewed origin/path pairs; signed queries remain confidential and credentials are never forwarded. */
export function heyGenAudioUrl(value: string): string {
  return mediaArtifactUrl(value);
}
function recoveryProvenance(receipt: MediaReceipt): MediaProvenance {
  return {
    inputSha256: receipt.sourceSha256,
    referenceSha256: receipt.referenceSha256,
    toolVersion: null,
    providerRequestId: receipt.requestId,
    elapsedMs: 0,
    limitations: ["Recovered from an encrypted provider receipt without repeating generation."],
    ...(receipt.trainingDecision === null ? {} : { trainingDecision: receipt.trainingDecision }),
    ...(receipt.voiceAuthorization === null
      ? {}
      : { voiceAuthorization: receipt.voiceAuthorization }),
  };
}
function alignment(receipt: MediaReceipt) {
  const response = receipt.response;
  if (response === null || !response.alignmentValid) return undefined;
  const valid = (items: typeof response.originalWords) =>
    items.every(
      (item, index) =>
        item.endTime >= item.startTime &&
        (index === 0 || item.startTime >= (items[index - 1]?.startTime ?? 0)) &&
        (response.duration === null || item.endTime <= response.duration + 0.1),
    );
  if (!valid(response.originalWords) || !valid(response.originalCharacters)) return undefined;
  if (response.originalCharacters.length + response.originalWords.length === 0) return undefined;
  const convert = (items: typeof response.originalWords) =>
    items.map((item) => ({
      text: item.text,
      startSeconds: item.startTime,
      endSeconds: item.endTime,
    }));
  return {
    characters: convert(response.originalCharacters),
    words: convert(response.originalWords),
  };
}
async function downloadReceipt(
  context: HeyGenRecoveryContext,
  receipt: MediaReceipt,
  provenance: MediaProvenance,
  output?: string,
): Promise<MediaResult> {
  const response = receipt.response;
  if (
    receipt.operation !== "synthesize" ||
    receipt.backend !== "heygen" ||
    response?.audioUrl == null
  )
    throw new MediaHostFailure(
      "conflict",
      "This receipt has no validated completed synthesis result to download; generation will not be repeated.",
    );
  const timing = alignment(receipt);
  const providerDuration =
    response.duration !== null && response.duration > 0 ? response.duration : undefined;
  const limitations = [
    ...provenance.limitations,
    ...(providerDuration === undefined
      ? ["Provider duration was missing or invalid; only measured WAV duration is reported."]
      : []),
    "The provider hosts generated audio; downloading does not change its retention or access policy.",
    ...(receipt.withTimestamps && timing === undefined
      ? ["Requested provider alignment was absent or invalid; no timing was invented."]
      : []),
  ];
  const common = {
    operation: "synthesize" as const,
    backend: "heygen",
    model: receipt.model,
    receiptId: receipt.id,
    provenance: { ...provenance, providerRequestId: receipt.requestId, limitations },
    ...(providerDuration === undefined ? {} : { providerDurationSeconds: providerDuration }),
    ...(timing === undefined ? {} : { alignment: timing }),
  };
  if (receipt.state === "published") {
    if (receipt.artifact === null || output !== undefined)
      throw new MediaHostFailure(
        "conflict",
        "This receipt is already published; recovery cannot choose another destination.",
      );
    const existing = await readInput(
      context.config.outputRoot,
      receipt.artifact.path,
      context.config.limits.outputBytes,
      context.signal,
    );
    if (
      existing.sha256 !== receipt.artifact.sha256 ||
      existing.bytes.byteLength !== receipt.artifact.sizeBytes
    )
      throw new MediaHostFailure("conflict", "Published media no longer matches its receipt.");
    return { ...common, artifact: receipt.artifact, audio: inspectWave(existing.bytes) };
  }
  if (receipt.state !== "generated-awaiting-download")
    throw new MediaHostFailure("conflict", "This receipt is not ready for download recovery.");
  if (receipt.artifact !== null && output === undefined) {
    try {
      const existing = await readInput(
        context.config.outputRoot,
        receipt.artifact.path,
        context.config.limits.outputBytes,
        context.signal,
      );
      if (
        existing.sha256 !== receipt.artifact.sha256 ||
        existing.bytes.byteLength !== receipt.artifact.sizeBytes
      )
        throw new MediaHostFailure(
          "conflict",
          "Recovery destination differs from the recorded publication candidate.",
        );
      const audio = inspectWave(existing.bytes);
      await context.receipts.update(receipt.id, { state: "published", artifact: receipt.artifact });
      return { ...common, artifact: receipt.artifact, audio };
    } catch (error: unknown) {
      if (!(error instanceof Error && "code" in error && error.code === "ENOENT")) throw error;
    }
  }
  const destination = await outputPath(
    context.config.outputRoot,
    output ?? receipt.output ?? undefined,
    "wav",
  );
  const downloaded = Schema.decodeUnknownSync(DownloadResponse)(
    await context.transport.download(heyGenAudioUrl(response.audioUrl), {
      signal: context.signal,
      maxBytes: context.config.limits.outputBytes,
      timeoutMs: context.config.limits.timeoutMs,
    }),
  );
  if (downloaded.status < 200 || downloaded.status >= 300)
    throw new MediaHttpFailure(classifyMediaHttp(downloaded));
  if (
    downloaded.bytes.byteLength === 0 ||
    downloaded.bytes.byteLength > context.config.limits.outputBytes
  )
    throw new MediaHostFailure("limit", "HeyGen audio download exceeded its byte limit.");
  if (
    !/^audio\//i.test(downloaded.contentType) &&
    downloaded.contentType !== "application/octet-stream"
  )
    throw new MediaHostFailure("provider", "HeyGen audio download did not contain audio.");
  const audio = inspectWave(downloaded.bytes);
  const stage = join(context.stage, "output.wav");
  await writeFile(stage, downloaded.bytes, { flag: "wx", mode: 0o600 });
  await context.receipts.update(receipt.id, {
    state: "generated-awaiting-download",
    artifact: {
      path: destination,
      mimeType: "audio/wav",
      sha256: digest(downloaded.bytes),
      sizeBytes: downloaded.bytes.byteLength,
    },
  });
  const artifact = await publishAudio(
    stage,
    destination,
    "wav",
    context.config.limits.outputBytes,
    context.signal,
  );
  await context.receipts.update(receipt.id, { state: "published", artifact });
  return { ...common, artifact, audio };
}
export async function resumeHeyGen(
  context: HeyGenRecoveryContext,
  receiptId: string,
  output?: string,
): Promise<MediaResult> {
  const receipt = await context.receipts.load(receiptId);
  try {
    if (receipt.backend !== "heygen")
      throw new MediaHostFailure(
        "unsupported",
        "This recovery adapter only supports HeyGen receipts.",
      );
    if (receipt.operation === "clone") {
      if (output !== undefined)
        throw new MediaHostFailure(
          "invalid",
          "Clone reconciliation does not publish an audio file.",
        );
      if (receipt.voiceId === null || receipt.state === "rejected")
        throw new MediaHostFailure(
          "conflict",
          "This enrollment has no recoverable voice identity. Inspect the provider history manually; it will not be resubmitted or matched by name.",
        );
      const settings = context.config.config.heygen;
      if (settings === undefined)
        throw new MediaHostFailure(
          "unavailable",
          "HeyGen is not configured for read-only reconciliation.",
        );
      const voice = await getHeyGenVoice(context, settings, receipt.voiceId);
      const state =
        voice.readiness === "failed"
          ? "rejected"
          : voice.readiness === "ready"
            ? "accepted"
            : "pending";
      await context.receipts.update(receipt.id, {
        state,
        ...(receipt.response === null
          ? {}
          : {
              response: {
                ...receipt.response,
                status: voice.status,
                requiresVerification:
                  voice.requiresVerification ?? receipt.response.requiresVerification,
              },
            }),
      });
      if (voice.readiness === "failed" || voice.readiness === "unknown")
        throw new MediaHostFailure(
          "provider",
          "The retained enrollment is failed or has an unknown provider status; no enrollment was retried.",
        );
      return {
        operation: "clone",
        backend: "heygen",
        model: receipt.model,
        receiptId: receipt.id,
        voiceId: voice.id,
        requiresVerification:
          voice.requiresVerification ?? receipt.response?.requiresVerification ?? null,
        readiness: voice.readiness === "ready" ? "ready" : "pending",
        providerStatus: voice.status,
        referenceAssetIds: [
          ...new Set([...(receipt.response?.assetIds ?? []), ...voice.referenceAssetIds]),
        ],
        provenance: {
          ...recoveryProvenance(receipt),
          limitations: [...recoveryProvenance(receipt).limitations, ...voice.limitations],
        },
      };
    }
    return await downloadReceipt(context, receipt, recoveryProvenance(receipt), output);
  } catch (error: unknown) {
    throw new MediaReceiptFailure(await context.receipts.fail(receipt.id, error), error);
  }
}
function requireReceipts(context: MediaExecution): MediaReceiptStore {
  if (context.receipts === undefined)
    throw new MediaHostFailure(
      "unavailable",
      "HeyGen mutations require an encrypted recovery store and its injected encryption key.",
    );
  return context.receipts;
}
export async function executeHeyGen(
  context: MediaExecution,
  settings: HeyGenSettings,
): Promise<MediaResult> {
  const { plan, config } = context;
  const request = plan.request;
  const identity = { backend: plan.backend.id, model: plan.model };
  if (request.operation === "synthesize") {
    if (request.reference !== undefined || request.referenceText !== undefined)
      throw new MediaHostFailure(
        "unsupported",
        "HeyGen synthesis requires an existing voice ID; enroll a persistent clone separately.",
      );
    const voiceId = request.voice ?? settings.voiceId;
    if (voiceId === undefined || !/^[A-Za-z0-9_-]{1,256}$/.test(voiceId))
      throw new MediaHostFailure("invalid", "HeyGen synthesis requires an explicit voice ID.");
    if (!heyGenSpeechModels.some((model) => model === plan.model))
      throw new MediaHostFailure("unsupported", "The selected HeyGen speech model is unsupported.");
    if (request.text.length > 5000)
      throw new MediaHostFailure(
        "limit",
        "HeyGen speech is limited to 5000 characters per request.",
      );
    if (request.format !== undefined && request.format !== "wav")
      throw new MediaHostFailure(
        "unsupported",
        "This HeyGen adapter publishes completed WAV audio.",
      );
    const destination = await outputPath(config.outputRoot, request.output, "wav");
    const receipts = requireReceipts(context);
    const key = await getHeyGenKey(context, settings);
    if (key.status !== "active")
      throw new MediaHostFailure("unavailable", "The configured HeyGen API key is not active.");
    const voice = await getHeyGenVoice(context, settings, voiceId);
    if (voice.readiness !== "ready" || voice.requiresVerification === true)
      throw new MediaHostFailure(
        "unavailable",
        "The selected HeyGen voice is not ACTIVE or requires verification.",
      );
    if (plan.model !== "heygen-voice-1" && voice.mode !== "instant" && voice.mode !== "public")
      throw new MediaHostFailure(
        "unsupported",
        "HeyGen Turbo models do not support professional voices or an unverified voice mode.",
      );
    if (voice.mode !== "instant" && request.expressivenessBoost !== undefined)
      throw new MediaHostFailure(
        "unsupported",
        "Expressiveness boost is supported only for a verified instant voice.",
      );
    if (voice.mode !== "professional" && /<\s*break\b/i.test(request.text))
      throw new MediaHostFailure(
        "unsupported",
        "Break markup is not supported for instant or unclassified voices.",
      );
    const body = {
      model: plan.model,
      voice_id: voiceId,
      text: request.text,
      ...(request.language === undefined ? {} : { language: request.language }),
      ...(voice.mode === "instant"
        ? { expressiveness_boost: request.expressivenessBoost ?? 0.5 }
        : {}),
      ...(request.withTimestamps === undefined ? {} : { with_timestamps: request.withTimestamps }),
    };
    const begun = await receipts.begin({
      backend: "heygen",
      operation: "synthesize",
      model: plan.model,
      requestDigest: mediaRequestDigest({ keyId: key.key_id, body }),
      output: destination,
      withTimestamps: request.withTimestamps ?? false,
      newCandidate: request.output !== undefined,
      ...(context.provenance.trainingDecision === undefined
        ? {}
        : { trainingDecision: context.provenance.trainingDecision }),
      ...(context.provenance.voiceAuthorization === undefined
        ? {}
        : { voiceAuthorization: context.provenance.voiceAuthorization }),
    });
    if (!begun.created)
      throw new MediaReceiptFailure(
        begun.receipt,
        new MediaHostFailure(
          "conflict",
          "A matching receipt already exists; recover it without repeating generation.",
        ),
      );
    try {
      const response = await providerRequest(
        context,
        "https://api.heygen.com/v3/models/audio/tts",
        settings.apiKeyEnv,
        "x-api-key",
        "application/json",
        new TextEncoder().encode(JSON.stringify(body)),
        config.limits.processOutputBytes,
      );
      const receipt = await receipts.captureResponse(begun.receipt.id, response);
      Schema.decodeUnknownSync(SpeechResponse)(requireJson(response));
      return await downloadReceipt({ ...context, receipts }, receipt, context.provenance);
    } catch (error: unknown) {
      throw new MediaReceiptFailure(await receipts.fail(begun.receipt.id, error), error);
    }
  }
  if (request.operation === "clone") {
    if (context.reference === undefined)
      throw new MediaHostFailure("invalid", "HeyGen enrollment requires a reference recording.");
    const reference = context.reference;
    if (reference.bytes.byteLength > 16000000 || request.name.length > 64)
      throw new MediaHostFailure(
        "limit",
        "HeyGen enrollment allows 16 MB audio and a 64-character name.",
      );
    const detected = detectReferenceAudio(reference.bytes);
    const receipts = requireReceipts(context);
    const key = await getHeyGenKey(context, settings);
    if (key.status !== "active")
      throw new MediaHostFailure("unavailable", "The configured HeyGen API key is not active.");
    const controls = {
      mode: "instant",
      name: request.name,
      similarity: request.similarity ?? "max",
      ...(request.language === undefined ? {} : { language: request.language }),
    };
    const begun = await receipts.begin({
      backend: "heygen",
      operation: "clone",
      model: plan.model,
      requestDigest: mediaRequestDigest({
        keyId: key.key_id,
        controls,
        mime: detected.providerMimeType,
        referenceSha256: digest(reference.bytes),
      }),
      referenceSha256: reference.sha256,
      ...(context.provenance.trainingDecision === undefined
        ? {}
        : { trainingDecision: context.provenance.trainingDecision }),
      idempotencyKey: request.idempotencyKey ?? randomUUID(),
      ...(context.provenance.voiceAuthorization === undefined
        ? {}
        : { voiceAuthorization: context.provenance.voiceAuthorization }),
    });
    if (!begun.created)
      throw new MediaReceiptFailure(
        begun.receipt,
        new MediaHostFailure(
          "conflict",
          "This enrollment idempotency key already has a receipt; inspect its voice ID and status without resubmitting.",
        ),
      );
    try {
      const response = await providerRequest(
        context,
        "https://api.heygen.com/v3/models/audio/voices",
        settings.apiKeyEnv,
        "x-api-key",
        "application/json",
        new TextEncoder().encode(
          JSON.stringify({
            ...controls,
            audio: [
              {
                type: "base64",
                media_type: detected.providerMimeType,
                data: Buffer.from(reference.bytes).toString("base64"),
              },
            ],
          }),
        ),
        config.limits.processOutputBytes,
        { "idempotency-key": begun.receipt.idempotencyKey ?? begun.receipt.id },
      );
      const receipt = await receipts.captureResponse(begun.receipt.id, response);
      const data = Schema.decodeUnknownSync(CloneResponse)(requireJson(response));
      const providerStatus = receipt.response?.status ?? "PENDING";
      await receipts.update(receipt.id, {
        state:
          providerStatus === "ACTIVE"
            ? "accepted"
            : providerStatus === "FAILED"
              ? "rejected"
              : "pending",
        voiceId: data.data.voice_id,
      });
      if (providerStatus === "FAILED")
        throw new MediaHostFailure(
          "provider",
          "The provider reported failed enrollment; its receipt and voice identity were retained.",
        );
      return {
        operation: "clone",
        ...identity,
        receiptId: receipt.id,
        voiceId: data.data.voice_id,
        requiresVerification: receipt.response?.requiresVerification ?? null,
        readiness: providerStatus === "ACTIVE" ? "ready" : "pending",
        providerStatus,
        referenceAssetIds: receipt.response?.assetIds ?? [],
        declaredReferenceMimeType: detected.providerMimeType,
        provenance: {
          ...context.provenance,
          providerRequestId: response.requestId,
          limitations: [
            ...context.provenance.limitations,
            "Enrollment is accepted, not confirmed ACTIVE; use voice get or wait before synthesis.",
            "HeyGen retains inline audio as a workspace asset; absence of returned asset IDs prevents verifying source deletion. Voice deletion does not establish asset deletion.",
          ],
        },
      };
    } catch (error: unknown) {
      throw new MediaReceiptFailure(await receipts.fail(begun.receipt.id, error), error);
    }
  }
  throw new MediaHostFailure("unsupported", "This HeyGen operation is unsupported.");
}
