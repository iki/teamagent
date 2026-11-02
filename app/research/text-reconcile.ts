import { createHash } from "node:crypto";
import { lstat, open, opendir, realpath, unlink, writeFile } from "node:fs/promises";
import { join, relative, resolve } from "node:path";
import { cli } from "cleye";
import { createConsola } from "consola";
import { Schema } from "effect";
import { MemoryIdSchema, Sha256Schema } from "@/memory";
import { version } from "../../package.json";
import { redact } from "../conversations/privacy.ts";
import { loadResearchSettings } from "./settings.ts";
import {
  displaySource,
  parseTextSources,
  redactSourceUrls,
  sourceKey,
  textLimits,
  textQuality,
  TextRecordSchema,
  TextStateSchema,
} from "./text-contracts.ts";
import {
  atomicText,
  boundedText,
  inspectTextExport,
  publishTextReports,
  readTextState,
  safeDirectory,
} from "./text-reports.ts";

export const TextReconciliationSchema = Schema.Struct({
  name: Schema.String.check(Schema.isMinLength(1), Schema.isMaxLength(180)),
  sourceId: MemoryIdSchema,
  expectedVersionId: MemoryIdSchema,
  expectedContentHash: Sha256Schema,
  expectedRecordHash: Sha256Schema,
  candidateVersionId: MemoryIdSchema,
  candidateContentHash: Sha256Schema,
  reason: Schema.String.check(
    Schema.isMinLength(12),
    Schema.isMaxLength(1000),
    Schema.isPattern(/^[^\p{Cc}]+$/u),
  ),
});
const OptionsSchema = Schema.Struct({
  root: Schema.NonEmptyString.check(Schema.isMaxLength(2048)),
  cache: Schema.optional(Schema.NonEmptyString.check(Schema.isMaxLength(2048))),
  request: TextReconciliationSchema,
});
const ReceiptSchema = Schema.Struct({
  format: Schema.Literal("teamagent-text-reconciliation-v1"),
  request: TextReconciliationSchema,
  before: TextRecordSchema,
  after: TextRecordSchema,
});

