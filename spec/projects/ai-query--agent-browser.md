# agent-browser

Source: [agent-browser](https://github.com/vercel-labs/agent-browser) · Category: [ai-query](../categories/ai-query.md)

Review depth: **inventory / README screening only**. This is an individual coverage record, not a source-code correctness audit or adoption recommendation.

Snapshot: `526157cfd4ec64f45939f9ba0f10d5936aa7ac33`; commit timestamp `2026-10-03T03:28:26-03:00`; 474 tracked paths.

## Scope and evidence

Upstream description excerpt (a project claim, automatically extracted from [README](https://github.com/vercel-labs/agent-browser/blob/526157cfd4ec64f45939f9ba0f10d5936aa7ac33/README.md)):

> Then use via `package.json` scripts or by invoking `agent-browser` directly. This exits nonzero if the package manager cannot install every required browser library.

Build/package evidence: [benchmarks/package.json](https://github.com/vercel-labs/agent-browser/blob/526157cfd4ec64f45939f9ba0f10d5936aa7ac33/benchmarks/package.json); [cli/Cargo.toml](https://github.com/vercel-labs/agent-browser/blob/526157cfd4ec64f45939f9ba0f10d5936aa7ac33/cli/Cargo.toml); [docs/package.json](https://github.com/vercel-labs/agent-browser/blob/526157cfd4ec64f45939f9ba0f10d5936aa7ac33/docs/package.json); [evals/package.json](https://github.com/vercel-labs/agent-browser/blob/526157cfd4ec64f45939f9ba0f10d5936aa7ac33/evals/package.json); [examples/environments/package.json](https://github.com/vercel-labs/agent-browser/blob/526157cfd4ec64f45939f9ba0f10d5936aa7ac33/examples/environments/package.json)

License evidence: [LICENSE](https://github.com/vercel-labs/agent-browser/blob/526157cfd4ec64f45939f9ba0f10d5936aa7ac33/LICENSE) Classification hint: Apache-2.0. A root license does not establish rights for every bundled asset, model, or dependency.

## Harness assessment

This entry was catalogued under **ai-query**. Its category places it in the candidate set for memory, import-generation, decisions; those associations are navigational and have not been individually validated as implemented capabilities. See [memory](../memory.md) · [import-generation](../import-generation.md) · [decisions](../decisions.md) for the source-reviewed alternatives and proposed integration boundaries.

**Disposition:** retain as a comparison candidate. Before adopting it, inspect the implementation entry point and its tests, verify the required protocol and deployment platform, and reproduce a task from the harness evaluation suite. Popularity, a README feature list, and the presence of a package manifest are insufficient evidence of quality or compatibility.

**Unresolved:** runtime behavior, security boundaries, performance, API/subscription eligibility, dependency health, maintenance status, and fit to the proposed harness were not independently established for this entry. No repository code was executed as part of this screening.
