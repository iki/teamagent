import { basename, join } from "node:path";
import {
  evaluateTrainingPolicy,
  type MediaBackend,
  type MediaCapability,
  type MediaOperation,
  type AudioFormat,
} from "@/media";
import { resolveMediaTrainingPolicy } from "./training.ts";
import type { ResolvedMediaConfig } from "./config.ts";
import { executable, regularFile } from "./files.ts";
import type { MediaTransport } from "./transport.ts";
import { omniVoiceResourcesReady } from "./omnivoice.ts";
import { heyGenSpeechModels, defaultHeyGenSpeechModel } from "./heygen.ts";
import { fishSpeechModels, defaultFishSpeechModel } from "./fish.ts";

export interface MediaAvailability {
  readonly ffmpeg: string | null;
  readonly ffprobe: string | null;
  readonly whisper: string | null;
  readonly piper: string | null;
  readonly chatterbox: string | null;
  readonly omnivoice: string | null;
  readonly catalog: readonly MediaBackend[];
}
const capability = (
  operation: MediaOperation,
  model: string | null,
  formats: readonly AudioFormat[],
  priority: number,
  extra: Partial<MediaCapability> = {},
): MediaCapability => ({
  operation,
  model,
  default: true,
  formats,
  timestamps: [],
  diarization: false,
  referenceVoice: false,
  policy: { balanced: priority, quality: priority, latency: priority, cost: priority },
  limitations: [
    "Ranking is a static configurable policy prior, not a measured quality, latency or price comparison.",
  ],
  ...extra,
});
const backend = (
  id: string,
  label: string,
  locality: "local" | "remote",
  available: boolean,
  capabilities: readonly MediaCapability[],
  reason: string,
  limitations: readonly string[] = [],
): MediaBackend => ({
  id,
  label,
  locality,
  available,
  unavailableReason: available ? null : reason,
  capabilities,
  limitations,
});
export function localModelName(path: string): string {
  const name = basename(path).replace(/[^a-zA-Z0-9._-]/g, "-");
  return (/^[a-zA-Z0-9]/.test(name) ? name : "local-" + name).slice(0, 200);
}
export async function discoverMedia(
  config: ResolvedMediaConfig,
  transport: MediaTransport,
): Promise<MediaAvailability> {
  const ffmpeg = await executable(config.config.ffmpeg?.executable ?? "ffmpeg");
  const ffprobe = await executable(config.config.ffmpeg?.probeExecutable ?? "ffprobe");
  const whisperConfig = config.config.whisperCpp;
  const piperConfig = config.config.piper;
  const whisper =
    whisperConfig === undefined || !(await regularFile(whisperConfig.modelPath))
      ? null
      : await executable(whisperConfig.executable);
  const piper =
    piperConfig === undefined ||
    !(await regularFile(piperConfig.modelPath)) ||
    !(await regularFile(piperConfig.configPath ?? piperConfig.modelPath + ".json"))
      ? null
      : await executable(piperConfig.executable);
  const chatterboxConfig = config.config.chatterbox;
  const chatterboxFiles =
    chatterboxConfig === undefined
      ? false
      : (
          await Promise.all(
            ["ve.safetensors", "t3_cfg.safetensors", "s3gen.safetensors", "tokenizer.json"].map(
              (name) => regularFile(join(chatterboxConfig.weightsDirectory, name)),
            ),
          )
        ).every(Boolean) &&
        (await regularFile(join(chatterboxConfig.packageRoot, "chatterbox", "tts.py")));
  const chatterbox =
    chatterboxConfig === undefined || !chatterboxFiles
      ? null
      : await executable(chatterboxConfig.pythonExecutable);
  const omniVoiceConfig = config.config.omnivoice;
  const omnivoice =
    omniVoiceConfig === undefined || !(await omniVoiceResourcesReady(omniVoiceConfig))
      ? null
      : await executable(omniVoiceConfig.pythonExecutable);
  const heygen = config.config.heygen;
  const fish = config.config.fish;
  const openai = config.config.openai;
  const elevenlabs = config.config.elevenlabs;
  const present = (key: string | undefined): boolean => key !== undefined && key.trim().length > 0;
  const openaiCapabilities: MediaCapability[] = [
    capability("transcribe", openai?.transcriptionModel ?? "gpt-transcribe", [], 30, {
      policy: { balanced: 30, quality: 0, latency: 10, cost: 30 },
      limitations: [
        "File transcription only; timestamp and diarization requests are not silently approximated.",
      ],
    }),
  ];
  if (openai?.allowLegacySpeech === true && openai.speechModel !== undefined)
    openaiCapabilities.push(
      capability("synthesize", openai.speechModel, ["wav", "mp3", "flac", "opus", "pcm"], 90, {
        limitations: [
          "Legacy /audio/speech model explicitly enabled; official shutdown is 2027-01-06.",
        ],
      }),
    );
  return {
    ffmpeg,
    ffprobe,
    whisper,
    piper,
    chatterbox,
    omnivoice,
    catalog: [
      backend(
        "ffmpeg",
        "FFmpeg / FFprobe",
        "local",
        ffmpeg !== null && ffprobe !== null,
        [
          capability("inspect", null, [], 0),
          capability("convert", null, ["wav", "mp3", "flac", "ogg", "opus", "m4a", "pcm"], 0),
          capability("record", null, ["wav"], 0),
        ],
        "Configure installed FFmpeg and FFprobe executables; launcher shims are not executed implicitly.",
        ["Executable presence is not a codec or device capability test."],
      ),
      backend(
        "whisper-cpp",
        "whisper.cpp CLI",
        "local",
        whisper !== null && ffmpeg !== null,
        [
          capability(
            "transcribe",
            whisperConfig === undefined
              ? "configured-model"
              : localModelName(whisperConfig.modelPath),
            [],
            10,
            {
              policy: { balanced: 10, quality: 25, latency: 5, cost: 0 },
              timestamps: ["segment"],
              limitations: [
                "Word timestamps and speaker diarization are not implemented by this adapter.",
              ],
            },
          ),
        ],
        "Configure a whisper.cpp executable and existing model file, plus FFmpeg for audio normalization.",
      ),
      backend(
        "piper",
        "Piper CLI",
        "local",
        piper !== null,
        [
          capability(
            "synthesize",
            piperConfig === undefined ? "configured-model" : localModelName(piperConfig.modelPath),
            ["wav"],
            10,
            { policy: { balanced: 10, quality: 30, latency: 0, cost: 0 } },
          ),
        ],
        "Configure a Piper executable, existing ONNX model and voice JSON configuration.",
        [
          "Piper uses configured voice models; reference voice cloning is unsupported.",
          "Only the model's adjacent .onnx.json configuration is supported; the reviewed Python CLI ignores custom --config paths.",
        ],
      ),
      backend(
        "chatterbox",
        "Chatterbox local reference synthesis",
        "local",
        chatterbox !== null && ffmpeg !== null,
        [
          capability("synthesize", "chatterbox-local", ["wav"], 15, {
            policy: { balanced: 15, quality: 15, latency: 30, cost: 0 },
            referenceVoice: true,
            referenceRequired: true,
            limitations: [
              "Reference audio required. This conditions one synthesis request; it does not enroll or train a voice.",
              "Configured files are present; package compatibility and cached tokenizer resources remain unverified until execution.",
            ],
          }),
        ],
        "Configure a Python runtime, Chatterbox package root, complete local checkpoints and FFmpeg.",
        [
          "The isolated worker uses from_local and blocks Python socket connections. Missing local resources fail without a download or provider fallback.",
        ],
      ),
      backend(
        "omnivoice",
        "OmniVoice local reference synthesis",
        "local",
        omnivoice !== null && ffmpeg !== null,
        [
          capability("synthesize", "omnivoice-local", ["wav"], 16, {
            policy: { balanced: 16, quality: 16, latency: 35, cost: 0 },
            referenceVoice: true,
            referenceRequired: true,
            referenceTextRequired: true,
            referenceTextSupported: true,
            limitations: [
              "Requires reference audio of at most 30 seconds and its transcript; target and reference text are each limited to 4096 characters.",
              "Published unsharded local model, text tokenizer and nested audio_tokenizer files must already exist; package and device compatibility remain unverified until execution.",
            ],
          }),
        ],
        "Configure Python, the k2-fsa/OmniVoice source package, complete local weights and FFmpeg. Run media setup omnivoice for URLs.",
        [
          "Offline worker disables automatic ASR and Python socket access. Check code, model and nested codec licenses separately.",
        ],
      ),
      backend(
        "heygen",
        "HeyGen Voice API",
        "remote",
        heygen !== undefined && present(transport.environment(heygen.apiKeyEnv)),
        [
          ...heyGenSpeechModels.map((model) =>
            capability("synthesize", model, ["wav"], 22, {
              default: model === (heygen?.speechModel ?? defaultHeyGenSpeechModel),
              requiresVoice: heygen?.voiceId === undefined,
              policy: { balanced: 22, quality: 5, latency: 15, cost: 30 },
              limitations: [
                "Requires a public or enrolled voice ID. Turbo variants support public/instant voices; professional clones require the standard model.",
                "Only bounded file synthesis is implemented; WAV is downloaded from the verified HeyGen CDN without credentials.",
              ],
            }),
          ),
          capability("clone", null, [], 30, {
            limitations: [
              "Instant voice creation can remain pending after acceptance. Check readiness in the provider account before synthesis; no automatic polling or retry.",
              "Inline clone recordings are retained by HeyGen as provider assets.",
            ],
          }),
        ],
        "Configure heygen.apiKeyEnv and an API key; synthesis also requires a voice ID. Run media setup heygen for URLs.",
        [
          "Configured credentials do not establish account access. Promotional model access and pricing are provider-specific, not a selection guarantee.",
        ],
      ),
      backend(
        "fish",
        "Fish Audio API",
        "remote",
        fish !== undefined && present(transport.environment(fish.apiKeyEnv)),
        [
          ...fishSpeechModels.map((model) =>
            capability("synthesize", model, ["wav", "mp3", "opus"], 23, {
              default: model === (fish?.speechModel ?? defaultFishSpeechModel),
              referenceVoice: true,
              referenceTextRequired: true,
              referenceTextSupported: true,
              requiresVoiceOrReference: fish?.voiceId === undefined,
              policy: { balanced: 23, quality: 6, latency: 12, cost: 25 },
              limitations: [
                "Use an enrolled voice ID or inline reference audio plus its transcript. Reference audio uses MessagePack binary fields.",
                "Billing is based on UTF-8 text bytes. Known model IDs are validated locally to prevent the provider's unknown-model fallback.",
              ],
            }),
          ),
          capability("clone", null, [], 28, {
            limitations: [
              "Creates a private provider voice; a created or training result is pending, not a ready voice. No automatic polling or retry.",
            ],
          }),
        ],
        "Configure fish.apiKeyEnv and an API key; supply a voice ID or reference audio with its transcript. Run media setup fish for URLs.",
        [
          "Configured credentials do not establish account access. Hosted API terms and open model licenses are separate.",
        ],
      ),
      backend(
        "openai",
        "OpenAI audio API",
        "remote",
        openai !== undefined && present(transport.environment(openai.apiKeyEnv)),
        openaiCapabilities,
        "Configure an API-key environment reference with a nonempty value.",
        [
          "Availability means configured credentials, not verified account/model access. No automatic request retry.",
        ],
      ),
      backend(
        "elevenlabs",
        "ElevenLabs audio API",
        "remote",
        elevenlabs !== undefined && present(transport.environment(elevenlabs.apiKeyEnv)),
        [
          capability("transcribe", elevenlabs?.transcriptionModel ?? "scribe_v2", [], 25, {
            policy: { balanced: 25, quality: 5, latency: 20, cost: 25 },
            timestamps: ["word"],
            diarization: true,
          }),
          capability(
            "synthesize",
            elevenlabs?.speechModel ?? "eleven_multilingual_v2",
            ["mp3", "pcm"],
            25,
            {
              policy: { balanced: 25, quality: 0, latency: 10, cost: 30 },
              requiresVoice: elevenlabs?.voiceId === undefined,
            },
          ),
          capability("clone", null, [], 25, {
            limitations: ["Voice enrollment may require account permissions and verification."],
          }),
        ],
        "Configure an API-key environment reference with a nonempty value.",
        [
          "Availability means configured credentials, not verified account access. No automatic request retry.",
        ],
      ),
    ].map((entry) => ({
      ...entry,
      capabilities: entry.capabilities.map((item) => {
        const account =
          entry.id === "heygen" ||
          entry.id === "fish" ||
          entry.id === "openai" ||
          entry.id === "elevenlabs"
            ? config.config.training?.[entry.id]
            : undefined;
        const training = resolveMediaTrainingPolicy({
          backendId: entry.id,
          operation: item.operation,
          model: item.model,
          ...(account === undefined ? {} : { account }),
        });
        return {
          ...item,
          training,
          trainingDecision: evaluateTrainingPolicy(training, { now: Date.now() }),
          policy: config.config.priorities?.[entry.id] ?? item.policy,
        };
      }),
    })),
  };
}
