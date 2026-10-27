# opencode

Source: [opencode](https://github.com/anomalyco/opencode) · Category: [ai-agents](../categories/ai-agents.md)

Review depth: **focused source review**. Snapshot `907b3bc518fa48e90e8ec24dd327d13eee71c36c` (2026-10-02T21:55:40-07:00). Reviewed 2026-10-04. This assessment covers the cited implementation/contract, not every subsystem or runtime behavior.

## Finding

The reviewed session-runner boundary is a compact contract for continuing from recorded history.

## Source evidence inspected

- [packages/core/src/session/runner/index.ts, lines 1–28](https://github.com/anomalyco/opencode/blob/907b3bc518fa48e90e8ec24dd327d13eee71c36c/packages/core/src/session/runner/index.ts#L1-L28)

## Observed design and algorithms

SessionRunner exposes run(sessionID, force) as an Effect returning typed errors. The interface is defined as one local continuation from already-recorded session history and includes model, message decode, context snapshot, system initialization and tool-output store failures. The documentation distinguishes draining eligible durable work from an explicit forced provider attempt.

## Harness decision

Use a similarly small continuation interface in the harness, while keeping the concrete OpenCode adapter separately versioned. Recorded input/history should precede execution, and typed error categories should map to deterministic recovery or user-visible failure.

## Limits and tradeoffs

This is intentionally a narrow contract review. The runner implementation, actual persistence guarantees, permissions, provider translations and UI were not verified; the interface cannot prove them. Do not infer that force bypasses policy or grants arbitrary execution.

## Validation before adoption

Run adapter conformance against the pinned executable: history recording, continuation, cancellation, restart and permission mediation. Inject each error class and verify correct retry classification. No tests, live inference, installation, or production operation were performed for this review. License indicator: MIT; verify the exact files and dependencies before reuse.

Related directions: [agents](../agents.md) · [models](../models.md) · [channels](../channels.md).

<!-- teamagent-analysis:start -->
Analysis metadata: source [opencode](https://github.com/anomalyco/opencode); analyzed commit `907b3bc518fa48e90e8ec24dd327d13eee71c36c`; commit date 2026-10-02T21:55:40-07:00; review date unknown; depth source-reviewed. [Maintenance record](../analyses/repos/ai-agents--opencode.md).
<!-- teamagent-analysis:end -->
