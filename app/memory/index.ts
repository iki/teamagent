import { Database } from "bun:sqlite";
import { createHash, randomUUID } from "node:crypto";
import {
  closeSync,
  constants,
  existsSync,
  fstatSync,
  fsyncSync,
  linkSync,
  lstatSync,
  mkdirSync,
  mkdtempSync,
  openSync,
  opendirSync,
  readSync,
  realpathSync,
  renameSync,
  rmSync,
  unlinkSync,
  writeFileSync,
  type BigIntStats,
} from "node:fs";
import { basename, dirname, isAbsolute, join, relative, resolve } from "node:path";
import { Effect, Layer, Predicate, Schema } from "effect";
import {
  exportFileRepresentation,
  textNormalizationPolicy,
  type NormalizedExportFile,
} from "./export.ts";
import {
  InputKindSchema,
  LocatorSchema,
  MemoryError,
  MemoryFileSchema,
  MemoryIdSchema,
  MemoryPathSchema,
  MemoryPageInputSchema,
  MemoryService,
  MemorySourceSchema,
  ProvenanceSchema,
  SearchHitSchema,
  SearchInputSchema,
  SourceKindSchema,
  SourceVersionSchema,
  VersionPageInputSchema,
  memoryLimits,
  identifierWords,
  retrievalTerms,
  rankLexicalCandidates,
  validateImportInput,
  type CaptureResult,
  type ImportResult,
  type MemoryApi,
  type MemoryFile,
  type MemorySource,
  type Provenance,
  type SourceCapture,
  type SourceVersion,
} from "@/memory";

export interface MemoryOptions {
  readonly dataDirectory: string;
  readonly workspaceId: string;
  readonly workspaceRoot: string;
  readonly capture: SourceCapture;
  readonly now?: () => number;
  /** Trusted host/test port for the final rename only; never loaded from source configuration. */
  readonly exportRename?: (source: string, destination: string) => void;
}

const fail = (code: MemoryError["code"], message: string): never => {
  throw new MemoryError({ code, message });
};
/** Preserve only recognized operation/error categories; native messages and paths stay private. */
export const memoryStorageMessage = (error: unknown): string => {
  const base = "The source store could not complete the operation.";
  if (!(error instanceof Error)) return base;
  const code = "code" in error && typeof error.code === "string" ? error.code : "";
  const syscall = "syscall" in error && typeof error.syscall === "string" ? error.syscall : "";
  const codes = new Set([
    "ENOENT",
    "EPERM",
    "EACCES",
    "EEXIST",
    "ENOTDIR",
    "EISDIR",
    "EBUSY",
    "EMFILE",
    "ENFILE",
    "ENOSPC",
    "EXDEV",
    "EINVAL",
    "EIO",
    "ENAMETOOLONG",
    "EROFS",
  ]);
  const operations = new Set([
    "open",
    "read",
    "write",
    "rename",
    "unlink",
    "rm",
    "mkdir",
    "link",
    "stat",
    "lstat",
    "realpath",
    "fsync",
    "close",
    "scandir",
  ]);
  return codes.has(code)
    ? `${base} (${operations.has(syscall) ? `${syscall}: ` : ""}${code})`
    : base;
};
const attempt = <A>(body: () => A): Effect.Effect<A, MemoryError> =>
  Effect.try({
    try: body,
    catch: (error) =>
      error instanceof MemoryError
        ? error
        : new MemoryError({
            code: "storage",
            message: memoryStorageMessage(error),
          }),
  });
const decode = <A>(
  schema: Schema.Codec<A>,
  input: unknown,
  code: MemoryError["code"] = "integrity",
): A => {
  try {
    return Schema.decodeUnknownSync(schema)(input, { onExcessProperty: "error" });
  } catch {
    return fail(
      code,
      code === "invalid" ? "Memory input failed validation." : "Source data failed validation.",
    );
  }
};
const sha256 = (bytes: Uint8Array | string): string =>
  createHash("sha256").update(bytes).digest("hex");
export const memoryManifestHash = (files: readonly MemoryFile[], provenance: Provenance): string =>
  sha256(
    JSON.stringify({
      files: files.map((file) => ({
        path: file.path,
        role: file.role,
        mediaType: file.mediaType,
        size: file.size,
        sha256: file.sha256,
        origin: file.origin,
      })),
      parserVersion: provenance.parserVersion,
      repositoryCommit: provenance.repositoryCommit,
      // Omit the key for legacy manifests so their exact historical hash remains valid.
      ...(provenance.extraction === undefined ? {} : { extraction: provenance.extraction }),
    }),
  );
const jsonRow = Schema.Struct({ value: Schema.String });
const numberRow = Schema.Struct({ value: Schema.Int });
const capturedFileSchema = Schema.Struct({
  path: MemoryPathSchema,
  role: MemoryFileSchema.fields.role,
  mediaType: MemoryFileSchema.fields.mediaType,
  bytes: Schema.instanceOf(Uint8Array),
  origin: Schema.optional(LocatorSchema),
});
const captureSchema = Schema.Union([
  Schema.Struct({ status: Schema.Literal("unchanged"), provenance: ProvenanceSchema }),
  Schema.Struct({
    status: Schema.Literal("captured"),
    kind: SourceKindSchema,
    locator: LocatorSchema,
    files: Schema.Array(capturedFileSchema).check(Schema.isMaxLength(memoryLimits.captureFiles)),
    provenance: ProvenanceSchema,
  }),
]);

