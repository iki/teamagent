import { Context, Effect, Layer, Schema } from "effect";
import {
  MediaError,
  MediaResultSchema,
  mediaLimits,
  type AudioFormat,
  type MediaBackend,
  type MediaPlan,
  type MediaResult,
  type MediaRequest,
} from "./contracts.ts";
import {
  planMedia,
  explainMediaSelection,
  validateMediaBackends,
  validateMediaRequest,
  type MediaSelectionExplanation,
} from "./selection.ts";

import {
  MediaVoiceResultSchema,
  validateMediaVoiceRequest,
  MediaDiagnosticRequestSchema,
  MediaDiagnosticResultSchema,
  type MediaVoiceRequest,
  type MediaVoiceResult,
  type MediaDiagnosticRequest,
  type MediaDiagnosticResult,
} from "./lifecycle.ts";
import {
  MediaRecoveryRequestSchema,
  PublicMediaReceiptSchema,
  type MediaRecoveryRequest,
  type PublicMediaReceipt,
} from "./recovery.ts";

export { cli } from "./cli.ts";
export * from "./contracts.ts";
export * from "./lifecycle.ts";
export * from "./subtitles.ts";
export * from "./training.ts";
export * from "./diagnostics.ts";
export * from "./recovery.ts";
export { mediaSetupGuides, mediaSetupHelp, getMediaSetup, type MediaSetupGuide } from "./setup.ts";
export {
  planMedia,
  explainMediaSelection,
  validateMediaBackends,
  validateMediaRequest,
  type MediaSelectionExplanation,
} from "./selection.ts";

export interface MediaPort {
  readonly listBackends: () => Effect.Effect<unknown, MediaError>;
  readonly execute: (plan: MediaPlan) => Effect.Effect<unknown, MediaError>;
  readonly prepare?: (request: MediaRequest) => Effect.Effect<unknown, MediaError>;
  readonly voice?: (request: MediaVoiceRequest) => Effect.Effect<unknown, MediaError>;
  readonly diagnose?: (request: MediaDiagnosticRequest) => Effect.Effect<unknown, MediaError>;
  readonly recovery?: (request: MediaRecoveryRequest) => Effect.Effect<unknown, MediaError>;
}
export interface MediaApi {
  readonly listBackends: () => Effect.Effect<readonly MediaBackend[], MediaError>;
  readonly plan: (input: unknown) => Effect.Effect<MediaPlan, MediaError>;
  readonly run: (input: unknown) => Effect.Effect<MediaResult, MediaError>;
  readonly explain: (input: unknown) => Effect.Effect<MediaSelectionExplanation, MediaError>;
  readonly voice: (input: unknown) => Effect.Effect<MediaVoiceResult, MediaError>;
  readonly diagnose: (input: unknown) => Effect.Effect<MediaDiagnosticResult, MediaError>;
  readonly recovery: (
    input: unknown,
  ) => Effect.Effect<readonly PublicMediaReceipt[] | MediaResult, MediaError>;
}
export class Media extends Context.Service<Media, MediaApi>()("teamagent/media/Media") {}

