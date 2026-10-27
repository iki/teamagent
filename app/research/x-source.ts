import { lookup } from "node:dns/promises";
import { request } from "node:https";
import type { IncomingMessage } from "node:http";
import { Effect, Schema } from "effect";
import { MemoryError, type CapturedFile, type CaptureResult, type SourceCapture } from "@/memory";
import { publicAddress } from "../imports/network.ts";
import { scopedHostPromise } from "../imports/lifecycle.ts";
import { socialSource } from "./text-contracts.ts";

const Identifier = Schema.String.check(Schema.isPattern(/^[0-9]{1,30}$/));
const PostText = Schema.String.check(Schema.isMaxLength(1000000));
const MediaSchema = Schema.Struct({
  media_key: Schema.String.check(Schema.isMaxLength(128)),
  type: Schema.String.check(Schema.isMaxLength(64)),
  url: Schema.optional(Schema.String.check(Schema.isMaxLength(8192))),
  preview_image_url: Schema.optional(Schema.String.check(Schema.isMaxLength(8192))),
  alt_text: Schema.optional(Schema.String.check(Schema.isMaxLength(10000))),
});
const PayloadSchema = Schema.Struct({
  data: Schema.Struct({
    id: Identifier,
    text: PostText,
    conversation_id: Schema.optional(Identifier),
    note_tweet: Schema.optional(Schema.Struct({ text: PostText })),
    article: Schema.optional(Schema.Unknown),
    attachments: Schema.optional(
      Schema.Struct({
        media_keys: Schema.optional(Schema.Array(Schema.String).check(Schema.isMaxLength(16))),
      }),
    ),
  }),
  includes: Schema.optional(
    Schema.Struct({
      media: Schema.optional(Schema.Array(MediaSchema).check(Schema.isMaxLength(16))),
    }),
  ),
  errors: Schema.optional(Schema.Array(Schema.Unknown).check(Schema.isMaxLength(100))),
});
export interface XResponse {
  readonly bytes: Uint8Array;
  readonly mediaType: string;
}
export type XRequest = (
  url: URL,
  token: string | undefined,
  signal: AbortSignal,
  limit: number,
) => Promise<XResponse>;

/** Credentials only reach the fixed official API host; redirects are never followed. */
export const requestX: XRequest = async (url, token, parentSignal, limit) => {
  if (
    url.protocol !== "https:" ||
    url.port ||
    url.username ||
    url.password ||
    (token ? url.hostname !== "api.x.com" : url.hostname !== "pbs.twimg.com")
  )
    throw new Error("X request origin is not permitted.");
  const signal = AbortSignal.any([parentSignal, AbortSignal.timeout(30000)]);
  const addresses = await lookup(url.hostname, { all: true, verbatim: true });
  signal.throwIfAborted();
  const selected = addresses[0];
  if (!selected || addresses.some((address) => !publicAddress(address.address)))
    throw new Error("X endpoint did not resolve to the public network.");
  const response = await new Promise<IncomingMessage>((resolve, reject) => {
    const operation = request(
      url,
      {
        method: "GET",
        signal,
        headers: {
          "accept-encoding": "identity",
          "user-agent": "Teamagent-Text/1",
          ...(token ? { authorization: `Bearer ${token}` } : {}),
        },
        lookup: (_hostname, options, callback) => {
          if (options.all) callback(null, [selected]);
          else callback(null, selected.address, selected.family);
        },
      },
      resolve,
    );
    operation.on("error", reject);
    operation.end();
  });
  try {
    if ((response.statusCode ?? 0) !== 200)
      throw new Error("X endpoint denied or failed the request.");
    if (response.headers["content-encoding"] && response.headers["content-encoding"] !== "identity")
      throw new Error("Unexpected compressed X response.");
    const size = Number(response.headers["content-length"]);
    if (Number.isFinite(size) && size > limit)
      throw new Error("X response exceeds its byte limit.");
    const chunks: Uint8Array[] = [];
    let bytes = 0;
    for await (const raw of response) {
      signal.throwIfAborted();
      const value: unknown = raw;
      const chunk = Schema.decodeUnknownSync(Schema.Uint8Array)(value);
      bytes += chunk.byteLength;
      if (bytes > limit) throw new Error("X response exceeds its byte limit.");
      chunks.push(chunk);
    }
    return {
      bytes: Buffer.concat(chunks, bytes),
      mediaType:
        (response.headers["content-type"] ?? "application/octet-stream").split(";")[0]?.trim() ??
        "application/octet-stream",
    };
  } finally {
    response.destroy();
  }
};

function imageSignature(bytes: Uint8Array, mediaType: string): boolean {
  const header = new TextDecoder("latin1").decode(bytes.subarray(0, 12));
  if (mediaType === "image/jpeg") return bytes[0] === 255 && bytes[1] === 216 && bytes[2] === 255;
  if (mediaType === "image/png")
    return (
      bytes[0] === 137 &&
      header.slice(1, 4) === "PNG" &&
      bytes[4] === 13 &&
      bytes[5] === 10 &&
      bytes[6] === 26 &&
      bytes[7] === 10
    );
  if (mediaType === "image/webp")
    return header.startsWith("RIFF") && header.slice(8, 12) === "WEBP";
  return mediaType === "image/gif" && /^(?:GIF87a|GIF89a)/.test(header);
}

export function xPostId(locator: string): string | undefined {
  if (!socialSource(locator)) return undefined;
  const match = /^\/(?:[^/]+\/status|i\/web\/status)\/([0-9]{1,30})(?:\/.*)?$/.exec(
    new URL(locator).pathname,
  );
  return match?.[1];
}

