# agentenv

Source: [agentenv](https://github.com/kvcache-ai/AgentEnv) · Category: [ai-agents-sandbox](../categories/ai-agents-sandbox.md)

Review depth: **inventory / README screening only**. This is an individual coverage record, not a source-code correctness audit or adoption recommendation.

Snapshot: `5843159b1eaf235a45a08a5329fc6647c6e5bc31`; commit timestamp `2026-10-03T14:03:10+08:00`; 802 tracked paths.

## Scope and evidence

Upstream description excerpt (a project claim, automatically extracted from [README](https://github.com/kvcache-ai/AgentEnv/blob/5843159b1eaf235a45a08a5329fc6647c6e5bc31/README.md)):

> AgentENV (AENV) is a platform for running agent environments at scale, powering agentic RL training for **Kimi K3**. - **Scale across diverse environments**: AENV runs massive numbers of Firecracker environments across machines, loading diverse OCI-compatible images on demand via overlaybd and scaling to 1.5 million images in production. Local disk acts as a bounded cache, retaining hot data and evicting cold, so the aggregate image and snapshot footprint can exceed local disk capacity by several orders of magnitude while startup stays fast clu

Build/package evidence: [Cargo.toml](https://github.com/kvcache-ai/AgentEnv/blob/5843159b1eaf235a45a08a5329fc6647c6e5bc31/Cargo.toml); [adev/Cargo.toml](https://github.com/kvcache-ai/AgentEnv/blob/5843159b1eaf235a45a08a5329fc6647c6e5bc31/adev/Cargo.toml); [containerd-plain-snapshotter/go.mod](https://github.com/kvcache-ai/AgentEnv/blob/5843159b1eaf235a45a08a5329fc6647c6e5bc31/containerd-plain-snapshotter/go.mod); [crates/aenv/Cargo.toml](https://github.com/kvcache-ai/AgentEnv/blob/5843159b1eaf235a45a08a5329fc6647c6e5bc31/crates/aenv/Cargo.toml); [crates/benchmarks/Cargo.toml](https://github.com/kvcache-ai/AgentEnv/blob/5843159b1eaf235a45a08a5329fc6647c6e5bc31/crates/benchmarks/Cargo.toml)

License evidence: [LICENSE](https://github.com/kvcache-ai/AgentEnv/blob/5843159b1eaf235a45a08a5329fc6647c6e5bc31/LICENSE) Classification hint: MIT. A root license does not establish rights for every bundled asset, model, or dependency.

## Harness assessment

This entry was catalogued under **ai-agents-sandbox**. Its category places it in the candidate set for agents, channels; those associations are navigational and have not been individually validated as implemented capabilities. See [agents](../agents.md) · [channels](../channels.md) for the source-reviewed alternatives and proposed integration boundaries.

**Disposition:** retain as a comparison candidate. Before adopting it, inspect the implementation entry point and its tests, verify the required protocol and deployment platform, and reproduce a task from the harness evaluation suite. Popularity, a README feature list, and the presence of a package manifest are insufficient evidence of quality or compatibility.

**Unresolved:** runtime behavior, security boundaries, performance, API/subscription eligibility, dependency health, maintenance status, and fit to the proposed harness were not independently established for this entry. No repository code was executed as part of this screening.

## Source update reviewed 2026-10-28

Reviewed commit: [`abc027b29947366d33b3f65b7018cd096840612d`](https://github.com/kvcache-ai/AgentEnv/commit/abc027b29947366d33b3f65b7018cd096840612d). Scope: Full sandbox launch contract, extra-drive preparation/embedded tests and image fixture helper read. Firecracker, network enforcement, access-token implementation and orchestrator lifecycle were not audited.

The [launch contract](https://github.com/kvcache-ai/AgentEnv/blob/abc027b29947366d33b3f65b7018cd096840612d/src/sandbox/mod.rs) distinguishes runtime envd credentials, snapshot identity, per-launch network policy and opaque extension metadata. The credential type's redaction/non-serialization is documented here but its implementation was not inspected. [Drive preparation](https://github.com/kvcache-ai/AgentEnv/blob/abc027b29947366d33b3f65b7018cd096840612d/src/sandbox/extra_drive.rs) separates fresh requested size from resumed known source size, forbids shrink on resume and rolls back previously prepared devices/symlinks on a returned error. Its tests assert size mapping, not real device cleanup.

Rollback errors are logged, and cancellation during an await is not visibly covered by a scoped cleanup guard in this function; successful ownership transfer also requires the caller to release returned handles. Adapt phase-specific resource semantics with cancellation-safe ownership and explicit residual-artifact reporting. The [image fixture](https://github.com/kvcache-ai/AgentEnv/blob/abc027b29947366d33b3f65b7018cd096840612d/src/image/test_support.rs) retains layer digests/sizes in configuration, but a fixture does not prove production validation. No VM, device, filesystem cleanup or tests were executed.

## 2026-10-28 follow-up source review

Reviewed the frozen update from `abc027b29947366d33b3f65b7018cd096840612d` to `dcfb72f0a74430b5f01ae4c6928512a744d3c90a`. Earlier findings above remain historical evidence; this review is limited to the cited source, selected fixtures and delta.

In [services/compose/plan.go](https://github.com/kvcache-ai/AgentEnv/blob/dcfb72f0a74430b5f01ae4c6928512a744d3c90a/services/compose/plan.go#L105-L167), The new Compose planner validates the raw parsed tree before loading it, reuses that exact tree, disables include/extends/path/environment resolution, and supplies only the caller's environment map. It separately bounds source size, expansion/rendered plan size and service count before validating supported guest options. Its documented isolation boundary is the VM, not guest Docker.

**Harness implication and limits:** Validate dangerous source directives before a convenience loader can read host files or environment, and budget post-expansion values separately from source bytes. This review covers planner composition and selected validation branches, not YAML parser internals, image trust, VM enforcement or the orchestrator. No Compose project or sandbox was launched. No upstream code or live service was executed for this review.

## Source update reviewed 2026-11-01

Reviewed commit [`4a94ccc9988cd8f675b62a25d7629a98492454ee`](https://github.com/kvcache-ai/AgentEnv/commit/4a94ccc9988cd8f675b62a25d7629a98492454ee), compared with `dcfb72f0a74430b5f01ae4c6928512a744d3c90a`.

The [scheduler entry](https://github.com/kvcache-ai/AgentEnv/blob/4a94ccc9988cd8f675b62a25d7629a98492454ee/services/scheduler/cmd/main.go) adds leader gating, waits up to30 seconds for initial Kubernetes discovery before election and separates immediate stop after unexpected leadership loss from ordinary graceful drain. The full [callback](https://github.com/kvcache-ai/AgentEnv/blob/4a94ccc9988cd8f675b62a25d7629a98492454ee/services/scheduler/cmd/leadership_loss.go) and [tests](https://github.com/kvcache-ai/AgentEnv/blob/4a94ccc9988cd8f675b62a25d7629a98492454ee/services/scheduler/cmd/leadership_loss_test.go) avoid classifying an already-cancelled signal context as unexpected loss.

The implementation explicitly documents a residual: closing transports does not fence a handler that already passed the gate from committing a Redis write after leadership changes. TTL-bound/idempotent bindings and later reconciliation mitigate that window, but are not store-enforced single-writer ownership. Teamagent should require epoch/lease checks at authoritative writes when that guarantee matters, and distinguish graceful completion from lost authority. The selected files were read fully; the rest of the 56-path update, Kubernetes/Redis behavior and upstream tests were not executed or exhaustively audited.

<!-- teamagent-analysis:start -->
Analysis metadata: source [agentenv](https://github.com/kvcache-ai/AgentEnv); analyzed commit `4a94ccc9988cd8f675b62a25d7629a98492454ee`; commit date 2026-10-30T21:15:11+08:00; review date 2026-11-01T11:35:43.470Z; depth screened. [Maintenance record](../analyses/repos/ai-agents-sandbox--agentenv.md).
<!-- teamagent-analysis:end -->