const inside = (root: string, path: string): boolean => {
  const part = relative(root, path);
  return (
    part === "" ||
    (part !== ".." &&
      !part.startsWith(`..${process.platform === "win32" ? "\\" : "/"}`) &&
      !isAbsolute(part))
  );
};

interface ExportDirectory {
  readonly parent: string;
  readonly parentIdentity: BigIntStats;
  readonly temporary: string;
  readonly destination: string;
  readonly directories: Map<string, BigIntStats>;
  readonly files: Map<string, { readonly identity: BigIntStats; readonly hash: string }>;
  published: boolean;
}

function sameExportObject(current: BigIntStats, original: BigIntStats): boolean {
  return (
    current.dev === original.dev &&
    current.ino === original.ino &&
    current.birthtimeNs === original.birthtimeNs &&
    current.mode === original.mode
  );
}

function exportAbsent(path: string): boolean {
  try {
    lstatSync(path);
    return false;
  } catch (error) {
    if (error instanceof Error && "code" in error && error.code === "ENOENT") return true;
    throw error;
  }
}

function exportDirectoryIdentity(path: string): BigIntStats {
  const info = lstatSync(path, { bigint: true });
  if (!info.isDirectory() || info.isSymbolicLink() || realpathSync(path) !== path)
    return fail("integrity", "Export directory identity changed.");
  return info;
}

function checkExportParent(scope: ExportDirectory): void {
  if (!sameExportObject(exportDirectoryIdentity(scope.parent), scope.parentIdentity))
    fail("integrity", "Export parent identity changed.");
}

function writeExportFile(scope: ExportDirectory, path: string, bytes: Uint8Array | string): void {
  const output = join(scope.temporary, path);
  mkdirSync(dirname(output), { recursive: true });
  for (let directory = dirname(output); ; directory = dirname(directory)) {
    if (!inside(scope.temporary, directory))
      fail("integrity", "Export file escaped its prepared directory.");
    const name = relative(scope.temporary, directory);
    const info = exportDirectoryIdentity(directory);
    const original = scope.directories.get(name);
    if (original && !sameExportObject(info, original))
      fail("integrity", "Export directory identity changed.");
    scope.directories.set(name, original ?? info);
    if (!name) break;
  }
  writeFileSync(output, bytes, { flag: "wx", mode: 0o600 });
  const identity = lstatSync(output, { bigint: true });
  if (
    identity.size !==
    BigInt(typeof bytes === "string" ? Buffer.byteLength(bytes) : bytes.byteLength)
  )
    fail("integrity", "Prepared export content changed.");
  scope.files.set(path, { identity, hash: sha256(bytes) });
}

/** Compare the exact prepared tree before publication and before removing scratch. */
function checkExportTree(scope: ExportDirectory, root = scope.temporary): void {
  checkExportParent(scope);
  const children = new Map<string, Set<string>>();
  for (const name of scope.directories.keys()) children.set(name, new Set());
  for (const name of [...scope.directories.keys(), ...scope.files.keys()]) {
    if (!name) continue;
    const parent = dirname(name);
    children.get(parent === "." ? "" : parent)?.add(basename(name));
  }
  for (const [name, identity] of scope.directories) {
    const path = join(root, name);
    if (!sameExportObject(exportDirectoryIdentity(path), identity))
      fail("integrity", "Export directory identity changed.");
    const expected = children.get(name) ?? fail("integrity", "Prepared export inventory changed.");
    const directory = opendirSync(path);
    try {
      let count = 0;
      for (let entry = directory.readSync(); entry !== null; entry = directory.readSync()) {
        if (++count > expected.size || !expected.has(entry.name))
          fail("integrity", "Prepared export inventory changed.");
      }
      if (count !== expected.size) fail("integrity", "Prepared export inventory changed.");
    } finally {
      directory.closeSync();
    }
  }
  const buffer = new Uint8Array(64 * 1024);
  for (const [name, { identity, hash }] of scope.files) {
    const path = join(root, name);
    const unchanged = (current: BigIntStats): boolean =>
      current.isFile() &&
      !current.isSymbolicLink() &&
      current.nlink === 1n &&
      sameExportObject(current, identity) &&
      current.size === identity.size &&
      current.mtimeNs === identity.mtimeNs &&
      current.ctimeNs === identity.ctimeNs;
    if (!unchanged(lstatSync(path, { bigint: true })))
      fail("integrity", "Prepared export file identity changed.");
    const descriptor = openSync(path, constants.O_RDONLY | constants.O_NOFOLLOW);
    try {
      if (!unchanged(fstatSync(descriptor, { bigint: true })))
        fail("integrity", "Prepared export file identity changed.");
      const digest = createHash("sha256");
      let read = 0n;
      while (read < identity.size) {
        const count = readSync(
          descriptor,
          buffer,
          0,
          Number(identity.size - read > 65536n ? 65536n : identity.size - read),
          null,
        );
        if (!count) fail("integrity", "Prepared export content changed.");
        digest.update(buffer.subarray(0, count));
        read += BigInt(count);
      }
      if (
        readSync(descriptor, buffer, 0, 1, null) !== 0 ||
        !unchanged(fstatSync(descriptor, { bigint: true })) ||
        !unchanged(lstatSync(path, { bigint: true })) ||
        digest.digest("hex") !== hash
      )
        fail("integrity", "Prepared export content changed.");
    } finally {
      closeSync(descriptor);
    }
  }
  checkExportParent(scope);
}

