# mini-swe-agent

Source: [mini-swe-agent](https://github.com/SWE-agent/mini-swe-agent) · Category: [ai-agents](../categories/ai-agents.md)

Review depth: **focused source review**. Snapshot `04d809ceab9df28f9adaed044884180159172930` (2026-09-03T01:05:59-04:00). Reviewed 2026-10-04. This assessment covers the cited implementation/contract, not every subsystem or runtime behavior.

## Finding

A small, auditable single-agent loop provides the baseline that a larger team harness must beat.

## Source evidence inspected

- [src/minisweagent/agents/default.py, lines 20–145](https://github.com/SWE-agent/mini-swe-agent/blob/04d809ceab9df28f9adaed044884180159172930/src/minisweagent/agents/default.py#L20-L145)

## Observed design and algorithms

DefaultAgent separates Model and Environment, records messages, and runs query/execute steps until an explicit exit record. It tracks calls, billed cost, wall time and consecutive formatting failures. The loop saves the trajectory in finally, including failed steps. Formatting failures account for billed calls and stop after a configured consecutive-error limit.

## Harness decision

Adopt the minimal single-worker baseline and explicit exit taxonomy for evaluation. Capture traces even on failure. Add team decomposition, memory and decision routing only when they improve measured outcomes over this baseline.

## Limits and tradeoffs

The cost ceiling is checked before the next query, so an individual request can exceed the limit, as its configuration comment acknowledges. A simple linear transcript and environment interface do not supply shared-memory governance, distributed state or channel delivery.

## Validation before adoption

Compare pass rate, intervention count, latency and spend on the same task/environment/model budgets. Include malformed model output and exceptions to verify terminal status and trace durability. No tests, live inference, installation, or production operation were performed for this review. License indicator: MIT; verify the exact files and dependencies before reuse.

Related directions: [agents](../agents.md) · [evolution](../evolution.md) · [models](../models.md).
