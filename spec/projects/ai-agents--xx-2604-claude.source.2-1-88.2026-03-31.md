# xx-2604-claude.source.2-1-88.2026-03-31

Source: [xx-2604-claude.source.2-1-88.2026-03-31](https://github.com/chatgptprojects/claude-code) · Category: [ai-agents](../categories/ai-agents.md)

Original review depth: **inventory / README screening only**. The dated update review below has its own explicit scope. This is an individual coverage record, not a source-code correctness audit or adoption recommendation.

Snapshot: `e188f077b61c9ab2fa55498e07a00189184748d9`; commit timestamp `2026-04-03T14:50:47+08:00`; 20 tracked paths.

## Scope and evidence

Upstream description excerpt (a project claim, automatically extracted from [README](https://github.com/chatgptprojects/claude-code/blob/e188f077b61c9ab2fa55498e07a00189184748d9/README.md)):

> Clear-Code** is a comprehensive, community-driven resource hub dedicated to cataloging, comparing, and promoting the best **open-source AI coding assistants** available today. Whether you're a solo developer, a startup founder, or part of a large engineering team, this repository is your one-stop guide to finding the right AI-powered coding tool — without vendor lock-in, without closed-source limitations, and without the hefty price tags. The AI coding assistant space is evolving at breakneck speed. New tools launch every week, existing tools s

Build/package evidence: No common build manifest identified.

License evidence: [LICENSE](https://github.com/chatgptprojects/claude-code/blob/e188f077b61c9ab2fa55498e07a00189184748d9/LICENSE) Classification hint: MIT. A root license does not establish rights for every bundled asset, model, or dependency.

## Harness assessment

This entry was catalogued under **ai-agents**. Its category places it in the candidate set for agents, models, channels; those associations are navigational and have not been individually validated as implemented capabilities. See [agents](../agents.md) · [models](../models.md) · [channels](../channels.md) for the source-reviewed alternatives and proposed integration boundaries.

**Disposition:** retain as a comparison candidate. Before adopting it, inspect the implementation entry point and its tests, verify the required protocol and deployment platform, and reproduce a task from the harness evaluation suite. Popularity, a README feature list, and the presence of a package manifest are insufficient evidence of quality or compatibility.

**Unresolved:** runtime behavior, security boundaries, performance, API/subscription eligibility, dependency health, maintenance status, and fit to the proposed harness were not independently established for this entry. No repository code was executed as part of this screening.

## 2026-10-28 scoped update review

Reviewed commit `7a708ce17d05bd390da88b2350f4b794d9427f18` (commit date `2026-10-07T12:04:08-04:00`). The original snapshot above remains historical evidence.

**Scope:** Pinned README identity/setup section, license and two vulnerability-workflow helper scripts; the remainder of the skill collection, advertised hosted gateway and any historical vendor source snapshot were not audited.

The pinned [README](https://github.com/chatgptprojects/claude-code/blob/7a708ce17d05bd390da88b2350f4b794d9427f18/README.md#L1-L50) identifies this tree as Leanmcp Skills & AI Gateway, and the [license](https://github.com/chatgptprojects/claude-code/blob/7a708ce17d05bd390da88b2350f4b794d9427f18/LICENSE) names Leanmcp and contributors. The historical catalog ID mentioning Claude Code 2.1.88 is retained for provenance, but this current snapshot must not be cited as Anthropic runtime implementation or as proof of that version's internals. README gateway setup explicitly changes the API destination and advertises full request/response logging; no endpoint was configured or called, and those hosted-service claims were not verified.

The [triage helper](https://github.com/chatgptprojects/claude-code/blob/7a708ce17d05bd390da88b2350f4b794d9427f18/skills/vuln-repro/scripts/triage.py) validates the CVE-shaped input, queries three public database endpoints with per-request timeouts and prints separate errors. Its provisional patch signal can arise from a tagged patch, an unaffected range, a fixed event or a withdrawn record; none proves that a particular deployment has the fix. Teamagent must retain those distinct evidence meanings and require the actual vendor version/diff and affected configuration before presenting a resolved-vulnerability conclusion.

The [reducer](https://github.com/chatgptprojects/claude-code/blob/7a708ce17d05bd390da88b2350f4b794d9427f18/skills/vuln-repro/scripts/minimize.py#L37-L119) first verifies the original input against a user-supplied exit-code oracle, uses per-test timeouts and cleans temporary candidate files. It deliberately executes a shell command and reads the full input into memory; it provides neither an isolated execution environment nor a whole-reduction resource budget. Treat it as trusted local test tooling, never inert imported content or a safety decision supplied by a model. No helper or reproduction was executed.

**Verification limit:** source inspection only; no upstream tests or provider calls were executed. This scoped review does not certify every file in the repository.

<!-- teamagent-analysis:start -->
Analysis metadata: source [claude.source.2-1-88.2026-03-31](https://github.com/chatgptprojects/claude-code); analyzed commit `7a708ce17d05bd390da88b2350f4b794d9427f18`; commit date 2026-10-07T12:04:08-04:00; review date 2026-10-28T08:47:42.123Z; depth screened. [Maintenance record](../analyses/repos/ai-agents--xx-2604-claude.source.2-1-88.2026-03-31.md).
<!-- teamagent-analysis:end -->
