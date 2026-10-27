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
