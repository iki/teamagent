# gascity

Source: [gascity](https://github.com/gastownhall/gascity) · Category: [ai-agents](../categories/ai-agents.md)

Review depth: **focused source review**. Snapshot `802b6134df87b1d7519df63ed44ad63e1570a5c5` (2026-10-03T13:44:32-07:00). Reviewed 2026-10-04. This assessment covers the cited implementation/contract, not every subsystem or runtime behavior.

## Finding

A progress-aware respawn circuit breaker addresses a failure mode of persistent agent supervisors.

## Source evidence inspected

- [cmd/gc/session_circuit_breaker.go, lines 1–110](https://github.com/gastownhall/gascity/blob/802b6134df87b1d7519df63ed44ad63e1570a5c5/cmd/gc/session_circuit_breaker.go#L1-L110)

## Observed design and algorithms

The circuit-breaker configuration defines a rolling restart window, maximum restarts and cooldown, with defaults of thirty minutes, five restarts and twice-window reset. Session metadata records circuit state, restart timestamps, progress signature and reset generation. Activation depends on explicit city configuration; it is not unconditional.

## Harness decision

Borrow the separation between worker liveness and useful progress. Persist a progress signature and transition repeatedly failing sessions to a visible blocked/cooldown state. Combine retry ceilings with task deadlines and a final failure artifact.

## Limits and tradeoffs

Default restart counts are operational choices, not experimentally justified universal settings. Changed output can look like progress while the actual objective remains stuck. Conversely a long compilation can be legitimate without frequent messages. A circuit breaker is one layer in a larger reconciliation system.

## Validation before adoption

Inject crashes, identical repeated failures, noisy no-progress logs and long silent valid work. Confirm restart state survives supervisor restart and that intervention or cooldown has a recorded reason. No tests, live inference, installation, or production operation were performed for this review. License indicator: MIT; verify the exact files and dependencies before reuse.

Related directions: [agents](../agents.md) · [evolution](../evolution.md).

<!-- teamagent-analysis:start -->
Analysis metadata: source [gascity](https://github.com/gastownhall/gascity); analyzed commit `802b6134df87b1d7519df63ed44ad63e1570a5c5`; commit date 2026-10-03T13:44:32-07:00; review date unknown; depth source-reviewed. [Maintenance record](../analyses/repos/ai-agents--gascity.md).
<!-- teamagent-analysis:end -->
