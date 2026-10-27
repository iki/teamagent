# zeroclaw

Source: [zeroclaw](https://github.com/zeroclaw-labs/zeroclaw) · Category: [ai-agents](../categories/ai-agents.md)

Review depth: **inventory / README screening only**. This is an individual coverage record, not a source-code correctness audit or adoption recommendation.

Snapshot: `e9ba349316e1554271711513a8f3a30fd4c5742c`; commit timestamp `2026-10-03T17:54:08Z`; 2,176 tracked paths.

## Scope and evidence

Upstream description excerpt (a project claim, automatically extracted from [README](https://github.com/zeroclaw-labs/zeroclaw/blob/e9ba349316e1554271711513a8f3a30fd4c5742c/README.md)):

> You own the agent. You own the data. You own the machine it runs on. ZeroClaw is an agent runtime — a single Rust binary you configure and run. It talks to LLM providers (Anthropic, OpenAI, Ollama, and ~20 others), reaches the world through 30+ channels (Discord, Telegram, Matrix, email, voice, webhooks, your own CLI), and acts through tools (shell, browser, HTTP, hardware, custom MCP servers). Everything runs on your machine, with your keys, in your workspace.

Build/package evidence: [Cargo.toml](https://github.com/zeroclaw-labs/zeroclaw/blob/e9ba349316e1554271711513a8f3a30fd4c5742c/Cargo.toml); [apps/tauri/Cargo.toml](https://github.com/zeroclaw-labs/zeroclaw/blob/e9ba349316e1554271711513a8f3a30fd4c5742c/apps/tauri/Cargo.toml); [apps/zerocode/Cargo.toml](https://github.com/zeroclaw-labs/zeroclaw/blob/e9ba349316e1554271711513a8f3a30fd4c5742c/apps/zerocode/Cargo.toml); [apps/zerorelay/Cargo.toml](https://github.com/zeroclaw-labs/zeroclaw/blob/e9ba349316e1554271711513a8f3a30fd4c5742c/apps/zerorelay/Cargo.toml); [crates/zeroclaw-api/Cargo.toml](https://github.com/zeroclaw-labs/zeroclaw/blob/e9ba349316e1554271711513a8f3a30fd4c5742c/crates/zeroclaw-api/Cargo.toml)

License evidence: [LICENSE-APACHE](https://github.com/zeroclaw-labs/zeroclaw/blob/e9ba349316e1554271711513a8f3a30fd4c5742c/LICENSE-APACHE); [LICENSE-MIT](https://github.com/zeroclaw-labs/zeroclaw/blob/e9ba349316e1554271711513a8f3a30fd4c5742c/LICENSE-MIT) Classification hint: Apache-2.0. A root license does not establish rights for every bundled asset, model, or dependency.

## Harness assessment

This entry was catalogued under **ai-agents**. Its category places it in the candidate set for agents, models, channels; those associations are navigational and have not been individually validated as implemented capabilities. See [agents](../agents.md) · [models](../models.md) · [channels](../channels.md) for the source-reviewed alternatives and proposed integration boundaries.

**Disposition:** retain as a comparison candidate. Before adopting it, inspect the implementation entry point and its tests, verify the required protocol and deployment platform, and reproduce a task from the harness evaluation suite. Popularity, a README feature list, and the presence of a package manifest are insufficient evidence of quality or compatibility.

**Unresolved:** runtime behavior, security boundaries, performance, API/subscription eligibility, dependency health, maintenance status, and fit to the proposed harness were not independently established for this entry. No repository code was executed as part of this screening.

<!-- teamagent-analysis:start -->
Analysis metadata: source [zeroclaw](https://github.com/zeroclaw-labs/zeroclaw); analyzed commit `e9ba349316e1554271711513a8f3a30fd4c5742c`; commit date 2026-10-03T17:54:08Z; review date unknown; depth screened. [Maintenance record](../analyses/repos/ai-agents--zeroclaw.md).
<!-- teamagent-analysis:end -->
