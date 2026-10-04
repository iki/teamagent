# paperclip

Source: [paperclip](https://github.com/paperclipai/paperclip) · Category: [ai-agents](../categories/ai-agents.md)

Review depth: **focused source review**. Snapshot `2a8a99e4a5f69aa803b3f10b982f583e75a87042` (2026-10-03T12:41:22-05:00). Reviewed 2026-10-04. This assessment covers the cited implementation/contract, not every subsystem or runtime behavior.

## Finding

Persistent scoped budgets are a stronger control-plane primitive than a prompt asking agents to spend less.

## Source evidence inspected

- [server/src/services/budgets.ts, lines 28–100](https://github.com/paperclipai/paperclip/blob/2a8a99e4a5f69aa803b3f10b982f583e75a87042/server/src/services/budgets.ts#L28-L100)

## Observed design and algorithms

The service models company, project and agent scopes with persisted policies, incidents and cost events. It distinguishes UTC monthly and lifetime windows. budgetStatusFromObserved maps observed usage to ok, warning and hard_stop; a nonpositive amount is treated as no active limit. A cancellation hook allows enforcement to stop work for a scope.

## Harness decision

Adopt explicit budget scope, incident and resolution concepts for a team harness. Add admission reservations before parallel work and reconcile actual usage afterward. Keep money, tokens, subscription allowance and compute time as distinct units; the reviewed threshold function does not solve unit conversion.

## Limits and tradeoffs

A threshold over already-observed cost can overshoot during concurrent or long-running requests. A cancellation hook does not prove that every provider request is cancellable or that enforcement is atomic. The company-management product is broader than the requested core.

## Validation before adoption

Test two workers consuming the same remaining budget, late usage events, month boundaries, idempotent cost ingestion and cancellation failures. Expose estimate-versus-measured accounting clearly. No tests, live inference, installation, or production operation were performed for this review. License indicator: MIT; verify the exact files and dependencies before reuse.

Related directions: [agents](../agents.md) · [models](../models.md) · [evolution](../evolution.md).
