import { access, lstat, realpath } from "node:fs/promises";
import { basename, dirname, extname, join } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { Effect } from "effect";
import {
  MemoryError,
  type CaptureRequest,
  type CaptureResult,
  type CapturedFile,
  type Provenance,
  type SourceCapture,
  type ExtractorProfile,
  type ExtractionProvenance,
} from "@/memory";
import { convertDocument, parserVersion } from "./documents.ts";
import { extractorProfileIdentity } from "./extractors.ts";
import { authorizeLocal, collectFolder, originalName, readLocalFile } from "./files.ts";
import { captureGit } from "./git.ts";
import { contained, digest, importLimits, safeRelative, sourceMediaType } from "./limits.ts";
import { networkUrl, retrieveHttp } from "./network.ts";

export interface CaptureOptions {
  readonly allowPrivateNetwork?: boolean;
  readonly allowedRoots?: readonly string[];
  readonly python?: string;
  readonly extractor?: ExtractorProfile;
}

const handlerVersions = {
  text: "teamagent-import/text/1",
  image: "teamagent-import/image/1",
  raw: "teamagent-import/raw/1",
} as const;

/** This fingerprint is known before retrieval, including versions of fallback handlers. */
function routingPolicy(convert: boolean, extractor: ExtractorProfile | undefined): string {
  return `teamagent-routing/1;${digest(
    JSON.stringify({
      convert,
      builtin: parserVersion,
      handlers: handlerVersions,
      external:
        convert && extractor !== undefined && extractor.engine !== "builtin"
          ? extractorProfileIdentity(extractor)
          : null,
    }),
  )}`;
}

function assertBudget(files: readonly CapturedFile[]): void {
  if (
    files.length > importLimits.files ||
    files.some((file) => file.bytes.byteLength > importLimits.fileBytes) ||
    files.reduce((sum, file) => sum + file.bytes.byteLength, 0) > importLimits.totalBytes
  )
    throw new Error("Capture representation budget exceeded");
}

async function isGitFolder(path: string): Promise<boolean> {
  try {
    await access(join(path, ".git"));
    return true;
  } catch {
    try {
      await access(join(path, "HEAD"));
      await access(join(path, "objects"));
      return true;
    } catch {
      return false;
    }
  }
}

async function acquire(
  request: CaptureRequest,
  options: CaptureOptions,
  signal: AbortSignal,
): Promise<CaptureResult> {
  let kind = request.kind;
  const provenance: Provenance = {
    etag: null,
    lastModified: null,
    repositoryCommit: null,
    parserVersion: request.convert
      ? options.extractor === undefined
        ? parserVersion
        : extractorProfileIdentity(options.extractor)
      : "teamagent-import/raw/1",
    extraction: { policy: routingPolicy(request.convert, options.extractor), parsers: [] },
    warnings: [],
  };
  const http = /^https?:[/][/]/i.test(request.locator);
  if (kind === "auto" && http)
    kind = new URL(request.locator).pathname.endsWith(".git") ? "git" : "url";
  if (kind === "git") {
    const result = await captureGit(request, { ...options, signal });
    return {
      status: "captured",
      kind,
      locator: result.locator,
      files: result.files,
      provenance: { ...provenance, repositoryCommit: result.commit, warnings: result.warnings },
    };
  }
  if (kind === "url") {
    const previous = request.previous;
    const conditional =
      !request.convert &&
      previous !== undefined &&
      previous.provenance.extraction?.policy === provenance.extraction?.policy &&
      previous.files.length === 1 &&
      previous.files[0]?.mediaType !== "text/html";
    let response = await retrieveHttp(request.locator, {
      ...options,
      signal,
      ...(conditional
        ? { etag: previous.provenance.etag, lastModified: previous.provenance.lastModified }
        : {}),
    });
    if (response.unchanged) {
      if (conditional)
        return {
          status: "unchanged",
          provenance: {
            ...previous.provenance,
            etag: response.etag ?? previous.provenance.etag,
            lastModified: response.lastModified ?? previous.provenance.lastModified,
          },
        };
      response = await retrieveHttp(request.locator, { ...options, signal });
      if (response.unchanged) throw new Error("Server returned 304 without usable prior content");
    }
    const url = networkUrl(response.url);
    const name = originalName(decodeURIComponent(url.pathname.split("/").at(-1) || "page.html"));
    const mediaType = sourceMediaType(name, response.bytes, response.mediaType);
    return {
      status: "captured",
      kind,
      locator: networkUrl(request.locator).href,
      files: [
        {
          path: `original/${name}`,
          mediaType,
          bytes: response.bytes,
          role: "original",
          origin: url.href,
        },
      ],
      provenance: { ...provenance, etag: response.etag, lastModified: response.lastModified },
    };
  }
  if (http) throw new Error("HTTP source requires url or git kind");
  const path = await authorizeLocal(request.locator, request, options.allowedRoots);
  const info = await lstat(path);
  if (kind === "auto") {
    if (info.isDirectory()) {
      if (await isGitFolder(path)) return acquire({ ...request, kind: "git" }, options, signal);
      kind = "folder";
    } else kind = "file";
  }
  if (kind === "folder") {
    if (!info.isDirectory()) throw new Error("Folder source is not a directory");
    const result = await collectFolder(path, signal, request.dataDirectory);
    return {
      status: "captured",
      kind,
      locator: path,
      files: result.files,
      provenance: { ...provenance, lastModified: result.modified, warnings: result.warnings },
    };
  }
  if (kind !== "file" || !info.isFile()) throw new Error("File source is not a regular file");
  const file = await readLocalFile(path, signal);
  const name = originalName(path);
  return {
    status: "captured",
    kind,
    locator: path,
    files: [
      {
        path: `original/${name}`,
        mediaType: sourceMediaType(name, file.bytes),
        bytes: file.bytes,
        role: "original",
        origin: pathToFileURL(path).href,
      },
    ],
    provenance: { ...provenance, lastModified: file.modified },
  };
}

