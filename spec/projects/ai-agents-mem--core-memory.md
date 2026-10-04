# core-memory

Source: [core-memory](https://github.com/JohnnyFiv3r/Core-Memory) · Category: [ai-agents-mem](../categories/ai-agents-mem.md)

Review depth: **inventory / README screening only**. This is an individual coverage record, not a source-code correctness audit or adoption recommendation.

Snapshot: `b3857ff5c771d8c2b17ed2d19326de1fac19dbfd`; commit timestamp `2026-08-06T14:26:39-05:00`; 1,187 tracked paths.

## Scope and evidence

Upstream description excerpt (a project claim, automatically extracted from [README](https://github.com/JohnnyFiv3r/Core-Memory/blob/b3857ff5c771d8c2b17ed2d19326de1fac19dbfd/README.md)):

> Structured memory objects + causal trace over durable events — so agents can recall  why , not just  what . Give your AI agents persistent memory built for the way conversations actually work. Core Memory is a plug and play, self-hosted conversational memory MCP server that captures each turn as a memory object, builds causal links as the dialogue unfolds, and recalls with full evidence. Works with Claude Code, Cursor, ChatGPT, or any MCP-compatible client.

Build/package evidence: [plugins/openclaw-core-memory-bridge/package.json](https://github.com/JohnnyFiv3r/Core-Memory/blob/b3857ff5c771d8c2b17ed2d19326de1fac19dbfd/plugins/openclaw-core-memory-bridge/package.json); [pyproject.toml](https://github.com/JohnnyFiv3r/Core-Memory/blob/b3857ff5c771d8c2b17ed2d19326de1fac19dbfd/pyproject.toml)

License evidence: [LICENSE](https://github.com/JohnnyFiv3r/Core-Memory/blob/b3857ff5c771d8c2b17ed2d19326de1fac19dbfd/LICENSE) Classification hint: Apache-2.0. A root license does not establish rights for every bundled asset, model, or dependency.

## Harness assessment

This entry was catalogued under **ai-agents-mem**. Its category places it in the candidate set for memory, evolution; those associations are navigational and have not been individually validated as implemented capabilities. See [memory](../memory.md) · [evolution](../evolution.md) for the source-reviewed alternatives and proposed integration boundaries.

**Disposition:** retain as a comparison candidate. Before adopting it, inspect the implementation entry point and its tests, verify the required protocol and deployment platform, and reproduce a task from the harness evaluation suite. Popularity, a README feature list, and the presence of a package manifest are insufficient evidence of quality or compatibility.

**Unresolved:** runtime behavior, security boundaries, performance, API/subscription eligibility, dependency health, maintenance status, and fit to the proposed harness were not independently established for this entry. No repository code was executed as part of this screening.
