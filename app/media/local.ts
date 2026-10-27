import { writeFile } from "node:fs/promises";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { Schema } from "effect";
import type { AudioFormat, MediaPlan, MediaProvenance, MediaResult, PcmAudio } from "@/media";
import type { ResolvedMediaConfig } from "./config.ts";
import type { MediaAvailability } from "./catalog.ts";
import { outputPath, publishAudio, readBytes, type MediaFile } from "./files.ts";
import { MediaHostFailure, type MediaTransport } from "./transport.ts";

import type { MediaReceiptStore } from "./receipts.ts";

export interface MediaExecution {
  readonly authorizeUpload?: () => void;
  readonly receipts?: MediaReceiptStore;
  readonly plan: MediaPlan;
  readonly config: ResolvedMediaConfig;
  readonly availability: MediaAvailability;
  readonly transport: MediaTransport;
  readonly stage: string;
  readonly signal: AbortSignal;
  readonly input: MediaFile | undefined;
  readonly reference: MediaFile | undefined;
  readonly provenance: MediaProvenance;
}
export const audioArguments: Readonly<Record<AudioFormat, readonly string[]>> = {
  wav: ["-c:a", "pcm_s16le", "-f", "wav"],
  mp3: ["-c:a", "libmp3lame", "-f", "mp3"],
  flac: ["-c:a", "flac", "-f", "flac"],
  ogg: ["-c:a", "libvorbis", "-f", "ogg"],
  opus: ["-c:a", "libopus", "-f", "opus"],
  m4a: ["-c:a", "aac", "-f", "ipod"],
  pcm: ["-c:a", "pcm_s16le", "-f", "s16le"],
};
const ProbeSchema = Schema.Struct({
  format: Schema.Struct({ format_name: Schema.String, duration: Schema.optional(Schema.String) }),
  streams: Schema.Array(
    Schema.Struct({
      codec_type: Schema.optional(Schema.String),
      codec_name: Schema.optional(Schema.String),
      sample_rate: Schema.optional(Schema.String),
      channels: Schema.optional(Schema.Int),
    }),
  ).check(Schema.isMaxLength(64)),
  program_version: Schema.optional(Schema.Struct({ version: Schema.String })),
});
const WhisperSchema = Schema.Struct({
  result: Schema.optional(Schema.Struct({ language: Schema.String })),
  transcription: Schema.Array(
    Schema.Struct({
      text: Schema.String,
      offsets: Schema.Struct({ from: Schema.Number, to: Schema.Number }),
    }),
  ).check(Schema.isMaxLength(20_000)),
});
export function jsonBytes(bytes: Uint8Array): unknown {
  return JSON.parse(new TextDecoder("utf-8", { fatal: true }).decode(bytes));
}
export function runLocal(
  context: MediaExecution,
  executable: string | null,
  args: readonly string[],
  input?: Uint8Array,
): Promise<Uint8Array> {
  if (executable === null)
    throw new MediaHostFailure("unavailable", "The selected media executable is unavailable.");
  return context.transport.process(executable, args, {
    signal: context.signal,
    cwd: context.stage,
    maxBytes: context.config.limits.processOutputBytes,
    timeoutMs: context.config.limits.timeoutMs,
    ...(input === undefined ? {} : { input }),
    outputs: [
      ...["wav", "mp3", "flac", "ogg", "opus", "m4a", "pcm"].map((format) => ({
        path: join(context.stage, "output." + format),
        maxBytes: context.config.limits.outputBytes,
      })),
      ...["normalized.wav", "normalized-reference.wav", "reference.wav"].map((name) => ({
        path: join(context.stage, name),
        maxBytes: context.config.limits.inputBytes,
      })),
      {
        path: join(context.stage, "transcript.json"),
        maxBytes: context.config.limits.processOutputBytes,
      },
    ],
  });
}
const safeDemux = [
  "-protocol_whitelist",
  "file,pipe",
  "-format_whitelist",
  "wav,mp3,flac,ogg,mov,matroska,aac",
];
async function snapshot(context: MediaExecution): Promise<string> {
  if (context.input === undefined)
    throw new MediaHostFailure("invalid", "A media source file is required.");
  const path = join(context.stage, "input" + context.input.extension);
  await writeFile(path, context.input.bytes, { flag: "wx", mode: 0o600 });
  return path;
}
export async function executeLocal(context: MediaExecution): Promise<MediaResult> {
  const { plan, availability, config } = context;
  const request = plan.request;
  const identity = { backend: plan.backend.id, model: plan.model, provenance: context.provenance };
  if (plan.backend.id === "ffmpeg") {
    if (request.operation === "inspect") {
      const source = await snapshot(context);
      const raw = await runLocal(context, availability.ffprobe, [
        "-v",
        "error",
        ...safeDemux,
        "-show_format",
        "-show_streams",
        "-show_program_version",
        "-of",
        "json",
        source,
      ]);
      const data = Schema.decodeUnknownSync(ProbeSchema)(jsonBytes(raw));
      const duration = data.format.duration === undefined ? null : Number(data.format.duration);
      return {
        operation: "inspect",
        ...identity,
        provenance: {
          ...identity.provenance,
          toolVersion: data.program_version?.version?.slice(0, 256) ?? null,
        },
        media: {
          format: data.format.format_name,
          durationSeconds:
            duration !== null && Number.isFinite(duration) && duration >= 0 ? duration : null,
          sizeBytes: context.input?.bytes.byteLength ?? 0,
          streams: data.streams.map((stream) => ({
            kind:
              stream.codec_type === "audio"
                ? "audio"
                : stream.codec_type === "video"
                  ? "video"
                  : "other",
            codec: stream.codec_name ?? null,
            sampleRate:
              stream.sample_rate !== undefined && /^[1-9][0-9]*$/.test(stream.sample_rate)
                ? Number(stream.sample_rate)
                : null,
            channels: stream.channels ?? null,
          })),
        },
      };
    }
    if (request.operation === "convert" || request.operation === "record") {
      const format = request.operation === "record" ? "wav" : request.format;
      const destination = await outputPath(config.outputRoot, request.output, format);
      const output = join(context.stage, "output." + format);
      const pcm: PcmAudio | undefined =
        request.operation === "convert" && format === "pcm"
          ? {
              encoding: "pcm_s16le",
              sampleRate: request.sampleRate ?? 16000,
              channels: request.channels ?? 1,
            }
          : undefined;
      let args: string[];
      if (request.operation === "record") {
        const supported =
          process.platform === "win32"
            ? "dshow"
            : process.platform === "darwin"
              ? "avfoundation"
              : null;
        if (
          (supported !== null && request.inputFormat !== supported) ||
          (supported === null && !["alsa", "pulse"].includes(request.inputFormat))
        )
          throw new MediaHostFailure(
            "unsupported",
            "The selected capture input format does not match this host.",
          );
        if ((request.durationSeconds + 5) * 1000 > config.limits.timeoutMs)
          throw new MediaHostFailure(
            "limit",
            "Capture duration exceeds the configured process timeout.",
          );
        args = [
          "-hide_banner",
          "-nostdin",
          "-loglevel",
          "error",
          "-n",
          "-f",
          request.inputFormat,
          "-i",
          request.device,
          "-t",
          String(request.durationSeconds),
          "-vn",
          "-ar",
          "16000",
          "-ac",
          "1",
        ];
      } else {
        args = [
          "-hide_banner",
          "-nostdin",
          "-loglevel",
          "error",
          "-n",
          ...safeDemux,
          "-i",
          await snapshot(context),
          "-vn",
        ];
        if (request.startSeconds !== undefined) args.push("-ss", String(request.startSeconds));
        if (request.durationSeconds !== undefined) args.push("-t", String(request.durationSeconds));
        const sampleRate = request.sampleRate ?? pcm?.sampleRate;
        const channels = request.channels ?? pcm?.channels;
        if (sampleRate !== undefined) args.push("-ar", String(sampleRate));
        if (channels !== undefined) args.push("-ac", String(channels));
      }
      args.push(...audioArguments[format], "-fs", String(config.limits.outputBytes + 1), output);
      await runLocal(context, availability.ffmpeg, args);
      return {
        operation: request.operation,
        ...identity,
        artifact: await publishAudio(
          output,
          destination,
          format,
          config.limits.outputBytes,
          context.signal,
          pcm,
        ),
      };
    }
  }
  if (plan.backend.id === "whisper-cpp" && request.operation === "transcribe") {
    const settings = config.config.whisperCpp;
    if (settings === undefined)
      throw new MediaHostFailure("unavailable", "A whisper.cpp model is not configured.");
    const normalized = join(context.stage, "normalized.wav");
    await runLocal(context, availability.ffmpeg, [
      "-hide_banner",
      "-nostdin",
      "-loglevel",
      "error",
      "-n",
      ...safeDemux,
      "-i",
      await snapshot(context),
      "-vn",
      "-ar",
      "16000",
      "-ac",
      "1",
      "-c:a",
      "pcm_s16le",
      "-fs",
      String(config.limits.inputBytes + 1),
      normalized,
    ]);
    await readBytes(normalized, config.limits.inputBytes, context.signal);
    const prefix = join(context.stage, "transcript");
    await runLocal(context, availability.whisper, [
      "-m",
      settings.modelPath,
      "-f",
      normalized,
      "-oj",
      "-of",
      prefix,
      "-l",
      request.language ?? "auto",
    ]);
    const data = Schema.decodeUnknownSync(WhisperSchema)(
      jsonBytes(
        await readBytes(prefix + ".json", config.limits.processOutputBytes, context.signal),
      ),
    );
    const timing = request.timestamps === "segment";
    return {
      operation: "transcribe",
      ...identity,
      text: data.transcription
        .map((part) => part.text)
        .join("")
        .trim(),
      language: data.result?.language ?? request.language ?? null,
      timestamps: timing ? "segment" : "none",
      diarization: false,
      segments: timing
        ? data.transcription.map((part) => ({
            startSeconds: part.offsets.from / 1000,
            endSeconds: part.offsets.to / 1000,
            text: part.text,
            speaker: null,
          }))
        : [],
    };
  }
  if (plan.backend.id === "piper" && request.operation === "synthesize") {
    const settings = config.config.piper;
    if (settings === undefined)
      throw new MediaHostFailure("unavailable", "A Piper voice model is not configured.");
    if (request.text.length > 4096)
      throw new MediaHostFailure(
        "limit",
        "Local speech synthesis is limited to 4096 characters per request.",
      );
    const destination = await outputPath(config.outputRoot, request.output, "wav");
    const output = join(context.stage, "output.wav");
    const args = [
      "--model",
      settings.modelPath,
      "--config",
      settings.configPath ?? settings.modelPath + ".json",
      "--output-file",
      output,
    ];
    if (request.voice !== undefined) {
      if (!/^[0-9]{1,6}$/.test(request.voice))
        throw new MediaHostFailure(
          "invalid",
          "Piper speaker selection must be a numeric speaker ID.",
        );
      args.push("--speaker", request.voice);
    }
    await runLocal(
      context,
      availability.piper,
      args,
      new TextEncoder().encode(request.text + "\n"),
    );
    return {
      operation: "synthesize",
      ...identity,
      artifact: await publishAudio(
        output,
        destination,
        "wav",
        config.limits.outputBytes,
        context.signal,
      ),
    };
  }
  if (plan.backend.id === "chatterbox" && request.operation === "synthesize") {
    const settings = config.config.chatterbox;
    if (settings === undefined || context.reference === undefined)
      throw new MediaHostFailure(
        "invalid",
        "Chatterbox requires configured local weights and reference audio.",
      );
    if (request.referenceText !== undefined)
      throw new MediaHostFailure(
        "unsupported",
        "This Chatterbox adapter does not use reference transcripts.",
      );
    if (request.text.length > 4096)
      throw new MediaHostFailure(
        "limit",
        "Chatterbox synthesis is limited to 4096 characters per request.",
      );
    const destination = await outputPath(config.outputRoot, request.output, "wav");
    const source = join(context.stage, "reference" + context.reference.extension);
    const reference = join(context.stage, "reference.wav");
    await writeFile(source, context.reference.bytes, { flag: "wx", mode: 0o600 });
    const normalized =
      context.reference.extension === ".wav"
        ? join(context.stage, "normalized-reference.wav")
        : reference;
    await runLocal(context, availability.ffmpeg, [
      "-hide_banner",
      "-nostdin",
      "-loglevel",
      "error",
      "-n",
      ...safeDemux,
      "-i",
      source,
      "-vn",
      "-ar",
      "24000",
      "-ac",
      "1",
      "-c:a",
      "pcm_s16le",
      "-fs",
      String(config.limits.inputBytes + 1),
      normalized,
    ]);
    await readBytes(normalized, config.limits.inputBytes, context.signal);
    const output = join(context.stage, "output.wav");
    const worker = fileURLToPath(new URL("./chatterbox-worker.py", import.meta.url));
    const payload = {
      packageRoot: settings.packageRoot,
      weightsDirectory: settings.weightsDirectory,
      device: settings.device ?? "cpu",
      text: request.text,
      reference: normalized,
      output,
      maximumBytes: config.limits.outputBytes,
    };
    await runLocal(
      context,
      availability.chatterbox,
      [worker],
      new TextEncoder().encode(JSON.stringify(payload)),
    );
    return {
      operation: "synthesize",
      ...identity,
      artifact: await publishAudio(
        output,
        destination,
        "wav",
        config.limits.outputBytes,
        context.signal,
      ),
    };
  }
  throw new MediaHostFailure("unsupported", "The selected local media operation is unsupported.");
}
