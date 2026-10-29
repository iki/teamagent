import { randomUUID } from "node:crypto";
import { access, mkdir, mkdtemp, realpath, rm, unlink, writeFile } from "node:fs/promises";
import { constants } from "node:fs";
import { isAbsolute, join, resolve } from "node:path";
import { tmpdir } from "node:os";
import { Schema } from "effect";
import { ExtractorProfileSchema, MemoryError, type ExtractorProfile } from "@/memory";
import workerSource from "./worker.py" with { type: "text" };
import { contained, documentExtension, importLimits } from "./limits.ts";
import { runProcess } from "./process.ts";
import { scopedHostPromise } from "./lifecycle.ts";
import {
  builtinParserVersion,
  convertExternalDocument,
  ExtractorTimeoutError,
} from "./extractors.ts";

export const parserVersion = builtinParserVersion;
const WorkerResultSchema = Schema.Struct({
  markdown: Schema.String.check(Schema.isMaxLength(importLimits.fileBytes)),
  images: Schema.Array(
    Schema.Struct({
      name: Schema.String.check(Schema.isPattern(/^[a-f0-9]{64}\.[a-z0-9]{1,8}$/)),
      mediaType: Schema.String.check(Schema.isMaxLength(256)),
      base64: Schema.String.check(
        Schema.isMaxLength(Math.ceil(importLimits.fileBytes / 3) * 4),
        Schema.isPattern(/^[a-zA-Z0-9+/]*={0,2}$/),
      ),
    }),
  ).check(Schema.isMaxLength(128)),
  links: Schema.Array(
    Schema.Struct({
      url: Schema.String.check(Schema.isMaxLength(8192)),
      reference: Schema.String.check(Schema.isPattern(/^assets\/pending-[a-f0-9]{64}$/)),
    }),
  ).check(Schema.isMaxLength(128)),
  warnings: Schema.Array(Schema.String.check(Schema.isMaxLength(2000))).check(
    Schema.isMaxLength(256),
  ),
  parserVersion: Schema.String.check(Schema.isMinLength(1), Schema.isMaxLength(256)),
});
export type DocumentResult = typeof WorkerResultSchema.Type;

export function defaultImportPython(): string {
  const configured = process.env.TEAMAGENT_IMPORT_PYTHON;
  if (configured !== undefined) return resolve(configured);
  return join(
    resolve(import.meta.dir, "../.."),
    ".cache",
    "import-python",
    process.platform === "win32" ? "Scripts/python.exe" : "bin/python",
  );
}

async function runDocumentWorker(
  python: string,
  arguments_: readonly string[],
  signal: AbortSignal,
  bytes: number,
): Promise<Uint8Array> {
  const temporaryRoot = await realpath(tmpdir());
  const directory = await mkdtemp(join(temporaryRoot, "teamagent-converter-"));
  if (!contained(temporaryRoot, directory) || directory === temporaryRoot)
    throw new Error("Invalid converter staging directory");
  try {
    const script = join(directory, "worker.py");
    await writeFile(script, workerSource, { flag: "wx", mode: 0o600 });
    return await runProcess(python, ["-I", "-B", script, ...arguments_], {
      signal,
      bytes,
      cwd: directory,
    });
  } finally {
    await rm(directory, { recursive: true, force: true });
  }
}

export async function convertDocument(options: {
  bytes: Uint8Array;
  name: string;
  mediaType: string;
  origin: string;
  directory: string;
  signal: AbortSignal;
  python?: string;
  extractor?: ExtractorProfile;
}): Promise<DocumentResult> {
  let extractor: ExtractorProfile | undefined;
  try {
    extractor =
      options.extractor === undefined
        ? undefined
        : Schema.decodeUnknownSync(ExtractorProfileSchema)(options.extractor, {
            onExcessProperty: "error",
          });
  } catch {
    throw new MemoryError({ code: "invalid", message: "Invalid extractor profile." });
  }
  if (
    extractor !== undefined &&
    extractor.engine !== "builtin" &&
    (extractor.mediaTypes ?? ["application/pdf"]).includes(options.mediaType)
  ) {
    try {
      return await convertExternalDocument({ ...options, extractor });
    } catch (error: unknown) {
      throw new MemoryError({
        code:
          options.signal.aborted || error instanceof ExtractorTimeoutError
            ? "cancelled"
            : "unsupported",
        message:
          error instanceof ExtractorTimeoutError
            ? "Selected external extractor timed out; no fallback was used."
            : "Selected external extractor failed, produced unsafe output, or exceeded its limit; no fallback was used.",
      });
    }
  }
  const python = options.python ?? defaultImportPython();
  if (!isAbsolute(python)) throw new Error("Converter Python path must be absolute");
  await access(python, constants.X_OK);
  await mkdir(options.directory, { recursive: true });
  const safeExtension = documentExtension(options.name, options.mediaType);
  const file = join(options.directory, `${randomUUID()}${safeExtension}`);
  try {
    await writeFile(file, options.bytes, { flag: "wx", mode: 0o600 });
    const output = await runDocumentWorker(
      python,
      [file, options.mediaType, options.origin],
      options.signal,
      importLimits.totalBytes * 2,
    );
    const dynamic: unknown = JSON.parse(new TextDecoder("utf-8", { fatal: true }).decode(output));
    const result = Schema.decodeUnknownSync(WorkerResultSchema)(dynamic, {
      onExcessProperty: "error",
    });
    if (result.parserVersion !== parserVersion)
      throw new Error("Unexpected builtin converter identity");
    return result;
  } finally {
    await unlink(file).catch((error: unknown) => {
      if (!(error instanceof Error && "code" in error && error.code === "ENOENT")) throw error;
    });
  }
}

const DoctorVersionsSchema = Schema.Struct({
  python: Schema.String,
  packages: Schema.Record(Schema.String, Schema.String),
});

export const importDoctor = (options: { python?: string } = {}) =>
  scopedHostPromise({
    try: async (signal) => {
      const python = options.python ?? defaultImportPython();
      try {
        const bytes = await runDocumentWorker(python, ["doctor"], signal, 16_384);
        const dynamic: unknown = JSON.parse(
          new TextDecoder("utf-8", { fatal: true }).decode(bytes),
        );
        const versions = Schema.decodeUnknownSync(DoctorVersionsSchema)(dynamic);
        const available =
          versions.packages.markitdown === "0.1.8" &&
          versions.packages.pypdf === "6.11.0" &&
          versions.packages["markdown-it-py"] === "4.0.0";
        return {
          available,
          python,
          pythonVersion: versions.python,
          packages: versions.packages,
          parserVersion,
          formats: ["markdown", "html", "pdf", "docx", "xlsx", "pptx"],
          message: available
            ? "Pinned document converter is available."
            : "Run memory setup to restore pinned converter versions.",
        };
      } catch {
        signal.throwIfAborted();
        return {
          available: false,
          python,
          packages: {},
          parserVersion,
          formats: [],
          message:
            "Run memory setup, or configure an absolute TEAMAGENT_IMPORT_PYTHON path to the pinned converter environment.",
        };
      }
    },
    catch: () =>
      new MemoryError({ code: "cancelled", message: "Converter inspection was cancelled." }),
  });
