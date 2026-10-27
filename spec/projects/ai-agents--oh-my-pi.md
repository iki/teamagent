# oh-my-pi

Source: [oh-my-pi](https://github.com/can1357/oh-my-pi) · Category: [ai-agents](../categories/ai-agents.md)

Review depth: **inventory / README screening only**. This is an individual coverage record, not a source-code correctness audit or adoption recommendation.

Snapshot: `d4d49e71bef3ac1420d45febf215b951decf5ae9`; commit timestamp `2026-10-03T20:14:39+02:00`; 8,648 tracked paths.

## Scope and evidence

Upstream description excerpt (a project claim, automatically extracted from [README](https://github.com/can1357/oh-my-pi/blob/d4d49e71bef3ac1420d45febf215b951decf5ae9/README.md)):

> The most capable agent surface that ships. Continuously tuned by real-world use — complete out of the box, open all the way down. 60+** providers · **31** built-in tools · **14** lsp ops · **28** dap ops · **~80k** lines of Rust core.

Build/package evidence: [.omp/tools/package.json](https://github.com/can1357/oh-my-pi/blob/d4d49e71bef3ac1420d45febf215b951decf5ae9/.omp/tools/package.json); [Cargo.toml](https://github.com/can1357/oh-my-pi/blob/d4d49e71bef3ac1420d45febf215b951decf5ae9/Cargo.toml); [crates/pi-ast/Cargo.toml](https://github.com/can1357/oh-my-pi/blob/d4d49e71bef3ac1420d45febf215b951decf5ae9/crates/pi-ast/Cargo.toml); [crates/pi-builtins/Cargo.toml](https://github.com/can1357/oh-my-pi/blob/d4d49e71bef3ac1420d45febf215b951decf5ae9/crates/pi-builtins/Cargo.toml); [crates/pi-diff/Cargo.toml](https://github.com/can1357/oh-my-pi/blob/d4d49e71bef3ac1420d45febf215b951decf5ae9/crates/pi-diff/Cargo.toml)

License evidence: [LICENSE](https://github.com/can1357/oh-my-pi/blob/d4d49e71bef3ac1420d45febf215b951decf5ae9/LICENSE) Classification hint: MIT. A root license does not establish rights for every bundled asset, model, or dependency.

## Harness assessment

This entry was catalogued under **ai-agents**. Its category places it in the candidate set for agents, models, channels; those associations are navigational and have not been individually validated as implemented capabilities. See [agents](../agents.md) · [models](../models.md) · [channels](../channels.md) for the source-reviewed alternatives and proposed integration boundaries.

**Disposition:** retain as a comparison candidate. Before adopting it, inspect the implementation entry point and its tests, verify the required protocol and deployment platform, and reproduce a task from the harness evaluation suite. Popularity, a README feature list, and the presence of a package manifest are insufficient evidence of quality or compatibility.

**Unresolved:** runtime behavior, security boundaries, performance, API/subscription eligibility, dependency health, maintenance status, and fit to the proposed harness were not independently established for this entry. No repository code was executed as part of this screening.

<!-- teamagent-analysis:start -->
Analysis metadata: source [oh-my-pi](https://github.com/can1357/oh-my-pi); analyzed commit `d4d49e71bef3ac1420d45febf215b951decf5ae9`; commit date 2026-10-03T20:14:39+02:00; review date unknown; depth screened. [Maintenance record](../analyses/repos/ai-agents--oh-my-pi.md).
<!-- teamagent-analysis:end -->
