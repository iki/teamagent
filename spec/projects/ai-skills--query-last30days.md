# query-last30days

Source: [query-last30days](https://github.com/mvanhorn/last30days-skill) · Category: [ai-skills](../categories/ai-skills.md)

Review depth: **inventory / README screening only**. This is an individual coverage record, not a source-code correctness audit or adoption recommendation.

Snapshot: `5103ba478b380552207a3754b74c7655d64208cd`; commit timestamp `2026-09-30T18:19:30-07:00`; 497 tracked paths.

## Scope and evidence

Upstream description excerpt (a project claim, automatically extracted from [README](https://github.com/mvanhorn/last30days-skill/blob/5103ba478b380552207a3754b74c7655d64208cd/README.md)):

> English | Français | Deutsch | Español | Português (Brasil) | 日本語 | 简体中文 An AI agent-led search engine scored by upvotes, likes, and real money - not editors.

Build/package evidence: [mcp/go.mod](https://github.com/mvanhorn/last30days-skill/blob/5103ba478b380552207a3754b74c7655d64208cd/mcp/go.mod); [pyproject.toml](https://github.com/mvanhorn/last30days-skill/blob/5103ba478b380552207a3754b74c7655d64208cd/pyproject.toml); [skills/last30days/scripts/lib/vendor/bird-search/package.json](https://github.com/mvanhorn/last30days-skill/blob/5103ba478b380552207a3754b74c7655d64208cd/skills/last30days/scripts/lib/vendor/bird-search/package.json)

License evidence: [LICENSE](https://github.com/mvanhorn/last30days-skill/blob/5103ba478b380552207a3754b74c7655d64208cd/LICENSE) Classification hint: MIT. A root license does not establish rights for every bundled asset, model, or dependency.

## Harness assessment

This entry was catalogued under **ai-skills**. Its category places it in the candidate set for skills; those associations are navigational and have not been individually validated as implemented capabilities. See [skills](../skills.md) for the source-reviewed alternatives and proposed integration boundaries.

**Disposition:** retain as a comparison candidate. Before adopting it, inspect the implementation entry point and its tests, verify the required protocol and deployment platform, and reproduce a task from the harness evaluation suite. Popularity, a README feature list, and the presence of a package manifest are insufficient evidence of quality or compatibility.

**Unresolved:** runtime behavior, security boundaries, performance, API/subscription eligibility, dependency health, maintenance status, and fit to the proposed harness were not independently established for this entry. No repository code was executed as part of this screening.

## Source update reviewed 2026-10-28

Reviewed commit: [`e06af25a9a78487b75e8509e0e1687fec137176e`](https://github.com/mvanhorn/last30days-skill/commit/e06af25a9a78487b75e8509e0e1687fec137176e). Scope: Full MCP preflight and research wrappers plus preflight argument tests read. Embedded engine extraction, browser-cookie consent, HTTP clients, output redaction and research quality were not audited.

The [research wrapper](https://github.com/mvanhorn/last30days-skill/blob/e06af25a9a78487b75e8509e0e1687fec137176e/mcp/internal/tools/research.go) places a dash-prefixed topic behind an option separator, defaults browser cookies off and passes an explicit empty save directory so an environment fallback cannot silently persist a declined report. It separates format and save choices and documents that the MCP cookie opt-in only removes one denial flag; the engine still owns consent. It also enables the engine planner explicitly, so that behavior needs its own provenance rather than being confused with a host-supplied plan.

The [preflight wrapper](https://github.com/mvanhorn/last30days-skill/blob/e06af25a9a78487b75e8509e0e1687fec137176e/mcp/internal/tools/preflight.go) advertises read-only/no-file-saving behavior but first ensures an extracted user cache and invokes the engine twice for destination resolution and reporting. The [tests](https://github.com/mvanhorn/last30days-skill/blob/e06af25a9a78487b75e8509e0e1687fec137176e/mcp/internal/tools/preflight_test.go) verify safe argument construction, not absence of those side effects. Raw engine stderr is forwarded by the error formatter, and no wrapper-level topic/output bound is present. Adapt explicit opt-ins and argument boundaries after auditing cache mutation, subprocess cancellation and redaction. No research, cookies, engine process or tests were run.

<!-- teamagent-analysis:start -->
Analysis metadata: source [query-last30days](https://github.com/mvanhorn/last30days-skill); analyzed commit `e06af25a9a78487b75e8509e0e1687fec137176e`; commit date 2026-10-27T02:23:07-07:00; review date 2026-10-28T09:45:33.667Z; depth screened. [Maintenance record](../analyses/repos/ai-skills--query-last30days.md).
<!-- teamagent-analysis:end -->
