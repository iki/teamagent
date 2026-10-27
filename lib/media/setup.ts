import { Effect, Schema } from "effect";
import { MediaError } from "./contracts.ts";

export interface MediaSetupGuide {
  readonly backend: "heygen" | "fish" | "omnivoice";
  readonly description: string;
  readonly urls: readonly string[];
  readonly steps: readonly string[];
  readonly configuration: Readonly<Record<string, unknown>>;
  readonly examples: readonly string[];
  readonly limitations: readonly string[];
  readonly trainingReview: {
    readonly reviewedAt: string;
    readonly expiresAt: string;
    readonly state: "conditional" | "excluded";
    readonly defaultState: "permitted" | "excluded";
    readonly operationConditions: readonly {
      readonly operation: "synthesize" | "clone";
      readonly conditions: readonly string[];
    }[];
    readonly sources: readonly string[];
    readonly evidence: string;
  };
  readonly pricingReview: {
    readonly reviewedAt: string;
    readonly summary: string;
    readonly sources: readonly string[];
    readonly entitlement: "not-verified" | "local-provisioning";
    readonly licensing: string;
  };
}

/** Reviewed setup metadata; informational only, with no installation or credential discovery. */
export const mediaSetupGuides: readonly MediaSetupGuide[] = [
  {
    backend: "heygen",
    trainingReview: {
      reviewedAt: "2026-10-25",
      expiresAt: "2026-11-24",
      state: "conditional",
      defaultState: "permitted",
      operationConditions: [
        { operation: "synthesize", conditions: ["enterprise-exclusion", "confirmed-opt-out"] },
        { operation: "clone", conditions: ["enterprise-exclusion", "confirmed-opt-out"] },
      ],
      sources: ["https://www.heygen.com/privacy", "https://www.heygen.com/security"],
      evidence:
        "Privacy policy updated 2026-10-15. Non-enterprise improvement is permitted by default. Exclusion requires current scoped documentary evidence and authenticated account binding; no actual account exclusion was verified. Free-model access is not a training exclusion.",
    },
    pricingReview: {
      reviewedAt: "2026-10-25",
      entitlement: "not-verified",
      summary:
        "Official pages conflict: Voice marketing quotes USD30 per million characters; the 2026-10-21 Turbo announcement quotes standard USD15 and Turbo USD4 per million. Turbo Free is advertised through 2026-11-30, best effort with capacity limits. Confirm account/route billing; no implicit paid fallback.",
      sources: [
        "https://www.heygen.com/models/heygen-voice-1",
        "https://www.heygen.com/blog/heygen-voice-turbo",
      ],
      licensing:
        "Free promotional access is not proof of commercial rights, account entitlement, training exclusion or speaker authorization. Hosted service terms govern the selected account and operation.",
    },
    description: "Hosted WAV synthesis and instant voice enrollment through HeyGen's direct API.",
    urls: [
      "https://developers.heygen.com/docs/models/heygen-voice",
      "https://app.heygen.com/",
      "https://docs.heygen.com/",
    ],
    steps: [
      "Create a HeyGen API account/key using the official developer guide; inject HEYGEN_API_KEY with a command-scoped secret manager such as fnox exec.",
      "Save the configuration example to media.json. The API key value stays outside the file; only its environment variable name is configured. Add recovery.keyEnv naming a separate base64-encoded 32-byte encryption key; keep that key in the secret manager, never beside receipts.",
      "Choose a public voice ID, or enroll an MP3/WAV reference with media clone. An accepted clone can be pending; use media voice-get or explicit bounded media voice-wait to verify ACTIVE readiness before using its ID.",
      "Set voiceId in configuration or pass --voice. Standard heygen-voice-1 supports professional voices; Turbo models support public and instant voices only.",
      "Run media diagnose --backend heygen --config media.json for authenticated metadata, then review selection/policy before synthesis. Authentication does not prove model access or training exclusion.",
    ],
    configuration: {
      heygen: { apiKeyEnv: "HEYGEN_API_KEY", speechModel: "heygen-voice-1" },
      recovery: { directory: ".cache/media-recovery", keyEnv: "MEDIA_RECOVERY_KEY" },
    },
    examples: [
      'media clone reference.wav --backend heygen --config media.json --name "My voice" --idempotency-key enrollment-01',
      "media voice-wait VOICE_ID --backend heygen --config media.json",
      "media receipt RECEIPT_ID --config media.json",
      "media resume RECEIPT_ID --config media.json --output candidate-02.wav",
      'media synthesize "Hello" --backend heygen --config media.json --voice VOICE_ID --output hello.wav',
      'media synthesize "Hello" --backend heygen --model heygen-voice-1-turbo --config media.json --voice VOICE_ID --output turbo.wav',
    ],
    limitations: [
      "Target text is limited to 5000 characters per call. Only WAV output and completed file responses are implemented, not streaming.",
      "Inline enrollment supports MP3/WAV up to 16 MB; the provider retains the uploaded reference as an asset. Synthesis never enrolls a voice implicitly.",
      "No implicit polling, retries or free-model substitution. voice-wait is explicit and bounded; account permissions and promotional pricing are not guaranteed by configuration.",
      "Encrypted receipts preserve accepted enrollment and completed generation before download. Resume does not synthesize again; expired URLs and uncertain submissions require reconciliation.",
      "Training policy is checked before content upload. Unknown/stale policy blocks; known training-permitted routes require explicit --allow-training. User assertions are not verified account exclusion evidence.",
    ],
  },
  {
    backend: "fish",
    trainingReview: {
      reviewedAt: "2026-10-25",
      expiresAt: "2026-11-24",
      state: "conditional",
      defaultState: "permitted",
      operationConditions: [
        { operation: "synthesize", conditions: ["zdr-covered", "operation-specific-contract"] },
        { operation: "clone", conditions: ["operation-specific-contract"] },
      ],
      sources: ["https://fish.audio/terms/", "https://fish.audio/enterprise-terms/"],
      evidence:
        "Customer Agreement updated 2026-08-10; paid signup/renewal can trigger its terms. Standard improvement is permitted. Eligible ZDR excludes covered processing, but retained enrollment needs operation-specific evidence. Account identity/exclusion has not been verified; the Fish identity adapter is not implemented.",
    },
    pricingReview: {
      reviewedAt: "2026-10-25",
      entitlement: "not-verified",
      summary:
        "Hosted TTS bills UTF-8 bytes: S2.1-Pro USD15/M; S2.1-Pro-Free USD0/M. Drama3 list USD50/M, promotional USD10/M until 2026-11-12 17:00 UTC. These are dated public quotes, not account access or a measured total cost.",
      sources: ["https://docs.fish.audio/developer-guide/models-pricing/pricing-and-rate-limits"],
      licensing:
        "Hosted account terms and local code/model licenses are separate. A free hosted rate or private enrollment does not establish general commercial use or training exclusion.",
    },
    description:
      "Hosted Fish Audio synthesis using a voice ID or a binary audio reference, plus private voice enrollment.",
    urls: [
      "https://docs.fish.audio/api-reference/endpoint/openapi-v1/text-to-speech",
      "https://fish.audio/",
      "https://docs.fish.audio/",
    ],
    steps: [
      "Create a Fish Audio API key in the official account dashboard and set FISH_API_KEY in the invoking shell or secret manager.",
      "Save the configuration example to media.json. Supply a voice ID via voiceId or --voice, or use --reference together with --reference-text.",
      "Default speech model is s2.1-pro. Explicit model overrides accept s1, s2-pro, s2.1-pro, s2.1-pro-free and drama-3; unknown IDs fail locally.",
      "Use media clone to create a private reusable voice. A created/training response returns pending; verify readiness in the provider account before synthesis.",
      "Run media backends --config media.json, then synthesize with the desired format. Reference synthesis uses MessagePack binary audio, not JSON base64.",
    ],
    configuration: { fish: { apiKeyEnv: "FISH_API_KEY", speechModel: "s2.1-pro" } },
    examples: [
      'media synthesize "Hello" --backend fish --config media.json --voice VOICE_ID --format wav --output hello.wav',
      'media synthesize "Hello" --backend fish --config media.json --reference reference.wav --reference-text "Exact recorded words" --output hello.mp3',
      'media clone reference.wav --backend fish --config media.json --name "My voice"',
    ],
    limitations: [
      "WAV, MP3 and Opus are supported. Raw PCM is not exposed because the hosted API does not specify byte order; use WAV when sample interpretation matters.",
      "Target/reference text is bounded to 4096 characters each, and references to 10 MiB. Hosted billing counts UTF-8 bytes, not characters.",
      "The adapter requests private enrollment; account rights, training readiness and reference retention follow provider terms. Hosted service rights do not determine open-model licenses.",
    ],
  },
  {
    backend: "omnivoice",
    trainingReview: {
      reviewedAt: "2026-10-25",
      expiresAt: "2026-11-24",
      state: "excluded",
      defaultState: "excluded",
      operationConditions: [{ operation: "synthesize", conditions: [] }],
      sources: [
        "https://github.com/k2-fsa/OmniVoice/tree/08be0b4ccbac3e13e374e86fbfead4b4cac343e2",
      ],
      evidence:
        "The provisioned local adapter has no provider-training upload route. This is source-reviewed route behavior, not live inference, an operating-system sandbox or attestation of arbitrary installed native code.",
    },
    pricingReview: {
      reviewedAt: "2026-10-25",
      entitlement: "local-provisioning",
      summary:
        "No hosted API fee is charged by this local adapter. Provisioning, compute, electricity and operator time are unmeasured; no total-cost or hardware-performance estimate was established.",
      sources: [
        "https://huggingface.co/k2-fsa/OmniVoice/blob/c5fdb5ccb189668d56333f77ba2629f4cd7535f4/README.md",
        "https://huggingface.co/k2-fsa/OmniVoice/blob/c5fdb5ccb189668d56333f77ba2629f4cd7535f4/audio_tokenizer/LICENSE",
      ],
      licensing:
        "Apache-2.0 code, CC-BY-NC pretrained weights and the separate Boson Higgs Audio 2 Community License for the codec must be assessed independently. Download availability does not grant commercial rights to the combined model bundle.",
    },
    description:
      "Offline k2-fsa/OmniVoice reference synthesis using an explicitly installed Python environment and complete local model files.",
    urls: [
      "https://github.com/k2-fsa/OmniVoice",
      "https://huggingface.co/k2-fsa/OmniVoice",
      "https://huggingface.co/k2-fsa/OmniVoice/tree/c5fdb5ccb189668d56333f77ba2629f4cd7535f4/audio_tokenizer",
      "https://ffmpeg.org/download.html",
    ],
    steps: [
      "Review code, model and nested codec licenses. The reviewed code is Apache-2.0; the reviewed pretrained model card uses CC-BY-NC, so do not infer commercial model rights from the code license.",
      "Install Python >=3.10 and OmniVoice's dependencies in a dedicated environment following the upstream README. The reviewed source API is 0.2.1, commit 08be0b4ccbac3e13e374e86fbfead4b4cac343e2; configure packageRoot as the directory containing omnivoice/.",
      "Before offline use, download/materialize the complete unsharded model snapshot and the nested audio_tokenizer/ codec. Git LFS pointers or Hugging Face cache symlinks alone are insufficient; use ordinary local files.",
      "Required root files: config.json, model.safetensors, tokenizer.json, tokenizer_config.json, chat_template.jinja. Required audio_tokenizer/ files: config.json, model.safetensors, preprocessor_config.json.",
      "Install FFmpeg/FFprobe and configure their real executables. Set pythonExecutable to the environment's real Python executable, weightsDirectory to the complete snapshot, and device to cpu, cuda, mps or xpu as supported by your installed PyTorch build.",
      "Use a reference of at most 30 seconds and its exact transcript; automatic ASR is disabled. Run media backends --config media.json before synthesis. No dependency or model downloads occur during discovery or execution.",
    ],
    configuration: {
      ffmpeg: { executable: "ffmpeg", probeExecutable: "ffprobe" },
      omnivoice: {
        pythonExecutable: "./venv/Scripts/python.exe",
        packageRoot: "./vendor/OmniVoice",
        weightsDirectory: "./models/OmniVoice",
        device: "cpu",
      },
    },
    examples: [
      'media synthesize "Hello" --backend omnivoice --config media.json --reference reference.wav --reference-text "Exact recorded words" --output hello.wav',
    ],
    limitations: [
      "Only reference-conditioned 24 kHz mono WAV synthesis is implemented; no reusable voice enrollment or automatic reference transcription.",
      "Target/reference text is limited to 4096 characters each. Configure a longer bounded timeout for slow local inference if needed.",
      "The worker uses local_files_only, offline flags and Python socket denial. Installed code is trusted; this is not operating-system isolation or proof of device compatibility.",
      "On Linux/macOS use the environment's bin/python path. echonerve/omnivoice is a separate fork; this adapter targets k2-fsa/OmniVoice's reviewed API.",
    ],
  },
];

