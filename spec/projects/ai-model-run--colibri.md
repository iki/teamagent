# Colibri: tiered local inference and constrained scoring

Source: [colibri](https://github.com/JustVugg/colibri) · Category: `ai-model-run`

Review depth: **source-reviewed**. Snapshot `ce370e87d7b623d7759b52ec2007d75fc5b0e87e`; assessed 2026-10-04. This is a focused static review of the listed files, not an audit of every code path or a reproduced benchmark. No repository code, model weights, paid endpoints, or installers were run.

## Observed architecture

Colibri describes storage, RAM, and VRAM as an inference hierarchy for sparse MoE models. The inspected C registry supports named expert-store backends and resolves overrides at static-link initialization. This is a concrete extension point for placement and loading strategies, not evidence that every advertised model fits comfortably or responds quickly on any consumer machine.

The serving-budget helper treats requested output tokens as a ceiling, clamps them to remaining context, and distinguishes read-only scoring from generation that needs an additional token position. That distinction matters for decision models which score a finite answer set without producing a long completion. The README describes a Brio mode returning answer probabilities and entropy; the scoring internals were not inspected in this focused review.

## Harness adoption

Treat Colibri as an optional local engine behind a protocol adapter. Discover actual architecture, quantization, context window, tool-call behavior, modality support, available memory, and measured throughput. Preserve the exact weight and engine identity in traces. The harness should schedule by observed time-to-first-token and completion latency, not parameter count alone.

Investigate finite-choice scoring for routing, retrieval sufficiency, and skill selection. Raw probabilities need calibration on held-out harness tasks; low entropy is not itself proof of correctness, especially out of distribution.

## Limitations and decision

Research pilot rather than default engine until representative task benchmarks are available. Expert streaming can trade fast-memory requirements for storage bandwidth and latency. The README itself disclaims a speed SLA; advertised model rosters and performance are not independently verified here. Test long contexts, simultaneous tasks, cancellation, exact semantics, and memory pressure. Prefer capability-based registration so other local servers can be added without rewriting the harness.

## Evidence read

- [Expert-store registration and backend lookup](https://github.com/JustVugg/colibri/blob/ce370e87d7b623d7759b52ec2007d75fc5b0e87e/c/expert_store_registry.c#L1-L80)
- [Context-aware serving budget](https://github.com/JustVugg/colibri/blob/ce370e87d7b623d7759b52ec2007d75fc5b0e87e/c/serve_budget.h#L1-L21)
- [Project claims and Brio scoring description](https://github.com/JustVugg/colibri/blob/ce370e87d7b623d7759b52ec2007d75fc5b0e87e/README.md#L15-L64)

## Related directions

[Models](../models.md) · [Decisions](../decisions.md) · [Agents](../agents.md)


## Change review - 2026-10-28

**Model-management MCP adds detached jobs without enforcing cancellation or admission bounds.** Reviewed commit `e0db083cdc9e563e0766cc6fc661ef23c32298e0` (commit date `2026-10-17T16:47:26+02:00`). Compared with `ce370e87d7b623d7759b52ec2007d75fc5b0e87e`; the complete Git comparison contains 512 changed paths.

The new stdio MCP wrapper exposes hardware discovery, model recommendation, install/start/stop, status and log tails. Its argument checker rejects unknown keys, invalid types, boolean-as-integer values, unsupported enums and numeric bounds. Install admission is protected by a process-local lock, then launches setup with --yes as a detached child and records a PID; the human-confirmation instruction is prose, not an enforced authorization gate in this adapter. Tool calls create one thread each without an admission cap, initialization state is recorded but not required before tools/call, and all notifications including cancellation are ignored. EOF drains workers for up to sixty seconds, while detached installation intentionally survives the server. Fixtures cover protocol envelopes, arguments, monotonic progress, mocked install construction and a stdio round trip; they do not demonstrate enforced cancellation or multi-process installation exclusion.

Evidence: [c/mcp_server.py:32-133](https://github.com/JustVugg/colibri/blob/e0db083cdc9e563e0766cc6fc661ef23c32298e0/c/mcp_server.py#L32-L133) · [c/mcp_server.py:177-250](https://github.com/JustVugg/colibri/blob/e0db083cdc9e563e0766cc6fc661ef23c32298e0/c/mcp_server.py#L177-L250) · [c/mcp_server.py:300-439](https://github.com/JustVugg/colibri/blob/e0db083cdc9e563e0766cc6fc661ef23c32298e0/c/mcp_server.py#L300-L439) · [c/tests/test_mcp_server.py:52-124](https://github.com/JustVugg/colibri/blob/e0db083cdc9e563e0766cc6fc661ef23c32298e0/c/tests/test_mcp_server.py#L52-L124) · [c/tests/test_mcp_server.py:139-196](https://github.com/JustVugg/colibri/blob/e0db083cdc9e563e0766cc6fc661ef23c32298e0/c/tests/test_mcp_server.py#L139-L196) · [c/tests/test_mcp_server.py:216-248](https://github.com/JustVugg/colibri/blob/e0db083cdc9e563e0766cc6fc661ef23c32298e0/c/tests/test_mcp_server.py#L216-L248).

**Harness consequence:** Expose this as a model-management worker only behind deterministic install grants, disk/network budgets and explicit long-running job ownership. Keep detached job state separate from request lifetime, reconcile completion by durable identity, and advertise cancellation as unsupported until enforced. Add bounded input, concurrency and redacted error/log contracts rather than adopting this handwritten protocol wrapper unchanged. Engine inference quality and hardware compatibility still require a separate benchmark.

**Scope and limits:** Scoped static review of the new model-management MCP wrapper and its fixtures within a 512-path comparison. No code, setup command, download, model server, GPU workload or upstream test was executed. Underlying setup_flow locking, process identity validation, inference kernels and the other changed converters are outside this review.

## Source update reviewed 2026-11-01

Reviewed commit [`0a5504a1dc64f86fcd0fe7db298b0448c730e7e6`](https://github.com/JustVugg/colibri/commit/0a5504a1dc64f86fcd0fe7db298b0448c730e7e6), compared with `e0db083cdc9e563e0766cc6fc661ef23c32298e0`.

The selected [download helper](https://github.com/JustVugg/colibri/blob/0a5504a1dc64f86fcd0fe7db298b0448c730e7e6/c/setup_download.py) now revalidates existing same-size files when a digest is supplied and verification is enabled. Split-drive safetensors are located separately from metadata; a mismatched supplied digest stops completion rather than silently replacing the external shard. The [fixtures](https://github.com/JustVugg/colibri/blob/0a5504a1dc64f86fcd0fe7db298b0448c730e7e6/c/tests/test_setup_download.py) cover changed same-length revisions, split-drive mismatches, zero-byte files and HTTP failures in Windows throughput probes.

The inspected fixtures also deliberately accept existing bytes when verification is disabled or the digest is absent. The completeness helper uses recorded status and sizes, so it is not an integrity attestation. Teamagent should preserve explicit unknown-integrity states and require trusted pinned hashes for provisioned model resources. This is a complete reading of the selected diff only; no model, network transfer, performance benchmark or upstream tests were run.

<!-- teamagent-analysis:start -->
Analysis metadata: source [colibri](https://github.com/JustVugg/colibri); analyzed commit `0a5504a1dc64f86fcd0fe7db298b0448c730e7e6`; commit date 2026-10-31T22:29:12+01:00; review date 2026-11-01T11:35:43.470Z; depth source-reviewed. [Maintenance record](../analyses/repos/ai-model-run--colibri.md).
<!-- teamagent-analysis:end -->
