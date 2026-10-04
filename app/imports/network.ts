import { lookup } from "node:dns/promises";
import { request as requestHttp, type IncomingMessage } from "node:http";
import { request as requestHttps } from "node:https";
import { isIP } from "node:net";
import { Schema } from "effect";
import { importLimits } from "./limits.ts";

export function publicAddress(address: string): boolean {
  const normalized = address.toLowerCase().replace(/^\[|\]$/g, "");
  if (isIP(normalized) === 4) {
    const parts = normalized.split(".").map(Number);
    const a = parts[0] ?? 0;
    const b = parts[1] ?? 0;
    const c = parts[2] ?? 0;
    return !(
      a === 0 ||
      a === 10 ||
      a === 127 ||
      a >= 224 ||
      (a === 100 && b >= 64 && b <= 127) ||
      (a === 169 && b === 254) ||
      (a === 172 && b >= 16 && b <= 31) ||
      (a === 192 && (b === 168 || (b === 0 && (c === 0 || c === 2)) || (b === 88 && c === 99))) ||
      (a === 198 && (b === 18 || b === 19 || (b === 51 && c === 100))) ||
      (a === 203 && b === 0 && c === 113)
    );
  }
  // Restrict IPv6 to globally routable unicast; reject mapped/translation/tunnel ranges.
  return (
    isIP(normalized) === 6 &&
    /^[23][0-9a-f]{3}:/.test(normalized) &&
    !/^2001:(?:0*:|0*2:|0*db8:|0*1[0-9a-f]:|0*2[0-9a-f]:)/.test(normalized) &&
    !normalized.startsWith("2002:") &&
    !normalized.startsWith("3fff:")
  );
}

export function networkUrl(input: string): URL {
  const url = new URL(input);
  if (
    !["http:", "https:"].includes(url.protocol) ||
    url.username ||
    url.password ||
    url.href.length > 8192
  )
    throw new Error("Use an HTTP(S) URL without embedded credentials");
  url.hash = "";
  return url;
}

export interface HttpResult {
  readonly url: string;
  readonly bytes: Uint8Array;
  readonly mediaType: string;
  readonly etag: string | null;
  readonly lastModified: string | null;
  readonly unchanged: boolean;
}

async function responseBytes(response: IncomingMessage, signal: AbortSignal): Promise<Uint8Array> {
  const chunks: Uint8Array[] = [];
  let size = 0;
  const declared = Number(response.headers["content-length"]);
  if (Number.isFinite(declared) && declared > importLimits.fileBytes) {
    response.destroy();
    throw new Error("Network source exceeds the file byte limit");
  }
  const encoding = response.headers["content-encoding"];
  if (encoding !== undefined && encoding !== "identity") {
    response.destroy();
    throw new Error("Server ignored the identity content-encoding request");
  }
  for await (const dynamic of response) {
    signal.throwIfAborted();
    const chunk: unknown = dynamic;
    const bytes = Schema.decodeUnknownSync(Schema.Uint8Array)(chunk);
    size += bytes.byteLength;
    if (size > importLimits.fileBytes) {
      response.destroy();
      throw new Error("Network source exceeds the file byte limit");
    }
    chunks.push(bytes);
  }
  return Buffer.concat(chunks, size);
}

export async function retrieveHttp(
  locator: string,
  options: {
    signal: AbortSignal;
    allowPrivateNetwork?: boolean;
    etag?: string | null;
    lastModified?: string | null;
  },
): Promise<HttpResult> {
  const signal = AbortSignal.any([options.signal, AbortSignal.timeout(importLimits.networkMs)]);
  let url = networkUrl(locator);
  for (let redirect = 0; redirect <= importLimits.redirects; redirect += 1) {
    signal.throwIfAborted();
    const hostname = url.hostname.replace(/^\[|\]$/g, "");
    const addresses = await lookup(hostname, { all: true, verbatim: true });
    signal.throwIfAborted();
    if (
      addresses.length === 0 ||
      (!options.allowPrivateNetwork && addresses.some((item) => !publicAddress(item.address)))
    )
      throw new Error("URL resolves outside the permitted public network");
    const selected = addresses[0];
    if (selected === undefined) throw new Error("URL has no resolved address");
    const headers: Record<string, string> = {
      "accept-encoding": "identity",
      "user-agent": "TeamAgent-Import/1",
    };
    if (redirect === 0 && options.etag) headers["if-none-match"] = options.etag;
    else if (redirect === 0 && options.lastModified)
      headers["if-modified-since"] = options.lastModified;
    const response = await new Promise<IncomingMessage>((resolve, reject) => {
      const request = (url.protocol === "https:" ? requestHttps : requestHttp)(
        url,
        {
          method: "GET",
          headers,
          signal,
          // Pin the checked DNS result for this connection, preserving Host and TLS SNI.
          lookup: (_host, lookupOptions, callback) => {
            if (lookupOptions.all) callback(null, [selected]);
            else callback(null, selected.address, selected.family);
          },
        },
        resolve,
      );
      request.on("error", reject);
      request.end();
    });
    const status = response.statusCode ?? 0;
    if ([301, 302, 303, 307, 308].includes(status)) {
      response.destroy();
      if (redirect === importLimits.redirects || response.headers.location === undefined)
        throw new Error("URL redirect limit or invalid redirect");
      const next = networkUrl(new URL(response.headers.location, url).href);
      if (url.protocol === "https:" && next.protocol !== "https:")
        throw new Error("HTTPS downgrade is forbidden");
      url = next;
      continue;
    }
    const etag = response.headers.etag?.slice(0, 2048) ?? null;
    const lastModified = response.headers["last-modified"]?.slice(0, 128) ?? null;
    const mediaType = response.headers["content-type"] ?? "application/octet-stream";
    if (status === 304) {
      response.destroy();
      return {
        url: url.href,
        bytes: new Uint8Array(),
        mediaType,
        etag,
        lastModified,
        unchanged: true,
      };
    }
    if (status < 200 || status >= 300) {
      response.destroy();
      throw new Error(`Source returned HTTP ${status}`);
    }
    return {
      url: url.href,
      bytes: await responseBytes(response, signal),
      mediaType,
      etag,
      lastModified,
      unchanged: false,
    };
  }
  throw new Error("URL redirect limit exceeded");
}
