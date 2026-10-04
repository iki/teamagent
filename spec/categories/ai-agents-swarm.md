# ai-agents-swarm

[Analysis home](../README.md) · 11 projects catalogued; 2 focused source/content reviews.

Screening entries provide identity and package evidence only. Source-reviewed entries explain the exact scope inspected; none is a runtime certification. See [methodology](../methodology.md).

## Category assessment

Multi-worker coordination, task decomposition, concurrency scheduling, and role-based workflows.

Prefer a bounded task DAG with deterministic dependency and workspace-conflict admission. OpenSwarm's conflict-free waves and CrewAI's checkpoint-aware workflows provide concrete patterns. Introduce parallel workers only where independent work or independent verification improves accepted task outcomes enough to pay for coordination and duplicated context.

Checkpoints and transcript replay do not guarantee safe side-effect replay. Most category entries received screening only, so there is no general recommendation or maturity ranking across swarm frameworks; reproduce benefits against a sequential baseline.

Start with:

- [openswarm](https://github.com/unohee/OpenSwarm) — [individual report](../projects/ai-agents-swarm--openswarm.md).
- [crewai](https://github.com/crewAIInc/crewAI) — [individual report](../projects/ai-agents-swarm--crewai.md).

## Project catalogue

| Project source | Individual report | Depth | Harness relevance / finding |
|---|---|---|---|
| [agentnexus](https://github.com/kevinkaylie/AgentNexus) | [Report](../projects/ai-agents-swarm--agentnexus.md) | screened | Inventory / README only; implementation not independently established. |
| [crewai](https://github.com/crewAIInc/crewAI) | [Report](../projects/ai-agents-swarm--crewai.md) | source-reviewed | Checkpoint-aware role workflows are useful, but checkpoint restoration must be separated from side-effect replay. |
| [mirofish](https://github.com/666ghj/MiroFish) | [Report](../projects/ai-agents-swarm--mirofish.md) | screened | Inventory / README only; implementation not independently established. |
| [miroshark](https://github.com/aaronjmars/MiroShark) | [Report](../projects/ai-agents-swarm--miroshark.md) | screened | Inventory / README only; implementation not independently established. |
| [multi-fleet](https://github.com/supportersimulator/multi-fleet) | [Report](../projects/ai-agents-swarm--multi-fleet.md) | screened | Inventory / README only; implementation not independently established. |
| [oasis](https://github.com/camel-ai/oasis) | [Report](../projects/ai-agents-swarm--oasis.md) | screened | Inventory / README only; implementation not independently established. |
| [openswarm](https://github.com/unohee/OpenSwarm) | [Report](../projects/ai-agents-swarm--openswarm.md) | source-reviewed | Deterministic conflict-free task waves are preferable to having a model arbitrate every scheduling collision. |
| [optio](https://github.com/jonwiggins/optio) | [Report](../projects/ai-agents-swarm--optio.md) | screened | Inventory / README only; implementation not independently established. |
| [orca](https://github.com/stablyai/orca) | [Report](../projects/ai-agents-swarm--orca.md) | screened | Inventory / README only; implementation not independently established. |
| [shadowbroker](https://github.com/BigBodyCobain/Shadowbroker) | [Report](../projects/ai-agents-swarm--shadowbroker.md) | screened | Inventory / README only; implementation not independently established. |
| [xx-2603-mirofish-offline](https://github.com/nikmcfly/MiroFish-Offline) | [Report](../projects/ai-agents-swarm--xx-2603-mirofish-offline.md) | screened | Inventory / README only; implementation not independently established. |
