# berd

Source: [berd](https://github.com/block/berd) · Category: [ai-agents](../categories/ai-agents.md)

Review depth: **inventory / README screening only**. This is an individual coverage record, not a source-code correctness audit or adoption recommendation.

Snapshot: `81ca89585f68f4d85e7dccf3a4842e401acf18e4`; commit timestamp `2026-09-28T16:21:25-07:00`; 2,559 tracked paths.

## Scope and evidence

Upstream description excerpt (a project claim, automatically extracted from [README](https://github.com/block/berd/blob/81ca89585f68f4d85e7dccf3a4842e401acf18e4/README.md)):

> Berd is an open-source desktop app for working with AI agents. It is built with Tauri 2 and React 19 and talks to the upstream Goose backend through the ACP

Build/package evidence: [bb-cli/Cargo.toml](https://github.com/block/berd/blob/81ca89585f68f4d85e7dccf3a4842e401acf18e4/bb-cli/Cargo.toml); [crates/builderbot-auth/Cargo.toml](https://github.com/block/berd/blob/81ca89585f68f4d85e7dccf3a4842e401acf18e4/crates/builderbot-auth/Cargo.toml); [package.json](https://github.com/block/berd/blob/81ca89585f68f4d85e7dccf3a4842e401acf18e4/package.json); [scripts/release/updater-signature-verifier/Cargo.toml](https://github.com/block/berd/blob/81ca89585f68f4d85e7dccf3a4842e401acf18e4/scripts/release/updater-signature-verifier/Cargo.toml); [sdk/package.json](https://github.com/block/berd/blob/81ca89585f68f4d85e7dccf3a4842e401acf18e4/sdk/package.json)

License evidence: [LICENSE](https://github.com/block/berd/blob/81ca89585f68f4d85e7dccf3a4842e401acf18e4/LICENSE) Classification hint: Apache-2.0. A root license does not establish rights for every bundled asset, model, or dependency.

## Harness assessment

This entry was catalogued under **ai-agents**. Its category places it in the candidate set for agents, models, channels; those associations are navigational and have not been individually validated as implemented capabilities. See [agents](../agents.md) · [models](../models.md) · [channels](../channels.md) for the source-reviewed alternatives and proposed integration boundaries.

**Disposition:** retain as a comparison candidate. Before adopting it, inspect the implementation entry point and its tests, verify the required protocol and deployment platform, and reproduce a task from the harness evaluation suite. Popularity, a README feature list, and the presence of a package manifest are insufficient evidence of quality or compatibility.

**Unresolved:** runtime behavior, security boundaries, performance, API/subscription eligibility, dependency health, maintenance status, and fit to the proposed harness were not independently established for this entry. No repository code was executed as part of this screening.
