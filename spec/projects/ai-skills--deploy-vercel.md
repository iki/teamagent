# deploy-vercel

Source: [deploy-vercel](https://github.com/vercel-labs/agent-skills) · Category: [ai-skills](../categories/ai-skills.md)

Original review depth: **inventory / README screening only**. This is an individual coverage record, not a source-code correctness audit or adoption recommendation.

Snapshot: `063bee94c3f4df8453406c830b0a7df0f2860278`; commit timestamp `2026-08-28T15:36:07+02:00`; 447 tracked paths.

## Scope and evidence

Upstream description excerpt (a project claim, automatically extracted from [README](https://github.com/vercel-labs/agent-skills/blob/063bee94c3f4df8453406c830b0a7df0f2860278/README.md)):

> A collection of skills for AI coding agents. Skills are packaged instructions and scripts that extend agent capabilities. Audits a Vercel project for cost, performance, reliability, caching, function usage, and billing opportunities. It collects Vercel metrics first, then investigates only the routes and files those metrics point to.

Build/package evidence: [package.json](https://github.com/vercel-labs/agent-skills/blob/063bee94c3f4df8453406c830b0a7df0f2860278/package.json); [packages/react-best-practices-build/package.json](https://github.com/vercel-labs/agent-skills/blob/063bee94c3f4df8453406c830b0a7df0f2860278/packages/react-best-practices-build/package.json); [packages/vercel-optimize-tests/package.json](https://github.com/vercel-labs/agent-skills/blob/063bee94c3f4df8453406c830b0a7df0f2860278/packages/vercel-optimize-tests/package.json)

License evidence: No root license file identified; reuse rights unverified. Classification hint: not classified; inspect source. A root license does not establish rights for every bundled asset, model, or dependency.

## Harness assessment

This entry was catalogued under **ai-skills**. Its category places it in the candidate set for skills; those associations are navigational and have not been individually validated as implemented capabilities. See [skills](../skills.md) for the source-reviewed alternatives and proposed integration boundaries.

**Disposition:** retain as a comparison candidate. Before adopting it, inspect the implementation entry point and its tests, verify the required protocol and deployment platform, and reproduce a task from the harness evaluation suite. Popularity, a README feature list, and the presence of a package manifest are insufficient evidence of quality or compatibility.

**Unresolved:** runtime behavior, security boundaries, performance, API/subscription eligibility, dependency health, maintenance status, and fit to the proposed harness were not independently established for this entry. No repository code was executed as part of this screening.

## Source update reviewed 2026-10-27

Reviewed commit `6ec269328bc400712ee225a173a14b6b29128df7` (commit date `2026-10-26T21:16:01-07:00`). Complete two-file availability-guidance delta.

The [skill](https://github.com/vercel-labs/agent-skills/blob/6ec269328bc400712ee225a173a14b6b29128df7/skills/react-view-transitions/SKILL.md) and [expanded guide](https://github.com/vercel-labs/agent-skills/blob/6ec269328bc400712ee225a173a14b6b29128df7/skills/react-view-transitions/AGENTS.md) replace non-Next.js canary installation with React/react-dom 19.3-or-newer guidance. This is upstream version guidance, not proof Teamagent's pinned packages expose the APIs or authorization to upgrade. Bind variants to installed-package capabilities and distinguish framework-bundled React from displayed package versions. Runtime code is unchanged; browser availability and migration behavior were not executed or independently validated.

<!-- teamagent-analysis:start -->
Analysis metadata: source [deploy-vercel](https://github.com/vercel-labs/agent-skills); analyzed commit `6ec269328bc400712ee225a173a14b6b29128df7`; commit date 2026-10-26T21:16:01-07:00; review date 2026-10-28T08:26:04.502Z; depth screened. [Maintenance record](../analyses/repos/ai-skills--deploy-vercel.md).
<!-- teamagent-analysis:end -->
