# deepscientist

Source: [deepscientist](https://github.com/ResearAI/DeepScientist) · Category: [ai-agents](../categories/ai-agents.md)

Review depth: **inventory / README screening only**. This is an individual coverage record, not a source-code correctness audit or adoption recommendation.

Snapshot: `b36624417f0c6b8238ec02db37b94d6db2faa5b0`; commit timestamp `2026-06-28T16:38:33Z`; 2,530 tracked paths.

## Scope and evidence

Upstream description excerpt (a project claim, automatically extracted from [README](https://github.com/ResearAI/DeepScientist/blob/b36624417f0c6b8238ec02db37b94d6db2faa5b0/README.md)):

> May 12 update:  v1.6.0 is available with Claude Code, OpenCode, Kimi Code, BenchStore, and science evidence workflows. Unlike one-shot **AI Scientist** or **autoresearch-style systems**, DeepScientist is a **local-first autonomous research studio** that keeps the full loop moving on your machine, from **baselines** and **experiment rounds** to **paper-ready outputs**, with a **10-minute setup**. Powered by **Findings Memory**, **Bayesian optimization**, and the **Research Map**, it keeps turning each new result into the next starting point and 

Build/package evidence: [assets/connectors/lingzhu/openclaw-bridge/package.json](https://github.com/ResearAI/DeepScientist/blob/b36624417f0c6b8238ec02db37b94d6db2faa5b0/assets/connectors/lingzhu/openclaw-bridge/package.json); [package.json](https://github.com/ResearAI/DeepScientist/blob/b36624417f0c6b8238ec02db37b94d6db2faa5b0/package.json); [pyproject.toml](https://github.com/ResearAI/DeepScientist/blob/b36624417f0c6b8238ec02db37b94d6db2faa5b0/pyproject.toml); [src/tui/package.json](https://github.com/ResearAI/DeepScientist/blob/b36624417f0c6b8238ec02db37b94d6db2faa5b0/src/tui/package.json); [src/ui/package.json](https://github.com/ResearAI/DeepScientist/blob/b36624417f0c6b8238ec02db37b94d6db2faa5b0/src/ui/package.json)

License evidence: [LICENSE](https://github.com/ResearAI/DeepScientist/blob/b36624417f0c6b8238ec02db37b94d6db2faa5b0/LICENSE) Classification hint: Apache-2.0. A root license does not establish rights for every bundled asset, model, or dependency.

## Harness assessment

This entry was catalogued under **ai-agents**. Its category places it in the candidate set for agents, models, channels; those associations are navigational and have not been individually validated as implemented capabilities. See [agents](../agents.md) · [models](../models.md) · [channels](../channels.md) for the source-reviewed alternatives and proposed integration boundaries.

**Disposition:** retain as a comparison candidate. Before adopting it, inspect the implementation entry point and its tests, verify the required protocol and deployment platform, and reproduce a task from the harness evaluation suite. Popularity, a README feature list, and the presence of a package manifest are insufficient evidence of quality or compatibility.

**Unresolved:** runtime behavior, security boundaries, performance, API/subscription eligibility, dependency health, maintenance status, and fit to the proposed harness were not independently established for this entry. No repository code was executed as part of this screening.
