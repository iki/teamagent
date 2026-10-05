import { mkdir, readFile, stat, writeFile } from "node:fs/promises";
import { basename, isAbsolute, join, resolve } from "node:path";
import { arch, cpus, platform, release, totalmem } from "node:os";
import { cli } from "cleye";
import { createConsola } from "consola";
import { Effect } from "effect";
import type { ExtractorProfile } from "@/memory";
import { convertDocument, importDoctor, parserVersion } from "../imports/documents.ts";
import {
  inspectExtractorProfile,
  loadExtractorConfig,
  resolveExtractorProfile,
} from "../imports/extractors.ts";
import { importLimits, safeRelative } from "../imports/limits.ts";
import { DocumentManifestSchema } from "./contracts.ts";
import {
  extractorQuality,
  extractorScoringVersion,
  summarizeExtractorQuality,
  type ExtractorQuality,
} from "./extractors-metrics.ts";
import { quantile } from "./metrics.ts";
import { readJson, repository, sha256, writeJson } from "./io.ts";
import { withHostInterruption } from "../runtime/interruption.ts";

type Measurement = Readonly<{
  profile: string;
  source: string;
  repeat: number;
  phase: "initial" | "repeat";
  elapsedMs: number;
  status: "success" | "error" | "timeout" | "unavailable";
  error: string | null;
  quality: ExtractorQuality | null;
  markdownBytes: number | null;
  markdownSha256: string | null;
  imageCount: number | null;
  imageBytes: number | null;
  outputBytes: number | null;
  parser: string | null;
  warnings: readonly string[];
}>;

const log = createConsola({ stdout: process.stderr, stderr: process.stderr }).withTag(
  "extractor-benchmark",
);

function safeId(id: string): void {
  if (!/^[a-z0-9][a-z0-9._-]{0,63}$/.test(id) || !safeRelative(id))
    throw new Error(`Invalid or unsafe benchmark artifact ID: ${id}`);
}

function failedStatus(error: unknown, aborted: boolean): Measurement["status"] {
  if (aborted || (error instanceof Error && /timed out|timeout|deadline/i.test(error.message)))
    return "timeout";
  if (
    error instanceof Error &&
    "code" in error &&
    (error.code === "ENOENT" || error.code === "EACCES")
  )
    return "unavailable";
  return "error";
}

