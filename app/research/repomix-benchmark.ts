#!/usr/bin/env bun
import { createHash } from "node:crypto";
import { mkdir, readFile, stat, writeFile } from "node:fs/promises";
import { dirname, relative, resolve } from "node:path";
import { cli } from "cleye";
import { createConsola } from "consola";
import { Schema } from "effect";
import { version } from "../../package.json";
import { runProcess } from "../imports/process.ts";
import { withHostInterruption } from "../runtime/interruption.ts";
import { parseAnalysisJson } from "./analysis-contracts.ts";
import { gitReader } from "./analysis-sync.ts";
import { loadResearchSettings } from "./settings.ts";

const PackSchema = Schema.Struct({ files: Schema.Record(Schema.String, Schema.String) });
const PackageSchema = Schema.Struct({ name: Schema.Literal("repomix"), version: Schema.String });
const sha256 = (value: string | Uint8Array): string =>
  createHash("sha256").update(value).digest("hex");
const samples = [
  {
    id: "ai-agents-skills--docs.skills",
    path: "ai-agents-skills/docs.skills",
    url: "https://github.com/agentskills/agentskills",
  },
  {
    id: "ai-agents-skills--search.vercel",
    path: "ai-agents-skills/search.vercel",
    url: "https://github.com/vercel-labs/skills",
  },
  { id: "ai-spec--spec-kit", path: "ai-spec/spec-kit", url: "https://github.com/github/spec-kit" },
];

