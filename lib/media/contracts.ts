import { Schema } from "effect";
import { TrainingPolicySchema, TrainingDecisionSchema } from "./training.ts";
import { MediaHttpDiagnosticSchema } from "./diagnostics.ts";

export const mediaLimits = {
  backends: 32,
  capabilities: 64,
  inputBytes: 268_435_456,
  outputBytes: 268_435_456,
  textCharacters: 100_000,
  transcriptCharacters: 2_000_000,
  segments: 20_000,
  segmentCharacters: 16_000,
  durationSeconds: 86_400,
} as const;

export const MediaOperationSchema = Schema.Literals([
  "inspect",
  "convert",
  "transcribe",
  "synthesize",
  "clone",
  "record",
]);
export type MediaOperation = typeof MediaOperationSchema.Type;
export const AudioFormatSchema = Schema.Literals([
  "wav",
  "mp3",
  "flac",
  "ogg",
  "opus",
  "m4a",
  "pcm",
]);
export type AudioFormat = typeof AudioFormatSchema.Type;
export const MediaPreferenceSchema = Schema.Literals(["balanced", "quality", "latency", "cost"]);
export type MediaPreference = typeof MediaPreferenceSchema.Type;
export const MediaLocalitySchema = Schema.Literals(["local", "remote"]);
export const MediaBackendIdSchema = Schema.String.check(Schema.isPattern(/^[a-z][a-z0-9-]{0,63}$/));
export const MediaModelSchema = Schema.String.check(
  Schema.isPattern(/^[a-zA-Z0-9][a-zA-Z0-9._:/-]{0,255}$/),
);
export const MediaPathSchema = Schema.String.check(
  Schema.isMinLength(1),
  Schema.isMaxLength(4096),
  Schema.isPattern(/\S/),
  Schema.isPattern(/^(?![a-zA-Z][a-zA-Z0-9+.-]*:\/\/)[^\p{Cc}]+$/u),
);
const IdentifierSchema = Schema.String.check(
  Schema.isMinLength(1),
  Schema.isMaxLength(256),
  Schema.isPattern(/^[^\p{Cc}]+$/u),
);
const NoteSchema = Schema.String.check(Schema.isMaxLength(1000));
const LimitationsSchema = Schema.Array(NoteSchema).check(Schema.isMaxLength(32));
const TextSchema = Schema.String.check(
  Schema.isMinLength(1),
  Schema.isMaxLength(mediaLimits.textCharacters),
  Schema.isPattern(/\S/),
  Schema.makeFilter((value: string) =>
    value.includes("\u0000") ? "Text cannot contain NUL characters." : undefined,
  ),
);
const LanguageSchema = Schema.String.check(
  Schema.isMaxLength(64),
  Schema.isPattern(/^[a-zA-Z]{2,3}(?:-[a-zA-Z0-9]{2,8})*$/),
);
const SecondsSchema = Schema.Number.check(
  Schema.isFinite(),
  Schema.isGreaterThanOrEqualTo(0),
  Schema.isLessThanOrEqualTo(mediaLimits.durationSeconds),
);
const PositiveSecondsSchema = SecondsSchema.check(Schema.isGreaterThan(0));
const TimestampSchema = Schema.Literals(["none", "segment", "word"]);
const VoiceAuthorizationSchema = Schema.String.check(
  Schema.isMinLength(1),
  Schema.isMaxLength(512),
);
const selection = {
  backend: Schema.optional(MediaBackendIdSchema),
  model: Schema.optional(MediaModelSchema),
  locality: Schema.optional(Schema.Literals(["any", "local", "remote"])),
  preference: Schema.optional(MediaPreferenceSchema),
  allowTraining: Schema.optional(Schema.Boolean),
};

