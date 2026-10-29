import { lstat, open, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { Schema } from "effect";
import type { MediaResult } from "@/media";
import { outputPath, publishAudio, readBytes } from "./files.ts";
import { jsonBytes, runLocal, type MediaExecution } from "./local.ts";
import { MediaHostFailure } from "./transport.ts";

/** The published unsharded snapshot layout; presence does not prove model compatibility. */
export const omniVoiceResourceFiles = Object.freeze([
  "config.json",
  "model.safetensors",
  "tokenizer.json",
  "tokenizer_config.json",
  "chat_template.jinja",
  "audio_tokenizer/config.json",
  "audio_tokenizer/model.safetensors",
  "audio_tokenizer/preprocessor_config.json",
]);
async function regularResource(root: string, name: string): Promise<boolean> {
  let path = root;
  for (const component of name.split("/")) {
    path = join(path, component);
    if ((await lstat(path)).isSymbolicLink()) return false;
  }
  const info = await lstat(path);
  if (!info.isFile() || info.size === 0) return false;
  const handle = await open(path, "r");
  try {
    const bytes = Buffer.alloc(128);
    const read = await handle.read(bytes, 0, bytes.byteLength, 0);
    return !bytes
      .subarray(0, read.bytesRead)
      .toString("utf8")
      .startsWith("version https://git-lfs.github.com/spec/v1");
  } finally {
    await handle.close();
  }
}
export async function omniVoiceResourcesReady(settings: {
  readonly packageRoot: string;
  readonly weightsDirectory: string;
}): Promise<boolean> {
  try {
    for (const path of [settings.packageRoot, settings.weightsDirectory]) {
      const info = await lstat(path);
      if (!info.isDirectory() || info.isSymbolicLink()) return false;
    }
    const files = await Promise.allSettled([
      ...["omnivoice/__init__.py", "omnivoice/models/omnivoice.py"].map((name) =>
        regularResource(settings.packageRoot, name),
      ),
      ...omniVoiceResourceFiles.map((name) => regularResource(settings.weightsDirectory, name)),
    ]);
    return files.every((file) => file.status === "fulfilled" && file.value);
  } catch {
    return false;
  }
}
const WorkerReply = Schema.Struct({
  version: Schema.Literal(1),
  sampleRate: Schema.Literal(24000),
  channels: Schema.Literal(1),
  frames: Schema.Int.check(Schema.isBetween({ minimum: 1, maximum: 134_217_728 })),
  network: Schema.Literal("python-sockets-disabled"),
  method: Schema.Literal("from_pretrained-local"),
  packageVersion: Schema.NullOr(
    Schema.String.check(Schema.isPattern(/^[a-zA-Z0-9][a-zA-Z0-9.+_-]{0,63}$/)),
  ),
});
/** The host owns the staging scope and joins subprocess termination before cleanup. */
export async function executeOmniVoice(context: MediaExecution): Promise<MediaResult> {
  const { plan, config, availability } = context;
  const request = plan.request;
  const settings = config.config.omnivoice;
  if (plan.backend.id !== "omnivoice" || request.operation !== "synthesize")
    throw new MediaHostFailure(
      "unsupported",
      "OmniVoice supports reference speech synthesis only.",
    );
  if (settings === undefined || availability.omnivoice === null)
    throw new MediaHostFailure("unavailable", "Configure a complete local OmniVoice installation.");
  if (request.voice !== undefined || (request.format !== undefined && request.format !== "wav"))
    throw new MediaHostFailure(
      "unsupported",
      "OmniVoice uses reference audio and produces WAV output.",
    );
  if (
    context.reference === undefined ||
    request.referenceText === undefined ||
    !request.referenceText.trim()
  )
    throw new MediaHostFailure(
      "invalid",
      "OmniVoice requires reference audio and its transcript; automatic transcription is disabled.",
    );
  if (request.text.length > 4096 || request.referenceText.length > 4096)
    throw new MediaHostFailure(
      "limit",
      "OmniVoice target and reference transcripts are each limited to 4096 characters.",
    );
  if (!(await omniVoiceResourcesReady(settings)))
    throw new MediaHostFailure(
      "unavailable",
      "OmniVoice requires the complete local model, tokenizer and audio codec files.",
    );
  context.signal.throwIfAborted();
  const destination = await outputPath(config.outputRoot, request.output, "wav");
  const source = join(context.stage, "reference" + context.reference.extension);
  const reference = join(context.stage, "normalized-reference.wav");
  await writeFile(source, context.reference.bytes, { flag: "wx", mode: 0o600 });
  await runLocal(context, availability.ffmpeg, [
    "-hide_banner",
    "-nostdin",
    "-loglevel",
    "error",
    "-n",
    "-protocol_whitelist",
    "file,pipe",
    "-format_whitelist",
    "wav,mp3,flac,ogg,mov,matroska,aac",
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
    reference,
  ]);
  await readBytes(reference, config.limits.inputBytes, context.signal);
  const output = join(context.stage, "output.wav");
  const payload = new TextEncoder().encode(
    JSON.stringify({
      version: 1,
      packageRoot: settings.packageRoot,
      weightsDirectory: settings.weightsDirectory,
      device: settings.device ?? "cpu",
      text: request.text,
      reference,
      referenceText: request.referenceText,
      output,
      maximumBytes: config.limits.outputBytes,
    }),
  );
  if (payload.byteLength > 65_536)
    throw new MediaHostFailure("limit", "OmniVoice worker request exceeds its byte limit.");
  const worker = fileURLToPath(new URL("./omnivoice-worker.py", import.meta.url));
  const response = await runLocal(context, availability.omnivoice, ["-I", "-B", worker], payload);
  const reply = Schema.decodeUnknownSync(WorkerReply)(jsonBytes(response), {
    onExcessProperty: "error",
  });
  if (reply.frames * 2 + 4096 > config.limits.outputBytes)
    throw new MediaHostFailure("limit", "OmniVoice output exceeds its byte limit.");
  return {
    operation: "synthesize",
    backend: plan.backend.id,
    model: plan.model,
    provenance: {
      ...context.provenance,
      toolVersion: reply.packageVersion === null ? null : "omnivoice/" + reply.packageVersion,
    },
    artifact: await publishAudio(
      output,
      destination,
      "wav",
      config.limits.outputBytes,
      context.signal,
    ),
  };
}