async function imageLink(
  url: string,
  parent: CapturedFile,
  request: CaptureRequest,
  capture: Extract<CaptureResult, { status: "captured" }>,
  options: CaptureOptions,
  signal: AbortSignal,
): Promise<{ bytes: Uint8Array; mediaType: string; origin: string; extension: string }> {
  let bytes: Uint8Array;
  let origin = url;
  let name: string;
  let declared: string | undefined;
  if (capture.kind === "git" && new URL(url).hostname === "snapshot.invalid") {
    const path = decodeURIComponent(new URL(url).pathname).replace(/^[/]/, "");
    if (!safeRelative(path)) throw new Error("Invalid snapshot image path");
    const original = capture.files.find((file) => file.path === `original/${path}`);
    if (original === undefined)
      throw new Error("Image is absent from the committed repository snapshot");
    bytes = original.bytes;
    name = original.path;
    declared = original.mediaType;
    origin = original.origin ?? capture.locator;
  } else if (url.startsWith("file:") && parent.origin?.startsWith("file:")) {
    const root = await realpath(dirname(fileURLToPath(parent.origin)));
    const path = await authorizeLocal(url, request, options.allowedRoots);
    if (!contained(root, path)) throw new Error("Page image escapes its source directory");
    bytes = (await readLocalFile(path, signal)).bytes;
    name = path;
  } else {
    const response = await retrieveHttp(url, { ...options, signal });
    if (response.unchanged) throw new Error("Image response has no content");
    bytes = response.bytes;
    origin = response.url;
    name = new URL(response.url).pathname;
    declared = response.mediaType;
  }
  const mediaType = sourceMediaType(name, bytes, declared);
  if (!mediaType.startsWith("image/")) throw new Error("Page image response is not an image");
  const extension = extname(name).toLowerCase();
  return {
    bytes,
    origin,
    mediaType,
    extension: /^\.[a-z0-9]{1,8}$/.test(extension) ? extension : ".img",
  };
}

