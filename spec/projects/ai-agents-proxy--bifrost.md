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


## Follow-up change review — 2026-10-28

**Tool-catalog notifications are fenced to the connection that observed them.** Reviewed commit `a7eba970798df6c1f90923109d83cd9fd578964d` (commit date `2026-10-28T15:36:10+05:30`), compared with `659f4ce1e7201e28d4db1fe1a21e4dfa92bcb975`. The complete no-rename Git path inventory contains 409 changed paths.

The new tools/list_changed listener records notifications arriving during discovery, activates only after connection binding, and triggers the serialized refresh path. Modern listening retries with a bounded backoff and checks manager cancellation. A connection is current only when both its pointer and generation match; the fixture rejects a removed/re-added client even when its generation number repeats. This prevents an obsolete connection from refreshing the replacement client's tool list.

Evidence: [core/mcp/toolslistchanged.go:81-177](https://github.com/maximhq/bifrost/blob/a7eba970798df6c1f90923109d83cd9fd578964d/core/mcp/toolslistchanged.go#L81-L177) · [core/mcp/toolslistchanged_test.go:176-208](https://github.com/maximhq/bifrost/blob/a7eba970798df6c1f90923109d83cd9fd578964d/core/mcp/toolslistchanged_test.go#L176-L208).

**Harness consequence:** Version dynamic tool catalogs by connection identity and generation, coalesce refresh work, and keep tool discovery separate from authorization to execute discovered tools.

**Scope and limits:** Reviewed the complete new listener and selected stale-connection fixtures; other gateway/provider changes were not exhaustively audited. This is a scoped static comparison, not a whole-project correctness or security audit. Upstream tests were read where cited, not run; no upstream code, service, model or provider operation was executed. Historical findings above remain evidence at their own revisions.

## Source update reviewed 2026-11-01

Reviewed commit [`496693af8465c3e5c5ff504deaf28c43563227d4`](https://github.com/maximhq/bifrost/commit/496693af8465c3e5c5ff504deaf28c43563227d4), compared with `a7eba970798df6c1f90923109d83cd9fd578964d`.

The complete selected [OAuth issuance comparison](https://github.com/maximhq/bifrost/blob/496693af8465c3e5c5ff504deaf28c43563227d4/transports/bifrost-http/handlers/mcpoauth2issuance.go) adds refresh-family revocation when an already-issued authorization code is replayed, rejects refresh for clients lacking the registered grant type, checks virtual-key expiry and refuses grants bound to an old MCP resource after an issuer change. Revocation errors return failure rather than silently continuing. The [fixtures](https://github.com/maximhq/bifrost/blob/496693af8465c3e5c5ff504deaf28c43563227d4/transports/bifrost-http/handlers/mcpoauth2issuance_test.go) cover those paths and parallel code exchange.

For Teamagent, cached grants need live scope/identity checks at refresh as well as at initial consent, with explicit reconciliation and revocation outcomes. Do not infer that rejecting a replay invalidates every previously issued access token; the inspected change specifically revokes refresh tokens. The selected 348-line delta was fully read within a 1,209-path update. Other OAuth handlers, store concurrency and full protocol correctness were not audited; no credentials, provider or upstream tests were used.

## External-update review - 2026-11-01

Reviewed `638169e9f11f04e790d0dd093fd64633c65c502a` against `496693af8465c3e5c5ff504deaf28c43563227d4`.

The 87-path range separates TLS to an HTTPS proxy from TLS to the requested destination. The [HTTP factory](https://github.com/maximhq/bifrost/blob/638169e9f11f04e790d0dd093fd64633c65c502a/core/network/http.go) now confines the global proxy `skip_tls_verify` option to the proxy hop, merges an explicitly configured proxy CA with root trust, and opens a separate CONNECT tunnel so the target does not inherit that global skip flag. Caller-supplied TLS configuration is cloned: this change alone is not a guarantee against an independently insecure caller configuration. A malformed CA is logged and ignored by the factory; no fail-closed configuration claim follows from this layer alone.

The [proxy-aware transport](https://github.com/maximhq/bifrost/blob/638169e9f11f04e790d0dd093fd64633c65c502a/core/network/ssrf.go) rebuilds a derived transport when the global configuration identity changes, allowing existing clients to observe updated CA settings without mutating their base transport. The complete inspected [TLS fixture delta](https://github.com/maximhq/bifrost/blob/638169e9f11f04e790d0dd093fd64633c65c502a/core/network/ssrf_test.go) distinguishes untrusted proxy, untrusted target, proxy-only skip and target/proxy CA combinations for clients created before and after updates.

**Harness consequence:** Scope certificate policy and credentials to each hop and retain destination validation independently of routing. Trusting an inspection CA changes who can observe traffic and must be explicit. The HTTPS helper keeps a target-address-to-proxy map with no bound in the inspected delta; resource ownership and concurrent per-request route isolation need separate verification. Reviewed HTTP, proxy-aware transport and selected TLS fixtures only; the rest of SSRF policy, providers, configuration save path and base-path UI were not exhaustively audited. No network requests, proxy, TLS tests or benchmark were run.

<!-- teamagent-analysis:start -->
Analysis metadata: source [bifrost](https://github.com/maximhq/bifrost); analyzed commit `638169e9f11f04e790d0dd093fd64633c65c502a`; commit date 2026-11-01T11:40:34-08:00; review date 2026-11-01T23:12:06.798Z; depth source-reviewed. [Maintenance record](../analyses/repos/ai-agents-proxy--bifrost.md).
<!-- teamagent-analysis:end -->
