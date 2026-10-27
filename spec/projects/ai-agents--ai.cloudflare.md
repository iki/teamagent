# ai.cloudflare

Source: [ai.cloudflare](https://github.com/cloudflare/ai) · Category: [ai-agents](../categories/ai-agents.md)

Review depth: **inventory / README screening only**. This is an individual coverage record, not a source-code correctness audit or adoption recommendation.

Snapshot: `0e5bc3b2f489e4b8215905812a36fe69d37afb8d`; commit timestamp `2026-09-11T16:53:10+01:00`; 835 tracked paths.

## Scope and evidence

Upstream description excerpt (a project claim, automatically extracted from [README](https://github.com/cloudflare/ai/blob/0e5bc3b2f489e4b8215905812a36fe69d37afb8d/README.md)):

> Packages and examples for building AI-powered applications on Cloudflare. Includes providers for the Vercel AI SDK and TanStack AI, with support for Workers AI, AI Gateway, and AI Search. The `demos/` directory contains additional focused demos for specific patterns — tool calling, structured output, agents, MCP servers, and more.

Build/package evidence: [demos/agent-scheduler/package.json](https://github.com/cloudflare/ai/blob/0e5bc3b2f489e4b8215905812a36fe69d37afb8d/demos/agent-scheduler/package.json); [demos/agent-task-manager-human-in-the-loop/package.json](https://github.com/cloudflare/ai/blob/0e5bc3b2f489e4b8215905812a36fe69d37afb8d/demos/agent-task-manager-human-in-the-loop/package.json); [demos/agent-task-manager/package.json](https://github.com/cloudflare/ai/blob/0e5bc3b2f489e4b8215905812a36fe69d37afb8d/demos/agent-task-manager/package.json); [demos/evaluator-optimiser/package.json](https://github.com/cloudflare/ai/blob/0e5bc3b2f489e4b8215905812a36fe69d37afb8d/demos/evaluator-optimiser/package.json); [demos/hello-world/package.json](https://github.com/cloudflare/ai/blob/0e5bc3b2f489e4b8215905812a36fe69d37afb8d/demos/hello-world/package.json)

License evidence: [LICENSE](https://github.com/cloudflare/ai/blob/0e5bc3b2f489e4b8215905812a36fe69d37afb8d/LICENSE) Classification hint: MIT. A root license does not establish rights for every bundled asset, model, or dependency.

## Harness assessment

This entry was catalogued under **ai-agents**. Its category places it in the candidate set for agents, models, channels; those associations are navigational and have not been individually validated as implemented capabilities. See [agents](../agents.md) · [models](../models.md) · [channels](../channels.md) for the source-reviewed alternatives and proposed integration boundaries.

**Disposition:** retain as a comparison candidate. Before adopting it, inspect the implementation entry point and its tests, verify the required protocol and deployment platform, and reproduce a task from the harness evaluation suite. Popularity, a README feature list, and the presence of a package manifest are insufficient evidence of quality or compatibility.

**Unresolved:** runtime behavior, security boundaries, performance, API/subscription eligibility, dependency health, maintenance status, and fit to the proposed harness were not independently established for this entry. No repository code was executed as part of this screening.

<!-- teamagent-analysis:start -->
Analysis metadata: source [ai.cloudflare](https://github.com/cloudflare/ai); analyzed commit `0e5bc3b2f489e4b8215905812a36fe69d37afb8d`; commit date 2026-09-11T16:53:10+01:00; review date unknown; depth screened. [Maintenance record](../analyses/repos/ai-agents--ai.cloudflare.md).
<!-- teamagent-analysis:end -->