const formatMimes: Readonly<Record<AudioFormat, readonly string[]>> = {
  wav: ["audio/wav", "audio/x-wav", "audio/wave"],
  mp3: ["audio/mpeg", "audio/mp3"],
  flac: ["audio/flac", "audio/x-flac"],
  ogg: ["audio/ogg"],
  opus: ["audio/ogg", "audio/opus"],
  m4a: ["audio/mp4", "audio/x-m4a"],
  pcm: ["audio/pcm"],
};
export const validateMediaResult = Effect.fnUntraced(function* (input: unknown, plan: MediaPlan) {
  const result = yield* Schema.decodeUnknownEffect(MediaResultSchema)(input, {
    onExcessProperty: "error",
  }).pipe(
    Effect.mapError(
      () =>
        new MediaError({
          code: "integrity",
          message: "Media backend returned an invalid or oversized result.",
        }),
    ),
  );
  const authorizedTraining = plan.capability.trainingDecision;
  const claimedTraining = result.provenance.trainingDecision;
  if (
    claimedTraining !== undefined &&
    (authorizedTraining === undefined ||
      claimedTraining.effective !== authorizedTraining.effective ||
      claimedTraining.eligible !== authorizedTraining.eligible ||
      claimedTraining.usedTrainingOptIn !== authorizedTraining.usedTrainingOptIn ||
      claimedTraining.verification !== authorizedTraining.verification)
  )
    return yield* new MediaError({
      code: "integrity",
      message: "Media result training decision contradicts its authorized plan.",
    });
  const request = plan.request;
  if (
    result.operation !== request.operation ||
    result.backend !== plan.backend.id ||
    result.model !== plan.model
  )
    return yield* new MediaError({
      code: "integrity",
      message: "Media result does not match the selected operation, backend and model.",
    });
  if (
    ("input" in request && result.provenance.inputSha256 === null) ||
    ("reference" in request &&
      request.reference !== undefined &&
      result.provenance.referenceSha256 === null)
  )
    return yield* new MediaError({
      code: "integrity",
      message: "Media result is missing required source-hash provenance.",
    });
  if (
    "voiceAuthorization" in request &&
    request.voiceAuthorization !== undefined &&
    result.provenance.voiceAuthorization !== request.voiceAuthorization
  )
    return yield* new MediaError({
      code: "integrity",
      message: "Media result did not preserve supplied voice-authorization provenance.",
    });
  if ("artifact" in result) {
    const pcm = result.artifact.pcm;
    if (result.artifact.mimeType === "audio/pcm" ? pcm === undefined : pcm !== undefined)
      return yield* new MediaError({
        code: "integrity",
        message:
          "Raw PCM requires explicit interpretation metadata; other formats must not carry it.",
      });
    if (
      pcm !== undefined &&
      (result.artifact.sizeBytes % (2 * pcm.channels) !== 0 ||
        (request.operation === "convert" &&
          ((request.sampleRate !== undefined && request.sampleRate !== pcm.sampleRate) ||
            (request.channels !== undefined && request.channels !== pcm.channels))))
    )
      return yield* new MediaError({
        code: "integrity",
        message: "PCM frames or interpretation metadata do not match the request.",
      });
    const requestedFormat =
      request.operation === "record" ? "wav" : "format" in request ? request.format : undefined;
    const formats = requestedFormat === undefined ? plan.capability.formats : [requestedFormat];
    if (!formats.some((format) => formatMimes[format].includes(result.artifact.mimeType)))
      return yield* new MediaError({
        code: "integrity",
        message: "Media artifact type does not match the selected audio format.",
      });
  }
  if (result.operation === "transcribe" && request.operation === "transcribe") {
    const requestedTimestamps = request.timestamps ?? "none";
    if (
      (requestedTimestamps !== "none" && result.timestamps !== requestedTimestamps) ||
      (request.diarization && !result.diarization) ||
      (result.timestamps !== "none" && !plan.capability.timestamps.includes(result.timestamps)) ||
      (result.diarization && !plan.capability.diarization)
    )
      return yield* new MediaError({
        code: "integrity",
        message:
          "Transcription result does not satisfy its declared timing and speaker capabilities.",
      });
    let lastStart = 0;
    let characters = 0;
    for (const segment of result.segments) {
      characters += segment.text.length;
      if (
        segment.startSeconds < lastStart ||
        segment.endSeconds < segment.startSeconds ||
        characters > mediaLimits.transcriptCharacters
      )
        return yield* new MediaError({
          code: "integrity",
          message: "Transcription segment ordering, timing or total size is invalid.",
        });
      lastStart = segment.startSeconds;
    }
    if (
      (result.timestamps === "none" && result.segments.length !== 0) ||
      (result.text.trim().length > 0 &&
        result.timestamps !== "none" &&
        result.segments.length === 0) ||
      (result.text.trim().length > 0 &&
        result.diarization &&
        !result.segments.some((segment) => segment.speaker !== null))
    )
      return yield* new MediaError({
        code: "integrity",
        message: "Transcription is missing its promised timing or speaker evidence.",
      });
  }
  if (result.operation === "synthesize" && result.alignment !== undefined) {
    let totalCharacters = 0;
    for (const items of [result.alignment.characters, result.alignment.words]) {
      let previousStart = 0;
      for (const item of items) {
        totalCharacters += item.text.length;
        if (
          item.startSeconds < previousStart ||
          item.endSeconds < item.startSeconds ||
          totalCharacters > mediaLimits.transcriptCharacters ||
          (result.providerDurationSeconds !== undefined &&
            item.endSeconds > result.providerDurationSeconds + 0.1)
        )
          return yield* new MediaError({
            code: "integrity",
            message: "Speech alignment ordering, duration or total size is invalid.",
          });
        previousStart = item.startSeconds;
      }
    }
  }
  return authorizedTraining === undefined || claimedTraining !== undefined
    ? result
    : { ...result, provenance: { ...result.provenance, trainingDecision: authorizedTraining } };
});

