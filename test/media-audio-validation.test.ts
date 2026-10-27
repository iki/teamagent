import { test } from "bun:test";
import assert from "node:assert/strict";
import { inspectWave, detectReferenceAudio } from "../app/media/audio.ts";

function wave(): Buffer {
  const bytes = Buffer.alloc(48044);
  bytes.write("RIFF");
  bytes.writeUInt32LE(bytes.length - 8, 4);
  bytes.write("WAVEfmt ", 8);
  bytes.writeUInt32LE(16, 16);
  bytes.writeUInt16LE(1, 20);
  bytes.writeUInt16LE(1, 22);
  bytes.writeUInt32LE(24000, 24);
  bytes.writeUInt32LE(48000, 28);
  bytes.writeUInt16LE(2, 32);
  bytes.writeUInt16LE(16, 34);
  bytes.write("data", 36);
  bytes.writeUInt32LE(48000, 40);
  return bytes;
}
test("WAV measurement uses validated sample layout and does not rewrite reference bytes", () => {
  const bytes = wave(),
    before = Buffer.from(bytes);
  assert.deepEqual(inspectWave(bytes), { durationSeconds: 1, sampleRate: 24000, channels: 1 });
  assert.deepEqual(detectReferenceAudio(bytes), {
    format: "wav",
    mimeType: "audio/wav",
    providerMimeType: "audio/x-wav",
  });
  assert.deepEqual(bytes, before);
});
test("WAV integrity rejects truncation, appended bytes, incomplete frames and invalid format", () => {
  const invalid: Uint8Array[] = [wave().subarray(0, 48), Buffer.concat([wave(), Buffer.from([0])])];
  for (const [offset, value] of [
    [4, 1],
    [28, 12],
    [40, 47999],
    [16, 17],
  ]) {
    assert.ok(offset !== undefined && value !== undefined);
    const bytes = wave();
    bytes.writeUInt32LE(value, offset);
    invalid.push(bytes);
  }
  const badCodec = wave();
  badCodec.writeUInt16LE(7, 20);
  invalid.push(badCodec);
  for (const bytes of invalid) assert.throws(() => inspectWave(bytes), /Convert explicitly/);
});
test("ID3 alone is not accepted as MP3 and filename-like input cannot override actual format", () => {
  assert.throws(
    () => detectReferenceAudio(new TextEncoder().encode("ID3invalid.wav")),
    /Conversion is explicit/,
  );
  assert.throws(
    () => detectReferenceAudio(new TextEncoder().encode("reference.wav")),
    /Conversion is explicit/,
  );
});
