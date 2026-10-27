import { createHash, randomUUID } from "node:crypto";
import { lstat, mkdir, readFile, rename, unlink, writeFile } from "node:fs/promises";
import { dirname, isAbsolute, join, relative, resolve } from "node:path";
import { Effect, Schema } from "effect";
import {
  MemorySourceSchema,
  SourceVersionSchema,
  type ImportResult,
  type MemoryApi,
} from "@/memory";
import {
  redactSourceUrls,
  displaySource,
  textLimits,
  TextStateSchema,
  LegacyTextStateSchema,
  type TextRecord,
  type TextState,
} from "./text-contracts.ts";
import { safeRelative } from "../imports/limits.ts";
import { memoryManifestHash } from "../memory/index.ts";
import { inspectPublication, PublicationDateSchema, type MetadataDocument } from "./text-dates.ts";

export async function boundedText(path: string, limit: number): Promise<string | undefined> {
  const info = await lstat(path).catch((error: unknown) => {
    if (error instanceof Error && "code" in error && error.code === "ENOENT") return undefined;
    throw new Error("Cannot inspect research input.");
  });
  if (!info) return undefined;
  if (!info.isFile() || info.isSymbolicLink() || info.size > limit)
    throw new Error("Research input must be a bounded regular file.");
  const bytes = await readFile(path);
  if (bytes.byteLength > limit) throw new Error("Research input grew beyond its byte limit.");
  return new TextDecoder("utf-8", { fatal: true }).decode(bytes);
}

/** Reject links in every path component before creating the host-owned output tree. */
export async function safeDirectory(directory: string): Promise<void> {
  const target = resolve(directory);
  const parent = dirname(target);
  if (parent !== target) await safeDirectory(parent);
  const info = await lstat(target).catch((error: unknown) => {
    if (error instanceof Error && "code" in error && error.code === "ENOENT") return undefined;
    throw new Error("Cannot inspect research directory.");
  });
  if (!info) {
    await mkdir(target).catch((error: unknown) => {
      if (!(error instanceof Error && "code" in error && error.code === "EEXIST")) throw error;
    });
  }
  const current = info ?? (await lstat(target));
  if (!current.isDirectory() || current.isSymbolicLink())
    throw new Error("Research directories must not be symbolic links or files.");
}

export async function atomicText(path: string, text: string): Promise<void> {
  if (Buffer.byteLength(text) > textLimits.stateBytes)
    throw new Error("Research report exceeds its byte limit.");
  const temporary = `${path}.${randomUUID()}.tmp`;
  try {
    await writeFile(temporary, text, { flag: "wx", mode: 0o600 });
    await rename(temporary, path);
  } finally {
    await unlink(temporary).catch((error: unknown) => {
      if (!(error instanceof Error && "code" in error && error.code === "ENOENT")) throw error;
    });
  }
}

export async function readTextState(path: string): Promise<TextState> {
  const text = await boundedText(path, textLimits.stateBytes);
  if (text === undefined) return { format: "teamagent-text-sync-v2", checkedAt: "", records: [] };
  const decoded = Schema.decodeUnknownSync(
    Schema.fromJsonString(Schema.Union([TextStateSchema, LegacyTextStateSchema])),
  )(text, { onExcessProperty: "error" });
  const state: TextState =
    decoded.format === "teamagent-text-sync-v2"
      ? decoded
      : {
          format: "teamagent-text-sync-v2",
          checkedAt: decoded.checkedAt,
          records: decoded.records.map((record) => ({
            ...record,
            mode: "static",
            firstCapturedAt: null,
            sourcePublishedAt: null,
            publicationEvidence: "unknown",
            publicationField: null,
            sourceRevision: null,
            validatedAt: null,
          })),
        };
  if (new Set(state.records.map((record) => record.key)).size !== state.records.length)
    throw new Error("Duplicate text source state records.");
  for (const record of state.records) {
    const identities = [
      record.sourceId,
      record.versionId,
      record.contentHash,
      record.exportDirectory,
    ];
    if (identities.some((value) => value !== null) && identities.some((value) => value === null))
      throw new Error("Stored text source has incomplete pinned identity.");
    const url = new URL(record.source);
    if (
      !["http:", "https:"].includes(url.protocol) ||
      url.username ||
      url.password ||
      url.search ||
      url.hash ||
      `${url.origin}${url.pathname}` !== record.source
    )
      throw new Error("Stored public source must be a sanitized HTTP(S) URL.");
  }
  return {
    ...state,
    records: state.records.map((record) => ({
      ...record,
      headings: record.headings.map((heading) => redactSourceUrls(heading).slice(0, 240)),
      warnings: record.warnings.map((warning) => redactSourceUrls(warning).slice(0, 2000)),
    })),
  };
}

