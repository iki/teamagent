# Evaluation and evidence gates

[Home](README.md) · [Evolution](evolution.md) · [Decisions](decisions.md) · [Roadmap](roadmap.md)

No benchmark was executed for this analysis. The following is the proposed evaluation program needed to select components and demonstrate that the integrated harness is better for the user's workloads.

That statement describes the original source-analysis milestone. The subsequent
[memory benchmark](benchmarks/results.md) implements a frozen coding-evidence
and document-query suite with executed reference comparisons. Its retrieval and
extraction measurements do not establish the broader end-to-end task-success
claims proposed below.

## Adapter conformance evidence reviewed 2026-10-28

[Cline's CLI host path](projects/ai-agents--cline.md) schedules its local timeout after session startup may have completed the first turn; [AnythingLLM's Telegram adapter](projects/ai-agents--anything-llm.md) can rearm an in-flight status flush after the outer cleanup clears its timer. Add fixtures for cancellation before a handle exists, work performed during startup, cleanup errors, and callbacks that outlive shutdown. A timer constant or finally block does not itself prove lifecycle bounds.

[Pi Desktop](projects/ai-agents--pi-desktop.md) defines a useful regression fixture that reconnects the real bridge and IPC handler to reproduce answer re-entrancy, while sender authority, persistence and the sidecar remain stubs. [Multica](projects/ai-agents--multica.md) checks owner-side sharing persistence and member removal in a browser test, but does not attempt revoked-member execution. [OpenClaude's type test](projects/ai-agents--openclaude.md) checks static input/output inference without invoking its consumer function. Name the boundary each fixture actually exercises and add denied-use, durable-settlement and runtime malformed-input cases separately.

[LiteLLM's routing batch review](projects/ai-agents-proxy--litellm.md) preserves one-shot prefetch, reservation rollback and strategy-specific Redis-failure behavior; its mocked MGET comparison is not a latency measurement. [Hanzo HIPs](analyses/unreviewed/ai-agents--hanzo-hips.md) supplies scratch-corpus refusal cases with unchanged-output assertions, but its final guard-presence regex does not prove every refusal path has coverage. Tests should check the intended invariant and the strength of their own setup. No upstream fixture, browser, provider or benchmark was run for these source reviews.

## Source findings reviewed 2026-10-28

[Falsify](projects/ai-eval--falsify.md) distinguishes demonstration signatures and illustrative scores from real evidence; a timestamp anchors disclosed bytes, not experimental ordering, absence of other candidates or correctness. [OpenEval](projects/ai-eval--openeval.md) contributes immutable retry attempts, a separate rejudge decision and transaction-time revalidation. Its reservation estimates and missing-cost fallback do not prove a hard billing ceiling. Preserve unknown cost and deferred work in Teamagent's evaluation records.

[iFixAI](projects/ai-eval--ifixai.md) keeps finite-model reachability, cutoff reasons and legitimate-goal witnesses explicit. Its modeled verification and permission-removal search do not establish production enforcement, universal completion or globally minimal repairs. The [claim-check review](analyses/unreviewed/ai-info--best-of-agent-harnesses.md) adds useful backed/stale/contradicted/unsupported/unclear labels, but its fail-open Stop hook and transcript heuristics cannot certify task success. Keep independently observed checks separate from model assertions and advisory classifiers.

[Rearchitecting LLMs](projects/ai-info--rearchitecting-llms.md) makes timing, warmup, native dtype and equal-output-length choices explicit. Equal work and natural early stopping answer different performance questions; neither establishes answer quality or realized serving cost. [Fengarde](projects/ai-security--fengarde.md) distinguishes test wiring and change-selection heuristics from executed tests. [OpenRouter's provider tests](projects/ai-agents-proxy--openrouter-ai-sdk-provider.md) motivate deterministic malformed-wire fixtures when a live test cannot force the response edge case it intends to cover. [MiroShark's broadcast fixtures](projects/ai-agents-swarm--miroshark.md) verify local assumptions without proving a live provider contract. No upstream benchmarks or tests were executed for these scoped updates.

[LangWatch](projects/ai-eval--langwatch.md), reviewed at `81135c1fa9f1b83580e7967eedeb972603180b35`, is a concrete reminder to compare fixtures with production behavior: its test receipt caches complete outcomes, while the production receipt runs the evaluator and then deduplicates cost recording. A passing retry test with the stronger fake does not prove provider-call deduplication. Preserve incomplete cost attribution, repeated execution and route-specific cancellation/privacy behavior in the evaluation record.

The [Schema Harness page review](projects/ai-info--game-schema-harness.md) retains the author's public-set, self-reported and unverified qualifications. Aggregate action-efficiency scores, games solved, matched comparisons, selected best runs and reconstructed curves answer different questions. State absolute changes in percentage points, retain all selection decisions, and evaluate a frozen artifact on held-out tasks before treating an observed score as generalization. No benchmark was reproduced in this review.

[Test Guard](projects/ai-skills--bundle-x-antigravity.sickn33.md), [Trail of Bits](projects/ai-skills--security.trailofbits.md) and [Loop Engineering](projects/ai-skills--plan.loop-engineering.md) motivate regression coverage, benign controls and independent reproduction. [Taste](projects/ai-skills--design.taste.md) provides baseline/skill comparisons, but aesthetic compliance and static text rules are limited proxies. [TopRank's tests](projects/ai-skills--seo.toprank.md), [UI UX Pro Max's generator fixtures](projects/ai-skills--design.ui-ux-pro-max.md) and [Agent Copilot's launcher test](projects/ai-skills--agent-copilot.md) further distinguish manifest or argument contracts from live authorization, image validity and real browser behavior. Report skipped, optional, partial and unavailable checks explicitly instead of silently treating them as successful coverage.

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

## Scoped evaluation refinements: 2026-10-27

[Adrian's tests](https://github.com/secureagentics/Adrian) ([review](projects/ai-security--adrian.md)) motivate bidirectional consistency between decision codes and visible receipts, separately from classifier quality. [TypeSafe](https://github.com/typesafe-ai/skills) ([review](projects/ai-skills--agent-typesafe.md)) emphasizes held-out probes and explicit uncertainty/service errors. Calibrate on the target model/task; example thresholds are not defaults.

[Warp's merge-risk procedure](https://github.com/warpdotdev/common-skills) ([review](projects/ai-skills--bundle.warp.md)) uses a weighted average: evaluate only after hard authorization/isolation gates, which other dimensions cannot offset. [Anatomy](https://github.com/wheresryan22/anatomy) ([review](analyses/unreviewed/ai-skills--render-anatomy.md)) supplies detailed positive expectations but no measured outcomes or near-miss cases in its eval file. Add independent visual/runtime acceptance and resource tests. [OASIS](https://github.com/camel-ai/oasis) ([review](projects/ai-agents-swarm--oasis.md)) adds BazaarBench as a discovery lead, not reproduced benchmark evidence. No upstream tests or benchmarks were run for these updates.
