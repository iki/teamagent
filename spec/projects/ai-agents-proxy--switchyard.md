# switchyard

Source: [switchyard](https://github.com/NVIDIA-NeMo/Switchyard) · Category: [ai-agents-proxy](../categories/ai-agents-proxy.md)

Review depth: **inventory / README screening only**. This is an individual coverage record, not a source-code correctness audit or adoption recommendation.

Snapshot: `c8848511a7e2e1d605070c7a68905bdc24c6481a`; commit timestamp `2026-10-02T14:59:36-07:00`; 633 tracked paths.

## Scope and evidence

Upstream description excerpt (a project claim, automatically extracted from [README](https://github.com/NVIDIA-NeMo/Switchyard/blob/c8848511a7e2e1d605070c7a68905bdc24c6481a/README.md)):

> Switchyard is an open-source library that helps an AI agent choose which model handles each request. It combines efficient models with more capable models so you can balance task success, cost, and latency on your workload. Use Switchyard through a gateway integration, try it with a local proxy, or embed it in your own harness. You choose the model pool. Switchyard supplies the routing decision. Your gateway or application owns the surrounding service.

Build/package evidence: [Cargo.toml](https://github.com/NVIDIA-NeMo/Switchyard/blob/c8848511a7e2e1d605070c7a68905bdc24c6481a/Cargo.toml); [crates/libsy-llm-client/Cargo.toml](https://github.com/NVIDIA-NeMo/Switchyard/blob/c8848511a7e2e1d605070c7a68905bdc24c6481a/crates/libsy-llm-client/Cargo.toml); [crates/libsy/Cargo.toml](https://github.com/NVIDIA-NeMo/Switchyard/blob/c8848511a7e2e1d605070c7a68905bdc24c6481a/crates/libsy/Cargo.toml); [crates/prefill-router/Cargo.toml](https://github.com/NVIDIA-NeMo/Switchyard/blob/c8848511a7e2e1d605070c7a68905bdc24c6481a/crates/prefill-router/Cargo.toml); [crates/prefill-router/pyproject.toml](https://github.com/NVIDIA-NeMo/Switchyard/blob/c8848511a7e2e1d605070c7a68905bdc24c6481a/crates/prefill-router/pyproject.toml)

License evidence: [LICENSE](https://github.com/NVIDIA-NeMo/Switchyard/blob/c8848511a7e2e1d605070c7a68905bdc24c6481a/LICENSE) Classification hint: Apache-2.0. A root license does not establish rights for every bundled asset, model, or dependency.

## Harness assessment

This entry was catalogued under **ai-agents-proxy**. Its category places it in the candidate set for models, decisions; those associations are navigational and have not been individually validated as implemented capabilities. See [models](../models.md) · [decisions](../decisions.md) for the source-reviewed alternatives and proposed integration boundaries.

**Disposition:** retain as a comparison candidate. Before adopting it, inspect the implementation entry point and its tests, verify the required protocol and deployment platform, and reproduce a task from the harness evaluation suite. Popularity, a README feature list, and the presence of a package manifest are insufficient evidence of quality or compatibility.

**Unresolved:** runtime behavior, security boundaries, performance, API/subscription eligibility, dependency health, maintenance status, and fit to the proposed harness were not independently established for this entry. No repository code was executed as part of this screening.

## Source update reviewed 2026-10-28

Reviewed commit: [`b57c5927f6d9e186df23697247a38a7b7fc7eb14`](https://github.com/NVIDIA-NeMo/Switchyard/commit/b57c5927f6d9e186df23697247a38a7b7fc7eb14). Scope: Full protocol infrastructure/client contracts and core fake-client driver read. Routing algorithms, HTTP client, streaming implementation and observability tests were not audited.

The [infrastructure contract](https://github.com/NVIDIA-NeMo/Switchyard/blob/b57c5927f6d9e186df23697247a38a7b7fc7eb14/crates/protocol/src/infra.rs) makes unavailable pool load None rather than idle, timestamps the oldest underlying observation with a monotonic clock and keeps host-local in-flight accounting separate from pool totals. Adapt this provenance-aware routing input; the serving host still owns coverage and freshness validation. The [client contract](https://github.com/NVIDIA-NeMo/Switchyard/blob/b57c5927f6d9e186df23697247a38a7b7fc7eb14/crates/protocol/src/client.rs) separates invalid requests, translation failures, temporary unavailability, timeouts and bounded response-state conflicts, allowing fallback reasons to remain explicit. Its raw upstream-body error representation requires redaction before Teamagent logging.

The [test driver](https://github.com/NVIDIA-NeMo/Switchyard/blob/b57c5927f6d9e186df23697247a38a7b7fc7eb14/crates/libsy/src/core/testing.rs) routes model calls through asynchronous fakes that can block on barriers and uses production-shaped error mapping. This is a good basis for deterministic concurrency/fallback fixtures. Its default decision stub returns empty answers and zero-like usage, so the helper alone does not validate decision accuracy or billing. No algorithm, transport, model or tests were executed, and route-state ownership guarantees were not traced into runtime code.

<!-- teamagent-analysis:start -->
Analysis metadata: source [switchyard](https://github.com/NVIDIA-NeMo/Switchyard); analyzed commit `b57c5927f6d9e186df23697247a38a7b7fc7eb14`; commit date 2026-10-27T10:03:30-07:00; review date 2026-10-28T09:45:33.667Z; depth screened. [Maintenance record](../analyses/repos/ai-agents-proxy--switchyard.md).
<!-- teamagent-analysis:end -->
