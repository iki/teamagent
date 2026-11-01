# Emdash

Source: [Emdash](https://github.com/generalaction/emdash) · Category: [ai-agents](../../categories/ai-agents.md)

Review depth: **focused source review**. Snapshot [`85dfa910ac92e69b09ed5df70ea60ee625a83f07`](https://github.com/generalaction/emdash/commit/85dfa910ac92e69b09ed5df70ea60ee625a83f07). Reviewed 2026-10-27. This review covers provider registration, authentication indicators, workspace ownership and automation session launch. It does not establish whole-product correctness, measured performance, or live-provider compatibility.

## Finding

A useful reference for a desktop application that combines installed coding agents with a host-owned workspace and conversation layer. Transfer its explicit provider and workspace contracts, while keeping authentication evidence, execution authority and independently verified task completion separate.

## Source evidence and observed design

The [provider registry](https://github.com/generalaction/emdash/blob/85dfa910ac92e69b09ed5df70ea60ee625a83f07/packages/plugins/src/agents/registry.ts#L1-L85) assembles concrete agent plugins behind a common interface. This gives the host a discoverable catalog without requiring every provider to expose identical protocols. The inspected [Codex plugin](https://github.com/generalaction/emdash/blob/85dfa910ac92e69b09ed5df70ea60ee625a83f07/packages/plugins/src/agents/impl/codex/index.ts#L21-L50) declares ACP, usage and auto-approval support separately. Registry membership is a capability claim to verify, not evidence that a binary, account or model is ready.

The [automation session adapter](https://github.com/generalaction/emdash/blob/85dfa910ac92e69b09ed5df70ea60ee625a83f07/packages/core/src/runtimes/automations/node/ports/session-start.ts#L33-L113) creates the conversation index record before registering and activating its workspace, then branches into ACP or TUI session creation. Its [stored conversation contract](https://github.com/generalaction/emdash/blob/85dfa910ac92e69b09ed5df70ea60ee625a83f07/packages/core/src/runtimes/automations/node/ports/session-start.ts#L154-L199) explicitly distinguishes provider-minted ACP session identifiers from host-chosen TUI identifiers. Adopt that separation: a durable Teamagent task ID must not be mistaken for a provider continuation token.

The [worktree path guard](https://github.com/generalaction/emdash/blob/85dfa910ac92e69b09ed5df70ea60ee625a83f07/packages/core/src/runtimes/workspace-registry/node/worktree-path-safety.ts#L25-L81) resolves canonical paths, rejects repository-root mutation and overlapping new worktrees, and compares Git common directories before accepting an existing target. Resolving the nearest existing parent also addresses missing targets below symlinked ancestors. The [source fixtures](https://github.com/generalaction/emdash/blob/85dfa910ac92e69b09ed5df70ea60ee625a83f07/packages/core/src/runtimes/workspace-registry/node/worktree-path-safety.test.ts#L5-L125) cover nested targets, symlink ancestry, foreign ownership and existing plain directories. These checks are a strong lifecycle pattern; a Git worktree alone does not isolate processes, networking, credentials or shared repository metadata.

## Boundaries that must not be generalized

The [authentication helper](https://github.com/generalaction/emdash/blob/85dfa910ac92e69b09ed5df70ea60ee625a83f07/packages/plugins/src/agents/helpers/auth.ts#L6-L43) treats an environment-variable value as an authenticated indicator. The [Codex adapter](https://github.com/generalaction/emdash/blob/85dfa910ac92e69b09ed5df70ea60ee625a83f07/packages/plugins/src/agents/impl/codex/index.ts#L165-L172) can return that state without a provider request. Teamagent should instead report credential presence separately from authenticated account identity, model entitlement and data policy. This source is not evidence that an API key implies a usable subscription or training exclusion.

The [Codex prompt builder](https://github.com/generalaction/emdash/blob/85dfa910ac92e69b09ed5df70ea60ee625a83f07/packages/plugins/src/agents/impl/codex/index.ts#L175-L190) maps its auto-approval mode to disabled approvals, full access and bypassed hook trust. The finding concerns the explicit option's implementation, not a claim that every session enables it. Do not copy it as a safe unattended default. Teamagent's deterministic grants and negotiated interception capabilities must remain authoritative; native agents may enforce different boundaries.

Workspace activation in the cited session adapter deliberately allows prepare-script failure to remain a notice. Decide explicitly whether a Teamagent task requires successful preparation before any agent starts; otherwise an unavailable environment can be mistaken for a ready workspace.

The [automation executor](https://github.com/generalaction/emdash/blob/85dfa910ac92e69b09ed5df70ea60ee625a83f07/packages/core/src/runtimes/automations/node/runs/executor.ts#L21-L61) marks a run done after successful session startup. The [happy-path fixture](https://github.com/generalaction/emdash/blob/85dfa910ac92e69b09ed5df70ea60ee625a83f07/packages/core/src/runtimes/automations/node/runs/executor.test.ts#L114-L135) confirms that launch lifecycle. It does not wait for agent work or independently verify the requested result. Teamagent should name and store accepted, launched, completed and verified outcomes distinctly.

## Harness decision and validation

Shortlist the provider descriptor, host-owned conversation index and canonical worktree ownership patterns. Retain the adopted Teamagent runtime and desktop stack; this review does not justify adopting Emdash's entire Electron/Node monorepo or changing package management.

Before reuse, exercise provider discovery, cancellation, resume, duplicate launch reconciliation, permission refusal, preparation failure, foreign-worktree rejection and process restart. Measure actual startup, resource use, remote disconnection and concurrent task correctness. The source tests were inspected but not executed, and no agent installation, authenticated provider request, inference or desktop benchmark ran for this review. The repository contains an [Apache-2.0 license](https://github.com/generalaction/emdash/blob/85dfa910ac92e69b09ed5df70ea60ee625a83f07/LICENSE.md); dependency and asset licensing still require separate review.

Related directions: [agents](../../agents.md) · [models](../../models.md) · [channels](../../channels.md) · [decisions](../../decisions.md) · [evolution](../../evolution.md) · [security](../../security.md).

## 2026-11-01 scoped source review

Reviewed commit `ab766e8fbb436584dcf0f299740e79d559b8ed31` (commit date `2026-10-30T12:22:18+01:00`), compared with `85dfa910ac92e69b09ed5df70ea60ee625a83f07`. Earlier observations remain historical evidence.

**Scope:** Complete file-content registry diff; 16 changed paths inventoried. Git executor cancellation and runtime fixtures not audited.

The [file-content registry](https://github.com/generalaction/emdash/blob/ab766e8fbb436584dcf0f299740e79d559b8ed31/packages/core/src/runtimes/git/node/checkout/file-content-registry.ts) passes abort signals to reads, tracks in-flight read ownership, and disposes queued/running entries when their last lease is released. Eviction checks entry identity so an old completion cannot remove a replacement entry. Errors from already disposed scopes are suppressed. Disposing a scope requests cancellation; this slice does not prove an underlying process has stopped.

**Teamagent implication (inference):** Use leases and generation identities for shared repository reads, fencing late completions against replacement work. Retain scratch and process ownership until descendant shutdown is actually confirmed, even when the requesting UI no longer needs the result.

**Verification limit:** committed-source inspection only; no upstream code, tests or provider calls were executed. Review scope is the cited implementation or authored guidance, not whole-project correctness, licensing clearance or measured performance. Source passages were redacted for review; exact URL literals were not byte-validated.

<!-- teamagent-analysis:start -->
Analysis metadata: source [emdash](https://github.com/generalaction/emdash); analyzed commit `ab766e8fbb436584dcf0f299740e79d559b8ed31`; commit date 2026-10-30T12:22:18+01:00; review date 2026-11-01T11:33:30.893Z; depth reviewed. [Maintenance record](../repos/ai-agents--emdash.md).
<!-- teamagent-analysis:end -->
