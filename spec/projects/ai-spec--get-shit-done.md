# Get Shit Done

Source: [gsd-build/get-shit-done](https://github.com/gsd-build/get-shit-done) · Reviewed revision: `bdcaab2c752d9a33a1a1ca9acf3a3c81fb991815` · Review date: 2026-10-04.

Depth: **source-reviewed** (static source/content inspection; repository-wide audit not claimed). Related directions: [skills](../skills.md) · [agents](../agents.md) · [evolution](../evolution.md) · [memory](../memory.md).

## Evidence inspected

- [`get-shit-done/workflows/execute-phase.md` lines 1–69](https://github.com/gsd-build/get-shit-done/blob/bdcaab2c752d9a33a1a1ca9acf3a3c81fb991815/get-shit-done/workflows/execute-phase.md#L1-L69)

## Observed architecture and behavior

The inspected execute-phase workflow keeps the coordinator small and groups dependent plans into execution waves. Workers load full plan context, perform work, and produce summaries. Runtime compatibility is explicit: missing spawning support falls back to sequential work, and some host completion signals are treated as unreliable. The document recommends checking summaries, commits, and filesystem state when a completion message is lost. It defines specialized executor, verifier, planner, and integration-checker roles.

## Implications and tradeoffs for Teamagent

This is a valuable reminder that agent orchestration needs capability negotiation and durable evidence, rather than assuming every host implements identical subagent semantics. Teamagent should keep phase/task state in a transactional store with artifact hashes and worker leases; summaries and commits can corroborate completion but should not by themselves establish success. A stale SUMMARY file from a previous run or an unrelated commit could otherwise satisfy a superficial check. Workers need isolated write ownership or worktrees for overlapping code changes, plus a coordinator that can resume after process failure without duplicating side effects.

## Adoption decision

Curate the wave-planning and compact-coordinator techniques into a coding workflow bundle. Implement completion reconciliation in deterministic runtime code, using run IDs and explicit verifiers. Permit sequential fallback when the host cannot reliably spawn or report workers. Measure whether extra planning and verification agents improve task success enough to justify latency and cost. Keep context references small and durable, and avoid treating a large role catalog as a reason to spawn every role for every task.

## Verification boundary

No project code, models, installers, or benchmarks were executed during this review. Tests and documentation show intended contracts; they do not establish measured performance, production readiness, or a complete security assessment. Recommendations above are design inferences from the cited snapshot. Verify current APIs, licensing, and deployment requirements before integration.
