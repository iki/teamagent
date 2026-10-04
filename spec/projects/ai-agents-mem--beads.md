# beads

Source: [beads](https://github.com/gastownhall/beads) · Category: [ai-agents-mem](../categories/ai-agents-mem.md)

Review depth: **inventory / README screening only**. This is an individual coverage record, not a source-code correctness audit or adoption recommendation.

Snapshot: `d2844318a18ff61a983e40d3abe88561e05f8e2a`; commit timestamp `2026-10-03T13:33:54-07:00`; 4,296 tracked paths.

## Scope and evidence

Upstream description excerpt (a project claim, automatically extracted from [README](https://github.com/gastownhall/beads/blob/d2844318a18ff61a983e40d3abe88561e05f8e2a/README.md)):

> Beads provides a persistent, structured memory for coding agents. It replaces messy markdown plans with a dependency-aware graph, allowing agents to handle long-horizon tasks without losing context. Note:** Beads is a CLI tool you install once and use everywhere. You don't need to clone this repository into your project.

Build/package evidence: [examples/bd-example-extension-go/go.mod](https://github.com/gastownhall/beads/blob/d2844318a18ff61a983e40d3abe88561e05f8e2a/examples/bd-example-extension-go/go.mod); [examples/library-usage/go.mod](https://github.com/gastownhall/beads/blob/d2844318a18ff61a983e40d3abe88561e05f8e2a/examples/library-usage/go.mod); [go.mod](https://github.com/gastownhall/beads/blob/d2844318a18ff61a983e40d3abe88561e05f8e2a/go.mod); [integrations/beads-mcp/pyproject.toml](https://github.com/gastownhall/beads/blob/d2844318a18ff61a983e40d3abe88561e05f8e2a/integrations/beads-mcp/pyproject.toml); [npm-package/package.json](https://github.com/gastownhall/beads/blob/d2844318a18ff61a983e40d3abe88561e05f8e2a/npm-package/package.json)

License evidence: [LICENSE](https://github.com/gastownhall/beads/blob/d2844318a18ff61a983e40d3abe88561e05f8e2a/LICENSE) Classification hint: MIT. A root license does not establish rights for every bundled asset, model, or dependency.

## Harness assessment

This entry was catalogued under **ai-agents-mem**. Its category places it in the candidate set for memory, evolution; those associations are navigational and have not been individually validated as implemented capabilities. See [memory](../memory.md) · [evolution](../evolution.md) for the source-reviewed alternatives and proposed integration boundaries.

**Disposition:** retain as a comparison candidate. Before adopting it, inspect the implementation entry point and its tests, verify the required protocol and deployment platform, and reproduce a task from the harness evaluation suite. Popularity, a README feature list, and the presence of a package manifest are insufficient evidence of quality or compatibility.

**Unresolved:** runtime behavior, security boundaries, performance, API/subscription eligibility, dependency health, maintenance status, and fit to the proposed harness were not independently established for this entry. No repository code was executed as part of this screening.
