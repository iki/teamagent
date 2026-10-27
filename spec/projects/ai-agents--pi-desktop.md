# pi-desktop

Source: [pi-desktop](https://github.com/vastsa/PI-Desktop) · Category: [ai-agents](../categories/ai-agents.md)

Review depth: **inventory / README screening only**. This is an individual coverage record, not a source-code correctness audit or adoption recommendation.

Snapshot: `c79b6ca564ab46355b99a2818d364574433ab1c4`; commit timestamp `2026-10-04T02:32:05+09:00`; 3,130 tracked paths.

## Scope and evidence

Upstream description excerpt (a project claim, automatically extracted from [README](https://github.com/vastsa/PI-Desktop/blob/c79b6ca564ab46355b99a2818d364574433ab1c4/README.md)):

> Bring projects, agents, models, plugins, and workflows into one persistent desktop environment. Local-first · Model-agnostic · Plugin-powered · macOS / Windows / Linux

Build/package evidence: [Cargo.toml](https://github.com/vastsa/PI-Desktop/blob/c79b6ca564ab46355b99a2818d364574433ab1c4/Cargo.toml); [apps/desktop/package.json](https://github.com/vastsa/PI-Desktop/blob/c79b6ca564ab46355b99a2818d364574433ab1c4/apps/desktop/package.json); [apps/desktop/resources/plugins/pi.file-manager/package.json](https://github.com/vastsa/PI-Desktop/blob/c79b6ca564ab46355b99a2818d364574433ab1c4/apps/desktop/resources/plugins/pi.file-manager/package.json); [apps/pi-host/package.json](https://github.com/vastsa/PI-Desktop/blob/c79b6ca564ab46355b99a2818d364574433ab1c4/apps/pi-host/package.json); [crates/host-core/Cargo.toml](https://github.com/vastsa/PI-Desktop/blob/c79b6ca564ab46355b99a2818d364574433ab1c4/crates/host-core/Cargo.toml)

License evidence: [LICENSE](https://github.com/vastsa/PI-Desktop/blob/c79b6ca564ab46355b99a2818d364574433ab1c4/LICENSE) Classification hint: GPL; inspect version. A root license does not establish rights for every bundled asset, model, or dependency.

## Harness assessment

This entry was catalogued under **ai-agents**. Its category places it in the candidate set for agents, models, channels; those associations are navigational and have not been individually validated as implemented capabilities. See [agents](../agents.md) · [models](../models.md) · [channels](../channels.md) for the source-reviewed alternatives and proposed integration boundaries.

**Disposition:** retain as a comparison candidate. Before adopting it, inspect the implementation entry point and its tests, verify the required protocol and deployment platform, and reproduce a task from the harness evaluation suite. Popularity, a README feature list, and the presence of a package manifest are insufficient evidence of quality or compatibility.

**Unresolved:** runtime behavior, security boundaries, performance, API/subscription eligibility, dependency health, maintenance status, and fit to the proposed harness were not independently established for this entry. No repository code was executed as part of this screening.

<!-- teamagent-analysis:start -->
Analysis metadata: source [pi-desktop](https://github.com/vastsa/PI-Desktop); analyzed commit `c79b6ca564ab46355b99a2818d364574433ab1c4`; commit date 2026-10-04T02:32:05+09:00; review date unknown; depth screened. [Maintenance record](../analyses/repos/ai-agents--pi-desktop.md).
<!-- teamagent-analysis:end -->
