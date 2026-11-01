# closedloop-ai

Source: [closedloop-ai](https://github.com/closedloop-ai/closedloop-ai) · Category: [ai-agents](../categories/ai-agents.md)

Original review depth: **inventory / README screening only**. The dated update review below has its own explicit scope. This is an individual coverage record, not a source-code correctness audit or adoption recommendation.

Snapshot: `fb0ca91eaf59c9706ad6e2d7a4c86cd38d1d54d1`; commit timestamp `2026-08-18T00:16:33-05:00`; 10,478 tracked paths.

## Scope and evidence

Upstream description excerpt (a project claim, automatically extracted from [README](https://github.com/closedloop-ai/closedloop-ai/blob/fb0ca91eaf59c9706ad6e2d7a4c86cd38d1d54d1/README.md)):

> The open-source workspace for team-based agentic software development. ClosedLoop is a platform where AI agents produce delivery artifacts (PRDs, implementation plans, code) and humans review them at every stage. Define requirements, generate plans, execute to PRs — all in one workspace visible to the whole team.

Build/package evidence: [apps/api/package.json](https://github.com/closedloop-ai/closedloop-ai/blob/fb0ca91eaf59c9706ad6e2d7a4c86cd38d1d54d1/apps/api/package.json); [apps/app/package.json](https://github.com/closedloop-ai/closedloop-ai/blob/fb0ca91eaf59c9706ad6e2d7a4c86cd38d1d54d1/apps/app/package.json); [apps/desktop/package.json](https://github.com/closedloop-ai/closedloop-ai/blob/fb0ca91eaf59c9706ad6e2d7a4c86cd38d1d54d1/apps/desktop/package.json); [apps/mcp/package.json](https://github.com/closedloop-ai/closedloop-ai/blob/fb0ca91eaf59c9706ad6e2d7a4c86cd38d1d54d1/apps/mcp/package.json); [apps/prototypes/package.json](https://github.com/closedloop-ai/closedloop-ai/blob/fb0ca91eaf59c9706ad6e2d7a4c86cd38d1d54d1/apps/prototypes/package.json)

License evidence: [LICENSE](https://github.com/closedloop-ai/closedloop-ai/blob/fb0ca91eaf59c9706ad6e2d7a4c86cd38d1d54d1/LICENSE) Classification hint: MIT. A root license does not establish rights for every bundled asset, model, or dependency.

## Harness assessment

This entry was catalogued under **ai-agents**. Its category places it in the candidate set for agents, models, channels; those associations are navigational and have not been individually validated as implemented capabilities. See [agents](../agents.md) · [models](../models.md) · [channels](../channels.md) for the source-reviewed alternatives and proposed integration boundaries.

**Disposition:** retain as a comparison candidate. Before adopting it, inspect the implementation entry point and its tests, verify the required protocol and deployment platform, and reproduce a task from the harness evaluation suite. Popularity, a README feature list, and the presence of a package manifest are insufficient evidence of quality or compatibility.

**Unresolved:** runtime behavior, security boundaries, performance, API/subscription eligibility, dependency health, maintenance status, and fit to the proposed harness were not independently established for this entry. No repository code was executed as part of this screening.

## 2026-10-27 scoped update review

Reviewed commit `e812713cd7332d455e315079ee3b362a5051b92e` (commit date `2026-10-23T21:07:48-05:00`). The original snapshot above remains historical evidence.

**Scope:** Complete 35-path inventory; changed required-plugin lists and installer repair list, selected health classification/remediation code and matching fixtures. Package manifests show dependency updates; the full dependency graph and platform runtime were not tested.

The [required plugin inventory](https://github.com/closedloop-ai/closedloop-ai/blob/e812713cd7332d455e315079ee3b362a5051b92e/apps/desktop/src/server/operations/plugin-cache.ts#L56-L60), [enable list](https://github.com/closedloop-ai/closedloop-ai/blob/e812713cd7332d455e315079ee3b362a5051b92e/apps/desktop/src/server/operations/health-check-plugin-enable.ts#L28-L47) and installer now require code, code-review and platform, removing judges and self-learning from these mandatory checks. The [matching fixture](https://github.com/closedloop-ai/closedloop-ai/blob/e812713cd7332d455e315079ee3b362a5051b92e/apps/desktop/test/plugin-cache.test.ts#L146-L154) confirms that set. This does not prove those optional capabilities were removed from the platform; it changes the onboarding contract. Do not make experimental evolution a prerequisite for basic agent readiness.

The currently inspected [inventory classifier](https://github.com/closedloop-ai/closedloop-ai/blob/e812713cd7332d455e315079ee3b362a5051b92e/apps/desktop/src/server/operations/plugin-cache.ts#L579-L636) distinguishes known disabled state from unreadable/missing enabled-state evidence. The [post-enable result](https://github.com/closedloop-ai/closedloop-ai/blob/e812713cd7332d455e315079ee3b362a5051b92e/apps/desktop/src/server/operations/health-check-plugin-enable.ts#L280-L319) retains an unknown result when verification failed, rather than asserting the enable failed and prescribing another install/enable. These mechanisms predate parts of this small functional delta and are assessed as current implementation, not all newly introduced behavior.

Borrow the separation of installed, enabled, verified and required capabilities. A completed mutation and a failed follow-up read are separate facts; repeat writes should not be the default remedy. Dependency bumps and desktop package changes still require platform acceptance testing, and local CLI inventory is not authenticated provider/model readiness.

**Verification limit:** source inspection only; no upstream tests or provider calls were executed. This scoped review does not certify every file in the repository.

## 2026-11-01 scoped source review

Reviewed commit `835c12105aca440ed40945540b117be2a20bb207` (commit date `2026-10-28T15:04:26-05:00`), compared with `e812713cd7332d455e315079ee3b362a5051b92e`. Earlier observations remain historical evidence.

**Scope:** Explicit tree comparison of preserved commit e812713cd7332d455e315079ee3b362a5051b92e and observed commit 835c12105aca440ed40945540b117be2a20bb207: complete current plugin-cache source, selected current/previous fixtures, previous inventory types and enable-helper branches. A separate read-only local Git history check established unrelated reachable histories for these exact objects; no cause for the history change was established. Other possible replacement modules not audited.

At the [preserved revision](https://github.com/closedloop-ai/closedloop-ai/blob/e812713cd7332d455e315079ee3b362a5051b92e/apps/desktop/src/server/operations/plugin-cache.ts), inventory types distinguished command failure, unreadable output and missing enabled state. At the [observed revision](https://github.com/closedloop-ai/closedloop-ai/blob/835c12105aca440ed40945540b117be2a20bb207/apps/desktop/src/server/operations/plugin-cache.ts), this file instead resolves a code-plugin version from an environment override or existing user-scoped registry entry, returns unknown on failure, and treats legacy entries without scope as user-scoped when their paths exist. [Current fixtures](https://github.com/closedloop-ai/closedloop-ai/blob/835c12105aca440ed40945540b117be2a20bb207/apps/desktop/test/plugin-cache.test.ts) cover stale/disabled/project entries and invalid versions. The old health-check-plugin-enable.ts path is absent in the current tree. This is a two-tree difference, not evidence of a forward removal commit or proof that equivalent behavior disappeared everywhere.

**Historical reconciliation:** the local check at `2026-11-01T11:06:48.9807593+00:00` confirmed both exact commit objects in a non-shallow repository, neither an ancestor of the other, no common merge base and left/right reachable-commit counts of 27/31. The preserved tree is `2379d9bd34ba25e5179e24edcddc575a71886b59`; the observed tree is `00a206446c090971b77bca6376baa5f77a63c4b1`. HEAD remained at the observed commit; the check used no network and executed no source code. Local ancestry receipt SHA-256: `afe1d29562ef74dd50121ca908961a16edb583c8d9e03689c2f4f4425430955f`. These observations justify retaining two separate historical baselines, without inferring a rename, rollback or reason for replacement.

**Teamagent implication (inference):** Retain both exact revisions and historical findings during history reconciliation. Separate declared version, installed bytes, authenticated enabled state and unavailable diagnostics; environment overrides and path existence are not readiness or integrity proof. Do not advance an analysis baseline on an assumed rename, rollback or ancestry relationship.

**Verification limit:** committed-source inspection only; no upstream code, tests or provider calls were executed. Review scope is the cited implementation or authored guidance, not whole-project correctness, licensing clearance or measured performance. Source passages were redacted for review; exact URL literals were not byte-validated.

<!-- teamagent-analysis:start -->
Analysis metadata: source [closedloop-ai](https://github.com/closedloop-ai/closedloop-ai); analyzed commit `835c12105aca440ed40945540b117be2a20bb207`; commit date 2026-10-28T15:04:26-05:00; review date 2026-11-01T11:33:30.893Z; depth screened. [Maintenance record](../analyses/repos/ai-agents--closedloop-ai.md).
<!-- teamagent-analysis:end -->
