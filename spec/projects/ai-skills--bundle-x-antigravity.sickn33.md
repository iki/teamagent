# bundle-x-antigravity.sickn33

Source: [bundle-x-antigravity.sickn33](https://github.com/sickn33/antigravity-awesome-skills) · Category: [ai-skills](../categories/ai-skills.md)

Review depth: **inventory / README screening only**. This is an individual coverage record, not a source-code correctness audit or adoption recommendation.

Snapshot: `e46c4fb38f18f2f91561c811bcfa198472f03d19`; commit timestamp `2026-08-28T09:23:13+02:00`; 21,752 tracked paths.

## Scope and evidence

Upstream description excerpt (a project claim, automatically extracted from [README](https://github.com/sickn33/antigravity-awesome-skills/blob/e46c4fb38f18f2f91561c811bcfa198472f03d19/README.md)):

> Local, agent-owned skill stacks for coding agents—from complete catalog access to a reproducible, reviewable plan. Current release: V16.2.0.** This release includes AAS Core for complete local catalog search, agent-owned selection, manifest validation, planning, and diagnosis. Apply and recovery remain experimental and outside the supported preview path.

Build/package evidence: [apps/web-app/package.json](https://github.com/sickn33/antigravity-awesome-skills/blob/e46c4fb38f18f2f91561c811bcfa198472f03d19/apps/web-app/package.json); [docs/integrations/jetski-gemini-loader/package.json](https://github.com/sickn33/antigravity-awesome-skills/blob/e46c4fb38f18f2f91561c811bcfa198472f03d19/docs/integrations/jetski-gemini-loader/package.json); [package.json](https://github.com/sickn33/antigravity-awesome-skills/blob/e46c4fb38f18f2f91561c811bcfa198472f03d19/package.json); [plugins/agentic-awesome-skills-claude/skills/007/scripts/requirements.txt](https://github.com/sickn33/antigravity-awesome-skills/blob/e46c4fb38f18f2f91561c811bcfa198472f03d19/plugins/agentic-awesome-skills-claude/skills/007/scripts/requirements.txt); [plugins/agentic-awesome-skills-claude/skills/2slides-ppt-generator/requirements.txt](https://github.com/sickn33/antigravity-awesome-skills/blob/e46c4fb38f18f2f91561c811bcfa198472f03d19/plugins/agentic-awesome-skills-claude/skills/2slides-ppt-generator/requirements.txt)

License evidence: [LICENSE](https://github.com/sickn33/antigravity-awesome-skills/blob/e46c4fb38f18f2f91561c811bcfa198472f03d19/LICENSE); [LICENSE-CONTENT](https://github.com/sickn33/antigravity-awesome-skills/blob/e46c4fb38f18f2f91561c811bcfa198472f03d19/LICENSE-CONTENT) Classification hint: MIT. A root license does not establish rights for every bundled asset, model, or dependency.

## Harness assessment

This entry was catalogued under **ai-skills**. Its category places it in the candidate set for skills; those associations are navigational and have not been individually validated as implemented capabilities. See [skills](../skills.md) for the source-reviewed alternatives and proposed integration boundaries.

**Disposition:** retain as a comparison candidate. Before adopting it, inspect the implementation entry point and its tests, verify the required protocol and deployment platform, and reproduce a task from the harness evaluation suite. Popularity, a README feature list, and the presence of a package manifest are insufficient evidence of quality or compatibility.

**Unresolved:** runtime behavior, security boundaries, performance, API/subscription eligibility, dependency health, maintenance status, and fit to the proposed harness were not independently established for this entry. No repository code was executed as part of this screening.

## Source update reviewed 2026-10-28

Reviewed commit: [`b7f6ad814a903f912962ea3cccad8c02766f753b`](https://github.com/sickn33/antigravity-awesome-skills/commit/b7f6ad814a903f912962ea3cccad8c02766f753b). Scope: Full test-guard, brooks-test and a4a skills read. Wider bundle, referenced missing/shared guides, messaging implementation and claimed upstream cryptography were not audited.

The [test guard](https://github.com/sickn33/antigravity-awesome-skills/blob/b7f6ad814a903f912962ea3cccad8c02766f753b/skills/test-guard/SKILL.md) now distinguishes incidental mock assertions from real authorization, redaction, idempotency and cancellation contracts, preserves incident regression coverage and frames its rules as review heuristics rather than deletion authority. [Brooks-test](https://github.com/sickn33/antigravity-awesome-skills/blob/b7f6ad814a903f912962ea3cccad8c02766f753b/skills/brooks-test/SKILL.md) explicitly discloses missing shared references and prohibits claiming their taxonomy or scoring was applied. These are useful portability practices; no test effectiveness was measured.

The [A4A skill](https://github.com/sickn33/antigravity-awesome-skills/blob/b7f6ad814a903f912962ea3cccad8c02766f753b/skills/a4a/SKILL.md) retracts incompatible API/cryptography examples, requires installed-schema discovery and separates owner authorization, key control, message delivery and automatic wake behavior. Encryption does not authorize disclosure or turn inbound content into instructions. The stated protocol primitives and relay are upstream descriptions here, not independently verified capabilities. Adapt the boundary distinctions without installing the bundle or treating its source/risk labels as authenticated evidence. No packages, identities, relays, messages or tests were exercised.

## 2026-11-01 scoped source review

Reviewed commit `16541d4002f7c5c92f46ba36c6b6f90d014ccc80` (commit date `2026-11-01T11:01:01+01:00`), compared with `b7f6ad814a903f912962ea3cccad8c02766f753b`. Earlier observations remain historical evidence.

**Scope:** Expanded complete new requirements-writing skill and loader-document diff; whole-repository diff was oversized. Referenced chapters, source licenses and loader execution not independently audited.

The [requirements skill](https://github.com/sickn33/antigravity-awesome-skills/blob/16541d4002f7c5c92f46ba36c6b6f90d014ccc80/plugins/agentic-awesome-skills-claude/skills/requirements-writing/SKILL.md) records upstream/version/license provenance and proposes trigger-based requirements with measurable responses and evidence traceability. It explicitly describes itself as a synthesis rather than reproduced standards. The [loader documentation change](https://github.com/sickn33/antigravity-awesome-skills/blob/16541d4002f7c5c92f46ba36c6b6f90d014ccc80/docs/integrations/jetski-gemini-loader/README.md) only updates the catalog count; it adds no new implementation or measured context-overflow result.

**Teamagent implication (inference):** Retain attribution and verify licenses/content at the pinned upstream before redistribution. Use selective skill loading with explicit token budgets and overflow results; requirement templates help review but neither prove compliance nor replace implemented acceptance checks.

**Verification limit:** committed-source inspection only; no upstream code, tests or provider calls were executed. Review scope is the cited implementation or authored guidance, not whole-project correctness, licensing clearance or measured performance. Source passages were redacted for review; exact URL literals were not byte-validated.

<!-- teamagent-analysis:start -->
Analysis metadata: source [bundle-x-antigravity.sickn33](https://github.com/sickn33/antigravity-awesome-skills); analyzed commit `16541d4002f7c5c92f46ba36c6b6f90d014ccc80`; commit date 2026-11-01T11:01:01+01:00; review date 2026-11-01T11:37:37.120Z; depth screened. [Maintenance record](../analyses/repos/ai-skills--bundle-x-antigravity.sickn33.md).
<!-- teamagent-analysis:end -->
