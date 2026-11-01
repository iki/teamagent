# deeptutor

Source: [deeptutor](https://github.com/HKUDS/DeepTutor) · Category: [ai-agents](../categories/ai-agents.md)

Original review depth: **inventory / README screening only**. The dated update review below has its own explicit scope. This is an individual coverage record, not a source-code correctness audit or adoption recommendation.

Snapshot: `ef2d9e5c3c99fd073742c5aadc2bb9584b1e503b`; commit timestamp `2026-09-27T13:34:05+08:00`; 3,518 tracked paths.

## Scope and evidence

Upstream description excerpt (a project claim, automatically extracted from [README](https://github.com/HKUDS/DeepTutor/blob/ef2d9e5c3c99fd073742c5aadc2bb9584b1e503b/README.md)):

> 🤝 **We welcome any kinds of contributing!** Vote on roadmap items or propose new ones at `Roadmap`, and see our Contributing Guide for branching strategy, coding standards, and how to get started. [2026.9.27]** v1.6.12 — Workspace KB moves, Kiwix archives, source figures, Task Board, German UI, and chat recovery.

Build/package evidence: [packaging/deeptutor-cli/pyproject.toml](https://github.com/HKUDS/DeepTutor/blob/ef2d9e5c3c99fd073742c5aadc2bb9584b1e503b/packaging/deeptutor-cli/pyproject.toml); [pyproject.toml](https://github.com/HKUDS/DeepTutor/blob/ef2d9e5c3c99fd073742c5aadc2bb9584b1e503b/pyproject.toml); [requirements.txt](https://github.com/HKUDS/DeepTutor/blob/ef2d9e5c3c99fd073742c5aadc2bb9584b1e503b/requirements.txt); [web/package.json](https://github.com/HKUDS/DeepTutor/blob/ef2d9e5c3c99fd073742c5aadc2bb9584b1e503b/web/package.json)

License evidence: [LICENSE](https://github.com/HKUDS/DeepTutor/blob/ef2d9e5c3c99fd073742c5aadc2bb9584b1e503b/LICENSE) Classification hint: Apache-2.0. A root license does not establish rights for every bundled asset, model, or dependency.

## Harness assessment

This entry was catalogued under **ai-agents**. Its category places it in the candidate set for agents, models, channels; those associations are navigational and have not been individually validated as implemented capabilities. See [agents](../agents.md) · [models](../models.md) · [channels](../channels.md) for the source-reviewed alternatives and proposed integration boundaries.

**Disposition:** retain as a comparison candidate. Before adopting it, inspect the implementation entry point and its tests, verify the required protocol and deployment platform, and reproduce a task from the harness evaluation suite. Popularity, a README feature list, and the presence of a package manifest are insufficient evidence of quality or compatibility.

**Unresolved:** runtime behavior, security boundaries, performance, API/subscription eligibility, dependency health, maintenance status, and fit to the proposed harness were not independently established for this entry. No repository code was executed as part of this screening.

## 2026-10-28 scoped update review

Reviewed commit `a31d82624c27d75f4e771d4fcb78dce16470b383` (commit date `2026-10-19T04:12:56+08:00`). The original snapshot above remains historical evidence.

**Scope:** Complete browser authentication status/cache helper, auth-status hook and session API adapter; backend authentication and submission fencing, shared cache/storage helpers, session UI and tests were not audited.

The [authentication cache](https://github.com/HKUDS/DeepTutor/blob/a31d82624c27d75f4e771d4fcb78dce16470b383/web/lib/auth.ts#L37-L111) coalesces requests and uses a generation counter so an older status response cannot repopulate state after an authentication boundary. Cross-tab storage contains an invalidation hint rather than a trusted principal; each tab rechecks the server. Null results have a shorter cache lifetime than stable answers. However, response JSON is assigned a TypeScript interface without runtime validation, and the helper's policy fields must not become authority merely because a type annotation exists. Logout clears local identity even if the server call fails, which is not evidence that the server session was revoked.

The [auth-status hook](https://github.com/HKUDS/DeepTutor/blob/a31d82624c27d75f4e771d4fcb78dce16470b383/web/hooks/useAuthStatus.ts#L32-L92) exposes availability separately from authenticated state, but loads once per mount; the storage listener refreshes the shared helper without directly updating this hook's state. Its empty allowed-surface list falls back to chat/reading for presentation. Teamagent should subscribe mounted consumers to explicit identity generations and preserve the difference between unknown policy, an empty permission set and a display default. This review does not claim a backend authorization bypass.

The [session adapter](https://github.com/HKUDS/DeepTutor/blob/a31d82624c27d75f4e771d4fcb78dce16470b383/web/lib/session-api.ts#L9-L19) requires an explicit true capability before offering uncertain-submission replacement, while the [replacement request](https://github.com/HKUDS/DeepTutor/blob/a31d82624c27d75f4e771d4fcb78dce16470b383/web/lib/session-api.ts#L323-L335) names the original submission. That supports a server-side reconciliation design, but fencing was not inspected. The same adapter deduplicates page results by workspace plus session identity, yet its fetch-all loops have no total page/item budget. Generic JSON response casts and a never-settling promise after a 401 redirect are additional host-boundary obligations. Receipt types, deletion booleans and trace completeness fields should be validated, and authentication transitions should settle waiting callers explicitly.

**Verification limit:** source inspection only; no upstream tests or provider calls were executed. This scoped review does not certify every file in the repository.

## 2026-11-01 scoped source review

Reviewed commit `f7aed0744c36c5afef16a4261c31ebee1208cac2` (commit date `2026-11-01T00:50:27+08:00`), compared with `a31d82624c27d75f4e771d4fcb78dce16470b383`. Earlier observations remain historical evidence.

**Scope:** Expanded complete Markdown projection and grounding fixture diff; whole-repository diff was oversized. Calling grounding function and browser selection transport not audited.

The [projection](https://github.com/HKUDS/DeepTutor/blob/f7aed0744c36c5afef16a4261c31ebee1208cac2/deeptutor/services/session/selection_grounding.py) strips structural Markdown while retaining inline/code-block text and literal math, then normalizes whitespace. [Grounding fixtures](https://github.com/HKUDS/DeepTutor/blob/f7aed0744c36c5afef16a4261c31ebee1208cac2/tests/services/session/test_selection_grounding.py) reject changed numbers, operators and identifiers while accepting rendered table/list/link text. This tests wording correspondence rather than source truth, and the projection alone does not retain original text offsets or full cue/layout fidelity.

**Teamagent implication (inference):** Keep original source, rendered selection and explicit mapping as separate evidence. Match approved wording without normalization that erases semantic differences, and preserve exact subtitle line breaks/cue mapping where that stronger contract applies; grounded quotation does not make an external claim verified.

**Verification limit:** committed-source inspection only; no upstream code, tests or provider calls were executed. Review scope is the cited implementation or authored guidance, not whole-project correctness, licensing clearance or measured performance. Source passages were redacted for review; exact URL literals were not byte-validated.

<!-- teamagent-analysis:start -->
Analysis metadata: source [deeptutor](https://github.com/HKUDS/DeepTutor); analyzed commit `f7aed0744c36c5afef16a4261c31ebee1208cac2`; commit date 2026-11-01T00:50:27+08:00; review date 2026-11-01T11:33:30.893Z; depth screened. [Maintenance record](../analyses/repos/ai-agents--deeptutor.md).
<!-- teamagent-analysis:end -->
