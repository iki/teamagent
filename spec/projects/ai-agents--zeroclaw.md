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

## 2026-10-28 scoped source review

Source: [zeroclaw](https://github.com/zeroclaw-labs/zeroclaw); inspected saved discovery revision `99bd353c756f4e64f381cfe9c3002ebff32f3055`. Prior analyzed revision `e9ba349316e1554271711513a8f3a30fd4c5742c` remains historical evidence.

**Scope:** Complete agent event/artifact API with embedded tests, plus channel binding planning/application section 300–594. Transport enforcement, disk save, grant canonicalizer, artifact delivery and usage consumers were not reviewed.

The [event contract](https://github.com/zeroclaw-labs/zeroclaw/blob/99bd353c756f4e64f381cfe9c3002ebff32f3055/crates/zeroclaw-api/src/agent.rs#L59-L248) separates provider counts, estimates and calibrated counts; missing usage is unavailable rather than zero, rejected physical attempts remain billing telemetry, and cached input is a subset rather than an additive total. It also documents that a dynamic routing model may retain its requested name when the provider trait cannot expose the concrete served model. These are precise accounting requirements, not proof that every downstream consumer follows them.

[Structured artifact projection](https://github.com/zeroclaw-labs/zeroclaw/blob/99bd353c756f4e64f381cfe9c3002ebff32f3055/crates/zeroclaw-api/src/agent.rs#L5-L57) avoids deriving an attachment path from free-form tool text. However, it only requires `delivered: true` and a nonempty path, defaulting other fields; it does not itself validate containment, file identity, size or authorization. Embedded tests verify projection and missing-path rejection, not delivery safety.

The [channel binding planner](https://github.com/zeroclaw-labs/zeroclaw/blob/99bd353c756f4e64f381cfe9c3002ebff32f3055/src/plugins/channel_instance.rs#L300-L535) distinguishes manifest declarations from grants, refuses degraded configuration or another package's alias, requires an explicit decision for a new usable egress row, and leaves an existing row unextended. [Application](https://github.com/zeroclaw-labs/zeroclaw/blob/99bd353c756f4e64f381cfe9c3002ebff32f3055/src/plugins/channel_instance.rs#L537-L589) checks for newly appeared rows and leaves private-address exceptions operator-authored. It mutates configuration in sequence and delegates saving to the caller; it is not evidence of an atomic disk transaction or enforced network filtering. Teamagent should reuse these distinctions with admission/version checks and validated artifact handles. No upstream tests, channel traffic or provider calls were executed.

<!-- teamagent-analysis:start -->
Analysis metadata: source [zeroclaw](https://github.com/zeroclaw-labs/zeroclaw); analyzed commit `99bd353c756f4e64f381cfe9c3002ebff32f3055`; commit date 2026-10-27T14:28:05Z; review date 2026-10-28T09:27:32.685Z; depth screened. [Maintenance record](../analyses/repos/ai-agents--zeroclaw.md).
<!-- teamagent-analysis:end -->