const ExportSchema = Schema.Struct({
  format: Schema.Literal("teamagent-memory-export-v1"),
  source: MemorySourceSchema,
  version: SourceVersionSchema,
});

export async function ensureTextExport(
  memory: MemoryApi,
  receipt: ImportResult,
  cache: string,
): Promise<string> {
  const parent = join(cache, "exports", receipt.source.id);
  await safeDirectory(parent);
  const directory = join(parent, receipt.version.id);
  const existing = await boundedText(join(directory, "manifest.json"), textLimits.stateBytes);
  if (existing === undefined) {
    await Effect.runPromise(memory.export(receipt.source.id, directory, receipt.version.id));
    return directory;
  }
  await safeDirectory(directory);
  const manifest = Schema.decodeUnknownSync(Schema.fromJsonString(ExportSchema))(existing, {
    onExcessProperty: "error",
  });
  if (
    manifest.source.id !== receipt.source.id ||
    manifest.version.id !== receipt.version.id ||
    manifest.version.contentHash !== receipt.version.contentHash ||
    JSON.stringify(manifest.version.files) !== JSON.stringify(receipt.version.files)
  )
    throw new Error("Cached export does not match its immutable memory version.");
  for (const file of receipt.version.files) {
    const path = resolve(directory, "files", file.path);
    const suffix = relative(directory, path);
    if (isAbsolute(suffix) || suffix.startsWith(".."))
      throw new Error("Export path escapes its directory.");
    await safeDirectory(dirname(path));
    const info = await lstat(path);
    if (!info.isFile() || info.isSymbolicLink() || info.size !== file.size)
      throw new Error("Cached export file has changed.");
    const bytes = await readFile(path);
    if (
      bytes.byteLength !== file.size ||
      createHash("sha256").update(bytes).digest("hex") !== file.sha256
    )
      throw new Error("Cached export checksum does not match memory.");
  }
  return directory;
}

async function existingDirectory(directory: string): Promise<void> {
  const parent = dirname(directory);
  if (parent !== directory) await existingDirectory(parent);
  const info = await lstat(directory);
  if (!info.isDirectory() || info.isSymbolicLink())
    throw new Error("Pinned cache directory is missing or unsafe.");
}

