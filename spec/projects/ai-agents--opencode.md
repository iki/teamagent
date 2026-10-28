# opencode

Source: [opencode](https://github.com/anomalyco/opencode) · Category: [ai-agents](../categories/ai-agents.md)

Review depth: **focused source review**. Snapshot `907b3bc518fa48e90e8ec24dd327d13eee71c36c` (2026-10-02T21:55:40-07:00). Reviewed 2026-10-04. This assessment covers the cited implementation/contract, not every subsystem or runtime behavior.

## Finding

The reviewed session-runner boundary is a compact contract for continuing from recorded history.

## Source evidence inspected

- [packages/core/src/session/runner/index.ts, lines 1–28](https://github.com/anomalyco/opencode/blob/907b3bc518fa48e90e8ec24dd327d13eee71c36c/packages/core/src/session/runner/index.ts#L1-L28)

## Observed design and algorithms

SessionRunner exposes run(sessionID, force) as an Effect returning typed errors. The interface is defined as one local continuation from already-recorded session history and includes model, message decode, context snapshot, system initialization and tool-output store failures. The documentation distinguishes draining eligible durable work from an explicit forced provider attempt.

## Harness decision

Use a similarly small continuation interface in the harness, while keeping the concrete OpenCode adapter separately versioned. Recorded input/history should precede execution, and typed error categories should map to deterministic recovery or user-visible failure.

## Limits and tradeoffs

This is intentionally a narrow contract review. The runner implementation, actual persistence guarantees, permissions, provider translations and UI were not verified; the interface cannot prove them. Do not infer that force bypasses policy or grants arbitrary execution.

## Validation before adoption

Run adapter conformance against the pinned executable: history recording, continuation, cancellation, restart and permission mediation. Inject each error class and verify correct retry classification. No tests, live inference, installation, or production operation were performed for this review. License indicator: MIT; verify the exact files and dependencies before reuse.

Related directions: [agents](../agents.md) · [models](../models.md) · [channels](../channels.md).

## 2026-10-28 scoped source review

Source: [opencode](https://github.com/anomalyco/opencode); inspected saved discovery revision `432d870b02683d2e40e895ddc70d437189b25276`. Prior analyzed revision `907b3bc518fa48e90e8ec24dd327d13eee71c36c` remains historical evidence.

**Scope:** Three complete source files: AI tool construction, core agent selection and shared tool schema. Execution dispatch, permissions, JSON-schema validation elsewhere and tests were not inspected.

The [AI tool constructor](https://github.com/anomalyco/opencode/blob/432d870b02683d2e40e895ddc70d437189b25276/packages/ai/src/tool.ts#L135-L207) has materially different typed and dynamic paths. Typed tools retain Effect codecs for input decoding and success encoding. Dynamic JSON-schema tools expose the schema to the model but use `Effect.succeed` for both local codecs; their handler receives unknown input and owns validation. An advertised JSON schema therefore does not itself establish runtime enforcement. The file also separates structured output from model-visible content and narrowly rewrites only the empty-object schema form, preserving other constraints.

The [core agent service](https://github.com/anomalyco/opencode/blob/432d870b02683d2e40e895ddc70d437189b25276/packages/core/src/agent.ts#L49-L111) excludes hidden/subagent entries only when choosing the default. Explicit `resolve`/`select` performs direct lookup, and listing returns all entries with the default first. This is selection behavior, not an admission policy; callers still need to authorize a requested agent and handle missing information. The [shared tool contract](https://github.com/anomalyco/opencode/blob/432d870b02683d2e40e895ddc70d437189b25276/packages/schema/src/tool.ts#L14-L102) carries session, agent, message and call identities plus an optional permission string, but those declarations do not prove permission enforcement or safe file-URI handling.

Teamagent can borrow the separation of tool description, boundary codecs, structured receipts and model presentation. Preserve its stricter unknown-value boundary rules rather than copying broad `any` types or treating raw JSON Schema as an executable validator. This scoped review did not execute upstream code or establish provider behavior, dispatch cancellation, policy enforcement or current test results.

<!-- teamagent-analysis:start -->
Analysis metadata: source [opencode](https://github.com/anomalyco/opencode); analyzed commit `432d870b02683d2e40e895ddc70d437189b25276`; commit date 2026-10-27T17:40:04Z; review date 2026-10-28T09:27:32.685Z; depth source-reviewed. [Maintenance record](../analyses/repos/ai-agents--opencode.md).
<!-- teamagent-analysis:end -->
