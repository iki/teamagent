import { open } from "node:fs/promises";
import { resolve } from "node:path";
import { Effect, Schema } from "effect";
import {
  MediaError,
  validateMediaRequest,
  validateMediaVoiceRequest,
  getMediaSetup,
  importSrtSpeech,
  MediaDiagnosticRequestSchema,
  MediaRecoveryRequestSchema,
  type MediaApi,
  type SpeechTextImport,
} from "@/media";
import { createMediaHost } from "../media/index.ts";
import { withHostInterruption } from "../runtime/interruption.ts";

export interface MediaFlags {
  readonly config?: string | undefined;
  readonly allowTraining?: boolean | undefined;
  readonly similarity?: string | undefined;
  readonly expressivenessBoost?: number | undefined;
  readonly withTimestamps?: boolean | undefined;
  readonly idempotencyKey?: string | undefined;
  readonly textFormat?: string | undefined;
  readonly cursor?: string | undefined;
  readonly limit?: number | undefined;
  readonly timeoutMs?: number | undefined;
  readonly pollIntervalMs?: number | undefined;
  readonly backend?: string | undefined;
  readonly model?: string | undefined;
  readonly locality?: string | undefined;
  readonly preference?: string | undefined;
  readonly output?: string | undefined;
  readonly format?: string | undefined;
  readonly language?: string | undefined;
  readonly timestamps?: string | undefined;
  readonly diarization?: boolean | undefined;
  readonly voice?: string | undefined;
  readonly reference?: string | undefined;
  readonly referenceText?: string | undefined;
  readonly voiceAuthorization?: string | undefined;
  readonly name?: string | undefined;
  readonly textFile?: string | undefined;
  readonly sampleRate?: number | undefined;
  readonly channels?: number | undefined;
  readonly startSeconds?: number | undefined;
  readonly durationSeconds?: number | undefined;
  readonly device?: string | undefined;
  readonly inputFormat?: string | undefined;
}
export function mediaSelection(flags: MediaFlags): Readonly<Record<string, unknown>> {
  return {
    allowTraining: flags.allowTraining === true,
    ...(flags.backend === undefined || flags.backend === "auto" ? {} : { backend: flags.backend }),
    ...(flags.model === undefined ? {} : { model: flags.model }),
    ...(flags.locality === undefined ? {} : { locality: flags.locality }),
    ...(flags.preference === undefined ? {} : { preference: flags.preference }),
  };
}
export async function runCliEffect<A, E>(
  effect: Effect.Effect<A, E>,
  signal?: AbortSignal,
): Promise<A> {
  const result = await Effect.runPromise(
    Effect.match(effect, {
      onFailure: (error) => ({ ok: false as const, error }),
      onSuccess: (value) => ({ ok: true as const, value }),
    }),
    signal === undefined ? {} : { signal },
  );
  if (!result.ok) throw result.error;
  return result.value;
}
export async function readCliText(path: string, maximumBytes = 1_048_576): Promise<string> {
  const file = await open(resolve(path), "r");
  try {
    const before = await file.stat();
    if (!before.isFile() || before.size > maximumBytes)
      throw new MediaError({
        code: "limit",
        message: "CLI input must be a bounded regular UTF-8 file.",
      });
    const chunks: Uint8Array[] = [];
    let size = 0;
    for (;;) {
      const buffer = Buffer.alloc(Math.min(65_536, maximumBytes + 1 - size));
      const read = await file.read(buffer, 0, buffer.length, null);
      if (read.bytesRead === 0) break;
      size += read.bytesRead;
      if (size > maximumBytes)
        throw new MediaError({ code: "limit", message: "CLI input exceeded its byte limit." });
      chunks.push(buffer.subarray(0, read.bytesRead));
    }
    const after = await file.stat();
    if (after.size !== size || after.mtimeMs !== before.mtimeMs)
      throw new MediaError({ code: "conflict", message: "CLI input changed while reading." });
    return new TextDecoder("utf-8", { fatal: true }).decode(Buffer.concat(chunks));
  } finally {
    await file.close();
  }
}
export async function readCliJson(path: string): Promise<unknown> {
  return Schema.decodeUnknownSync(Schema.fromJsonString(Schema.Unknown))(await readCliText(path));
}
export interface MediaCommandDependencies {
  readonly createHost?: (options: {
    readonly configFile?: string;
  }) => Effect.Effect<MediaApi, MediaError>;
}

