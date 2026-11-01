# bundle.antfu

Source: [bundle.antfu](https://github.com/antfu/skills) · Category: [ai-skills](../categories/ai-skills.md)

Review depth: **inventory / README screening only**. This is an individual coverage record, not a source-code correctness audit or adoption recommendation.

Snapshot: `e53a142a2420e8cd812cfe9ed0484ab01bc856aa`; commit timestamp `2026-09-30T14:41:33+09:00`; 186 tracked paths.

## Scope and evidence

Upstream description excerpt (a project claim, automatically extracted from [README](https://github.com/antfu/skills/blob/e53a142a2420e8cd812cfe9ed0484ab01bc856aa/README.md)):

> A curated collection of Agent Skills reflecting Anthony Fu's preferences, experience, and best practices, along with usage documentation for the tools. This is a proof-of-concept project for generating agent skills from source documentation and keeping them in sync.

Build/package evidence: [package.json](https://github.com/antfu/skills/blob/e53a142a2420e8cd812cfe9ed0484ab01bc856aa/package.json)

License evidence: [LICENSE.md](https://github.com/antfu/skills/blob/e53a142a2420e8cd812cfe9ed0484ab01bc856aa/LICENSE.md) Classification hint: MIT. A root license does not establish rights for every bundled asset, model, or dependency.

## Harness assessment

This entry was catalogued under **ai-skills**. Its category places it in the candidate set for skills; those associations are navigational and have not been individually validated as implemented capabilities. See [skills](../skills.md) for the source-reviewed alternatives and proposed integration boundaries.

**Disposition:** retain as a comparison candidate. Before adopting it, inspect the implementation entry point and its tests, verify the required protocol and deployment platform, and reproduce a task from the harness evaluation suite. Popularity, a README feature list, and the presence of a package manifest are insufficient evidence of quality or compatibility.

**Unresolved:** runtime behavior, security boundaries, performance, API/subscription eligibility, dependency health, maintenance status, and fit to the proposed harness were not independently established for this entry. No repository code was executed as part of this screening.

## Source update reviewed 2026-10-28

Reviewed commit `8886fe2d385d3644cbb47e46ae9cb1cf09307d3b` (commit date `2026-10-23T04:36:45+02:00`). Fourteen text-file deltas read, including full new triage skill and upload script. The Vitest submodule pointer is inventoried; its implementation was not inspected.

The [triage skill](https://github.com/antfu/skills/blob/8886fe2d385d3644cbb47e46ae9cb1cf09307d3b/skills/antfu-issue-triage/SKILL.md) separates evidence-backed proposals from approved writes and treats partially fixed/linked work conservatively. Visual evidence guidance adds reproducible revision/viewport manifests; Vitest guidance records a source revision and limitations of mtime-based incremental tests. Adapt those procedures while retaining Teamagent's Bun/Aube choices and full gates. Do not adopt the new [attachment fallback](https://github.com/antfu/skills/blob/8886fe2d385d3644cbb47e46ae9cb1cf09307d3b/skills/antfu-create-pr/scripts/upload-github-attachment.sh): it sends the bearer credential in curl arguments, lacks explicit request/response/time bounds and extracts an undocumented JSON response with sed. Not printing a token does not remove process-argument exposure. The suggested package installer, undocumented upload endpoint, external CLI/version assertions and Vitest beta behavior were not executed or independently verified.

## 2026-11-01 scoped source review

Reviewed commit `7de210b51c8d48cc405a4eac3e17cbb1396c653b` (commit date `2026-10-31T06:17:52+09:00`), compared with `8886fe2d385d3644cbb47e46ae9cb1cf09307d3b`. Earlier observations remain historical evidence.

**Scope:** Complete new antfu-query skill and visual-evidence reference diff; seven changed paths inventoried. Other skill revisions not audited.

The [query skill](https://github.com/antfu/skills/blob/7de210b51c8d48cc405a4eac3e17cbb1396c653b/skills/antfu-query/SKILL.md) models clarification as a dependency tree, asks currently unblocked questions together, and separates environmental facts from user decisions. It also prescribes an exhaustive interview and final confirmation before acting. Those are portable workflow suggestions only where compatible with the user's task and host tools. The [visual-evidence reference](https://github.com/antfu/skills/blob/7de210b51c8d48cc405a4eac3e17cbb1396c653b/skills/antfu-create-pr/references/visual-evidence.md) adds an external attachment-documentation link; availability was not externally checked.

**Teamagent implication (inference):** Use dependency-aware question batching when clarification is genuinely needed, but preserve standing authorization and avoid importing mandatory interview/approval behavior into ordinary tasks. Select and adapt the skill's scope explicitly; an external feature link remains unverified until needed and checked.

**Verification limit:** committed-source inspection only; no upstream code, tests or provider calls were executed. Review scope is the cited implementation or authored guidance, not whole-project correctness, licensing clearance or measured performance. Source passages were redacted for review; exact URL literals were not byte-validated.

<!-- teamagent-analysis:start -->
Analysis metadata: source [bundle.antfu](https://github.com/antfu/skills); analyzed commit `7de210b51c8d48cc405a4eac3e17cbb1396c653b`; commit date 2026-10-31T06:17:52+09:00; review date 2026-11-01T11:37:37.120Z; depth screened. [Maintenance record](../analyses/repos/ai-skills--bundle.antfu.md).
<!-- teamagent-analysis:end -->
