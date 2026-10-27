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

<!-- teamagent-analysis:start -->
Analysis metadata: source [ai.tanstack](https://github.com/tanstack/ai); analyzed commit `632fd806bb3e68e52a2a8eae937873c5defe6786`; commit date 2026-10-03T15:31:51Z; review date unknown; depth source-reviewed. [Maintenance record](../analyses/repos/ai-agents--ai.tanstack.md).
<!-- teamagent-analysis:end -->
