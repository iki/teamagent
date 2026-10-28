# Codeburn

Source: [getagentseal/codeburn](https://github.com/getagentseal/codeburn) · Reviewed revision: `aded4c232622b82284f22d172cecb137354e3071` · Review date: 2026-10-04.

Depth: **source-reviewed** (static source/content inspection; repository-wide audit not claimed). Related directions: [evolution](../evolution.md) · [models](../models.md) · [skills](../skills.md) · [agents](../agents.md) · [decisions](../decisions.md).

## Evidence inspected

- [`src/providers/codex.ts` lines 1–110](https://github.com/getagentseal/codeburn/blob/aded4c232622b82284f22d172cecb137354e3071/src/providers/codex.ts#L1-L110)

## Observed architecture and behavior

The inspected provider adapter normalizes tool names, recognizes several log forms, and integrates cached parsing and fork-replay handling. It also infers MCP calls from a specific shell-wrapper pattern and infers skill loads from shell commands that read a path ending in SKILL.md. Source comments acknowledge substring false positives. Searches mentioning a skill file are deliberately excluded from the read heuristic. This is useful cross-agent observability, with inferred dimensions that require uncertainty labels.

## Implications and tradeoffs for Teamagent

Teamagent needs first-class skill_selected, skill_loaded, and skill_executed events so adaptation does not depend on fragile shell-text inference. Existing agents may not emit these events, making Codeburn-style parsing a reasonable compatibility layer. Mark such records as inferred and retain the parser version; do not use them alone to reward or retire a skill. A command that quotes a read can false-positive, while another language's file-reading API may be missed. Cost attribution also needs to distinguish the coordinator, workers, evaluators, retries, and media jobs so a supposedly cheap route cannot hide downstream expenditure.

## Adoption decision

Evaluate as an optional usage dashboard/importer and a provider-parser reference, especially for mixed installed agents. Keep raw transcript access local by default and export only the necessary normalized fields. Calibrate inferred skill use against explicit events in controlled traces. Use its telemetry to identify candidates for optimization, then verify benefit through matched task evaluation. Do not equate activity counts with productivity or transform imperfect historical log parsing into a hard billing authority.

## Verification boundary

No project code, models, installers, or benchmarks were executed during this review. Tests and documentation show intended contracts; they do not establish measured performance, production readiness, or a complete security assessment. Recommendations above are design inferences from the cited snapshot. Verify current APIs, licensing, and deployment requirements before integration.

## Source update reviewed 2026-10-28

Reviewed commit: [`07c0ee601fd8e104afb814154d879a80aeed432b`](https://github.com/getagentseal/codeburn/commit/07c0ee601fd8e104afb814154d879a80aeed432b). Scope: Full session-output accounting helper, optional Codex title index and editor runtime selection/tests read. Provider parsers, cache persistence and billableOutputTokens implementation were not audited.

The [output aggregator](https://github.com/getagentseal/codeburn/blob/07c0ee601fd8e104afb814154d879a80aeed432b/src/session-output.ts) derives total and per-model output in one pass and preserves existing bucket identity; a call with no model still contributes to the total. Once any call usage exists, however, aggregate fallback is skipped for the whole session, so partially missing call usage is not a complete measurement. Provider identity can also be inferred from names. Preserve coverage and inference separately from displayed zero or billed cost.

The [optional title index](https://github.com/getagentseal/codeburn/blob/07c0ee601fd8e104afb814154d879a80aeed432b/src/codex-session-index.ts) bounds reads, compares timestamps, sanitizes titles and overlays them on copied public results without rekeying usage caches. Malformed/unreadable records are silently ignored because the feature is optional; this is acceptable presentation fallback only if not reused for authoritative accounting. [Runtime selection](https://github.com/getagentseal/codeburn/blob/07c0ee601fd8e104afb814154d879a80aeed432b/vscode/src/runtime.ts) and [tests](https://github.com/getagentseal/codeburn/blob/07c0ee601fd8e104afb814154d879a80aeed432b/vscode/test/runtime.test.ts) expose a degraded mode when required SQLite support is unavailable. Adapt explicit capability degradation and separate title identity from accounting; the Node probing/launcher choices do not replace Teamagent's pinned Bun toolchain. No session files, runtime probe, provider or tests were executed.

<!-- teamagent-analysis:start -->
Analysis metadata: source [codeburn](https://github.com/getagentseal/codeburn); analyzed commit `07c0ee601fd8e104afb814154d879a80aeed432b`; commit date 2026-10-27T17:52:18+01:00; review date 2026-10-28T09:45:33.667Z; depth source-reviewed. [Maintenance record](../analyses/repos/ai-agents-tokens--codeburn.md).
<!-- teamagent-analysis:end -->
