import { expect, test } from "bun:test";
import assert from "node:assert/strict";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { Schema } from "effect";
import { runExtractorBenchmark } from "../app/benchmark/extractors.ts";
import { readJson, writeJson } from "../app/benchmark/io.ts";
import type { BenchmarkCase } from "../app/benchmark/contracts.ts";
import {
  containsExtractorAnchor,
  extractorQuality,
  extractorText,
  summarizeExtractorQuality,
} from "../app/benchmark/extractors-metrics.ts";

const task: BenchmarkCase = {
  id: "question",
  split: "dev",
  repo: "fixture",
  category: "table",
  query: "What is the limit?",
  evidence: [{ path: "fixture", page: 2, contains: ["The limit is 12.5%.", "claim_lock IS NULL"] }],
  answerFacts: ["Both facts are needed."],
  rationale: "Synthetic evaluator fixture.",
  answerable: true,
};

test("extractor score tolerates cosmetic Markdown and Unicode without accepting altered facts", () => {
  const text = "The **limit** is １２.５%.\n| `claim_lock` | IS NULL |";
  const quality = extractorQuality("fixture", text, [task]);
  expect(quality.importantInformationPercent).toBe(100);
  expect(quality.completeCases).toBe(1);
  expect(quality.strictRecoveredAnchors).toBe(0);
  expect(
    extractorQuality("fixture", text.replace("１２.５", "１２.６"), [task]).recoveredAnchors,
  ).toBe(1);
  expect(
    extractorQuality("fixture", "IS NULL claim_lock. The limit is 12.5%.", [task]).recoveredAnchors,
  ).toBe(1);
  expect(extractorText("coordi-\nnator has high-quality input")).toBe(
    "coordinator has high-quality input",
  );
});

test("extractor anchors do not match embedded numbers/identifiers or discard signs and decimal points", () => {
  expect(containsExtractorAnchor(extractorText("125 112.5 12.50"), "12.5")).toBe(false);
  expect(
    containsExtractorAnchor(extractorText("other_claim_lock claim_locker"), "claim_lock"),
  ).toBe(false);
  expect(containsExtractorAnchor(extractorText("12.5%"), "-12.5%")).toBe(false);
  expect(containsExtractorAnchor(extractorText("-12.5%"), "12.5%")).toBe(false);
  expect(containsExtractorAnchor(extractorText("100.5 100,50"), "100")).toBe(false);
  expect(containsExtractorAnchor(extractorText("100."), "100")).toBe(true);
  expect(containsExtractorAnchor(extractorText("2*3 2**3"), "23")).toBe(false);
  expect(containsExtractorAnchor(extractorText("12 .5"), "12.5")).toBe(false);
  expect(containsExtractorAnchor(extractorText("12 ,5"), "12,5")).toBe(false);
  expect(containsExtractorAnchor(extractorText("12 5"), "125")).toBe(false);
  expect(containsExtractorAnchor(extractorText("řád"), "rad")).toBe(false);
  expect(containsExtractorAnchor(extractorText("12.5%"), "12.5%")).toBe(true);
  expect(containsExtractorAnchor(extractorText(""), " ")).toBe(false);
  expect(
    extractorQuality("fixture", "100.5", [
      { ...task, evidence: [{ path: "fixture", contains: ["100"] }] },
    ]).strictRecoveredAnchors,
  ).toBe(0);
});

