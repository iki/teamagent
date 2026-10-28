# eve

Source: [eve](https://github.com/vercel/eve) · Category: [ai-agents](../categories/ai-agents.md)

Review depth: **inventory / README screening only**. This is an individual coverage record, not a source-code correctness audit or adoption recommendation.

Snapshot: `6c2e941946383a7a3d1f8f90b5bc6828de40c724`; commit timestamp `2026-10-03T15:08:36-04:00`; 5,782 tracked paths.

## Scope and evidence

Upstream description excerpt (a project claim, automatically extracted from [README](https://github.com/vercel/eve/blob/6c2e941946383a7a3d1f8f90b5bc6828de40c724/README.md)):

> eve is a filesystem-first framework for durable AI agents. Core agent capabilities live in conventional locations, so projects are easier to inspect, extend, and operate.

Build/package evidence: [apps/benchmarks/lib/setups/mock-imessage-setup/package.json](https://github.com/vercel/eve/blob/6c2e941946383a7a3d1f8f90b5bc6828de40c724/apps/benchmarks/lib/setups/mock-imessage-setup/package.json); [apps/benchmarks/package.json](https://github.com/vercel/eve/blob/6c2e941946383a7a3d1f8f90b5bc6828de40c724/apps/benchmarks/package.json); [apps/docs/package.json](https://github.com/vercel/eve/blob/6c2e941946383a7a3d1f8f90b5bc6828de40c724/apps/docs/package.json); [apps/fixtures/agent-tui-client/package.json](https://github.com/vercel/eve/blob/6c2e941946383a7a3d1f8f90b5bc6828de40c724/apps/fixtures/agent-tui-client/package.json); [apps/fixtures/datadog-eval-reporter/package.json](https://github.com/vercel/eve/blob/6c2e941946383a7a3d1f8f90b5bc6828de40c724/apps/fixtures/datadog-eval-reporter/package.json)

License evidence: [LICENSE](https://github.com/vercel/eve/blob/6c2e941946383a7a3d1f8f90b5bc6828de40c724/LICENSE) Classification hint: Apache-2.0. A root license does not establish rights for every bundled asset, model, or dependency.

## Harness assessment

This entry was catalogued under **ai-agents**. Its category places it in the candidate set for agents, models, channels; those associations are navigational and have not been individually validated as implemented capabilities. See [agents](../agents.md) · [models](../models.md) · [channels](../channels.md) for the source-reviewed alternatives and proposed integration boundaries.

**Disposition:** retain as a comparison candidate. Before adopting it, inspect the implementation entry point and its tests, verify the required protocol and deployment platform, and reproduce a task from the harness evaluation suite. Popularity, a README feature list, and the presence of a package manifest are insufficient evidence of quality or compatibility.

**Unresolved:** runtime behavior, security boundaries, performance, API/subscription eligibility, dependency health, maintenance status, and fit to the proposed harness were not independently established for this entry. No repository code was executed as part of this screening.
