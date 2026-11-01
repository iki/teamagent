# ai.tanstack

Source: [ai.tanstack](https://github.com/tanstack/ai) · Category: [ai-agents](../categories/ai-agents.md)

Review depth: **focused source review**. Snapshot `632fd806bb3e68e52a2a8eae937873c5defe6786` (2026-10-03T15:31:51Z). Reviewed 2026-10-04. This assessment covers the cited implementation/contract, not every subsystem or runtime behavior.

## Finding

Code Mode demonstrates lazy tool documentation with typed bindings; discovery is not an authorization boundary.

## Source evidence inspected

- [packages/ai-code-mode/src/create-discovery-tool.ts, lines 8–108](https://github.com/tanstack/ai/blob/632fd806bb3e68e52a2a8eae937873c5defe6786/packages/ai-code-mode/src/create-discovery-tool.ts#L8-L108)

## Observed design and algorithms

discover_tools receives explicit tool names and returns their descriptions and generated TypeScript signatures. It accepts names with or without an external_ prefix, reports unknown names, and controls how much description the catalog exposes. The source explicitly states bindings are already present in the sandbox: discovery reveals documentation rather than installing or authorizing a capability.

## Harness decision

Use progressive disclosure for large tool/skill libraries and code-based composition of independent calls. Maintain a separate allowlist at binding invocation. A task-specific tool manifest should be built before any generated code executes.

## Limits and tradeoffs

Hiding tool documentation is not capability revocation. Code execution amplifies the need for runtime quotas, deterministic policy checks, cancellation and output-size limits. This file alone provides no evidence that a chosen sandbox enforces host isolation.

## Validation before adoption

Attempt calls to undocumented and unauthorized bindings, oversized fan-out, timeouts and malformed arguments. Measure total context plus discovery overhead, not only the initial prompt size. No tests, live inference, installation, or production operation were performed for this review. License indicator: MIT; verify the exact files and dependencies before reuse.

Related directions: [agents](../agents.md) · [skills](../skills.md) · [decisions](../decisions.md).

## 2026-10-28 scoped update review

Reviewed commit `669fd31d995a7134e9f39f386181edc5085039b2` (commit date `2026-10-27T11:25:47Z`). The original snapshot above remains historical evidence.

**Scope:** Complete AI-review PR metadata parser and Git helpers, plus selected production review, policy orchestration, push/publication and bounded process-runner branches; security scanners, verdict schema, workflow approval helper, MCP/harness runtime and tests were not reviewed.

The [Git snapshot helper](https://github.com/tanstack/ai/blob/669fd31d995a7134e9f39f386181edc5085039b2/agent-scripts/ai-review/git.ts#L12-L124) fetches fixed commit IDs, derives one merge base and reads raw entries plus a full-index patch without checking out pull-request files. It disables external diff/text conversion, checks file/patch coverage, rejects unsupported file-type changes and preserves binary patches as unavailable text. The [metadata parser](https://github.com/tanstack/ai/blob/669fd31d995a7134e9f39f386181edc5085039b2/agent-scripts/ai-review/pr.ts#L36-L106) validates SHA shape and key response fields. These are useful evidence-binding practices; repository/ref/URL semantics and every returned field are not comprehensively validated by that parser.

The [publication path](https://github.com/tanstack/ai/blob/669fd31d995a7134e9f39f386181edc5085039b2/agent-scripts/ai-review/run.ts#L432-L551) rechecks base/head repository, branch, SHA, open state and maintainer modification permission before patching and pushing. Push uses an explicit expected-head lease, and comments retain the reviewed commit identity. A post-push stale API read is deliberately tolerated. This limits stale-write races, but labels and comments are multiple external writes, and a successful push can precede a later failure. Teamagent needs recoverable publication receipts rather than treating the whole sequence as atomic.

The [production review sandbox](https://github.com/tanstack/ai/blob/669fd31d995a7134e9f39f386181edc5085039b2/agent-scripts/ai-review/run.ts#L180-L265) pins the container image and checks checkout HEAD before installing the review CLI. It also passes a live provider key to code running in the review environment and explicitly notes that child commands/network access can expose it. Generated-diff scanning and exact-secret matching in review text occur after the model run; they cannot prove the key was never transmitted. The orchestration derives readiness/security labels and workflow approval from policy scanners plus a model verdict, without an independent test execution in the reviewed branch. The uninspected scanners may add checks, but ready is not verified task correctness.

The [Git process adapter](https://github.com/tanstack/ai/blob/669fd31d995a7134e9f39f386181edc5085039b2/agent-scripts/ai-review/run.ts#L572-L609) bounds accumulated output while reading and strips two named secrets from its environment. It has no wall-clock deadline or forced-termination escalation here and otherwise retains ambient environment values. Git operations, provider calls, workflow approvals and publication were inspected only as source; none were performed.

**Verification limit:** source inspection only; no upstream tests or provider calls were executed. This scoped review does not certify every file in the repository.

## 2026-11-01 scoped source review

Reviewed commit `3ce3085d674fc068e4d45b8699eccb17b886aa6c` (commit date `2026-10-30T16:11:42+11:00`), compared with `669fd31d995a7134e9f39f386181edc5085039b2`. Earlier observations remain historical evidence.

**Scope:** Complete code-mode binding approval guard and its direct/list conversion fixtures; 98 changed paths inventoried.

[toolToBinding](https://github.com/tanstack/ai/blob/3ce3085d674fc068e4d45b8699eccb17b886aa6c/packages/ai-code-mode/src/bindings/tool-to-binding.ts) rejects tools requiring approval because code-mode execution cannot raise their individual approval interrupt. The [fixtures](https://github.com/tanstack/ai/blob/3ce3085d674fc068e4d45b8699eccb17b886aa6c/packages/ai-code-mode/tests/tool-to-binding.test.ts) deliberately bypass the compile-time type to exercise the runtime guard, including a mixed safe/gated tool list. This is an explicit capability incompatibility check, not proof that every tool marked safe actually lacks side effects.

**Teamagent implication (inference):** Do not let composition into a code-execution tool erase inner authorization requirements. Either preserve resumable per-action approval or reject the binding before execution; tool metadata must be reviewed against effective behavior and cannot become permission merely by clearing a boolean.

**Verification limit:** committed-source inspection only; no upstream code, tests or provider calls were executed. Review scope is the cited implementation or authored guidance, not whole-project correctness, licensing clearance or measured performance. Source passages were redacted for review; exact URL literals were not byte-validated.

<!-- teamagent-analysis:start -->
Analysis metadata: source [ai.tanstack](https://github.com/tanstack/ai); analyzed commit `3ce3085d674fc068e4d45b8699eccb17b886aa6c`; commit date 2026-10-30T16:11:42+11:00; review date 2026-11-01T11:33:30.893Z; depth source-reviewed. [Maintenance record](../analyses/repos/ai-agents--ai.tanstack.md).
<!-- teamagent-analysis:end -->
