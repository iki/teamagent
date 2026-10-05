import type { BenchmarkCase } from "./contracts.ts";
import { normalized } from "./metrics.ts";

export const extractorScoringVersion = "teamagent-extractor-quality/2";

/** Cosmetic normalization only. Numeric values, operators, identifiers and word order survive. */
export function extractorText(text: string): string {
  return text
    .normalize("NFKC")
    .replaceAll("\u00ad", "")
    .replace(/(?<=\p{L})-\s*\r?\n\s*(?=\p{L})/gu, "")
    .replace(/[‘’]/g, "'")
    .replace(/[“”]/g, '"')
    .replace(/[‐‑–—]/g, "-")
    .replace(/(?<!\\)`+/g, "")
    .replace(/(?<![\p{L}\p{N}_])\*\*([^*\r\n]+)\*\*(?![\p{L}\p{N}_])/gu, "$1")
    .replace(/(?<!\S)\*([^*\r\n]+)\*(?!\S)/g, "$1")
    .replace(/^\s*\|(.+)\|\s*$/gm, (_, row: string) => row.replaceAll("|", " "))
    .replace(/\\([\x21-\x2f\x3a-\x40\x5b-\x60\x7b-\x7e])/g, "$1")
    .replace(/\s+/g, " ")
    .replace(/\s*([=/()])\s*/g, "$1")
    .replace(/(?<=\p{L})\s+(?=[,;:!?])/gu, "")
    .trim()
    .toLowerCase();
}

/** Boundaries prevent a short numeric/code anchor from matching inside a different value/name. */
function containsCanonicalAnchor(text: string, needle: string): boolean {
  if (needle.length === 0) return false;
  let offset = text.indexOf(needle);
  while (offset >= 0) {
    const before = offset === 0 ? "" : text.slice(offset - 1, offset);
    const after = text.slice(offset + needle.length, offset + needle.length + 1);
    const numericContinuation = text.slice(offset + needle.length, offset + needle.length + 2);
    const first = needle.slice(0, 1);
    const last = needle.slice(-1);
    if (
      !(/[\p{L}\p{N}_]/u.test(first) && /[\p{L}\p{N}_]/u.test(before)) &&
      !(/[0-9]/.test(first) && /[+.-]/.test(before)) &&
      !(/[0-9]/.test(last) && /^[.,][0-9]/.test(numericContinuation)) &&
      !(/[\p{L}\p{N}_]/u.test(last) && /[\p{L}\p{N}_]/u.test(after))
    )
      return true;
    offset = text.indexOf(needle, offset + 1);
  }
  return false;
}

export function containsExtractorAnchor(text: string, anchor: string): boolean {
  return containsCanonicalAnchor(text, extractorText(anchor));
}

export function extractorQuality(
  sourceId: string,
  markdown: string,
  cases: readonly BenchmarkCase[],
) {
  const comparable = extractorText(markdown);
  const strict = normalized(markdown);
  const tasks = cases
    .filter((task) => task.repo === sourceId && task.answerable)
    .map((task) => {
      if (task.evidence.length === 0)
        throw new Error(`Answerable case has no evidence: ${task.id}`);
      const groups = task.evidence.map((evidence, group) => {
        if (evidence.path !== sourceId || evidence.contains.length === 0)
          throw new Error(`Invalid extraction evidence group: ${task.id}/${group}`);
        const anchors = evidence.contains.map((quote, index) => ({
          index,
          strict: containsCanonicalAnchor(strict, normalized(quote)),
          recovered: containsExtractorAnchor(comparable, quote),
        }));
        return {
          index: group,
          page: evidence.page ?? null,
          anchors,
          recovered: anchors.every((anchor) => anchor.recovered),
          strict: anchors.every((anchor) => anchor.strict),
        };
      });
      return {
        id: task.id,
        category: task.category,
        groups,
        complete: groups.every((group) => group.recovered),
        strictComplete: groups.every((group) => group.strict),
      };
    });
  const groups = tasks.flatMap((task) => task.groups);
  const anchors = groups.flatMap((group) => group.anchors);
  const recovered = anchors.filter((anchor) => anchor.recovered).length;
  const recoveredGroups = groups.filter((group) => group.recovered).length;
  const completeCases = tasks.filter((task) => task.complete).length;
  return {
    sourceId,
    goldAnchors: anchors.length,
    recoveredAnchors: recovered,
    importantInformationPercent: anchors.length === 0 ? null : (100 * recovered) / anchors.length,
    strictRecoveredAnchors: anchors.filter((anchor) => anchor.strict).length,
    goldGroups: groups.length,
    recoveredGroups,
    groupRecallPercent: groups.length === 0 ? null : (100 * recoveredGroups) / groups.length,
    answerableCases: tasks.length,
    completeCases,
    completeCasesPercent: tasks.length === 0 ? null : (100 * completeCases) / tasks.length,
    excludedNegativeCases: cases.filter((task) => task.repo === sourceId && !task.answerable)
      .length,
    tasks,
  };
}

export type ExtractorQuality = ReturnType<typeof extractorQuality>;

export function summarizeExtractorQuality(qualities: readonly ExtractorQuality[]) {
  const total = (select: (quality: ExtractorQuality) => number) =>
    qualities.reduce((sum, quality) => sum + select(quality), 0);
  const goldAnchors = total((quality) => quality.goldAnchors);
  const recoveredAnchors = total((quality) => quality.recoveredAnchors);
  const goldGroups = total((quality) => quality.goldGroups);
  const recoveredGroups = total((quality) => quality.recoveredGroups);
  const answerableCases = total((quality) => quality.answerableCases);
  const completeCases = total((quality) => quality.completeCases);
  return {
    documents: qualities.length,
    goldAnchors,
    recoveredAnchors,
    importantInformationPercent: goldAnchors === 0 ? null : (100 * recoveredAnchors) / goldAnchors,
    strictRecoveredAnchors: total((quality) => quality.strictRecoveredAnchors),
    goldGroups,
    recoveredGroups,
    groupRecallPercent: goldGroups === 0 ? null : (100 * recoveredGroups) / goldGroups,
    answerableCases,
    completeCases,
    completeCasesPercent: answerableCases === 0 ? null : (100 * completeCases) / answerableCases,
  };
}