export async function runExtractorBenchmark(options: {
  configPath: string;
  profileIds: readonly string[];
  outputDirectory: string;
  repeats: number;
  sourceIds?: readonly string[];
  setupPath?: string;
  signal?: AbortSignal;
}): Promise<void> {
  options.signal?.throwIfAborted();
  const runOptions = options.signal === undefined ? {} : { signal: options.signal };
  if (!Number.isInteger(options.repeats) || options.repeats < 0 || options.repeats > 3)
    throw new Error("--repeat must be an integer from 0 to 3 additional runs");
  if (
    options.profileIds.length === 0 ||
    options.profileIds.length > 32 ||
    new Set(options.profileIds).size !== options.profileIds.length
  )
    throw new Error("Select 1 to 32 distinct profile IDs");
  options.profileIds.forEach(safeId);
  const configPath = resolve(options.configPath);
  const config = await Effect.runPromise(loadExtractorConfig(configPath), runOptions);
  const profiles: ExtractorProfile[] = [];
  for (const id of options.profileIds)
    profiles.push(await Effect.runPromise(resolveExtractorProfile(config, id), runOptions));
  if (
    profiles.some(
      (profile) =>
        profile.engine !== "builtin" &&
        profile.mediaTypes !== undefined &&
        !profile.mediaTypes.includes("application/pdf"),
    )
  )
    throw new Error("Every selected profile must actually handle PDF documents");
  const manifestPath = join(repository, "app/benchmark/cases-documents.json");
  const scannedManifestPath = join(repository, "data/extractor-benchmarks/fixtures/manifest.json");
  const referenceManifest = await readJson(manifestPath, DocumentManifestSchema);
  const scannedManifest = await readJson(scannedManifestPath, DocumentManifestSchema);
  const manifest = {
    sources: [
      ...referenceManifest.sources.map((source) => ({ ...source, lane: "reference-pdfs" })),
      ...scannedManifest.sources.map((source) => ({ ...source, lane: "synthetic-scanned" })),
    ],
    cases: [...referenceManifest.cases, ...scannedManifest.cases],
  };
  if (new Set(manifest.sources.map((source) => source.id)).size !== manifest.sources.length)
    throw new Error("Duplicate source IDs in frozen manifest");
  if (
    options.sourceIds !== undefined &&
    (options.sourceIds.length === 0 ||
      new Set(options.sourceIds).size !== options.sourceIds.length ||
      options.sourceIds.some((id) => !manifest.sources.some((source) => source.id === id)))
  )
    throw new Error("--sources must select distinct known source IDs");
  const sources: (Omit<(typeof manifest.sources)[number], "bytes"> & { bytes: Uint8Array })[] = [];
  for (const source of manifest.sources) {
    options.signal?.throwIfAborted();
    if (options.sourceIds !== undefined && !options.sourceIds.includes(source.id)) continue;
    safeId(source.id);
    const path = resolve(repository, source.path);
    if ((await stat(path)).size > importLimits.fileBytes)
      throw new Error(`PDF exceeds import size limit: ${source.id}`);
    const bytes = await readFile(path);
    if (bytes.length !== source.bytes || sha256(bytes) !== source.sha256)
      throw new Error(`PDF source drift: ${source.id}`);
    sources.push({ ...source, bytes });
  }
  const output = resolve(options.outputDirectory);
  options.signal?.throwIfAborted();
  await mkdir(resolve(output, ".."), { recursive: true });
  await mkdir(output);
  const createdAt = new Date().toISOString();
  const codeFiles = [
    "app/benchmark/extractors.ts",
    "app/benchmark/extractors-metrics.ts",
    "app/imports/documents.ts",
    "app/imports/extractors.ts",
    "app/imports/process.ts",
    "app/imports/worker.py",
    "app/imports/marker-windows.py",
    "app/imports/limits.ts",
    "lib/memory/extractors.ts",
    "app/runtime/interruption.ts",
    "app/imports/lifecycle.ts",
  ];
  const codeHashes: Record<string, string> = {};
  for (const path of codeFiles) codeHashes[path] = sha256(await readFile(join(repository, path)));
  const profileMetadata = [];
  for (const profile of profiles) {
    options.signal?.throwIfAborted();
    const inspection = await Effect.runPromise(inspectExtractorProfile(profile), runOptions);
    const builtinInspection =
      profile.engine === "builtin" ? await Effect.runPromise(importDoctor(), runOptions) : null;
    let commandSha256: string | null = null;
    let commandAvailable = profile.engine === "builtin";
    if (profile.engine !== "builtin") {
      try {
        const executable = isAbsolute(profile.command)
          ? profile.command
          : Bun.which(profile.command, { PATH: profile.env?.PATH ?? process.env.PATH ?? "" });
        if (executable === null) throw new Error("Executable unavailable");
        const info = await stat(executable);
        if (info.isFile() && info.size <= 256 * 1024 * 1024) {
          commandSha256 = sha256(await readFile(executable));
          commandAvailable = true;
        }
      } catch {
        /* Availability failure remains explicit in each requested measurement. */
      }
    }
    profileMetadata.push({
      id: profile.id,
      engine: profile.engine,
      expectedVersion: profile.engine === "builtin" ? parserVersion : profile.version,
      profileSha256: sha256(JSON.stringify(profile)),
      commandSha256,
      commandAvailable,
      environmentKeys: profile.engine === "builtin" ? [] : Object.keys(profile.env ?? {}).sort(),
      inspection,
      builtinInspection,
    });
  }
  const provenance = {
    format: "teamagent-extractor-benchmark-v1",
    scoringVersion: extractorScoringVersion,
    createdAt,
    config: {
      path: configPath,
      sha256: sha256(await readFile(configPath)),
      resolvedSha256: sha256(JSON.stringify(config)),
    },
    manifests: [
      { lane: "reference-pdfs", path: manifestPath, sha256: sha256(await readFile(manifestPath)) },
      {
        lane: "synthetic-scanned",
        path: scannedManifestPath,
        sha256: sha256(await readFile(scannedManifestPath)),
      },
    ],
    setup:
      options.setupPath === undefined
        ? null
        : {
            path: resolve(options.setupPath),
            sha256: sha256(await readFile(resolve(options.setupPath))),
          },
    runtime: {
      bun: Bun.version,
      platform: platform(),
      release: release(),
      arch: arch(),
      cpu: cpus()[0]?.model ?? "unknown",
      logicalCpuCount: cpus().length,
      totalMemoryBytes: totalmem(),
    },
    codeHashes,
    profiles: profileMetadata,
    sources: sources.map(({ bytes, ...source }) => ({ ...source, bytes: bytes.length })),
    repeats: options.repeats,
    timing:
      "Sequential fresh CLI processes and fresh output directories. Includes input staging, CLI startup/model loading, conversion and output validation. Excludes source hashing, scoring, benchmark artifact writes and prior runtime/model installation. OS file caches and model weight caches are not evicted; repeated processes do not reuse a live model. No converted document output is reused.",
    scoring:
      "Frozen annotated important-information anchor recall, not a percentage of all information or semantic answer accuracy. Failed/unavailable runs have null quality. Effective initial recall keeps every selected source's anchors in the denominator; conditional recall is labeled separately.",
  };
  options.signal?.throwIfAborted();
  await writeJson(join(output, "provenance.json"), provenance);
  const measurements: Measurement[] = [];
  for (const profile of profiles) {
    for (const source of sources) {
      for (let repeat = 0; repeat <= options.repeats; repeat += 1) {
        options.signal?.throwIfAborted();
        const directory = join(output, profile.id, source.id, String(repeat));
        await mkdir(directory, { recursive: true });
        const timeoutMs =
          profile.engine === "builtin"
            ? importLimits.processMs + 5_000
            : (profile.timeoutMs ?? importLimits.processMs) + 5_000;
        const timeout = AbortSignal.timeout(timeoutMs);
        const signal =
          options.signal === undefined ? timeout : AbortSignal.any([options.signal, timeout]);
        const started = performance.now();
        let measurement: Measurement;
        const conversion = await convertDocument({
          bytes: source.bytes,
          name: basename(source.path),
          mediaType: "application/pdf",
          origin: source.id,
          directory: join(directory, "work"),
          signal,
          extractor: profile,
        }).then(
          (result) => ({ success: true, result, elapsedMs: performance.now() - started }) as const,
          (error: unknown) =>
            ({ success: false, error, elapsedMs: performance.now() - started }) as const,
        );
        // convertDocument has awaited its owned process/staging cleanup. An operator
        // interruption is not an extractor measurement and must stop the matrix.
        options.signal?.throwIfAborted();
        if (conversion.success) {
          const { result, elapsedMs } = conversion;
          const markdown = new TextEncoder().encode(result.markdown);
          await writeFile(join(directory, "extracted.md"), markdown, { flag: "wx" });
          let imageBytes = 0;
          const images = [];
          if (result.images.length > 0) await mkdir(join(directory, "assets"));
          for (const image of result.images) {
            if (!/^[a-f0-9]{64}\.[a-z0-9]{1,8}$/.test(image.name))
              throw new Error("Invalid benchmark image artifact name");
            const bytes = Buffer.from(image.base64, "base64");
            imageBytes += bytes.length;
            images.push({
              name: image.name,
              mediaType: image.mediaType,
              sha256: sha256(bytes),
              bytes: bytes.length,
            });
            await writeFile(join(directory, "assets", image.name), bytes, { flag: "wx" });
          }
          await writeJson(join(directory, "images.json"), images);
          measurement = {
            profile: profile.id,
            source: source.id,
            repeat,
            phase: repeat === 0 ? "initial" : "repeat",
            elapsedMs,
            status: "success",
            error: null,
            quality: extractorQuality(source.id, result.markdown, manifest.cases),
            markdownBytes: markdown.length,
            markdownSha256: sha256(markdown),
            imageCount: result.images.length,
            imageBytes,
            outputBytes: markdown.length + imageBytes,
            parser: result.parserVersion,
            warnings: result.warnings,
          };
        } else {
          const { error } = conversion;
          measurement = {
            profile: profile.id,
            source: source.id,
            repeat,
            phase: repeat === 0 ? "initial" : "repeat",
            elapsedMs: conversion.elapsedMs,
            status:
              profileMetadata.find((metadata) => metadata.id === profile.id)?.inspection
                .available === false
                ? "unavailable"
                : failedStatus(error, signal.aborted),
            error:
              error instanceof Error
                ? error.message.slice(0, 2000)
                : "Unrecognized conversion failure",
            quality: null,
            markdownBytes: null,
            markdownSha256: null,
            imageCount: null,
            imageBytes: null,
            outputBytes: null,
            parser: null,
            warnings: [],
          };
        }
        options.signal?.throwIfAborted();
        measurements.push(measurement);
        await writeJson(join(directory, "measurement.json"), measurement);
        log.info(
          `${profile.id} / ${source.id} / ${repeat}: ${measurement.status}, ${(measurement.elapsedMs / 1000).toFixed(2)} s`,
        );
      }
    }
  }
  options.signal?.throwIfAborted();
  const denominator = summarizeExtractorQuality(
    sources.map((source) => extractorQuality(source.id, "", manifest.cases)),
  );
  const summaries = profiles.map((profile) => {
    const selected = measurements.filter((measurement) => measurement.profile === profile.id);
    const initial = selected.filter((measurement) => measurement.repeat === 0);
    const successful = initial.filter((measurement) => measurement.status === "success");
    const conditional = summarizeExtractorQuality(
      successful.flatMap((measurement) =>
        measurement.quality === null ? [] : [measurement.quality],
      ),
    );
    const repeatedMs = selected
      .filter((measurement) => measurement.repeat > 0 && measurement.status === "success")
      .map((measurement) => measurement.elapsedMs);
    const qualityByLane = [...new Set(sources.map((source) => source.lane))].map((lane) => {
      const laneSources = sources.filter((source) => source.lane === lane);
      const laneInitial = initial.filter((measurement) =>
        laneSources.some((source) => source.id === measurement.source),
      );
      const laneSuccess = laneInitial.filter((measurement) => measurement.status === "success");
      const laneDenominator = summarizeExtractorQuality(
        laneSources.map((source) => extractorQuality(source.id, "", manifest.cases)),
      );
      const laneQuality = summarizeExtractorQuality(
        laneSuccess.flatMap((measurement) =>
          measurement.quality === null ? [] : [measurement.quality],
        ),
      );
      return {
        lane,
        expectedDocuments: laneSources.length,
        successfulDocuments: laneSuccess.length,
        expectedAnchors: laneDenominator.goldAnchors,
        effectiveRecoveredAnchors: laneQuality.recoveredAnchors,
        effectiveImportantInformationPercent:
          laneDenominator.goldAnchors === 0
            ? null
            : (100 * laneQuality.recoveredAnchors) / laneDenominator.goldAnchors,
        completeCorpusQuality: laneSuccess.length === laneSources.length ? laneQuality : null,
        conditionalSuccessfulDocumentQuality: laneQuality,
        initialTotalMs: laneInitial.reduce((sum, measurement) => sum + measurement.elapsedMs, 0),
        completeCorpusInitialMs:
          laneSuccess.length === laneSources.length
            ? laneInitial.reduce((sum, measurement) => sum + measurement.elapsedMs, 0)
            : null,
      };
    });
    return {
      profile: profile.id,
      expectedDocuments: sources.length,
      successfulDocuments: successful.length,
      successfulRuns: selected.filter((measurement) => measurement.status === "success").length,
      requestedRuns: selected.length,
      qualityByLane,
      statusCounts: {
        success: selected.filter((measurement) => measurement.status === "success").length,
        unavailable: selected.filter((measurement) => measurement.status === "unavailable").length,
        error: selected.filter((measurement) => measurement.status === "error").length,
        timeout: selected.filter((measurement) => measurement.status === "timeout").length,
      },
      completeCorpusQuality: successful.length === sources.length ? conditional : null,
      conditionalSuccessfulDocumentQuality: conditional,
      effectiveRecoveredAnchors: conditional.recoveredAnchors,
      expectedAnchors: denominator.goldAnchors,
      effectiveImportantInformationPercent:
        denominator.goldAnchors === 0
          ? null
          : (100 * conditional.recoveredAnchors) / denominator.goldAnchors,
      initialTotalMs: initial.reduce((sum, measurement) => sum + measurement.elapsedMs, 0),
      successfulInitialTotalMs: successful.reduce(
        (sum, measurement) => sum + measurement.elapsedMs,
        0,
      ),
      completeCorpusInitialMs:
        successful.length === sources.length
          ? initial.reduce((sum, measurement) => sum + measurement.elapsedMs, 0)
          : null,
      successfulRepeatMedianMs: repeatedMs.length === 0 ? null : quantile(repeatedMs, 0.5),
      successfulRepeatP95Ms: repeatedMs.length === 0 ? null : quantile(repeatedMs, 0.95),
      repeatStable:
        options.repeats === 0
          ? null
          : initial.every((first) =>
              selected
                .filter((measurement) => measurement.source === first.source)
                .every(
                  (measurement) =>
                    measurement.status === first.status &&
                    measurement.markdownSha256 === first.markdownSha256,
                ),
            ),
      initialMarkdownBytes: successful.reduce(
        (sum, measurement) => sum + (measurement.markdownBytes ?? 0),
        0,
      ),
      initialImageBytes: successful.reduce(
        (sum, measurement) => sum + (measurement.imageBytes ?? 0),
        0,
      ),
      initialImageCount: successful.reduce(
        (sum, measurement) => sum + (measurement.imageCount ?? 0),
        0,
      ),
    };
  });
  await writeJson(join(output, "results.json"), {
    ...provenance,
    denominator,
    summaries,
    measurements,
  });
  log.success(`Saved immutable extractor results: ${join(output, "results.json")}`);
}

