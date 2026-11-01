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

## 2026-10-28 follow-up source review

Reviewed the frozen update from `432d870b02683d2e40e895ddc70d437189b25276` to `d6867f221061f7688a9b784b840ec6b7e3c9d40a`. Earlier findings above remain historical evidence; this review is limited to the cited source and delta.

In [packages/core/src/permission.ts](https://github.com/anomalyco/opencode/blob/d6867f221061f7688a9b784b840ec6b7e3c9d40a/packages/core/src/permission.ts#L224-L267), The permission service adds assertNotDenied, which evaluates rules and fails only for deny. Unlike assert, it does not create or wait for an approval when the result is ask. The original assert path still waits on a deferred approval and removes the pending entry during cleanup.

**Harness implication and limits:** A denial precheck is not authorization. Name and type preliminary policy checks so a caller cannot accidentally use successful preflight as permission to perform an effect. This function also lacks the adjacent assert path's explicit closed check; call-site lifecycle enforcement and rule evaluation were not reviewed. No effect-policy or cancellation test was run. This static review does not certify other changed subsystems.

## 2026-11-01 scoped source review

Reviewed frozen commit `69269e4ebe309a08919b3c9be7948b9fd699c3a4` against prior analyzed commit `d6867f221061f7688a9b784b840ec6b7e3c9d40a`. Historical reviews above remain separate evidence.

The [authentication-options helper](https://github.com/anomalyco/opencode/blob/69269e4ebe309a08919b3c9be7948b9fd699c3a4/packages/ai/src/route/auth-options.ts) now exposes an explicit no-key route: the visible `key === false` branch returns `Auth.none` before environment resolution. An explicit custom auth definition has precedence. [Anthropic](https://github.com/anomalyco/opencode/blob/69269e4ebe309a08919b3c9be7948b9fd699c3a4/packages/ai/src/providers/anthropic.ts) uses the shared resolver; [OpenAI-compatible settings](https://github.com/anomalyco/opencode/blob/69269e4ebe309a08919b3c9be7948b9fd699c3a4/packages/ai/src/providers/openai-compatible.ts) accept the same no-key mode. This enables deliberately unauthenticated local gateways without treating a missing credential as permission to omit authentication.

The inspected loopback fixtures assert that ordinary missing-key configuration fails, explicit keyless requests omit Authorization, custom gateway headers remain separate, and image/Anthropic routes support the mode. Captured credential-associated literals are redacted, so their exact values are not evidence here. No-key routing does not prove local processing, trusted origin, privacy exclusion or account entitlement. Teamagent should keep explicit authentication mode, endpoint identity and training/egress policy independently enforced before selection or upload.

**Coverage:** Read the complete 146-line resolver/provider expansion and the earlier 85-line keyless fixture plus selected auth-path changes. Underlying transport, all provider integrations and image response handling were not fully audited. Source inspection only; no upstream tests, source programs or live providers were executed. This is a scoped architecture review, not a whole-repository correctness or security certification.

<!-- teamagent-analysis:start -->
Analysis metadata: source [opencode](https://github.com/anomalyco/opencode); analyzed commit `69269e4ebe309a08919b3c9be7948b9fd699c3a4`; commit date 2026-11-01T01:07:13-05:00; review date 2026-11-01T11:33:30.893Z; depth source-reviewed. [Maintenance record](../analyses/repos/ai-agents--opencode.md).
<!-- teamagent-analysis:end -->
