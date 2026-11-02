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

## 2026-10-28 follow-up source review

Reviewed the frozen update from `e5ea5fd9ccdf2913c0b21b24eb3d22b321d2e2a6` to `8acb7f65801fa7548b223244dee57465adfda8ec`. Earlier findings above remain historical evidence; this is a focused review of the cited boundary, not a whole-repository audit.

In [tools/approval.py](https://github.com/NousResearch/hermes-agent/blob/8acb7f65801fa7548b223244dee57465adfda8ec/tools/approval.py#L179-L242), The gateway approval store now exposes an observer registration separate from the existing settlement hook. Both are registered under a lock against the exact session/request pair; a missing pending request returns false. Withdrawal removes the pending entry, records a cancellation cause and wakes its waiter, while acknowledgement merely records receipt. Those are distinct lifecycle events and should remain distinct in channel/UI contracts.

**Harness implication and limits:** Use one authoritative approval state with multiple presentation observers. A channel card disappearing or being acknowledged must not authorize an effect. A late observer must handle the already-settled case explicitly. This inspection does not establish callback invocation, timeout races, Discord delivery or durability across process restart; those call sites were outside this scoped review. No upstream tests, agent execution or provider requests were run.

## 2026-11-01 scoped source review

Reviewed frozen commit `a4994d4ead8f9c915b485cec5689909b349a49df` against prior analyzed commit `8acb7f65801fa7548b223244dee57465adfda8ec`. Historical reviews above remain separate evidence.

The new [timeout summarizer](https://github.com/NousResearch/hermes-agent/blob/a4994d4ead8f9c915b485cec5689909b349a49df/agent/timeout_error_summary.py) follows explicit exception causes, guards cycles, distinguishes connection from read timeouts, and declines to assign a provider-response hint to pool/write timeouts. It intentionally ignores exception context, so an authentication error raised while handling a timeout keeps its own classification. The [fixtures](https://github.com/NousResearch/hermes-agent/blob/a4994d4ead8f9c915b485cec5689909b349a49df/tests/agent/test_timeout_error_summary.py) construct real SDK/httpx exception types without making requests and cover those distinctions, including the retained HTTP 401 summary.

The [client cache key](https://github.com/NousResearch/hermes-agent/blob/a4994d4ead8f9c915b485cec5689909b349a49df/agent/client_lifecycle.py) now includes the Bedrock timeout and passes it into construction; otherwise a changed policy could reuse a client with stale deadlines. A timeout without a transport cause is still classified as a read timeout by this helper, so Teamagent should preserve that as an inference, not proof of server receipt or permission to retry. Keep typed transport phase and provider acceptance uncertainty separate from human advice, and avoid making downstream classifiers depend on summary wording.

**Coverage:** Read the complete targeted client/session lifecycle and timeout summarizer/test deltas. Retry loops, SDK transport execution and the remaining oversized update were not inspected. Source inspection only; no upstream tests, source programs or live providers were executed. This is a scoped architecture review, not a whole-repository correctness or security certification.

## External-update review - 2026-11-01

Reviewed `c7da41dd522dc19cc08bbfcfa69d4b078224b45d` against `a4994d4ead8f9c915b485cec5689909b349a49df`.

The 87-path range adds collision-aware update preparation in the [scoped autostash module](https://github.com/NousResearch/hermes-agent/blob/c7da41dd522dc19cc08bbfcfa69d4b078224b45d/hermes_cli/update_cmd_stash.py). It compares untracked paths against the target tree's file/directory set, handles porcelain `-z` rename records, and separates colliding from unrelated untracked content. Literal exclusion pathspecs keep unrelated directories out of the stash operation; unreadable target-tree information falls back to preserving all untracked changes. Stash success requires a new observed stash object, not merely a successful-looking command.

The complete inspected [autostash fixtures](https://github.com/NousResearch/hermes-agent/blob/c7da41dd522dc19cc08bbfcfa69d4b078224b45d/tests/hermes_cli/test_update_scoped_autostash.py) author real temporary Git scenarios with tracked edits, an upstream-added collision and an unrelated untracked file. They check selective preservation and the no-update case. The source also has an explicit discard branch using hard reset and targeted clean after a negative prompt answer. That branch is not a suitable default or implicit authorization for Teamagent; preserving changes and retaining a recovery reference remain the local contract.

**Harness consequence:** Compute collisions against a frozen target identity, preserve tracked and colliding untracked work before synchronization, and retain unrelated local content. Revalidate state if the checkout changes between observation and action; the scoped helper does not by itself prove a transactional update. This review covers the complete new helper and fixture deltas, not all existing update/reset paths or the other changed files. No source checkout was changed and no upstream test was executed.

<!-- teamagent-analysis:start -->
Analysis metadata: source [hermes-agent](https://github.com/NousResearch/hermes-agent); analyzed commit `c7da41dd522dc19cc08bbfcfa69d4b078224b45d`; commit date 2026-11-01T11:07:22-08:00; review date 2026-11-01T23:12:06.798Z; depth source-reviewed. [Maintenance record](../analyses/repos/ai-agents--hermes-agent.md).
<!-- teamagent-analysis:end -->
