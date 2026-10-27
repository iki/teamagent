import { randomUUID } from "node:crypto";
import { writeFile } from "node:fs/promises";
import { join } from "node:path";
import { Schema } from "effect";
import type { AudioFormat, MediaResult } from "@/media";
import { outputPath, publishAudio, type MediaFile } from "./files.ts";
import { jsonBytes, type MediaExecution } from "./local.ts";
import {
  MediaHostFailure,
  MediaHttpFailure,
  MediaPolicyFailure,
  classifyMediaHttp,
  type MediaHttpResponse,
} from "./transport.ts";

const OpenAiTranscript = Schema.Struct({
  text: Schema.String.check(Schema.isMaxLength(2_000_000)),
  languages: Schema.optional(
    Schema.Array(Schema.Struct({ code: Schema.String })).check(Schema.isMaxLength(64)),
  ),
});
const ElevenTranscript = Schema.Struct({
  text: Schema.String.check(Schema.isMaxLength(2_000_000)),
  language_code: Schema.String,
  words: Schema.optional(
    Schema.Array(
      Schema.Struct({
        text: Schema.String.check(Schema.isMaxLength(16_000)),
        start: Schema.Number,
        end: Schema.Number,
        speaker_id: Schema.optional(Schema.NullOr(Schema.String)),
        type: Schema.optional(Schema.String),
      }),
    ).check(Schema.isMaxLength(20_000)),
  ),
});
const ElevenEnrollment = Schema.Struct({
  voice_id: Schema.NonEmptyString.check(Schema.isMaxLength(256)),
  requires_verification: Schema.Boolean,
});
const HttpResponse = Schema.Struct({
  status: Schema.Int,
  contentType: Schema.String.check(Schema.isMaxLength(500)),
  requestId: Schema.NullOr(Schema.String.check(Schema.isMaxLength(200))),
  bytes: Schema.Uint8Array,
  bodyTruncated: Schema.optional(Schema.Boolean),
});
export function multipart(
  fields: readonly (readonly [string, string])[],
  fileField: string,
  file: MediaFile,
): { body: Uint8Array; type: string } {
  const boundary = "teamagent-" + randomUUID();
  const pieces: Uint8Array[] = [];
  for (const [key, value] of fields)
    pieces.push(
      Buffer.from(
        "--" +
          boundary +
          '\r\nContent-Disposition: form-data; name="' +
          key +
          '"\r\n\r\n' +
          value +
          "\r\n",
      ),
    );
  const types: Readonly<Record<string, string>> = {
    ".wav": "audio/wav",
    ".mp3": "audio/mpeg",
    ".flac": "audio/flac",
    ".ogg": "audio/ogg",
    ".opus": "audio/ogg",
    ".m4a": "audio/mp4",
    ".mp4": "video/mp4",
    ".webm": "audio/webm",
    ".mpeg": "audio/mpeg",
    ".mpga": "audio/mpeg",
  };
  const type = types[file.extension];
  if (type === undefined)
    throw new MediaHostFailure("unsupported", "This audio upload format is unsupported.");
  pieces.push(
    Buffer.from(
      "--" +
        boundary +
        '\r\nContent-Disposition: form-data; name="' +
        fileField +
        '"; filename="input' +
        file.extension +
        '"\r\nContent-Type: ' +
        type +
        "\r\n\r\n",
    ),
    file.bytes,
    Buffer.from("\r\n--" + boundary + "--\r\n"),
  );
  return { body: Buffer.concat(pieces), type: "multipart/form-data; boundary=" + boundary };
}
export async function providerRequest(
  context: Pick<MediaExecution, "config" | "transport" | "signal" | "authorizeUpload">,
  url: string,
  keyEnv: string,
  header: string,
  type: string,
  body: Uint8Array,
  maximum: number,
  extraHeaders: Readonly<Record<string, string>> = {},
  method: "POST" | "GET" | "DELETE" = "POST",
): Promise<MediaHttpResponse> {
  const key = context.transport.environment(keyEnv);
  if (key === undefined || key.trim() === "" || /[\r\n]/.test(key))
    throw new MediaHostFailure("unavailable", "The configured provider credential is unavailable.");
  if (method === "POST" && body.byteLength > 0) context.authorizeUpload?.();
  const value = await context.transport.request(url, {
    signal: context.signal,
    method,
    timeoutMs: context.config.limits.timeoutMs,
    maxBytes: maximum,
    headers: {
      ...extraHeaders,
      [header]: header === "authorization" ? "Bearer " + key : key,
      "content-type": type,
    },
    body,
  });
  const response = Schema.decodeUnknownSync(HttpResponse)(value);
  if (response.status < 200 || response.status >= 300)
    throw new MediaHttpFailure(classifyMediaHttp(response));
  if (response.bytes.length > maximum)
    throw new MediaHostFailure("limit", "Media provider returned an oversized response.");
  return response;
}
export function requireJson(response: MediaHttpResponse): unknown {
  if (!/^application\/json(?:;|$)/i.test(response.contentType))
    throw new MediaHostFailure("provider", "Media provider did not return JSON.");
  return jsonBytes(response.bytes);
}
export async function executeRemote(context: MediaExecution): Promise<MediaResult> {
  const { plan, config } = context;
  const request = plan.request;
  const identity = { backend: plan.backend.id, model: plan.model };
  const configured = plan.backend.id === "openai" ? config.config.openai : config.config.elevenlabs;
  if (configured === undefined)
    throw new MediaHostFailure("unavailable", "The selected provider is not configured.");
  const openai = plan.backend.id === "openai";
  const origin = openai ? "https://api.openai.com" : "https://api.elevenlabs.io";
  const header = openai ? "authorization" : "xi-api-key";
  if (request.operation === "transcribe") {
    if (context.input === undefined)
      throw new MediaHostFailure("invalid", "An audio input file is required.");
    if (openai && context.input.bytes.length > 25_000_000)
      throw new MediaHostFailure("limit", "OpenAI transcription uploads are limited to 25 MB.");
    if (plan.model === null)
      throw new MediaHostFailure("invalid", "A transcription model is required.");
    const fields: [string, string][] = [[openai ? "model" : "model_id", plan.model]];
    if (request.language !== undefined)
      fields.push([
        openai ? (plan.model === "gpt-transcribe" ? "languages[]" : "language") : "language_code",
        request.language,
      ]);
    if (openai) fields.push(["response_format", "json"]);
    else {
      fields.push(
        ["timestamps_granularity", "word"],
        ["diarize", String(request.diarization ?? false)],
        ["tag_audio_events", "false"],
      );
    }
    const form = multipart(fields, "file", context.input);
    const response = await providerRequest(
      context,
      origin + (openai ? "/v1/audio/transcriptions" : "/v1/speech-to-text"),
      configured.apiKeyEnv,
      header,
      form.type,
      form.body,
      config.limits.processOutputBytes,
    );
    const provenance = { ...context.provenance, providerRequestId: response.requestId };
    if (openai) {
      const data = Schema.decodeUnknownSync(OpenAiTranscript)(requireJson(response));
      return {
        operation: "transcribe",
        ...identity,
        provenance,
        text: data.text,
        language: data.languages?.[0]?.code ?? null,
        timestamps: "none",
        diarization: false,
        segments: [],
      };
    }
    const data = Schema.decodeUnknownSync(ElevenTranscript)(requireJson(response));
    const timing = request.timestamps === "word" || request.diarization === true;
    return {
      operation: "transcribe",
      ...identity,
      provenance,
      text: data.text,
      language: data.language_code,
      timestamps: timing ? "word" : "none",
      diarization: request.diarization === true,
      segments: timing
        ? (data.words ?? [])
            .filter((word) => word.type === undefined || word.type === "word")
            .map((word) => ({
              startSeconds: word.start,
              endSeconds: word.end,
              text: word.text,
              speaker: request.diarization ? (word.speaker_id ?? null) : null,
            }))
        : [],
    };
  }
  if (request.operation === "clone" && !openai) {
    if (context.reference === undefined)
      throw new MediaHostFailure("invalid", "A reference recording is required.");
    if (context.reference.bytes.length > 10 * 1024 * 1024)
      throw new MediaHostFailure(
        "limit",
        "Voice enrollment references are limited to 10 MiB by this adapter.",
      );
    const form = multipart([["name", request.name]], "files", context.reference);
    let response: MediaHttpResponse;
    let data: typeof ElevenEnrollment.Type;
    try {
      response = await providerRequest(
        context,
        origin + "/v1/voices/add",
        configured.apiKeyEnv,
        header,
        form.type,
        form.body,
        config.limits.processOutputBytes,
      );
      data = Schema.decodeUnknownSync(ElevenEnrollment)(requireJson(response));
    } catch (error: unknown) {
      if (
        error instanceof MediaHttpFailure ||
        error instanceof MediaPolicyFailure ||
        (error instanceof MediaHostFailure && error.kind === "unavailable")
      )
        throw error;
      throw new MediaHostFailure(
        "provider",
        "Voice enrollment outcome could not be confirmed. Check the provider account before retrying; no retry was attempted.",
      );
    }
    return {
      operation: "clone",
      ...identity,
      voiceId: data.voice_id,
      requiresVerification: data.requires_verification,
      provenance: {
        ...context.provenance,
        providerRequestId: response.requestId,
        limitations: data.requires_verification
          ? [
              ...context.provenance.limitations,
              "The provider requires voice verification before this enrollment is ready.",
            ]
          : context.provenance.limitations,
      },
    };
  }
  if (request.operation === "synthesize") {
    if (request.reference !== undefined)
      throw new MediaHostFailure(
        "unsupported",
        "This provider adapter requires an enrolled voice ID for synthesis.",
      );
    if (request.text.length > 4096)
      throw new MediaHostFailure(
        "limit",
        "Speech synthesis is limited to 4096 characters per request.",
      );
    const format: AudioFormat = request.format ?? "mp3";
    const destination = await outputPath(config.outputRoot, request.output, format);
    let url: string;
    let body: unknown;
    if (openai) {
      if (
        config.config.openai?.allowLegacySpeech !== true ||
        !["tts-1", "tts-1-hd", "gpt-4o-mini-tts", "gpt-4o-mini-tts-2025-12-15"].includes(
          plan.model ?? "",
        )
      )
        throw new MediaHostFailure(
          "unsupported",
          "The legacy OpenAI speech model must be explicitly enabled and supported.",
        );
      url = origin + "/v1/audio/speech";
      body = {
        model: plan.model,
        input: request.text,
        voice: request.voice ?? "alloy",
        response_format: format,
      };
    } else {
      const voice = request.voice ?? config.config.elevenlabs?.voiceId;
      if (voice === undefined || !/^[A-Za-z0-9_-]{1,200}$/.test(voice))
        throw new MediaHostFailure(
          "invalid",
          "ElevenLabs synthesis requires an explicit voice ID.",
        );
      url =
        origin +
        "/v1/text-to-speech/" +
        encodeURIComponent(voice) +
        "/stream?output_format=" +
        (format === "pcm" ? "pcm_24000" : "mp3_44100_128");
      body = { text: request.text, model_id: plan.model };
    }
    const response = await providerRequest(
      context,
      url,
      configured.apiKeyEnv,
      header,
      "application/json",
      new TextEncoder().encode(JSON.stringify(body)),
      config.limits.outputBytes,
    );
    if (
      !/^audio\//i.test(response.contentType) &&
      response.contentType !== "application/octet-stream"
    )
      throw new MediaHostFailure("provider", "The provider did not return audio.");
    const stage = join(context.stage, "output." + format);
    await writeFile(stage, response.bytes, { flag: "wx", mode: 0o600 });
    return {
      operation: "synthesize",
      ...identity,
      provenance: {
        ...context.provenance,
        providerRequestId: response.requestId,
        limitations:
          format === "pcm"
            ? [
                ...context.provenance.limitations,
                "Raw PCM is signed 16-bit little-endian mono at 24000 Hz.",
              ]
            : context.provenance.limitations,
      },
      artifact: await publishAudio(
        stage,
        destination,
        format,
        config.limits.outputBytes,
        context.signal,
        format === "pcm" ? { encoding: "pcm_s16le", sampleRate: 24000, channels: 1 } : undefined,
      ),
    };
  }
  throw new MediaHostFailure("unsupported", "The selected remote media operation is unsupported.");
}
