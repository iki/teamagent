# xx-2604-spawn-agent

Source: [xx-2604-spawn-agent](https://github.com/millionco/spawn-agent) · Category: [ai-agents](../categories/ai-agents.md)

Review depth: **inventory / README screening only**. This is an individual coverage record, not a source-code correctness audit or adoption recommendation.

Snapshot: `f0769c6209876059ec524b436ba606710ee9df6f`; commit timestamp `2026-04-25T23:08:40-07:00`; 94 tracked paths.

## Scope and evidence

Upstream description excerpt (a project claim, automatically extracted from [README](https://github.com/millionco/spawn-agent/blob/f0769c6209876059ec524b436ba606710ee9df6f/README.md)):

> A Vercel AI SDK provider for Claude Code, Codex, Cursor, GitHub Copilot, Gemini, OpenCode, Factory Droid, and Pi — streamed over the Agent Client Protocol. Pass settings inline at the call site, or build a pre-configured provider with `createSpawnAgent`:

Build/package evidence: [apps/playground/package.json](https://github.com/millionco/spawn-agent/blob/f0769c6209876059ec524b436ba606710ee9df6f/apps/playground/package.json); [package.json](https://github.com/millionco/spawn-agent/blob/f0769c6209876059ec524b436ba606710ee9df6f/package.json); [packages/spawn-agent/package.json](https://github.com/millionco/spawn-agent/blob/f0769c6209876059ec524b436ba606710ee9df6f/packages/spawn-agent/package.json)

License evidence: [LICENSE](https://github.com/millionco/spawn-agent/blob/f0769c6209876059ec524b436ba606710ee9df6f/LICENSE) Classification hint: MIT. A root license does not establish rights for every bundled asset, model, or dependency.

## Harness assessment

This entry was catalogued under **ai-agents**. Its category places it in the candidate set for agents, models, channels; those associations are navigational and have not been individually validated as implemented capabilities. See [agents](../agents.md) · [models](../models.md) · [channels](../channels.md) for the source-reviewed alternatives and proposed integration boundaries.

**Disposition:** retain as a comparison candidate. Before adopting it, inspect the implementation entry point and its tests, verify the required protocol and deployment platform, and reproduce a task from the harness evaluation suite. Popularity, a README feature list, and the presence of a package manifest are insufficient evidence of quality or compatibility.

**Unresolved:** runtime behavior, security boundaries, performance, API/subscription eligibility, dependency health, maintenance status, and fit to the proposed harness were not independently established for this entry. No repository code was executed as part of this screening.