/** Manifest paths are portable relative paths, including on Windows export hosts. */
const checkedPath = (path: string): string => {
  decode(MemoryPathSchema, path, "invalid");
  if (
    path.startsWith("/") ||
    path
      .split("/")
      .some(
        (part) =>
          part === "" ||
          part === "." ||
          part === ".." ||
          /[. ]$/.test(part) ||
          /^[^<>"|?*]*[<>"|?*]/.test(part) ||
          /^(con|prn|aux|nul|com[1-9]|lpt[1-9])(?:\.|$)/i.test(part),
      )
  ) {
    return fail("invalid", "Source manifest contains an unsafe relative path.");
  }
  return path;
};

const parseRow = <A>(schema: Schema.Codec<A>, value: unknown): A => {
  const row = decode(jsonRow, value);
  let parsed: unknown;
  try {
    parsed = JSON.parse(row.value);
  } catch {
    return fail("integrity", "Stored source metadata is malformed.");
  }
  return decode(schema, parsed);
};

interface TextChunk {
  readonly path: string;
  readonly lineStart: number;
  readonly lineEnd: number;
  readonly text: string;
}

function chunks(files: readonly (typeof capturedFileSchema.Type)[]): readonly TextChunk[] {
  const result: TextChunk[] = [];
  let indexedBytes = 0;
  const derivedOrigins = new Set(
    files.filter((file) => file.role === "markdown").map((file) => file.origin),
  );
  for (const file of files) {
    if (
      file.role !== "markdown" &&
      !(file.role === "original" && /^(text\/|application\/(json|xml))/.test(file.mediaType))
    )
      continue;
    if (file.role === "original" && file.origin !== undefined && derivedOrigins.has(file.origin))
      continue;
    let text: string;
    try {
      text = new TextDecoder("utf-8", { fatal: true, ignoreBOM: true }).decode(file.bytes);
    } catch {
      continue;
    }
    if (text.includes("\0")) continue;
    indexedBytes += file.bytes.byteLength;
    if (indexedBytes > memoryLimits.captureBytes)
      fail("capacity", "Searchable source text exceeds the capture budget.");
    const lines = text.split(/\r?\n/);
    let pending = "";
    let first = 1;
    for (let index = 0; index < lines.length; index += 1) {
      const line = lines[index] ?? "";
      if (pending !== "" && pending.length + line.length + 1 > memoryLimits.searchCharacters) {
        result.push({ path: file.path, lineStart: first, lineEnd: index, text: pending });
        pending = "";
      }
      if (pending === "") first = index + 1;
      if (line.length > memoryLimits.searchCharacters) {
        for (let offset = 0; offset < line.length; offset += memoryLimits.searchCharacters) {
          result.push({
            path: file.path,
            lineStart: index + 1,
            lineEnd: index + 1,
            text: line.slice(offset, offset + memoryLimits.searchCharacters),
          });
        }
      } else pending += `${pending === "" ? "" : "\n"}${line}`;
      if (result.length > 40_000)
        fail("capacity", "Source search chunk count exceeds the indexing budget.");
    }
    if (pending !== "")
      result.push({ path: file.path, lineStart: first, lineEnd: lines.length, text: pending });
  }
  return result;
}

