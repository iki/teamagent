import { TextDecoder } from "node:util";
import { Schema } from "effect";

export const maximumInputBytes = 8 * 1024 * 1024;
const decodeChunk = Schema.decodeUnknownSync(Schema.instanceOf(Uint8Array));

/** Bound retained input before appending; decode UTF-8 across arbitrary stream boundaries. */
export async function readInput(
  source: AsyncIterable<unknown>,
  maximumBytes = maximumInputBytes,
): Promise<string> {
  if (!Number.isSafeInteger(maximumBytes) || maximumBytes < 1)
    throw new Error("Invalid input limit");
  const decoder = new TextDecoder("utf-8", { fatal: true, ignoreBOM: true });
  const parts: string[] = [];
  let bytes = 0;
  for await (const value of source) {
    const chunk = decodeChunk(value);
    if (chunk.byteLength > maximumBytes - bytes) throw new Error("Input limit exceeded");
    bytes += chunk.byteLength;
    parts.push(decoder.decode(chunk, { stream: true }));
  }
  parts.push(decoder.decode());
  return parts.join("");
}

/** Decode one bounded line at a time; enforce byte limits before retaining decoded text. */
export async function* readBoundedLines(
  source: AsyncIterable<unknown>,
  limits: { readonly bytes: number; readonly lineBytes: number },
): AsyncGenerator<string> {
  if (![limits.bytes, limits.lineBytes].every((value) => Number.isSafeInteger(value) && value > 0))
    throw new Error("Invalid transcript limits");
  const decoder = new TextDecoder("utf-8", { fatal: true, ignoreBOM: true });
  let bytes = 0;
  let lineBytes = 0;
  let pending = "";
  let skipLineFeed = false;
  const append = (part: Uint8Array) => {
    if (part.byteLength > limits.lineBytes - lineBytes)
      throw new Error("Transcript line byte limit exceeded");
    lineBytes += part.byteLength;
    pending += decoder.decode(part, { stream: true });
  };
  for await (const value of source) {
    const chunk = decodeChunk(value);
    if (chunk.byteLength > limits.bytes - bytes) throw new Error("Transcript byte limit exceeded");
    bytes += chunk.byteLength;
    let start = 0;
    for (let index = 0; index < chunk.byteLength; index++) {
      const byte = chunk[index];
      if (skipLineFeed) {
        skipLineFeed = false;
        if (byte === 10) {
          start = index + 1;
          continue;
        }
      }
      if (byte !== 10 && byte !== 13) continue;
      append(chunk.subarray(start, index));
      pending += decoder.decode();
      yield pending;
      pending = "";
      lineBytes = 0;
      start = index + 1;
      skipLineFeed = byte === 13;
    }
    append(chunk.subarray(start));
  }
  pending += decoder.decode();
  if (pending) yield pending;
}
