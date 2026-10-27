# terminal-bench

Source: [terminal-bench](https://github.com/harbor-framework/terminal-bench) · Category: [ai-agents](../categories/ai-agents.md)

Review depth: **inventory / README screening only**. This is an individual coverage record, not a source-code correctness audit or adoption recommendation.

Snapshot: `1dcda8716784493721921c23e4bc7f7d988b4494`; commit timestamp `2026-09-28T19:22:01-07:00`; 4,269 tracked paths.

## Scope and evidence

Upstream description excerpt (a project claim, automatically extracted from [README](https://github.com/harbor-framework/terminal-bench/blob/1dcda8716784493721921c23e4bc7f7d988b4494/README.md)):

> Terminal-Bench is a benchmark designed to measure the frontier of agent work with a diverse, difficult, high quality set of tasks that evolve over time. All frontier agent builders use Terminal-Bench to track progress and compare capabilities. Terminal-Bench is a continuous benchmark, with tagged releases published on the Harbor Hub. Open an issue to report any task bugs and open a PR for task improvements or new tasks. Our roadmap is publicly visible.

Build/package evidence: [archive/modernize-scientific-stack/environment/pyproject.toml](https://github.com/harbor-framework/terminal-bench/blob/1dcda8716784493721921c23e4bc7f7d988b4494/archive/modernize-scientific-stack/environment/pyproject.toml); [leaderboard/pyproject.toml](https://github.com/harbor-framework/terminal-bench/blob/1dcda8716784493721921c23e4bc7f7d988b4494/leaderboard/pyproject.toml); [scripts/fortify/pyproject.toml](https://github.com/harbor-framework/terminal-bench/blob/1dcda8716784493721921c23e4bc7f7d988b4494/scripts/fortify/pyproject.toml); [tasks/bun-sourcemap-leak/environment/package.json](https://github.com/harbor-framework/terminal-bench/blob/1dcda8716784493721921c23e4bc7f7d988b4494/tasks/bun-sourcemap-leak/environment/package.json); [tasks/cumulative-layout-shift/environment/barber-shop-data-backend/package.json](https://github.com/harbor-framework/terminal-bench/blob/1dcda8716784493721921c23e4bc7f7d988b4494/tasks/cumulative-layout-shift/environment/barber-shop-data-backend/package.json)

License evidence: [LICENSE](https://github.com/harbor-framework/terminal-bench/blob/1dcda8716784493721921c23e4bc7f7d988b4494/LICENSE) Classification hint: Apache-2.0. A root license does not establish rights for every bundled asset, model, or dependency.

## Harness assessment

This entry was catalogued under **ai-agents**. Its category places it in the candidate set for agents, models, channels; those associations are navigational and have not been individually validated as implemented capabilities. See [agents](../agents.md) · [models](../models.md) · [channels](../channels.md) for the source-reviewed alternatives and proposed integration boundaries.

**Disposition:** retain as a comparison candidate. Before adopting it, inspect the implementation entry point and its tests, verify the required protocol and deployment platform, and reproduce a task from the harness evaluation suite. Popularity, a README feature list, and the presence of a package manifest are insufficient evidence of quality or compatibility.

**Unresolved:** runtime behavior, security boundaries, performance, API/subscription eligibility, dependency health, maintenance status, and fit to the proposed harness were not independently established for this entry. No repository code was executed as part of this screening.

<!-- teamagent-analysis:start -->
Analysis metadata: source [terminal-bench](https://github.com/harbor-framework/terminal-bench); analyzed commit `1dcda8716784493721921c23e4bc7f7d988b4494`; commit date 2026-09-28T19:22:01-07:00; review date unknown; depth screened. [Maintenance record](../analyses/repos/ai-agents--terminal-bench.md).
<!-- teamagent-analysis:end -->
