# Delivery sequence and architectural decisions

[Home](README.md) · [Requirements](requirements.md) · [Evaluation](evaluation.md)

The first local harness increment is implemented: modular APIs/CLI, SQLite tasks
and artifacts, bounded Pi execution, React web UI and Tauri desktop sidecar.
See the [implemented contract](harness.md) and [verification](harness-verification.md).
Mobile is deferred. The phases below include future features; this increment does
not establish their exit criteria or live-provider benchmarks.

## Development process increment

The [parallel workflow review](analyses/parallel-workflow-2026-11-06.md) introduces
registered branch/worktree tasks, signed linear integration, optional PR review
and [selectable reusable skills](reusable-skills.md). The previous task checkpoint,
verification and public-record contracts remain enforced inside each worktree.
This is repository development infrastructure, not a completion claim for the
product phases below.

The [Trigon process review](analyses/trigon-process-sync-2026-10-28.md) precedes
implementation of the [repository workflow](workflow.md),
[central dependency patch process](dependencies.md), and
[local/Git-stored verification cache](cache.md). The user selected signed commits
and ordinary pushes after review, one frozen public record per changed logical
task with descriptive filenames, and a separate shared-dependency alignment
step. The 86 historical record names have been migrated with exact originals
retained. Source review, local fixture execution, real signing/publication,
browser/native acceptance and repeatable performance measurements remain distinct
evidence. These maintenance tools do not complete the product phases below.

The separately begun [shared-pin alignment](analyses/trigon-dependency-alignment-2026-10-29.md)
installed seven runtime and eleven development targets, including stable Effect
`4.0.6`, and passed a frozen install. Teamagent-only pins, lifecycle denials,
Cargo lock and supplied Trigon adapter bytes remain unchanged. The full
implementation check and real browser/Windows desktop acceptance passed.
Final review and publication outcomes are recorded separately in that report.

The [verification resource update](analyses/verification-resources-2026-11-01.md)
adapts bounded fingerprints, memory admission, owned process/temp lifetimes,
pinned hooks and streaming public conversation ingestion. The
[resource contract](resources.md) separates disposable scratch from preserved
workflow and research evidence. This is development infrastructure, not a
completion claim for the product phases below.

## Research maintenance increment

The [November 2 launcher review](analyses/project-launcher-sync-2026-11-02.md)
adds explicit project-aware tool launch and optional trusted Windows Mise
environment capture while retaining owned cleanup and verification boundaries.
It changes no product completion criteria or automatic hook trust.

The [research sync workflow](research-sync.md) maintains source lists, checkouts, text imports, and reviewed analysis baselines. Execution results, partial sources and remaining source-review work belong in [incremental analyses](analyses/README.md); implementing synchronization does not establish the product phases below or promote fetched findings automatically.

## Speech and media library increment

The [media/channel CLI contract](media-runtime.md) implements bounded file media operations, speech backend selection, local microphone capture commands, reference synthesis/provider enrollment, canonical channel input and durable receipts. It does not complete remote bot gateways, streaming duplex voice, UI playback or the evaluated generation/evolution milestones below. The [channel input study](channel-input.md) and [media processing study](media-processing.md) define those follow-up decisions and acceptance criteria.

The voice backend extension adds direct HeyGen/Fish adapters, an offline OmniVoice worker and `media setup [backend]` with official URLs. [Setup](media-setup.md) and [service/source analysis](media-processing.md) distinguish supported file operations from future streaming transports. Provider fixtures and a real Python worker protocol fixture are credential-free; model quality and live account compatibility require separate acceptance evidence.

The 2026-10-25 media revision adds fail-closed [training policy](media-training.md), explicit HeyGen lifecycle/authentication checks, encrypted recovery receipts and SRT speech import. [Runtime verification notes](media-runtime.md) distinguish fixture execution from the separately reported live Czech-to-English delivery. These changes do not publish the package or integrate it into downstream projects.

## Phase 0 — choose boundaries through small experiments

Implement an adapter conformance runner with mock effects and a persistent task/event record. Compare Pi embedded execution with a native installed-agent session; evaluate Paseo-style provider adaptation against adopting a larger framework. Review source/dependency licenses for the selected components. Establish the evaluation baseline and test data. Exit when one real coding task survives process restart and produces a verified artifact with usage accounting.

