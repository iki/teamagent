# proxypilot-win

Source: [proxypilot-win](https://github.com/Finesssee/ProxyPilot) · Category: [ai-agents-proxy](../categories/ai-agents-proxy.md)

Review depth: **inventory / README screening only**. This is an individual coverage record, not a source-code correctness audit or adoption recommendation.

Snapshot: `7ff4825858bd3887772411faf0ab7eaaf7045691`; commit timestamp `2026-06-24T19:23:19+08:00`; 1,326 tracked paths.

## Scope and evidence

Upstream description excerpt (a project claim, automatically extracted from [README](https://github.com/Finesssee/ProxyPilot/blob/7ff4825858bd3887772411faf0ab7eaaf7045691/README.md)):

> A proxy server that provides OpenAI/Gemini/Claude/Codex/Grok compatible API interfaces for CLI. It now also supports OpenAI Codex (GPT models) and Claude Code via OAuth.

Build/package evidence: [bun/proxypilot/package.json](https://github.com/Finesssee/ProxyPilot/blob/7ff4825858bd3887772411faf0ab7eaaf7045691/bun/proxypilot/package.json); [examples/plugin/auth/go/go.mod](https://github.com/Finesssee/ProxyPilot/blob/7ff4825858bd3887772411faf0ab7eaaf7045691/examples/plugin/auth/go/go.mod); [examples/plugin/auth/rust/Cargo.toml](https://github.com/Finesssee/ProxyPilot/blob/7ff4825858bd3887772411faf0ab7eaaf7045691/examples/plugin/auth/rust/Cargo.toml); [examples/plugin/claude-web-search-router/go/go.mod](https://github.com/Finesssee/ProxyPilot/blob/7ff4825858bd3887772411faf0ab7eaaf7045691/examples/plugin/claude-web-search-router/go/go.mod); [examples/plugin/cli/go/go.mod](https://github.com/Finesssee/ProxyPilot/blob/7ff4825858bd3887772411faf0ab7eaaf7045691/examples/plugin/cli/go/go.mod)

License evidence: [LICENSE](https://github.com/Finesssee/ProxyPilot/blob/7ff4825858bd3887772411faf0ab7eaaf7045691/LICENSE) Classification hint: MIT. A root license does not establish rights for every bundled asset, model, or dependency.

## Harness assessment

This entry was catalogued under **ai-agents-proxy**. Its category places it in the candidate set for models, decisions; those associations are navigational and have not been individually validated as implemented capabilities. See [models](../models.md) · [decisions](../decisions.md) for the source-reviewed alternatives and proposed integration boundaries.

**Disposition:** retain as a comparison candidate. Before adopting it, inspect the implementation entry point and its tests, verify the required protocol and deployment platform, and reproduce a task from the harness evaluation suite. Popularity, a README feature list, and the presence of a package manifest are insufficient evidence of quality or compatibility.

**Unresolved:** runtime behavior, security boundaries, performance, API/subscription eligibility, dependency health, maintenance status, and fit to the proposed harness were not independently established for this entry. No repository code was executed as part of this screening.

<!-- teamagent-analysis:start -->
Analysis metadata: source [proxypilot-win](https://github.com/Finesssee/ProxyPilot); analyzed commit `7ff4825858bd3887772411faf0ab7eaaf7045691`; commit date 2026-06-24T19:23:19+08:00; review date unknown; depth screened. [Maintenance record](../analyses/repos/ai-agents-proxy--proxypilot-win.md).
<!-- teamagent-analysis:end -->
