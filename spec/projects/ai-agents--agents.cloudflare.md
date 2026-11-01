# agents.cloudflare

Source: [agents.cloudflare](https://github.com/cloudflare/agents) · Category: [ai-agents](../categories/ai-agents.md)

Review depth: **focused source review**. Snapshot `2f3176b9fa03c6429c805b560c8dc14371c15f64` (2026-10-02T22:15:08+01:00). Reviewed 2026-10-04. This assessment covers the cited implementation/contract, not every subsystem or runtime behavior.

## Finding

Lifecycle-owned queues and alarms provide a cloud deployment pattern with explicit platform coupling.

## Source evidence inspected

- [packages/agents/src/queue/queue.ts, lines 1–90](https://github.com/cloudflare/agents/blob/2f3176b9fa03c6429c805b560c8dc14371c15f64/packages/agents/src/queue/queue.ts#L1-L90)

## Observed design and algorithms

Queue validates work and resolves callback names while delegating persistence, retries and physical alarms to Lifecycle. Callback fallback preserves the historical named-method API inside the host boundary. Queue payloads carry an owner path and schema version. The file defines bounded retry defaults rather than an unbounded retry loop.

## Harness decision

Consider the Agents/Lifecycle architecture for a Cloudflare-hosted coordinator or channel ingress. Preserve a platform-neutral task/event contract and put provider-specific alarms and storage behind adapters if local-first operation is required.

## Limits and tradeoffs

An API-compatible class is not automatically portable outside its Durable Object host. Retrying jobs does not prove exactly-once external effects. This excerpt does not establish durable local execution or arbitrary GPU/CLI availability in the cloud host.

## Validation before adoption

Test worker eviction, code-update resets, callback schema migration, repeated queue delivery and late alarms. Run CLI/GPU jobs on separately supervised workers with explicit placement constraints. No tests, live inference, installation, or production operation were performed for this review. License indicator: MIT; verify the exact files and dependencies before reuse.

Related directions: [agents](../agents.md) · [channels](../channels.md).

## 2026-10-28 scoped update review

Reviewed commit `e8fdf188dde1b15ddb229bbe6137224fff8178d0` (commit date `2026-10-27T17:48:28Z`). The original snapshot above remains historical evidence.

**Scope:** Agent-think model gateway and pool facade, selected workspace/turn cleanup implementation, complete agent.ts delta and mocked model fixtures; warm-pool allocator, lazy-workspace helper, durable execution engine and transport security were not audited.

The [agent-think lifecycle](https://github.com/cloudflare/agents/blob/e8fdf188dde1b15ddb229bbe6137224fff8178d0/agent-think/src/agent.ts#L178-L229) obtains a workspace under the session's stable object name and resolves the remote stub lazily. Disposal clears the cached promise and installs a fresh lazy wrapper for the next turn. [Recovery waits for prior cleanup](https://github.com/cloudflare/agents/blob/e8fdf188dde1b15ddb229bbe6137224fff8178d0/agent-think/src/agent.ts#L530-L623) before authenticating a continuation, which is a useful ownership boundary. Cleanup failures are logged but do not change the original done/error outcome, and no whole-cleanup timeout appears in this branch. The pool facade similarly swallows release errors. A done status must therefore retain separate resource-release evidence.

The [model factory](https://github.com/cloudflare/agents/blob/e8fdf188dde1b15ddb229bbe6137224fff8178d0/agent-think/src/model.ts) requires a configured gateway token, removes upstream credential headers and sets gateway authentication/project attribution. It configures an explicit provider fallback chain rather than treating every model as interchangeable. Its [mocked fixtures](https://github.com/cloudflare/agents/blob/e8fdf188dde1b15ddb229bbe6137224fff8178d0/agent-think/test/model.test.ts) assert request headers, Responses streaming shape, a fallback after a simulated payment error and rejection of missing tokens. They do not establish live account entitlement, fallback availability, redirect credential handling or gateway retention; `store: false` for one provider is not a complete data-retention policy.

The turn's active-tool list limits what is advertised to the model, while shell/file authority and installation-token scope remain in other adapters. Truncating tool/cleanup error strings for logging also does not redact secrets or private payloads. Teamagent should keep advertised capability, authenticated effect grants, generation-scoped workspace ownership, cleanup state and confidential diagnostics distinct. No workerd, durable object, container, provider or upstream test execution was performed.

**Verification limit:** source inspection only; no upstream tests or provider calls were executed. This scoped review does not certify every file in the repository.

## 2026-10-28 follow-up source review

Reviewed commit `743cfa5a193a98b766d396c0fde79124fba4c501` (commit date `2026-10-28T00:40:18Z`), compared with `e8fdf188dde1b15ddb229bbe6137224fff8178d0`. Earlier findings remain historical evidence.

**Scope:** All five changed package manifests and the six-path dependency-only inventory. The complete changed-path inventory contains 6 paths; the assessment below is limited to the cited branches.

This delta changes Hono ranges in the integration/example manifests from 4.13.5 to 4.13.11, smol-toml in worker-bundler from 1.7.2 to 1.9.0, Nx from 23.1.1 to 23.2.1, and the lockfile. See [packages/hono-agents/package.json](https://github.com/cloudflare/agents/blob/743cfa5a193a98b766d396c0fde79124fba4c501/packages/hono-agents/package.json#L6-L12), [packages/worker-bundler/package.json](https://github.com/cloudflare/agents/blob/743cfa5a193a98b766d396c0fde79124fba4c501/packages/worker-bundler/package.json#L36-L46) and [package.json](https://github.com/cloudflare/agents/blob/743cfa5a193a98b766d396c0fde79124fba4c501/package.json#L53-L64). No application source file appears in the changed-path inventory.

Retain the preceding runtime findings without claiming these dependency changes are behavior-free or security fixes. The resolved dependency implementation and lockfile transitive graph were not audited. For Teamagent, preserve source revision and lockfile identity independently from advertised package names; adopt no dependency merely because an upstream project updated it.

**Verification limit:** committed-source inspection only; no upstream code, tests or provider calls were executed. This review does not certify every changed file or establish a Teamagent integration.

## 2026-11-01 scoped source review

Reviewed commit `be1749221ab3efc8be4e976d8e7d8344d1446032` (commit date `2026-10-29T18:49:01Z`), compared with `743cfa5a193a98b766d396c0fde79124fba4c501`. Earlier observations remain historical evidence.

**Scope:** New skill-catalog listing/merge/fallback, activation, resource-resolution and fingerprint branches plus selected catalog fixtures; 214 changed paths inventoried. Registry execution, R2 and script runners not audited.

The [catalog](https://github.com/cloudflare/agents/blob/be1749221ab3efc8be4e976d8e7d8344d1446032/packages/agents/src/skills/catalog.ts) merges ordered sources with first-name precedence, reports failed/duplicate/invalid entries, optionally retains a failed source's prior listing by source-object identity, and permits resource reads only for listed skill-relative paths. It renders compact descriptions before activation. Its fingerprint hashes that prompt text using two FNV passes; it is not a cryptographic digest of skill bodies, resources or execution policy. Source listings run through unbounded Promise.all in this function. [Fixtures](https://github.com/cloudflare/agents/blob/be1749221ab3efc8be4e976d8e7d8344d1446032/packages/agents/src/tests/skills.test.ts) include catalog/duplicate cases, not executed here.

**Teamagent implication (inference):** Adopt staged discovery and explicit partial/stale diagnostics, while binding executable use to cryptographic payload versions, authority generations and resource limits. A failed refresh must not resurrect a revoked skill, and a stable prompt fingerprint must not authorize reuse after body/policy changes.

**Verification limit:** committed-source inspection only; no upstream code, tests or provider calls were executed. Review scope is the cited implementation or authored guidance, not whole-project correctness, licensing clearance or measured performance. Source passages were redacted for review; exact URL literals were not byte-validated.

<!-- teamagent-analysis:start -->
Analysis metadata: source [agents.cloudflare](https://github.com/cloudflare/agents); analyzed commit `be1749221ab3efc8be4e976d8e7d8344d1446032`; commit date 2026-10-29T18:49:01Z; review date 2026-11-01T11:33:30.893Z; depth source-reviewed. [Maintenance record](../analyses/repos/ai-agents--agents.cloudflare.md).
<!-- teamagent-analysis:end -->
