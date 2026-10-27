import { MediaHostFailure } from "./transport.ts";

export interface WaveMeasurement {
  readonly durationSeconds: number;
  readonly sampleRate: number;
  readonly channels: number;
}
const ascii = (bytes: Uint8Array, start: number, end: number): string =>
  new TextDecoder("ascii").decode(bytes.subarray(start, end));
/** Validate RIFF chunks and sample layout before measuring PCM/IEEE-float WAVE bytes. */
export function inspectWave(bytes: Uint8Array): WaveMeasurement {
  const fail = () =>
    new MediaHostFailure(
      "unsupported",
      "Reference/output is not a complete supported PCM or IEEE-float WAV. Convert explicitly with media convert INPUT --format wav --sample-rate 24000 --channels 1 --output NEW.wav.",
    );
  if (bytes.byteLength < 44 || ascii(bytes, 0, 4) !== "RIFF" || ascii(bytes, 8, 12) !== "WAVE")
    throw fail();
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  if (view.getUint32(4, true) + 8 !== bytes.byteLength) throw fail();
  let offset = 12;
  let channels = 0;
  let sampleRate = 0;
  let blockAlign = 0;
  let dataBytes = 0;
  let foundFormat = false;
  let foundData = false;
  let count = 0;
  while (offset < bytes.byteLength) {
    if (++count > 4096 || offset + 8 > bytes.byteLength) throw fail();
    const kind = ascii(bytes, offset, offset + 4);
    const length = view.getUint32(offset + 4, true);
    const start = offset + 8;
    const end = start + length;
    if (end > bytes.byteLength) throw fail();
    if (kind === "fmt ") {
      if (
        foundFormat ||
        length < 16 ||
        length === 17 ||
        (length >= 18 && view.getUint16(start + 16, true) + 18 > length)
      )
        throw fail();
      foundFormat = true;
      let format = view.getUint16(start, true);
      channels = view.getUint16(start + 2, true);
      sampleRate = view.getUint32(start + 4, true);
      const rate = view.getUint32(start + 8, true);
      blockAlign = view.getUint16(start + 12, true);
      const bits = view.getUint16(start + 14, true);
      if (format === 65534) {
        if (
          length < 40 ||
          view.getUint16(start + 16, true) < 22 ||
          view.getUint16(start + 18, true) > bits
        )
          throw fail();
        const guid = bytes.subarray(start + 24, start + 40);
        const suffix = [0, 0, 0, 0, 16, 0, 128, 0, 0, 170, 0, 56, 155, 113];
        if (!suffix.every((value, index) => guid[index + 2] === value)) throw fail();
        format = view.getUint16(start + 24, true);
      }
      if (
        (format !== 1 && format !== 3) ||
        channels < 1 ||
        channels > 64 ||
        sampleRate < 8000 ||
        sampleRate > 768000 ||
        !(format === 1 ? [8, 16, 24, 32] : [32, 64]).includes(bits) ||
        blockAlign !== (channels * bits) / 8 ||
        rate !== sampleRate * blockAlign
      )
        throw fail();
    } else if (kind === "data") {
      if (foundData || length === 0) throw fail();
      foundData = true;
      dataBytes = length;
    }
    offset = end + (length % 2);
  }
  if (offset !== bytes.byteLength || !foundFormat || !foundData || dataBytes % blockAlign !== 0)
    throw fail();
  const durationSeconds = dataBytes / (sampleRate * blockAlign);
  if (!Number.isFinite(durationSeconds) || durationSeconds <= 0 || durationSeconds > 86400)
    throw fail();
  return { durationSeconds, sampleRate, channels };
}
function hasMp3Frames(bytes: Uint8Array): boolean {
  let offset = 0;
  if (ascii(bytes, 0, 3) === "ID3") {
    if (bytes.length < 10) return false;
    let size = 0;
    for (const value of bytes.subarray(6, 10)) {
      if (value > 127) return false;
      size = size * 128 + value;
    }
    offset = 10 + size + ((bytes[5] ?? 0) & 16 ? 10 : 0);
  }
  let frames = 0;
  while (frames < 2) {
    if (offset + 4 > bytes.length) return false;
    const first = bytes[offset] ?? 0,
      second = bytes[offset + 1] ?? 0,
      third = bytes[offset + 2] ?? 0;
    const version = (second >> 3) & 3,
      layer = (second >> 1) & 3,
      bitrateIndex = third >> 4,
      rateIndex = (third >> 2) & 3;
    if (
      first !== 255 ||
      (second & 224) !== 224 ||
      version === 1 ||
      layer !== 1 ||
      bitrateIndex === 0 ||
      bitrateIndex === 15 ||
      rateIndex === 3
    )
      return false;
    const bitrates =
      version === 3
        ? [0, 32, 40, 48, 56, 64, 80, 96, 112, 128, 160, 192, 224, 256, 320]
        : [0, 8, 16, 24, 32, 40, 48, 56, 64, 80, 96, 112, 128, 144, 160];
    const bitrate = bitrates[bitrateIndex],
      baseRate = [44100, 48000, 32000][rateIndex];
    if (bitrate === undefined || baseRate === undefined) return false;
    const rate = baseRate / (version === 3 ? 1 : version === 2 ? 2 : 4);
    const length =
      Math.floor(((version === 3 ? 144 : 72) * bitrate * 1000) / rate) + ((third >> 1) & 1);
    if (length < 4 || offset + length > bytes.length) return false;
    offset += length;
    frames += 1;
  }
  return true;
}
export function detectReferenceAudio(bytes: Uint8Array): {
  readonly format: "wav" | "mp3";
  readonly mimeType: "audio/wav" | "audio/mpeg";
  readonly providerMimeType: "audio/x-wav" | "audio/mpeg";
} {
  if (ascii(bytes, 0, 4) === "RIFF") {
    inspectWave(bytes);
    return { format: "wav", mimeType: "audio/wav", providerMimeType: "audio/x-wav" };
  }
  if (hasMp3Frames(bytes))
    return { format: "mp3", mimeType: "audio/mpeg", providerMimeType: "audio/mpeg" };
  throw new MediaHostFailure(
    "unsupported",
    "Reference bytes are not supported WAV or MP3. Conversion is explicit: media convert INPUT --format wav --sample-rate 24000 --channels 1 --output NEW.wav.",
  );
}
