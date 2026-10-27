# Ragas

Source: [vibrantlabsai/ragas](https://github.com/vibrantlabsai/ragas) · Reviewed revision: `298b68274234c060deacab3cf5fb52aa3a20e885` · Review date: 2026-10-04.

Depth: **source-reviewed** (static source/content inspection; repository-wide audit not claimed). Related directions: [evolution](../evolution.md) · [memory](../memory.md) · [decisions](../decisions.md).

## Evidence inspected

- [`src/ragas/metrics/collections/faithfulness/metric.py` lines 22–137](https://github.com/vibrantlabsai/ragas/blob/298b68274234c060deacab3cf5fb52aa3a20e885/src/ragas/metrics/collections/faithfulness/metric.py#L22-L137)

## Observed architecture and behavior

The modern faithfulness metric decomposes an answer into atomic statements, evaluates those statements against retrieved context with a structured-output language model, and computes the supported fraction. It rejects missing inputs and returns NaN when no statements are generated. This is a concrete evidence-consistency metric, not a proof that the source itself is true or that retrieval found all necessary evidence. The result depends on both statement extraction and entailment judgment.

## Implications and tradeoffs for Teamagent

For Teamagent's evolving knowledge base, evaluate retrieval coverage separately from answer support. A response can be perfectly faithful to obsolete or irrelevant evidence, and an empty/failed judgment must not count as a success. Pair such metrics with citation-span checks, source freshness, contradiction cases, and task-specific expected answers. Maintain judge model/version, prompt, and resource costs in the evaluation record. Use human-labeled calibration samples and measure agreement before making automated promotion decisions. Multimodal inputs also need a defined evidence representation rather than assuming text-only entailment covers visual grounding.

## Adoption decision

Adopt selected metrics behind the evaluation protocol for knowledge-query tasks, after calibrating them on the team's domain. Prefer deterministic verifiers for compilation, tests, tool effects, and citation existence. Keep faithfulness as one dimension in a scorecard instead of collapsing it into a universal quality score. Treat NaN and evaluator errors as unknown with explicit coverage statistics. Re-evaluate when the retrieval pipeline, source parser, or judge changes, not only when the answering model changes.

## Verification boundary

No project code, models, installers, or benchmarks were executed during this review. Tests and documentation show intended contracts; they do not establish measured performance, production readiness, or a complete security assessment. Recommendations above are design inferences from the cited snapshot. Verify current APIs, licensing, and deployment requirements before integration.

<!-- teamagent-analysis:start -->
Analysis metadata: source [ragas](https://github.com/vibrantlabsai/ragas); analyzed commit `298b68274234c060deacab3cf5fb52aa3a20e885`; commit date 2026-02-24T13:17:18+05:30; review date 2026-10-04; depth source-reviewed. [Maintenance record](../analyses/repos/ai-eval--xx-2602-ragas.md).
<!-- teamagent-analysis:end -->
