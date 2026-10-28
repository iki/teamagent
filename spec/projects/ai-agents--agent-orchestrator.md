# agent-orchestrator

Source: [agent-orchestrator](https://github.com/ComposioHQ/agent-orchestrator) · Category: [ai-agents](../categories/ai-agents.md)

Review depth: **focused source review**. Snapshot `a2a8917c22e2246bf63b98e06a97c417f3b3fb76` (2026-10-03T20:20:43+05:30). Reviewed 2026-10-04. This assessment covers the cited implementation/contract, not every subsystem or runtime behavior.

## Finding

An explicit adapter registry scales installed-agent support without pretending every executable follows one protocol.

## Source evidence inspected

- [backend/internal/adapters/agent/registry/registry.go, lines 47–128](https://github.com/ComposioHQ/agent-orchestrator/blob/a2a8917c22e2246bf63b98e06a97c417f3b3fb76/backend/internal/adapters/agent/registry/registry.go#L47-L128)

## Observed design and algorithms

Constructors returns a stable list of concrete adapter factories, including Codex, Claude Code, Gemini, Copilot, Pi and many others. Build registers them by manifest ID and reports empty/duplicate registration failures through the registry. Harnessed retains only adapters implementing the Agent port and associates each with its domain harness and manifest. Adapter identity, capabilities and implementation remain separate objects.

## Harness decision

Adopt a manifest-plus-port contract and a central registry with deterministic registration. Add a generic protocol adapter for conforming unknown agents, then explicit adapters where semantics differ. The README describes isolated worker worktrees; treat the reviewed registry as the source evidence for extensibility, not proof of all workspace safety behavior.

## Limits and tradeoffs

Adding an agent still requires concrete implementation or an existing shared protocol. The literal goal of automatically operating any installed binary is impossible without a negotiated contract. Repository origin and current README branding differ; the recorded GitHub remote may redirect.

## Validation before adoption

Validate duplicate IDs, missing binaries, unsupported versions and environment-specific executable resolution. Exercise each adapter against contract tests without relying on terminal text heuristics for success. No tests, live inference, installation, or production operation were performed for this review. License indicator: Apache-2.0; verify the exact files and dependencies before reuse.

Related directions: [agents](../agents.md) · [channels](../channels.md) · [models](../models.md).

## 2026-10-28 scoped update review

Reviewed commit `f2ef7e90192c5afae069fc99b079726d9666b3dc` (commit date `2026-10-27T22:54:40+05:30`). The original snapshot above remains historical evidence.

**Scope:** Complete shipped-agent registry, cloud OIDC/principal verifier, local HTTP authentication middleware and small keychain-command seam; OIDC dependency internals, route authorization, session dispatch and live transport were not audited.

The [cloud verifier](https://github.com/ComposioHQ/agent-orchestrator/blob/f2ef7e90192c5afae069fc99b079726d9666b3dc/cloud/internal/auth/auth.go#L62-L195) delegates token validation to an OIDC verifier, explicitly checks the expected client_id and resolves user/organization metadata before producing a principal. Legacy external IDs support identity migration, so their provenance and mapping integrity are authorization-sensitive. The fallback verifier tries the previous environment only after an invalid-token error; provider/profile failures remain visible rather than silently selecting another authority. This is a useful failure taxonomy, but dependency verification, migration uniqueness and route-specific grants were outside scope.

The [local middleware](https://github.com/ComposioHQ/agent-orchestrator/blob/f2ef7e90192c5afae069fc99b079726d9666b3dc/backend/internal/httpd/auth.go#L145-L329) distinguishes preview-cookie authentication from bearer authentication in request context and exempts only an exact GET identity-probe route. Cookies are HttpOnly and scoped to preview-file paths, but the source deliberately omits Secure for a plaintext LAN design. Cookie paths are delivery constraints, not independent authorization boundaries; downstream handling must preserve the context distinction. A forwarded source address is trusted only for a loopback peer, which assumes local forwarders are trusted. An opaque host ID can detect an accidental wrong endpoint but is not cryptographic server authentication against an active network adversary.

Retired password hashes avoid locking out newly paired clients when stale clients retry, but the retired list is not bounded here; per-source failure entries expire yet have no admission cap. The [registry](https://github.com/ComposioHQ/agent-orchestrator/blob/f2ef7e90192c5afae069fc99b079726d9666b3dc/backend/internal/adapters/agent/registry/registry.go) centralizes constructors and manifest identity, which does not establish installed binaries, valid accounts or effective sandboxing. Teamagent should keep authenticated identity, accepted transport, capability availability and action grants separate, with bounded auth state and real transport/rotation tests. No upstream tests or authentication/provider calls were executed.

**Verification limit:** source inspection only; no upstream tests or provider calls were executed. This scoped review does not certify every file in the repository.

<!-- teamagent-analysis:start -->
Analysis metadata: source [agent-orchestrator](https://github.com/ComposioHQ/agent-orchestrator); analyzed commit `f2ef7e90192c5afae069fc99b079726d9666b3dc`; commit date 2026-10-27T22:54:40+05:30; review date 2026-10-28T08:47:42.123Z; depth source-reviewed. [Maintenance record](../analyses/repos/ai-agents--agent-orchestrator.md).
<!-- teamagent-analysis:end -->
