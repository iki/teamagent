# plan.uncle-bob.robert-hoffman

Source: [plan.uncle-bob.robert-hoffman](https://github.com/robert-hoffmann/uncle-bob) · Category: [ai-skills](../categories/ai-skills.md)

Review depth: **inventory / README screening only**. This is an individual coverage record, not a source-code correctness audit or adoption recommendation.

Snapshot: `3185d182c8d358d17a62485cb20f13024a81e429`; commit timestamp `2026-06-02T23:09:00+02:00`; 249 tracked paths.

## Scope and evidence

Upstream description excerpt (a project claim, automatically extracted from [README](https://github.com/robert-hoffmann/uncle-bob/blob/3185d182c8d358d17a62485cb20f13024a81e429/README.md)):

> Uncle Bob is a practical collection of skills and a focused teaching agent for GitHub Copilot in VS Code, Copilot CLI, Claude Code, and Codex users. It gives agentic coding tools a coordinated core of quality, authoring, workflow, and governance, with implementation specialists and customization tooling layered on top without forcing a heavy framework around day-to-day development. I use these skills in an actual corporate production environment for supply-chain management in the aerospace industry.

Build/package evidence: [package.json](https://github.com/robert-hoffmann/uncle-bob/blob/3185d182c8d358d17a62485cb20f13024a81e429/package.json); [pyproject.toml](https://github.com/robert-hoffmann/uncle-bob/blob/3185d182c8d358d17a62485cb20f13024a81e429/pyproject.toml); [tests/skills/ub-governance/fixtures/repo_integrity/fail-legacy-root-registry/pyproject.toml](https://github.com/robert-hoffmann/uncle-bob/blob/3185d182c8d358d17a62485cb20f13024a81e429/tests/skills/ub-governance/fixtures/repo_integrity/fail-legacy-root-registry/pyproject.toml); [tests/skills/ub-governance/fixtures/repo_integrity/fail-package-metadata-drift/pyproject.toml](https://github.com/robert-hoffmann/uncle-bob/blob/3185d182c8d358d17a62485cb20f13024a81e429/tests/skills/ub-governance/fixtures/repo_integrity/fail-package-metadata-drift/pyproject.toml); [tests/skills/ub-governance/fixtures/repo_integrity/fail-readme-agent-drift/pyproject.toml](https://github.com/robert-hoffmann/uncle-bob/blob/3185d182c8d358d17a62485cb20f13024a81e429/tests/skills/ub-governance/fixtures/repo_integrity/fail-readme-agent-drift/pyproject.toml)

License evidence: [LICENSE](https://github.com/robert-hoffmann/uncle-bob/blob/3185d182c8d358d17a62485cb20f13024a81e429/LICENSE) Classification hint: MIT. A root license does not establish rights for every bundled asset, model, or dependency.

## Harness assessment

This entry was catalogued under **ai-skills**. Its category places it in the candidate set for skills; those associations are navigational and have not been individually validated as implemented capabilities. See [skills](../skills.md) for the source-reviewed alternatives and proposed integration boundaries.

**Disposition:** retain as a comparison candidate. Before adopting it, inspect the implementation entry point and its tests, verify the required protocol and deployment platform, and reproduce a task from the harness evaluation suite. Popularity, a README feature list, and the presence of a package manifest are insufficient evidence of quality or compatibility.

**Unresolved:** runtime behavior, security boundaries, performance, API/subscription eligibility, dependency health, maintenance status, and fit to the proposed harness were not independently established for this entry. No repository code was executed as part of this screening.
