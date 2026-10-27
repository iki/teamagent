# codex-security

Source: [codex-security](https://github.com/openai/codex-security) · Category: [ai-security](../categories/ai-security.md)

Review depth: **inventory / README screening only**. This is an individual coverage record, not a source-code correctness audit or adoption recommendation.

Snapshot: `775e48ffbf682075e60303eb019131aa2390c3b2`; commit timestamp `2026-10-03T13:30:46-07:00`; 800 tracked paths.

## Scope and evidence

Upstream description excerpt (a project claim, automatically extracted from [README](https://github.com/openai/codex-security/blob/775e48ffbf682075e60303eb019131aa2390c3b2/README.md)):

> `@openai/codex-security` is a CLI and TypeScript SDK for defining security policy and finding, validating, and fixing security vulnerabilities in your code. Some cybersecurity requests and protected findings require approval through

Build/package evidence: [evals/triage-finding/fixtures/repo/package.json](https://github.com/openai/codex-security/blob/775e48ffbf682075e60303eb019131aa2390c3b2/evals/triage-finding/fixtures/repo/package.json); [evals/triage-finding/package.json](https://github.com/openai/codex-security/blob/775e48ffbf682075e60303eb019131aa2390c3b2/evals/triage-finding/package.json); [examples/invoice-desk/app/package.json](https://github.com/openai/codex-security/blob/775e48ffbf682075e60303eb019131aa2390c3b2/examples/invoice-desk/app/package.json); [package.json](https://github.com/openai/codex-security/blob/775e48ffbf682075e60303eb019131aa2390c3b2/package.json); [plugins/codex-security/mcp-app/package.json](https://github.com/openai/codex-security/blob/775e48ffbf682075e60303eb019131aa2390c3b2/plugins/codex-security/mcp-app/package.json)

License evidence: [LICENSE](https://github.com/openai/codex-security/blob/775e48ffbf682075e60303eb019131aa2390c3b2/LICENSE) Classification hint: Apache-2.0. A root license does not establish rights for every bundled asset, model, or dependency.

## Harness assessment

This entry was catalogued under **ai-security**. Its category places it in the candidate set for agents, skills, evolution; those associations are navigational and have not been individually validated as implemented capabilities. See [agents](../agents.md) · [skills](../skills.md) · [evolution](../evolution.md) for the source-reviewed alternatives and proposed integration boundaries.

**Disposition:** retain as a comparison candidate. Before adopting it, inspect the implementation entry point and its tests, verify the required protocol and deployment platform, and reproduce a task from the harness evaluation suite. Popularity, a README feature list, and the presence of a package manifest are insufficient evidence of quality or compatibility.

**Unresolved:** runtime behavior, security boundaries, performance, API/subscription eligibility, dependency health, maintenance status, and fit to the proposed harness were not independently established for this entry. No repository code was executed as part of this screening.

<!-- teamagent-analysis:start -->
Analysis metadata: source [codex-security](https://github.com/openai/codex-security); analyzed commit `775e48ffbf682075e60303eb019131aa2390c3b2`; commit date 2026-10-03T13:30:46-07:00; review date unknown; depth screened. [Maintenance record](../analyses/repos/ai-security--codex-security.md).
<!-- teamagent-analysis:end -->
