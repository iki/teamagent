# Team-agent harness: architecture and source analysis

Analysis date: **2026-10-04**. Scope: **507 project checkouts across 19 categories**, representing **503 distinct upstream origins**. Every checkout has an individual report. **91 received focused source/content reviews; 416 have explicitly labeled inventory/README screening records.** One of the focused reviews is a design-only wiki reference. This is not an exhaustive implementation audit of all 507 projects, and no runtime or model benchmarks were run.

The recommendation is a **local-first durable control plane with replaceable agent/model/tool workers**, evidence-backed memory, selectively loaded skills, bounded typed decisions and evaluation-gated evolution. Keep tasks, permissions, artifacts and provenance independent of any agent vendor. Add teams and learned routing only when they improve measured task outcomes.

## Start here

1. [Architecture and component choices](architecture.md): system boundaries, deployment and failure semantics.
2. [Requirements map](requirements.md): each requested capability and its acceptance evidence.
3. [Contracts and data model](contracts.md): tasks, agents, models, knowledge, skills, decisions and generation jobs.
4. [Delivery sequence and decision records](roadmap.md): what to build first, integrate or defer.
5. [Evaluation plan](evaluation.md) and [methodology](methodology.md): how to establish quality and read the evidence limits.

## Eight directions

| Direction | Analysis |
|---|---|
| Memory | [Evidence, temporal knowledge, code retrieval and context compilation](memory.md) |
| Agents | [Installed-agent discovery, adapter contracts and team execution](agents.md) |
| Models | [Local/API/subscription access, routing and provider compatibility](models.md) |
| Skills | [Registry, model/harness variants, selection and evaluation](skills.md) |
| Import / generation | [Shared tool lifecycle](import-generation.md), [import pipeline](import-pipeline.md), [media generation](generation.md) |
| Channels | [Desktop/mobile/web, Telegram/Slack/Discord and local/cloud operation](channels.md) |
| Decisions | [Jev-like finite choices, calibration, abstention and deterministic execution](decisions.md) |
| Evolution | [Trace-driven proposals, held-out evaluation, promotion and rollback](evolution.md) |

[Security and isolation](security.md) applies across all directions. Each direction includes a project coverage table with relative links to individual reports and upstream GitHub links. Detailed recommendations cite their specific reports near the relevant idea.

## Architectural conclusions

- **Installed agents and raw models need different adapters.** Discovery, compatibility, authentication and usable account access are separate states. Opaque native tools also have weaker control guarantees than gateway-mediated effects.
- **Memory is more than a vector store.** Preserve original evidence and versions, maintain lexical/semantic/code/temporal views as needed, and compile a small cited context for each task.
- **Skill libraries need an admission and selection system.** Lock sources, evaluate model/harness variants, use near-miss trigger tests and load only relevant instructions.
- **Decision models fit bounded choices.** Validate legal candidates, calibrate confidence, retain deterministic fallback and keep authorization independent.
- **Import and media work belong in durable jobs.** Keep binaries out of model context, record tool/model versions, reserve resources and verify resulting artifacts.
- **Evolution needs an independent promoter.** Usage is not quality; improved validation scores are not proof of generalization. Preserve held-out tests and rollback versions.

These are design conclusions supported by the detailed documents, not a claim that a single surveyed project already implements the full system or wins every benchmark.

## Coverage by source category

<!-- categories:start -->
| Category | Projects | Focused reviews |
|---|---:|---:|
| [ai-agents](categories/ai-agents.md) | 175 | 19 |
| [ai-agents-mem](categories/ai-agents-mem.md) | 70 | 12 |
| [ai-agents-proxy](categories/ai-agents-proxy.md) | 14 | 4 |
| [ai-agents-sandbox](categories/ai-agents-sandbox.md) | 11 | 4 |
| [ai-agents-skills](categories/ai-agents-skills.md) | 15 | 7 |
| [ai-agents-swarm](categories/ai-agents-swarm.md) | 11 | 2 |
| [ai-agents-tokens](categories/ai-agents-tokens.md) | 8 | 2 |
| [ai-eval](categories/ai-eval.md) | 8 | 3 |
| [ai-gen](categories/ai-gen.md) | 10 | 4 |
| [ai-info](categories/ai-info.md) | 15 | 2 |
| [ai-media](categories/ai-media.md) | 7 | 3 |
| [ai-model-edit](categories/ai-model-edit.md) | 1 | 1 |
| [ai-model-run](categories/ai-model-run.md) | 2 | 2 |
| [ai-operate](categories/ai-operate.md) | 1 | 1 |
| [ai-prompts](categories/ai-prompts.md) | 5 | 2 |
| [ai-query](categories/ai-query.md) | 55 | 10 |
| [ai-security](categories/ai-security.md) | 16 | 5 |
| [ai-skills](categories/ai-skills.md) | 75 | 5 |
| [ai-spec](categories/ai-spec.md) | 8 | 3 |
<!-- categories:end -->

## Evidence and maintenance artifacts

- [Machine-readable inventory](data/inventory.json): origin, revision, manifests, license hints and screening description.
- [Coverage and topic mapping](data/coverage.json): review depth, report path and associated directions.
- [Validation results](data/validation.json): link, source-anchor and coverage consistency checks.
- [Inventory tool](tools/inventory.py), [catalog builder](tools/build_catalog.py), [validator](tools/validate.py).

All document links are relative to their containing file. Source references use upstream repositories and pinned commits rather than sibling checkout locations. Almost all are GitHub repositories; two inputs are GitHub Gists and one has a GitLab origin, retained without inventing a GitHub mirror. The inventory retains duplicate origins as separate records because the user supplied separate categorized checkouts.