export const mediaSetupHelp =
  "Media setup: run media setup [heygen|fish|omnivoice] for configuration and examples.\n" +
  "  HeyGen: inject HEYGEN_API_KEY and a 32-byte base64 recovery key; configure recovery.keyEnv. Supply --voice after voice-wait confirms readiness. https://developers.heygen.com/docs/models/heygen-voice\n" +
  "  Fish: set FISH_API_KEY; supply --voice or --reference with --reference-text. https://docs.fish.audio/\n" +
  "  OmniVoice: install Python/package, local weights and FFmpeg; supply reference + transcript. https://github.com/k2-fsa/OmniVoice\n" +
  "  Selection blocks routes permitting general/shared provider model training by default; requested private voice creation is separate. --allow-training opts into known permission for this invocation only; unknown policy still blocks.\n  Save an explicit media config and pass --config; use fnox exec for command-scoped secrets. setup only prints instructions.\n  Inspect receipts after failures; resume recovers completed audio without synthesis. Unknown training policy blocks execution.";

export const getMediaSetup = Effect.fnUntraced(function* (input?: unknown) {
  if (input === undefined) return mediaSetupGuides;
  const backend = yield* Schema.decodeUnknownEffect(
    Schema.Literals(["heygen", "fish", "omnivoice"]),
  )(input).pipe(
    Effect.mapError(
      () =>
        new MediaError({
          code: "invalid",
          message: "Setup guides are available for heygen, fish and omnivoice.",
        }),
    ),
  );
  return mediaSetupGuides.filter((guide) => guide.backend === backend);
});
