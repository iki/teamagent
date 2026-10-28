# Trail of Bits skills

Source: [trailofbits/skills](https://github.com/trailofbits/skills) · Reviewed revision: `82fe8226252622fa807643bdca1710901198553a` · Review date: 2026-10-04.

Depth: **source-reviewed** (static source/content inspection; repository-wide audit not claimed). Related directions: [skills](../skills.md) · [agents](../agents.md) · [memory](../memory.md) · [evolution](../evolution.md).

## Evidence inspected

- [`plugins/audit-context-building/skills/audit-context-building/SKILL.md` lines 1–72](https://github.com/trailofbits/skills/blob/82fe8226252622fa807643bdca1710901198553a/plugins/audit-context-building/skills/audit-context-building/SKILL.md#L1-L72)

## Observed architecture and behavior

The audited example separates building code understanding from making vulnerability claims. It routes codebase or multi-function analysis to subagents, writes a dossier and per-function records, and returns compact structured results. Records retain assumptions, guarantees, dependencies, unresolved questions, and line evidence. The instructions explicitly preserve disagreements instead of silently merging them and require following called functions. This provides a good template for evidence-grounded code memory and bounded analyst context.

## Implications and tradeoffs for Teamagent

Teamagent should borrow the artifact-first delegation pattern: workers write durable evidence, while the coordinator receives only a typed summary and pointers. That enables later queries and coding work to revisit exact assumptions without replaying an entire analysis conversation. However, a declared return schema or an instruction to cite lines is not itself proof of correct analysis. Validate file/revision references and sample conclusions against the source. The workflow's native tools and invocation names are harness-specific, so merely copying SKILL.md will not establish portability. Full function-by-function analysis can also cost more than a narrow task warrants.

## Adoption decision

Curate this as an opt-in security and architecture-analysis bundle, retaining narrow triggers and a limited read-only tool policy. Translate orchestration through Teamagent's capability layer rather than prompting a model to imitate unavailable tools. Add evaluation cases for missing callees, contradictory assumptions, stale line references, and premature vulnerability claims. Store the resulting dossier as evidence-derived memory with commit freshness, not permanent universal knowledge.

## Verification boundary

No project code, models, installers, or benchmarks were executed during this review. Tests and documentation show intended contracts; they do not establish measured performance, production readiness, or a complete security assessment. Recommendations above are design inferences from the cited snapshot. Verify current APIs, licensing, and deployment requirements before integration.
