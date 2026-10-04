# Evaluation and evidence gates

[Home](README.md) · [Evolution](evolution.md) · [Decisions](decisions.md) · [Roadmap](roadmap.md)

No benchmark was executed for this analysis. The following is the proposed evaluation program needed to select components and demonstrate that the integrated harness is better for the user's workloads.

## Baselines and experimental design

Start with a fixed single agent, fixed model and conventional tools, without shared memory or automatic skill selection. [mini-swe-agent](https://github.com/SWE-agent/mini-swe-agent) ([review](projects/ai-agents--mini-swe-agent.md)) provides an auditable loop reference. Compare incremental additions: retrieval, context compiler, selected skills, model routing, then teams. Also compare a manual deterministic route against Jev-like routing. Do not compare systems with different hidden tool access, egress, task data or budgets.

Split by repository/source family and time, not random near-duplicate chunks. Maintain training/proposal data, validation for selection, and a final untouched test set. Freeze task inputs, environment image, tools, dependency versions, policy, model identifiers and budget accounting. Where providers cannot pin model versions, record request dates/returned identifiers and rerun both variants in an interleaved schedule.

Use paired tasks and repeated seeds/runs where stochasticity matters. Report success counts and Wilson intervals, paired outcome differences, median/p95 latency and total billed/measured cost. Bootstrap task-level deltas without treating correlated steps as independent samples. Show failed, cancelled and timeout runs; do not discard them. Pre-register success checks and the minimum useful improvement before selecting a winner.

## Workload suite

| Slice | Examples | Primary metrics |
|---|---|---|
| Coding | Bug fix, multi-file feature, unfamiliar repo, dependency upgrade, flaky test diagnosis | Hidden-test pass, patch correctness, regressions, human edits, cost/task |
| Knowledge Q&A | Exact fact, multi-document synthesis, conflicting versions, no-answer question | Citation correctness, answer support, abstention, retrieval recall/nDCG |
| Code retrieval | Symbol lookup, call graph, behavioral question, stale index/working diff | Relevant-file/symbol recall, span precision, source-version correctness |
| Multimodal import | Scanned PDF, table, diagram, screenshot, mixed language, huge archive | Extraction quality, bounding-box/source fidelity, time/memory, deterministic rejection |
| Memory | Preference update, changed fact, contradictory sources, deleted source, private workspace | Correct recall, stale/false recall, deletion completeness, access isolation |
| Skills | True trigger, near miss, conflicting skills, weak local model, different agent harness | Selection precision/recall, outcome gain, added tokens, permission equivalence |
| Decisions | Ambiguous/no-match candidate, stale DOM, malformed distributions, provider outage | Selective risk, calibration, coverage, fallback correctness, downstream success |
| Media | Image edit, speech, video workflow, cancelled GPU job, reference preservation | Task acceptance, valid artifacts, provenance, quality/cost/latency |
| Channels | Duplicate/out-of-order message, disconnect, stale approval, multiple devices | No cross-tenant leaks, no unreported duplicate effects, replay/cancel latency |
| Operations | Worker crash, DB restart, quota exhausted, lease lost, sandbox failure | Recovery time, lost work, uncertain effects, budget overshoot |

## End-to-end scenarios

1. Register a repository, a folder of documents, a URL and an image. Query across them with citations, then change/delete a source and verify updated answers and derived-data invalidation.
2. Fix a bug through an installed subscription-backed agent, compare a native API/local-model worker, and retain the same task/artifact history. Record unsupported capabilities rather than silently approximating them.
3. Start a task on desktop, inspect it on mobile, steer it through an authorized chat identity, disconnect and reconnect. Confirm ordered commands and a single final notification.
4. Use three independent coding workers, then merge. Introduce a conflicting schema change and prove admission/merge checks catch it.
5. Fail a model request after an external tool effect succeeds. Resume without repeating that effect, or explicitly report the unresolved outcome.
6. Propose a skill/memory/router improvement, show hidden-test results, canary it, force a regression and restore the previous version.

## Component evidence and tools

The [evaluation category](categories/ai-eval.md) includes individual reviews and screening records. [Frontier Harness Eval](projects/ai-eval--frontier-harness-eval.md) ([GitHub](https://github.com/frontier-harness-eval/eval)), [LangWatch](projects/ai-eval--langwatch.md) ([GitHub](https://github.com/langwatch/langwatch)) and [Ragas](projects/ai-eval--xx-2602-ragas.md) ([GitHub](https://github.com/vibrantlabsai/ragas)) offer different harness, observability and retrieval-evaluation concepts. Use their linked GitHub sources and exact inspected scope; importing an evaluator does not make its scoring methodology sufficient for all tasks.

[DSPy](https://github.com/stanfordnlp/dspy) ([review](projects/ai-agents--dspy.md)) explicitly defaults omitted validation data to training data. The harness must provide its own held-out discipline. [MetaHarness](https://github.com/SuperagenticAI/metaharness) ([review](projects/ai-agents--metaharness.md)) adds candidate diffs and scope checks; test isolation and evaluator authority remain harness responsibilities.

## Promotion gates

A proposed initial promotion policy: no new security/isolation failures; no statistically or operationally material regression in a required workload slice; a predeclared quality or efficiency gain; bounded worst-case cost; and an available rollback artifact. Set actual statistical margins/sample sizes from baseline variance and risk, rather than pretending one arbitrary pass percentage is universal.

Use deterministic checks for schemas, file containment, side-effect authorization and hidden coding tests. Human review or blinded independent judging covers subjective media quality and supported prose. Record judge disagreement and audit a sample against human labels. Never treat the generator's self-reported confidence as the only success label.

Operational invariants have zero allowed observed violations in the test suite, but passing tests does not prove they can never fail. Add continuous telemetry and adversarial regression cases whenever a production failure occurs. Keep optimization and telemetry retention privacy-aware.
