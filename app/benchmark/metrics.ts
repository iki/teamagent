import type { BenchmarkCase, Passage, SystemResult } from "./contracts.ts";

/** Normalizes PDF line wrapping, not semantics; no task-specific expansion. */
export function normalized(text: string): string {
  return text
    .normalize("NFKC")
    .replace(/-\s*\n\s*/g, "")
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase();
}

export function evidenceGroups(
  task: BenchmarkCase,
  passages: readonly Passage[],
): readonly ReadonlySet<string>[] {
  return task.evidence.map(
    (evidence) =>
      new Set(
        passages
          .filter((passage) => {
            if (passage.sourceId !== task.repo || passage.path !== evidence.path) return false;
            if (
              evidence.lineStart !== undefined &&
              evidence.lineEnd !== undefined &&
              (passage.lineEnd < evidence.lineStart || passage.lineStart > evidence.lineEnd)
            )
              return false;
            return evidence.contains.every((quote) =>
              normalized(passage.text).includes(normalized(quote)),
            );
          })
          .map((passage) => passage.id),
      ),
  );
}

/** Secondary chunk-size sensitivity score: all gold anchors may be supported by several returned passages. */
export function collectiveEvidence(
  task: BenchmarkCase,
  passages: readonly Passage[],
  ids: readonly string[],
  k: number,
) {
  const selected = new Set([...new Set(ids)].slice(0, k));
  const returned = passages.filter(
    (passage) => selected.has(passage.id) && passage.sourceId === task.repo,
  );
  let anchors = 0;
  let supported = 0;
  let groups = 0;
  for (const evidence of task.evidence) {
    const eligible = returned.filter(
      (passage) =>
        passage.path === evidence.path &&
        (evidence.lineStart === undefined ||
          evidence.lineEnd === undefined ||
          (passage.lineStart <= evidence.lineEnd && passage.lineEnd >= evidence.lineStart)),
    );
    const count = evidence.contains.filter((quote) =>
      eligible.some((passage) => normalized(passage.text).includes(normalized(quote))),
    ).length;
    anchors += evidence.contains.length;
    supported += count;
    if (count === evidence.contains.length && count > 0) groups += 1;
  }
  return {
    anchorRecall: anchors === 0 ? 0 : supported / anchors,
    groupRecall: task.evidence.length === 0 ? 0 : groups / task.evidence.length,
    complete: task.evidence.length > 0 && groups === task.evidence.length ? 1 : 0,
  };
}

export function scoreRanking(
  groups: readonly ReadonlySet<string>[],
  ids: readonly string[],
  k: number,
) {
  const unique = [...new Set(ids)].slice(0, k);
  const seen = new Set<number>();
  let dcg = 0;
  let first = 0;
  for (let rank = 0; rank < unique.length; rank += 1) {
    const id = unique[rank];
    let gained = 0;
    groups.forEach((group, index) => {
      if (id !== undefined && group.has(id) && !seen.has(index)) {
        seen.add(index);
        gained += 1;
      }
    });
    if (gained > 0) {
      if (first === 0) first = 1 / (rank + 1);
      dcg += gained / Math.log2(rank + 2);
    }
  }
  // Evidence coverage discounts duplicate overlapping passages. One hit may support several groups.
  return {
    hit: seen.size > 0 ? 1 : 0,
    mrr: first,
    recall: groups.length === 0 ? 0 : seen.size / groups.length,
    complete: groups.length > 0 && seen.size === groups.length ? 1 : 0,
    discountedCoverage: groups.length === 0 ? 0 : dcg / groups.length,
  };
}

export function quantile(values: readonly number[], p: number): number {
  const sorted = [...values].sort((a, b) => a - b);
  return sorted.length === 0
    ? 0
    : (sorted[Math.min(sorted.length - 1, Math.floor(p * sorted.length))] ?? 0);
}
export function average(values: readonly number[]): number {
  return values.length === 0 ? 0 : values.reduce((sum, value) => sum + value, 0) / values.length;
}
export function wilson(successes: number, count: number): readonly [number, number] {
  if (count === 0) return [0, 0];
  const z = 1.959963984540054;
  const p = successes / count;
  const denominator = 1 + (z * z) / count;
  const center = (p + (z * z) / (2 * count)) / denominator;
  const spread =
    (z * Math.sqrt((p * (1 - p)) / count + (z * z) / (4 * count * count))) / denominator;
  return [Math.max(0, center - spread), Math.min(1, center + spread)];
}

export function evaluate(
  cases: readonly BenchmarkCase[],
  passages: readonly Passage[],
  result: SystemResult,
) {
  const byId = new Map(passages.map((passage) => [passage.id, passage]));
  const queries = new Map(result.queries.map((query) => [query.id, query]));
  return cases.map((task) => {
    const groups = evidenceGroups(task, passages);
    const query = queries.get(task.id);
    if (query === undefined || query.runs.length < 1)
      throw new Error(`Missing query result: ${task.id}`);
    for (const run of query.runs)
      for (const hit of run.hits)
        if (!byId.has(hit.id)) throw new Error(`Unknown returned passage: ${hit.id}`);
    const first = query.runs[0];
    const ids = [...new Set(first?.hits.map((hit) => hit.id) ?? [])];
    return {
      id: task.id,
      split: task.split,
      source: task.repo,
      category: task.category,
      answerable: task.answerable,
      goldGroups: groups.length,
      extractableGroups: groups.filter((group) => group.size > 0).length,
      top1: scoreRanking(groups, ids, 1),
      top5: scoreRanking(groups, ids, 5),
      top10: scoreRanking(groups, ids, 10),
      collective5: collectiveEvidence(task, passages, ids, 5),
      collective10: collectiveEvidence(task, passages, ids, 10),
      empty: ids.length === 0,
      error: query.runs.find((run) => run.error !== undefined)?.error ?? null,
      failedRuns: query.runs.filter((run) => run.error !== undefined).length,
      initialMs: first?.elapsedMs ?? 0,
      warmMs: query.runs
        .slice(1)
        .filter((run) => run.error === undefined)
        .map((run) => run.elapsedMs),
      repeatStable: query.runs.every(
        (run) =>
          JSON.stringify([...new Set(run.hits.map((hit) => hit.id))]) === JSON.stringify(ids),
      ),
      contextCharacters5: ids
        .slice(0, 5)
        .reduce((sum, id) => sum + (byId.get(id)?.text.length ?? 0), 0),
      contextCharacters10: ids
        .slice(0, 10)
        .reduce((sum, id) => sum + (byId.get(id)?.text.length ?? 0), 0),
      retrieved: ids,
    };
  });
}