/** Local-only integrity inspection: never exports, creates directories, invokes conversion or fetches. */
export async function inspectTextExport(
  record: Pick<TextRecord, "sourceId" | "versionId" | "contentHash" | "source">,
  cache: string,
  expectedLocator: string,
) {
  if (!record.sourceId || !record.versionId || !record.contentHash)
    throw new Error("Pinned source identity is incomplete.");
  const exportRoot = resolve(cache, "exports");
  const directory = resolve(exportRoot, record.sourceId, record.versionId);
  const suffix = relative(exportRoot, directory);
  if (
    !suffix ||
    isAbsolute(suffix) ||
    suffix === ".." ||
    suffix.startsWith(`..${process.platform === "win32" ? "\\" : "/"}`)
  )
    throw new Error("Pinned export identity escapes the cache.");
  await existingDirectory(directory);
  const text = await boundedText(join(directory, "manifest.json"), textLimits.stateBytes);
  if (text === undefined) throw new Error("Pinned export manifest is missing.");
  const manifest = Schema.decodeUnknownSync(Schema.fromJsonString(ExportSchema))(text, {
    onExcessProperty: "error",
  });
  const { source, version } = manifest;
  if (
    new URL(source.inputLocator).href !== expectedLocator ||
    displaySource(source.inputLocator) !== record.source ||
    source.id !== record.sourceId ||
    version.sourceId !== record.sourceId ||
    version.id !== record.versionId ||
    version.workspaceId !== source.workspaceId ||
    version.contentHash !== record.contentHash ||
    memoryManifestHash(version.files, version.provenance) !== record.contentHash
  )
    throw new Error("Pinned export identity or manifest hash differs from the recorded source.");
  if (
    version.files.reduce((total, file) => total + file.size, 0) > 67108864 ||
    new Set(version.files.map((file) => file.path.toLowerCase())).size !== version.files.length
  )
    throw new Error("Pinned export file coverage exceeds its bounds or repeats a path.");
  const markdown: string[] = [];
  const metadata: MetadataDocument[] = [];
  const metadataWarnings: string[] = [];
  for (const file of version.files) {
    if (!safeRelative(file.path)) throw new Error("Pinned export file path is unsafe.");
    const path = resolve(directory, "files", file.path);
    const suffix = relative(directory, path);
    if (
      isAbsolute(suffix) ||
      suffix === ".." ||
      suffix.startsWith(`..${process.platform === "win32" ? "\\" : "/"}`)
    )
      throw new Error("Pinned export path escapes its directory.");
    await existingDirectory(dirname(path));
    const info = await lstat(path);
    if (!info.isFile() || info.isSymbolicLink() || info.size !== file.size)
      throw new Error("Pinned export file is missing or changed.");
    const bytes = await readFile(path);
    if (
      bytes.byteLength !== file.size ||
      createHash("sha256").update(bytes).digest("hex") !== file.sha256
    )
      throw new Error("Pinned export file checksum differs.");
    if (file.role === "markdown")
      markdown.push(new TextDecoder("utf-8", { fatal: true }).decode(bytes));
    if (
      file.role === "original" &&
      ["text/html", "application/json"].includes(file.mediaType.split(";")[0]?.trim() ?? "")
    ) {
      try {
        metadata.push({
          path: file.path,
          mediaType: file.mediaType,
          text: new TextDecoder("utf-8", { fatal: true }).decode(bytes),
        });
      } catch {
        metadataWarnings.push(
          "Source publication metadata could not be read as UTF-8; no date was inferred from that original.",
        );
      }
    }
  }
  const publication = inspectPublication(
    metadata,
    source.inputLocator,
    version.provenance.parserVersion,
  );
  return {
    directory,
    source,
    version,
    markdown: markdown.join("\n\n"),
    firstCapturedAt: Schema.decodeUnknownSync(PublicationDateSchema)(source.createdAt),
    publication: { ...publication, warnings: [...publication.warnings, ...metadataWarnings] },
  };
}