export async function runMediaCommand(
  action: string,
  argument: string | undefined,
  flags: MediaFlags,
  print: (value: unknown) => void,
  dependencies: MediaCommandDependencies = {},
) {
  return withHostInterruption(async (signal) => {
    if (action === "setup") {
      print(await runCliEffect(getMediaSetup(argument), signal));
      return;
    }
    if (action === "import-text") {
      if (argument === undefined || flags.textFormat !== "srt")
        throw new MediaError({
          code: "invalid",
          message: "Import requires a file and --text-format srt.",
        });
      print(await runCliEffect(importSrtSpeech(await readCliText(argument)), signal));
      return;
    }
    const createHost = dependencies.createHost ?? createMediaHost;
    const mediaHost = () =>
      runCliEffect(
        createHost(flags.config === undefined ? {} : { configFile: resolve(flags.config) }),
        signal,
      );
    const voiceAction =
      action === "voice-get"
        ? "get"
        : action === "voice-list"
          ? "list"
          : action === "voice-wait"
            ? "wait"
            : action === "voice-delete"
              ? "delete"
              : undefined;
    if (voiceAction !== undefined) {
      if (flags.backend === undefined || flags.backend === "auto")
        throw new MediaError({
          code: "invalid",
          message: "Voice lifecycle requires an explicit --backend.",
        });
      const request = await runCliEffect(
        validateMediaVoiceRequest({
          action: voiceAction,
          backend: flags.backend,
          ...(argument === undefined ? {} : { voiceId: argument }),
          ...(flags.cursor === undefined ? {} : { cursor: flags.cursor }),
          ...(flags.limit === undefined ? {} : { limit: flags.limit }),
          ...(flags.timeoutMs === undefined ? {} : { timeoutMs: flags.timeoutMs }),
          ...(flags.pollIntervalMs === undefined ? {} : { pollIntervalMs: flags.pollIntervalMs }),
        }),
        signal,
      );
      print(await runCliEffect((await mediaHost()).voice(request), signal));
      return;
    }
    if (action === "diagnose") {
      if (flags.backend === undefined || flags.backend === "auto")
        throw new MediaError({
          code: "invalid",
          message: "Diagnosis requires an explicit --backend.",
        });
      const request = await runCliEffect(
        Schema.decodeUnknownEffect(MediaDiagnosticRequestSchema)({
          backend: flags.backend,
          ...(flags.voice === undefined ? {} : { voiceId: flags.voice }),
        }).pipe(
          Effect.mapError(
            () => new MediaError({ code: "invalid", message: "Invalid diagnostic arguments." }),
          ),
        ),
        signal,
      );
      print(await runCliEffect((await mediaHost()).diagnose(request), signal));
      return;
    }
    if (action === "receipts" || action === "receipt" || action === "resume") {
      const request = await runCliEffect(
        Schema.decodeUnknownEffect(MediaRecoveryRequestSchema)({
          action: action === "receipts" ? "list" : action === "receipt" ? "get" : "resume",
          ...(argument === undefined ? {} : { receiptId: argument }),
          ...(flags.output === undefined ? {} : { output: flags.output }),
        }).pipe(
          Effect.mapError(
            () => new MediaError({ code: "invalid", message: "Invalid recovery arguments." }),
          ),
        ),
        signal,
      );
      print(await runCliEffect((await mediaHost()).recovery(request), signal));
      return;
    }
    const selection = mediaSelection(flags);
    let request: unknown;
    let textImport: SpeechTextImport | undefined;
    if (action === "plan") {
      if (argument === undefined)
        throw new MediaError({ code: "invalid", message: "Plan requires a request JSON file." });
      const loaded = await runCliEffect(validateMediaRequest(await readCliJson(argument)), signal);
      const base =
        flags.backend === "auto"
          ? Object.fromEntries(Object.entries(loaded).filter(([key]) => key !== "backend"))
          : loaded;
      // Invocation flags always overwrite a stored JSON training opt-in.
      request = { ...base, ...selection };
    } else if (action !== "backends") {
      const output = flags.output === undefined ? {} : { output: flags.output };
      switch (action) {
        case "inspect":
          request = { operation: action, input: argument, ...selection };
          break;
        case "convert":
          request = {
            operation: action,
            input: argument,
            format: flags.format ?? "wav",
            ...output,
            ...selection,
            ...(flags.sampleRate === undefined ? {} : { sampleRate: flags.sampleRate }),
            ...(flags.channels === undefined ? {} : { channels: flags.channels }),
            ...(flags.startSeconds === undefined ? {} : { startSeconds: flags.startSeconds }),
            ...(flags.durationSeconds === undefined
              ? {}
              : { durationSeconds: flags.durationSeconds }),
          };
          break;
        case "transcribe":
          request = {
            operation: action,
            input: argument,
            ...selection,
            ...(flags.language === undefined ? {} : { language: flags.language }),
            ...(flags.timestamps === undefined ? {} : { timestamps: flags.timestamps }),
            ...(flags.diarization === undefined ? {} : { diarization: flags.diarization }),
          };
          break;
        case "synthesize": {
          if (flags.textFile !== undefined && argument !== undefined)
            throw new MediaError({
              code: "invalid",
              message: "Choose positional speech text or --text-file, not both.",
            });
          if (
            flags.textFormat !== undefined &&
            (flags.textFormat !== "srt" || flags.textFile === undefined)
          )
            throw new MediaError({
              code: "invalid",
              message: "--text-format srt requires --text-file.",
            });
          const source =
            flags.textFile === undefined
              ? argument
              : await readCliText(flags.textFile, flags.textFormat === "srt" ? 1_048_576 : 400_000);
          if (flags.textFormat === "srt")
            textImport = await runCliEffect(importSrtSpeech(source), signal);
          request = {
            operation: action,
            text: textImport?.text ?? source,
            ...selection,
            ...output,
            ...(flags.language === undefined ? {} : { language: flags.language }),
            ...(flags.expressivenessBoost === undefined
              ? {}
              : { expressivenessBoost: flags.expressivenessBoost }),
            ...(flags.withTimestamps === undefined ? {} : { withTimestamps: flags.withTimestamps }),
            ...(flags.voice === undefined ? {} : { voice: flags.voice }),
            ...(flags.reference === undefined ? {} : { reference: flags.reference }),
            ...(flags.referenceText === undefined ? {} : { referenceText: flags.referenceText }),
            ...(flags.voiceAuthorization === undefined
              ? {}
              : { voiceAuthorization: flags.voiceAuthorization }),
            ...(flags.format === undefined ? {} : { format: flags.format }),
          };
          break;
        }
        case "clone":
          request = {
            operation: action,
            reference: argument,
            name: flags.name,
            ...selection,
            ...(flags.language === undefined ? {} : { language: flags.language }),
            ...(flags.similarity === undefined ? {} : { similarity: flags.similarity }),
            ...(flags.idempotencyKey === undefined ? {} : { idempotencyKey: flags.idempotencyKey }),
            ...(flags.voiceAuthorization === undefined
              ? {}
              : { voiceAuthorization: flags.voiceAuthorization }),
          };
          break;
        case "record":
          request = {
            operation: action,
            device: flags.device,
            inputFormat: flags.inputFormat,
            durationSeconds: flags.durationSeconds,
            ...selection,
            ...output,
          };
          break;
        default:
          throw new MediaError({ code: "invalid", message: "Unknown media command." });
      }
      request = await runCliEffect(validateMediaRequest(request), signal);
    }
    const media = await mediaHost();
    if (action === "backends") {
      print(await runCliEffect(media.listBackends(), signal));
    } else if (action === "plan") {
      const explanation = await runCliEffect(media.explain(request), signal);
      print(explanation.selected ?? explanation);
    } else {
      const result = await runCliEffect(media.run(request), signal);
      print(textImport === undefined ? result : { result, textImport });
    }
  });
}
