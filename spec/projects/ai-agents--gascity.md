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

## 2026-10-28 scoped update review

Reviewed commit `e73ebbfb48fd7f6d2e44e336da4f5fecad7f9fe6` (commit date `2026-10-27T14:24:46Z`). The original snapshot above remains historical evidence.

**Scope:** Complete Dolt-auth environment wrapper and runtime CLI registration; circuit-breaker configuration, transition, restore, persistence and progress-signature ranges. Supervisor call-site enforcement, session store/codec, auth resolver and tests were not audited.

The [session circuit breaker](https://github.com/gastownhall/gascity/blob/e73ebbfb48fd7f6d2e44e336da4f5fecad7f9fe6/cmd/gc/session_circuit_breaker.go#L191-L323) trips only when restarts exceed a rolling threshold without recent progress. First observation establishes a baseline rather than inventing progress; progress does not clear an already-open circuit, while cooldown/manual reset can. The [signature builder](https://github.com/gastownhall/gascity/blob/e73ebbfb48fd7f6d2e44e336da4f5fecad7f9fe6/cmd/gc/session_circuit_breaker.go#L894-L981) rejects ambiguous aliases and hashes sorted assigned-work ID/status pairs. A changed status signature measures metadata movement, not correctness, and repeated toggles can continue counting as progress. Retain this as restart admission evidence rather than task acceptance or a global resource ceiling.

The [restore and reset paths](https://github.com/gastownhall/gascity/blob/e73ebbfb48fd7f6d2e44e336da4f5fecad7f9fe6/cmd/gc/session_circuit_breaker.go#L330-L389) reject unknown states and snapshots below the remembered reset generation. The [restart persistence helper](https://github.com/gastownhall/gascity/blob/e73ebbfb48fd7f6d2e44e336da4f5fecad7f9fe6/cmd/gc/session_circuit_breaker.go#L657-L696) holds the local mutex and restores a copied entry after a store failure, including a separately cloned restart slice. Store-level atomicity and supervisor enforcement were not inspected. Restored timestamps are parsed but not sorted or checked for implausible future values, while trimming assumes chronological order and recent-progress comparison has no upper time bound. Idle pruning also deliberately retains reset-generation entries, so identity history needs its own lifecycle bound. Use explicit clock/validation rules and durable generations without equating a process-local mutex to distributed fencing.

The [Dolt environment wrapper](https://github.com/gastownhall/gascity/blob/e73ebbfb48fd7f6d2e44e336da4f5fecad7f9fe6/cmd/gc/dolt_auth.go#L9-L32) delegates scoped credential resolution and deletes keys whose resolved value is empty, preventing a stale value from simply remaining in the supplied map. It trims every value, including passwords, and the actual concurrent native-open guard was not reviewed. The [runtime command registry](https://github.com/gastownhall/gascity/blob/e73ebbfb48fd7f6d2e44e336da4f5fecad7f9fe6/cmd/gc/cmd_runtime.go#L10-L48) exposes distinct drain, acknowledgement, heartbeat and conformance operations; registration alone proves neither their authority nor provider conformance. No supervisor, database, process or upstream test ran.

**Verification limit:** source inspection only; no upstream tests or provider calls were executed. This scoped review does not certify every file in the repository.

## 2026-10-28 follow-up source review

Reviewed commit `28bf3f3a778d28f2a4d29d0d2c49bde66a933651` (commit date `2026-10-28T09:59:03Z`), compared with `e73ebbfb48fd7f6d2e44e336da4f5fecad7f9fe6`. Earlier findings remain historical evidence.

**Scope:** Provider cache applicability, recorded transport identity and mail-store configuration failure. The complete changed-path inventory contains 404 paths; the assessment below is limited to the cited branches.

Provider-cache reuse is skipped when a workspace start command overrides the effective launch; session transport detection prefers recorded transport. Mail-provider startup now refuses a configuration-read failure when the city may route data into separate stores, rather than guessing a default store. See [cmd/gc/providers.go](https://github.com/gastownhall/gascity/blob/28bf3f3a778d28f2a4d29d0d2c49bde66a933651/cmd/gc/providers.go#L344-L366), [cmd/gc/providers.go](https://github.com/gastownhall/gascity/blob/28bf3f3a778d28f2a4d29d0d2c49bde66a933651/cmd/gc/providers.go#L420-L444), [cmd/gc/providers.go](https://github.com/gastownhall/gascity/blob/28bf3f3a778d28f2a4d29d0d2c49bde66a933651/cmd/gc/providers.go#L523-L542) and [cmd/gc/providers.go](https://github.com/gastownhall/gascity/blob/28bf3f3a778d28f2a4d29d0d2c49bde66a933651/cmd/gc/providers.go#L936-L957). The refusal path attempts to close the opened store but ignores that close result.

For Teamagent, bind cached capabilities to the complete effective launch configuration and refuse unknown routing before a write. A fallback is acceptable only when its equivalence is established; the single-store determination helper itself was not reviewed here. Retain cleanup uncertainty separately. Session-hash composition, runtime reconciliation and actual provider starts were not fully audited.

**Verification limit:** committed-source inspection only; no upstream code, tests or provider calls were executed. This review does not certify every changed file or establish a Teamagent integration.

## 2026-11-01 scoped source review

Reviewed commit `879a71fa0bc58a33c890e2c0980cbe1977204487` (commit date `2026-11-01T09:16:28Z`), compared with `28bf3f3a778d28f2a4d29d0d2c49bde66a933651`. Earlier observations remain historical evidence.

**Scope:** Expanded resume decision/write implementation and selected contention, hold-preservation and passive-preview fixtures; whole-repository diff was oversized. Storage CAS implementation and controller execution not audited.

The [resume path](https://github.com/gastownhall/gascity/blob/879a71fa0bc58a33c890e2c0980cbe1977204487/internal/session/resume.go) uses a proposal-time cutoff so replay cannot consume a later suspend, preserves other holds, and combines suspend removal with a wake request in one fenced metadata patch. No-op decisions receive a live reread, with bounded contention attempts and explicit conflict errors. [Fixtures](https://github.com/gastownhall/gascity/blob/879a71fa0bc58a33c890e2c0980cbe1977204487/internal/session/resume_test.go) compare passive preview with writes and preserve waits/quarantine. Its timestamp granularity still treats a same-second suspend as preceding the proposal.

**Teamagent implication (inference):** Use exact generations or operation identities to fence resumed work against newer user intent. Keep planning read-only and re-evaluate at execution, recording accepted wake separately from actual runtime readiness; uncertain storage/process outcomes must remain reconcilable.

**Verification limit:** committed-source inspection only; no upstream code, tests or provider calls were executed. Review scope is the cited implementation or authored guidance, not whole-project correctness, licensing clearance or measured performance. Source passages were redacted for review; exact URL literals were not byte-validated.

<!-- teamagent-analysis:start -->
Analysis metadata: source [gascity](https://github.com/gastownhall/gascity); analyzed commit `879a71fa0bc58a33c890e2c0980cbe1977204487`; commit date 2026-11-01T09:16:28Z; review date 2026-11-01T11:33:30.893Z; depth source-reviewed. [Maintenance record](../analyses/repos/ai-agents--gascity.md).
<!-- teamagent-analysis:end -->