/** Returns a capture adapter only when the user explicitly opts into authenticated API requests. */
export function officialXCapture(
  tokenInput: unknown,
  fallback: SourceCapture,
  network: XRequest = requestX,
): SourceCapture {
  const token = Schema.decodeUnknownSync(
    Schema.String.check(
      Schema.isMinLength(1),
      Schema.isMaxLength(8192),
      Schema.isPattern(/^[^\s\p{Cc}]+$/u),
    ),
  )(tokenInput);
  return (capture) => {
    if (!socialSource(capture.locator)) return fallback(capture);
    const id = xPostId(capture.locator);
    if (!id)
      return Effect.fail(
        new MemoryError({
          code: "unsupported",
          message:
            "Official X lookup needs a post status URL; standalone article URLs cannot be inferred as posts.",
        }),
      );
    return scopedHostPromise({
      try: async (signal): Promise<CaptureResult> => {
        const endpoint = new URL(`https://api.x.com/2/tweets/${id}`);
        endpoint.searchParams.set(
          "tweet.fields",
          "created_at,author_id,conversation_id,note_tweet,article,attachments",
        );
        endpoint.searchParams.set("expansions", "attachments.media_keys");
        endpoint.searchParams.set("media.fields", "url,preview_image_url,type,alt_text");
        const response = await network(endpoint, token, signal, 2097152);
        if (response.bytes.byteLength > 2097152) throw new Error("X JSON exceeds its byte limit.");
        const raw = new TextDecoder("utf-8", { fatal: true }).decode(response.bytes);
        const payload = Schema.decodeUnknownSync(Schema.fromJsonString(PayloadSchema))(raw);
        if (payload.data.id !== id) throw new Error("X returned a different post identity.");
        const warnings = [
          "Official X API lookup covers the requested post only. Conversation ID does not prove complete thread, replies, quotes or edit-history coverage.",
        ];
        if (payload.errors?.length)
          warnings.push(
            "The API returned partial errors; requested fields or expansions may be absent. Raw errors are preserved in the original JSON.",
          );
        if (payload.data.article !== undefined)
          warnings.push(
            "Article object preserved in original JSON; its body structure is not documented in the cited field contract and is unsupported by this adapter. Post text is not substituted as the full article.",
          );
        if (!(payload.data.note_tweet?.text ?? payload.data.text).trim())
          warnings.push(
            "No readable post text returned; only metadata and the original JSON are available.",
          );
        const files: CapturedFile[] = [
          {
            path: "originals/x-api.json",
            role: "original",
            mediaType: "application/json",
            bytes: response.bytes,
            origin: endpoint.href,
          },
        ];
        const markdown = [
          `# X post ${id}`,
          "",
          payload.data.note_tweet?.text ?? payload.data.text,
          "",
        ];
        if (payload.data.conversation_id)
          markdown.push(
            `Conversation ID: ${payload.data.conversation_id} (coverage unverified).`,
            "",
          );
        const mediaKeys = new Set(payload.data.attachments?.media_keys ?? []);
        const media = (payload.includes?.media ?? []).filter((item) =>
          mediaKeys.has(item.media_key),
        );
        if (mediaKeys.size !== media.length)
          warnings.push("Some requested media expansions are missing or duplicated.");
        if (media.length > 4)
          warnings.push(
            "Only the first four media assets are attempted; remaining media is explicitly omitted by the byte/asset budget.",
          );
        for (const [index, item] of media.slice(0, 4).entries()) {
          const locator = item.type === "photo" ? item.url : item.preview_image_url;
          if (item.type !== "photo")
            warnings.push(
              "Video/animated media is not downloaded; a preview image is retained when available.",
            );
          if (!locator) {
            warnings.push("A media item has no supported public image URL.");
            continue;
          }
          try {
            const imageUrl = new URL(locator);
            if (
              imageUrl.protocol !== "https:" ||
              imageUrl.hostname !== "pbs.twimg.com" ||
              imageUrl.port ||
              imageUrl.username ||
              imageUrl.password
            )
              throw new Error("Unsupported image origin.");
            const image = await network(imageUrl, undefined, signal, 8388608);
            if (image.bytes.byteLength > 8388608 || !imageSignature(image.bytes, image.mediaType))
              throw new Error("Unsupported image content.");
            const suffix = image.mediaType === "image/jpeg" ? "jpg" : image.mediaType.slice(6);
            const path = `images/media-${index + 1}.${suffix}`;
            files.push({
              path,
              role: "image",
              mediaType: image.mediaType,
              bytes: image.bytes,
              origin: imageUrl.href,
            });
            markdown.push(`![Post media ${index + 1}](${path})`, "");
          } catch {
            signal.throwIfAborted();
            warnings.push(
              "A requested image could not be captured within the public-origin, format, time or size limits.",
            );
          }
        }
        files.push({
          path: "index.md",
          role: "markdown",
          mediaType: "text/markdown",
          bytes: new TextEncoder().encode(markdown.join("\n")),
          origin: capture.locator,
        });
        return {
          status: "captured",
          kind: "url",
          locator: capture.locator,
          files,
          provenance: {
            etag: null,
            lastModified: null,
            repositoryCommit: null,
            parserVersion: "teamagent-x-api@1",
            warnings,
          },
        };
      },
      catch: () =>
        new MemoryError({
          code: "network",
          message:
            "Official X API capture failed: authentication, access tier, response contract, network or source identity could not be validated.",
        }),
    });
  };
}
