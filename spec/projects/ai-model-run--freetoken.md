# FreeToken: resource-aware local MoE serving

Source: [freetoken](https://github.com/FlashML-org/FreeToken) · Category: `ai-model-run`

Review depth: **source-reviewed**. Snapshot `d3512b43affe981465e03ee28cbd88f49c39b9aa`; assessed 2026-10-04. This is a focused static review of the listed files, not an audit of every code path or a reproduced benchmark. No repository code, model weights, paid endpoints, or installers were run.

## Observed architecture

FreeToken advertises heterogeneous local MoE serving, expert caching, and context-cache reuse. The inspected memory policy is deliberately pure arithmetic over measured quantities. It computes a net budget after fixed weights/cache, reserves KV pages, fills expert slots within bounds, adjusts overlap feasibility, and rejects plans that exceed the budget before device allocation.

This yields a useful engineering lesson: memory admission should be explicit and independently testable. The same policy is intended for startup sizing and runtime rebuilds, avoiding inconsistent equations across those paths. However, the policy file alone does not prove the allocator, kernels, and serving scheduler honor every invariant under concurrent load.

## Harness adoption

Evaluate as an optional local inference endpoint for hardware with a compatible backend. Feed actual free-memory measurements and required context into admission control. Record predicted and observed memory use, model load time, cold/warm prefill, and response latency. Reserve capacity before starting a task whose long context cannot fit.

Separate engine KV or recurrent-state caching from the knowledge base. Engine caches speed repeated inference and may be evicted or invalidated by weight/configuration changes; durable memory needs provenance, access control, retrieval, and semantic updates independent of a particular GPU process.

## Limitations and decision

Prototype under workload measurements. Hardware support, quantization correctness, advertised interactive speed, and context-edit cache benefits were not reproduced. A fast warm-cache demo does not establish performance for many simultaneous agents with divergent contexts. Use conservative resource headroom, pin runtime and weight versions, and preserve cancellation/deadline propagation. Compare with [Colibri](ai-model-run--colibri.md) and other installed local servers using the same task traces instead of choosing by maximum parameter-count claims.

## Evidence read

- [Pure expert/KV memory budgeting](https://github.com/FlashML-org/FreeToken/blob/d3512b43affe981465e03ee28cbd88f49c39b9aa/python/freetoken/engine/cache_budget.py#L1-L128)
- [Engine scope and advertised caching](https://github.com/FlashML-org/FreeToken/blob/d3512b43affe981465e03ee28cbd88f49c39b9aa/README.md#L15-L26)

## Related directions

[Models](../models.md) · [Decisions](../decisions.md) · [Memory](../memory.md)


## Change review - 2026-10-28

**Pure cache sizing rejects impossible plans while readiness metrics conflate missing and zero.** Reviewed commit `9221fd7fc2b923813d7f9563c6c08f0a38497590` (commit date `2026-10-26T22:38:53-07:00`). Compared with `d3512b43affe981465e03ee28cbd88f49c39b9aa`; the complete Git comparison contains 522 changed paths.

The cache-budget policy computes available pool bytes from a recorded pre-model free-memory baseline, one memory-ratio application, model weights and fixed cache costs. It reserves KV pages before allocating expert slots, enforces a kernel slot cap, disables prefill overlap when the cap cannot hold two expert layers, and asserts that the final minimum geometry fits before allocation. The engine passes measured bank row bytes, pool-specific costs and recurrent-state cost into this policy. Read fixtures cover insufficient budgets, slot caps, overlap, byte accounting and applying the ratio once. Separately, cache-status telemetry deliberately catches measurement errors and substitutes zero; zero therefore means either absent cache or unavailable measurement, and should not be interpreted as a measured zero-cost configuration. Assertions and arithmetic are useful reference logic but are not a complete validated external configuration boundary.

Evidence: [python/freetoken/engine/cache_budget.py:1-140](https://github.com/FlashML-org/FreeToken/blob/9221fd7fc2b923813d7f9563c6c08f0a38497590/python/freetoken/engine/cache_budget.py#L1-L140) · [python/freetoken/engine/engine.py:692-717](https://github.com/FlashML-org/FreeToken/blob/9221fd7fc2b923813d7f9563c6c08f0a38497590/python/freetoken/engine/engine.py#L692-L717) · [python/freetoken/kvcache/cache_status.py:16-71](https://github.com/FlashML-org/FreeToken/blob/9221fd7fc2b923813d7f9563c6c08f0a38497590/python/freetoken/kvcache/cache_status.py#L16-L71) · [python/freetoken/kvcache/cache_status.py:74-100](https://github.com/FlashML-org/FreeToken/blob/9221fd7fc2b923813d7f9563c6c08f0a38497590/python/freetoken/kvcache/cache_status.py#L74-L100) · [python/freetoken/kvcache/cache_status.py:139-197](https://github.com/FlashML-org/FreeToken/blob/9221fd7fc2b923813d7f9563c6c08f0a38497590/python/freetoken/kvcache/cache_status.py#L139-L197) · [tests/engine/test_cache_budget.py:1-122](https://github.com/FlashML-org/FreeToken/blob/9221fd7fc2b923813d7f9563c6c08f0a38497590/tests/engine/test_cache_budget.py#L1-L122).

**Harness consequence:** Separate deterministic resource planning from GPU side effects and retain the measured baseline, model revision, units and headroom assumptions in reservation receipts. Use typed validation/errors rather than removable assertions for external inputs. Represent cache telemetry as measured/unavailable/not-applicable, and measure real peak allocation and concurrent admission before adopting this engine or promising fit.

**Scope and limits:** Scoped source and arithmetic-fixture inspection within a 522-path comparison. No upstream tests, GPU allocation, model weights, kernels, runtime cache rebuild or throughput/quality benchmark ran; other changed engine/server/model code remains outside this slice.

## Follow-up change review — 2026-10-28

**Speculative decode rollback frees only pages beyond committed tokens.** Reviewed commit `a2ce636083a0137571ba505768ad36be5f7a393b` (commit date `2026-10-27T23:56:59-07:00`), compared with `9221fd7fc2b923813d7f9563c6c08f0a38497590`. The complete no-rename Git path inventory contains 42 changed paths.

The new rollback_tail rounds the retained and dropped token boundaries up to whole pages, frees the discarded slice and applies the sliding-window allocator release when enabled. Its contract requires a lazy-free region after the producing forward has drained. The fixture repeats widened decode/partial commit twice over page sizes one/four and multiple cached lengths, asserting free capacity and no overlap with retained pages.

Evidence: [python/freetoken/scheduler/cache.py:637-649](https://github.com/FlashML-org/FreeToken/blob/a2ce636083a0137571ba505768ad36be5f7a393b/python/freetoken/scheduler/cache.py#L637-L649) · [tests/scheduler/test_rollback_tail.py:1-36](https://github.com/FlashML-org/FreeToken/blob/a2ce636083a0137571ba505768ad36be5f7a393b/tests/scheduler/test_rollback_tail.py#L1-L36).

**Harness consequence:** Model speculative work as provisional resource ownership. Cancellation/rollback must wait for in-flight device work and release only uncommitted pages; allocator reuse correctness is distinct from generation throughput.

**Scope and limits:** Reviewed the new rollback method and complete focused fixture; GPU execution, sliding-window behavior and broader attention changes were not benchmarked. This is a scoped static comparison, not a whole-project correctness or security audit. Upstream tests were read where cited, not run; no upstream code, service, model or provider operation was executed. Historical findings above remain evidence at their own revisions.

## 2026-11-01 scoped source review

Reviewed commit `ee43b2a11345d056ba349d22ee073c6828b1364b` (commit date `2026-10-29T17:15:32-07:00`), compared with `a2ce636083a0137571ba505768ad36be5f7a393b`. Earlier observations remain historical evidence.

**Scope:** Complete completion-endpoint parameter-rejection diff and associated new server fixtures. Scheduler, speculative decoding, kernel changes and live inference were not audited in this update.

The [completion endpoint](https://github.com/FlashML-org/FreeToken/blob/ee43b2a11345d056ba349d22ee073c6828b1364b/python/freetoken/server/openai_api.py) now rejects n other than 1 before dispatch rather than silently producing one result. [Fixtures](https://github.com/FlashML-org/FreeToken/blob/ee43b2a11345d056ba349d22ee073c6828b1364b/tests/server/test_openai_api.py) exercise n=0 and n=2 in streaming and non-streaming modes, expecting HTTP 400, an error identifying n and no sent worker request. This establishes a narrowly specified compatibility boundary in source; it does not certify the full OpenAI-compatible surface or model throughput.

**Teamagent implication (inference):** Publish route-specific supported parameters and fail before model allocation or remote content submission when a requested behavior is unsupported. Keep explicit overrides truthful: do not silently discard options or emulate them through extra billable calls. Test both streaming and non-streaming rejection paths.

**Verification limit:** committed-source inspection only; no upstream code, tests or provider calls were executed. Review scope is the cited implementation or authored guidance, not whole-project correctness, licensing clearance or measured performance. Source passages were redacted for review; exact URL literals were not byte-validated.

<!-- teamagent-analysis:start -->
Analysis metadata: source [freetoken](https://github.com/FlashML-org/FreeToken); analyzed commit `ee43b2a11345d056ba349d22ee073c6828b1364b`; commit date 2026-10-29T17:15:32-07:00; review date 2026-11-01T11:35:43.470Z; depth source-reviewed. [Maintenance record](../analyses/repos/ai-model-run--freetoken.md).
<!-- teamagent-analysis:end -->
