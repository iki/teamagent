# ifixai

Source: [ifixai](https://github.com/ifixai-ai/iFixAi) · Category: [ai-eval](../categories/ai-eval.md)

Review depth: **inventory / README screening only**. This is an individual coverage record, not a source-code correctness audit or adoption recommendation.

Snapshot: `5b9b12764614950e11208f45fca96ffe5e183c8c`; commit timestamp `2026-10-02T19:36:20Z`; 587 tracked paths.

## Scope and evidence

Upstream description excerpt (a project claim, automatically extracted from [README](https://github.com/ifixai-ai/iFixAi/blob/5b9b12764614950e11208f45fca96ffe5e183c8c/README.md)):

> Catch your agent's mistakes and blind spots before the shit hits the fan. One  ifixai run , end to end: guided setup picks the system, judge, and suite; the run verifies the connection and saves your config; 32 inspections execute across five pillars; and the result lands as an A–F grade with a scored core-pillar scorecard.

Build/package evidence: [plugin/requirements.txt](https://github.com/ifixai-ai/iFixAi/blob/5b9b12764614950e11208f45fca96ffe5e183c8c/plugin/requirements.txt); [pyproject.toml](https://github.com/ifixai-ai/iFixAi/blob/5b9b12764614950e11208f45fca96ffe5e183c8c/pyproject.toml)

License evidence: [LICENSE](https://github.com/ifixai-ai/iFixAi/blob/5b9b12764614950e11208f45fca96ffe5e183c8c/LICENSE) Classification hint: Apache-2.0. A root license does not establish rights for every bundled asset, model, or dependency.

## Harness assessment

This entry was catalogued under **ai-eval**. Its category places it in the candidate set for evolution, decisions; those associations are navigational and have not been individually validated as implemented capabilities. See [evolution](../evolution.md) · [decisions](../decisions.md) for the source-reviewed alternatives and proposed integration boundaries.

**Disposition:** retain as a comparison candidate. Before adopting it, inspect the implementation entry point and its tests, verify the required protocol and deployment platform, and reproduce a task from the harness evaluation suite. Popularity, a README feature list, and the presence of a package manifest are insufficient evidence of quality or compatibility.

**Unresolved:** runtime behavior, security boundaries, performance, API/subscription eligibility, dependency health, maintenance status, and fit to the proposed harness were not independently established for this entry. No repository code was executed as part of this screening.

## Source update reviewed 2026-10-28

Reviewed commit: [`28dca412279635361d626574810aae8d91ab6b45`](https://github.com/ifixai-ai/iFixAi/commit/28dca412279635361d626574810aae8d91ab6b45). Scope: Full layout validator, finite-model policy exploration/repair and empty-permission-matrix regression tests read. Other inspection runners, discovery implementation and provider integration were not audited.

The [layout validator](https://github.com/ifixai-ai/iFixAi/blob/28dca412279635361d626574810aae8d91ab6b45/ifixai/harness/validator.py) rejects inspection-like misspellings rather than silently excluding them, checks duplicate and folder-derived IDs, and forbids rubric/reference artifacts for structural-only tests so unmeasured dimensions are not advertised. [Policy exploration](https://github.com/ifixai-ai/iFixAi/blob/28dca412279635361d626574810aae8d91ab6b45/ifixai/policy_lab/search.py) snapshots inputs, records state/transition/depth cutoffs, retains safety and legitimate-goal witnesses and makes a no-enabled-transitions result inconclusive. Its hashes establish integrity rather than authenticity; verification covers the declared finite model, and reachable goals prove existence rather than universal completion.

The [repair search](https://github.com/ifixai-ai/iFixAi/blob/28dca412279635361d626574810aae8d91ab6b45/ifixai/policy_lab/repair.py) bounds permission-removal cardinality, candidates and transitions, preserves coverage limits and limits minimality to the explored removal space. It does not modify deployed authorization, code or guards. The [discovery tests](https://github.com/ifixai-ai/iFixAi/blob/28dca412279635361d626574810aae8d91ab6b45/ifixai/tests/core/test_discovery_empty_permission_matrix.py) preserve an explicitly empty grant matrix as deny-all evidence, while unavailable capability retains inferred grants; those inferred permissions must remain visibly non-authoritative in Teamagent. Adapt explicit coverage, fixture completeness and separate modeled/observed results. No inspection, model search, repair, provider call or tests were executed.


<!-- teamagent-analysis:start -->
Analysis metadata: source [ifixai](https://github.com/ifixai-ai/iFixAi); analyzed commit `28dca412279635361d626574810aae8d91ab6b45`; commit date 2026-10-24T23:10:50Z; review date 2026-10-28T08:26:04.502Z; depth screened. [Maintenance record](../analyses/repos/ai-eval--ifixai.md).
<!-- teamagent-analysis:end -->
