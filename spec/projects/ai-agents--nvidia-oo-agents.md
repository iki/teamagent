# nvidia-oo-agents

Source: [nvidia-oo-agents](https://github.com/nvidia-nemo/labs-OO-Agents) · Category: [ai-agents](../categories/ai-agents.md)

Original review depth: **inventory / README screening only**. The dated update review below has its own explicit scope. This is an individual coverage record, not a source-code correctness audit or adoption recommendation.

Snapshot: `564a34014a354f11009cf7dda44a81b039a04273`; commit timestamp `2026-10-02T17:03:43+02:00`; 1,470 tracked paths.

## Scope and evidence

Upstream description excerpt (a project claim, automatically extracted from [README](https://github.com/nvidia-nemo/labs-OO-Agents/blob/564a34014a354f11009cf7dda44a81b039a04273/README.md)):

> [](https://developer.nvidia.com/blog/six-agent-harness-capabilities-for-higher-model-performance/) [](https://github.com/NVIDIA-NeMo/labs-OO-Agents/blob/main/LICENSE)

Build/package evidence: [examples/cybergym/pyproject.toml](https://github.com/nvidia-nemo/labs-OO-Agents/blob/564a34014a354f11009cf7dda44a81b039a04273/examples/cybergym/pyproject.toml); [packages/nooa-acp/pyproject.toml](https://github.com/nvidia-nemo/labs-OO-Agents/blob/564a34014a354f11009cf7dda44a81b039a04273/packages/nooa-acp/pyproject.toml); [packages/nooa-bench/pyproject.toml](https://github.com/nvidia-nemo/labs-OO-Agents/blob/564a34014a354f11009cf7dda44a81b039a04273/packages/nooa-bench/pyproject.toml); [packages/nooa-cli/pyproject.toml](https://github.com/nvidia-nemo/labs-OO-Agents/blob/564a34014a354f11009cf7dda44a81b039a04273/packages/nooa-cli/pyproject.toml); [packages/nooa-memory/pyproject.toml](https://github.com/nvidia-nemo/labs-OO-Agents/blob/564a34014a354f11009cf7dda44a81b039a04273/packages/nooa-memory/pyproject.toml)

License evidence: [LICENSE](https://github.com/nvidia-nemo/labs-OO-Agents/blob/564a34014a354f11009cf7dda44a81b039a04273/LICENSE) Classification hint: Apache-2.0. A root license does not establish rights for every bundled asset, model, or dependency.

## Harness assessment

This entry was catalogued under **ai-agents**. Its category places it in the candidate set for agents, models, channels; those associations are navigational and have not been individually validated as implemented capabilities. See [agents](../agents.md) · [models](../models.md) · [channels](../channels.md) for the source-reviewed alternatives and proposed integration boundaries.

**Disposition:** retain as a comparison candidate. Before adopting it, inspect the implementation entry point and its tests, verify the required protocol and deployment platform, and reproduce a task from the harness evaluation suite. Popularity, a README feature list, and the presence of a package manifest are insufficient evidence of quality or compatibility.

**Unresolved:** runtime behavior, security boundaries, performance, API/subscription eligibility, dependency health, maintenance status, and fit to the proposed harness were not independently established for this entry. No repository code was executed as part of this screening.

## 2026-10-28 scoped update review

Reviewed commit `bff0ef449f9bd74ddbb19486489f95c0edc73831` (commit date `2026-10-22T16:06:28+02:00`). The original snapshot above remains historical evidence.

**Scope:** Channel buffering/consumption, race arbitration, job cancellation/shutdown and the small channel-status delta; actor execution, event-manager persistence and full concurrency fixtures were not audited.

The local [delta](https://github.com/nvidia-nemo/labs-OO-Agents/blob/bff0ef449f9bd74ddbb19486489f95c0edc73831/src/nooa/runtime/channels.py#L853-L896) adds an explicit empty-status string. The surrounding [channel implementation](https://github.com/nvidia-nemo/labs-OO-Agents/blob/bff0ef449f9bd74ddbb19486489f95c0edc73831/src/nooa/runtime/channels.py#L212-L373) distinguishes queued input from event-mode notifications. Items remain in the deque until a consumer resumes, so cancelling a waiting future does not strand an already-transferred item. Queue storage and waiter storage are unbounded in this class; event-mode publication is not itself a durable processing acknowledgment.

The [race path](https://github.com/nvidia-nemo/labs-OO-Agents/blob/bff0ef449f9bd74ddbb19486489f95c0edc73831/src/nooa/runtime/channels.py#L899-L1040) restores completed loser items and signals consumption only for its chosen winner. Registration order decides among simultaneously ready channels, so the policy is deterministic but does not promise fairness under a permanently busy earlier channel. Ordinary losing-task exceptions are caught while restoring losers; the implementation does not propagate every possible loser failure despite the broader docstring wording. This is a source observation, not an exercised concurrency failure.

[Job handles](https://github.com/nvidia-nemo/labs-OO-Agents/blob/bff0ef449f9bd74ddbb19486489f95c0edc73831/src/nooa/runtime/channels.py#L115-L160) offer no buffering, unbounded buffering or a bounded ring, and await cancellation unwind while suppressing ordinary cleanup errors. Shutdown clears its registry then awaits handles sequentially without a deadline at this layer. Retain explicit input consumption and resource ownership patterns, but require bounded admission, fairness where needed, surfaced producer/cleanup failures and durable task acknowledgments before applying this design to Teamagent channels.

**Verification limit:** source inspection only; no upstream tests or provider calls were executed. This scoped review does not certify every file in the repository.

<!-- teamagent-analysis:start -->
Analysis metadata: source [nvidia-oo-agents](https://github.com/nvidia-nemo/labs-OO-Agents); analyzed commit `bff0ef449f9bd74ddbb19486489f95c0edc73831`; commit date 2026-10-22T16:06:28+02:00; review date 2026-10-28T08:47:42.123Z; depth screened. [Maintenance record](../analyses/repos/ai-agents--nvidia-oo-agents.md).
<!-- teamagent-analysis:end -->
