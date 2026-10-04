import { createHash } from "node:crypto";
import { isAbsolute, relative, sep } from "node:path";

export const importLimits = {
  fileBytes: 16 * 1024 * 1024,
  totalBytes: 64 * 1024 * 1024,
  files: 256,
  directories: 512,
  entries: 8192,
  depth: 16,
  redirects: 5,
  networkMs: 30_000,
  processMs: 60_000,
} as const;

export const digest = (bytes: Uint8Array | string) =>
  createHash("sha256").update(bytes).digest("hex");

export function contained(root: string, path: string): boolean {
  const part = relative(root, path);
  return part === "" || (!isAbsolute(part) && part !== ".." && !part.startsWith(`..${sep}`));
}

const excluded = new Set([
  ".git",
  ".ssh",
  ".aws",
  ".codex",
  ".claude",
  ".gemini",
  ".teamagent",
  ".cache",
  "node_modules",
  "target",
  "dist",
  ".env",
]);

export function excludedName(name: string): boolean {
  const lower = name.toLowerCase();
  return excluded.has(lower) || lower.startsWith(".env.");
}

export function safeRelative(path: string): boolean {
  return (
    path.length > 0 &&
    path.length <= 1000 &&
    !isAbsolute(path) &&
    !/[\p{Cc}:]/u.test(path) &&
    path
      .replaceAll("\\", "/")
      .split("/")
      .every(
        (part) =>
          part !== "" &&
          part !== "." &&
          part !== ".." &&
          !/[. ]$/.test(part) &&
          !/^(con|prn|aux|nul|com[1-9]|lpt[1-9])(?:\.|$)/i.test(part),
      )
  );
}

export function sourceMediaType(name: string, bytes: Uint8Array, declared?: string): string {
  if (bytes[0] === 0x89 && bytes[1] === 0x50 && bytes[2] === 0x4e && bytes[3] === 0x47)
    return "image/png";
  if (bytes[0] === 0xff && bytes[1] === 0xd8) return "image/jpeg";
  const start = new TextDecoder().decode(bytes.subarray(0, 256));
  if (start.startsWith("%PDF-")) return "application/pdf";
  if (/^GIF8[79]a/.test(start)) return "image/gif";
  if (start.startsWith("RIFF") && start.slice(8, 12) === "WEBP") return "image/webp";
  if (/^\s*(?:<!doctype html|<html|<head|<body)/i.test(start)) return "text/html";
  const extension = name.split(".").at(-1)?.toLowerCase();
  const types: Readonly<Record<string, string>> = {
    md: "text/markdown",
    markdown: "text/markdown",
    txt: "text/plain",
    csv: "text/csv",
    html: "text/html",
    htm: "text/html",
    json: "application/json",
    xml: "application/xml",
    svg: "image/svg+xml",
    png: "image/png",
    jpg: "image/jpeg",
    jpeg: "image/jpeg",
    gif: "image/gif",
    webp: "image/webp",
    pdf: "application/pdf",
    docx: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    pptx: "application/vnd.openxmlformats-officedocument.presentationml.presentation",
    xlsx: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  };
  const mime = declared?.split(";")[0]?.trim().toLowerCase();
  if (mime !== undefined && (mime === types.docx || mime === types.pptx || mime === types.xlsx))
    return mime;
  const known = extension === undefined ? undefined : types[extension];
  if (known !== undefined) return known;
  if (
    mime &&
    /^[a-z0-9][a-z0-9.+-]*\/[a-z0-9][a-z0-9.+-]*$/.test(mime) &&
    mime !== "application/octet-stream"
  )
    return mime;
  try {
    const text = new TextDecoder("utf-8", { fatal: true }).decode(bytes);
    if (!text.includes("\0")) return "text/plain";
  } catch {
    /* Preserve unknown binary bytes without pretending they are text. */
  }
  return "application/octet-stream";
}
