import { mkdtemp } from "./temporary.ts";
import { expect, test } from "bun:test";
import { rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import type { Corpus } from "../app/benchmark/contracts.ts";
import { sha256, writeJson } from "../app/benchmark/io.ts";
import { verifyCorpus } from "../app/benchmark/report.ts";
import { passagesFor } from "../app/benchmark/prepare.ts";
import {
  collectiveEvidence,
  evaluate,
  evidenceGroups,
  scoreRanking,
  wilson,
} from "../app/benchmark/metrics.ts";

test("benchmark ranking counts independent evidence groups without rewarding overlapping duplicate hits", () => {
  const groups = [new Set(["a", "b"]), new Set(["c"])];
  expect(scoreRanking(groups, ["a", "a", "b"], 5).recall).toBe(0.5);
  expect(scoreRanking(groups, ["x", "a", "c"], 5)).toMatchObject({
    hit: 1,
    mrr: 0.5,
    recall: 1,
    complete: 1,
  });
  expect(scoreRanking(groups, ["x"], 5).hit).toBe(0);
  expect(wilson(5, 10)[0]).toBeLessThan(0.5);
  expect(wilson(5, 10)[1]).toBeGreaterThan(0.5);
});

test("benchmark passages preserve source lines and gold evidence requires the right source and quote", () => {
  const text = Array.from(
    { length: 65 },
    (_, index) => `line ${index + 1}: CODEWORD_${index + 1}`,
  ).join("\n");
  const passages = passagesFor("project", "source.ts", text);
  const groups = evidenceGroups(
    {
      id: "case",
      split: "dev",
      repo: "project",
      category: "symbol",
      query: "CODEWORD_28",
      evidence: [{ path: "source.ts", lineStart: 28, lineEnd: 28, contains: ["CODEWORD_28"] }],
      answerFacts: [],
      rationale: "fixture",
      answerable: true,
    },
    passages,
  );
  expect(passages.every((passage) => passage.text.length <= 1800)).toBe(true);
  expect(groups[0]?.size).toBe(2);
  expect(passages.at(-1)?.lineEnd).toBe(65);
});

test("collective evidence credits separate passages only when all anchors share the correct source and span", () => {
  const task = {
    id: "split",
    split: "dev",
    repo: "project",
    category: "synthesis",
    query: "limits",
    evidence: [
      { path: "source.ts", lineStart: 1, lineEnd: 20, contains: ["first claim", "second claim"] },
    ],
    answerFacts: [],
    rationale: "split support",
    answerable: true,
  } as const;
  const passages = [
    {
      id: "a",
      sourceId: "project",
      path: "source.ts",
      lineStart: 1,
      lineEnd: 5,
      text: "first claim",
    },
    {
      id: "b",
      sourceId: "project",
      path: "source.ts",
      lineStart: 15,
      lineEnd: 20,
      text: "second claim",
    },
    {
      id: "c",
      sourceId: "unrelated",
      path: "source.ts",
      lineStart: 1,
      lineEnd: 5,
      text: "second claim",
    },
  ];
  expect(collectiveEvidence(task, passages, ["a", "b"], 5).complete).toBe(1);
  expect(collectiveEvidence(task, passages, ["a", "c"], 5).complete).toBe(0);
  expect(collectiveEvidence(task, passages, ["a"], 5).anchorRecall).toBe(0.5);
  expect(collectiveEvidence(task, passages, ["a", "a", "b"], 2).complete).toBe(1);
  const scored = evaluate([task], passages, {
    system: "fixture",
    mode: "fixture",
    ingestMs: 0,
    queries: [
      {
        id: "split",
        runs: [
          { elapsedMs: 5, hits: [{ id: "a", score: 1 }] },
          { elapsedMs: 0.1, hits: [], error: "timeout" },
          { elapsedMs: 7, hits: [{ id: "a", score: 1 }] },
        ],
      },
    ],
  });
  expect(scored[0]?.failedRuns).toBe(1);
  expect(scored[0]?.error).toBe("timeout");
  expect(scored[0]?.warmMs).toEqual([7]);
});

test("benchmark scoring rejects a result from another corpus even when passage IDs happen to match", async () => {
  const temporary = await mkdtemp(join(tmpdir(), "teamagent-benchmark-identity-"));
  const corpus: Corpus = {
    format: "teamagent-memory-benchmark-v1",
    createdAt: "fixture",
    passages: [],
    cases: [],
  };
  try {
    const matching = join(temporary, "matching.json");
    await writeJson(matching, { provenance: { corpusHash: sha256(JSON.stringify(corpus)) } });
    expect(await verifyCorpus(matching, corpus, temporary)).toBeUndefined();
    const wrongCorpus = await verifyCorpus(
      matching,
      { ...corpus, createdAt: "different" },
      temporary,
    ).catch((error: unknown) => error);
    expect(wrongCorpus instanceof Error ? wrongCorpus.message : wrongCorpus).toContain(
      "different corpus",
    );
    const input = { passages: [], queries: [] };
    const inputPath = join(temporary, "competitor-input-fixture.json");
    await writeJson(inputPath, input);
    const reference = join(temporary, "reference.json");
    await writeJson(reference, { inputSha256: sha256(JSON.stringify(input, null, 2) + "\n") });
    expect(await verifyCorpus(reference, corpus, temporary)).toBeUndefined();
    const wrongPassages = await verifyCorpus(
      reference,
      {
        ...corpus,
        passages: [
          {
            id: "same",
            sourceId: "fixture",
            path: "a",
            lineStart: 1,
            lineEnd: 1,
            text: "new parser output",
          },
        ],
      },
      temporary,
    ).catch((error: unknown) => error);
    expect(wrongPassages instanceof Error ? wrongPassages.message : wrongPassages).toContain(
      "does not match",
    );
  } finally {
    await rm(temporary, { recursive: true, force: true });
  }
});
