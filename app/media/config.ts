import { loadConfig } from "c12";
import { lstat } from "node:fs/promises";
import { dirname, isAbsolute, resolve } from "node:path";
import { Effect, Schema } from "effect";
import { MediaError, MediaPolicyPrioritiesSchema, TrainingAccountConfigSchema } from "@/media";
import { heyGenSpeechModels } from "./heygen.ts";
import { fishSpeechModels } from "./fish.ts";

const PathText = Schema.NonEmptyString.check(
  Schema.isMaxLength(4096),
  Schema.isPattern(/^[^\p{Cc}]+$/u),
);
const ModelText = Schema.NonEmptyString.check(
  Schema.isMaxLength(200),
  Schema.isPattern(/^[a-zA-Z0-9._/-]+$/),
);
const EnvName = Schema.String.check(Schema.isPattern(/^[A-Za-z_][A-Za-z0-9_]{0,127}$/));
const Milliseconds = Schema.Int.check(Schema.isBetween({ minimum: 100, maximum: 900_000 }));
const Bytes = Schema.Int.check(Schema.isBetween({ minimum: 1024, maximum: 268_435_456 }));
export const MediaHostConfigSchema = Schema.Struct({
  inputRoot: Schema.optional(PathText),
  outputRoot: Schema.optional(PathText),
  recovery: Schema.optional(
    Schema.Struct({ directory: Schema.optional(PathText), keyEnv: EnvName }),
  ),
  training: Schema.optional(
    Schema.Struct({
      heygen: Schema.optional(TrainingAccountConfigSchema),
      fish: Schema.optional(TrainingAccountConfigSchema),
      openai: Schema.optional(TrainingAccountConfigSchema),
      elevenlabs: Schema.optional(TrainingAccountConfigSchema),
    }),
  ),
  ffmpeg: Schema.optional(Schema.Struct({ executable: PathText, probeExecutable: PathText })),
  whisperCpp: Schema.optional(Schema.Struct({ executable: PathText, modelPath: PathText })),
  piper: Schema.optional(
    Schema.Struct({
      executable: PathText,
      modelPath: PathText,
      configPath: Schema.optional(PathText),
    }),
  ),
  chatterbox: Schema.optional(
    Schema.Struct({
      pythonExecutable: PathText,
      packageRoot: PathText,
      weightsDirectory: PathText,
      device: Schema.optional(Schema.Literals(["cpu", "cuda", "mps"])),
    }),
  ),
  omnivoice: Schema.optional(
    Schema.Struct({
      pythonExecutable: PathText,
      packageRoot: PathText,
      weightsDirectory: PathText,
      device: Schema.optional(Schema.Literals(["cpu", "cuda", "mps", "xpu"])),
    }),
  ),
  heygen: Schema.optional(
    Schema.Struct({
      apiKeyEnv: EnvName,
      voiceId: Schema.optional(ModelText),
      speechModel: Schema.optional(Schema.Literals(heyGenSpeechModels)),
    }),
  ),
  fish: Schema.optional(
    Schema.Struct({
      apiKeyEnv: EnvName,
      voiceId: Schema.optional(ModelText),
      speechModel: Schema.optional(Schema.Literals(fishSpeechModels)),
    }),
  ),
  openai: Schema.optional(
    Schema.Struct({
      apiKeyEnv: EnvName,
      transcriptionModel: Schema.optional(ModelText),
      speechModel: Schema.optional(ModelText),
      allowLegacySpeech: Schema.optional(Schema.Boolean),
    }),
  ),
  elevenlabs: Schema.optional(
    Schema.Struct({
      apiKeyEnv: EnvName,
      transcriptionModel: Schema.optional(ModelText),
      speechModel: Schema.optional(ModelText),
      voiceId: Schema.optional(ModelText),
    }),
  ),
  priorities: Schema.optional(
    Schema.Record(
      Schema.String.check(Schema.isPattern(/^[a-z][a-z0-9-]{0,63}$/)),
      MediaPolicyPrioritiesSchema,
    ),
  ),
  limits: Schema.optional(
    Schema.Struct({
      inputBytes: Schema.optional(Bytes),
      outputBytes: Schema.optional(Bytes),
      timeoutMs: Schema.optional(Milliseconds),
      processOutputBytes: Schema.optional(Bytes),
    }),
  ),
});
export type MediaHostConfig = typeof MediaHostConfigSchema.Type;
export interface ResolvedMediaConfig {
  readonly inputRoot: string;
  readonly outputRoot: string;
  readonly config: MediaHostConfig;
  readonly limits: {
    readonly inputBytes: number;
    readonly outputBytes: number;
    readonly timeoutMs: number;
    readonly processOutputBytes: number;
  };
}
export function parseMediaConfig(input: unknown, cwd: string): ResolvedMediaConfig {
  const config = Schema.decodeUnknownSync(MediaHostConfigSchema)(input, {
    onExcessProperty: "error",
  });
  if (
    Object.keys(config.priorities ?? {}).some(
      (id) =>
        ![
          "ffmpeg",
          "whisper-cpp",
          "piper",
          "chatterbox",
          "omnivoice",
          "heygen",
          "fish",
          "openai",
          "elevenlabs",
        ].includes(id),
    )
  )
    throw new Error("Unknown media policy backend");
  if (
    config.piper?.configPath !== undefined &&
    resolve(cwd, config.piper.configPath) !== resolve(cwd, config.piper.modelPath) + ".json"
  )
    throw new Error("Piper configuration must be the model's adjacent .json file");
  const command = (value: string): string =>
    isAbsolute(value) || !/[\\/]/.test(value) ? value : resolve(cwd, value);
  return {
    inputRoot: resolve(cwd, config.inputRoot ?? "."),
    outputRoot: resolve(cwd, config.outputRoot ?? ".cache/media"),
    config: {
      ...config,
      ...(config.recovery === undefined
        ? {}
        : {
            recovery: {
              keyEnv: config.recovery.keyEnv,
              directory: resolve(cwd, config.recovery.directory ?? ".cache/media-recovery"),
            },
          }),
      ffmpeg: {
        executable: command(config.ffmpeg?.executable ?? "ffmpeg"),
        probeExecutable: command(config.ffmpeg?.probeExecutable ?? "ffprobe"),
      },
      ...(config.chatterbox === undefined
        ? {}
        : {
            chatterbox: {
              pythonExecutable: command(config.chatterbox.pythonExecutable),
              packageRoot: resolve(cwd, config.chatterbox.packageRoot),
              weightsDirectory: resolve(cwd, config.chatterbox.weightsDirectory),
              device: config.chatterbox.device ?? "cpu",
            },
          }),
      ...(config.omnivoice === undefined
        ? {}
        : {
            omnivoice: {
              pythonExecutable: command(config.omnivoice.pythonExecutable),
              packageRoot: resolve(cwd, config.omnivoice.packageRoot),
              weightsDirectory: resolve(cwd, config.omnivoice.weightsDirectory),
              device: config.omnivoice.device ?? "cpu",
            },
          }),
      ...(config.whisperCpp === undefined
        ? {}
        : {
            whisperCpp: {
              executable: command(config.whisperCpp.executable),
              modelPath: resolve(cwd, config.whisperCpp.modelPath),
            },
          }),
      ...(config.piper === undefined
        ? {}
        : {
            piper: {
              executable: command(config.piper.executable),
              modelPath: resolve(cwd, config.piper.modelPath),
              ...(config.piper.configPath === undefined
                ? {}
                : { configPath: resolve(cwd, config.piper.configPath) }),
            },
          }),
    },
    limits: {
      inputBytes: config.limits?.inputBytes ?? 64 * 1024 * 1024,
      outputBytes: config.limits?.outputBytes ?? 64 * 1024 * 1024,
      timeoutMs: config.limits?.timeoutMs ?? 120_000,
      processOutputBytes: config.limits?.processOutputBytes ?? 4 * 1024 * 1024,
    },
  };
}
/** Explicit trusted configuration only; no ambient files, dotenv, remote layers or secret scans. */
export const loadMediaConfig = Effect.fn("loadMediaConfig")(function* (
  path?: string,
  cwd: string = process.cwd(),
) {
  return yield* Effect.tryPromise({
    try: async () => {
      if (path === undefined) return parseMediaConfig({}, cwd);
      const configFile = resolve(cwd, path);
      const info = await lstat(configFile);
      if (!info.isFile() || info.isSymbolicLink() || info.size > 262_144)
        throw new Error("invalid configuration");
      const loaded = await loadConfig<Record<string, unknown>>({
        name: "teamagent-media",
        cwd: dirname(configFile),
        configFile,
        configFileRequired: true,
        rcFile: false,
        globalRc: false,
        packageJson: false,
        dotenv: false,
        envName: false,
        extend: false,
        giget: false,
        omit$Keys: false,
        merger: (...sources) =>
          sources
            .toReversed()
            .reduce<Record<string, unknown>>((merged, source) => ({ ...merged, ...source }), {}),
      });
      const dynamic: unknown = loaded.config;
      return parseMediaConfig(dynamic, dirname(configFile));
    },
    catch: () =>
      new MediaError({
        code: "invalid",
        message: "Cannot load the explicit media configuration. Check its schema and paths.",
      }),
  });
});