export async function benchmarkRepomix(
  root: string,
  entry: string,
  signal: AbortSignal,
): Promise<string> {
  const settings = await loadResearchSettings(root);
  const installedEntry = resolve(entry);
  const pkg = parseAnalysisJson(
    PackageSchema,
    await readFile(resolve(dirname(installedEntry), "../package.json"), "utf8"),
  );
  const entryHash = sha256(await readFile(installedEntry));
  const ignoreText = await readFile(
    resolve(root, "spec/archive/legacy-research/tooling/.rmxignore"),
    "utf8",
  );
  const ignores = ignoreText
    .split(/\r?\n/u)
    .map((line) => line.trim())
    .filter((line) => line.length > 0 && !line.startsWith("#"));
  const runId = new Date().toISOString().replaceAll(/[:.]/gu, "-");
  const outputDirectory = resolve(settings.repomixCache, `benchmark-${runId}`);
  await mkdir(settings.repomixCache, { recursive: true });
  await mkdir(outputDirectory, { recursive: false });
  const git = gitReader(signal);
  const measurements: unknown[] = [];
  for (const sample of samples) {
    const path = resolve(settings.gitCache, sample.path);
    const head = await git(path, ["rev-parse", "HEAD"]);
    const tracked = await git(path, ["ls-files", "-z"]);
    const dirty = await git(path, ["status", "--porcelain", "--untracked-files=no"]);
    if (head.code !== 0 || tracked.code !== 0 || dirty.code !== 0)
      throw new Error(`Cannot establish source provenance for ${sample.id}`);
    const trackedPaths = tracked.text.split("\0").filter(Boolean);
    for (const profile of ["legacy-ignore", "evidence-defaults"]) {
      for (const run of ["first-invocation", "immediate-repeat"]) {
        signal.throwIfAborted();
        const stem = `${sample.id}--${profile}--${run}`;
        const output = resolve(outputDirectory, `${stem}.json`);
        const config = resolve(outputDirectory, `${stem}.config.json`);
        const configuration = {
          input: { maxFileSize: 500_000, processors: [] },
          output: {
            filePath: output,
            style: "json",
            fileSummary: true,
            directoryStructure: true,
            files: true,
            compress: false,
            removeComments: false,
            removeEmptyLines: false,
            copyToClipboard: false,
            git: { sortByChanges: false, includeDiffs: false, includeLogs: false },
          },
          ignore: {
            useGitignore: true,
            useDotIgnore: true,
            useDefaultPatterns: true,
            customPatterns: profile === "legacy-ignore" ? ignores : [],
          },
          security: { enableSecurityCheck: true },
        };
        const configText = JSON.stringify(configuration, null, 2) + "\n";
        await writeFile(config, configText, { flag: "wx" });
        const started = performance.now();
        let result: unknown;
        try {
          await runProcess(
            process.execPath,
            [installedEntry, path, "--config", config, "--quiet"],
            {
              signal,
              cwd: root,
              bytes: 2_000_000,
              timeoutMs: 180_000,
            },
          );
          const elapsedMs = performance.now() - started;
          const bytes = (await stat(output)).size;
          if (bytes > 64_000_000) throw new Error("Pack exceeded 64 MB audit read limit");
          const text = await readFile(output, "utf8");
          const pack = parseAnalysisJson(PackSchema, text);
          const paths = Object.keys(pack.files);
          const trackedSet = new Set(trackedPaths);
          const packedTracked = paths.filter((item) => trackedSet.has(item));
          result = {
            status: "completed",
            elapsedMs,
            bytes,
            packedFiles: paths.length,
            packedTrackedFiles: packedTracked.length,
            omittedTrackedFiles: trackedPaths.length - packedTracked.length,
            testOrFixturePaths: paths.filter((item) =>
              /(?:^|\/)(?:tests?|fixtures?|__tests__)(?:\/|$)|\.(?:test|spec)\./u.test(item),
            ).length,
            outputSha256: sha256(text),
            outputPath: relative(root, output).replaceAll("\\", "/"),
            omittedPaths: trackedPaths.filter((item) => !paths.includes(item)).slice(0, 100),
            omittedPathsTruncated: trackedPaths.length - packedTracked.length > 100,
          };
        } catch (error) {
          if (signal.aborted) throw error;
          result = {
            status: "unavailable",
            elapsedMs: performance.now() - started,
            reason:
              "Pack process or output validation failed; no success, size or quality inferred",
          };
        }
        measurements.push({
          id: sample.id,
          source: sample.url,
          sha: head.text.trim(),
          trackedFiles: trackedPaths.length,
          dirty: dirty.text.trim().length > 0,
          profile,
          run,
          configSha256: sha256(configText),
          result,
        });
        await writeFile(
          resolve(outputDirectory, "results.json"),
          JSON.stringify(
            {
              format: "teamagent-repomix-benchmark-v1",
              generatedAt: runId,
              runtime: { bun: Bun.version, platform: process.platform, architecture: process.arch },
              repomix: { version: pkg.version, entrySha256: entryHash },
              ignoreSha256: sha256(ignoreText),
              cacheCondition:
                "OS and tool caches were not cleared; first invocation and immediate repeat only",
              scope:
                "Three preselected repositories; pack coverage and elapsed time only; no retrieval or answer-quality evaluation",
              measurements,
            },
            null,
            2,
          ) + "\n",
        );
      }
    }
  }
  return resolve(outputDirectory, "results.json");
}

if (import.meta.main) {
  const args = cli({
    name: "repomix-benchmark",
    strictFlags: true,
    flags: {
      version: { type: Boolean, alias: "V" },
      root: { type: String, default: resolve(import.meta.dir, "../..") },
      entry: String,
    },
    help: { description: "Measure an explicitly selected installed Repomix under Bun", version },
  });
  const log = createConsola({ stdout: process.stderr, stderr: process.stderr }).withTag(
    "repomix-benchmark",
  );
  if (args.flags.version) process.stdout.write(`${version}\n`);
  else {
    try {
      if (!args.flags.entry || args._.length > 0 || args._["--"].length > 0)
        throw new Error("Supply --entry with the installed Repomix bin/repomix.cjs path");
      const entry = args.flags.entry;
      const result = await withHostInterruption((signal) =>
        benchmarkRepomix(args.flags.root, entry, signal),
      );
      process.stdout.write(`${relative(args.flags.root, result).replaceAll("\\", "/")}\n`);
    } catch (error) {
      log.error(error instanceof Error ? error.message : "Repomix benchmark failed");
      process.exitCode = 1;
    }
  }
}