/** Adopt an explicitly reviewed local derivative; never fetch, convert or modify source policy. */
export async function reconcileTextResource(input: unknown) {
  const options = Schema.decodeUnknownSync(OptionsSchema)(input, { onExcessProperty: "error" });
  const request = options.request;
  if (
    request.expectedVersionId === request.candidateVersionId ||
    request.expectedContentHash === request.candidateContentHash ||
    request.reason !== redactSourceUrls(request.reason) ||
    request.reason !== redact(request.reason)
  )
    throw new Error("Reconciliation needs a distinct version and a public, query-free reason.");
  const root = await realpath(resolve(options.root));
  const settings = await loadResearchSettings(root);
  const cache = resolve(root, options.cache ?? settings.textCache);
  const reports = join(root, "spec", "analyses", "texts");
  await safeDirectory(cache);
  await safeDirectory(reports);
  const lockPath = join(cache, ".text-sync-lock");
  const lock = await open(lockPath, "wx", 0o600);
  const reportLockPath = join(reports, ".text-report-lock");
  let reportLock: Awaited<ReturnType<typeof open>> | undefined;
  try {
    await lock.writeFile(`${process.pid}\n`);
    reportLock = await open(reportLockPath, "wx", 0o600);
    const entries = [];
    for (const filename of [".urls.md.conf", ".urls.pdf.conf"]) {
      const text = await boundedText(join(root, filename), textLimits.configurationBytes);
      if (text === undefined) throw new Error("Both source lists are required.");
      entries.push(...parseTextSources(text));
    }
    if (
      entries.length > textLimits.entries ||
      new Set(entries.map((entry) => entry.name.toLowerCase())).size !== entries.length
    )
      throw new Error("Text source aliases must be unique and within the total limit.");
    const selected = entries.filter((entry) => entry.name === request.name);
    const entry = selected[0];
    const configured = entry?.sources[0];
    if (selected.length !== 1 || entry?.sources.length !== 1 || !configured || configured.refresh)
      throw new Error("Reconciliation requires one unambiguous configured static source.");
    const key = sourceKey(request.name, configured.url);
    const statePath = join(cache, "source-state.json");
    const previous = await readTextState(statePath);
    const current = previous.records.find((record) => record.key === key);
    if (!current || current.sourceId !== request.sourceId || current.mode !== "static")
      throw new Error("The configured static source does not match the requested identity.");
    if (
      previous.records.some(
        (record) => record.key !== key && record.key === sourceKey(record.name, configured.url),
      )
    )
      throw new Error("Multiple retained aliases require an explicit coordinated resolution.");
    const id = createHash("sha256").update(JSON.stringify(request)).digest("hex");
    const receiptDirectory = join(reports, "reconciliations");
    await safeDirectory(receiptDirectory);
    const receiptPath = join(receiptDirectory, `${id}.json`);
    const saved = await boundedText(receiptPath, textLimits.stateBytes);
    const priorReceipt =
      saved === undefined
        ? undefined
        : Schema.decodeUnknownSync(Schema.fromJsonString(ReceiptSchema))(saved, {
            onExcessProperty: "error",
          });
    if (priorReceipt && JSON.stringify(priorReceipt.request) !== JSON.stringify(request))
      throw new Error("Reconciliation receipt identity differs.");
    const alreadyApplied =
      current.versionId === request.candidateVersionId &&
      current.contentHash === request.candidateContentHash;
    const before = priorReceipt?.before ?? current;
    if (
      before.versionId !== request.expectedVersionId ||
      before.contentHash !== request.expectedContentHash ||
      before.sourceId !== request.sourceId ||
      before.key !== key ||
      createHash("sha256").update(JSON.stringify(before)).digest("hex") !==
        request.expectedRecordHash ||
      (!alreadyApplied && JSON.stringify(current) !== JSON.stringify(before)) ||
      (alreadyApplied && !priorReceipt)
    )
      throw new Error("The expected pin changed; reconcile the saved attempt before proceeding.");
    const oldSnapshot = await inspectTextExport(before, cache, configured.url);
    const candidate = await inspectTextExport(
      {
        sourceId: request.sourceId,
        versionId: request.candidateVersionId,
        contentHash: request.candidateContentHash,
        source: displaySource(configured.url),
      },
      cache,
      configured.url,
    );
    const originals = (snapshot: typeof candidate) =>
      snapshot.version.files.filter((file) => file.role === "original");
    if (
      originals(oldSnapshot).length === 0 ||
      candidate.source.workspaceId !== oldSnapshot.source.workspaceId ||
      candidate.source.kind !== oldSnapshot.source.kind ||
      candidate.source.locator !== oldSnapshot.source.locator ||
      candidate.source.convert !== oldSnapshot.source.convert ||
      candidate.version.number <= oldSnapshot.version.number ||
      candidate.source.createdAt !== oldSnapshot.source.createdAt ||
      JSON.stringify(originals(candidate)) !== JSON.stringify(originals(oldSnapshot))
    )
      throw new Error("A local derivative must retain every original byte and source identity.");
    const images = candidate.version.files.filter((file) => file.role === "image").length;
    const quality = textQuality({
      name: request.name,
      locator: configured.url,
      markdown: candidate.markdown,
      images,
      warnings: candidate.version.provenance.warnings,
      socialApi: candidate.version.provenance.parserVersion === "teamagent-x-api@1",
      hasPdf: originals(candidate).some((file) => file.mediaType === "application/pdf"),
    });
    if (["failed", "blocked", "unsupported"].includes(quality.validation))
      throw new Error("Candidate lacks usable partial or extracted text.");
    const reportWarnings =
      quality.warnings.length < 256
        ? quality.warnings
        : [
            ...quality.warnings.slice(0, 254),
            "Additional report warnings omitted to retain the reconciliation notice; consult the version provenance and extraction diagnostics.",
          ];
    const after = Schema.decodeUnknownSync(TextRecordSchema)({
      ...before,
      versionId: candidate.version.id,
      contentHash: candidate.version.contentHash,
      status: "updated",
      validatedAt: priorReceipt?.after.validatedAt ?? new Date().toISOString(),
      ...quality,
      warnings: [
        ...reportWarnings,
        "Explicit local derivative reconciliation retained all original bytes. Source refresh policy and last remote-check time are unchanged.",
      ],
      markdownCharacters: candidate.markdown.trim().length,
      images,
      exportDirectory: relative(reports, candidate.directory).replaceAll("\\", "/"),
    });
    if (priorReceipt && JSON.stringify(priorReceipt.after) !== JSON.stringify(after))
      throw new Error("Saved reconciliation differs from the verified candidate representation.");
    if (alreadyApplied && JSON.stringify(current) !== JSON.stringify(after))
      throw new Error("Applied reconciliation has later state; refusing to overwrite it on retry.");
    if (!priorReceipt) {
      const text = `${JSON.stringify({ format: "teamagent-text-reconciliation-v1", request, before, after }, null, 2)}\n`;
      let count = 0;
      let bytes = Buffer.byteLength(text);
      const inventory = await opendir(receiptDirectory);
      for await (const item of inventory) {
        count += 1;
        if (
          count >= 4096 ||
          !item.isFile() ||
          item.isSymbolicLink() ||
          !/^[a-f0-9]{64}\.json$/.test(item.name)
        )
          throw new Error("Reconciliation receipt inventory is unsafe or exceeds its bound.");
        const info = await lstat(join(receiptDirectory, item.name));
        bytes += info.size;
        if (
          !info.isFile() ||
          info.isSymbolicLink() ||
          info.size > textLimits.stateBytes ||
          bytes > 64 * 1024 * 1024
        )
          throw new Error("Reconciliation receipt inventory exceeds its byte bound.");
      }
      await writeFile(receiptPath, text, { flag: "wx", mode: 0o600 });
    }
    const validatedAt = after.validatedAt;
    const previousCheckedAt = Date.parse(previous.checkedAt);
    const checkedAt =
      validatedAt !== null &&
      (!Number.isFinite(previousCheckedAt) || Date.parse(validatedAt) > previousCheckedAt)
        ? validatedAt
        : previous.checkedAt;
    const state = Schema.decodeUnknownSync(TextStateSchema)({
      ...previous,
      checkedAt,
      records: previous.records.map((record) => (record.key === key ? after : record)),
    });
    await atomicText(statePath, `${JSON.stringify(state, null, 2)}\n`);
    await publishTextReports(
      reports,
      state,
      {
        ...previous,
        records: previous.records.map((record) => (record.key === key ? before : record)),
      },
      id,
    );
    return { id, alreadyApplied, record: after };
  } finally {
    try {
      if (reportLock) {
        await reportLock.close();
        await unlink(reportLockPath);
      }
    } finally {
      await lock.close();
      await unlink(lockPath);
    }
  }
}