export const InspectMediaRequestSchema = Schema.Struct({
  operation: Schema.Literal("inspect"),
  input: MediaPathSchema,
  ...selection,
});
export const ConvertMediaRequestSchema = Schema.Struct({
  operation: Schema.Literal("convert"),
  input: MediaPathSchema,
  format: AudioFormatSchema,
  output: Schema.optional(MediaPathSchema),
  sampleRate: Schema.optional(
    Schema.Int.check(Schema.isGreaterThanOrEqualTo(8000), Schema.isLessThanOrEqualTo(192000)),
  ),
  channels: Schema.optional(
    Schema.Int.check(Schema.isGreaterThanOrEqualTo(1), Schema.isLessThanOrEqualTo(8)),
  ),
  startSeconds: Schema.optional(SecondsSchema),
  durationSeconds: Schema.optional(PositiveSecondsSchema),
  ...selection,
});
export const TranscribeMediaRequestSchema = Schema.Struct({
  operation: Schema.Literal("transcribe"),
  input: MediaPathSchema,
  language: Schema.optional(LanguageSchema),
  timestamps: Schema.optional(TimestampSchema),
  diarization: Schema.optional(Schema.Boolean),
  ...selection,
});
export const SynthesizeMediaRequestSchema = Schema.Struct({
  operation: Schema.Literal("synthesize"),
  text: TextSchema,
  language: Schema.optional(LanguageSchema),
  expressivenessBoost: Schema.optional(
    Schema.Number.check(Schema.isFinite(), Schema.isBetween({ minimum: 0, maximum: 1 })),
  ),
  withTimestamps: Schema.optional(Schema.Boolean),
  voice: Schema.optional(IdentifierSchema),
  reference: Schema.optional(MediaPathSchema),
  referenceText: Schema.optional(TextSchema),
  voiceAuthorization: Schema.optional(VoiceAuthorizationSchema),
  format: Schema.optional(AudioFormatSchema),
  output: Schema.optional(MediaPathSchema),
  ...selection,
});
export const CloneMediaRequestSchema = Schema.Struct({
  operation: Schema.Literal("clone"),
  reference: MediaPathSchema,
  name: Schema.String.check(Schema.isMinLength(1), Schema.isMaxLength(128), Schema.isPattern(/\S/)),
  language: Schema.optional(LanguageSchema),
  similarity: Schema.optional(Schema.Literals(["medium", "high", "extra_high", "max"])),
  idempotencyKey: Schema.optional(
    Schema.String.check(Schema.isPattern(/^[a-zA-Z0-9][a-zA-Z0-9._-]{7,127}$/)),
  ),
  voiceAuthorization: Schema.optional(VoiceAuthorizationSchema),
  ...selection,
});
export const RecordMediaRequestSchema = Schema.Struct({
  operation: Schema.Literal("record"),
  device: IdentifierSchema,
  inputFormat: Schema.Literals(["dshow", "avfoundation", "alsa", "pulse"]),
  durationSeconds: Schema.Int.check(
    Schema.isGreaterThanOrEqualTo(1),
    Schema.isLessThanOrEqualTo(300),
  ),
  output: Schema.optional(MediaPathSchema),
  ...selection,
});
export const MediaRequestSchema = Schema.Union([
  InspectMediaRequestSchema,
  ConvertMediaRequestSchema,
  TranscribeMediaRequestSchema,
  SynthesizeMediaRequestSchema,
  CloneMediaRequestSchema,
  RecordMediaRequestSchema,
]);
export type MediaRequest = typeof MediaRequestSchema.Type;

const PrioritySchema = Schema.Int.check(
  Schema.isGreaterThanOrEqualTo(0),
  Schema.isLessThanOrEqualTo(100),
);
export const MediaPolicyPrioritiesSchema = Schema.Struct({
  balanced: PrioritySchema,
  quality: PrioritySchema,
  latency: PrioritySchema,
  cost: PrioritySchema,
});
export const MediaCapabilitySchema = Schema.Struct({
  operation: MediaOperationSchema,
  model: Schema.NullOr(MediaModelSchema),
  default: Schema.Boolean,
  formats: Schema.Array(AudioFormatSchema).check(Schema.isMaxLength(7)),
  timestamps: Schema.Array(Schema.Literals(["segment", "word"])).check(Schema.isMaxLength(2)),
  diarization: Schema.Boolean,
  referenceVoice: Schema.Boolean,
  referenceRequired: Schema.optional(Schema.Boolean),
  referenceTextRequired: Schema.optional(Schema.Boolean),
  referenceTextSupported: Schema.optional(Schema.Boolean),
  requiresVoiceOrReference: Schema.optional(Schema.Boolean),
  requiresVoice: Schema.optional(Schema.Boolean),
  policy: MediaPolicyPrioritiesSchema,
  training: Schema.optional(TrainingPolicySchema),
  trainingDecision: Schema.optional(TrainingDecisionSchema),
  limitations: LimitationsSchema,
});
export type MediaCapability = typeof MediaCapabilitySchema.Type;
export const MediaBackendSchema = Schema.Struct({
  id: MediaBackendIdSchema,
  label: IdentifierSchema,
  locality: MediaLocalitySchema,
  available: Schema.Boolean,
  unavailableReason: Schema.NullOr(NoteSchema),
  capabilities: Schema.Array(MediaCapabilitySchema).check(
    Schema.isMinLength(1),
    Schema.isMaxLength(mediaLimits.capabilities),
  ),
  limitations: LimitationsSchema,
});
export type MediaBackend = typeof MediaBackendSchema.Type;
export const MediaBackendCatalogSchema = Schema.Array(MediaBackendSchema).check(
  Schema.isMaxLength(mediaLimits.backends),
);

