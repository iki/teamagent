# Bifrost: API gateway and provider execution fabric

Source: [bifrost](https://github.com/maximhq/bifrost) · Category: `ai-agents-proxy`

Review depth: **source-reviewed**. Snapshot `e8b579fd1a710753cfa97611b5cff6c3411b0825`; assessed 2026-10-04. This is a focused static review of the listed files, not an audit of every code path or a reproduced benchmark. No repository code, model weights, paid endpoints, or installers were run.

## Observed architecture

The core separates provider queues, worker lifecycle, LLM and MCP plugins, tracing, request-object pools, a model capability/pricing catalog, and credential resolution. Provider updates have explicit lifecycle synchronization. The queue design deliberately uses a separate shutdown channel rather than closing a channel with concurrent producers. Session affinity and a key-filter hook are visible state, making it possible to distinguish a stable conversation route from per-request load balancing.

The Chat Completion streaming entry point normalizes a request and delegates to a common stream handler. That is useful evidence of a shared execution fabric; it does not establish lossless equivalence between every vendor's reasoning, tool-call, audio, and Responses semantics.

## Harness adoption

Shortlist Bifrost as the independently deployed gateway when a Go service, bounded queues, per-provider backpressure, and shared API governance are valuable. Keep durable tasks, approvals, worktrees, memory, and skill selection in the harness. The gateway should receive a capability-constrained model route and a credential reference, then report the actual provider/model, attempt count, usage, and stream outcome.

Use queue occupancy and observed latency as inputs to the decision service. Preserve provider session affinity where caching or native session state benefits from it. A failed stream that already emitted a tool call must not transparently restart a side effect.

## Limitations and decision

Adopt behind an adapter after protocol conformance and cancellation tests. Upstream throughput and overhead claims were not reproduced; compare realistic mixed tool-call workloads on the target hardware. Shared credential resolution is a sensitive boundary, and plugin extensions remain privileged code. A gateway neither grants subscription entitlements nor provides a filesystem sandbox. See the alternative breadth-first gateway in [LiteLLM](ai-agents-proxy--litellm.md).

## Evidence read

- [Core provider lifecycle and request state](https://github.com/maximhq/bifrost/blob/e8b579fd1a710753cfa97611b5cff6c3411b0825/core/bifrost.go#L107-L172)
- [Request API and streaming delegation](https://github.com/maximhq/bifrost/blob/e8b579fd1a710753cfa97611b5cff6c3411b0825/core/bifrost.go#L930-L962)

## Related directions

[Models](../models.md) · [Agents](../agents.md) · [Decisions](../decisions.md) · [Security](../security.md)

## Source update reviewed 2026-10-28

Reviewed commit: [`659f4ce1e7201e28d4db1fe1a21e4dfa92bcb975`](https://github.com/maximhq/bifrost/commit/659f4ce1e7201e28d4db1fe1a21e4dfa92bcb975). Scope: Focused current-source review of agent network-policy transport, passthrough route policy and injected-tool authorization facade; underlying network package, callers and the broader 2,249-path delta not audited.

The [agent transport](https://github.com/maximhq/bifrost/blob/659f4ce1e7201e28d4db1fe1a21e4dfa92bcb975/core/agent/networkpolicy.go) snapshots a validated private-target allowlist, fingerprints the sorted policy, separates direct/proxy pools, replaces the proxy pool when configuration changes, and bounds extra credential origins to 32 canonical HTTP(S) origins without path/query/userinfo. Public-only context deliberately cannot inherit private-network permissions. Adapt immutable policy identity per pool and explicit credential destination binding, but verify call sites actually recheck policyCurrent and how in-flight operations behave after revocation; this file closes idle connections without interrupting existing calls. The [passthrough policy](https://github.com/maximhq/bifrost/blob/659f4ce1e7201e28d4db1fe1a21e4dfa92bcb975/core/passthroughpolicy.go) allows nil policies and host-backed upstream routes, relying on a separate fixed-route/credential contract. Those are explicit trust boundaries to audit, not proof of complete mediation. The injected authorization wrapper delegates to an unread internal package. No gateway, DNS-rebinding, proxy, tenant-isolation or revocation test was executed; broad security correctness is unestablished.


<!-- teamagent-analysis:start -->
Analysis metadata: source [bifrost](https://github.com/maximhq/bifrost); analyzed commit `659f4ce1e7201e28d4db1fe1a21e4dfa92bcb975`; commit date 2026-10-27T23:17:14+05:30; review date 2026-10-28T08:26:04.502Z; depth source-reviewed. [Maintenance record](../analyses/repos/ai-agents-proxy--bifrost.md).
<!-- teamagent-analysis:end -->