if (import.meta.main) {
  const args = cli({
    name: "text-reconcile",
    version,
    strictFlags: true,
    flags: {
      root: { type: String, default: ".", description: "Project root" },
      cache: { type: String, description: "Explicit text-cache override" },
      request: { type: String, description: "JSON file with exact old/new pins and public reason" },
    },
    help: {
      description:
        "Explicitly adopt a reviewed, already exported derivative of one static source. Offline: no fetch, conversion, credentials or refresh-setting changes. All original bytes and dates must be retained; prior receipts support exact retry. The reason is public repository evidence; do not include secrets or private URLs.",
    },
  });
  const logger = createConsola({
    reporters: [
      {
        log: () =>
          process.stderr.write(
            "error: Text reconciliation failed; inspect the request, saved receipt and pinned exports.\n",
          ),
      },
    ],
  });
  try {
    if (args._["--"].length || args._.length || !args.flags.request)
      throw new Error("A request file is required.");
    const text = await boundedText(resolve(args.flags.request), 16384);
    if (text === undefined) throw new Error("Request is unavailable.");
    const request = Schema.decodeUnknownSync(Schema.fromJsonString(TextReconciliationSchema))(
      text,
      {
        onExcessProperty: "error",
      },
    );
    const result = await reconcileTextResource({
      root: args.flags.root,
      ...(args.flags.cache === undefined ? {} : { cache: args.flags.cache }),
      request,
    });
    process.stdout.write(`${JSON.stringify(result)}\n`);
  } catch {
    logger.error("Reconciliation failed.");
    process.exitCode = 1;
  }
}
