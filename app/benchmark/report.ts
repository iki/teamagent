import { readFile, readdir } from "node:fs/promises";
import { join, resolve } from "node:path";
import { Schema } from "effect";
import { CorpusSchema, PassageSchema, ResultSchema, type Corpus } from "./contracts.ts";
import { cache, readJson, sha256, writeJson } from "./io.ts";
import { average, evaluate, quantile, wilson } from "./metrics.ts";

const identitySchema = Schema.Struct({
  provenance: Schema.optional(Schema.Struct({ corpusHash: Schema.String })),
  inputSha256: Schema.optional(Schema.String),
});
const inputSchema = Schema.Struct({
  passages: Schema.Array(PassageSchema),
  queries: Schema.Array(Schema.Struct({ id: Schema.String, query: Schema.String })),
});

export async function verifyCorpus(
  resultPath: string,
  corpus: Corpus,
  inputDirectory = cache,
): Promise<void> {
  const identity = await readJson(resultPath, identitySchema);
  if (identity.provenance !== undefined) {
    if (identity.provenance.corpusHash !== sha256(JSON.stringify(corpus)))
      throw new Error("Result belongs to a different corpus");
    return;
  }
  if (identity.inputSha256 === undefined) throw new Error("Result has no corpus identity");
  for (const file of await readdir(inputDirectory)) {
    if (!file.startsWith("competitor-input") || !file.endsWith(".json")) continue;
    const inputPath = join(inputDirectory, file);
    const input = await readJson(inputPath, inputSchema);
    const raw = await readFile(inputPath);
    if (sha256(raw) !== identity.inputSha256) continue;
    if (
      JSON.stringify(input.passages) !== JSON.stringify(corpus.passages) ||
      JSON.stringify(input.queries) !==
        JSON.stringify(corpus.cases.map(({ id, query }) => ({ id, query })))
    )
      throw new Error("Competitor input does not match the scoring corpus");
    return;
  }
  throw new Error("Cannot verify the competitor's input hash against a retained input file");
}

export async function report(
  resultPaths: readonly string[],
  split: "dev" | "holdout" | "all",
  output: string,
  corpusPath?: string,
): Promise<void> {
  if (resultPaths.length === 0) throw new Error("Provide at least one benchmark result file");
  const corpus = await readJson(corpusPath ?? join(cache, "corpus.json"), CorpusSchema);
  const cases = corpus.cases.filter((task) => split === "all" || task.split === split);
  const systems = [];
  for (const path of resultPaths) {
    await verifyCorpus(resolve(path), corpus);
    const result = await readJson(resolve(path), ResultSchema);
    for (const system of result.systems) {
      const scores = evaluate(cases, corpus.passages, system);
      const slices = [
        "all",
        "code",
        "documents",
        ...new Set(cases.map((task) => task.repo)),
        ...new Set(cases.map((task) => `category:${task.category}`)),
      ];
      const summaries = slices.map((slice) => {
        const selected = scores.filter(
          (score) =>
            slice === "all" ||
            (slice === "code" &&
              ["hermes", "hermes-agent", "pi", "wayland", "deepseek-harness"].includes(
                score.source,
              )) ||
            (slice === "documents" &&
              !["hermes", "hermes-agent", "pi", "wayland", "deepseek-harness"].includes(
                score.source,
              )) ||
            score.source === slice ||
            slice === `category:${score.category}`,
        );
        const answerable = selected.filter((score) => score.answerable);
        const negatives = selected.filter((score) => !score.answerable);
        const warm = selected.flatMap((score) => score.warmMs);
        return {
          slice,
          cases: selected.length,
          answerable: answerable.length,
          hit1: average(answerable.map((score) => score.top1.hit)),
          hit5: average(answerable.map((score) => score.top5.hit)),
          hit10: average(answerable.map((score) => score.top10.hit)),
          hit5Wilson95: wilson(
            answerable.reduce((sum, score) => sum + score.top5.hit, 0),
            answerable.length,
          ),
          evidenceRecall5: average(answerable.map((score) => score.top5.recall)),
          completeEvidence5: average(answerable.map((score) => score.top5.complete)),
          collectiveAnchorRecall5: average(
            answerable.map((score) => score.collective5.anchorRecall),
          ),
          collectiveComplete5: average(answerable.map((score) => score.collective5.complete)),
          collectiveAnchorRecall10: average(
            answerable.map((score) => score.collective10.anchorRecall),
          ),
          collectiveComplete10: average(answerable.map((score) => score.collective10.complete)),
          mrr10: average(answerable.map((score) => score.top10.mrr)),
          discountedCoverage10: average(answerable.map((score) => score.top10.discountedCoverage)),
          extractableGroups: answerable.reduce((sum, score) => sum + score.extractableGroups, 0),
          goldGroups: answerable.reduce((sum, score) => sum + score.goldGroups, 0),
          negatives: negatives.length,
          negativeEmptyResults: negatives.filter((score) => score.empty).length,
          errors: selected.filter((score) => score.error !== null).length,
          failedRuns: selected.reduce((sum, score) => sum + score.failedRuns, 0),
          unstable: selected.filter((score) => !score.repeatStable).length,
          initialMedianMs: quantile(
            selected.map((score) => score.initialMs),
            0.5,
          ),
          warmMedianMs: quantile(warm, 0.5),
          warmP95Ms: quantile(warm, 0.95),
          meanContextCharacters5: average(selected.map((score) => score.contextCharacters5)),
          meanContextCharacters10: average(selected.map((score) => score.contextCharacters10)),
        };
      });
      systems.push({
        system: system.system,
        mode: system.mode,
        ingestMs: system.ingestMs,
        input: path,
        resultFileHash: sha256(await readFile(resolve(path))),
        summaries,
        scores,
      });
    }
  }
  const paired = [];
  for (let left = 0; left < systems.length; left += 1) {
    const a = systems[left];
    if (a === undefined) continue;
    for (let right = left + 1; right < systems.length; right += 1) {
      const b = systems[right];
      if (b === undefined) continue;
      const scores = new Map(b.scores.map((score) => [score.id, score]));
      const pairs = a.scores
        .filter((score) => score.answerable)
        .map((score) => ({ a: score, b: scores.get(score.id) }));
      paired.push({
        left: a.system,
        right: b.system,
        hit5Wins: pairs.filter(
          ({ a: item, b: other }) => other !== undefined && item.top5.hit > other.top5.hit,
        ).length,
        hit5Losses: pairs.filter(
          ({ a: item, b: other }) => other !== undefined && item.top5.hit < other.top5.hit,
        ).length,
        complete5Wins: pairs.filter(
          ({ a: item, b: other }) =>
            other !== undefined && item.collective5.complete > other.collective5.complete,
        ).length,
        complete5Losses: pairs.filter(
          ({ a: item, b: other }) =>
            other !== undefined && item.collective5.complete < other.collective5.complete,
        ).length,
        pairedCases: pairs.length,
      });
    }
  }
  await writeJson(output, {
    split,
    corpusHash: sha256(JSON.stringify(corpus)),
    systems,
    paired,
    interpretation:
      "Evidence retrieval only. Negative empty-result rate is not model answer abstention. PDF extraction failures remain in the denominator. Repetitions measure latency/stability, not independent task samples. Warm means repeated queries; OS page cache is not evicted.",
  });
  for (const system of systems) {
    const all = system.summaries[0];
    process.stdout.write(JSON.stringify({ system: system.system, split, ...all }) + "\n");
  }
}
