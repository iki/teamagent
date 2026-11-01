# nanobot

Source: [nanobot](https://github.com/HKUDS/nanobot) · Category: [ai-agents](../categories/ai-agents.md)

Review depth: **focused source review**. Snapshot `96ad7b4dbf617b11e0991e92c7d295dbd828a956` (2026-10-03T21:08:47+08:00). Reviewed 2026-10-04. This assessment covers the cited implementation/contract, not every subsystem or runtime behavior.

## Finding

A typed channel-management contract distinguishes configuration, activation and runtime instances.

## Source evidence inspected

- [nanobot/channels/contracts.py, lines 15–105](https://github.com/HKUDS/nanobot/blob/96ad7b4dbf617b11e0991e92c7d295dbd828a956/nanobot/channels/contracts.py#L15-L105)

## Observed design and algorithms

ChannelValidationContext carries host policy for local service access. Setup callbacks and instance factories have explicit types. ChannelActivation normalizes configuration from models or persisted mappings before importing runtimes, including independently enabled instances. Missing enablement is represented separately rather than immediately assuming that a discovered configuration should run.

## Harness decision

Reuse the normalized activation and instance contract for Telegram, Slack, Discord and future channel plugins. The control plane should present discovered, configured, authenticated, enabled and connected as separate states. Defer heavy connector imports until enabled.

## Limits and tradeoffs

These contracts do not establish durable delivery, channel authentication correctness or end-to-end isolation. A plugin can conform to a schema while implementing unsafe behavior. Management field types also do not automatically guarantee secure secret storage.

## Validation before adoption

Test missing/invalid enablement values, per-instance configuration, secret redaction, connector reconnect and cross-workspace conversation routing. Verify disabled channels never import or start active runtimes. No tests, live inference, installation, or production operation were performed for this review. License indicator: MIT; verify the exact files and dependencies before reuse.

Related directions: [agents](../agents.md) · [channels](../channels.md).

## 2026-10-28 scoped update review

Reviewed commit `b07b3eac244ff7faa7eeb2d4777fe54dbae1b6d2` (commit date `2026-10-27T21:05:32+08:00`). The original snapshot above remains historical evidence.

**Scope:** Complete lifecycle-hook primitives and SDK runtime-argument helper, plus direct-run session-policy/cleanup branch; shared runner hook call sites, session-store internals, tool implementations and channel authentication were not audited.

The [composite hook](https://github.com/HKUDS/nanobot/blob/b07b3eac244ff7faa7eeb2d4777fe54dbae1b6d2/nanobot/agent/hook.py#L167-L291) calls hooks in order and normally logs ordinary exceptions while continuing. A hook can request rethrowing, while final-content transformation is an uncaught pipeline. The same isolation helper also dispatches before-tool hooks; therefore a default observational hook must not be mistaken for a mandatory authorization gate. Teamagent should distinguish best-effort telemetry from required policy/evidence hooks, enforce bounded hook execution and fail closed on required-policy failures. Full runner behavior after a rethrown exception was outside scope.

The [SDK argument helper](https://github.com/HKUDS/nanobot/blob/b07b3eac244ff7faa7eeb2d4777fe54dbae1b6d2/nanobot/sdk/runtime.py) rejects competing model selectors and makes temporary runs explicitly nonpersistent with content logging disabled, while still enabling extra hooks. The [direct-run branch](https://github.com/HKUDS/nanobot/blob/b07b3eac244ff7faa7eeb2d4777fe54dbae1b6d2/nanobot/agent/loop.py#L2667-L2752) serializes with bus turns, rejects the reserved system channel, combines persistence/logging restrictions with logical AND and unions disabled tools. Cleanup of a temporary parent uses an expected generation, a useful guard against deleting a replacement session. Store isolation and generation enforcement still depend on uninspected storage code.

The [capture hook](https://github.com/HKUDS/nanobot/blob/b07b3eac244ff7faa7eeb2d4777fe54dbae1b6d2/nanobot/agent/hook.py#L294-L330) copies message/event lists shallowly and retains stop/error/usage metadata. That is not an immutable nested-data receipt, a durable audit log or proof of completed external effects. Temporary conversation storage also does not establish absence of provider retention, tool side effects or extra-hook leakage. Preserve these distinctions in Teamagent's session policy and status model; no upstream tests, tools or providers were executed.

**Verification limit:** source inspection only; no upstream tests or provider calls were executed. This scoped review does not certify every file in the repository.

## 2026-10-28 follow-up source review

Reviewed the frozen update from `b07b3eac244ff7faa7eeb2d4777fe54dbae1b6d2` to `8f7a7d17590de7ab187650381894dba2b9e060ab`. Earlier findings above remain historical evidence; this review is limited to the cited source and delta.

In [nanobot/process_runtime.py](https://github.com/HKUDS/nanobot/blob/8f7a7d17590de7ab187650381894dba2b9e060ab/nanobot/process_runtime.py#L720-L782), Windows process inspection moves FILETIME/ctypes pointer definitions to module scope and caches only the kernel32 bindings. Each identity request still opens the PID, reads its creation time and exit status, rejects failed/nonrunning queries, and closes the native handle in finally.

**Harness implication and limits:** Cache stable native bindings rather than live process identity. Pair a PID with fresh birth identity before lifecycle operations to reduce PID-reuse mistakes, and treat unavailable identity as unknown. The shown function does not itself authorize termination or eliminate the race between inspection and a later action. No Windows native process test or memory benchmark was run. This review is static and does not certify other changed subsystems.

## 2026-11-01 scoped source review

Reviewed frozen commit `8b37976d36c2812c62b464321e729a88872b60f9` against prior analyzed commit `8f7a7d17590de7ab187650381894dba2b9e060ab`. Historical reviews above remain separate evidence.

The selected [mid-turn goal fixture](https://github.com/HKUDS/nanobot/blob/8b37976d36c2812c62b464321e729a88872b60f9/tests/agent/test_mid_turn_goal.py) replaces its inline stop/wait cleanup with the existing shared `stop_loop` helper while retaining the five-second deadline. The complete [helper](https://github.com/HKUDS/nanobot/blob/8b37976d36c2812c62b464321e729a88872b60f9/tests/agent/session_helpers.py) calls stop, awaits the owned worker with `asyncio.wait_for`, and on timeout prints the pending session close stack plus native Python tracebacks before rethrowing. Its own delta only removes a module docstring; this is test cleanup consolidation, not a newly implemented production shutdown guarantee.

Preserve the distinction between a requested stop, a completed worker and proof that all descendants released resources. Timeout diagnostics make a stuck close inspectable, but raw stack diagnostics need a bounded, redacted host sink before reuse. The helper reaches private session state and does not independently verify native descendant termination. Existing mid-turn permission/history assertions remain fixture intent; no agent, goal command or process shutdown was executed in this review.

**Coverage:** Read the selected four-path expansion (principally documentation/fixture changes), complete 29-line mid-turn fixture delta and complete current 68-line cleanup helper. Production loop/state/native-process implementation was not reassessed. Source inspection only; no upstream tests, source programs or live providers were executed. This is a scoped architecture review, not a whole-repository correctness or security certification.

<!-- teamagent-analysis:start -->
Analysis metadata: source [nanobot](https://github.com/HKUDS/nanobot); analyzed commit `8b37976d36c2812c62b464321e729a88872b60f9`; commit date 2026-10-31T11:55:13+08:00; review date 2026-11-01T11:33:30.893Z; depth source-reviewed. [Maintenance record](../analyses/repos/ai-agents--nanobot.md).
<!-- teamagent-analysis:end -->
