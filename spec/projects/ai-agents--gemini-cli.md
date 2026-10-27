# gemini-cli

Source: [gemini-cli](https://github.com/google-gemini/gemini-cli) · Category: [ai-agents](../categories/ai-agents.md)

Review depth: **inventory / README screening only**. This is an individual coverage record, not a source-code correctness audit or adoption recommendation.

Snapshot: `fb972b2f87fe7d5b06d37eac711490162d98de2c`; commit timestamp `2026-10-02T05:49:39Z`; 3,026 tracked paths.

## Scope and evidence

Upstream description excerpt (a project claim, automatically extracted from [README](https://github.com/google-gemini/gemini-cli/blob/fb972b2f87fe7d5b06d37eac711490162d98de2c/README.md)):

> [](https://github.com/google-gemini/gemini-cli/actions/workflows/ci.yml) [](https://github.com/google-gemini/gemini-cli/actions/workflows/chained_e2e.yml)

Build/package evidence: [package.json](https://github.com/google-gemini/gemini-cli/blob/fb972b2f87fe7d5b06d37eac711490162d98de2c/package.json); [packages/a2a-server/package.json](https://github.com/google-gemini/gemini-cli/blob/fb972b2f87fe7d5b06d37eac711490162d98de2c/packages/a2a-server/package.json); [packages/cli/package.json](https://github.com/google-gemini/gemini-cli/blob/fb972b2f87fe7d5b06d37eac711490162d98de2c/packages/cli/package.json); [packages/cli/src/commands/extensions/examples/mcp-server/package.json](https://github.com/google-gemini/gemini-cli/blob/fb972b2f87fe7d5b06d37eac711490162d98de2c/packages/cli/src/commands/extensions/examples/mcp-server/package.json); [packages/core/package.json](https://github.com/google-gemini/gemini-cli/blob/fb972b2f87fe7d5b06d37eac711490162d98de2c/packages/core/package.json)

License evidence: [LICENSE](https://github.com/google-gemini/gemini-cli/blob/fb972b2f87fe7d5b06d37eac711490162d98de2c/LICENSE) Classification hint: Apache-2.0. A root license does not establish rights for every bundled asset, model, or dependency.

## Harness assessment

This entry was catalogued under **ai-agents**. Its category places it in the candidate set for agents, models, channels; those associations are navigational and have not been individually validated as implemented capabilities. See [agents](../agents.md) · [models](../models.md) · [channels](../channels.md) for the source-reviewed alternatives and proposed integration boundaries.

**Disposition:** retain as a comparison candidate. Before adopting it, inspect the implementation entry point and its tests, verify the required protocol and deployment platform, and reproduce a task from the harness evaluation suite. Popularity, a README feature list, and the presence of a package manifest are insufficient evidence of quality or compatibility.

**Unresolved:** runtime behavior, security boundaries, performance, API/subscription eligibility, dependency health, maintenance status, and fit to the proposed harness were not independently established for this entry. No repository code was executed as part of this screening.

<!-- teamagent-analysis:start -->
Analysis metadata: source [gemini-cli](https://github.com/google-gemini/gemini-cli); analyzed commit `fb972b2f87fe7d5b06d37eac711490162d98de2c`; commit date 2026-10-02T05:49:39Z; review date unknown; depth screened. [Maintenance record](../analyses/repos/ai-agents--gemini-cli.md).
<!-- teamagent-analysis:end -->
