import { cli } from "cleye";
import { createConsola } from "consola";
import { open, realpath, unlink } from "node:fs/promises";
import { join, relative, resolve } from "node:path";
import { Effect, Schema } from "effect";
import type { ImportResult, MemoryApi } from "@/memory";
import { openMemoryHost, resolveMemoryScope } from "../runtime/memory.ts";
import { openMemory } from "../memory/index.ts";
import { createSourceCapture } from "../imports/index.ts";
import { officialXCapture } from "./x-source.ts";
import { version } from "../../package.json";
import { loadResearchSettings } from "./settings.ts";
import {
  displaySource,
  parseTextSources,
  socialSource,
  sourceKey,
  textLimits,
  textQuality,
  TextRecordSchema,
  TextStateSchema,
  type TextRecord,
} from "./text-contracts.ts";
import {
  atomicText,
  boundedText,
  ensureTextExport,
  inspectTextExport,
  publishTextReports,
  readTextState,
  safeDirectory,
} from "./text-reports.ts";

const OptionsSchema = Schema.Struct({
  xApi: Schema.optional(Schema.Boolean),
  root: Schema.String.check(Schema.isMinLength(1), Schema.isMaxLength(2048)),
  cache: Schema.optional(Schema.String.check(Schema.isMinLength(1), Schema.isMaxLength(2048))),
  limit: Schema.optional(
    Schema.Int.check(Schema.isGreaterThanOrEqualTo(1), Schema.isLessThanOrEqualTo(4096)),
  ),
  timeoutMs: Schema.optional(
    Schema.Int.check(Schema.isGreaterThanOrEqualTo(100), Schema.isLessThanOrEqualTo(300000)),
  ),
});
export type TextSyncOptions = typeof OptionsSchema.Type;
export interface TextSyncDependencies {
  /** Injected host-owned store for deterministic tests; caller owns its lifetime. */
  readonly memory?: MemoryApi;
  readonly onProgress?: (record: TextRecord) => void;
  readonly signal?: AbortSignal;
}

