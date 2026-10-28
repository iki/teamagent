# xx-2603-cli-agents.jpoehnelt

Source: [xx-2603-cli-agents.jpoehnelt](https://github.com/jpoehnelt/skills) · Category: [ai-skills](../categories/ai-skills.md)

Review depth: **inventory / README screening only**. This is an individual coverage record, not a source-code correctness audit or adoption recommendation.

Snapshot: `38201ef980059123c3ad0f894a45099046b87d04`; commit timestamp `2026-03-07T12:09:59-07:00`; 2 tracked paths.

## Scope and evidence

Upstream description excerpt (a project claim, automatically extracted from [README](https://github.com/jpoehnelt/skills/blob/38201ef980059123c3ad0f894a45099046b87d04/README.md)):

> No concise purpose statement extracted; inspect the upstream README.

Build/package evidence: No common build manifest identified.

License evidence: No root license file identified; reuse rights unverified. Classification hint: not classified; inspect source. A root license does not establish rights for every bundled asset, model, or dependency.

## Harness assessment

This entry was catalogued under **ai-skills**. Its category places it in the candidate set for skills; those associations are navigational and have not been individually validated as implemented capabilities. See [skills](../skills.md) for the source-reviewed alternatives and proposed integration boundaries.

**Disposition:** retain as a comparison candidate. Before adopting it, inspect the implementation entry point and its tests, verify the required protocol and deployment platform, and reproduce a task from the harness evaluation suite. Popularity, a README feature list, and the presence of a package manifest are insufficient evidence of quality or compatibility.

**Unresolved:** runtime behavior, security boundaries, performance, API/subscription eligibility, dependency health, maintenance status, and fit to the proposed harness were not independently established for this entry. No repository code was executed as part of this screening.

## Source update reviewed 2026-10-28

Reviewed commit: [`b284cba43765d5246ddc0345e7c3b97f679000f8`](https://github.com/jpoehnelt/skills/commit/b284cba43765d5246ddc0345e7c3b97f679000f8). Scope: Four full changed procedure bodies reviewed: swarm, recurring-error correction, verification-skill creation and reflection. Remaining 40-path delta and other skill variants not fully reviewed.

The [swarm procedure](https://github.com/jpoehnelt/skills/blob/b284cba43765d5246ddc0345e7c3b97f679000f8/agents-swarm/SKILL.md) requires bounded slices, separate writing paths/worktrees, exact revisions/methods for measurements, integration of passing work and explicit dropout/gap reporting. [Verification-skill creation](https://github.com/jpoehnelt/skills/blob/b284cba43765d5246ddc0345e7c3b97f679000f8/agents-create-verification-skill/SKILL.md) requires real app paths, readiness/auth/port ownership, cleanup limited to owned processes and a retained evidence artifact; an unrun skill remains a draft. Correction guidance prioritizes architecture/types/lint before more prose, and reflection requires a concrete observed event and respects vendored sources. Adapt those principles with Teamagent's existing test/lint and authorization contracts. Instructions to prefer smaller worker models, Bash helpers or fixed skill lengths are author choices, not required dependencies or measured quality gains. No generated verifier, multi-agent run or historical-correction benchmark was executed.


<!-- teamagent-analysis:start -->
Analysis metadata: source [cli-agents.jpoehnelt](https://github.com/jpoehnelt/skills); analyzed commit `b284cba43765d5246ddc0345e7c3b97f679000f8`; commit date 2026-10-27T10:07:58-06:00; review date 2026-10-28T08:26:04.502Z; depth screened. [Maintenance record](../analyses/repos/ai-skills--xx-2603-cli-agents.jpoehnelt.md).
<!-- teamagent-analysis:end -->
