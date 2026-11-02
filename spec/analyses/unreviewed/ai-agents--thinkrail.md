# ThinkRail

Source: [ThinkRail](https://github.com/jetbrains/thinkrail) · [agents](../../agents.md) · [models](../../models.md) · [channels](../../channels.md).

Initial review: scoped source inspection of workspace subagent policy. Product-wide capabilities remain candidates. [Change evidence](../repos/ai-agents--thinkrail.md).

## 2026-11-01 scoped source review

Reviewed frozen commit `45778444aabd371b5ef31e73ecfdbf4f1b150b99`. This is the first source review for this project.

The [README](https://github.com/jetbrains/thinkrail/blob/45778444aabd371b5ef31e73ecfdbf4f1b150b99/README.md) describes a Pi-based IDE with worktree workspaces, living specs, reusable skills, desktop/browser surfaces and existing-provider credentials. Those are upstream product claims; this initial source review establishes only the narrower subagent-policy helper.

The complete [policy implementation](https://github.com/jetbrains/thinkrail/blob/45778444aabd371b5ef31e73ecfdbf4f1b150b99/packages/server/src/host/subagentPolicy.ts) disables subagents when the workspace is unknown, applies an explicit workspace on/off override before the global default, and accepts a concurrency override only through the shared validator. Invalid workspace limits fall back to a valid global limit and then the declared default. The [complete fixture](https://github.com/jetbrains/thinkrail/blob/45778444aabd371b5ef31e73ecfdbf4f1b150b99/packages/server/src/host/subagentPolicy.test.ts) covers precedence, absent workspace, zero/fractional overrides and an invalid global limit.

Use separate enablement and resource-limit policies: a returned numeric limit is not authorization to spawn, particularly when the workspace is unknown. The host admission call sites, validator bounds, worker isolation, live specs and skill evolution remain research candidates requiring deeper inspection before adoption.

**Coverage:** Read the complete 24-line policy and 22-line fixture, plus README lines 1–98 of 290. This is initial scoped source review, not a delta from a prior analyzed commit. Source inspection only; no upstream tests, source programs or live providers were executed. This is a scoped architecture review, not a whole-repository correctness or security certification.

## External-update review - 2026-11-01

Reviewed `344aafcb0b56902e5fc87834059a353d54ca8892` against `45778444aabd371b5ef31e73ecfdbf4f1b150b99`.

Within the 98-path search/UI update, the new [backfill queue](https://github.com/jetbrains/thinkrail/blob/344aafcb0b56902e5fc87834059a353d54ca8892/apps/web/src/shell/backfillQueue.ts) keeps in-flight work separate from pending order. Rescheduling replaces pending work, coalesces repeated requests for an active key into one rerun, and rechecks whether a key is still wanted when dequeuing. [Fixtures](https://github.com/jetbrains/thinkrail/blob/344aafcb0b56902e5fc87834059a353d54ca8892/apps/web/src/shell/backfillQueue.test.ts) cover concurrency across reschedules, dropped pending items, stale keys, coalescing and release after rejected promises.

**Harness consequence:** Background context/search preparation should preserve active ownership while replacing obsolete pending intent. The inspected helper does not validate concurrency, bound pending key count, cancel active work or expose failure receipts; it swallows promise rejection, and a synchronous throw from run would bypass its chained cleanup. These are adapter-contract limits to address before reuse, not a demonstrated product incident. Review covers the complete queue and fixture files only, not search ranking, navigation or desktop installer changes. No UI, queue test or packaged application was executed.

<!-- teamagent-analysis:start -->
Analysis metadata: source [thinkrail](https://github.com/jetbrains/thinkrail); analyzed commit `344aafcb0b56902e5fc87834059a353d54ca8892`; commit date 2026-11-01T20:20:29+02:00; review date 2026-11-01T23:12:06.798Z; depth reviewed. [Maintenance record](../repos/ai-agents--thinkrail.md).
<!-- teamagent-analysis:end -->