/** Host-only orchestration. All import/version operations remain in the existing memory service. */
export async function syncTextResources(input: unknown, dependencies: TextSyncDependencies = {}) {
  const options = Schema.decodeUnknownSync(OptionsSchema)(input, { onExcessProperty: "error" });
  const root = await realpath(resolve(options.root));
  const settings = await loadResearchSettings(root);
  const cache = resolve(root, options.cache ?? settings.textCache);
  const reports = join(root, "spec", "analyses", "texts");
  const entries = [];
  for (const name of [".urls.md.conf", ".urls.pdf.conf"]) {
    const text = await boundedText(join(root, name), textLimits.configurationBytes);
    if (text === undefined)
      throw new Error("Both root text source configuration files are required.");
    entries.push(...parseTextSources(text));
  }
  if (
    entries.length > textLimits.entries ||
    new Set(entries.map((entry) => entry.name.toLowerCase())).size !== entries.length
  )
    throw new Error("Text source aliases must be unique and within the total limit.");
  const all = entries
    .flatMap((entry) => entry.sources.map((source) => ({ name: entry.name, ...source })))
    .map((entry, order) => ({ ...entry, order }));
  const selected = all.slice(0, options.limit ?? all.length);
  await safeDirectory(cache);
  await safeDirectory(reports);
  const lockPath = join(cache, ".text-sync-lock");
  const lock = await open(lockPath, "wx", 0o600).catch(() => {
    throw new Error(
      "Text sync cache is already locked; inspect the owner before removing a stale lock.",
    );
  });
  let reportLock: Awaited<ReturnType<typeof open>> | undefined;
  const reportLockPath = join(reports, ".text-report-lock");
  let memory = dependencies.memory;
  let opened = false;
  try {
    await lock.writeFile(`${process.pid}\n`);
    reportLock = await open(reportLockPath, "wx", 0o600).catch(() => {
      throw new Error("Text report directory is already locked by another sync.");
    });
    const statePath = join(cache, "source-state.json");
    // The portable report ledger preserves a static pin when this machine has no private cache.
    const ledgerPath =
      (await boundedText(statePath, textLimits.stateBytes)) === undefined
        ? join(reports, "source-state.json")
        : statePath;
    const previous = await readTextState(ledgerPath);
    const records = new Map(previous.records.map((record) => [record.key, record]));
    let opening: Promise<MemoryApi> | undefined;
    async function getStore(): Promise<MemoryApi> {
      if (memory) return memory;
      if (opening) return opening;
      opening = (async () => {
        if (options.xApi) {
          const token: unknown = process.env.X_BEARER_TOKEN;
          const capture = officialXCapture(
            token,
            createSourceCapture({
              readPreviousFile: async (version, file, signal) => {
                signal.throwIfAborted();
                return (
                  await Effect.runPromise(
                    openedMemory.read(version.sourceId, file.path, version.id),
                    { signal },
                  )
                ).bytes;
              },
            }),
          );
          const scope = await resolveMemoryScope({ root, data: join(cache, "store") });
          const openedMemory: MemoryApi = await Effect.runPromise(
            openMemory({ ...scope, dataDirectory: join(cache, "store"), capture }),
          );
          memory = openedMemory;
        } else
          memory = await Effect.runPromise(openMemoryHost({ root, data: join(cache, "store") }));
        opened = true;
        return memory;
      })();
      return opening;
    }
    const checkedAt = new Date().toISOString();
    const outcomes: TextRecord[] = [];
    let cursor = 0;
    let initialOrRefreshImports = 0;
    async function importSource(locator: string, signal: AbortSignal) {
      const store = await getStore();
      initialOrRefreshImports += 1;
      return Effect.runPromise(
        store
          .get({ locator, kind: "url", convert: true })
          .pipe(Effect.catchTag("MemoryError", (error) => Effect.succeed({ error: error.code }))),
        { signal },
      );
    }
    const sourceJobs = new Map<string, ReturnType<typeof importSource>>();
    const exportJobs = new Map<string, Promise<string>>();
    async function worker(): Promise<void> {
      while (cursor < selected.length && !dependencies.signal?.aborted) {
        const selectedEntry = selected[cursor++];
        if (!selectedEntry) break;
        const entry = {
          name: selectedEntry.name,
          url: selectedEntry.url,
          order: selectedEntry.order,
          refresh: selectedEntry.refresh,
          publishedAt: selectedEntry.publishedAt,
        };
        const key = sourceKey(entry.name, entry.url);
        const ownRecord = records.get(key);
        // Alias changes do not authorize refreshing a resource already captured under its exact URL.
        // Compare private-locator hashes, never just the public query-redacted display URL.
        const aliasCandidates =
          !entry.refresh && !ownRecord?.versionId
            ? previous.records.filter(
                (prior) =>
                  prior.versionId !== null &&
                  prior.source === displaySource(entry.url) &&
                  prior.key === sourceKey(prior.name, entry.url),
              )
            : [];
        const aliasPins = new Map(
          aliasCandidates.map((prior) => [
            JSON.stringify([prior.sourceId, prior.versionId, prior.contentHash]),
            prior,
          ]),
        );
        const conflictingPins = aliasPins.size > 1;
        const aliasRecord = aliasPins.size === 1 ? aliasPins.values().next().value : undefined;
        const old = ownRecord?.versionId ? ownRecord : (aliasRecord ?? ownRecord);
        const controller = new AbortController();
        const abort = () => controller.abort();
        dependencies.signal?.addEventListener("abort", abort, { once: true });
        const timer = setTimeout(abort, options.timeoutMs ?? textLimits.sourceMs);
        let record: TextRecord | undefined;
        let capturedReceipt: ImportResult | undefined;
        try {
          if (conflictingPins)
            throw new Error("Exact source URL has conflicting previously captured alias pins.");
          const pinned = !entry.refresh && old?.versionId !== null && old?.versionId !== undefined;
          let snapshot: Awaited<ReturnType<typeof inspectTextExport>> | undefined;
          let status: TextRecord["status"] = "pinned";
          let currentWarnings: readonly string[] | undefined;
          if (pinned && old) {
            snapshot = await inspectTextExport(old, cache, entry.url);
          } else {
            let sourceJob = sourceJobs.get(entry.url);
            if (!sourceJob) {
              sourceJob = importSource(entry.url, controller.signal);
              sourceJobs.set(entry.url, sourceJob);
            }
            const receipt = await sourceJob;
            if ("error" in receipt) record = failed(receipt.error);
            else {
              capturedReceipt = receipt;
              const store = await getStore();
              const exportKey = `${receipt.source.id}/${receipt.version.id}`;
              let exportJob = exportJobs.get(exportKey);
              if (!exportJob) {
                exportJob = ensureTextExport(store, receipt, cache);
                exportJobs.set(exportKey, exportJob);
              }
              await exportJob;
              snapshot = await inspectTextExport(
                {
                  sourceId: receipt.source.id,
                  versionId: receipt.version.id,
                  contentHash: receipt.version.contentHash,
                  source: displaySource(entry.url),
                },
                cache,
                entry.url,
              );
              status = receipt.status;
              currentWarnings = receipt.source.lastProvenance.warnings;
            }
          }
          if (snapshot) {
            const { version: sourceVersion, source, publication, markdown, directory } = snapshot;
            const images = sourceVersion.files.filter((file) => file.role === "image").length;
            const quality = textQuality({
              name: entry.name,
              locator: entry.url,
              markdown,
              images,
              warnings: currentWarnings ?? sourceVersion.provenance.warnings,
              socialApi: sourceVersion.provenance.parserVersion === "teamagent-x-api@1",
              hasPdf: sourceVersion.files.some(
                (file) => file.role === "original" && file.mediaType === "application/pdf",
              ),
            });
            const retainedDate = old?.sourcePublishedAt ?? publication.sourcePublishedAt;
            const sourcePublishedAt = entry.publishedAt ?? retainedDate;
            const publicationEvidence =
              entry.publishedAt !== null
                ? "configured"
                : old?.sourcePublishedAt
                  ? old.publicationEvidence
                  : publication.publicationEvidence;
            const publicationField =
              entry.publishedAt !== null
                ? "published= source-list assertion"
                : old?.sourcePublishedAt
                  ? old.publicationField
                  : publication.publicationField;
            const warnings = [...quality.warnings, ...publication.warnings];
            if (pinned)
              warnings.push(
                "Static snapshot checked locally; no remote freshness check, conversion or export rewrite was performed.",
              );
            if (pinned && old?.status === "failed")
              warnings.push(
                "The preceding remote attempt failed; the retained successful snapshot was checked locally, not refreshed.",
              );
            if (
              entry.publishedAt === null &&
              old?.sourcePublishedAt &&
              publication.sourcePublishedAt &&
              old.sourcePublishedAt !== publication.sourcePublishedAt
            )
              warnings.push(
                "Current publication metadata differs from the retained date; the original recorded date remains until explicitly corrected with published=.",
              );
            record = Schema.decodeUnknownSync(TextRecordSchema)({
              key,
              order: entry.order,
              name: entry.name,
              source: displaySource(entry.url),
              sourceId: source.id,
              versionId: sourceVersion.id,
              contentHash: sourceVersion.contentHash,
              checkedAt: pinned ? (old?.checkedAt ?? source.checkedAt) : checkedAt,
              validatedAt: checkedAt,
              mode: entry.refresh ? "refresh" : "static",
              firstCapturedAt: old?.firstCapturedAt ?? snapshot.firstCapturedAt,
              sourcePublishedAt,
              publicationEvidence,
              publicationField,
              sourceRevision: publication.sourceRevision ?? old?.sourceRevision ?? null,
              status,
              ...quality,
              warnings:
                warnings.length <= 256
                  ? warnings
                  : [
                      ...warnings.slice(0, 255),
                      "Further warnings are retained in source provenance.",
                    ],
              originalBytes: sourceVersion.files
                .filter((file) => file.role === "original")
                .reduce((total, file) => total + file.size, 0),
              markdownCharacters: markdown.trim().length,
              images,
              exportDirectory: relative(reports, directory).replaceAll("\\", "/"),
            });
          } else record ??= failed("capture_unavailable");
        } catch {
          record = failed(
            controller.signal.aborted ? "timeout_or_cancelled" : "integrity_or_storage",
          );
        } finally {
          clearTimeout(timer);
          dependencies.signal?.removeEventListener("abort", abort);
        }
        record ??= failed("capture_unavailable");
        records.set(key, record);
        outcomes.push(record);
        dependencies.onProgress?.(record);
        function failed(code: string): TextRecord {
          const localOnly =
            !entry.refresh &&
            (conflictingPins || (old?.versionId !== null && old?.versionId !== undefined));
          const warnings = [
            conflictingPins
              ? "The exact source URL has conflicting previously captured alias pins. Select an explicit refresh or resolve the recorded pins; no network fetch was attempted."
              : localOnly
                ? "Pinned local snapshot is missing or corrupt; restore the recorded cache/export. No network fetch or automatic repair was attempted."
                : `Import failed (${code}); no current content was validated.`,
          ];
          if (!old?.versionId && capturedReceipt)
            warnings.push(
              "A successful capture is retained, but its local export could not be validated. Restore/export the recorded version from memory; a later static run will not fetch it again.",
            );
          if (old?.versionId)
            warnings.push(
              "The preceding successful version is retained as stale evidence; its counts and hash are not a new successful extraction.",
            );
          if (!localOnly && socialSource(entry.url))
            warnings.push(
              options.xApi
                ? "Official X API lookup failed; token validity, developer-app access, post permissions, rate limits or response compatibility may be responsible. No public-HTML or mirror fallback was used."
                : "Public X/Twitter access can require authentication or browser rendering. No authenticated connector or alternate mirror was used.",
            );
          return {
            key,
            order: entry.order,
            name: entry.name,
            source: displaySource(entry.url),
            sourceId: old?.sourceId ?? capturedReceipt?.source.id ?? null,
            versionId: old?.versionId ?? capturedReceipt?.version.id ?? null,
            contentHash: old?.contentHash ?? capturedReceipt?.version.contentHash ?? null,
            checkedAt: localOnly ? (old?.checkedAt ?? checkedAt) : checkedAt,
            validatedAt: checkedAt,
            mode: entry.refresh ? "refresh" : "static",
            firstCapturedAt: old?.firstCapturedAt ?? capturedReceipt?.source.createdAt ?? null,
            sourcePublishedAt: entry.publishedAt ?? old?.sourcePublishedAt ?? null,
            publicationEvidence:
              entry.publishedAt !== null ? "configured" : (old?.publicationEvidence ?? "unknown"),
            publicationField:
              entry.publishedAt !== null
                ? "published= source-list assertion"
                : (old?.publicationField ?? null),
            sourceRevision: old?.sourceRevision ?? null,
            status: "failed",
            validation: "failed",
            originalBytes: old?.originalBytes ?? 0,
            markdownCharacters: old?.markdownCharacters ?? 0,
            images: old?.images ?? 0,
            headings: old?.headings ?? [],
            warnings,
            exportDirectory:
              old?.exportDirectory ??
              (capturedReceipt
                ? relative(
                    reports,
                    join(cache, "exports", capturedReceipt.source.id, capturedReceipt.version.id),
                  ).replaceAll("\\", "/")
                : null),
          };
        }
      }
    }
    const workers = await Promise.allSettled([worker(), worker()]);
    if (workers.some((result) => result.status === "rejected"))
      throw new Error("Text sync worker failed; source memory remains available for retry.");
    const state = Schema.decodeUnknownSync(TextStateSchema)({
      format: "teamagent-text-sync-v2",
      checkedAt,
      records: [...records.values()].sort(
        (a, b) => a.name.localeCompare(b.name) || a.order - b.order,
      ),
    });
    // Private state is committed first; every publication can be recreated from it on the next run.
    await atomicText(statePath, `${JSON.stringify(state, null, 2)}\n`);
    await publishTextReports(reports, state, previous);
    return {
      checkedAt,
      configured: all.length,
      selected: selected.length,
      initialOrRefreshImports,
      pinned: outcomes.filter((record) => record.status === "pinned").length,
      attempted: outcomes.length,
      skipped: all.length - outcomes.length,
      counts: Object.fromEntries(
        ["usable-text", "partial", "blocked", "unsupported", "failed"].map((quality) => [
          quality,
          outcomes.filter((record) => record.validation === quality).length,
        ]),
      ),
      records: outcomes.toSorted((a, b) => a.order - b.order),
    };
  } finally {
    try {
      if (opened && memory) await Effect.runPromise(memory.close());
    } finally {
      try {
        if (reportLock) {
          try {
            await reportLock.close();
          } finally {
            await unlink(reportLockPath);
          }
        }
      } finally {
        try {
          await lock.close();
        } finally {
          await unlink(lockPath);
        }
      }
    }
  }
}

