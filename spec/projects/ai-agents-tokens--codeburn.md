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

<!-- teamagent-analysis:start -->
Analysis metadata: source [codeburn](https://github.com/getagentseal/codeburn); analyzed commit `aded4c232622b82284f22d172cecb137354e3071`; commit date 2026-10-02T16:43:15+02:00; review date 2026-10-04; depth source-reviewed. [Maintenance record](../analyses/repos/ai-agents-tokens--codeburn.md).
<!-- teamagent-analysis:end -->
