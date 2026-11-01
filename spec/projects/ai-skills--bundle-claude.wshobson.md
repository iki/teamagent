# bundle-claude.wshobson

Source: [bundle-claude.wshobson](https://github.com/wshobson/agents) · Category: [ai-skills](../categories/ai-skills.md)

Review depth: **inventory / README screening only**. This is an individual coverage record, not a source-code correctness audit or adoption recommendation.

Snapshot: `156b7a5e7a8b93642628a339ee4039c925b34c7f`; commit timestamp `2026-09-28T20:45:26-04:00`; 1,191 tracked paths.

## Scope and evidence

Upstream description excerpt (a project claim, automatically extracted from [README](https://github.com/wshobson/agents/blob/156b7a5e7a8b93642628a339ee4039c925b34c7f/README.md)):

> Production-ready agentic workflow building blocks: **94 plugins**, **202 agents**, 184 skills**, **105 commands** — built for Claude Code and consumed natively by

Build/package evidence: [plugins/plugin-eval/pyproject.toml](https://github.com/wshobson/agents/blob/156b7a5e7a8b93642628a339ee4039c925b34c7f/plugins/plugin-eval/pyproject.toml); [plugins/pptx-deck-creation/skills/pptx-reference-deck-analysis/requirements.txt](https://github.com/wshobson/agents/blob/156b7a5e7a8b93642628a339ee4039c925b34c7f/plugins/pptx-deck-creation/skills/pptx-reference-deck-analysis/requirements.txt); [tools/yt-design-extractor/pyproject.toml](https://github.com/wshobson/agents/blob/156b7a5e7a8b93642628a339ee4039c925b34c7f/tools/yt-design-extractor/pyproject.toml)

License evidence: [LICENSE](https://github.com/wshobson/agents/blob/156b7a5e7a8b93642628a339ee4039c925b34c7f/LICENSE) Classification hint: MIT. A root license does not establish rights for every bundled asset, model, or dependency.

## Harness assessment

This entry was catalogued under **ai-skills**. Its category places it in the candidate set for skills; those associations are navigational and have not been individually validated as implemented capabilities. See [skills](../skills.md) for the source-reviewed alternatives and proposed integration boundaries.

**Disposition:** retain as a comparison candidate. Before adopting it, inspect the implementation entry point and its tests, verify the required protocol and deployment platform, and reproduce a task from the harness evaluation suite. Popularity, a README feature list, and the presence of a package manifest are insufficient evidence of quality or compatibility.

**Unresolved:** runtime behavior, security boundaries, performance, API/subscription eligibility, dependency health, maintenance status, and fit to the proposed harness were not independently established for this entry. No repository code was executed as part of this screening.

## Source update reviewed 2026-10-28

Reviewed commit: [`0874a27b17a22e2b7c2e2bcd725768e0803cad06`](https://github.com/wshobson/agents/commit/0874a27b17a22e2b7c2e2bcd725768e0803cad06). Scope: Full codebase-scan skill, AGENTS template and E2E testing navigation skill read. Optional plugins, scan implementation and detailed browser examples were not reviewed.

The [scanner procedure](https://github.com/wshobson/agents/blob/0874a27b17a22e2b7c2e2bcd725768e0803cad06/plugins/ship-mate/skills/scan/SKILL.md) distinguishes descriptive project documentation from generated agent instructions and requires confirmation for architectural updates on delta runs. Its HEAD~1 delta is not the last successful scan baseline and misses untracked files; no changed tracked files therefore cannot prove documentation is current. First-run instructions also need to detect and preserve an existing AGENTS.md before writing the [template](https://github.com/wshobson/agents/blob/0874a27b17a22e2b7c2e2bcd725768e0803cad06/plugins/ship-mate/skills/scan/references/agents-template.md). Inferred code patterns must remain observations until adopted as policy.

The [E2E guide](https://github.com/wshobson/agents/blob/0874a27b17a22e2b7c2e2bcd725768e0803cad06/plugins/developer-essentials/skills/e2e-testing-patterns/SKILL.md) emphasizes independent tests, user-visible assertions and explicit setup for accessibility selectors. Its categorical exclusion of edge cases is too broad for high-risk browser/native boundaries, and mocks cannot replace the real runtime checks required here. Adapt layered verification and trace-based debugging, preserve coverage as unknown unless measured, and retain Teamagent's dependency and instruction workflow. No plugins, scan, browser or tests were run.

## 2026-11-01 scoped source review

Reviewed commit `7e2fb559cf4b824b27f1fec49fe88f7511066d26` (commit date `2026-10-30T19:34:46-04:00`), compared with `0874a27b17a22e2b7c2e2bcd725768e0803cad06`. Earlier observations remain historical evidence.

**Scope:** Complete new version-bump checker; 185 changed paths inventoried. Its tests and release enforcement call sites not audited.

The [checker](https://github.com/wshobson/agents/blob/7e2fb559cf4b824b27f1fec49fe88f7511066d26/tools/check_version_bumps.py) compares plugin changes against a merge base and requires increasing simple semantic versions for existing versioned manifests. Lockfiles and one generated plugin descriptor are exempt. Manifest reads collapse Git command failures into absence, while new/removed or unversioned manifests are skipped; consequently this check is narrower than complete content or release integrity.

**Teamagent implication (inference):** Use declared versions for compatibility and immutable content hashes for actual skill identity. Verification caches must include executable payloads and dependency locks even when release policy exempts them from a version bump; distinguish unavailable Git evidence from a genuinely absent manifest.

**Verification limit:** committed-source inspection only; no upstream code, tests or provider calls were executed. Review scope is the cited implementation or authored guidance, not whole-project correctness, licensing clearance or measured performance. Source passages were redacted for review; exact URL literals were not byte-validated.

<!-- teamagent-analysis:start -->
Analysis metadata: source [bundle-claude.wshobson](https://github.com/wshobson/agents); analyzed commit `7e2fb559cf4b824b27f1fec49fe88f7511066d26`; commit date 2026-10-30T19:34:46-04:00; review date 2026-11-01T11:37:37.120Z; depth screened. [Maintenance record](../analyses/repos/ai-skills--bundle-claude.wshobson.md).
<!-- teamagent-analysis:end -->
