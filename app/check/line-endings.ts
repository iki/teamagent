import { spawnSync } from "node:child_process";
import { createHash } from "node:crypto";
import {
  closeSync,
  fstatSync,
  lstatSync,
  openSync,
  readSync,
  readdirSync,
  type Stats,
} from "node:fs";
import { isAbsolute, relative, resolve } from "node:path";
import { Schema } from "effect";

const limits = { files: 100_000, bytes: 64 * 1024 * 1024, total: 2 * 1024 * 1024 * 1024 };
const publicManifest = "spec/analyses/line-endings.json";
const privateManifest = ".cache/line-endings/migrations/current.json";
const OriginalSchema = Schema.Struct({ path: Schema.String, sha256: Schema.String });
const OpaqueInputSchema = Schema.Struct({
  path: Schema.String,
  sha256: Schema.String,
  originalPath: Schema.String,
  reason: Schema.String,
});
const ManifestSchema = Schema.Struct({
  retainedOriginals: Schema.Array(OriginalSchema),
  opaqueInputs: Schema.optional(Schema.Array(OpaqueInputSchema)),
});

function historicalOpaquePath(path: string): boolean {
  return (
    path === ".cache/benchmark-documents/2.txt" ||
    /^\.cache\/commit-split-2026-10-27\/(?:staged-snapshot\.patch|index\.before)$/u.test(path) ||
    /^\.cache\/extractor-benchmark\/2026-10-04-(?:fast|full-v2|full-v3)\/[^/]+\/[^/]+\/\d+\/(?:extracted\.md|assets\/[a-f0-9]{64}\.jp2)$/u.test(
      path,
    ) ||
    /^\.cache\/memory-benchmark\/competitors(?:-v2(?:-short)?)?\/mempalace\/[a-f0-9-]{36}\/index_metadata\.pickle$/u.test(
      path,
    ) ||
    /^\.cache\/review-2026-10-27\/[^/]+\/[a-z0-9._-]+\/[a-f0-9]{20,64}\.(?:source|diff)$/u.test(
      path,
    )
  );
}

/** Owned ignored output roots; installed tools, models and source checkouts stay outside. */
export const lineEndingOutputRoots: readonly string[] = [
  ".env.local",
  ".cache/review-2026-10-27",
  ".cache/research",
  ".cache/commit-split-2026-10-27",
  ".cache/conversations",
  ".cache/workflow",
  ".cache/hook-diagnostics",
  ".cache/dependencies",
  ".cache/verification",
  ".cache/temporary",
  ".tmp",
  ".cache/text",
  ".cache/line-endings/migrations",
  ".cache/benchmark-documents",
  ".cache/benchmark-smoke",
  ".cache/git.repomix",
  ".cache/web-evidence",
  ".cache/extractor-benchmark",
  ".cache/memory-benchmark",
  ".cache/import-probe/worker.py",
  ".cache/extractors-setup",
  ".cache/extractors-smoke",
  ".cache/interruption-launcher-probe",
  ".cache/desktop-icons",
  ".cache/line-endings/text-evidence-inventory.json",
  "coverage",
  "dist",
  "test-results",
  "data/web",
];

