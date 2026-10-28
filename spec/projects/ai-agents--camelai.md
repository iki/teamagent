# camelai

Source: [camelai](https://github.com/qaml-ai/camelAI) · Category: [ai-agents](../categories/ai-agents.md)

Original review depth: **inventory / README screening only**. The dated update review below has its own explicit scope. This is an individual coverage record, not a source-code correctness audit or adoption recommendation.

Snapshot: `3825a9a671b2260cc6138929535de30e435c1f93`; commit timestamp `2026-10-03T09:38:47-05:00`; 1,829 tracked paths.

## Scope and evidence

Upstream description excerpt (a project claim, automatically extracted from [README](https://github.com/qaml-ai/camelAI/blob/3825a9a671b2260cc6138929535de30e435c1f93/README.md)):

> An AI coding assistant for persistent workspaces, connected data, and deployable applications. camelAI gives teams persistent AI coding workspaces backed by Cloudflare. Each

Build/package evidence: [package.json](https://github.com/qaml-ai/camelAI/blob/3825a9a671b2260cc6138929535de30e435c1f93/package.json); [sandbox/create-worker/templates/starter/package.json](https://github.com/qaml-ai/camelAI/blob/3825a9a671b2260cc6138929535de30e435c1f93/sandbox/create-worker/templates/starter/package.json); [workers/eval-reports/package.json](https://github.com/qaml-ai/camelAI/blob/3825a9a671b2260cc6138929535de30e435c1f93/workers/eval-reports/package.json); [workers/main/db-query-sandbox-assets/runner/package.json](https://github.com/qaml-ai/camelAI/blob/3825a9a671b2260cc6138929535de30e435c1f93/workers/main/db-query-sandbox-assets/runner/package.json); [workers/main/project-build-sandbox-warmup/crud/package.json](https://github.com/qaml-ai/camelAI/blob/3825a9a671b2260cc6138929535de30e435c1f93/workers/main/project-build-sandbox-warmup/crud/package.json)

License evidence: [LICENSE](https://github.com/qaml-ai/camelAI/blob/3825a9a671b2260cc6138929535de30e435c1f93/LICENSE) Classification hint: MIT. A root license does not establish rights for every bundled asset, model, or dependency.

## Harness assessment

This entry was catalogued under **ai-agents**. Its category places it in the candidate set for agents, models, channels; those associations are navigational and have not been individually validated as implemented capabilities. See [agents](../agents.md) · [models](../models.md) · [channels](../channels.md) for the source-reviewed alternatives and proposed integration boundaries.

**Disposition:** retain as a comparison candidate. Before adopting it, inspect the implementation entry point and its tests, verify the required protocol and deployment platform, and reproduce a task from the harness evaluation suite. Popularity, a README feature list, and the presence of a package manifest are insufficient evidence of quality or compatibility.

**Unresolved:** runtime behavior, security boundaries, performance, API/subscription eligibility, dependency health, maintenance status, and fit to the proposed harness were not independently established for this entry. No repository code was executed as part of this screening.

## 2026-10-28 scoped update review

Reviewed commit `f4108141d856edef72cc282ac5c4646c27caf621` (commit date `2026-10-26T16:52:12-05:00`). The original snapshot above remains historical evidence.

**Scope:** OAuth configuration/transport helpers and auth-route loaders at the pinned revision; callback state issuance, token/session storage, redirect helper internals and production OAuth were not audited.

The [OAuth helper](https://github.com/qaml-ai/camelAI/blob/f4108141d856edef72cc282ac5c4646c27caf621/src/lib/oauth-config.ts#L81-L114) sets a fifteen-second abort timer and refuses redirect responses for provider fetches. The timer is cleared when `fetch` resolves, before subsequent JSON body consumption; it therefore does not bound a stalled response body. Token/user responses are cast into expected shapes instead of comprehensively decoded from unknown data. A Teamagent adapter needs a whole-operation deadline, response-size bounds and schema/semantic validation through body parsing, with caller cancellation composed into that deadline.

The [user-info path](https://github.com/qaml-ai/camelAI/blob/f4108141d856edef72cc282ac5c4646c27caf621/src/lib/oauth-config.ts#L214-L292) requires Google's verified-email flag and obtains a verified GitHub email from the authenticated email endpoint rather than trusting the public profile email. That is a useful identity-evidence distinction, but truthiness checks and a string conversion are not complete validation of provider IDs and email fields. The helper supports an optional PKCE challenge; this scope did not inspect issuance/consumption of state, verifier storage or callback/session binding and makes no end-to-end OAuth certification.

The [public auth layout](https://github.com/qaml-ai/camelAI/blob/f4108141d856edef72cc282ac5c4646c27caf621/src/routes/_auth.tsx) distinguishes a session from construction of the full auth context and clears a stale cookie to break a redirect loop. [Login error mapping](https://github.com/qaml-ai/camelAI/blob/f4108141d856edef72cc282ac5c4646c27caf621/src/routes/_auth.login.tsx#L13-L32) keeps a bounded set of user-facing outcomes. Preserve this separation between configuration, session presence, valid principal and account eligibility; neither frontend availability nor a static sandbox egress address establishes provider or network authorization.

**Verification limit:** source inspection only; no upstream tests or provider calls were executed. This scoped review does not certify every file in the repository.

<!-- teamagent-analysis:start -->
Analysis metadata: source [camelai](https://github.com/qaml-ai/camelAI); analyzed commit `f4108141d856edef72cc282ac5c4646c27caf621`; commit date 2026-10-26T16:52:12-05:00; review date 2026-10-28T08:47:42.123Z; depth screened. [Maintenance record](../analyses/repos/ai-agents--camelai.md).
<!-- teamagent-analysis:end -->