if (import.meta.main) {
  const logger = createConsola({
    reporters: [
      {
        log: (entry) =>
          process.stderr.write(
            `${entry.type}: ${entry.args.filter((value) => typeof value === "string").join(" ")}\n`,
          ),
      },
    ],
  });
  const args = cli({
    name: "text-sync",
    version,
    help: {
      description:
        "Captured resources are static by default. Mark a URL refresh=true in its source list to permit remote refresh; published=ISO8601 records a declared source creation date. Existing static snapshots are only checked locally.",
    },
    strictFlags: true,
    flags: {
      xApi: {
        type: Boolean,
        description:
          "Explicitly use the official X API for initial/refresh imports only; never refresh captured static entries",
      },
      root: {
        type: String,
        default: ".",
        description: "Project root containing .urls.md.conf and .urls.pdf.conf",
      },
      cache: { type: String, description: "Override TEAMAGENT_TEXT_CACHE" },
      limit: { type: Number, description: "Maximum source URLs attempted (1-4096)" },
      timeoutMs: { type: Number, description: "Per-source deadline in milliseconds (100-300000)" },
    },
  });
  const controller = new AbortController();
  const abort = () => controller.abort();
  process.once("SIGINT", abort);
  process.once("SIGTERM", abort);
  try {
    const result = await syncTextResources(
      {
        root: args.flags.root,
        ...(args.flags.xApi === undefined ? {} : { xApi: args.flags.xApi }),
        ...(args.flags.cache === undefined ? {} : { cache: args.flags.cache }),
        ...(args.flags.limit === undefined ? {} : { limit: args.flags.limit }),
        ...(args.flags.timeoutMs === undefined ? {} : { timeoutMs: args.flags.timeoutMs }),
      },
      {
        signal: controller.signal,
        onProgress: (record) =>
          logger.info(`${record.name}: ${record.status}; ${record.validation}`),
      },
    );
    process.stdout.write(`${JSON.stringify(result, null, 2)}\n`);
    if (
      result.records.some((record) =>
        ["failed", "blocked", "unsupported"].includes(record.validation),
      ) ||
      controller.signal.aborted
    )
      process.exitCode = 1;
  } catch {
    logger.error(
      "Text sync could not complete. Check configuration, cache lock, permissions and importer setup; private input was not printed.",
    );
    process.exitCode = 1;
  } finally {
    process.removeListener("SIGINT", abort);
    process.removeListener("SIGTERM", abort);
  }
}
