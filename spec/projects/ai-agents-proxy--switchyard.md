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

## Follow-up change review — 2026-10-28

**Reasoning replay has an explicit provider-compatibility policy.** Reviewed commit `b0fa4fb201e5bb984ba7cc101bbe3252846a2ede` (commit date `2026-10-27T17:17:56-07:00`), compared with `b57c5927f6d9e186df23697247a38a7b7fc7eb14`. The complete no-rename Git path inventory contains 40 changed paths.

The new normalization helper defaults to preserving encrypted reasoning. It retains an opaque encrypted item, or a stored item ID when store is enabled, but clears its content array; an Anthropic thinking envelope is rejected from this replay form. Drop policy removes reasoning items while retaining other inputs. The decision is explicit rather than guessed from the base URL.

Evidence: [crates/libsy-llm-client/src/responses_reasoning.rs:1-62](https://github.com/NVIDIA-NeMo/Switchyard/blob/b0fa4fb201e5bb984ba7cc101bbe3252846a2ede/crates/libsy-llm-client/src/responses_reasoning.rs#L1-L62).

**Harness consequence:** Treat opaque reasoning as provider-scoped continuation state. Keep replay compatibility separate from ordinary conversation content and do not infer that an encrypted item can be reused across providers or decrypted locally.

**Scope and limits:** Reviewed the complete new reasoning-normalization helper; provider integration and request execution were not tested. This is a scoped static comparison, not a whole-project correctness or security audit. Upstream tests were read where cited, not run; no upstream code, service, model or provider operation was executed. Historical findings above remain evidence at their own revisions.

## Source update reviewed 2026-11-01

Reviewed commit [`bdd7647b5d55be46b19764136128646edb08692e`](https://github.com/NVIDIA-NeMo/Switchyard/commit/bdd7647b5d55be46b19764136128646edb08692e), compared with `b0fa4fb201e5bb984ba7cc101bbe3252846a2ede`.

The [decision classifier](https://github.com/NVIDIA-NeMo/Switchyard/blob/bdd7647b5d55be46b19764136128646edb08692e/crates/libsy/src/algorithms/llm_class/decision.rs) adds optional custom criteria requiring custom instructions and exactly two candidate keys. It selects the capable candidate only when that candidate's choice score exceeds the configured cutoff; the default relative-advantage question remains a different semantic event. It also supplies a default ten-turn recent context window. The [mocked integration change](https://github.com/NVIDIA-NeMo/Switchyard/blob/bdd7647b5d55be46b19764136128646edb08692e/crates/switchyard-runner/tests/openai_decisions.rs) provides a capable-first answer with score0.91 and confidence0.99 against cutoff0.92, explicitly separating model choice/confidence from application policy.

Teamagent should version the question, candidate mapping, context window and cutoff together, calibrate each policy against representative tasks, and keep authorization outside routing scores. Neither a choice score nor its confidence establishes a calibrated probability of task success. The selected 232-line comparison was read completely; other files in the 208-path update and live decision behavior were not audited or executed.

<!-- teamagent-analysis:start -->
Analysis metadata: source [switchyard](https://github.com/NVIDIA-NeMo/Switchyard); analyzed commit `bdd7647b5d55be46b19764136128646edb08692e`; commit date 2026-10-31T00:56:42Z; review date 2026-11-01T11:35:43.470Z; depth screened. [Maintenance record](../analyses/repos/ai-agents-proxy--switchyard.md).
<!-- teamagent-analysis:end -->
