# crewai

Source: [crewai](https://github.com/crewAIInc/crewAI) · Category: [ai-agents-swarm](../categories/ai-agents-swarm.md)

Review depth: **focused source review**. Snapshot `738c8e19e35c2888d8e0663bc5cc45c5acf6ac2d` (2026-10-02T17:03:54-07:00). Reviewed 2026-10-04. This assessment covers the cited implementation/contract, not every subsystem or runtime behavior.

## Finding

Checkpoint-aware role workflows are useful, but checkpoint restoration must be separated from side-effect replay.

## Source evidence inspected

- [lib/crewai/src/crewai/crew.py, lines 400–510](https://github.com/crewAIInc/crewAI/blob/738c8e19e35c2888d8e0663bc5cc45c5acf6ac2d/lib/crewai/src/crewai/crew.py#L400-L510)

## Observed design and algorithms

Crew stores checkpoint configuration, execution context, usage and tracing state. from_checkpoint reconstructs RuntimeState and restores execution context; fork branches a restored state. Runtime reconstruction examines task-start events and selects the manager for hierarchical processing or the task agent otherwise, preserving resumed agent roles.

## Harness decision

Evaluate CrewAI for role-oriented workflows where its task abstractions fit the domain. Keep the team harness scheduler and artifact contracts independent so external CLI agents need not be converted into in-process CrewAI agents. Reuse explicit checkpoint/fork semantics in evaluation workflows.

## Limits and tradeoffs

The excerpt does not establish transactional external side effects or distributed checkpoint safety. Global event-bus runtime references deserve scrutiny for multiple concurrent teams. Role delegation can add context and coordination cost without improving task success.

## Validation before adoption

Compare single-agent and role-team baselines with equal budgets. Resume after tool success but before checkpoint commit, and test simultaneous crews for state leakage. No tests, live inference, installation, or production operation were performed for this review. License indicator: not classified; inspect source; verify the exact files and dependencies before reuse.

Related directions: [agents](../agents.md) · [memory](../memory.md) · [evolution](../evolution.md).

## Source update reviewed 2026-10-28

Reviewed commit: [`3adab2895836ddde6a2150867e2b998a0a1f5334`](https://github.com/crewaiinc/crewai/commit/3adab2895836ddde6a2150867e2b998a0a1f5334). Scope: Full skill cache implementation and cache tests read. Call-site identifier validation, loaders, registry downloads and execution paths were not audited.

The [skill cache](https://github.com/crewaiinc/crewai/blob/3adab2895836ddde6a2150867e2b998a0a1f5334/lib/crewai/src/crewai/skills/cache.py) distinguishes pinned version matches from unknown or corrupt metadata; an unpinned lookup checks only directory and metadata-file presence. Its fallback tar extractor validates every member before extraction and rejects links and special files, with [regression cases](https://github.com/crewaiinc/crewai/blob/3adab2895836ddde6a2150867e2b998a0a1f5334/lib/crewai/tests/skills/test_cache.py) for escaping symlinks, hardlinks and link chains. The modern tar path delegates to the standard library data filter.

The cache uses one organization/name directory and removes the previous version before extracting the replacement. Publication is not atomic, archive expansion has no byte/file-count bound here, and organization/name containment is not validated in this helper; upstream validation was not reviewed. Listing cached metadata also lacks structural schema checks. Adapt version-aware cache misses and adversarial archive fixtures, while retaining the old artifact until a bounded, verified replacement can be published atomically. No archives, registry operations or tests were executed.

## 2026-10-28 follow-up source review

Reviewed the frozen update from `3adab2895836ddde6a2150867e2b998a0a1f5334` to `b95aa8bbdea6bc02b465a35fa8da54fecf82f528`. This is a bounded static source review, not an upstream runtime or performance result.

In [lib/cli/src/crewai_cli/skills/main.py](https://github.com/crewaiinc/crewai/blob/b95aa8bbdea6bc02b465a35fa8da54fecf82f528/lib/cli/src/crewai_cli/skills/main.py#L380-L453), Registry skill search now walks advertised pages and prints full handle/version references without terminal-width truncation or interpreting publisher markup. It restricts scan labels to known values and marks public results whose owner may differ from the current organization. The source explicitly lacks an owner field for those public results, so the displayed current-organization attachment template cannot establish their identity. The inspected loop trusts the advertised page count and typed JSON shape; error handling prints provider response text.

[Inspected fixtures](https://github.com/crewaiinc/crewai/blob/b95aa8bbdea6bc02b465a35fa8da54fecf82f528/lib/cli/tests/skills/test_main.py#L390-L470): Inspected fixtures cover multiple pages with the same query, full piped references, literal markup, flattened descriptions and public-owner ambiguity. The broad repository diff was truncated; this review is limited to the frozen skill CLI module and its captured tests. No authenticated registry request, install or publish action was performed.

**Teamagent implication:** Treat registry discovery as untrusted metadata. Preserve complete identifiers and provider ownership separately, validate each response and page budget, and bound/redact provider errors. A scan label or visible public entry does not authorize installation or prove provenance.

## Source update reviewed 2026-11-01

Reviewed commit [`f04cce923973df6ea87386ec7355878c9b655dd3`](https://github.com/crewaiinc/crewai/commit/f04cce923973df6ea87386ec7355878c9b655dd3), compared with `b95aa8bbdea6bc02b465a35fa8da54fecf82f528`.

The [deferred result reader](https://github.com/crewaiinc/crewai/blob/f04cce923973df6ea87386ec7355878c9b655dd3/lib/crewai/src/crewai/tools/agent_tools/deferred_tool_result_reader.py) now lists exact readable aliases when an unknown alias is supplied and explains that artifacts expire with their creating run. The [regressions](https://github.com/crewaiinc/crewai/blob/f04cce923973df6ea87386ec7355878c9b655dd3/lib/crewai/tests/tools/agent_tools/test_deferred_tool_result_reader.py) exercise a leading-`./` mismatch and a revoked alias. This65-line selected delta improves recovery guidance without broadening accepted paths.

Teamagent should expose bounded, run-scoped artifact handles and explicit unavailable/expired states. An error message describing deletion does not itself prove descendant shutdown or safe cleanup; those require ownership and lifecycle evidence. The unchanged filesystem reader and the rest of the 871-path update were not exhaustively audited. No agents, cleanup routines or upstream tests were executed.

## External-update review - 2026-11-01

Reviewed `b2762ddae6edd7dae1637f81b68924db6b3ece62` against `f04cce923973df6ea87386ec7355878c9b655dd3` after reconciling the local category move. The source URL and existing report identity remain unchanged.

The [release CLI delta](https://github.com/crewaiinc/crewai/blob/b2762ddae6edd7dae1637f81b68924db6b3ece62/lib/devtools/src/crewai_devtools/cli.py) separates LiteLLM model-catalog refresh into its own review branch and PR before the version bump, waits for that PR to merge, and skips branch/PR creation when the catalog is unchanged. An explicit skip option and failure/resume guidance are added. [New fixtures](https://github.com/crewaiinc/crewai/blob/b2762ddae6edd7dae1637f81b68924db6b3ece62/lib/devtools/tests/test_release_catalog_phase.py) cover unchanged catalogs, a dedicated changed-catalog PR and cleanup when branch reset is declined. The eight-path update also changes an Anthropic import-isolation fixture and dependency metadata.

**Teamagent implication:** Version model capability/pricing catalogs independently from release packaging, expose their source and review date, and review semantic changes before selection uses them. Catalog freshness is not evidence of account entitlement, training exclusion or live model access. Keep publication authorization separate from catalog review and preserve unrelated edits during recovery; this upstream release workflow is not imported as Teamagent authorization.

**Scope and limits:** Complete eight-path delta inspected, including the new release fixture. The unchanged catalog downloader/validator, branch-reset implementation, dependency artifacts and live publication behavior were not audited. No upstream install, test, model request, PR or release was executed. Related directions: [models](../models.md), [decisions](../decisions.md), [evolution](../evolution.md).

<!-- teamagent-analysis:start -->
Analysis metadata: source [crewai](https://github.com/crewaiinc/crewai); analyzed commit `b2762ddae6edd7dae1637f81b68924db6b3ece62`; commit date 2026-11-01T12:42:28-03:00; review date 2026-11-01T23:12:06.798Z; depth source-reviewed. [Maintenance record](../analyses/repos/ai-agents-swarm--crewai.md).
<!-- teamagent-analysis:end -->
