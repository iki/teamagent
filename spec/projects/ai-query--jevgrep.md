# jevgrep

Model-guided source traversal with bounded work, content-hash freshness and precise evidence spans.

Source: [jevgrep](https://github.com/dzhng/jevgrep) · Snapshot: `703aba1a36a3b854be405244ea748f607cd630c0` · Category: `ai-query`.

Evidence level: **Source-reviewed; code was read, not executed or benchmarked.** Review date: 2026-10-04. Conclusions below apply to the inspected snapshot, not an unverified latest release. License and dependency compatibility require the separate catalog/license review before adoption.

## Verified source evidence

- [packages/core/src/retrieve.ts:25-133](https://github.com/dzhng/jevgrep/blob/703aba1a36a3b854be405244ea748f607cd630c0/packages/core/src/retrieve.ts#L25-L133)
- [packages/core/src/selection.ts:14-145](https://github.com/dzhng/jevgrep/blob/703aba1a36a3b854be405244ea748f607cd630c0/packages/core/src/selection.ts#L14-L145)

The retrieval implementation creates a filesystem reader with eligibility policy, protected paths and cancellation. It bounds stage workers and navigation bytes, uses numerical admission thresholds, and suppresses a flood of weak positive classifications under a specific heuristic. Before evaluation attempts it revalidates the content hashes of source donors. Selection rejects previous evidence when the path or content hash changed. It maps source byte spans to lines, parses source units, and falls back to bounded line fragments for text or oversized units.

## Harness implications

The strongest lesson is traceable selective reading rather than a particular threshold. A decision model can classify directory previews, file candidates and source units; exact read evidence must still be returned with coordinates and version identity. Use model-guided traversal for conceptual queries that lexical search cannot narrow sufficiently. Reuse prior selection only when source hashes match, and keep model-selected evidence distinct from surrounding context added to make it readable.

## Limitations and tradeoffs

The constants for relevance, weak positives and source confidence are local heuristics, not calibrated probabilities transferable to every model or repository. Model-guided search introduces provider latency, cost and possible false negatives. A bounded search may stop before the relevant file; report inspected coverage and stopping reason instead of claiming exhaustive absence. Syntax parsers and fallbacks differ across languages. This review did not run the repository's retrieval evals.

## Adoption and validation

Prototype as an optional high-recall code-retrieval stage behind exact search, lexical ranking and symbol navigation. The harness contract should expose selected spans, content hashes, issues, remaining leads and provider failure. Evaluate known-file discovery, cross-file behavior questions, giant/minified files, changes during search and adversarial source comments. Measure downstream patch success plus dollars, latency and missed relevant files.

Related directions: [decisions](../decisions.md) · [memory](../memory.md) · [agents](../agents.md) · [models](../models.md).

<!-- teamagent-analysis:start -->
Analysis metadata: source [jevgrep](https://github.com/dzhng/jevgrep); analyzed commit `703aba1a36a3b854be405244ea748f607cd630c0`; commit date 2026-10-02T12:02:25-07:00; review date 2026-10-04; depth source-reviewed. [Maintenance record](../analyses/repos/ai-query--jevgrep.md).
<!-- teamagent-analysis:end -->