References: [Pi review](projects/ai-agents--pi.md) ([GitHub](https://github.com/earendil-works/pi)), [Paseo review](projects/ai-agents--paseo.md) ([GitHub](https://github.com/getpaseo/paseo)), [Mastra review](projects/ai-agents--mastra.md) ([GitHub](https://github.com/mastra-ai/mastra)), [mini-swe-agent review](projects/ai-agents--mini-swe-agent.md) ([GitHub](https://github.com/SWE-agent/mini-swe-agent)). Their reports link exact GitHub sources.

## Phase 1 — useful local harness

Build a local daemon, SQLite state, blob storage and responsive UI. Add passive agent discovery and two real adapters, plus a direct model interface with capability tests. Enforce task budgets and workspace scope. Add durable task history, steering, cancellation, artifact viewing and export. Keep a single worker per writing workspace.

Exit when the user can run a task with an existing agent or compatible API/local endpoint, understand unavailable capabilities and resume after a client disconnect. Do not promise universal installed-agent support.

## Phase 2 — evidence and retrieval

Add URL, repository, document, image and folder registration. Implement source versioning, parser workers, lexical retrieval, embeddings, evidence spans and citation expansion. Add code-aware indexing and working-tree overlays. Introduce optional reranking only after measuring benefit. Establish deletion propagation and per-source privacy/ACL controls.

Exit when source changes and deletions alter answers correctly, imported instructions cannot acquire authority, and retrieval improves held-out Q&A/coding tasks. References: [memory](memory.md), [import/generation](import-generation.md).

## Phase 3 — skills and bounded decisions

Add skill manifests, locked dependencies, trigger/negative-trigger tests, compatible variants and a small context-budgeted selector. Run decision models in shadow mode, compare rules/local/Jev alternatives, and calibrate on the chosen task set. Deploy only low-risk routing first. Use a fallback when offline or uncertain.

Exit when selected skills improve outcomes versus no-skill and all-skills baselines without expanding permissions or overwhelming context. References: [skills](skills.md), [decisions](decisions.md).

## Phase 4 — teams and remote channels

Add task DAGs, worker leases, isolated worktrees, conflict admission and integration checks. Add paired remote devices, cloud worker placement and a durable channel inbox/outbox. Implement Telegram first as a limited channel, then Slack and Discord with their own identity/signature/delivery adapters. The order is proposed for incremental validation, not based on a comparative implementation benchmark.

Exit when three workers finish independent tasks, two replicas cannot accept stale writes, a sleeping local host is handled visibly, and cross-device control preserves task identity. References: [agents](agents.md), [channels](channels.md).

## Phase 5 — media and controlled evolution

Add generation jobs with resource reservations, progress, cancellation, previews and artifact provenance. Evaluate one local media worker and one API provider. Add a candidate ledger for memory consolidation, skill variants and routing policies, then holdout evaluation, canary promotion and rollback. Consider model fine-tuning only after traces and labels are reliable enough to justify it.

Exit when model/provider changes remain explicit, GPU jobs recover correctly, and a deliberately regressed skill can be detected and rolled back. References: [generation](generation.md), [evolution](evolution.md).

## Decision records

| ID | Proposed decision | Alternatives and reopen condition |
|---|---|---|
| ADR-01 | Own durable task/event/policy state | Adopt a full framework if it proves portability/recovery and reduces total maintenance |
| ADR-02 | Separate installed-agent and raw-model adapters | Unify only shared capability metadata; execution contracts remain distinct |
| ADR-03 | Start local SQLite + blobs; cloud uses server storage | Introduce distributed state only when multi-host concurrency requires it |
| ADR-04 | Evidence is canonical; indexes and summaries derived | Never let an LLM wiki become the only surviving source |
| ADR-05 | Hybrid retrieval with bounded escalation | Add graph traversal for measured relation-heavy workloads |
| ADR-06 | Skills are versioned evaluated artifacts | Marketplace popularity alone does not promote a skill |
| ADR-07 | Decisions propose; deterministic code authorizes | Reopen thresholds/calibration when models or task distribution change |
| ADR-08 | Bounded teams with conflict admission | More autonomous swarms require demonstrated task-level gains |
| ADR-09 | Import/generation execute as isolated jobs | Embedded execution only for trusted low-cost transforms with hard limits |
| ADR-10 | Evolution is offline-first and rollbackable | Online learning only for measured reversible decisions with bounded exploration |

## Open questions resolved by implementation evidence

Measure the actual local hardware budget, target concurrent users/tasks, dominant repository languages, acceptable cloud data movement and preferred provider accounts. These affect deployment and ranking but do not block the specification. The first implementation should collect these as configuration, then benchmark selected components rather than hard-code assumptions about hardware or subscriptions.
