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
