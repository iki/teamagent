# plan.mattpocock

Source: [plan.mattpocock](https://github.com/mattpocock/skills) · Category: [ai-skills](../categories/ai-skills.md)

Review depth: **inventory / README screening only**. This is an individual coverage record, not a source-code correctness audit or adoption recommendation.

Snapshot: `d81f3a183412e71a5b1e84ca21bc1a35eea03a60`; commit timestamp `2026-09-29T13:37:40+01:00`; 172 tracked paths.

## Scope and evidence

Upstream description excerpt (a project claim, automatically extracted from [README](https://github.com/mattpocock/skills/blob/d81f3a183412e71a5b1e84ca21bc1a35eea03a60/README.md)):

> My agent skills that I use every day to do real engineering - not vibe coding. Developing real applications is hard. Approaches like GSD, BMAD, and Spec-Kit try to help by owning the process. But while doing so, they take away your control and make bugs in the process hard to resolve.

Build/package evidence: [package.json](https://github.com/mattpocock/skills/blob/d81f3a183412e71a5b1e84ca21bc1a35eea03a60/package.json)

License evidence: [LICENSE](https://github.com/mattpocock/skills/blob/d81f3a183412e71a5b1e84ca21bc1a35eea03a60/LICENSE) Classification hint: MIT. A root license does not establish rights for every bundled asset, model, or dependency.

## Harness assessment

This entry was catalogued under **ai-skills**. Its category places it in the candidate set for skills; those associations are navigational and have not been individually validated as implemented capabilities. See [skills](../skills.md) for the source-reviewed alternatives and proposed integration boundaries.

**Disposition:** retain as a comparison candidate. Before adopting it, inspect the implementation entry point and its tests, verify the required protocol and deployment platform, and reproduce a task from the harness evaluation suite. Popularity, a README feature list, and the presence of a package manifest are insufficient evidence of quality or compatibility.

**Unresolved:** runtime behavior, security boundaries, performance, API/subscription eligibility, dependency health, maintenance status, and fit to the proposed harness were not independently established for this entry. No repository code was executed as part of this screening.

## Source update reviewed 2026-10-28

Reviewed commit: [`59db609eb1e18aaf59b63284d0e52255aff0c63c`](https://github.com/mattpocock/skills/commit/59db609eb1e18aaf59b63284d0e52255aff0c63c). Scope: Four full current procedures read: handoff, implementation, ticket decomposition and two-axis review. Other changed skills, setup and wizard code remain unreviewed.

The [ticket procedure](https://github.com/mattpocock/skills/blob/59db609eb1e18aaf59b63284d0e52255aff0c63c/skills/engineering/to-tickets/SKILL.md) records blocking edges and favors verifiable vertical slices, while explicitly using expand/migrate/contract or a shared integration branch for wide refactors. [Review guidance](https://github.com/mattpocock/skills/blob/59db609eb1e18aaf59b63284d0e52255aff0c63c/skills/engineering/code-review/SKILL.md) pins a comparison baseline and separates standards compliance from fulfillment of the originating spec, labeling smell findings as judgment. Adopt explicit dependency graphs and independent review axes, but include working-tree changes when the task concerns uncommitted work: the prescribed HEAD comparison alone excludes them. Handoffs reference existing evidence and require redaction. Automatic commit instructions and publishing tickets still require the task's actual authorization; fixed word limits and automatic auxiliary skills are not Teamagent policy. No tracker operation, handoff recovery or review-quality evaluation was run.


## 2026-11-01 scoped source review

Reviewed commit `4ae2317ddb22b046e26455e4f9c9b3aaaf62212d` (commit date `2026-10-31T14:23:30Z`), compared with `59db609eb1e18aaf59b63284d0e52255aff0c63c`. Earlier observations remain historical evidence.

**Scope:** Complete changes to review and implementation orchestration guidance and the initial software-factory glossary/design sections. Linked product surveys, worktree tooling and actual autonomous runs were not audited.

The [review skill](https://github.com/mattpocock/skills/blob/4ae2317ddb22b046e26455e4f9c9b3aaaf62212d/skills/engineering/code-review/SKILL.md) asks for fresh-context reviewers on separate standards and specification axes. The [implementation skill](https://github.com/mattpocock/skills/blob/4ae2317ddb22b046e26455e4f9c9b3aaaf62212d/skills/engineering/implement-spec/SKILL.md) uses a dependency frontier, fresh implementers per ticket, context pointers and integration-branch reconciliation. The new [in-progress factory guidance](https://github.com/mattpocock/skills/blob/4ae2317ddb22b046e26455e4f9c9b3aaaf62212d/skills/in-progress/software-factory/SKILL.md) separates task, trigger, run, runner and service roles, recommends throttled adoption and asks what stops duplicate work. These are authored coordination policies; no scheduler, ownership lock or convergence guarantee is established by the prose.

**Teamagent implication (inference):** Use narrow task context and immutable evidence pointers while preserving the original baseline, accepted constraints and explicit file ownership. Fresh context reduces shared assumptions but is not independent attestation. Implement deduplication, bounded retries and review gates in the harness; do not import automatic resets, cleanup or deployment permissions from another skill's instructions.

**Verification limit:** committed-source inspection only; no upstream code, tests or provider calls were executed. Review scope is the cited implementation or authored guidance, not whole-project correctness, licensing clearance or measured performance. Source passages were redacted for review; exact URL literals were not byte-validated.

<!-- teamagent-analysis:start -->
Analysis metadata: source [plan.mattpocock](https://github.com/mattpocock/skills); analyzed commit `4ae2317ddb22b046e26455e4f9c9b3aaaf62212d`; commit date 2026-10-31T14:23:30Z; review date 2026-11-01T11:37:37.120Z; depth screened. [Maintenance record](../analyses/repos/ai-skills--plan.mattpocock.md).
<!-- teamagent-analysis:end -->
