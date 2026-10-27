# OpenSpec

Source: [Fission-AI/OpenSpec](https://github.com/Fission-AI/OpenSpec) · Reviewed revision: `2500d6da971336167548b53731a35b2127df35ac` · Review date: 2026-10-04.

Depth: **source-reviewed** (static source/content inspection; repository-wide audit not claimed). Related directions: [skills](../skills.md) · [evolution](../evolution.md) · [agents](../agents.md) · [memory](../memory.md).

## Evidence inspected

- [`src/core/artifact-graph/graph.ts` lines 1–145](https://github.com/Fission-AI/OpenSpec/blob/2500d6da971336167548b53731a35b2127df35ac/src/core/artifact-graph/graph.ts#L1-L145)

## Observed architecture and behavior

OpenSpec represents workflow artifacts as a dependency graph constructed from a validated schema. The inspected graph implementation computes build order with Kahn's algorithm and uses declaration order to resolve ties deterministically. It exposes artifact lookup, schema name/version, and readiness based on completed dependencies. Comments illustrate a proposal-to-specs/design-to-tasks workflow while keeping the graph generic enough for custom schemas. This is a concrete scheduling primitive for artifact production.

## Implications and tradeoffs for Teamagent

Teamagent can reuse the distinction between artifact existence, dependency readiness, and task execution state. For example, an imported source can unlock extraction, extraction can unlock indexing, and a completed evaluation can unlock a candidate skill's promotion review. However, file completion is not semantic validity: a specification may exist while contradicting the implementation. Add content hashes, verification statuses, and invalidation edges so changes to upstream evidence mark downstream artifacts stale. Graph validation should reject unknown dependencies and cycles before execution. Parallel-ready nodes need explicit resource and write-conflict constraints rather than unrestricted simultaneous edits.

## Adoption decision

Adopt the schema-driven artifact graph pattern and provide an OpenSpec integration for teams already using it. Keep durable execution, cancellation, retries, and permissions in the harness engine. Treat the graph's deterministic order as a reproducibility aid, not a quality guarantee. Evaluate partial completion, changed prerequisites, interrupted transitions, and concurrent workers. Use its spec/change artifacts as queryable project memory, retaining both the current accepted state and historical decisions that explain why it changed.

## Verification boundary

No project code, models, installers, or benchmarks were executed during this review. Tests and documentation show intended contracts; they do not establish measured performance, production readiness, or a complete security assessment. Recommendations above are design inferences from the cited snapshot. Verify current APIs, licensing, and deployment requirements before integration.

## Review update — 2026-10-24

Updated focused revision: `6d04a1b58dedc95729d34e4f223d9d483aae210a` from [Fission-AI/OpenSpec](https://github.com/Fission-AI/OpenSpec). The October 4 graph review remains above and in the immutable maintenance snapshot. This update inspects schema admission and apply-gate references; the original deterministic graph pattern remains relevant.

Schema parsing now performs semantic validation after structural decoding: duplicate IDs, unknown artifact dependency references, unknown `apply.requires` references and dependency cycles are checked before returning an accepted schema ([parse sequence](https://github.com/Fission-AI/OpenSpec/blob/6d04a1b58dedc95729d34e4f223d9d483aae210a/src/core/artifact-graph/schema.ts#L23-L47)). The apply-reference check rejects an undeclared prerequisite instead of allowing a misspelled artifact to disappear from the execution gate ([implementation](https://github.com/Fission-AI/OpenSpec/blob/6d04a1b58dedc95729d34e4f223d9d483aae210a/src/core/artifact-graph/schema.ts#L95-L107)). This is a concrete distinction between a valid-looking workflow document and a workflow whose authorization prerequisites actually resolve.

Progress tracking has a deliberately different contract. `apply.tracks` is a relative path and may refer to an externally maintained file or a file produced through a glob. It is not necessarily an artifact ID. A mismatch with an artifact's exact `generates` string produces a warning rather than making every command fail; the warning explains that apply still reads the requested file while list/status may fall back to `tasks.md` ([diagnostic](https://github.com/Fission-AI/OpenSpec/blob/6d04a1b58dedc95729d34e4f223d9d483aae210a/src/core/artifact-graph/schema.ts#L110-L133)). The structural schema rejects absolute paths, parent traversal and NULs, and caps the graph at 1,000 artifacts to bound recursive cycle validation ([schema](https://github.com/Fission-AI/OpenSpec/blob/6d04a1b58dedc95729d34e4f223d9d483aae210a/src/core/artifact-graph/types.ts#L4-L66)). Inspected regression coverage exercises invalid apply requirements and warns on progress paths without confusing them with hard prerequisites ([tests](https://github.com/Fission-AI/OpenSpec/blob/6d04a1b58dedc95729d34e4f223d9d483aae210a/test/commands/schema-apply-references.test.ts#L73-L104)); it was not run in this review.

**Updated Teamagent decision:** reject unresolved gate and permission references before task admission. Keep progress-display paths separate from prerequisite identity, and expose uncertain progress explicitly. Bound artifact counts and path traversal before graph scheduling. These checks complement content hashes and invalidation edges; they still cannot establish that a present artifact is semantically correct or that a completed agent task passed independent acceptance tests. Carry these cases into [evolution](../evolution.md), [skills](../skills.md) and [evaluation](../evaluation.md). Adoption remains a workflow adapter and graph-pattern reference, with durable execution and authorization in Teamagent's task engine.

<!-- teamagent-analysis:start -->
Analysis metadata: source [openspec](https://github.com/Fission-AI/OpenSpec); analyzed commit `6d04a1b58dedc95729d34e4f223d9d483aae210a`; commit date 2026-10-24T03:51:03Z; review date 2026-10-24T06:36:54.441Z; depth source-reviewed. [Maintenance record](../analyses/repos/ai-spec--openspec.md).
<!-- teamagent-analysis:end -->
