# codebase-radar

Source: [codebase-radar](https://github.com/BleedingDev/codebase-radar) · Category: [ai-query](../categories/ai-query.md)

Review depth: **inventory / README screening only**. This is an individual coverage record, not a source-code correctness audit or adoption recommendation.

Snapshot: `82381c8adfb701e3b2ea6bb113634abd7d82db68`; commit timestamp `2026-08-31T14:47:17+02:00`; 280 tracked paths.

## Scope and evidence

Upstream description excerpt (a project claim, automatically extracted from [README](https://github.com/BleedingDev/codebase-radar/blob/82381c8adfb701e3b2ea6bb113634abd7d82db68/README.md)):

> Codebase Radar turns a public GitHub repository into a short, evidence-backed list of what to fix first, why it matters, and what is probably noise. It explains the same evidence differently for technical leaders, executives, and security stakeholders, while preserving a machine-readable view for coding agents. Radar treats the repository—not an individual scan—as the durable product object.

Build/package evidence: [apps/radar/package.json](https://github.com/BleedingDev/codebase-radar/blob/82381c8adfb701e3b2ea6bb113634abd7d82db68/apps/radar/package.json); [package.json](https://github.com/BleedingDev/codebase-radar/blob/82381c8adfb701e3b2ea6bb113634abd7d82db68/package.json); [packages/agent-runtime/package.json](https://github.com/BleedingDev/codebase-radar/blob/82381c8adfb701e3b2ea6bb113634abd7d82db68/packages/agent-runtime/package.json); [packages/analyzer-runtime/package.json](https://github.com/BleedingDev/codebase-radar/blob/82381c8adfb701e3b2ea6bb113634abd7d82db68/packages/analyzer-runtime/package.json); [packages/radar-cli/package.json](https://github.com/BleedingDev/codebase-radar/blob/82381c8adfb701e3b2ea6bb113634abd7d82db68/packages/radar-cli/package.json)

License evidence: [LICENSE](https://github.com/BleedingDev/codebase-radar/blob/82381c8adfb701e3b2ea6bb113634abd7d82db68/LICENSE) Classification hint: MIT. A root license does not establish rights for every bundled asset, model, or dependency.

## Harness assessment

This entry was catalogued under **ai-query**. Its category places it in the candidate set for memory, import-generation, decisions; those associations are navigational and have not been individually validated as implemented capabilities. See [memory](../memory.md) · [import-generation](../import-generation.md) · [decisions](../decisions.md) for the source-reviewed alternatives and proposed integration boundaries.

**Disposition:** retain as a comparison candidate. Before adopting it, inspect the implementation entry point and its tests, verify the required protocol and deployment platform, and reproduce a task from the harness evaluation suite. Popularity, a README feature list, and the presence of a package manifest are insufficient evidence of quality or compatibility.

**Unresolved:** runtime behavior, security boundaries, performance, API/subscription eligibility, dependency health, maintenance status, and fit to the proposed harness were not independently established for this entry. No repository code was executed as part of this screening.

<!-- teamagent-analysis:start -->
Analysis metadata: source [codebase-radar](https://github.com/BleedingDev/codebase-radar); analyzed commit `82381c8adfb701e3b2ea6bb113634abd7d82db68`; commit date 2026-08-31T14:47:17+02:00; review date unknown; depth screened. [Maintenance record](../analyses/repos/ai-query--codebase-radar.md).
<!-- teamagent-analysis:end -->
