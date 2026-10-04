/** Grammar words are removed only when meaningful terms remain. No corpus-specific vocabulary. */
const questionWords = new Set(
  (
    "a an the this that these those is are was were be been being do does did have has had " +
    "i you we they it its he she them their our your which what where when why how " +
    "can could would should will may might must and or but if then than as of in on at to for " +
    "from with by about into through during before after between under over there here " +
    "find show explain describe please according also both each any all not no " +
    "a i v ve z ze na do od pro po s se u o k ke je jsou byl byla bylo byly " +
    "co jak kdy kde proč který která které jaký jaká jaké nebo ale že aby při"
  ).split(/\s+/),
);

export function identifierWords(text: string): string {
  return text
    .replace(/([\p{Ll}\p{N}])([\p{Lu}])/gu, "$1 $2")
    .replace(/([\p{Lu}])([\p{Lu}][\p{Ll}])/gu, "$1 $2")
    .replace(/[_./\\-]+/g, " ");
}

export function retrievalTerms(query: string): readonly string[] {
  const original = query.match(/[\p{L}\p{N}_]+/gu) ?? [];
  const expanded = identifierWords(query).match(/[\p{L}\p{N}]+/gu) ?? [];
  const unique = [...new Set([...original, ...expanded].map((word) => word.toLowerCase()))];
  const useful = unique.filter((word) => !questionWords.has(word) && word.length > 1);
  return useful.length > 0 ? useful : unique;
}

export interface LexicalCandidate {
  readonly text: string;
  readonly path: string;
  readonly rank: number;
}

/** Bounded candidate reranking favors informative term coverage without suppressing a lexical-only hit. */
export function rankLexicalCandidates<A extends LexicalCandidate>(
  terms: readonly string[],
  candidates: readonly A[],
): readonly A[] {
  const normalize = (text: string): string =>
    identifierWords(text).normalize("NFKD").replace(/\p{M}/gu, "").toLowerCase();
  const needles = terms.map(normalize);
  const documents = candidates.map((candidate) =>
    normalize(`${candidate.path}\n${candidate.text}`),
  );
  const weights = needles.map((term) =>
    Math.log(1 + candidates.length / (1 + documents.filter((text) => text.includes(term)).length)),
  );
  const total = weights.reduce((sum, weight) => sum + weight, 0) || 1;
  const best = Math.max(...candidates.map((candidate) => -candidate.rank), Number.EPSILON);
  return candidates
    .map((candidate, index) => {
      const content = documents[index] ?? "";
      const coverage =
        needles.reduce(
          (sum, term, termIndex) => sum + (content.includes(term) ? (weights[termIndex] ?? 0) : 0),
          0,
        ) / total;
      const score = (-candidate.rank / best) * (0.7 + 0.3 * coverage);
      return { candidate, index, score };
    })
    .sort((a, b) => b.score - a.score || a.index - b.index)
    .map(({ candidate }) => candidate);
}