export const MediaCandidateSchema = Schema.Struct({
  backendId: MediaBackendIdSchema,
  model: Schema.NullOr(MediaModelSchema),
  eligible: Schema.Boolean,
  policyPriority: Schema.NullOr(PrioritySchema),
  reasons: Schema.Array(NoteSchema).check(Schema.isMaxLength(16)),
  trainingDecision: Schema.optional(TrainingDecisionSchema),
});
export type MediaCandidate = typeof MediaCandidateSchema.Type;
export const MediaPlanSchema = Schema.Struct({
  request: MediaRequestSchema,
  backend: MediaBackendSchema,
  capability: MediaCapabilitySchema,
  model: Schema.NullOr(MediaModelSchema),
  policy: Schema.Struct({
    version: Schema.Literal("media-selection/1"),
    kind: Schema.Literal("configured-policy-not-benchmark"),
    preference: MediaPreferenceSchema,
  }),
  candidates: Schema.Array(MediaCandidateSchema).check(
    Schema.isMaxLength(mediaLimits.backends * mediaLimits.capabilities),
  ),
  limitations: Schema.Array(NoteSchema).check(Schema.isMaxLength(65)),
});
export type MediaPlan = typeof MediaPlanSchema.Type;

const Sha256Schema = Schema.String.check(Schema.isPattern(/^[a-f0-9]{64}$/));
export const PcmAudioSchema = Schema.Struct({
  encoding: Schema.Literal("pcm_s16le"),
  sampleRate: Schema.Int.check(
    Schema.isGreaterThanOrEqualTo(8000),
    Schema.isLessThanOrEqualTo(192000),
  ),
  channels: Schema.Int.check(Schema.isGreaterThanOrEqualTo(1), Schema.isLessThanOrEqualTo(8)),
});
export type PcmAudio = typeof PcmAudioSchema.Type;
export const MediaArtifactSchema = Schema.Struct({
  pcm: Schema.optional(PcmAudioSchema),
  path: MediaPathSchema,
  mimeType: Schema.String.check(
    Schema.isMaxLength(128),
    Schema.isPattern(/^audio\/[a-zA-Z0-9.+-]+$/),
  ),
  sha256: Sha256Schema,
  sizeBytes: Schema.Int.check(
    Schema.isGreaterThan(0),
    Schema.isLessThanOrEqualTo(mediaLimits.outputBytes),
  ),
});
export type MediaArtifact = typeof MediaArtifactSchema.Type;
export const MediaProvenanceSchema = Schema.Struct({
  trainingDecision: Schema.optional(TrainingDecisionSchema),
  inputSha256: Schema.NullOr(Sha256Schema),
  referenceSha256: Schema.NullOr(Sha256Schema),
  toolVersion: Schema.NullOr(IdentifierSchema),
  providerRequestId: Schema.NullOr(IdentifierSchema),
  elapsedMs: Schema.Number.check(
    Schema.isFinite(),
    Schema.isGreaterThanOrEqualTo(0),
    Schema.isLessThanOrEqualTo(86_400_000),
  ),
  limitations: LimitationsSchema,
  voiceAuthorization: Schema.optional(VoiceAuthorizationSchema),
});
export type MediaProvenance = typeof MediaProvenanceSchema.Type;
const resultIdentity = {
  backend: MediaBackendIdSchema,
  model: Schema.NullOr(MediaModelSchema),
  provenance: MediaProvenanceSchema,
  receiptId: Schema.optional(IdentifierSchema),
};
export const MediaStreamSchema = Schema.Struct({
  kind: Schema.Literals(["audio", "video", "other"]),
  codec: Schema.NullOr(IdentifierSchema),
  sampleRate: Schema.NullOr(
    Schema.Int.check(Schema.isGreaterThan(0), Schema.isLessThanOrEqualTo(768000)),
  ),
  channels: Schema.NullOr(
    Schema.Int.check(Schema.isGreaterThan(0), Schema.isLessThanOrEqualTo(64)),
  ),
});
export const InspectMediaResultSchema = Schema.Struct({
  operation: Schema.Literal("inspect"),
  ...resultIdentity,
  media: Schema.Struct({
    format: IdentifierSchema,
    durationSeconds: Schema.NullOr(SecondsSchema),
    sizeBytes: Schema.Int.check(
      Schema.isGreaterThanOrEqualTo(0),
      Schema.isLessThanOrEqualTo(mediaLimits.inputBytes),
    ),
    streams: Schema.Array(MediaStreamSchema).check(Schema.isMaxLength(64)),
  }),
});
export const MediaSegmentSchema = Schema.Struct({
  startSeconds: SecondsSchema,
  endSeconds: SecondsSchema,
  text: Schema.String.check(Schema.isMaxLength(mediaLimits.segmentCharacters)),
  speaker: Schema.NullOr(IdentifierSchema),
});
export type MediaSegment = typeof MediaSegmentSchema.Type;
export const TranscribeMediaResultSchema = Schema.Struct({
  operation: Schema.Literal("transcribe"),
  ...resultIdentity,
  text: Schema.String.check(Schema.isMaxLength(mediaLimits.transcriptCharacters)),
  language: Schema.NullOr(LanguageSchema),
  timestamps: TimestampSchema,
  diarization: Schema.Boolean,
  segments: Schema.Array(MediaSegmentSchema).check(Schema.isMaxLength(mediaLimits.segments)),
});
export const ConvertMediaResultSchema = Schema.Struct({
  operation: Schema.Literal("convert"),
  ...resultIdentity,
  artifact: MediaArtifactSchema,
});
export const MeasuredAudioSchema = Schema.Struct({
  durationSeconds: PositiveSecondsSchema,
  sampleRate: Schema.Int.check(Schema.isBetween({ minimum: 8000, maximum: 768000 })),
  channels: Schema.Int.check(Schema.isBetween({ minimum: 1, maximum: 64 })),
});
const SpeechTiming = Schema.Struct({
  text: Schema.String.check(Schema.isMaxLength(16000)),
  startSeconds: SecondsSchema,
  endSeconds: SecondsSchema,
});
export const SynthesizeMediaResultSchema = Schema.Struct({
  operation: Schema.Literal("synthesize"),
  ...resultIdentity,
  artifact: MediaArtifactSchema,
  audio: Schema.optional(MeasuredAudioSchema),
  providerDurationSeconds: Schema.optional(PositiveSecondsSchema),
  alignment: Schema.optional(
    Schema.Struct({
      characters: Schema.Array(SpeechTiming).check(Schema.isMaxLength(100000)),
      words: Schema.Array(SpeechTiming).check(Schema.isMaxLength(20000)),
    }),
  ),
});
export const CloneMediaResultSchema = Schema.Struct({
  operation: Schema.Literal("clone"),
  ...resultIdentity,
  voiceId: IdentifierSchema,
  requiresVerification: Schema.NullOr(Schema.Boolean),
  referenceAssetIds: Schema.optional(Schema.Array(IdentifierSchema).check(Schema.isMaxLength(100))),
  providerStatus: Schema.optional(IdentifierSchema),
  declaredReferenceMimeType: Schema.optional(Schema.Literals(["audio/x-wav", "audio/mpeg"])),
  readiness: Schema.optional(Schema.Literals(["ready", "pending"])),
});
export const RecordMediaResultSchema = Schema.Struct({
  operation: Schema.Literal("record"),
  ...resultIdentity,
  artifact: MediaArtifactSchema,
});
export const MediaResultSchema = Schema.Union([
  InspectMediaResultSchema,
  ConvertMediaResultSchema,
  TranscribeMediaResultSchema,
  SynthesizeMediaResultSchema,
  CloneMediaResultSchema,
  RecordMediaResultSchema,
]);
export type MediaResult = typeof MediaResultSchema.Type;

export class MediaError extends Schema.TaggedError<MediaError>()("MediaError", {
  code: Schema.Literals([
    "invalid",
    "unavailable",
    "unsupported",
    "io",
    "network",
    "limit",
    "cancelled",
    "integrity",
    "conflict",
    "policy",
    "rejected",
    "uncertain",
    "recovery",
  ]),
  message: Schema.String.check(Schema.isMaxLength(1000)),
  receiptId: Schema.optional(IdentifierSchema),
  outcome: Schema.optional(
    Schema.Literals([
      "submitting",
      "accepted",
      "pending",
      "rejected",
      "uncertain",
      "generated-awaiting-download",
      "published",
    ]),
  ),
  diagnostic: Schema.optional(Schema.NullOr(MediaHttpDiagnosticSchema)),
}) {}
