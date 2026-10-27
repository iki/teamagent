# xx-2603-iii-sandbox

Source: [xx-2603-iii-sandbox](https://github.com/iii-hq/sandbox) · Category: [ai-agents-sandbox](../categories/ai-agents-sandbox.md)

Review depth: **inventory / README screening only**. This is an individual coverage record, not a source-code correctness audit or adoption recommendation.

Snapshot: `737e75e9a35fea4e65640abd24746ffdf71a8a4e`; commit timestamp `2026-03-11T14:01:25+05:30`; 239 tracked paths.

## Scope and evidence

Upstream description excerpt (a project claim, automatically extracted from [README](https://github.com/iii-hq/sandbox/blob/737e75e9a35fea4e65640abd24746ffdf71a8a4e/README.md)):

> Isolated code execution sandboxes with a full API. Rust worker on iii-engine primitives. Docker or Firecracker backends. 39 tools: sandbox lifecycle, exec, filesystem, git, env, process, snapshots, ports, events, streams, observability, monitoring, networking, volumes.

Build/package evidence: [package.json](https://github.com/iii-hq/sandbox/blob/737e75e9a35fea4e65640abd24746ffdf71a8a4e/package.json); [packages/cli/package.json](https://github.com/iii-hq/sandbox/blob/737e75e9a35fea4e65640abd24746ffdf71a8a4e/packages/cli/package.json); [packages/guest-agent/Cargo.toml](https://github.com/iii-hq/sandbox/blob/737e75e9a35fea4e65640abd24746ffdf71a8a4e/packages/guest-agent/Cargo.toml); [packages/mcp/package.json](https://github.com/iii-hq/sandbox/blob/737e75e9a35fea4e65640abd24746ffdf71a8a4e/packages/mcp/package.json); [packages/sdk-python/pyproject.toml](https://github.com/iii-hq/sandbox/blob/737e75e9a35fea4e65640abd24746ffdf71a8a4e/packages/sdk-python/pyproject.toml)

License evidence: No root license file identified; reuse rights unverified. Classification hint: not classified; inspect source. A root license does not establish rights for every bundled asset, model, or dependency.

## Harness assessment

This entry was catalogued under **ai-agents-sandbox**. Its category places it in the candidate set for agents, channels; those associations are navigational and have not been individually validated as implemented capabilities. See [agents](../agents.md) · [channels](../channels.md) for the source-reviewed alternatives and proposed integration boundaries.

**Disposition:** retain as a comparison candidate. Before adopting it, inspect the implementation entry point and its tests, verify the required protocol and deployment platform, and reproduce a task from the harness evaluation suite. Popularity, a README feature list, and the presence of a package manifest are insufficient evidence of quality or compatibility.

**Unresolved:** runtime behavior, security boundaries, performance, API/subscription eligibility, dependency health, maintenance status, and fit to the proposed harness were not independently established for this entry. No repository code was executed as part of this screening.

<!-- teamagent-analysis:start -->
Analysis metadata: source [iii-sandbox](https://github.com/iii-hq/sandbox); analyzed commit `737e75e9a35fea4e65640abd24746ffdf71a8a4e`; commit date 2026-03-11T14:01:25+05:30; review date unknown; depth screened. [Maintenance record](../analyses/repos/ai-agents-sandbox--xx-2603-iii-sandbox.md).
<!-- teamagent-analysis:end -->