async function representations(
  request: CaptureRequest,
  capture: Extract<CaptureResult, { status: "captured" }>,
  options: CaptureOptions,
  signal: AbortSignal,
): Promise<CaptureResult> {
  const files = [...capture.files];
  const warnings = [...capture.provenance.warnings];
  const parsers = new Set<string>();
  for (const original of capture.files) {
    signal.throwIfAborted();
    const prefix = `converted/${digest(original.path).slice(0, 24)}`;
    const origin = original.origin ?? capture.locator;
    const selectedExternal =
      request.convert &&
      options.extractor !== undefined &&
      options.extractor.engine !== "builtin" &&
      (options.extractor.mediaTypes ?? ["application/pdf"]).includes(original.mediaType);
    if (original.mediaType.startsWith("image/") && !selectedExternal) {
      if (request.convert) {
        files.push({
          ...original,
          path: `${prefix}/assets/${basename(original.path)}`,
          role: "image",
        });
        files.push({
          path: `${prefix}/document.md`,
          role: "markdown",
          mediaType: "text/markdown",
          origin,
          bytes: new TextEncoder().encode(
            `![Imported image](assets/${encodeURI(basename(original.path))})\n\nImage preserved without OCR or generated description.\n`,
          ),
        });
        parsers.add(handlerVersions.image);
      }
    } else if (
      selectedExternal ||
      ["text/html", "text/markdown"].includes(original.mediaType) ||
      (request.convert &&
        [
          "application/pdf",
          "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
          "application/vnd.openxmlformats-officedocument.presentationml.presentation",
          "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        ].includes(original.mediaType))
    ) {
      try {
        const conversionOrigin =
          capture.kind === "git"
            ? `https://snapshot.invalid/${original.path.slice("original/".length).split("/").map(encodeURIComponent).join("/")}`
            : origin;
        const result = await convertDocument({
          bytes: original.bytes,
          name: original.path,
          mediaType: original.mediaType,
          origin: conversionOrigin,
          directory: request.temporaryDirectory,
          signal,
          ...(options.python === undefined ? {} : { python: options.python }),
          ...(options.extractor === undefined || !request.convert
            ? {}
            : { extractor: options.extractor }),
        });
        parsers.add(result.parserVersion);
        let markdown = result.markdown;
        for (const diagnostic of result.warnings) warnings.push(`${original.path}: ${diagnostic}`);
        for (const image of result.images) {
          const bytes = Buffer.from(image.base64, "base64");
          if (!image.name.startsWith(digest(bytes)))
            throw new Error("Extracted image checksum mismatch");
          files.push({
            path: `${prefix}/assets/${image.name}`,
            role: "image",
            mediaType: image.mediaType,
            bytes,
            origin,
          });
          assertBudget(files);
        }
        const seen = new Set<string>();
        for (const link of result.links) {
          if (seen.has(link.reference)) continue;
          seen.add(link.reference);
          try {
            const image = await imageLink(link.url, original, request, capture, options, signal);
            const reference = `assets/${digest(image.bytes)}${image.extension}`;
            const path = `${prefix}/${reference}`;
            if (!files.some((file) => file.path === path))
              files.push({
                path,
                role: "image",
                mediaType: image.mediaType,
                bytes: image.bytes,
                origin: image.origin,
              });
            assertBudget(files);
            markdown = markdown.replaceAll(link.reference, reference);
          } catch {
            signal.throwIfAborted();
            if (request.previous?.files.some((file) => file.role === "image"))
              throw new MemoryError({
                code: "network",
                message: "Image refresh failed; the previous complete source version is retained.",
              });
            warnings.push(
              `${original.path}: A referenced image could not be retrieved under the import policy`,
            );
            markdown = markdown.replaceAll(link.reference, "#image-unavailable");
          }
        }
        if (request.convert)
          files.push({
            path: `${prefix}/document.md`,
            role: "markdown",
            mediaType: "text/markdown",
            bytes: new TextEncoder().encode(markdown),
            origin,
          });
      } catch (error) {
        signal.throwIfAborted();
        if (error instanceof MemoryError) throw error;
        if (request.previous?.files.some((file) => file.role !== "original"))
          throw new MemoryError({
            code: "unsupported",
            message: "Conversion refresh failed; the previous complete source version is retained.",
          });
        warnings.push(
          `${original.path}: Conversion failed or converter is unavailable; original retained. Run memory doctor for worker status`,
        );
      }
    } else if (
      request.convert &&
      (original.mediaType.startsWith("text/") ||
        ["application/json", "application/xml"].includes(original.mediaType))
    ) {
      try {
        const content = new TextDecoder("utf-8", { fatal: true, ignoreBOM: true }).decode(
          original.bytes,
        );
        if (content.includes("\0")) throw new Error("Binary data was mislabeled as text");
        files.push({
          path: `${prefix}/document.md`,
          role: "markdown",
          mediaType: "text/markdown",
          bytes: original.bytes,
          origin,
        });
        parsers.add(handlerVersions.text);
      } catch {
        warnings.push(`${original.path}: Text conversion requires valid UTF-8; original retained`);
      }
    } else if (request.convert)
      warnings.push(`${original.path}: Unsupported conversion format; original retained`);
    assertBudget(files);
    if (warnings.length > 256) throw new Error("Import warning manifest limit exceeded");
  }
  for (const file of files) if (!safeRelative(file.path)) throw new Error("Invalid captured path");
  const extraction: ExtractionProvenance = {
    policy: routingPolicy(request.convert, options.extractor),
    parsers: [...parsers].sort(),
  };
  const identity =
    request.convert && options.extractor !== undefined && options.extractor.engine !== "builtin"
      ? `teamagent-capture/1;${digest(JSON.stringify(extraction))}`
      : capture.provenance.parserVersion;
  return {
    ...capture,
    files,
    provenance: { ...capture.provenance, parserVersion: identity, extraction, warnings },
  };
}

export function createSourceCapture(options: CaptureOptions = {}): SourceCapture {
  return (request) =>
    Effect.acquireUseRelease(
      Effect.sync(() => {
        const controller = new AbortController();
        const captureTimeout =
          options.extractor === undefined || options.extractor.engine === "builtin"
            ? 120_000
            : Math.max(120_000, (options.extractor.timeoutMs ?? 60_000) + 30_000);
        const signal = AbortSignal.any([controller.signal, AbortSignal.timeout(captureTimeout)]);
        const work = (async () => {
          const capture = await acquire(request, options, signal);
          if (capture.status === "unchanged") return capture;
          assertBudget(capture.files);
          return representations(request, capture, options, signal);
        })();
        return { controller, work };
      }),
      ({ work }) =>
        Effect.tryPromise({
          try: () => work,
          catch: (error) =>
            error instanceof MemoryError
              ? error
              : new MemoryError({
                  code: "invalid",
                  message:
                    "Source retrieval failed, was cancelled, exceeded its limits, or was outside the configured import policy.",
                }),
        }),
      ({ controller, work }) =>
        Effect.promise(async () => {
          controller.abort();
          await work.catch(() => undefined);
        }),
    );
}