function excluded(path: string): boolean {
  const parts = path.split("/");
  // Exact owned temporary Git indexes are binary scratch, not maintained text.
  if (/^\.cache\/workflow\/indexes\/[a-zA-Z0-9._-]+\/(?:index|index\.lock)$/u.test(path))
    return true;
  if (parts.some((part) => part === ".git" || part === "node_modules")) return true;
  // Exports have a stricter manifest/file validator; the source store retains immutable inputs.
  if (path.startsWith(".cache/text/exports/") || path.startsWith(".cache/text/store/")) return true;
  if (path.startsWith(".cache/research/citation-git/")) return true;
  if (path.startsWith(".cache/benchmark-documents/regression/")) return true;
  if (/^\.cache\/memory-benchmark\/[^/]+\/memory\//u.test(path)) return true;
  if (
    /^\.cache\/(?:extractor-benchmark|extractors-smoke)\//u.test(path) &&
    parts.includes("marker-home")
  )
    return true;
  if (/^\.cache\/research\/fixtures-[^/]+(?:\/|$)/u.test(path)) return true;
  return /^\.cache\/conversations\/test-[^/]+(?:\/|$)/u.test(path);
}

function projectPath(root: string, path: string): string {
  if (
    !path ||
    /[\\:]/u.test(path) ||
    path.includes("\0") ||
    isAbsolute(path) ||
    path.split("/").some((part) => part === ".." || part === "." || !part)
  )
    throw new Error("LF inventory contains an invalid relative path");
  const target = resolve(root, path);
  const child = relative(root, target);
  if (isAbsolute(child) || child === ".." || child.startsWith("../") || child.startsWith("..\\"))
    throw new Error("LF inventory escapes the project root");
  return target;
}

function statWithin(root: string, path: string): Stats | undefined {
  const target = projectPath(root, path);
  const parts = path.split("/");
  let current = root;
  for (const part of parts) {
    current = resolve(current, part);
    try {
      const info = lstatSync(current);
      if (info.isSymbolicLink()) return undefined;
      if (current === target) return info;
    } catch (error) {
      if (error instanceof Error && "code" in error && error.code === "ENOENT") return undefined;
      throw error;
    }
  }
  return undefined;
}

function readBoundedFile(path: string, expected: Stats): Uint8Array {
  if (!expected.isFile() || expected.size > limits.bytes)
    throw new Error("LF input exceeds its byte bound");
  const descriptor = openSync(path, "r");
  try {
    const opened = fstatSync(descriptor);
    if (
      !opened.isFile() ||
      opened.size !== expected.size ||
      opened.dev !== expected.dev ||
      opened.ino !== expected.ino ||
      opened.mtimeMs !== expected.mtimeMs ||
      opened.ctimeMs !== expected.ctimeMs
    )
      throw new Error("LF input changed while opening");
    // One extra byte detects growth without allowing an unbounded whole-file read.
    const bytes = new Uint8Array(expected.size + 1);
    let offset = 0;
    while (offset < bytes.length) {
      const count = readSync(descriptor, bytes, offset, bytes.length - offset, offset);
      if (count === 0) break;
      offset += count;
    }
    const after = fstatSync(descriptor);
    if (
      offset !== expected.size ||
      after.size !== expected.size ||
      after.mtimeMs !== expected.mtimeMs ||
      after.ctimeMs !== expected.ctimeMs
    )
      throw new Error("LF input changed while reading");
    return bytes.subarray(0, offset);
  } finally {
    closeSync(descriptor);
  }
}

/** Collect names only. Never follow a directory link or enter a nested Git checkout. */
export function lineEndingPaths(root: string): readonly string[] {
  const result = spawnSync(
    "git",
    ["ls-files", "--cached", "--others", "--exclude-standard", "-z"],
    {
      cwd: root,
      windowsHide: true,
      shell: false,
      timeout: 30_000,
      maxBuffer: 16 * 1024 * 1024,
    },
  );
  if (result.error || result.status !== 0) throw new Error("Cannot collect the LF file inventory");
  const inventory = new TextDecoder("utf-8", { fatal: true }).decode(result.stdout);
  const paths = new Set(inventory.split("\0").filter((path) => path && !excluded(path)));
  let directories = 0;
  function visit(path: string): void {
    if (excluded(`${path}/`)) return;
    const absolute = projectPath(root, path);
    const info = statWithin(root, path);
    if (!info) return;
    if (info.isDirectory()) {
      directories += 1;
      if (directories > 25_000 || path.split("/").length > 32)
        throw new Error("LF directory inventory exceeds its bound");
      const entries = readdirSync(absolute, { withFileTypes: true });
      if (
        entries.some((entry) => entry.name === ".git") ||
        (entries.some((entry) => entry.name === "HEAD") &&
          entries.some((entry) => entry.name === "objects") &&
          entries.some((entry) => entry.name === "refs"))
      )
        return;
      for (const entry of entries) visit(`${path}/${entry.name}`);
    } else if (info.isFile()) paths.add(path);
    if (paths.size > limits.files) throw new Error("LF file inventory exceeds its bound");
  }
  for (const path of lineEndingOutputRoots) visit(path);
  // Root-level cache helpers/receipts are owned text; do not recursively adopt unknown cache folders.
  const cache = statWithin(root, ".cache");
  if (cache?.isDirectory()) {
    const entries = readdirSync(projectPath(root, ".cache"), { withFileTypes: true });
    if (entries.length > limits.files) throw new Error("LF cache inventory exceeds its bound");
    for (const entry of entries) {
      if (entry.isFile() || (entry.isDirectory() && entry.name.startsWith("media-smoke-")))
        visit(`.cache/${entry.name}`);
    }
  }
  if (paths.size > limits.files) throw new Error("LF file inventory exceeds its bound");
  return [...paths].sort();
}

function lineEndingProvenance(root: string) {
  const originals = new Map<string, string>();
  const opaqueInputs = new Map<string, typeof OpaqueInputSchema.Type>();
  for (const path of [publicManifest, privateManifest]) {
    const info = statWithin(root, path);
    if (!info) continue;
    if (!info.isFile() || info.size > 16 * 1024 * 1024)
      throw new Error("Invalid LF provenance manifest file");
    let manifest: typeof ManifestSchema.Type;
    try {
      const input: unknown = JSON.parse(
        new TextDecoder("utf-8", { fatal: true }).decode(
          readBoundedFile(projectPath(root, path), info),
        ),
      );
      manifest = Schema.decodeUnknownSync(ManifestSchema)(input);
    } catch {
      throw new Error("Invalid LF provenance manifest JSON or schema");
    }
    for (const original of manifest.retainedOriginals) {
      projectPath(root, original.path);
      const allowed =
        path === publicManifest
          ? (/^spec\/analyses\/history\/[^/]+\/[a-f0-9]{64}\.txt$/u.test(original.path) &&
              original.path.endsWith(`/${original.sha256}.txt`)) ||
            original.path === `spec/archive/line-endings/originals/${original.sha256}.bin`
          : original.path === `.cache/line-endings/originals/${original.sha256}.bin`;
      if (!/^[a-f0-9]{64}$/u.test(original.sha256) || !allowed || excluded(original.path))
        throw new Error("LF original exemption must name an allowed hash-addressed original");
      if (originals.has(original.path)) throw new Error("Duplicate LF original exemption");
      originals.set(original.path, original.sha256);
      if (originals.size > limits.files) throw new Error("LF original inventory exceeds its bound");
    }
    for (const input of manifest.opaqueInputs ?? []) {
      projectPath(root, input.path);
      projectPath(root, input.originalPath);
      if (
        path !== privateManifest ||
        !historicalOpaquePath(input.path) ||
        excluded(input.path) ||
        !/^[a-f0-9]{64}$/u.test(input.sha256) ||
        input.originalPath !== `.cache/line-endings/originals/${input.sha256}.bin` ||
        !input.reason.trim() ||
        input.reason.length > 500
      )
        throw new Error("LF opaque declaration is not an allowed historical input");
      if (opaqueInputs.has(input.path)) throw new Error("Duplicate LF opaque input declaration");
      opaqueInputs.set(input.path, input);
      if (opaqueInputs.size > limits.files)
        throw new Error("LF opaque inventory exceeds its bound");
    }
  }
  for (const input of opaqueInputs.values()) {
    if (originals.get(input.originalPath) !== input.sha256)
      throw new Error("LF opaque input has no matching retained original");
  }
  return { originals, opaqueInputs };
}

export interface LineEndingInspection {
  readonly violations: readonly string[];
  readonly textFiles: number;
  readonly opaqueFiles: number;
  readonly retainedOriginals: number;
  readonly verifiedOpaqueInputs: number;
  readonly missingOrLinked: number;
}

/** Keep .gitattributes byte protection aligned; the real-Git fixture verifies every extension. */
export const lineEndingBinaryExtensions: readonly string[] = [
  "bin",
  "png",
  "jpg",
  "jpeg",
  "gif",
  "webp",
  "bmp",
  "tif",
  "tiff",
  "ico",
  "icns",
  "pdf",
  "doc",
  "docx",
  "ppt",
  "pptx",
  "xls",
  "xlsx",
  "odt",
  "ods",
  "odp",
  "zip",
  "gz",
  "bz2",
  "xz",
  "tar",
  "7z",
  "wasm",
  "woff",
  "woff2",
  "ttf",
  "otf",
  "mp3",
  "mp4",
  "m4a",
  "m4v",
  "wav",
  "flac",
  "aac",
  "ogg",
  "opus",
  "webm",
  "mov",
  "avi",
  "sqlite",
  "sqlite3",
  "sqlite-wal",
  "sqlite-shm",
  "sqlite3-wal",
  "sqlite3-shm",
  "db",
  "db-wal",
  "db-shm",
  "exe",
  "dll",
  "pyd",
  "pyc",
  "so",
  "dylib",
  "a",
  "o",
  "obj",
  "lib",
  "safetensors",
  "gguf",
  "pt",
  "pth",
  "onnx",
  "tflite",
  "npy",
  "npz",
  "parquet",
  "arrow",
  "jp2",
  "pickle",
];
const binaryExtensions = new Set(lineEndingBinaryExtensions);

/** Shared with migration inventory: even an ASCII-only PDF or archive is not editable text. */
export function isBinaryLineEndingPath(path: string): boolean {
  return binaryExtensions.has(path.slice(path.lastIndexOf(".") + 1).toLowerCase());
}

function authoredText(path: string): boolean {
  // Imported opaque payloads remain evidence; valid UTF-8 in these paths still gets the LF check.
  if (path.startsWith("data/research/texts/") || path.startsWith("spec/archive/legacy-research/"))
    return false;
  if (path.startsWith(".cache/review-2026-10-27/") && /\/[a-f0-9]{64}\.txt$/u.test(path))
    return false;
  return (
    /\.(?:[cm]?[jt]sx?|json[cl5]?|ya?ml|mdx?|txt|py|ps1|psm1|psd1|sh|bat|cmd|toml|rs|cs|css|html?|xml|svg|csv|tsv|sql|ini|conf|config|lock|log|out|err|patch|diff|srt|vtt)$/iu.test(
      path,
    ) ||
    /(?:^|\/)(?:Dockerfile|Makefile|\.editorconfig|\.gitattributes|\.gitignore|\.env(?:\.[^/]+)?)$/u.test(
      path,
    )
  );
}

/** Read-only UTF-8 line-ending check; diagnostic strings contain paths, never file contents. */
export function inspectLineEndings(
  root: string,
  paths: readonly string[] = lineEndingPaths(root),
): LineEndingInspection {
  if (paths.length > limits.files) throw new Error("LF file inventory exceeds its bound");
  const { originals, opaqueInputs } = lineEndingProvenance(root);
  const violations: string[] = [];
  let total = 0;
  let textFiles = 0;
  let opaqueFiles = 0;
  let missingOrLinked = 0;
  // Verify exempt originals even when they are outside the normal text inventory.
  const selected = new Set([...paths, ...originals.keys(), ...opaqueInputs.keys()]);
  if (selected.size > limits.files) throw new Error("LF file inventory exceeds its bound");
  for (const path of selected) {
    const absolute = projectPath(root, path);
    if (excluded(path)) continue;
    const info = statWithin(root, path);
    const original = originals.get(path);
    const declaredOpaque = opaqueInputs.get(path);
    if (!info?.isFile()) {
      if (original !== undefined)
        throw new Error(`LF retained original is missing or linked: ${JSON.stringify(path)}`);
      if (declaredOpaque !== undefined)
        throw new Error(`LF opaque input is missing or linked: ${JSON.stringify(path)}`);
      missingOrLinked += 1;
      continue;
    }
    // Encoded/media originals are not text. Do not decode or rewrite their bytes.
    if (
      original === undefined &&
      declaredOpaque === undefined &&
      !historicalOpaquePath(path) &&
      isBinaryLineEndingPath(path)
    ) {
      opaqueFiles += 1;
      continue;
    }
    if (info.size > limits.bytes)
      throw new Error(`LF file exceeds its byte bound: ${JSON.stringify(path)}`);
    total += info.size;
    if (total > limits.total) throw new Error("LF text inventory exceeds its total byte bound");
    const bytes = readBoundedFile(absolute, info);
    if (original !== undefined) {
      if (createHash("sha256").update(bytes).digest("hex") !== original)
        throw new Error(`LF retained original hash mismatch: ${JSON.stringify(path)}`);
      continue;
    }
    if (declaredOpaque !== undefined) {
      if (createHash("sha256").update(bytes).digest("hex") !== declaredOpaque.sha256)
        throw new Error(`LF opaque input hash mismatch: ${JSON.stringify(path)}`);
      let opaque = bytes.includes(0);
      if (!opaque) {
        try {
          new TextDecoder("utf-8", { fatal: true }).decode(bytes);
        } catch {
          opaque = true;
        }
      }
      if (!opaque) throw new Error("Valid UTF-8 text cannot receive an opaque LF exemption");
      opaqueFiles += 1;
      continue;
    }
    if (bytes.includes(0)) {
      opaqueFiles += 1;
      if (authoredText(path) || historicalOpaquePath(path))
        violations.push(
          `UTF-8 text or verified historical opaque input required; NUL bytes found: ${JSON.stringify(path)}`,
        );
      continue;
    }
    let text: string;
    try {
      text = new TextDecoder("utf-8", { fatal: true }).decode(bytes);
    } catch {
      opaqueFiles += 1;
      if (authoredText(path) || historicalOpaquePath(path))
        violations.push(
          `UTF-8 text or verified historical opaque input required: ${JSON.stringify(path)}`,
        );
      continue;
    }
    textFiles += 1;
    if (text.includes("\r")) violations.push(`LF required: ${JSON.stringify(path)}`);
  }
  return {
    violations,
    textFiles,
    opaqueFiles,
    retainedOriginals: originals.size,
    verifiedOpaqueInputs: opaqueInputs.size,
    missingOrLinked,
  };
}
