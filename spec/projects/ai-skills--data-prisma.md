# data-prisma

Source: [data-prisma](https://github.com/prisma/skills) · Category: [ai-skills](../categories/ai-skills.md)

Review depth: **inventory / README screening only**. This is an individual coverage record, not a source-code correctness audit or adoption recommendation.

Snapshot: `be16a8740d01363d13552b317042431ee8dfc581`; commit timestamp `2026-10-01T01:24:56+05:30`; 74 tracked paths.

## Scope and evidence

Upstream description excerpt (a project claim, automatically extracted from [README](https://github.com/prisma/skills/blob/be16a8740d01363d13552b317042431ee8dfc581/README.md)):

> A collection of skills for AI coding agents working with Prisma ORM. Skills are packaged instructions that extend agent capabilities for database development. Skills follow the Agent Skills format and are compatible with `npx skills add`.

Build/package evidence: No common build manifest identified.

License evidence: [LICENSE](https://github.com/prisma/skills/blob/be16a8740d01363d13552b317042431ee8dfc581/LICENSE) Classification hint: MIT. A root license does not establish rights for every bundled asset, model, or dependency.

## Harness assessment

This entry was catalogued under **ai-skills**. Its category places it in the candidate set for skills; those associations are navigational and have not been individually validated as implemented capabilities. See [skills](../skills.md) for the source-reviewed alternatives and proposed integration boundaries.

**Disposition:** retain as a comparison candidate. Before adopting it, inspect the implementation entry point and its tests, verify the required protocol and deployment platform, and reproduce a task from the harness evaluation suite. Popularity, a README feature list, and the presence of a package manifest are insufficient evidence of quality or compatibility.

**Unresolved:** runtime behavior, security boundaries, performance, API/subscription eligibility, dependency health, maintenance status, and fit to the proposed harness were not independently established for this entry. No repository code was executed as part of this screening.

## Source update reviewed 2026-10-28

Reviewed commit: [`c71e8ea254dbc5dba27af773b735679163395cf9`](https://github.com/prisma/skills/commit/c71e8ea254dbc5dba27af773b735679163395cf9). Scope: Complete current Prisma Compute skill and runtime-requirements reference read; other migration/provisioning references and the underlying CLI/packages not audited.

The [Compute skill](https://github.com/prisma/skills/blob/c71e8ea254dbc5dba27af773b735679163395cf9/prisma-compute/SKILL.md) explicitly versions a Composer/Prisma-8 migration, distinguishes previews from implicit production targets, separates build/deploy/link operations, and warns that scaffolding can deploy by default. The [runtime reference](https://github.com/prisma/skills/blob/c71e8ea254dbc5dba27af773b735679163395cf9/prisma-compute/references/runtime-requirements.md) distinguishes a keep-awake deadline from cancellation/durability, flags streaming-buffer ambiguity and calls for stage testing. These are upstream instructions, not verified platform limits. Adapt explicit environment/target selection and durable-job requirements; do not copy its catch-all unhandled-error logging, raw unvalidated webhook JSON or best-effort background work as a durable acceptance path. Package installation/sync examples do not authorize changing Teamagent's adopted stack or vendored skills. No Prisma CLI, deploy, database, provider or runtime limit was tested.


## 2026-11-01 scoped source review

Reviewed commit `8ea289b730c2e89f7ff1f518af128b113d842a92` (commit date `2026-10-29T20:38:08+05:30`), compared with `c71e8ea254dbc5dba27af773b735679163395cf9`. Earlier observations remain historical evidence.

**Scope:** Complete two-file committed diff: setup skill version and provisioning instructions; no runtime implementation changed in this comparison.

[Provisioning guidance](https://github.com/prisma/skills/blob/8ea289b730c2e89f7ff1f518af128b113d842a92/prisma-postgres-setup/references/provisioning.md) now explicitly tells the agent to deliver the returned database claim URL and expiry to the user, while keeping the connection string and claim material out of source code and shared logs. It continues to distinguish an expiring database from completed claiming. This is an authored operational instruction, not an implemented lifecycle checker or a tested provisioning result.

**Teamagent implication (inference):** Separate private user delivery from public evidence: a required claim action should be discoverable in an authorized channel without copying bearer-sensitive URLs into conversation archives. Preserve pending ownership and expiry until an authoritative claim check succeeds; do not infer durable provisioning from successful creation.

**Verification limit:** committed-source inspection only; no upstream code, tests or provider calls were executed. Review scope is the cited implementation or authored guidance, not whole-project correctness, licensing clearance or measured performance. Source passages were redacted for review; exact URL literals were not byte-validated.

<!-- teamagent-analysis:start -->
Analysis metadata: source [data-prisma](https://github.com/prisma/skills); analyzed commit `8ea289b730c2e89f7ff1f518af128b113d842a92`; commit date 2026-10-29T20:38:08+05:30; review date 2026-11-01T11:37:37.120Z; depth screened. [Maintenance record](../analyses/repos/ai-skills--data-prisma.md).
<!-- teamagent-analysis:end -->