/** Compose portable validation and policy with host-owned effects; no work runs during construction. */
export function makeMedia(port: MediaPort): MediaApi {
  const listBackends = Effect.fnUntraced(function* () {
    return yield* validateMediaBackends(yield* port.listBackends());
  });
  const plan = Effect.fnUntraced(function* (input: unknown) {
    const request = yield* validateMediaRequest(input);
    return yield* planMedia(request, yield* listBackends());
  });
  const run = Effect.fnUntraced(function* (input: unknown) {
    const request = yield* validateMediaRequest(input);
    const selected = yield* planMedia(
      request,
      port.prepare === undefined ? yield* listBackends() : yield* port.prepare(request),
    );
    return yield* validateMediaResult(yield* port.execute(selected), selected);
  });
  const explain = Effect.fnUntraced(function* (input: unknown) {
    return yield* explainMediaSelection(input, yield* listBackends());
  });
  const voice = Effect.fnUntraced(function* (input: unknown) {
    const request = yield* validateMediaVoiceRequest(input);
    if (port.voice === undefined)
      return yield* new MediaError({
        code: "unsupported",
        message: "Voice lifecycle is unavailable on this host.",
      });
    const result = yield* Schema.decodeUnknownEffect(MediaVoiceResultSchema)(
      yield* port.voice(request),
      { onExcessProperty: "error" },
    ).pipe(
      Effect.mapError(
        () => new MediaError({ code: "integrity", message: "Invalid voice lifecycle response." }),
      ),
    );
    if (
      result.backend !== request.backend ||
      result.action !== request.action ||
      (request.voiceId !== undefined && result.voices.some((item) => item.id !== request.voiceId))
    )
      return yield* new MediaError({
        code: "integrity",
        message: "Voice lifecycle result identity mismatch.",
      });
    return result;
  });
  const diagnose = Effect.fnUntraced(function* (input: unknown) {
    const request = yield* Schema.decodeUnknownEffect(MediaDiagnosticRequestSchema)(input, {
      onExcessProperty: "error",
    }).pipe(
      Effect.mapError(
        () =>
          new MediaError({ code: "invalid", message: "Invalid authenticated diagnostic request." }),
      ),
    );
    if (port.diagnose === undefined)
      return yield* new MediaError({
        code: "unsupported",
        message: "Authenticated diagnostics are unavailable on this host.",
      });
    const result = yield* Schema.decodeUnknownEffect(MediaDiagnosticResultSchema)(
      yield* port.diagnose(request),
      { onExcessProperty: "error" },
    ).pipe(
      Effect.mapError(
        () =>
          new MediaError({
            code: "integrity",
            message: "Invalid authenticated diagnostic result.",
          }),
      ),
    );
    if (result.backend !== request.backend)
      return yield* new MediaError({ code: "integrity", message: "Diagnostic backend mismatch." });
    return result;
  });
  const recovery = Effect.fnUntraced(function* (input: unknown) {
    const request = yield* Schema.decodeUnknownEffect(MediaRecoveryRequestSchema)(input, {
      onExcessProperty: "error",
    }).pipe(
      Effect.mapError(
        () => new MediaError({ code: "invalid", message: "Invalid media recovery request." }),
      ),
    );
    if (
      (request.action === "list"
        ? request.receiptId !== undefined
        : request.receiptId === undefined) ||
      (request.action !== "resume" && request.output !== undefined)
    )
      return yield* new MediaError({
        code: "invalid",
        message: "Recovery options do not match the action.",
      });
    if (port.recovery === undefined)
      return yield* new MediaError({
        code: "unsupported",
        message: "Recovery storage is unavailable on this host.",
      });
    const response = yield* port.recovery(request);
    if (request.action === "resume") {
      const result = yield* Schema.decodeUnknownEffect(MediaResultSchema)(response, {
        onExcessProperty: "error",
      }).pipe(
        Effect.mapError(
          () => new MediaError({ code: "integrity", message: "Invalid resumed media result." }),
        ),
      );
      if (
        result.receiptId !== request.receiptId ||
        (result.operation !== "clone" && result.operation !== "synthesize")
      )
        return yield* new MediaError({
          code: "integrity",
          message: "Resumed media receipt identity mismatch.",
        });
      return result;
    }
    const receipts = yield* Schema.decodeUnknownEffect(
      Schema.Array(PublicMediaReceiptSchema).check(Schema.isMaxLength(256)),
    )(response, { onExcessProperty: "error" }).pipe(
      Effect.mapError(
        () => new MediaError({ code: "integrity", message: "Invalid media recovery listing." }),
      ),
    );
    if (
      request.action === "get" &&
      (receipts.length !== 1 || receipts[0]?.id !== request.receiptId)
    )
      return yield* new MediaError({
        code: "integrity",
        message: "Recovery listing receipt identity mismatch.",
      });
    return receipts;
  });
  return Media.of({ listBackends, plan, run, explain, voice, diagnose, recovery });
}
export function mediaLayer(port: MediaPort): Layer.Layer<Media> {
  return Layer.succeed(Media, makeMedia(port));
}
