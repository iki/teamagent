# world-model-optimizer

Source: [world-model-optimizer](https://github.com/experientiallabs/world-model-optimizer) · Category: [ai-agents](../categories/ai-agents.md)

Review depth: **inventory / README screening only**. This is an individual coverage record, not a source-code correctness audit or adoption recommendation.

Snapshot: `d85ca8553118cdd718e529238289820a7eb12472`; commit timestamp `2026-10-03T12:42:32-07:00`; 1,434 tracked paths.

## Scope and evidence

Upstream description excerpt (a project claim, automatically extracted from [README](https://github.com/experientiallabs/world-model-optimizer/blob/d85ca8553118cdd718e529238289820a7eb12472/README.md)):

> [](https://github.com/experientiallabs/experiential/actions/workflows/gateway-latency.yml?query=branch%3Amain) Experiential is an open source gateway and router for agent workflows:

Build/package evidence: [exp/runtime/gateway/native/Cargo.toml](https://github.com/experientiallabs/world-model-optimizer/blob/d85ca8553118cdd718e529238289820a7eb12472/exp/runtime/gateway/native/Cargo.toml); [exp/runtime/gateway/native/pyproject.toml](https://github.com/experientiallabs/world-model-optimizer/blob/d85ca8553118cdd718e529238289820a7eb12472/exp/runtime/gateway/native/pyproject.toml); [pyproject.toml](https://github.com/experientiallabs/world-model-optimizer/blob/d85ca8553118cdd718e529238289820a7eb12472/pyproject.toml)

License evidence: [LICENSE](https://github.com/experientiallabs/world-model-optimizer/blob/d85ca8553118cdd718e529238289820a7eb12472/LICENSE) Classification hint: Apache-2.0. A root license does not establish rights for every bundled asset, model, or dependency.

## Harness assessment

This entry was catalogued under **ai-agents**. Its category places it in the candidate set for agents, models, channels; those associations are navigational and have not been individually validated as implemented capabilities. See [agents](../agents.md) · [models](../models.md) · [channels](../channels.md) for the source-reviewed alternatives and proposed integration boundaries.

**Disposition:** retain as a comparison candidate. Before adopting it, inspect the implementation entry point and its tests, verify the required protocol and deployment platform, and reproduce a task from the harness evaluation suite. Popularity, a README feature list, and the presence of a package manifest are insufficient evidence of quality or compatibility.

**Unresolved:** runtime behavior, security boundaries, performance, API/subscription eligibility, dependency health, maintenance status, and fit to the proposed harness were not independently established for this entry. No repository code was executed as part of this screening.

## 2026-10-28 scoped source review

Source: [world-model-optimizer](https://github.com/experientiallabs/world-model-optimizer); inspected saved discovery revision `5f4348efd714894d8def5a498117e9b830598350`. Prior analyzed revision `d85ca8553118cdd718e529238289820a7eb12472` remains historical evidence.

**Scope:** Full deployment-health registry and provider environment-name helper read. Gateway dispatch, lane-ejection policy, failure normalization, ledger/accounting and tests were not audited.

The [health registry](https://github.com/experientiallabs/world-model-optimizer/blob/5f4348efd714894d8def5a498117e9b830598350/exp/runtime/gateway/health.py) keeps catalog/deployment/connection identities, uses an injectable monotonic clock and serializes state under a lock. It distinguishes provider authentication/quota failures, transport failures, refusals and throttling, with clamped provider backoff windows. Opening a stream restores reachability before terminal success, so that observation must remain distinct from task correctness. A release_probe path exists for dispatches that never began, but cancellation-safe use of it was not reviewed.

Suppression is explicitly a routing heuristic: forced claims can pass an open circuit and throttle-redial claims can pass a throttle window. The latter helper does not bind the caller to the original throttled request; call-site policy must establish that precondition. Per-deployment dictionary entries have no eviction in this file, so bounded state assumes a bounded catalog/connection lifecycle. Constructor positivity checks do not reject every nonfinite float. These are not hard spend or concurrency guarantees.

The [credential override-name helper](https://github.com/experientiallabs/world-model-optimizer/blob/5f4348efd714894d8def5a498117e9b830598350/exp/common/auth/env_names.py) retains known provider names but sanitizes, uppercases and truncates punctuation distinctions in custom connection IDs. Distinct IDs such as a-b and a_b therefore share an override name unless callers reject collisions. Adapt separate content-free health, policy identity and credential namespaces with explicit collision checks; no gateway, credentials, model calls or tests were executed.

## 2026-10-28 follow-up source review

Reviewed the frozen update from `5f4348efd714894d8def5a498117e9b830598350` to `5e53609b1a67accb8f01487488e02da6ee451a28`. Earlier findings above remain historical evidence; this review is limited to the cited source and delta.

In [exp/runtime/router/application.py](https://github.com/experientiallabs/world-model-optimizer/blob/5e53609b1a67accb8f01487488e02da6ee451a28/exp/runtime/router/application.py#L133-L166), Gateway shutdown now waits for serving and accounting recovery before releasing workers, ledger and key. If either stage exceeds the join budget it raises while retaining ownership, so a caller can retry close. Startup failure uses a separate helper that retries this cleanup until it succeeds.

**Harness implication and limits:** Preserve ownership when cleanup is incomplete and report that state separately from closed. The startup cleanup loop is unbounded, so the nominal startup timeout does not bound total failure-return latency; later worker shutdown also has no visible timeout here. A robust host needs cancellable recovery ownership and a documented hard-stop strategy. No server, accounting workload or shutdown test was run. This static review does not certify other changed subsystems.

## 2026-11-01 scoped source review

Reviewed frozen commit `712954f68c01423d274242b2b85d6c6361ad6c09` against prior analyzed commit `5e53609b1a67accb8f01487488e02da6ee451a28`. Historical reviews above remain separate evidence.

The [guardrail engine](https://github.com/experientiallabs/world-model-optimizer/blob/712954f68c01423d274242b2b85d6c6361ad6c09/exp/runtime/gateway/guardrails/enforcement.py) adds an optional bounded classification-record worker, separate from serving and from asynchronous observation records. Scored verdicts carry authenticated request identity, policy/check identity, outcome, category scores, subject digest, cache flag and latency; missing request identity or unscored verdicts produce no score record. Drop/failure counters remain visible, and shutdown consumes the remaining shared deadline.

The [added fixtures](https://github.com/experientiallabs/world-model-optimizer/blob/712954f68c01423d274242b2b85d6c6361ad6c09/exp/runtime/gateway/guardrails/enforcement_test.py) check an enforced rejection still records scores, an observe-only allow leaves the request unchanged, and unscored adapters do not fabricate scores. The score model and recording implementation were not re-audited. Teamagent decision-model telemetry should preserve policy version, privacy and missing-record coverage while keeping classification evidence distinct from deterministic authorization. Subject digests can still identify sensitive known inputs and require access/retention controls; no accuracy or latency benchmark was reproduced.

**Coverage:** Read complete enforcement implementation/test delta (466 presented lines). Classification model, recorder internals, routing/cache changes and live model behavior were outside scope. Source inspection only; no upstream tests, source programs or live providers were executed. This is a scoped architecture review, not a whole-repository correctness or security certification.

<!-- teamagent-analysis:start -->
Analysis metadata: source [world-model-optimizer](https://github.com/experientiallabs/world-model-optimizer); analyzed commit `712954f68c01423d274242b2b85d6c6361ad6c09`; commit date 2026-10-31T22:50:30-07:00; review date 2026-11-01T11:33:30.893Z; depth screened. [Maintenance record](../analyses/repos/ai-agents--world-model-optimizer.md).
<!-- teamagent-analysis:end -->
