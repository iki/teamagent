# nvidia-nemo-labs-molt

Source: [nvidia-nemo-labs-molt](https://github.com/NVIDIA-NeMo/labs-molt) · Category: [ai-agents](../categories/ai-agents.md)

Original review depth: **inventory / README screening only**. The dated update review below has its own explicit scope. This is an individual coverage record, not a source-code correctness audit or adoption recommendation.

Snapshot: `e77c84672ccb295d1a2ef7d56dd7a54c48533581`; commit timestamp `2026-10-03T05:36:56+08:00`; 165 tracked paths.

## Scope and evidence

Upstream description excerpt (a project claim, automatically extracted from [README](https://github.com/NVIDIA-NeMo/labs-molt/blob/e77c84672ccb295d1a2ef7d56dd7a54c48533581/README.md)):

> Ray · vLLM · NVIDIA AutoModel — the smallest PyTorch / HuggingFace-native stack for [](https://www.researchgate.net/publication/409325071_Molt_A_Scalable_PyTorch-Native_Training_Framework_for_Agentic_Reinforcement_Learning)

Build/package evidence: [docs/fern/package.json](https://github.com/NVIDIA-NeMo/labs-molt/blob/e77c84672ccb295d1a2ef7d56dd7a54c48533581/docs/fern/package.json); [pyproject.toml](https://github.com/NVIDIA-NeMo/labs-molt/blob/e77c84672ccb295d1a2ef7d56dd7a54c48533581/pyproject.toml); [requirements.txt](https://github.com/NVIDIA-NeMo/labs-molt/blob/e77c84672ccb295d1a2ef7d56dd7a54c48533581/requirements.txt)

License evidence: [LICENSE](https://github.com/NVIDIA-NeMo/labs-molt/blob/e77c84672ccb295d1a2ef7d56dd7a54c48533581/LICENSE) Classification hint: Apache-2.0. A root license does not establish rights for every bundled asset, model, or dependency.

## Harness assessment

This entry was catalogued under **ai-agents**. Its category places it in the candidate set for agents, models, channels; those associations are navigational and have not been individually validated as implemented capabilities. See [agents](../agents.md) · [models](../models.md) · [channels](../channels.md) for the source-reviewed alternatives and proposed integration boundaries.

**Disposition:** retain as a comparison candidate. Before adopting it, inspect the implementation entry point and its tests, verify the required protocol and deployment platform, and reproduce a task from the harness evaluation suite. Popularity, a README feature list, and the presence of a package manifest are insufficient evidence of quality or compatibility.

**Unresolved:** runtime behavior, security boundaries, performance, API/subscription eligibility, dependency health, maintenance status, and fit to the proposed harness were not independently established for this entry. No repository code was executed as part of this screening.

## 2026-10-28 scoped update review

Reviewed commit `726f16fcc5080540430574377090a80d7df5eda0` (commit date `2026-10-24T10:23:37+08:00`). The original snapshot above remains historical evidence.

**Scope:** Step environment runner, trajectory accounting and changed Geo3K responsiveness/turn-limit fixtures; loss functions, router internals, chat server and GPU/training performance were not audited.

The [step runner](https://github.com/NVIDIA-NeMo/labs-molt/blob/726f16fcc5080540430574377090a80d7df5eda0/molt/agents/base.py#L317-L462) creates a fresh environment and routing session per episode, copies sampling parameters, and reduces each generation's token allowance by used context and image expansion. Oversized initial multimodal prompts raise rather than being cut through image-token alignment; text prompts may be truncated with a warning. Feedback token/image handling is separately bounded. These are concrete accounting choices, not evidence that a particular model or task completes within a wall-clock budget.

The [result/trajectory contract](https://github.com/NVIDIA-NeMo/labs-molt/blob/726f16fcc5080540430574377090a80d7df5eda0/molt/agents/base.py#L99-L209) distinguishes natural termination from truncation, reward from score, and stores action ranges/off-policy metadata. The runner accumulates rewards but retains the latest score, so report these quantities with their actual aggregation semantics rather than treating all as task correctness. A dedicated tokenization executor avoids sharing the default pool with blocking agent work; the changed [Geo3K fixtures](https://github.com/NVIDIA-NeMo/labs-molt/blob/726f16fcc5080540430574377090a80d7df5eda0/tests/unit/test_geo3k_agent.py#L91-L176) check event-loop responsiveness and that the final turn limit prevents another tool execution. No throughput or learning-quality measurement was run.

The runner invokes environment teardown in `finally`, including failed setup, but awaits cleanup without an explicit deadline and logs cleanup failures while returning the trajectory. Teamagent should preserve resource-leak/cleanup status separately from episode output. The [dynamic loader](https://github.com/NVIDIA-NeMo/labs-molt/blob/726f16fcc5080540430574377090a80d7df5eda0/molt/agents/base.py#L289-L305) executes a Python module; it belongs to a trusted-code boundary and must never be treated as importing inert model-generated configuration. Keep this source as a training/evaluation reference, not an adopted production runtime.

**Verification limit:** source inspection only; no upstream tests or provider calls were executed. This scoped review does not certify every file in the repository.

<!-- teamagent-analysis:start -->
Analysis metadata: source [nvidia-nemo-labs-molt](https://github.com/NVIDIA-NeMo/labs-molt); analyzed commit `726f16fcc5080540430574377090a80d7df5eda0`; commit date 2026-10-24T10:23:37+08:00; review date 2026-10-28T08:47:42.123Z; depth screened. [Maintenance record](../analyses/repos/ai-agents--nvidia-nemo-labs-molt.md).
<!-- teamagent-analysis:end -->
