# hermes-agent

Source: [hermes-agent](https://github.com/NousResearch/hermes-agent) · Category: [ai-agents](../categories/ai-agents.md)

Review depth: **focused source review**. Snapshot `3b9a963b8e5cdb804a422755bed9a60fcd778273` (2026-08-16T21:20:29-07:00). Reviewed 2026-10-04. This assessment covers the cited implementation/contract, not every subsystem or runtime behavior.

## Finding

Memory-provider orchestration and passive platform discovery offer practical boundaries for an extensible personal harness.

## Source evidence inspected

- [agent/memory_manager.py, lines 1–100](https://github.com/NousResearch/hermes-agent/blob/3b9a963b8e5cdb804a422755bed9a60fcd778273/agent/memory_manager.py#L1-L100)
- [gateway/platform_registry.py, lines 62–100](https://github.com/NousResearch/hermes-agent/blob/3b9a963b8e5cdb804a422755bed9a60fcd778273/gateway/platform_registry.py#L62-L100)

## Observed design and algorithms

MemoryManager centralizes prefetch, synchronization and tool-schema normalization. It accepts only one external memory provider to avoid conflicting backends and tool-schema growth. normalize_tool_schema unwraps already-wrapped function tools and rejects schemas without a resolvable name. PlatformEntry separates passive dependency checks from active installation, explicitly avoiding package installation from status views.

## Harness decision

Use a memory facade with background synchronization and strict time budgets. Preserve the separation between discovery, enabling and installation for agent, skill and channel plugins. If the harness exposes several memory backends, compose them behind one retrieval service rather than presenting every backend tool directly to the model.

## Limits and tradeoffs

A single-provider policy is a deliberate simplification, not evidence that one backend meets all graph, document and code needs. Runtime schema shape repair cannot validate semantic tool behavior. Plugin registration executes trusted host code unless moved behind a process boundary.

## Validation before adoption

Test a slow or unavailable memory provider, malformed schemas, shutdown with background work and status reads with missing dependencies. Ensure passive scans do not modify the environment. No tests, live inference, installation, or production operation were performed for this review. License indicator: MIT; verify the exact files and dependencies before reuse.

Related directions: [agents](../agents.md) · [memory](../memory.md) · [skills](../skills.md) · [channels](../channels.md).

## 2026-10-28 scoped update review

Reviewed commit `e5ea5fd9ccdf2913c0b21b24eb3d22b321d2e2a6` (commit date `2026-10-27T08:02:46-07:00`). The original snapshot above remains historical evidence.

**Scope:** Complete emergency-stop helper and dependency-manager runtime module, plus selected platform registry resolution/registration/construction branches and partial delta; scheduler admission call sites, filesystem/lease primitives, installer implementation and tests were not audited.

The [emergency-stop helper](https://github.com/NousResearch/hermes-agent/blob/e5ea5fd9ccdf2913c0b21b24eb3d22b321d2e2a6/agent/estop.py#L31-L138) explicitly pauses new work without killing work already in flight. It checks both profile and fleet-root sentinels and treats a corrupt body as an engaged marker. However, engage returns the intended path even if both writing and touching fail, and disengage can remove one visible marker while another removal fails. Teamagent should expose verified admission state separately from the requested pause/resume action and from cancellation/settlement of existing work. Scheduler call sites and actual filesystem error behavior were not exercised.

The [dependency runtime](https://github.com/NousResearch/hermes-agent/blob/e5ea5fd9ccdf2913c0b21b24eb3d22b321d2e2a6/pm/runtime.py#L113-L215) publishes a new generation under a preparation lock, retains the previous generation on staging failure and takes a parent-held lease before a child can start. Collection skips the selected generation, symlinks, active leases and pre-lease legacy generations. This gives useful upgrade/cleanup ordering, but the lock, lease and atomic-write primitives were not reviewed, and the input identity hashes lock/config bytes plus the interpreter path rather than all executable bytes. Runtime launch and dependency realization remain trusted host effects, not passive capability probes.

The [platform registry](https://github.com/NousResearch/hermes-agent/blob/e5ea5fd9ccdf2913c0b21b24eb3d22b321d2e2a6/gateway/platform_registry.py#L406-L526) separates unloaded membership from resolving a loader and constructing an adapter. Lookup can execute deferred code and wait without a timeout; entries are stored and returned by reference, with last-writer-wins registration. Construction runs a dependency installer after a failed probe and before configuration validation. Thus a configured/enabled platform is not by itself evidence that installation was separately authorized or configuration accepted. Teamagent should keep passive discovery, trusted loading, dependency mutation and connection authorization as distinct steps with immutable scoped descriptors.

**Verification limit:** source inspection only; no upstream tests or provider calls were executed. This scoped review does not certify every file in the repository.

<!-- teamagent-analysis:start -->
Analysis metadata: source [hermes-agent](https://github.com/NousResearch/hermes-agent); analyzed commit `e5ea5fd9ccdf2913c0b21b24eb3d22b321d2e2a6`; commit date 2026-10-27T08:02:46-07:00; review date 2026-10-28T09:27:32.685Z; depth source-reviewed. [Maintenance record](../analyses/repos/ai-agents--hermes-agent.md).
<!-- teamagent-analysis:end -->
