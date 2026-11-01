import { execFile, spawn } from "node:child_process";
import { request } from "node:https";
import { join } from "node:path";
import { lstat } from "node:fs/promises";
import { Schema } from "effect";
import { MediaHttpDiagnosticSchema } from "@/media";
export { MediaHttpDiagnosticSchema } from "@/media";
import { processEnvironment } from "../imports/process.ts";

export class MediaHostFailure extends Error {
  constructor(
    readonly kind:
      | "io"
      | "invalid"
      | "unsupported"
      | "unavailable"
      | "limit"
      | "conflict"
      | "provider",
    message: string,
  ) {
    super(message);
  }
}
export class MediaPolicyFailure extends MediaHostFailure {
  constructor() {
    super("invalid", "Current media training policy blocks content upload.");
  }
}
export interface MediaProcessOptions {
  readonly signal: AbortSignal;
  readonly cwd: string;
  readonly maxBytes: number;
  readonly timeoutMs: number;
  readonly input?: Uint8Array;
  readonly outputs?: readonly { readonly path: string; readonly maxBytes: number }[];
}
export interface MediaDownloadOptions {
  readonly signal: AbortSignal;
  readonly maxBytes: number;
  readonly timeoutMs: number;
}
export interface MediaHttpOptions extends MediaDownloadOptions {
  readonly method?: "POST" | "GET" | "DELETE";
  readonly headers: Readonly<Record<string, string>>;
  readonly body: Uint8Array;
  readonly maxBytes: number;
  readonly timeoutMs: number;
}
export interface MediaHttpResponse {
  readonly status: number;
  readonly contentType: string;
  readonly requestId: string | null;
  readonly bodyTruncated?: boolean | undefined;
  readonly bytes: Uint8Array;
}
export interface MediaTransport {
  readonly process: (
    executable: string,
    args: readonly string[],
    options: MediaProcessOptions,
  ) => Promise<Uint8Array>;
  readonly request: (url: string, options: MediaHttpOptions) => Promise<MediaHttpResponse>;
  readonly download: (url: string, options: MediaDownloadOptions) => Promise<MediaHttpResponse>;
  readonly environment: (name: string) => string | undefined;
}
export function runMediaProcess(
  executable: string,
  args: readonly string[],
  options: MediaProcessOptions,
): Promise<Uint8Array> {
  return new Promise((resolveProcess, reject) => {
    options.signal.throwIfAborted();
    const child = spawn(executable, [...args], {
      cwd: options.cwd,
      env: processEnvironment(),
      shell: false,
      windowsHide: true,
      // Preserve POSIX process groups without enabling Bun's visible Windows detach path.
      detached: process.platform !== "win32",
      stdio: ["pipe", "pipe", "pipe"],
    });
    const chunks: Uint8Array[] = [];
    let size = 0;
    let errors = 0;
    let failed = false;
    let closed = false;
    let termination: Promise<void> | undefined;
    const terminate = () => {
      failed = true;
      if (closed || termination !== undefined) return;
      const pid = child.pid;
      termination = new Promise<void>((done) => {
        if (pid === undefined) {
          done();
          return;
        }
        if (process.platform === "win32") {
          execFile(
            join(process.env.SystemRoot ?? "C:\\Windows", "System32", "taskkill.exe"),
            ["/PID", String(pid), "/T", "/F"],
            { windowsHide: true, timeout: 10_000, maxBuffer: 16_384, env: processEnvironment() },
            () => {
              child.kill("SIGKILL");
              done();
            },
          );
        } else {
          try {
            process.kill(-pid, "SIGKILL");
          } catch {
            child.kill("SIGKILL");
          }
          done();
        }
      });
    };
    const checkOutputs = async () => {
      for (const output of options.outputs ?? []) {
        try {
          const info = await lstat(output.path);
          if (!info.isFile() || info.isSymbolicLink() || info.size > output.maxBytes) terminate();
        } catch (error: unknown) {
          if (!(error instanceof Error && "code" in error && error.code === "ENOENT")) terminate();
        }
      }
    };
    let checking: Promise<void> | undefined;
    const watcher = setInterval(() => {
      if (checking === undefined)
        checking = checkOutputs().finally(() => {
          checking = undefined;
        });
    }, 100);
    const timer = setTimeout(terminate, options.timeoutMs);
    options.signal.addEventListener("abort", terminate, { once: true });
    child.stdout.on("data", (dynamic: unknown) => {
      try {
        const bytes = Schema.decodeUnknownSync(Schema.Uint8Array)(dynamic);
        size += bytes.byteLength;
        if (size > options.maxBytes) terminate();
        else chunks.push(bytes);
      } catch {
        terminate();
      }
    });
    child.stderr.on("data", (dynamic: unknown) => {
      try {
        errors += Schema.decodeUnknownSync(Schema.Uint8Array)(dynamic).byteLength;
        if (errors > options.maxBytes) terminate();
      } catch {
        terminate();
      }
    });
    child.stdin.on("error", () => {
      failed = true;
    });
    child.on("error", () => {
      failed = true;
    });
    child.on("close", (code) => {
      closed = true;
      clearInterval(watcher);
      clearTimeout(timer);
      options.signal.removeEventListener("abort", terminate);
      void Promise.resolve(checking)
        .then(checkOutputs)
        .then(() => termination)
        .then(() => {
          if (failed || code !== 0 || options.signal.aborted)
            reject(
              new MediaHostFailure(
                "io",
                "Media process failed, was cancelled, or exceeded its limit.",
              ),
            );
          else resolveProcess(Buffer.concat(chunks, size));
        });
    });
    child.stdin.end(options.input);
    if (options.signal.aborted) terminate();
  });
}
export type MediaHttpDiagnostic = typeof MediaHttpDiagnosticSchema.Type;
const diagnosticMessages: Readonly<Record<MediaHttpDiagnostic["category"], string>> = {
  authentication: "Provider authentication failed. Check the configured credential.",
  permission: "Provider denied access. Check account permissions, plan and resource ownership.",
  "voice-not-ready": "The provider voice is not ready. Reconcile its status before synthesis.",
  "rate-limit": "Provider rate limit reached. No retry was attempted.",
  transient:
    "Provider returned a transient failure. The operation outcome may be uncertain; no retry was attempted.",
  "bad-request": "Provider rejected the request format or parameters.",
  "not-found": "Provider resource was not found.",
  redirect: "Provider redirects are forbidden.",
  network: "Provider connection failed. The operation outcome may be uncertain.",
  timeout: "Provider request timed out. The operation outcome may be uncertain.",
  cancelled: "Provider request was cancelled. The operation outcome may be uncertain.",
  "malformed-response": "Provider response could not be interpreted safely.",
  unknown: "Provider request failed for an unclassified reason.",
};
// Finite diagnostic vocabulary: unrecognized provider values are omitted, not echoed.
const diagnosticProviderCodes = new Set([
  "invalid_parameter",
  "invalid_request",
  "invalid_api_key",
  "authentication_error",
  "unauthorized",
  "permission_denied",
  "forbidden",
  "model_not_found",
  "voice_not_found",
  "voice_not_ready",
  "voice_not_active",
  "voice_pending",
  "voice_processing",
  "voice_training",
  "rate_limit_exceeded",
  "insufficient_quota",
  "quota_exceeded",
  "not_found",
  "validation_error",
  "internal_server_error",
  "service_unavailable",
]);
function safeProviderCode(value: unknown): string | null {
  return typeof value === "string" && diagnosticProviderCodes.has(value) ? value : null;
}
export function sanitizeMediaDiagnostic(input: MediaHttpDiagnostic): MediaHttpDiagnostic {
  const value = Schema.decodeUnknownSync(MediaHttpDiagnosticSchema)(input, {
    onExcessProperty: "error",
  });
  return {
    ...value,
    providerCode: safeProviderCode(value.providerCode),
    providerMessage:
      value.providerMessage === null
        ? null
        : /^Content type not match audio\/(?:wav|x-wav) != audio\/(?:wav|x-wav)$/.test(
              value.providerMessage,
            )
          ? value.providerMessage
          : "Provider message redacted because it may contain request data.",
    contentType:
      value.contentType !== null &&
      /^[a-z0-9!#$&^_.+-]+\/[a-z0-9!#$&^_.+-]+(?:;\s*charset=[a-z0-9-]+)?$/i.test(value.contentType)
        ? value.contentType
        : null,
  };
}
export class MediaHttpFailure extends MediaHostFailure {
  readonly diagnostic: MediaHttpDiagnostic;
  constructor(input: MediaHttpDiagnostic) {
    const diagnostic = sanitizeMediaDiagnostic(input);
    super("provider", diagnosticMessages[diagnostic.category]);
    this.diagnostic = diagnostic;
  }
}
export function safeProviderId(value: unknown): string | null {
  return typeof value === "string" && /^[A-Za-z0-9][A-Za-z0-9_-]{0,199}$/.test(value)
    ? value
    : null;
}
export function mediaHttpDetails(
  response: MediaHttpResponse,
): Pick<MediaHttpDiagnostic, "providerCode" | "providerMessage" | "contentType"> {
  const contentType =
    /^[a-z0-9!#$&^_.+-]+\/[a-z0-9!#$&^_.+-]+(?:;\s*charset=[a-z0-9-]+)?$/i.test(
      response.contentType,
    ) && response.contentType.length <= 128
      ? response.contentType
      : null;
  let providerCode: string | null = null;
  let providerMessage: string | null = null;
  try {
    if (response.bytes.byteLength > 65_536) return { providerCode, providerMessage, contentType };
    const dynamic: unknown = JSON.parse(
      new TextDecoder("utf-8", { fatal: true }).decode(response.bytes),
    );
    const fields = Schema.decodeUnknownSync(Schema.Record(Schema.String, Schema.Unknown))(dynamic);
    let nested: Readonly<Record<string, unknown>> = fields;
    if (fields.error !== undefined && typeof fields.error !== "string")
      nested = Schema.decodeUnknownSync(Schema.Record(Schema.String, Schema.Unknown))(fields.error);
    const code = nested.code ?? fields.code;
    providerCode = safeProviderCode(code);
    const message =
      nested.message ??
      fields.message ??
      (typeof fields.error === "string" ? fields.error : undefined);
    if (typeof message === "string")
      providerMessage =
        /^Content type not match audio\/(?:wav|x-wav) != audio\/(?:wav|x-wav)$/.test(message)
          ? message
          : "Provider message redacted because it may contain request data.";
  } catch {
    /* Malformed bodies are classified by status without reflecting source text. */
  }
  return { providerCode, providerMessage, contentType };
}
export function classifyMediaHttp(response: MediaHttpResponse): MediaHttpDiagnostic {
  let category: MediaHttpDiagnostic["category"] =
    response.status === 401
      ? "authentication"
      : response.status === 403
        ? "permission"
        : response.status === 429
          ? "rate-limit"
          : response.status >= 500
            ? "transient"
            : response.status >= 300 && response.status < 400
              ? "redirect"
              : response.status === 404
                ? "not-found"
                : response.status >= 400 && response.status < 500
                  ? "bad-request"
                  : "unknown";
  const details = mediaHttpDetails(response);
  if (
    [
      "voice_not_ready",
      "voice_not_active",
      "voice_pending",
      "voice_processing",
      "voice_training",
    ].includes(details.providerCode ?? "")
  )
    category = "voice-not-ready";
  return {
    ...details,
    category,
    status: response.status >= 100 && response.status <= 599 ? response.status : null,
    requestId: safeProviderId(response.requestId),
    retryable: category === "rate-limit" || category === "transient",
    bodyTruncated: response.bodyTruncated ?? false,
  };
}
export function mediaArtifactUrl(urlText: string): string {
  let url: URL;
  try {
    url = new URL(urlText);
  } catch {
    throw new MediaHostFailure("invalid", "Media artifact URL is not allowed.");
  }
  const allowed =
    (url.origin === "https://files.heygen.ai" && url.pathname.startsWith("/generated/")) ||
    (url.origin === "https://resource2.heygen.ai" && url.pathname.startsWith("/text_to_speech/"));
  if (
    urlText.length > 8192 ||
    !allowed ||
    url.username ||
    url.password ||
    url.hash ||
    /[\\\p{Cc}]/u.test(urlText) ||
    /%2e|%2f|%5c|%00|%25/i.test(urlText.split(/[?#]/)[0] ?? "")
  )
    throw new MediaHostFailure("invalid", "Media artifact URL is not allowed.");
  return url.href;
}
export async function requestMedia(
  urlText: string,
  options: MediaHttpOptions,
): Promise<MediaHttpResponse> {
  let url: URL;
  try {
    url = new URL(urlText);
  } catch {
    throw new MediaHostFailure("invalid", "Media provider origin is not allowed.");
  }
  if (
    ![
      "https://api.openai.com",
      "https://api.elevenlabs.io",
      "https://api.heygen.com",
      "https://api.fish.audio",
    ].includes(url.origin) ||
    url.username ||
    url.password ||
    url.hash
  )
    throw new MediaHostFailure("invalid", "Media provider origin is not allowed.");
  const method = options.method ?? "POST";
  if (
    method !== "POST" &&
    !(
      url.origin === "https://api.heygen.com" &&
      (/^\/v3\/models\/audio\/voices(?:\/[A-Za-z0-9_-]{1,256})?$/.test(url.pathname) ||
        (method === "GET" && ["/v3/api_keys/self", "/v3/users/me"].includes(url.pathname)))
    )
  )
    throw new MediaHostFailure(
      "invalid",
      "This authenticated media endpoint does not permit the selected method.",
    );
  if (
    method === "DELETE" &&
    !/^\/v3\/models\/audio\/voices\/[A-Za-z0-9_-]{1,256}$/.test(url.pathname)
  )
    throw new MediaHostFailure("invalid", "A specific voice ID is required for deletion.");
  if (method !== "POST" && options.body.byteLength > 0)
    throw new MediaHostFailure("invalid", "Media read/delete requests cannot contain a body.");
  return exchangeMedia(
    url,
    options,
    method,
    options.headers,
    method === "POST" ? options.body : undefined,
  );
}
/** No credentials, cookies, redirects or arbitrary origins on artifact downloads. */
export async function downloadMedia(
  urlText: string,
  options: MediaDownloadOptions,
): Promise<MediaHttpResponse> {
  return exchangeMedia(new URL(mediaArtifactUrl(urlText)), options, "GET", {});
}
async function exchangeMedia(
  url: URL,
  options: MediaDownloadOptions,
  method: "POST" | "GET" | "DELETE",
  headers: Readonly<Record<string, string>>,
  body?: Uint8Array,
): Promise<MediaHttpResponse> {
  const timeout = AbortSignal.timeout(options.timeoutMs);
  const signal = AbortSignal.any([options.signal, timeout]);
  const status = null;
  const requestId = null;
  const networkFailure = () =>
    new MediaHttpFailure({
      category: options.signal.aborted ? "cancelled" : timeout.aborted ? "timeout" : "network",
      status,
      requestId,
      providerCode: null,
      providerMessage: null,
      contentType: null,
      retryable: false,
      bodyTruncated: false,
    });
  let response: import("node:http").IncomingMessage;
  try {
    response = await new Promise<import("node:http").IncomingMessage>((resolveResponse, reject) => {
      const outgoing = request(
        url,
        {
          method,
          signal,
          headers: {
            ...headers,
            ...(body === undefined ? {} : { "content-length": String(body.byteLength) }),
            "accept-encoding": "identity",
          },
        },
        resolveResponse,
      );
      outgoing.on("error", () => reject(networkFailure()));
      outgoing.end(body);
    });
  } catch {
    throw networkFailure();
  }
  return collectMediaResponse(response, { ...options, signal }, () => timeout.aborted);
}
/** Shared bounded native response collector, exported for credential-free stream fixtures. */
export async function collectMediaResponse(
  response: import("node:http").IncomingMessage,
  options: MediaDownloadOptions,
  timedOut: () => boolean = () => false,
): Promise<MediaHttpResponse> {
  const signal = options.signal;
  const status = response.statusCode ?? null;
  const requestId = safeProviderId(
    response.headers["x-request-id"] ?? response.headers["request-id"],
  );
  const networkFailure = () =>
    new MediaHttpFailure({
      category: timedOut() ? "timeout" : signal.aborted ? "cancelled" : "network",
      status,
      requestId,
      providerCode: null,
      providerMessage: null,
      contentType: null,
      retryable: false,
      bodyTruncated: false,
    });
  const successful = status !== null && status >= 200 && status < 300;
  const maximum = successful ? options.maxBytes : Math.min(options.maxBytes, 65_536);
  const declared = Number(response.headers["content-length"]);
  if (successful && Number.isFinite(declared) && declared > maximum) {
    response.destroy();
    throw new MediaHostFailure("limit", "Media response exceeds the byte limit.");
  }
  if (
    response.headers["content-encoding"] !== undefined &&
    response.headers["content-encoding"] !== "identity"
  ) {
    response.destroy();
    if (successful)
      throw new MediaHttpFailure({
        category: "malformed-response",
        status,
        requestId,
        providerCode: null,
        providerMessage: null,
        contentType: null,
        retryable: false,
        bodyTruncated: true,
      });
    return {
      status: status ?? 0,
      requestId,
      contentType: response.headers["content-type"] ?? "",
      bytes: new Uint8Array(),
      bodyTruncated: true,
    };
  }
  const chunks: Uint8Array[] = [];
  let size = 0;
  let bodyTruncated = false;
  try {
    for await (const dynamic of response) {
      signal.throwIfAborted();
      const value: unknown = dynamic;
      const bytes = Schema.decodeUnknownSync(Schema.Uint8Array)(value);
      if (size + bytes.byteLength > maximum) {
        if (successful)
          throw new MediaHostFailure("limit", "Media response exceeds the byte limit.");
        chunks.push(bytes.subarray(0, maximum - size));
        size = maximum;
        bodyTruncated = true;
        break;
      }
      size += bytes.byteLength;
      chunks.push(bytes);
    }
  } catch (error: unknown) {
    if (error instanceof MediaHostFailure) throw error;
    throw networkFailure();
  } finally {
    response.destroy();
  }
  return {
    status: status ?? 0,
    contentType: response.headers["content-type"] ?? "",
    requestId,
    bytes: Buffer.concat(chunks, size),
    bodyTruncated,
  };
}
export const defaultMediaTransport: MediaTransport = {
  process: runMediaProcess,
  request: requestMedia,
  download: downloadMedia,
  environment: (name) => process.env[name],
};