/** Own this service at the host boundary, or use memoryLayer for scoped cleanup. */
export const openMemory = (options: MemoryOptions): Effect.Effect<MemoryApi, MemoryError> =>
  attempt(() => {
    const workspaceId = decode(MemoryIdSchema, options.workspaceId, "invalid");
    const workspaceRoot = realpathSync(resolve(options.workspaceRoot));
    if (!lstatSync(workspaceRoot).isDirectory())
      fail("invalid", "Memory workspace root must be an existing directory.");
    mkdirSync(options.dataDirectory, { recursive: true, mode: 0o700 });
    const dataDirectory = realpathSync(options.dataDirectory);
    const memoryDirectory = join(dataDirectory, "memory");
    mkdirSync(memoryDirectory, { recursive: true, mode: 0o700 });
    const canonicalDirectory = realpathSync(memoryDirectory);
    if (!inside(dataDirectory, canonicalDirectory))
      fail("invalid", "Memory storage escaped its private data directory.");
    const blobDirectory = join(canonicalDirectory, "blobs", sha256(workspaceId));
    mkdirSync(blobDirectory, { recursive: true, mode: 0o700 });
    const canonicalBlobDirectory = realpathSync(blobDirectory);
    if (!inside(canonicalDirectory, canonicalBlobDirectory))
      fail("invalid", "Memory blob storage escaped its private directory.");
    const temporaryDirectory = join(canonicalDirectory, "temporary");
    mkdirSync(temporaryDirectory, { recursive: true, mode: 0o700 });
    if (!inside(canonicalDirectory, realpathSync(temporaryDirectory)))
      fail("invalid", "Memory temporary storage escaped its private directory.");
    const databasePath = join(canonicalDirectory, "memory.sqlite");
    if (existsSync(databasePath) && lstatSync(databasePath).isSymbolicLink())
      fail("integrity", "Memory database cannot be a symbolic link.");
    const database = new Database(databasePath, { create: true, strict: true });
    const now = options.now ?? Date.now;
    const timestamp = (): string => new Date(now()).toISOString();
    let closed = false;
    let activeCaptures = 0;
    let activeExports = 0;
    try {
      database.exec("PRAGMA foreign_keys=ON; PRAGMA journal_mode=WAL; PRAGMA busy_timeout=5000;");
      const version = decode(
        Schema.Struct({ user_version: Schema.Int }),
        database.query("PRAGMA user_version").get(),
      ).user_version;
      if (version > 2)
        fail("integrity", "This memory database requires a newer application version.");
      database
        .transaction(() => {
          database.exec(`
        CREATE TABLE IF NOT EXISTS scopes (id TEXT PRIMARY KEY, root TEXT NOT NULL);
        CREATE TABLE IF NOT EXISTS sources (
          id TEXT PRIMARY KEY, workspaceId TEXT NOT NULL REFERENCES scopes(id),
          locator TEXT NOT NULL, inputLocator TEXT NOT NULL, kind TEXT NOT NULL, convert INTEGER NOT NULL,
          revision INTEGER NOT NULL, currentVersionId TEXT NOT NULL, value TEXT NOT NULL,
          UNIQUE(workspaceId,locator,kind,convert)
        );
        CREATE TABLE IF NOT EXISTS versions (
          id TEXT PRIMARY KEY, sourceId TEXT NOT NULL REFERENCES sources(id) ON DELETE CASCADE,
          workspaceId TEXT NOT NULL, number INTEGER NOT NULL, contentHash TEXT NOT NULL, value TEXT NOT NULL,
          UNIQUE(sourceId,number)
        );
        CREATE TABLE IF NOT EXISTS blobs (
          workspaceId TEXT NOT NULL, hash TEXT NOT NULL, versionId TEXT NOT NULL REFERENCES versions(id) ON DELETE CASCADE,
          PRIMARY KEY(workspaceId,hash,versionId)
        );
        CREATE VIRTUAL TABLE IF NOT EXISTS source_text USING fts5(
          workspaceId UNINDEXED,sourceId UNINDEXED,versionId UNINDEXED,path,
          lineStart UNINDEXED,lineEnd UNINDEXED,text,terms, tokenize='porter unicode61'
        );
        PRAGMA user_version=2;
      `);
          if (version === 1) {
            database.exec(`ALTER TABLE source_text RENAME TO source_text_legacy;
              CREATE VIRTUAL TABLE source_text USING fts5(
                workspaceId UNINDEXED,sourceId UNINDEXED,versionId UNINDEXED,path,
                lineStart UNINDEXED,lineEnd UNINDEXED,text,terms,tokenize='porter unicode61');`);
            const rowSchema = Schema.Struct({
              workspaceId: Schema.String,
              sourceId: Schema.String,
              versionId: Schema.String,
              path: Schema.String,
              lineStart: Schema.Int,
              lineEnd: Schema.Int,
              text: Schema.String,
            });
            const insert = database.query(
              "INSERT INTO source_text(workspaceId,sourceId,versionId,path,lineStart,lineEnd,text,terms) VALUES(?,?,?,?,?,?,?,?)",
            );
            for (const value of database
              .query(
                "SELECT workspaceId,sourceId,versionId,path,lineStart,lineEnd,text FROM source_text_legacy",
              )
              .iterate()) {
              const row = decode(rowSchema, value);
              insert.run(
                row.workspaceId,
                row.sourceId,
                row.versionId,
                row.path,
                row.lineStart,
                row.lineEnd,
                row.text,
                identifierWords(`${row.path}\n${row.text}`),
              );
            }
            database.exec("DROP TABLE source_text_legacy;");
          }
          const existing: unknown = database
            .query("SELECT root AS value FROM scopes WHERE id=?")
            .get(workspaceId);
          if (existing === null)
            database
              .query("INSERT INTO scopes(id,root) VALUES(?,?)")
              .run(workspaceId, workspaceRoot);
          else if (decode(jsonRow, existing).value !== workspaceRoot)
            fail("conflict", "This workspace scope is already bound to a different root.");
        })
        .immediate();
    } catch (error) {
      database.close();
      throw error;
    }

    const ensureOpen = (): void => {
      if (closed) fail("storage", "Memory store is closed.");
      if (
        realpathSync(memoryDirectory) !== canonicalDirectory ||
        realpathSync(blobDirectory) !== canonicalBlobDirectory ||
        realpathSync(workspaceRoot) !== workspaceRoot
      ) {
        fail("integrity", "A memory storage or workspace root changed after opening.");
      }
    };
    const atomic = <A>(body: () => A): A => {
      ensureOpen();
      return database.transaction(body).immediate();
    };
    const source = (sourceId: string): MemorySource => {
      ensureOpen();
      decode(MemoryIdSchema, sourceId, "invalid");
      const value: unknown = database
        .query("SELECT value FROM sources WHERE workspaceId=? AND id=?")
        .get(workspaceId, sourceId);
      if (value === null) return fail("not_found", "Source not found in this workspace.");
      const result = parseRow(MemorySourceSchema, value);
      if (result.id !== sourceId || result.workspaceId !== workspaceId)
        return fail("integrity", "Stored source identity disagrees with its workspace key.");
      return result;
    };
    const checkedVersion = (value: unknown, sourceId: string): SourceVersion => {
      const result = parseRow(SourceVersionSchema, value);
      if (
        result.sourceId !== sourceId ||
        result.workspaceId !== workspaceId ||
        result.contentHash !== memoryManifestHash(result.files, result.provenance) ||
        result.files.reduce((sum, file) => sum + file.size, 0) > memoryLimits.captureBytes
      )
        return fail("integrity", "Stored source version failed manifest verification.");
      return result;
    };
    const sourceVersion = (sourceValue: MemorySource, versionId?: string): SourceVersion => {
      const selected = decode(MemoryIdSchema, versionId ?? sourceValue.currentVersionId, "invalid");
      const value: unknown = database
        .query("SELECT value FROM versions WHERE workspaceId=? AND sourceId=? AND id=?")
        .get(workspaceId, sourceValue.id, selected);
      if (value === null) return fail("not_found", "Source version not found in this workspace.");
      const result = checkedVersion(value, sourceValue.id);
      if (result.id !== selected)
        return fail("integrity", "Stored source version identity disagrees with its key.");
      return result;
    };
    const lookup = (
      locator: string,
      kind: typeof InputKindSchema.Type,
      convert: boolean,
    ): MemorySource | undefined => {
      const rows = database
        .query(
          "SELECT value FROM sources WHERE workspaceId=? AND (locator=? OR inputLocator=?) AND convert=? ORDER BY id",
        )
        .all(workspaceId, locator, locator, convert ? 1 : 0);
      const matches = rows
        .map((row) => parseRow(MemorySourceSchema, row))
        .filter((row) => kind === "auto" || row.kind === kind);
      if (matches.length > 1)
        return fail("conflict", "This source locator is ambiguous; sync a source ID instead.");
      return matches[0];
    };
    const readBlob = (file: MemoryFile): Uint8Array => {
      ensureOpen();
      const path = join(canonicalBlobDirectory, file.sha256);
      const stat = lstatSync(path);
      if (!stat.isFile() || stat.isSymbolicLink() || stat.size !== file.size)
        return fail("integrity", "Source blob does not match its manifest.");
      const descriptor = openSync(path, constants.O_RDONLY | constants.O_NOFOLLOW);
      try {
        const current = fstatSync(descriptor);
        if (!current.isFile() || current.size !== file.size)
          return fail("integrity", "Source blob changed while opening.");
        const bytes = new Uint8Array(file.size + 1);
        let offset = 0;
        while (offset < bytes.length) {
          const count = readSync(descriptor, bytes, offset, bytes.length - offset, null);
          if (count === 0) break;
          offset += count;
        }
        const content = bytes.subarray(0, offset);
        if (offset !== file.size || sha256(content) !== file.sha256)
          return fail("integrity", "Source blob content failed verification.");
        return content;
      } finally {
        closeSync(descriptor);
      }
    };
    const putBlob = (file: MemoryFile, bytes: Uint8Array): void => {
      const target = join(canonicalBlobDirectory, file.sha256);
      if (existsSync(target)) {
        readBlob(file);
        return;
      }
      const temporary = join(canonicalBlobDirectory, `.${randomUUID()}.tmp`);
      const descriptor = openSync(temporary, "wx", 0o600);
      try {
        writeFileSync(descriptor, bytes);
        fsyncSync(descriptor);
      } finally {
        closeSync(descriptor);
      }
      try {
        try {
          linkSync(temporary, target);
        } catch (error) {
          if (!Predicate.isObject(error) || error.code !== "EEXIST") throw error;
          readBlob(file);
        }
      } finally {
        unlinkSync(temporary);
      }
    };
    const updateSource = (value: MemorySource): void => {
      database
        .query(
          "UPDATE sources SET revision=?,currentVersionId=?,value=? WHERE workspaceId=? AND id=?",
        )
        .run(value.revision, value.currentVersionId, JSON.stringify(value), workspaceId, value.id);
    };

    const commit = (
      resultValue: CaptureResult,
      baseline: MemorySource | undefined,
      inputLocator: string,
      convert: boolean,
    ): ImportResult => {
      const result = decode(captureSchema, resultValue);
      const checkedAt = timestamp();
      return atomic(() => {
        const current =
          baseline === undefined
            ? result.status === "captured"
              ? lookup(result.locator, result.kind, convert)
              : undefined
            : source(baseline.id);
        if (baseline !== undefined && current?.revision !== baseline.revision)
          return fail(
            "conflict",
            "A concurrent sync changed this source; retry against the current version.",
          );
        if (result.status === "unchanged") {
          if (current === undefined)
            return fail("integrity", "Capture reported unchanged without an existing source.");
          const version = sourceVersion(current);
          if (memoryManifestHash(version.files, result.provenance) !== version.contentHash)
            return fail(
              "integrity",
              "An unchanged capture cannot alter parser, extraction policy or repository provenance.",
            );
          for (const file of version.files) readBlob(file);
          const updated = {
            ...current,
            checkedAt,
            lastProvenance: result.provenance,
            revision: current.revision + 1,
          };
          updateSource(updated);
          return { status: "unchanged", source: updated, version };
        }
        if (
          current !== undefined &&
          (current.kind !== result.kind || current.locator !== result.locator)
        )
          return fail("conflict", "A sync cannot silently change a source's identity.");
        let totalBytes = 0;
        const paths = new Set<string>();
        const capturedFiles = [...result.files].sort((left, right) =>
          left.path.localeCompare(right.path, "en"),
        );
        const files = capturedFiles.map((file) => {
          const path = checkedPath(file.path);
          const normalized = path.toLowerCase();
          if (paths.has(normalized))
            return fail("invalid", "A source capture contains duplicate or case-colliding paths.");
          paths.add(normalized);
          totalBytes += file.bytes.byteLength;
          if (totalBytes > memoryLimits.captureBytes)
            return fail("capacity", "Source capture exceeds its total byte budget.");
          return decode(
            MemoryFileSchema,
            {
              path,
              role: file.role,
              mediaType: file.mediaType,
              size: file.bytes.byteLength,
              sha256: sha256(file.bytes),
              origin: file.origin ?? null,
            },
            "invalid",
          );
        });
        for (const file of files) {
          const segments = file.path.toLowerCase().split("/");
          for (let length = 1; length < segments.length; length += 1) {
            if (paths.has(segments.slice(0, length).join("/")))
              return fail("invalid", "Source file paths conflict with a directory path.");
          }
        }
        if (
          !files.some((file) => file.role === "original") &&
          !(files.length === 0 && (result.kind === "folder" || result.kind === "git"))
        )
          return fail("integrity", "A capture must preserve original source bytes.");
        const contentHash = memoryManifestHash(files, result.provenance);
        const previous = current === undefined ? undefined : sourceVersion(current);
        if (
          previous !== undefined &&
          previous.contentHash === contentHash &&
          current !== undefined
        ) {
          for (const file of previous.files) readBlob(file);
          const updated = {
            ...current,
            checkedAt,
            lastProvenance: result.provenance,
            revision: current.revision + 1,
          };
          updateSource(updated);
          return { status: "unchanged", source: updated, version: previous };
        }
        if (baseline === undefined && current !== undefined)
          return fail("conflict", "A concurrent import registered this source; retry as a sync.");
        const totalSources = decode(
          numberRow,
          database
            .query("SELECT COUNT(*) AS value FROM sources WHERE workspaceId=?")
            .get(workspaceId),
        ).value;
        if (current === undefined && totalSources >= memoryLimits.sources)
          return fail("capacity", "Workspace source count reached its limit.");
        const number = (previous?.number ?? 0) + 1;
        if (number > memoryLimits.versionsPerSource)
          return fail("capacity", "Source version count reached its limit.");
        const sourceId = current?.id ?? randomUUID();
        const version = decode(SourceVersionSchema, {
          id: randomUUID(),
          sourceId,
          workspaceId,
          number,
          contentHash,
          retrievedAt: checkedAt,
          provenance: result.provenance,
          files,
        });
        const updated = decode(MemorySourceSchema, {
          id: sourceId,
          workspaceId,
          locator: result.locator,
          inputLocator: current?.inputLocator ?? inputLocator,
          kind: result.kind,
          convert,
          createdAt: current?.createdAt ?? checkedAt,
          checkedAt,
          lastProvenance: result.provenance,
          currentVersionId: version.id,
          revision: (current?.revision ?? 0) + 1,
        });
        const indexed = chunks(capturedFiles);
        for (let index = 0; index < files.length; index += 1) {
          const file = files[index];
          const captured = capturedFiles[index];
          if (file === undefined || captured === undefined)
            return fail("integrity", "Source manifest and capture disagree.");
          putBlob(file, captured.bytes);
        }
        if (current === undefined)
          database
            .query(
              "INSERT INTO sources(id,workspaceId,locator,inputLocator,kind,convert,revision,currentVersionId,value) VALUES(?,?,?,?,?,?,?,?,?)",
            )
            .run(
              updated.id,
              workspaceId,
              updated.locator,
              updated.inputLocator,
              updated.kind,
              convert ? 1 : 0,
              updated.revision,
              version.id,
              JSON.stringify(updated),
            );
        else updateSource(updated);
        database
          .query(
            "INSERT INTO versions(id,sourceId,workspaceId,number,contentHash,value) VALUES(?,?,?,?,?,?)",
          )
          .run(version.id, sourceId, workspaceId, number, contentHash, JSON.stringify(version));
        for (const file of files)
          database
            .query("INSERT OR IGNORE INTO blobs(workspaceId,hash,versionId) VALUES(?,?,?)")
            .run(workspaceId, file.sha256, version.id);
        database
          .query("DELETE FROM source_text WHERE workspaceId=? AND sourceId=?")
          .run(workspaceId, sourceId);
        for (const chunk of indexed)
          database
            .query(
              "INSERT INTO source_text(workspaceId,sourceId,versionId,path,lineStart,lineEnd,text,terms) VALUES(?,?,?,?,?,?,?,?)",
            )
            .run(
              workspaceId,
              sourceId,
              version.id,
              chunk.path,
              chunk.lineStart,
              chunk.lineEnd,
              chunk.text,
              identifierWords(`${chunk.path}\n${chunk.text}`),
            );
        return { status: current === undefined ? "created" : "updated", source: updated, version };
      });
    };

    const capture = Effect.fnUntraced(function* (
      locator: string,
      kind: typeof InputKindSchema.Type,
      convert: boolean,
      baseline: MemorySource | undefined,
    ) {
      yield* Effect.acquireRelease(
        attempt(() => {
          if (activeCaptures >= 2)
            return fail("capacity", "This memory service already has two active source captures.");
          activeCaptures += 1;
        }),
        () =>
          Effect.sync(() => {
            activeCaptures -= 1;
          }),
      );
      const previous = yield* attempt(() =>
        baseline === undefined
          ? undefined
          : { ...sourceVersion(baseline), provenance: baseline.lastProvenance },
      );
      const result = yield* options.capture({
        locator,
        kind,
        convert,
        workspaceRoot,
        temporaryDirectory,
        dataDirectory,
        ...(previous === undefined ? {} : { previous }),
      });
      return yield* attempt(() => commit(result, baseline, locator, convert));
    }, Effect.scoped);

    const api: MemoryApi = {
      get: Effect.fnUntraced(function* (value: unknown) {
        const input = yield* validateImportInput(value);
        const kind = input.kind ?? "auto";
        const convert = input.convert ?? true;
        const baseline = yield* attempt(() => {
          ensureOpen();
          return lookup(input.locator, kind, convert);
        });
        return yield* capture(
          baseline?.locator ?? input.locator,
          baseline?.kind ?? kind,
          convert,
          baseline,
        );
      }),
      sync: Effect.fnUntraced(function* (id: string) {
        const baseline = yield* attempt(() => source(id));
        return yield* capture(baseline.locator, baseline.kind, baseline.convert, baseline);
      }),
      list: (value = {}) =>
        attempt(() => {
          ensureOpen();
          const input = decode(MemoryPageInputSchema, value, "invalid");
          const offset = input.offset ?? 0;
          const total = decode(
            numberRow,
            database
              .query("SELECT COUNT(*) AS value FROM sources WHERE workspaceId=?")
              .get(workspaceId),
          ).value;
          const sources = database
            .query("SELECT value FROM sources WHERE workspaceId=? ORDER BY id LIMIT ? OFFSET ?")
            .all(workspaceId, input.limit ?? 50, offset)
            .map((row) => parseRow(MemorySourceSchema, row));
          return {
            sources,
            total,
            nextOffset: offset + sources.length < total ? offset + sources.length : null,
          };
        }),
      show: (id, value = {}) =>
        attempt(() => {
          const selected = source(id);
          const input = decode(VersionPageInputSchema, value, "invalid");
          const offset = input.offset ?? 0;
          const total = decode(
            numberRow,
            database
              .query("SELECT COUNT(*) AS value FROM versions WHERE workspaceId=? AND sourceId=?")
              .get(workspaceId, id),
          ).value;
          const versions = database
            .query(
              "SELECT value FROM versions WHERE workspaceId=? AND sourceId=? ORDER BY number DESC LIMIT ? OFFSET ?",
            )
            .all(workspaceId, id, input.limit ?? 1, offset)
            .map((row) => checkedVersion(row, id));
          return {
            source: selected,
            versions,
            total,
            nextOffset: offset + versions.length < total ? offset + versions.length : null,
          };
        }),
      read: (id, path, versionId) =>
        attempt(() => {
          const selected = source(id);
          const version = sourceVersion(selected, versionId);
          if (path !== undefined) checkedPath(path);
          const file =
            path === undefined
              ? (version.files.find((item) => item.role === "markdown") ?? version.files[0])
              : version.files.find((item) => item.path === path);
          if (file === undefined)
            return fail("not_found", "Source file not found in this version.");
          return { source: selected, version, file, bytes: readBlob(file) };
        }),
      search: (value) =>
        attempt(() => {
          ensureOpen();
          const input = decode(SearchInputSchema, value, "invalid");
          if (input.sourceId !== undefined) source(input.sourceId);
          const terms = retrievalTerms(input.query);
          if (terms.length === 0 || terms.length > 32)
            return fail("invalid", "Search requires between one and 32 searchable terms.");
          const match = terms.map((term) => `"${term}"`).join(" OR ");
          const rowSchema = Schema.Struct({
            sourceId: MemoryIdSchema,
            versionId: MemoryIdSchema,
            path: MemoryPathSchema,
            lineStart: Schema.Int,
            lineEnd: Schema.Int,
            text: Schema.String,
            rank: Schema.Number,
          });
          const rows = database
            .query(
              `SELECT sourceId,versionId,path,lineStart,lineEnd,text,bm25(source_text,0,0,0,2,0,0,1,0.5) AS rank FROM source_text WHERE source_text MATCH ? AND workspaceId=? ${input.sourceId === undefined ? "" : "AND sourceId=?"} ORDER BY rank,sourceId,path,lineStart LIMIT ?`,
            )
            .all(
              ...(input.sourceId === undefined
                ? [match, workspaceId, 200]
                : [match, workspaceId, input.sourceId, 200]),
            );
          const ranked = rankLexicalCandidates(
            terms,
            rows.map((raw) => decode(rowSchema, raw)),
          );
          return ranked.slice(0, input.limit ?? 10).map((row) => {
            const selected = source(row.sourceId);
            if (selected.currentVersionId !== row.versionId)
              return fail("integrity", "Search index points to a stale source version.");
            return decode(SearchHitSchema, {
              sourceId: row.sourceId,
              versionId: row.versionId,
              locator: selected.locator,
              path: row.path,
              lineStart: row.lineStart,
              lineEnd: row.lineEnd,
              excerpt: row.text,
              citation: `memory://${workspaceId}/${row.sourceId}/${row.versionId}/${encodeURIComponent(row.path)}#L${row.lineStart}-L${row.lineEnd}`,
            });
          });
        }),
      export: (id, directory, versionId) =>
        Effect.acquireUseRelease(
          attempt(() => {
            ensureOpen();
            if (activeExports >= 2)
              return fail("capacity", "This memory service already has two active exports.");
            activeExports += 1;
          }),
          () =>
            Effect.acquireUseRelease(
              attempt(() => {
                const selected = source(id);
                const version = sourceVersion(selected, versionId);
                decode(LocatorSchema, directory, "invalid");
                const target = resolve(directory);
                if (!exportAbsent(target))
                  return fail(
                    "conflict",
                    "Export destination already exists; choose a new directory.",
                  );
                const parent = realpathSync(dirname(target));
                if (inside(dataDirectory, parent) || inside(target, dataDirectory))
                  return fail(
                    "invalid",
                    "Export destination overlaps private application storage.",
                  );
                const parentIdentity = exportDirectoryIdentity(parent);
                const temporary = mkdtempSync(join(parent, ".teamagent-export-"));
                const scope: ExportDirectory = {
                  parent,
                  parentIdentity,
                  temporary,
                  destination: join(parent, basename(target)),
                  directories: new Map([["", exportDirectoryIdentity(temporary)]]),
                  files: new Map(),
                  published: false,
                };
                return { selected, version, scope };
              }),
              ({ selected, version, scope }) =>
                Effect.gen(function* () {
                  yield* attempt(() => {
                    const normalized: NormalizedExportFile[] = [];
                    const retained = new Set<string>();
                    for (const file of version.files) {
                      const safePath = checkedPath(file.path);
                      const raw = readBlob(file);
                      const representation = exportFileRepresentation(file, raw);
                      writeExportFile(scope, join("files", safePath), representation.bytes);
                      if (representation.normalization !== undefined) {
                        normalized.push(representation.normalization);
                        if (!retained.has(file.sha256)) {
                          writeExportFile(scope, join("raw", file.sha256), raw);
                          retained.add(file.sha256);
                        }
                      }
                    }
                    writeExportFile(
                      scope,
                      "manifest.json",
                      JSON.stringify(
                        {
                          format: "teamagent-memory-export-v2",
                          source: selected,
                          version,
                          normalization: { policy: textNormalizationPolicy, files: normalized },
                        },
                        null,
                        2,
                      ) + "\n",
                    );
                  });
                  const delays = [0, 10, 20, 40, 80, 160];
                  for (const [index, delay] of delays.entries()) {
                    if (delay) yield* Effect.sleep(delay);
                    const published = yield* attempt(() => {
                      ensureOpen();
                      if (
                        JSON.stringify(sourceVersion(selected, version.id)) !==
                        JSON.stringify(version)
                      )
                        return fail(
                          "integrity",
                          "Stored export version changed during publication.",
                        );
                      checkExportTree(scope);
                      if (!exportAbsent(scope.destination))
                        return fail("conflict", "Export destination appeared during publication.");
                      try {
                        (options.exportRename ?? renameSync)(scope.temporary, scope.destination);
                      } catch (error) {
                        if (
                          process.platform !== "win32" ||
                          index === delays.length - 1 ||
                          !(error instanceof Error && "code" in error) ||
                          (error.code !== "EPERM" && error.code !== "EBUSY")
                        )
                          throw error;
                        return false;
                      }
                      // The synchronous mutation completes before cancellation can release ownership.
                      scope.published = true;
                      checkExportTree(scope, scope.destination);
                      if (!exportAbsent(scope.temporary))
                        return fail(
                          "integrity",
                          "Export staging directory reappeared after publication.",
                        );
                      return true;
                    });
                    if (published)
                      return { directory: scope.destination, source: selected, version };
                  }
                  return yield* new MemoryError({
                    code: "storage",
                    message: "Export publication did not complete.",
                  });
                }),
              ({ scope }) =>
                attempt(() => {
                  if (scope.published) return;
                  checkExportParent(scope);
                  if (exportAbsent(scope.temporary)) return;
                  // Identity or content drift retains uncertain scratch, including a foreign replacement.
                  checkExportTree(scope);
                  rmSync(scope.temporary, { recursive: true });
                }),
            ),
          () =>
            Effect.sync(() => {
              activeExports -= 1;
            }),
        ),
      delete: (id) =>
        attempt(() => {
          atomic(() => {
            source(id);
            database
              .query("DELETE FROM source_text WHERE workspaceId=? AND sourceId=?")
              .run(workspaceId, id);
            database.query("DELETE FROM sources WHERE workspaceId=? AND id=?").run(workspaceId, id);
          });
        }),
      close: () =>
        attempt(() => {
          if (!closed) {
            database.close();
            closed = true;
          }
        }),
    };
    return api;
  });

export const memoryLayer = (options: MemoryOptions) =>
  Layer.effect(
    MemoryService,
    Effect.acquireRelease(openMemory(options), (memory) => memory.close().pipe(Effect.orDie)),
  );