function plain(text: string): string {
  // Entity-encode source punctuation before Markdown parsing: links, images and raw HTML stay text.
  return redactSourceUrls(text)
    .replace(/[\r\n]/g, " ")
    .replace(
      /[\u0021-\u002f\u003a-\u0040\u005b-\u0060\u007b-\u007e]/g,
      (character) => `&#${character.charCodeAt(0)};`,
    );
}
function link(path: string): string {
  return path.replaceAll("\\", "/").split("/").map(encodeURIComponent).join("/");
}
export function textSourceReport(name: string, records: readonly TextRecord[]): string {
  const sections = records.map((record, index) => {
    const lines = [
      `## Source ${index + 1}`,
      "",
      `[Original source](<${record.source}>) (query parameters withheld from public reports).`,
      "",
      `Mode: **${record.mode}**. Last remote attempt: ${record.checkedAt}. Local validation: ${record.validatedAt ?? "unknown"}. Import: **${record.status}**. Content validation: **${record.validation}**.`,
      "",
      `First captured: ${record.firstCapturedAt ?? "unknown"}. Source creation/publication date: ${record.sourcePublishedAt ?? "unknown"}. Date evidence: ${record.publicationEvidence}${record.publicationField ? ` (${record.publicationField})` : ""}. Filename dates and Last-Modified are not treated as creation dates.`,
      "",
      `Source revision: ${record.sourceRevision ?? "not supplied"}.`,
      "",
      `Original bytes: ${record.originalBytes}. Extracted Markdown characters: ${record.markdownCharacters}. Captured images: ${record.images}.`,
      "",
      `Memory source: \`${record.sourceId ?? "none"}\`. Version: \`${record.versionId ?? "none"}\`. Content SHA-256: \`${record.contentHash ?? "none"}\`.`,
      "",
    ];
    if (record.exportDirectory)
      lines.push(
        `[Version evidence and assets](${link(record.exportDirectory)}/manifest.json). Export manifests retain exact locators; treat the cache as private.`,
        "",
      );
    lines.push(...record.warnings.map((warning) => `- ${plain(warning)}`), "");
    if (record.headings.length)
      lines.push(
        "Extracted heading sample (up to 20; source text, not an endorsed analysis):",
        "",
        ...record.headings.map((heading) => `- ${plain(heading)}`),
        "",
      );
    return lines.join("\n");
  });
  return `# ${name}\n\nGenerated structural extraction report. Text length and file hashes do not establish factual accuracy or complete extraction. Image fidelity, image text and document layout have not been visually reviewed. A multi-URL entry records only the explicitly listed posts/pages; it does not discover a complete thread.\n\n${sections.join("\n")}\n`;
}

