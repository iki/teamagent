# LangWatch

Source: [langwatch/langwatch](https://github.com/langwatch/langwatch) · Reviewed revision: `8f81ac27475a33c2a58c2fb07b95c109ec721ccb` · Review date: 2026-10-04.

Depth: **source-reviewed** (static source/content inspection; repository-wide audit not claimed). Related directions: [evolution](../evolution.md) · [memory](../memory.md) · [decisions](../decisions.md) · [channels](../channels.md).

## Evidence inspected

- [`platform/app/src/server/app-layer/evaluations/evaluation-execution.service.ts` lines 1–145](https://github.com/langwatch/langwatch/blob/8f81ac27475a33c2a58c2fb07b95c109ec721ccb/platform/app/src/server/app-layer/evaluations/evaluation-execution.service.ts#L1-L145)

## Observed architecture and behavior

The inspected evaluation execution service integrates trace mapping, native evaluators, code evaluators, model environment resolution, and workflow-based evaluators. It carries parent trace/span identifiers into evaluation workflows and validates their shape. Root selection is deterministic when multiple parentless spans exist. Comments describe a causality-depth mechanism to prevent evaluation-generated traces from feeding an unbounded evaluation loop. Internal evaluation access explicitly includes captured inputs, outputs, and costs even when user-facing trace views may be protected.

## Implications and tradeoffs for Teamagent

This supports an evaluation control plane attached to the same event graph as production execution. Teamagent should retain parent task/run IDs, evaluator versions, causality depth, and evaluation cost separately from task cost. Automated evaluators are themselves workloads that can fail, leak data, consume budget, or trigger further monitoring. Trace access and data export therefore need independent scope enforcement. The observed internal protection setting makes it especially important to verify which evaluators receive raw sensitive content, rather than assuming a redacted UI means redacted evaluation inputs. The large platform also brings operational complexity beyond a small local harness.

## Adoption decision

Integrate through an optional observability/evaluation exporter before adopting the whole platform as a required runtime dependency. Keep a local evaluation interface and storage path for offline use. Evaluate code-based verifiers first for deterministic tasks, supplementing them with calibrated model judges. Test evaluator recursion, unavailable models, tenant isolation, interrupted runs, and artifact retention. Review deployment and license requirements separately before selecting a hosted or self-hosted production configuration.

## Verification boundary

No project code, models, installers, or benchmarks were executed during this review. Tests and documentation show intended contracts; they do not establish measured performance, production readiness, or a complete security assessment. Recommendations above are design inferences from the cited snapshot. Verify current APIs, licensing, and deployment requirements before integration.

<!-- teamagent-analysis:start -->
Analysis metadata: source [langwatch](https://github.com/langwatch/langwatch); analyzed commit `8f81ac27475a33c2a58c2fb07b95c109ec721ccb`; commit date 2026-10-03T18:14:24Z; review date 2026-10-04; depth source-reviewed. [Maintenance record](../analyses/repos/ai-eval--langwatch.md).
<!-- teamagent-analysis:end -->
