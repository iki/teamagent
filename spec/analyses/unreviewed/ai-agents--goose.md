# goose

Source: [goose](https://github.com/aaif-goose/goose) · [agents](../../agents.md) · [models](../../models.md) · [memory](../../memory.md) · [skills](../../skills.md) · [channels](../../channels.md) · [decisions](../../decisions.md) · [evolution](../../evolution.md) · [security](../../security.md).

## 2026-11-01 initial scoped source review

Reviewed commit `b23d21cabd9b4de0c045dcdd731821a3a15c2bfc`; commit date `2026-10-31T00:21:15Z`. This newly declared source had no matching identity, URL or alias in the task's original analysis baseline. Origin matched the configured GitHub repository. The checkout was clean and non-shallow; HEAD and origin remained unchanged across each read-only capture. Only committed Git objects were read.

The complete inventory has 2,562 paths. An initial metadata/README packet and a separate 8-file packet have SHA-256 `66a19930757e8208f673fac6cd70a5b2f32eaaa82813a5132a5ee1bd5bbc866d` and `5c1f2ddd7b9fa9b8d4f61550124c9cbe404441060cc238fb4ddb9431e427998c`. **Review scope:** Read tool-approval state reconstruction/effects, permission-judge request/response handling and embedded fixtures, egress inspection portions, large-response handling and selected fixtures, Codex ACP provider construction, subagent task configuration, permission-precedence fixtures and selected ACP documentation. Complete execution dispatch, ACP transport, desktop packaging and other provider adapters were not audited. Captured files beyond the named portions are retained evidence, not an assertion that every line was audited. No source program, installer, test suite or network request was executed.

goose is a Rust agent application with desktop, CLI and API surfaces. Its useful reference patterns are explicit tool-approval events, installed-agent adapters and separation of advisory inspections from permissions. The README's provider/extension counts and performance claims were not independently benchmarked. [Overview](https://github.com/aaif-goose/goose/blob/b23d21cabd9b4de0c045dcdd731821a3a15c2bfc/README.md).

## Existing agents and subscription routes

The Codex ACP adapter resolves an installed adapter command, supplies a working directory and forwards extensions as MCP servers. It declares that the provider owns its tool loop and is session-bound. Crucially, mode translation is explicit: Auto maps to agent-full-access, SmartApprove to agent, and Approve/Chat to read-only. Teamagent should negotiate and display effective downstream permissions before launch instead of assuming similarly named modes are equivalent. Binary discovery, authentication, account entitlement, supported model access and execution authority require separate checks. [Codex ACP construction](https://github.com/aaif-goose/goose/blob/b23d21cabd9b4de0c045dcdd731821a3a15c2bfc/crates/goose/src/providers/codex_acp.rs#L21-L96).

The captured ACP guide describes existing subscription use, but also warns that fork/resume is unsupported and ACP session IDs differ from goose session IDs. These are pinned upstream documentation claims, not a current entitlement test or a promise that any subscription/API route is free or non-training. Teamagent should record both identities, expose unsupported lifecycle operations and keep provider policy gates in front of every content-bearing route. [ACP guide](https://github.com/aaif-goose/goose/blob/b23d21cabd9b4de0c045dcdd731821a3a15c2bfc/documentation/docs/guides/acp-providers.md#L8-L51), [mode mapping](https://github.com/aaif-goose/goose/blob/b23d21cabd9b4de0c045dcdd731821a3a15c2bfc/documentation/docs/guides/acp-providers.md#L259-L278).

## Decisions cannot replace authorization

Approval state is reconstructed from tool requests, responses and confirmation events. Already answered/external requests are excluded from pending inspection; explicit responses update executable state and may persist tool-level permissions. The permission judge sends request IDs, tool names and arguments as labeled untrusted JSON in a user message, returning no read-only approvals when model resolution or completion fails. Matching by request ID avoids conflating different operations on the same tool. This remains a model classification, not proof that a command is harmless. [Approval operation](https://github.com/aaif-goose/goose/blob/b23d21cabd9b4de0c045dcdd731821a3a15c2bfc/crates/goose/src/agents/state_machine/ops_tool_approval.rs#L38-L289), [judge boundary](https://github.com/aaif-goose/goose/blob/b23d21cabd9b4de0c045dcdd731821a3a15c2bfc/crates/goose/src/permission/permission_judge.rs#L91-L184).

The permission-precedence fixtures assert that denial dominates approval suggestions regardless of inspection order. This is a useful deterministic invariant for Jev-like decisions: classifier output can rank or request review, while an existing deny remains authoritative. Those fixtures were read, not run. [Precedence fixtures](https://github.com/aaif-goose/goose/blob/b23d21cabd9b4de0c045dcdd731821a3a15c2bfc/crates/goose/tests/tool_inspection_permission_precedence.rs).

## Egress and large outputs

The egress inspector recognizes selected shell/web tool names and argument fields, extracts destinations, logs them, and returns Allow with zero confidence. It is observability, not connection-time network enforcement; full destination strings also need privacy review before reuse in Teamagent logs. A hostname found in command text cannot substitute for an exact transport allowlist or DNS/redirect checks. [Egress inspection](https://github.com/aaif-goose/goose/blob/b23d21cabd9b4de0c045dcdd731821a3a15c2bfc/crates/goose/src/security/egress_inspector.rs#L275-L387).

Large text tool output is moved to a retained temporary file above a configurable character threshold, returning a reference to the model. On file-write failure it returns the entire text with a warning. The useful pattern is recoverable offload, but this fallback is not a hard context/byte bound and the retained file alone lacks an owned lifetime, source hash and access scope. Teamagent should retain bounded, versioned artifact references, report publication failures, and avoid reinserting an oversized payload. [Offload implementation and fixture](https://github.com/aaif-goose/goose/blob/b23d21cabd9b4de0c045dcdd731821a3a15c2bfc/crates/goose/src/agents/large_response_handler.rs#L1-L139).

The captured license identifies Apache 2.0. No external agent, provider, desktop application, model, benchmark or upstream test was executed. The review does not establish complete authorization enforcement, subscription access or network isolation.

<!-- teamagent-analysis:start -->
Analysis metadata: source [goose](https://github.com/aaif-goose/goose); analyzed commit `b23d21cabd9b4de0c045dcdd731821a3a15c2bfc`; commit date 2026-10-31T00:21:15Z; review date 2026-11-01T23:16:12.661Z; depth reviewed. [Maintenance record](../repos/ai-agents--goose.md).
<!-- teamagent-analysis:end -->
