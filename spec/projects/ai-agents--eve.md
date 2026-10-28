# eve

Source: [eve](https://github.com/vercel/eve) · Category: [ai-agents](../categories/ai-agents.md)

Original review depth: **inventory / README screening only**. The dated update review below has its own explicit scope. This is an individual coverage record, not a source-code correctness audit or adoption recommendation.

Snapshot: `6c2e941946383a7a3d1f8f90b5bc6828de40c724`; commit timestamp `2026-10-03T15:08:36-04:00`; 5,782 tracked paths.

## Scope and evidence

Upstream description excerpt (a project claim, automatically extracted from [README](https://github.com/vercel/eve/blob/6c2e941946383a7a3d1f8f90b5bc6828de40c724/README.md)):

> eve is a filesystem-first framework for durable AI agents. Core agent capabilities live in conventional locations, so projects are easier to inspect, extend, and operate.

Build/package evidence: [apps/benchmarks/lib/setups/mock-imessage-setup/package.json](https://github.com/vercel/eve/blob/6c2e941946383a7a3d1f8f90b5bc6828de40c724/apps/benchmarks/lib/setups/mock-imessage-setup/package.json); [apps/benchmarks/package.json](https://github.com/vercel/eve/blob/6c2e941946383a7a3d1f8f90b5bc6828de40c724/apps/benchmarks/package.json); [apps/docs/package.json](https://github.com/vercel/eve/blob/6c2e941946383a7a3d1f8f90b5bc6828de40c724/apps/docs/package.json); [apps/fixtures/agent-tui-client/package.json](https://github.com/vercel/eve/blob/6c2e941946383a7a3d1f8f90b5bc6828de40c724/apps/fixtures/agent-tui-client/package.json); [apps/fixtures/datadog-eval-reporter/package.json](https://github.com/vercel/eve/blob/6c2e941946383a7a3d1f8f90b5bc6828de40c724/apps/fixtures/datadog-eval-reporter/package.json)

License evidence: [LICENSE](https://github.com/vercel/eve/blob/6c2e941946383a7a3d1f8f90b5bc6828de40c724/LICENSE) Classification hint: Apache-2.0. A root license does not establish rights for every bundled asset, model, or dependency.

## Harness assessment

This entry was catalogued under **ai-agents**. Its category places it in the candidate set for agents, models, channels; those associations are navigational and have not been individually validated as implemented capabilities. See [agents](../agents.md) · [models](../models.md) · [channels](../channels.md) for the source-reviewed alternatives and proposed integration boundaries.

**Disposition:** retain as a comparison candidate. Before adopting it, inspect the implementation entry point and its tests, verify the required protocol and deployment platform, and reproduce a task from the harness evaluation suite. Popularity, a README feature list, and the presence of a package manifest are insufficient evidence of quality or compatibility.

**Unresolved:** runtime behavior, security boundaries, performance, API/subscription eligibility, dependency health, maintenance status, and fit to the proposed harness were not independently established for this entry. No repository code was executed as part of this screening.

## 2026-10-28 scoped update review

Reviewed commit `afc64ba3a14faad7346ee8e6cb660e4003daf54b` (commit date `2026-10-27T10:13:21-07:00`). The original snapshot above remains historical evidence.

**Scope:** Channel CORS normalization and its focused fixture, tool authentication descriptor, and selected JSON-schema construction/refinement/default branches with the schema delta; transport emission, authentication runtime and tool-dispatch callers were not audited.

The [CORS normalizer](https://github.com/vercel/eve/blob/afc64ba3a14faad7346ee8e6cb660e4003daf54b/packages/eve/src/channel/cors.ts#L1-L201) rejects unknown top-level options and gives explicit migration messages for renamed fields. Its [fixture](https://github.com/vercel/eve/blob/afc64ba3a14faad7346ee8e6cb660e4003daf54b/packages/eve/src/channel/cors.test.ts#L1-L31) covers origin normalization, empty strings and misspelled/retired fields. This is useful configuration hygiene, but nested preflight keys are not exhaustively rejected and nonempty origin/header strings are not comprehensive semantic validation. The normalizer alone does not establish emitted browser policy or authenticated caller identity; the H3/Nitro integration was not inspected.

The [JSON-schema adapter](https://github.com/vercel/eve/blob/afc64ba3a14faad7346ee8e6cb660e4003daf54b/packages/eve/src/tools/schema.ts#L359-L400) explicitly passes values through when validator construction is unsupported, and also when validation throws for a defined input. The warning is emitted once, subsequent construction-failure inputs skip validation, and the optional check callback is bypassed in these branches. Successful base validation is followed by default insertion, which can itself produce a value outside the declared schema unless another check rejects it. The new [refinement wrapper](https://github.com/vercel/eve/blob/afc64ba3a14faad7346ee8e6cb660e4003daf54b/packages/eve/src/tools/schema.ts#L278-L308) sequences its callback after the base result, but cannot turn that base adapter into a fail-closed trust boundary. Teamagent should retain structured unsupported-schema errors and validate the final transformed value before a tool effect. Model-facing strict schema rewriting is a separate concern from runtime acceptance.

The [authentication descriptor](https://github.com/vercel/eve/blob/afc64ba3a14faad7346ee8e6cb660e4003daf54b/packages/eve/src/tools/auth.ts#L1-L40) distinguishes display labels, flow/cache keys and provider scope/resource settings. Its app/user principal defaults are a documented contract, not evidence that the uninspected runtime authenticates the caller or enforces resource scope. Reusable names and cache keys must not substitute for the authority that obtained a credential. These conclusions are limited to source and fixture inspection; no upstream tests or authentication flow ran.

**Verification limit:** source inspection only; no upstream tests or provider calls were executed. This scoped review does not certify every file in the repository.

## 2026-10-28 follow-up source review

Reviewed commit `3205c7ba382799e63dc5dae6b518282c7720870b` (commit date `2026-10-28T04:27:43Z`), compared with `afc64ba3a14faad7346ee8e6cb660e4003daf54b`. Earlier findings remain historical evidence.

**Scope:** Cross-channel send-option projection and scheduled-session identity. The complete changed-path inventory contains 231 paths; the assessment below is limited to the cited branches.

A field allowlist now copies only public send options across channel boundaries and validates the delivery key, preventing a wider object from carrying internal callback fields. Scheduled sends derive their own continuation token from schedule ID, target token and caller key, while unkeyed sends receive a fresh token. They overwrite auth with schedule authority and disable interactive input. See [packages/eve/src/channel/session.ts](https://github.com/vercel/eve/blob/3205c7ba382799e63dc5dae6b518282c7720870b/packages/eve/src/channel/session.ts#L82-L140) and [packages/eve/src/channel/schedule.ts](https://github.com/vercel/eve/blob/3205c7ba382799e63dc5dae6b518282c7720870b/packages/eve/src/channel/schedule.ts#L141-L193).

For Teamagent, keep unattended authority distinct from the conversation being addressed and namespace deduplication keys across senders and intended occurrences. The documented recent-key window is not unlimited exactly-once delivery; reusing a key across schedule occurrences has semantics the caller must choose deliberately. Field picking and a typed assertion are not complete external schema validation. Runtime deduplication storage and firing-time revocation were not re-audited.

**Verification limit:** committed-source inspection only; no upstream code, tests or provider calls were executed. This review does not certify every changed file or establish a Teamagent integration.

<!-- teamagent-analysis:start -->
Analysis metadata: source [eve](https://github.com/vercel/eve); analyzed commit `3205c7ba382799e63dc5dae6b518282c7720870b`; commit date 2026-10-28T04:27:43Z; review date 2026-10-28T14:29:27.414Z; depth screened. [Maintenance record](../analyses/repos/ai-agents--eve.md).
<!-- teamagent-analysis:end -->
