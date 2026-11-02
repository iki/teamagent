import { randomUUID } from "node:crypto";
import { lstat, mkdir, open, opendir, readFile, rename, unlink, writeFile } from "node:fs/promises";
import { dirname, isAbsolute, join, relative, resolve } from "node:path";
import { Effect, Schema } from "effect";
import { type ImportResult, type MemoryFile, type MemoryApi } from "@/memory";
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
import {
  MemoryExportManifestSchema,
  exportNormalizationFor,
  normalizeLf,
  validateExportNormalization,
  verifyExportFile,
  type MemoryExportManifest,
} from "../memory/export.ts";
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

export async function atomicText(
  path: string,
  text: string,
  operations: { readonly rename?: typeof rename } = {},
): Promise<void> {
  if (Buffer.byteLength(text) > textLimits.stateBytes)
    throw new Error("Research report exceeds its byte limit.");
  const normalized = normalizeLf(text);
  // Reconciliation resumes publish the same report set. Avoid replacing exact existing LF bytes.
  if ((await boundedText(path, textLimits.stateBytes)) === normalized) return;
  const temporary = `${path}.${randomUUID()}.tmp`;
  try {
    await writeFile(temporary, normalized, { flag: "wx", mode: 0o600 });
    const delays = [0, 10, 25, 50, 100, 200, 400];
    for (const [attempt, delay] of delays.entries()) {
      if (delay) await new Promise<void>((done) => setTimeout(done, delay));
      try {
        await (operations.rename ?? rename)(temporary, path);
        return;
      } catch (error) {
        if (
          attempt === delays.length - 1 ||
          process.platform !== "win32" ||
          !(error instanceof Error && "code" in error) ||
          !["EPERM", "EACCES", "EBUSY"].includes(String(error.code))
        )
          throw error;
      }
    }
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
  const manifest = Schema.decodeUnknownSync(Schema.fromJsonString(MemoryExportManifestSchema))(
    existing,
    {
      onExcessProperty: "error",
    },
  );
  if (
    manifest.source.id !== receipt.source.id ||
    manifest.version.id !== receipt.version.id ||
    manifest.version.contentHash !== receipt.version.contentHash ||
    JSON.stringify(manifest.version.files) !== JSON.stringify(receipt.version.files)
  )
    throw new Error("Cached export does not match its immutable memory version.");
  validateExportNormalization(manifest);
  for (const file of receipt.version.files) await readExportFile(directory, manifest, file);
  return directory;
}

async function existingDirectory(directory: string): Promise<void> {
  const parent = dirname(directory);
  if (parent !== directory) await existingDirectory(parent);
  const info = await lstat(directory);
  if (!info.isDirectory() || info.isSymbolicLink())
    throw new Error("Pinned cache directory is missing or unsafe.");
}

async function readExportFile(
  directory: string,
  manifest: MemoryExportManifest,
  file: MemoryFile,
): Promise<Uint8Array> {
  if (!safeRelative(file.path)) throw new Error("Pinned export file path is unsafe.");
  const normalization = exportNormalizationFor(manifest, file);
  async function read(relativePath: string, size: number): Promise<Uint8Array> {
    const path = resolve(directory, relativePath);
    const suffix = relative(directory, path);
    if (
      isAbsolute(suffix) ||
      suffix === ".." ||
      suffix.startsWith("../") ||
      suffix.startsWith("..\\")
    )
      throw new Error("Pinned export path escapes its directory.");
    await existingDirectory(dirname(path));
    const info = await lstat(path);
    if (!info.isFile() || info.isSymbolicLink() || info.size !== size)
      throw new Error("Pinned export file is missing or changed.");
    const handle = await open(path, "r");
    try {
      const current = await handle.stat();
      if (
        !current.isFile() ||
        current.size !== size ||
        current.dev !== info.dev ||
        current.ino !== info.ino
      )
        throw new Error("Pinned export changed while opening.");
      const bytes = new Uint8Array(size + 1);
      let offset = 0;
      while (offset < bytes.length) {
        const result = await handle.read(bytes, offset, bytes.length - offset, offset);
        if (result.bytesRead === 0) break;
        offset += result.bytesRead;
      }
      if (offset !== size) throw new Error("Pinned export changed during reading.");
      return bytes.subarray(0, offset);
    } finally {
      await handle.close();
    }
  }
  const bytes = await read(`files/${file.path}`, normalization?.size ?? file.size);
  const raw =
    normalization === undefined
      ? undefined
      : await read(`raw/${normalization.sourceSha256}`, normalization.sourceSize);
  verifyExportFile(manifest, file, bytes, raw);
  return bytes;
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
  const manifest = Schema.decodeUnknownSync(Schema.fromJsonString(MemoryExportManifestSchema))(
    text,
    {
      onExcessProperty: "error",
    },
  );
  const { source, version } = manifest;
  validateExportNormalization(manifest);
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
    const bytes = await readExportFile(directory, manifest, file);
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

/** Bounded, read-only gate for the managed text cache; no source store, network or converters run. */
export async function inspectTextExports(root: string) {
  const directory = resolve(root, ".cache", "text", "exports");
  const info = await lstat(directory).catch((error: unknown) => {
    if (error instanceof Error && "code" in error && error.code === "ENOENT") return undefined;
    throw error;
  });
  if (info === undefined) return { exports: 0, files: 0, normalizedFiles: 0, retainedRawFiles: 0 };
  await existingDirectory(directory);
  const counts = { exports: 0, files: 0, normalizedFiles: 0, retainedRawFiles: 0 };
  let sourceCount = 0;
  const sources = await opendir(directory);
  for await (const source of sources) {
    sourceCount += 1;
    if (sourceCount > 2000 || !source.isDirectory() || source.isSymbolicLink())
      throw new Error("Text export source inventory is unsafe or exceeds its limit.");
    const sourceDirectory = join(directory, source.name);
    await existingDirectory(sourceDirectory);
    const versions = await opendir(sourceDirectory);
    let versionCount = 0;
    for await (const version of versions) {
      versionCount += 1;
      counts.exports += 1;
      if (
        versionCount > 1000 ||
        counts.exports > 4096 ||
        !version.isDirectory() ||
        version.isSymbolicLink()
      )
        throw new Error("Text export version inventory is unsafe or exceeds its limit.");
      const exported = join(sourceDirectory, version.name);
      await existingDirectory(exported);
      const text = await boundedText(join(exported, "manifest.json"), textLimits.stateBytes);
      if (text === undefined || text.includes("\r"))
        throw new Error("Text export manifest is missing or not LF.");
      const manifest = Schema.decodeUnknownSync(Schema.fromJsonString(MemoryExportManifestSchema))(
        text,
        {
          onExcessProperty: "error",
        },
      );
      if (
        manifest.source.id !== source.name ||
        manifest.version.id !== version.name ||
        manifest.version.sourceId !== source.name ||
        manifest.version.workspaceId !== manifest.source.workspaceId ||
        memoryManifestHash(manifest.version.files, manifest.version.provenance) !==
          manifest.version.contentHash ||
        manifest.version.files.reduce((total, file) => total + file.size, 0) > 67108864 ||
        new Set(manifest.version.files.map((file) => file.path.toLowerCase())).size !==
          manifest.version.files.length
      )
        throw new Error(
          "Text export identity or file coverage differs from its immutable manifest.",
        );
      validateExportNormalization(manifest);
      const expected = new Set(["manifest.json"]);
      for (const file of manifest.version.files) {
        await readExportFile(exported, manifest, file);
        counts.files += 1;
        expected.add(`files/${file.path}`);
        const normalization = exportNormalizationFor(manifest, file);
        if (normalization !== undefined) {
          counts.normalizedFiles += 1;
          expected.add(`raw/${normalization.sourceSha256}`);
        }
      }
      counts.retainedRawFiles += [...expected].filter((path) => path.startsWith("raw/")).length;
      // Reject unmanifested text instead of allowing it to hide under a blanket cache exclusion.
      const pending = [{ path: exported, relative: "", depth: 0 }];
      let visited = 0;
      while (pending.length > 0) {
        const current = pending.pop();
        if (current === undefined) break;
        visited += 1;
        if (visited > 4096 || current.depth > 256)
          throw new Error("Text export directory inventory exceeds its limit.");
        const entries = await opendir(current.path);
        for await (const entry of entries) {
          const relativePath = `${current.relative}${entry.name}`;
          if (entry.isSymbolicLink())
            throw new Error("Text exports cannot contain symbolic links.");
          if (entry.isDirectory()) {
            if (![...expected].some((path) => path.startsWith(`${relativePath}/`)))
              throw new Error("Text export contains an unmanifested directory.");
            pending.push({
              path: join(current.path, entry.name),
              relative: `${relativePath}/`,
              depth: current.depth + 1,
            });
          } else if (!entry.isFile() || !expected.delete(relativePath))
            throw new Error("Text export contains an unmanifested file.");
        }
      }
      if (expected.size !== 0) throw new Error("Text export coverage is incomplete.");
    }
  }
  return counts;
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
  reconciliationId?: string,
): Promise<void> {
  if (reconciliationId !== undefined && !/^[a-f0-9]{64}$/.test(reconciliationId))
    throw new Error("Invalid reconciliation publication identity.");
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
      "Explicit derivative adoption uses `bun app/research/text-reconcile.ts --root . --request reviewed-request.json`; see [the maintenance contract](../../research-sync.md). It accepts an already exported same-source version with exact old/new pins and a hash of the prior record. It verifies every retained original byte, writes an immutable before/after receipt, and preserves static policy, publication/capture dates and the last remote-check time. It never fetches or converts. Grouped sources, conflicting aliases, changed originals and later-state retries require separate resolution. Receipt reasons are public evidence and must contain no secrets or private URL parameters.",
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
  const marker =
    reconciliationId === undefined
      ? undefined
      : `<!-- teamagent-text-reconciliation:${reconciliationId} -->`;
  if (marker !== undefined && history.includes(marker)) return;
  const details = changed.map(
    (record) =>
      `- ${record.name}: ${record.status}, ${record.validation}; version ${record.versionId ?? "none"}; content ${record.contentHash ?? "none"}.`,
  );
  await atomicText(
    changelogPath,
    `${history}\n## ${state.checkedAt}\n\n${marker === undefined ? "" : `${marker}\n\n[Explicit reconciliation receipt](reconciliations/${reconciliationId}.json).\n\n`}${details.length ? details.join("\n") : "No content or extraction-status changes."}\n`,
  );
}