export async function publishTextReports(
  directory: string,
  state: TextState,
  previous: TextState,
): Promise<void> {
  await safeDirectory(directory);
  const groups = Map.groupBy(state.records, (record) => record.name);
  for (const [name, records] of groups)
    await atomicText(join(directory, `${name}.report.md`), textSourceReport(name, records));
  const rows = [...groups].map(
    ([name, records]) =>
      `| [${name}](${name}.report.md) | ${records.map((record) => record.validation).join(", ")} | ${records.map((record) => record.status).join(", ")} |`,
  );
  await atomicText(
    join(directory, "README.md"),
    [
      "# Text resource evidence",
      "",
      "Repeatable sync reads [web/social sources](../../../.urls.md.conf) and [PDF sources](../../../.urls.pdf.conf). Run `bun app/research/text-sync.ts --root .`; existing captured resources stay static by default. Append `refresh=true` immediately after a URL to allow remote refresh; use `--limit N`, `--timeout-ms N`, or `--cache path` for bounded runs and cache overrides. The cache defaults to `.cache/text`, configured by `TEAMAGENT_TEXT_CACHE` in root `.env` then `.env.local`.",
      "",
      "Each non-comment line is a safe `.md` or `.pdf` alias followed by one or more HTTP(S) URLs. Optional per-URL tokens are `refresh=true` (or `refresh=false`) and `published=2026-10-27` or an ISO timestamp with timezone. Options apply only to their preceding URL; publication overrides are labeled configured assertions. Alias additions/renames reuse an unambiguous exact-full-URL pin; conflicting pins block without fetching, and query-redacted URL equality is insufficient. Whole-line `#` comments and individually quoted URLs are supported. Up to 16 explicitly listed URLs can share an alias for multiple posts or article parts. No automatic thread discovery, browser social session, paywall bypass, or mirror substitution is implemented.",
      "",
      "Optional `--x-api` explicitly enables official post lookup using `X_BEARER_TOKEN` from the process environment. It may use paid API access and is never selected automatically. Numeric post URLs, long-form note text, grouped chosen posts and up to four public image assets are supported; unknown article bodies and standalone article URLs are reported as unsupported. API JSON is retained as original evidence. No authenticated live success is claimed without an actual credentialed run. [Official lookup contract](https://docs.x.com/x-api/posts/lookup/introduction) and [field dictionary](https://docs.x.com/x-api/fundamentals/data-dictionary) were checked on 2026-10-24.",
      "",
      "Static entries with a captured version perform only local export integrity checks: no network, conversion, export rewrite or account authentication. Initial entries without any successful capture may be retried; a missing or corrupt recorded snapshot is an explicit error and never silently fetched again. A successful capture remains pinned even when local export publication failed. Source state migrates from v1 without replacing pinned versions. If the private cache ledger is absent, the portable report ledger preserves the pin. Transfer the private cache/exports separately when moving machines; historical `data/research/texts` files are not substituted. Imports reuse Teamagent memory's immutable versions, conversion, images, source provenance and size/network limits. Cached exports are checksum-verified before reuse. Reports with `failed` status retain any previous version only as stale evidence. Removed configuration entries retain their prior report and state until deliberately archived; their check time makes staleness visible.",
      "",
      "First-captured time comes from the retained memory source creation timestamp. Source creation/publication date is separate: explicit configuration, publisher HTML metadata/Article JSON-LD, or official X created_at, with evidence recorded; absent or conflicting metadata stays unknown. Filename dates and HTTP Last-Modified never become creation dates. Existing dates survive refresh failures. Refresh-marked HTTP sources use validators when available and retained bytes are integrity-checked; assets are checked separately. Official X edit-history IDs are recorded for the exact requested post without silently following another version.",
      "",
      "`usable-text` means at least 100 extracted characters and no detected parser warning, access shell or wrong PDF type. It is a basic content check, not complete extraction or factual verification. `partial` includes parser limitations or social content (short authenticated posts use their validated API identity rather than the 100-character web-page threshold); `blocked` covers access shells and PDF wrapper pages; `unsupported` covers inadequate text. Image count does not establish image completeness or visual fidelity. Full warnings remain in memory provenance.",
      "",
      "Original research remains in [data/research/texts](../../../data/research/texts/). This sync does not replace historical evidence. Exact source URL query parameters stay in private memory/export manifests; public reports omit them. Extracted heading samples are untrusted source data.",
      "",
      `Last run: ${state.checkedAt}. [Machine-readable source state](source-state.json). [Changelog](CHANGELOG.md).`,
      "",
      "| Source group | Content validation | Import outcome |",
      "| --- | --- | --- |",
      ...rows,
      "",
    ].join("\n"),
  );
  await atomicText(join(directory, "source-state.json"), `${JSON.stringify(state, null, 2)}\n`);
  const before = new Map(previous.records.map((record) => [record.key, record]));
  const changed = state.records.filter((record) => {
    const old = before.get(record.key);
    return (
      !old ||
      old.contentHash !== record.contentHash ||
      old.status !== record.status ||
      old.validation !== record.validation ||
      JSON.stringify(old.warnings) !== JSON.stringify(record.warnings)
    );
  });
  const changelogPath = join(directory, "CHANGELOG.md");
  const history =
    (await boundedText(changelogPath, textLimits.stateBytes)) ??
    "# Text extraction changelog\n\nRecords source-version and extraction-status changes. Unchanged checks update source state without inventing content changes.\n";
  const details = changed.map(
    (record) =>
      `- ${record.name}: ${record.status}, ${record.validation}; version ${record.versionId ?? "none"}; content ${record.contentHash ?? "none"}.`,
  );
  await atomicText(
    changelogPath,
    `${history}\n## ${state.checkedAt}\n\n${details.length ? details.join("\n") : "No content or extraction-status changes."}\n`,
  );
}