test("extractor quality v2 decodes cosmetic Markdown escapes and operator spacing without changing mathematical facts", () => {
  expect(
    containsExtractorAnchor(
      extractorText("Every \\~25 steps; ~/notes. claim\\_lock"),
      "Every ~25 steps",
    ),
  ).toBe(true);
  expect(containsExtractorAnchor(extractorText("Folder \\~/notes"), "Folder ~/notes")).toBe(true);
  expect(containsExtractorAnchor(extractorText("claim\\_lock"), "claim_lock")).toBe(true);
  expect(
    containsExtractorAnchor(
      extractorText("A **namespace** , followed by text."),
      "A namespace, followed by text.",
    ),
  ).toBe(true);
  expect(
    containsExtractorAnchor(
      extractorText("Ratio α / γ is stable; cost ( δ =0.002)"),
      "Ratio α/γ is stable; cost (δ=0.002)",
    ),
  ).toBe(true);
  expect(containsExtractorAnchor(extractorText("Ratio α + γ"), "Ratio α/γ")).toBe(false);
  expect(containsExtractorAnchor(extractorText("Cost (δ=-0.002)"), "Cost (δ=0.002)")).toBe(false);
  expect(containsExtractorAnchor(extractorText("2\\*3"), "23")).toBe(false);
  expect(containsExtractorAnchor(extractorText("gain 15pp"), "gain 15 pp")).toBe(false);
});

test("extractor benchmark records unavailable quality as null, retains full coverage denominator and refuses overwrites", async () => {
  const directory = await mkdtemp(join(tmpdir(), "teamagent-extractor-benchmark-"));
  const config = join(directory, "extractors.json");
  const output = join(directory, "results");
  try {
    await writeJson(config, {
      version: 1,
      defaultProfile: "missing.profile",
      profiles: [
        {
          id: "missing.profile",
          engine: "docling",
          version: "0.0.0",
          command: join(directory, "missing-extractor.exe"),
          args: ["{input}", "--output", "{outputDir}"],
        },
      ],
    });
    const options = {
      configPath: config,
      profileIds: ["missing.profile"],
      outputDirectory: output,
      repeats: 0,
      sourceIds: ["synthetic-scanned-en-cs"],
    };
    await runExtractorBenchmark(options);
    const result = await readJson(
      join(output, "results.json"),
      Schema.Struct({
        measurements: Schema.Array(Schema.Struct({ status: Schema.String, quality: Schema.Null })),
        summaries: Schema.Array(
          Schema.Struct({
            successfulDocuments: Schema.Int,
            expectedAnchors: Schema.Int,
            effectiveRecoveredAnchors: Schema.Int,
            completeCorpusQuality: Schema.Null,
            repeatStable: Schema.Null,
            successfulRepeatMedianMs: Schema.Null,
          }),
        ),
      }),
    );
    expect(result.measurements[0]?.status).toBe("unavailable");
    expect(result.measurements[0]?.quality).toBeNull();
    expect(result.summaries[0]?.expectedAnchors).toBe(28);
    expect(result.summaries[0]?.successfulDocuments).toBe(0);
    expect(result.summaries[0]?.effectiveRecoveredAnchors).toBe(0);
    expect(result.summaries[0]?.repeatStable).toBeNull();
    expect(result.summaries[0]?.successfulRepeatMedianMs).toBeNull();
    await assert.rejects(runExtractorBenchmark(options));
  } finally {
    await rm(directory, { recursive: true, force: true });
  }
});

test("extractor score retains missing anchors, source isolation, group completeness and negative exclusions", () => {
  const other = { ...task, id: "other", repo: "other" };
  const negative = { ...task, id: "negative", answerable: false, evidence: [] };
  const quality = extractorQuality("fixture", "The limit is 12.5%.", [task, other, negative]);
  expect(quality.goldAnchors).toBe(2);
  expect(quality.recoveredAnchors).toBe(1);
  expect(quality.completeCases).toBe(0);
  expect(quality.excludedNegativeCases).toBe(1);
  expect(quality.tasks[0]?.groups[0]?.anchors[1]?.recovered).toBe(false);
  const missing = extractorQuality("fixture", "", [task]);
  expect(missing.importantInformationPercent).toBe(0);
  const aggregate = summarizeExtractorQuality([quality, missing]);
  expect(aggregate.importantInformationPercent).toBe(25);
  expect(aggregate.goldAnchors).toBe(4);
  expect(summarizeExtractorQuality([]).importantInformationPercent).toBeNull();
  expect(() => extractorQuality("fixture", "", [{ ...task, evidence: [] }])).toThrow("no evidence");
});
