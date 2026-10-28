# paseo

Source: [paseo](https://github.com/getpaseo/paseo) · Category: [ai-agents](../categories/ai-agents.md)

Review depth: **focused source review**. Snapshot `749fe3e5ae52b6e1e4eaeadce3182e901caa96d9` (2026-10-03T22:04:28+02:00). Reviewed 2026-10-04. This assessment covers the cited implementation/contract, not every subsystem or runtime behavior.

## Finding

Strong reference for a daemon that adapts heterogeneous installed agents and serves several client surfaces.

## Source evidence inspected

- [packages/server/src/server/agent/provider-registry.ts, lines 36–180](https://github.com/getpaseo/paseo/blob/749fe3e5ae52b6e1e4eaeadce3182e901caa96d9/packages/server/src/server/agent/provider-registry.ts#L36-L180)

## Observed design and algorithms

The registry constructs separate clients for Codex app-server, Claude, ACP providers, OpenCode and Pi. Provider definitions include catalog fetching, launch configuration, unattended status and tool-policy handling. Exact MCP preapproval is an explicit provider capability; unsupported providers default to false instead of inheriting optimistic support. Catalog discovery is designed to use at most one runtime process per call.

## Harness decision

Shortlist the provider boundary and daemon/client architecture. Model the installed agent as a versioned external runtime with its own process, session and policy capabilities. Reuse only the required adapter/interface pattern if a complete application fork would impose excess coupling.

## Limits and tradeoffs

A generic ACP connection does not imply exact per-tool grants, identical permission behavior or equivalent session resume. The registry alone cannot establish encryption, UI performance, remote-worker isolation or provider-specific correctness. Those require separate checks.

## Validation before adoption

Run a conformance suite for each installed runtime: discovery, catalog, start, cancel, resume, approval round-trip and restart. Verify unsupported permission features fail closed and that a device disconnect does not kill the worker. No tests, live inference, installation, or production operation were performed for this review. License indicator: Apache-2.0; verify the exact files and dependencies before reuse.

Related directions: [agents](../agents.md) · [models](../models.md) · [channels](../channels.md).

## Refresh: 2026-10-24

Inspected revision [`a54cc6dd11f73864fc78100a9587010274ba1e10`](https://github.com/getpaseo/paseo/commit/a54cc6dd11f73864fc78100a9587010274ba1e10). Scope is provider-registry and refresh-deadline code, not the full desktop/mobile application.

The [registry contract](https://github.com/getpaseo/paseo/blob/a54cc6dd11f73864fc78100a9587010274ba1e10/packages/server/src/server/agent/provider-registry.ts#L68-L169) distinguishes resolved configuration, provider inheritance, client creation, catalog discovery and exact MCP preapproval. The explicit supported-provider table and unsupported default remain important: a registered or discovered agent does not automatically gain equivalent tool-policy enforcement. Derived profiles and plugins need conformance checks tied to their effective configuration.

[Refresh tracking](https://github.com/getpaseo/paseo/blob/a54cc6dd11f73864fc78100a9587010274ba1e10/packages/server/src/server/agent/provider-refresh-deadline.ts#L17-L80) uses an AbortController, named pending-activity counts, and timeout errors that identify unfinished phases. Transfer the diagnostics and bounded discovery budget. Do not infer process termination from an abort signal: `runProviderRefreshWithDeadline` awaits the operation, so effective cancellation depends on downstream cooperation or a separate process boundary. A caller racing an abort is also different from cleaning up the abandoned work.

For web/desktop/mobile channels, retain the daemon-owned task and provider state while clients reconnect; this registry inspection does not measure startup speed, native UI performance, relay security or cancellation enforcement. Those remain acceptance tests before adoption. No provider installation, live authentication or inference was performed for this refresh.

## Speech review: 2026-10-25

The newly cited source files match their exact upstream Git blobs; see [source validation](../data/media-source-validation.json).

Focused snapshot: [`a54cc6dd11f73864fc78100a9587010274ba1e10`](https://github.com/getpaseo/paseo/commit/a54cc6dd11f73864fc78100a9587010274ba1e10), commit date 2026-10-24T07:36:10+02:00. Scope: speech turn control, VAD and interruption; the provider-registry review above remains independently scoped.

The [turn controller](https://github.com/getpaseo/paseo/blob/a54cc6dd11f73864fc78100a9587010274ba1e10/packages/server/src/server/session/voice/voice-turn-controller.ts#L73-L217) owns separate detection and transcription sessions, resamplers, segment ordering and finalization state. It orders final text by committed segment IDs and prevents repeated final callbacks. A fixed finalization timeout prevents indefinite waiting, but the inspected final transcript callback has no separate completeness field for a timeout with missing segments. Teamagent should preserve that distinction in its typed result.

The local [Silero session](https://github.com/getpaseo/paseo/blob/a54cc6dd11f73864fc78100a9587010274ba1e10/packages/server/src/server/speech/providers/local/sherpa/silero-vad-session.ts#L8-L153) uses explicit sample rate/window settings, confirmation and silence thresholds, and an audio-sample-derived clock. This separates detecting speech from deciding the conversational endpoint. The defaults are implementation choices, not language-independent quality optima; code dictation, hesitations and low-volume speech need their own evaluation. The English-like filler suppression in the controller must likewise not be generalized without language tests.

[Speech-start handling](https://github.com/getpaseo/paseo/blob/a54cc6dd11f73864fc78100a9587010274ba1e10/packages/server/src/server/session/voice/voice-session.ts#L583-L600) interrupts on confirmed speech without waiting for text. [Abort and playback handling](https://github.com/getpaseo/paseo/blob/a54cc6dd11f73864fc78100a9587010274ba1e10/packages/server/src/server/session/voice/voice-session.ts#L1094-L1188) cancels pending playback, asks the host to interrupt the agent, propagates refusal and accepts playback confirmation. Transfer the separation between audio response and agent-run control; stopping sound must not be presented as reversing tool side effects.

Adopt the explicit state ownership and use it to design fixtures for duplicate final events, partial timeout, late audio, refused interruption and reconnect. Extend playback acknowledgments with actual audible position if conversation history is to reflect what was heard. Bound input queues and worker resources independently. Browser echo cancellation, native permissions and real provider timing remain acceptance work, not consequences of a clean TypeScript API. No local speech model, microphone, playback session or remote provider was run in this review.

Related: [channel input](../channel-input.md) · [media processing](../media-processing.md) · [channels](../channels.md).

## Refresh: 2026-10-27 — safe idle runtime collection

Inspected revision [`de50243885ff47e0dc9c26233327fe066befa684`](https://github.com/getpaseo/paseo/commit/de50243885ff47e0dc9c26233327fe066befa684), committed 2026-10-27T15:59:03Z, against the prior reviewed revision `a54cc6dd11f73864fc78100a9587010274ba1e10`. This refresh focuses on process ownership, idle collection and provider background-work evidence. The prior speech findings remain historical evidence at their cited revision; this refresh is not a renewed speech-provider acceptance test or an audit of every new plugin and UI feature.

The [idle collector](https://github.com/getpaseo/paseo/blob/de50243885ff47e0dc9c26233327fe066befa684/packages/server/src/server/agent/idle-runtime-cleanup/index.ts#L33-L163) uses a one-hour idle period and minute sweep. It evaluates the transitive parent/child family, baseline activity/protection and optional provider vetoes. Provider probes have a ten-second timeout; false, errors and timeouts retain the runtime and refresh its protection clock. Sweep generations invalidate an in-flight decision when the setting changes. Before closing, it rechecks current family identities and eligibility; overlapping sweeps share one operation.

The [manager's ownership boundary](https://github.com/getpaseo/paseo/blob/de50243885ff47e0dc9c26233327fe066befa684/packages/server/src/server/agent/agent-manager.ts#L1845-L1902) captures session identity and activity time, excludes foreground runs, pending permissions, lifecycle mutations, session events and active children, then blocks prompt admission while entering the close lane. [Shutdown](https://github.com/getpaseo/paseo/blob/de50243885ff47e0dc9c26233327fe066befa684/packages/server/src/server/agent/agent-manager.ts#L1926-L1975) drains events, revalidates, closes the provider session and only then publishes its resumable closed state. A failed close retains ownership because a native writer may still be alive. New work must wait for the close decision and use the existing or reloaded session.

The [Claude background tracker](https://github.com/getpaseo/paseo/blob/de50243885ff47e0dc9c26233327fe066befa684/packages/server/src/server/agent/providers/claude/runtime-safety.ts#L1-L42) requires evidence that the runtime supports the background-task roster, no live tasks and no outstanding completion notifications. An empty task roster alone is insufficient if a completion notification is still due. That is a useful example of accounting for work beyond the foreground transcript.

The collector deliberately treats an absent optional provider probe as baseline-only eligibility. It is therefore not uniformly proof that every installed provider has no hidden work. Teamagent should expose the evidence level and define an explicit adapter policy for providers lacking such a probe; do not label this path provider-verified. The inspected [collector fixtures](https://github.com/getpaseo/paseo/blob/de50243885ff47e0dc9c26233327fe066befa684/packages/server/src/server/agent/idle-runtime-cleanup/idle-runtime-cleanup.test.ts#L55-L255) cover baseline-only collection, activity reset, provider veto, child work, protection changes and late timeout results.

Transfer the ownership/revalidation pattern to long-running agent workers across desktop, web and remote channels. A disconnected client is not sufficient reason to terminate a worker; idle process eviction is separate from deleting the durable task, transcript or provider session reference. Expose retained, closing, closed/resumable and failed-close states and preserve pending approvals.

Validation: read pinned source and the cited fixture bodies; did not execute upstream tests, launch installed agents, use providers or benchmark memory/startup savings. Current recommendations are scoped source findings, not a claim that Teamagent already implements this collector.

Related: [agents](../agents.md), [channels](../channels.md), [decisions](../decisions.md), [models](../models.md), [evolution](../evolution.md).

## 2026-10-28 follow-up source review

Reviewed the frozen update from `de50243885ff47e0dc9c26233327fe066befa684` to `986687b8fd46c996df8c561af40e005667555508`. Earlier findings above remain historical evidence; this review is limited to the cited source and delta.

In [packages/server/src/server/agent/agent-manager.ts](https://github.com/getpaseo/paseo/blob/986687b8fd46c996df8c561af40e005667555508/packages/server/src/server/agent/agent-manager.ts#L1358-L1410), Lifecycle hook names now encode phase explicitly: agent.create.before and agent.create.after replace the previous mixed naming. The same delta renames archive/close notifications to after events and session opening to agent.open.before. Separately, subagent sheets carry concrete sheet-tab identity rather than a boolean presentation hint.

**Harness implication and limits:** Version extension event names and distinguish a hook that may transform a proposed operation from a notification about recorded state. Migration requires compatibility tests for subscribers, not just producer renaming. The dispatcher, hook authorization, async error policy and UI back-navigation were not audited or executed; the oversized session implementation was outside capture. This static review does not certify other changed subsystems.

<!-- teamagent-analysis:start -->
Analysis metadata: source [paseo](https://github.com/getpaseo/paseo); analyzed commit `986687b8fd46c996df8c561af40e005667555508`; commit date 2026-10-28T17:04:52+07:00; review date 2026-10-28T14:29:27.414Z; depth source-reviewed. [Maintenance record](../analyses/repos/ai-agents--paseo.md).
<!-- teamagent-analysis:end -->