if (import.meta.main) {
  const parsed = cli({
    name: "extractor-benchmark",
    strictFlags: true,
    flags: {
      config: { type: String, description: "Explicit trusted extractor configuration path" },
      profiles: {
        type: String,
        description: "Comma-separated profile IDs in sequential run order",
      },
      output: { type: String, description: "New immutable result directory" },
      repeat: {
        type: Number,
        default: 1,
        description: "Additional fresh-process runs per document (0..3)",
      },
      sources: { type: String, description: "Optional explicit subset of frozen PDF source IDs" },
      setup: {
        type: String,
        description: "Optional separately measured installation/model setup provenance file",
      },
    },
  });
  if (
    parsed.flags.config === undefined ||
    parsed.flags.profiles === undefined ||
    parsed.flags.output === undefined
  )
    throw new Error("--config, --profiles and --output are required");
  const configPath = parsed.flags.config;
  const profileIds = parsed.flags.profiles.split(",").map((id) => id.trim());
  const outputDirectory = parsed.flags.output;
  await withHostInterruption((signal) =>
    runExtractorBenchmark({
      configPath,
      profileIds,
      outputDirectory,
      repeats: parsed.flags.repeat,
      signal,
      ...(parsed.flags.sources === undefined
        ? {}
        : { sourceIds: parsed.flags.sources.split(",").map((id) => id.trim()) }),
      ...(parsed.flags.setup === undefined ? {} : { setupPath: parsed.flags.setup }),
    }),
  );
}
