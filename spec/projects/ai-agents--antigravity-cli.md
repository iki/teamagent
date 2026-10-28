# antigravity-cli

Source: [antigravity-cli](https://github.com/google-antigravity/antigravity-cli) · Category: [ai-agents](../categories/ai-agents.md)

Original review depth: **inventory / README screening only**. The dated update review below has its own explicit scope. This is an individual coverage record, not a source-code correctness audit or adoption recommendation.

Snapshot: `65a3c69e388148c9327f307efe82ddb1c0c8d7d4`; commit timestamp `2026-10-03T03:56:10Z`; 15 tracked paths.

## Scope and evidence

Upstream description excerpt (a project claim, automatically extracted from [README](https://github.com/google-antigravity/antigravity-cli/blob/65a3c69e388148c9327f307efe82ddb1c0c8d7d4/README.md)):

> Antigravity CLI understands your codebase, makes edits with your permission, and executes commands — right from your terminal. - **Official Website**: antigravity.google/product/antigravity-cli

Build/package evidence: No common build manifest identified.

License evidence: No root license file identified; reuse rights unverified. Classification hint: not classified; inspect source. A root license does not establish rights for every bundled asset, model, or dependency.

## Harness assessment

This entry was catalogued under **ai-agents**. Its category places it in the candidate set for agents, models, channels; those associations are navigational and have not been individually validated as implemented capabilities. See [agents](../agents.md) · [models](../models.md) · [channels](../channels.md) for the source-reviewed alternatives and proposed integration boundaries.

**Disposition:** retain as a comparison candidate. Before adopting it, inspect the implementation entry point and its tests, verify the required protocol and deployment platform, and reproduce a task from the harness evaluation suite. Popularity, a README feature list, and the presence of a package manifest are insufficient evidence of quality or compatibility.

**Unresolved:** runtime behavior, security boundaries, performance, API/subscription eligibility, dependency health, maintenance status, and fit to the proposed harness were not independently established for this entry. No repository code was executed as part of this screening.

## 2026-10-27 scoped update review

Reviewed commit `1a0d892bf71df1b14b59f4146dbdfad46c4d4c69` (commit date `2026-10-27T07:10:39Z`). The original snapshot above remains historical evidence.

**Scope:** Complete one-path delta and 15-path tree inspected; README read, with selected new CHANGELOG sections covering errors, credential ownership, lifecycle and workspace behavior. The tracked repository has documentation/examples rather than the released core agent implementation.

The only changed tracked file is `CHANGELOG.md`. The release notes now describe [error-classified failed/cancelled tool calls and sidecar cleanup](https://github.com/google-antigravity/antigravity-cli/blob/1a0d892bf71df1b14b59f4146dbdfad46c4d4c69/CHANGELOG.md#L6-L21), [OAuth credentials scoped to the signed-in identity](https://github.com/google-antigravity/antigravity-cli/blob/1a0d892bf71df1b14b59f4146dbdfad46c4d4c69/CHANGELOG.md#L23-L38), and [preserving sign-in on transient errors](https://github.com/google-antigravity/antigravity-cli/blob/1a0d892bf71df1b14b59f4146dbdfad46c4d4c69/CHANGELOG.md#L164-L178). These are upstream release assertions; the available source does not let this review independently verify the shipped implementation.

They identify useful Teamagent adapter acceptance cases: retain an explicit failure/cancellation state instead of returning ordinary tool success; bind OAuth resources to a verified principal; distinguish credential rejection from transport uncertainty; and join sidecar shutdown with session cleanup. [The documented multi-repository workspace fix](https://github.com/google-antigravity/antigravity-cli/blob/1a0d892bf71df1b14b59f4146dbdfad46c4d4c69/CHANGELOG.md#L185-L198) also reinforces that an adapter must prove which repositories it isolated.

**Disposition:** keep Antigravity as an opaque installed-agent candidate. [README authentication and data-use statements](https://github.com/google-antigravity/antigravity-cli/blob/1a0d892bf71df1b14b59f4146dbdfad46c4d4c69/README.md#L62-L85) are not authenticated account, model-route or training-policy verification; no subscription eligibility or privacy exclusion is inferred. No installer, service, provider or upstream test was run.

**Verification limit:** source inspection only; no upstream tests or provider calls were executed. This scoped review does not certify every file in the repository.

## 2026-10-28 follow-up source review

Reviewed commit `a6b3429ebabafd6efd129c6d2f6161b02f061f22` (commit date `2026-10-28T05:59:44Z`), compared with `1a0d892bf71df1b14b59f4146dbdfad46c4d4c69`. Earlier findings remain historical evidence.

**Scope:** The sole changed release-note section, version 1.4.9; implementation is not exposed by this delta. The complete changed-path inventory contains 1 paths; the assessment below is limited to the cited branches.

The release feed reports narrower approval for sensitive Google application hosts, image-header rejection, history repair for unmatched tool messages, and clipboard/SSH media input improvements. See [CHANGELOG.md](https://github.com/google-antigravity/antigravity-cli/blob/a6b3429ebabafd6efd129c6d2f6161b02f061f22/CHANGELOG.md#L7-L24). These are vendor release claims, not inspected implementations or executed acceptance results.

Use them as adapter test cases: domain approval must not authorize unrelated sensitive subdomains; media should be validated before model submission; malformed history should remain auditable when a provider projection removes entries; missing clipboard tools should produce an explicit unsupported state. Image attachment support does not establish upload consent, local-only operation or a provider training exclusion. The opaque-agent classification remains appropriate.

**Verification limit:** committed-source inspection only; no upstream code, tests or provider calls were executed. This review does not certify every changed file or establish a Teamagent integration.

<!-- teamagent-analysis:start -->
Analysis metadata: source [antigravity-cli](https://github.com/google-antigravity/antigravity-cli); analyzed commit `a6b3429ebabafd6efd129c6d2f6161b02f061f22`; commit date 2026-10-28T05:59:44Z; review date 2026-10-28T14:29:27.414Z; depth screened. [Maintenance record](../analyses/repos/ai-agents--antigravity-cli.md).
<!-- teamagent-analysis:end -->
