import { writeFile } from "node:fs/promises";
import { join } from "node:path";
import { Schema } from "effect";
import type { MediaResult } from "@/media";
import { outputPath, publishAudio } from "./files.ts";
import type { MediaExecution } from "./local.ts";
import { multipart, providerRequest, requireJson } from "./providers.ts";
import { MediaHostFailure, MediaHttpFailure, MediaPolicyFailure } from "./transport.ts";

export const fishSpeechModels = ["s1", "s2-pro", "s2.1-pro", "s2.1-pro-free", "drama-3"] as const;
export const defaultFishSpeechModel = "s2.1-pro";
export interface FishSettings {
  readonly apiKeyEnv: string;
  readonly voiceId?: string | undefined;
  readonly speechModel?: string | undefined;
}
type FishFormat = "wav" | "mp3" | "opus";
const maximumReferenceBytes = 10 * 1024 * 1024;
const EnrollmentResponse = Schema.Struct({
  _id: Schema.String.check(Schema.isPattern(/^[A-Za-z0-9_-]{1,256}$/)),
  state: Schema.Literals(["created", "training", "trained", "failed"]),
  visibility: Schema.Literal("private"),
});
function messagePackString(value: string): Uint8Array {
  const bytes = Buffer.from(value, "utf8");
  let header: Buffer;
  if (bytes.byteLength < 32) header = Buffer.from([0xa0 | bytes.byteLength]);
  else if (bytes.byteLength <= 255) header = Buffer.from([0xd9, bytes.byteLength]);
  else {
    header = Buffer.alloc(3);
    header[0] = 0xda;
    header.writeUInt16BE(bytes.byteLength, 1);
  }
  return Buffer.concat([header, bytes]);
}
function messagePackBinary(bytes: Uint8Array): Uint8Array {
  let header: Buffer;
  if (bytes.byteLength <= 255) header = Buffer.from([0xc4, bytes.byteLength]);
  else if (bytes.byteLength <= 65535) {
    header = Buffer.alloc(3);
    header[0] = 0xc5;
    header.writeUInt16BE(bytes.byteLength, 1);
  } else {
    header = Buffer.alloc(5);
    header[0] = 0xc6;
    header.writeUInt32BE(bytes.byteLength, 1);
  }
  return Buffer.concat([header, bytes]);
}
/**
 * Fixed TTS request encoder, not a general MessagePack serializer.
 * Fish's hosted OpenAPI requires binary MessagePack for inline references.
 * Encodings follow https://github.com/msgpack/msgpack/blob/master/spec.md.
 */
