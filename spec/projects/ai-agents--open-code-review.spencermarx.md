# open-code-review.spencermarx

Source: [open-code-review.spencermarx](https://github.com/spencermarx/open-code-review) · Category: [ai-agents](../categories/ai-agents.md)

Review depth: **inventory / README screening only**. This is an individual coverage record, not a source-code correctness audit or adoption recommendation.

Snapshot: `fee6905939eaa804dfd90d815cecbcb26f600d32`; commit timestamp `2026-07-28T14:45:47+02:00`; 1,032 tracked paths.

## Scope and evidence

Upstream description excerpt (a project claim, automatically extracted from [README](https://github.com/spencermarx/open-code-review/blob/fee6905939eaa804dfd90d815cecbcb26f600d32/README.md)):

> scraped name comes from the image alt ("Open Code Review"). This keeps the semantic heading for SEO + screen readers + the document outline while removing

Build/package evidence: [package.json](https://github.com/spencermarx/open-code-review/blob/fee6905939eaa804dfd90d815cecbcb26f600d32/package.json); [packages/agents/package.json](https://github.com/spencermarx/open-code-review/blob/fee6905939eaa804dfd90d815cecbcb26f600d32/packages/agents/package.json); [packages/cli-e2e/package.json](https://github.com/spencermarx/open-code-review/blob/fee6905939eaa804dfd90d815cecbcb26f600d32/packages/cli-e2e/package.json); [packages/cli/package.json](https://github.com/spencermarx/open-code-review/blob/fee6905939eaa804dfd90d815cecbcb26f600d32/packages/cli/package.json); [packages/dashboard-api-e2e/package.json](https://github.com/spencermarx/open-code-review/blob/fee6905939eaa804dfd90d815cecbcb26f600d32/packages/dashboard-api-e2e/package.json)

License evidence: [LICENSE](https://github.com/spencermarx/open-code-review/blob/fee6905939eaa804dfd90d815cecbcb26f600d32/LICENSE) Classification hint: Apache-2.0. A root license does not establish rights for every bundled asset, model, or dependency.

## Harness assessment

This entry was catalogued under **ai-agents**. Its category places it in the candidate set for agents, models, channels; those associations are navigational and have not been individually validated as implemented capabilities. See [agents](../agents.md) · [models](../models.md) · [channels](../channels.md) for the source-reviewed alternatives and proposed integration boundaries.

**Disposition:** retain as a comparison candidate. Before adopting it, inspect the implementation entry point and its tests, verify the required protocol and deployment platform, and reproduce a task from the harness evaluation suite. Popularity, a README feature list, and the presence of a package manifest are insufficient evidence of quality or compatibility.

**Unresolved:** runtime behavior, security boundaries, performance, API/subscription eligibility, dependency health, maintenance status, and fit to the proposed harness were not independently established for this entry. No repository code was executed as part of this screening.

## 2026-11-01 scoped source review

Reviewed frozen commit `a793b059f7fa8e7abd9d6acdbd8fa77cc8b166d7` against prior analyzed commit `fee6905939eaa804dfd90d815cecbcb26f600d32`. Historical reviews above remain separate evidence.

The new [pure review-gate evaluator](https://github.com/spencermarx/open-code-review/blob/a793b059f7fa8e7abd9d6acdbd8fa77cc8b166d7/.github/scripts/ocr-review-gate-evaluate.ts) validates closed marker fields, limits marker length/persona count, excludes fenced examples, orders trusted comments and uses the latest review. It collapses numbered persona instances and excludes ephemeral personas. The selected [fixtures](https://github.com/spencermarx/open-code-review/blob/a793b059f7fa8e7abd9d6acdbd8fa77cc8b166d7/.github/scripts/ocr-review-gate-evaluate.test.ts) exercise malformed markers, untrusted commenters, stale heads and persona counting.

Its trust model accepts the PR author or maintainer association as the source of a review assertion; a listed persona is not independently authenticated review execution. SHA coverage accepts a seven-or-more-character prefix, and a later same/later-round address marker can cover a newer head after an older approving review. Bot authors and exemption labels bypass the loop. The renderer calls this a label rather than a required status check. Teamagent should reuse deterministic parsing and stale-evidence reporting, while retaining full exact commit binding, actual verification receipts and explicit authority for any exemption. An address assertion alone must not certify newly changed code.

**Coverage:** Read the complete 428-line evaluator and first 324 source lines of its 581-line fixture, including parser/trust/head-coverage cases. GitHub I/O, workflow permissions, remaining rendering fixtures and live comment behavior were not audited. Source inspection only; no upstream tests, source programs or live providers were executed. This is a scoped architecture review, not a whole-repository correctness or security certification.

## External-update review - 2026-11-01

Reviewed `9fce816b8c9abbd56b95e5c216ef4ca825e46661` against `a793b059f7fa8e7abd9d6acdbd8fa77cc8b166d7`.

The 27-path update moves read-only query admission from a friendly tool preference to explicit provider-specific restrictions. The inspected [Claude adapter](https://github.com/spencermarx/open-code-review/blob/9fce816b8c9abbd56b95e5c216ef4ca825e46661/packages/dashboard/src/server/services/ai-cli/claude-adapter.ts) supplies only Read/Grep/Glob through the complete tool-set flag, denies unapproved operations, disables hooks/slash expansion/MCP and requests working-directory read containment. It probes the CLI on every query or resume and refuses unknown versions or versions below 2.1.295. These are actual adapter arguments; the vendor behavior claimed in comments was not independently exercised here, and this adapter has no upper version bound.

The [OpenCode adapter](https://github.com/spencermarx/open-code-review/blob/9fce816b8c9abbd56b95e5c216ef4ca825e46661/packages/dashboard/src/server/services/ai-cli/opencode-adapter.ts) creates a fresh per-spawn agent with deny-by-default permissions, specific read/search exceptions and external-directory denial. It overrides ambient configuration, disables project configuration/plugins and background features, and admits only versions from 1.3.4 up to but excluding 2.0.0. Workflow execution remains a separate, broader mode.

The complete inspected [containment fixtures](https://github.com/spencermarx/open-code-review/blob/9fce816b8c9abbd56b95e5c216ef4ca825e46661/packages/dashboard/src/server/services/ai-cli/__tests__/query-containment.test.ts) pin arguments, overriding environment values, resumed queries, unknown/changed versions and refusal before spawn. The complete [helper delta](https://github.com/spencermarx/open-code-review/blob/9fce816b8c9abbd56b95e5c216ef4ca825e46661/packages/dashboard/src/server/services/ai-cli/helpers.ts) and [helper fixtures](https://github.com/spencermarx/open-code-review/blob/9fce816b8c9abbd56b95e5c216ef4ca825e46661/packages/dashboard/src/server/services/ai-cli/__tests__/helpers.test.ts) establish exact tool-name comparison and numeric version comparison. These mocked-spawn tests show the intended launch contract, not demonstrated filesystem isolation or vendor enforcement.

**Harness consequence:** Bind capability restrictions to verified adapter versions and reapply them on every resume; do not silently fall back when restrictions are unavailable. Keep inherited settings and startup hooks inside the threat model, and independently test the supported version range. A restricted tool list does not establish provider non-training policy or a general OS sandbox. Scope is these five complete deltas, not the live containment fixtures, all socket handlers or child-environment internals. No vendor CLI, upstream test or provider was executed.

<!-- teamagent-analysis:start -->
Analysis metadata: source [open-code-review.spencermarx](https://github.com/spencermarx/open-code-review); analyzed commit `9fce816b8c9abbd56b95e5c216ef4ca825e46661`; commit date 2026-11-01T12:50:05+01:00; review date 2026-11-01T23:12:06.798Z; depth screened. [Maintenance record](../analyses/repos/ai-agents--open-code-review.spencermarx.md).
<!-- teamagent-analysis:end -->
