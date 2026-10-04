# ai-spec

[Analysis home](../README.md) · 8 projects catalogued; 3 focused source/content reviews.

Screening entries provide identity and package evidence only. Source-reviewed entries explain the exact scope inspected; none is a runtime certification. See [methodology](../methodology.md).

## Category assessment

Specification artifacts, requirement-to-task workflows, dependency graphs, and coding-stage coordination procedures.

Integrate Spec Kit and OpenSpec as optional project workflows rather than the harness's universal state model. Reuse versioned artifact graphs, prerequisite checks, and traceability. Get Shit Done contributes compact coordination and wave planning; deterministic runtime code should reconcile worker completion and enforce transitions.

A specification workflow cannot guarantee implementation correctness or durable execution. Preserve existing repository conventions, allow lightweight tasks, and evaluate interruption, changed prerequisites, concurrency, and escaping. Remaining screened frameworks have no demonstrated general maturity advantage.

Start with:

- [spec-kit](https://github.com/github/spec-kit) — [individual report](../projects/ai-spec--spec-kit.md).
- [openspec](https://github.com/Fission-AI/OpenSpec) — [individual report](../projects/ai-spec--openspec.md).
- [get-shit-done](https://github.com/gsd-build/get-shit-done) — [individual report](../projects/ai-spec--get-shit-done.md).

## Project catalogue

| Project source | Individual report | Depth | Harness relevance / finding |
|---|---|---|---|
| [design.md](https://github.com/google-labs-code/design.md) | [Report](../projects/ai-spec--design.md.md) | screened | Inventory / README only; implementation not independently established. |
| [get-shit-done](https://github.com/gsd-build/get-shit-done) | [Report](../projects/ai-spec--get-shit-done.md) | source-reviewed | Curate the wave-planning and compact-coordinator techniques into a coding workflow bundle. Implement completion reconciliation in deterministic runtime code, using run IDs and explicit verifiers. Permit sequential fallback when the host cannot reliably spawn or report workers. Measure whether extra planning and verification agents improve task success enough to justify latency and cost. Keep context references small and durable, and avoid treating a large role catalog as a reason to spawn every role for every task. |
| [openspec](https://github.com/Fission-AI/OpenSpec) | [Report](../projects/ai-spec--openspec.md) | source-reviewed | Adopt the schema-driven artifact graph pattern and provide an OpenSpec integration for teams already using it. Keep durable execution, cancellation, retries, and permissions in the harness engine. Treat the graph's deterministic order as a reproducibility aid, not a quality guarantee. Evaluate partial completion, changed prerequisites, interrupted transitions, and concurrent workers. Use its spec/change artifacts as queryable project memory, retaining both the current accepted state and historical decisions that explain why it changed. |
| [openspec-vscode](https://github.com/AngDrew/openspec-vscode) | [Report](../projects/ai-spec--openspec-vscode.md) | screened | Inventory / README only; implementation not independently established. |
| [spec-kit](https://github.com/github/spec-kit) | [Report](../projects/ai-spec--spec-kit.md) | source-reviewed | Offer a spec-driven coding bundle or importer rather than adopting Spec Kit's directory conventions as the entire harness architecture. Reuse format adapters and artifact templates where suitable. Enforce required state transitions in the task engine, with policy-controlled overrides recorded as decisions. Evaluate cross-platform paths, command escaping, hook failures, stale checklists, and end-to-end requirement-to-test traceability. Preserve the user's chosen workflow and allow a lightweight task path where a full specification adds little value. |
| [speculate](https://github.com/jlevy/speculate) | [Report](../projects/ai-spec--speculate.md) | screened | Inventory / README only; implementation not independently established. |
| [techsio.ontos](https://github.com/TechsioCZ/ontos) | [Report](../projects/ai-spec--techsio.ontos.md) | screened | Inventory / README only; implementation not independently established. |
| [trellis](https://github.com/mindfold-ai/Trellis) | [Report](../projects/ai-spec--trellis.md) | screened | Inventory / README only; implementation not independently established. |