export function encodeFishReferenceRequest(
  text: string,
  format: FishFormat,
  sampleRate: number,
  audio: Uint8Array,
  referenceText: string,
): Uint8Array {
  if (
    text.length === 0 ||
    text.length > 4096 ||
    referenceText.trim().length === 0 ||
    referenceText.length > 4096 ||
    audio.byteLength === 0 ||
    audio.byteLength > maximumReferenceBytes ||
    ![24000, 44100, 48000].includes(sampleRate)
  )
    throw new MediaHostFailure(
      "limit",
      "Fish inline reference request exceeds its bounded format.",
    );
  const rate = Buffer.alloc(3);
  rate[0] = 0xcd;
  rate.writeUInt16BE(sampleRate, 1);
  return Buffer.concat([
    Buffer.from([0x84]),
    messagePackString("text"),
    messagePackString(text),
    messagePackString("format"),
    messagePackString(format),
    messagePackString("sample_rate"),
    rate,
    messagePackString("references"),
    Buffer.from([0x91, 0x82]),
    messagePackString("audio"),
    messagePackBinary(audio),
    messagePackString("text"),
    messagePackString(referenceText),
  ]);
}
export async function executeFish(
  context: MediaExecution,
  settings: FishSettings,
): Promise<MediaResult> {
  const { plan, config } = context;
  const request = plan.request;
  const identity = { backend: plan.backend.id, model: plan.model };
  if (request.operation === "synthesize") {
    if (!fishSpeechModels.some((model) => model === plan.model))
      throw new MediaHostFailure(
        "unsupported",
        "Unknown Fish models are rejected to prevent the provider's silent model fallback.",
      );
    if (request.text.length > 4096)
      throw new MediaHostFailure(
        "limit",
        "Fish synthesis is limited to 4096 characters by this adapter.",
      );
    const format = request.format ?? "mp3";
    if (format !== "wav" && format !== "mp3" && format !== "opus")
      throw new MediaHostFailure("unsupported", "The selected Fish audio format is unsupported.");
    const sampleRate = format === "opus" ? 48000 : 44100;
    const destination = await outputPath(config.outputRoot, request.output, format);
    let body: Uint8Array;
    let contentType: string;
    if (context.reference !== undefined) {
      if (![".wav", ".mp3", ".m4a", ".opus"].includes(context.reference.extension))
        throw new MediaHostFailure(
          "unsupported",
          "This Fish reference audio format is unsupported.",
        );
      if (request.referenceText === undefined || request.referenceText.trim().length === 0)
        throw new MediaHostFailure(
          "invalid",
          "Fish inline reference synthesis requires its transcript.",
        );
      body = encodeFishReferenceRequest(
        request.text,
        format,
        sampleRate,
        context.reference.bytes,
        request.referenceText,
      );
      contentType = "application/msgpack";
    } else {
      const voice = request.voice ?? settings.voiceId;
      if (voice === undefined || !/^[A-Za-z0-9_-]{1,256}$/.test(voice))
        throw new MediaHostFailure(
          "invalid",
          "Fish synthesis requires a voice ID or reference recording.",
        );
      body = new TextEncoder().encode(
        JSON.stringify({
          text: request.text,
          reference_id: voice,
          format,
          sample_rate: sampleRate,
        }),
      );
      contentType = "application/json";
    }
    const response = await providerRequest(
      context,
      "https://api.fish.audio/v1/tts",
      settings.apiKeyEnv,
      "authorization",
      contentType,
      body,
      config.limits.outputBytes,
      { model: plan.model ?? defaultFishSpeechModel },
    );
    if (
      !/^audio\//i.test(response.contentType) &&
      response.contentType !== "application/octet-stream"
    )
      throw new MediaHostFailure("provider", "Fish did not return an audio response.");
    const stage = join(context.stage, "output." + format);
    await writeFile(stage, response.bytes, { flag: "wx", mode: 0o600 });
    return {
      operation: "synthesize",
      ...identity,
      provenance: {
        ...context.provenance,
        providerRequestId: response.requestId,
        limitations: [
          ...context.provenance.limitations,
          ...(context.reference === undefined
            ? []
            : [
                "Inline reference synthesis does not create a managed voice ID; provider request retention is not verified.",
              ]),
        ],
      },
      artifact: await publishAudio(
        stage,
        destination,
        format,
        config.limits.outputBytes,
        context.signal,
      ),
    };
  }
  if (request.operation === "clone") {
    if (context.reference === undefined)
      throw new MediaHostFailure("invalid", "Fish enrollment requires a reference recording.");
    if (![".wav", ".mp3", ".m4a", ".opus"].includes(context.reference.extension))
      throw new MediaHostFailure(
        "unsupported",
        "This Fish enrollment audio format is unsupported.",
      );
    if (context.reference.bytes.byteLength > maximumReferenceBytes)
      throw new MediaHostFailure("limit", "Fish enrollment is limited to 10 MiB by this adapter.");
    const form = multipart(
      [
        ["type", "tts"],
        ["title", request.name],
        ["train_mode", "fast"],
        ["visibility", "private"],
        ["generate_sample", "false"],
      ],
      "voices",
      context.reference,
    );
    try {
      const response = await providerRequest(
        context,
        "https://api.fish.audio/model",
        settings.apiKeyEnv,
        "authorization",
        form.type,
        form.body,
        config.limits.processOutputBytes,
      );
      const data = Schema.decodeUnknownSync(EnrollmentResponse)(requireJson(response));
      if (data.state === "failed")
        throw new MediaHostFailure("provider", "Fish enrollment did not become usable.");
      return {
        operation: "clone",
        ...identity,
        voiceId: data._id,
        requiresVerification: false,
        readiness: data.state === "trained" ? "ready" : "pending",
        provenance: {
          ...context.provenance,
          providerRequestId: response.requestId,
          limitations: [
            ...context.provenance.limitations,
            "This creates a persistent private provider voice model and retains the supplied recording.",
            ...(data.state === "trained"
              ? []
              : ["The voice is still processing; check its provider state before synthesis."]),
          ],
        },
      };
    } catch (error: unknown) {
      if (
        error instanceof MediaHttpFailure ||
        error instanceof MediaPolicyFailure ||
        (error instanceof MediaHostFailure && error.kind === "unavailable")
      )
        throw error;
      throw new MediaHostFailure(
        "provider",
        "Fish private enrollment outcome could not be confirmed. Check the provider account before retrying; no retry was attempted.",
      );
    }
  }
  throw new MediaHostFailure("unsupported", "This Fish operation is unsupported.");
}
