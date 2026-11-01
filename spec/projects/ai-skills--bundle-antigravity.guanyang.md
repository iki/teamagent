# bundle-antigravity.guanyang

Source: [bundle-antigravity.guanyang](https://github.com/guanyang/antigravity-skills) · Category: [ai-skills](../categories/ai-skills.md)

Review depth: **inventory / README screening only**. This is an individual coverage record, not a source-code correctness audit or adoption recommendation.

Snapshot: `2e93d3a2acdf71a51eef31b9eb5cdb02ecd54d65`; commit timestamp `2026-10-02T04:49:36Z`; 2,624 tracked paths.

## Scope and evidence

Upstream description excerpt (a project claim, automatically extracted from [README](https://github.com/guanyang/antigravity-skills/blob/2e93d3a2acdf71a51eef31b9eb5cdb02ecd54d65/README.md)):

> A lightweight, zero-dependency CLI tool to manage and activate capabilities for AI coding assistants (such as Claude Code, Cursor, Trae, etc.). With a single command, you can link **Skills** (modular prompting), **Agents** (expert workflow roles), and **Commands** (slash commands) to your project workspaces or global system configurations. (Note: `AGENTS.md`, `CLAUDE.md`, and `GEMINI.md` contain project-level LLM coding behavioral guidelines, derived from andrej-karpathy-skills)

Build/package evidence: [package.json](https://github.com/guanyang/antigravity-skills/blob/2e93d3a2acdf71a51eef31b9eb5cdb02ecd54d65/package.json); [skills/baoyu-danger-gemini-web/scripts/package.json](https://github.com/guanyang/antigravity-skills/blob/2e93d3a2acdf71a51eef31b9eb5cdb02ecd54d65/skills/baoyu-danger-gemini-web/scripts/package.json); [skills/baoyu-danger-x-to-markdown/scripts/package.json](https://github.com/guanyang/antigravity-skills/blob/2e93d3a2acdf71a51eef31b9eb5cdb02ecd54d65/skills/baoyu-danger-x-to-markdown/scripts/package.json); [skills/baoyu-format-markdown/scripts/package.json](https://github.com/guanyang/antigravity-skills/blob/2e93d3a2acdf71a51eef31b9eb5cdb02ecd54d65/skills/baoyu-format-markdown/scripts/package.json); [skills/baoyu-markdown-to-html/scripts/package.json](https://github.com/guanyang/antigravity-skills/blob/2e93d3a2acdf71a51eef31b9eb5cdb02ecd54d65/skills/baoyu-markdown-to-html/scripts/package.json)

License evidence: [LICENSE](https://github.com/guanyang/antigravity-skills/blob/2e93d3a2acdf71a51eef31b9eb5cdb02ecd54d65/LICENSE) Classification hint: MIT. A root license does not establish rights for every bundled asset, model, or dependency.

## Harness assessment

This entry was catalogued under **ai-skills**. Its category places it in the candidate set for skills; those associations are navigational and have not been individually validated as implemented capabilities. See [skills](../skills.md) for the source-reviewed alternatives and proposed integration boundaries.

**Disposition:** retain as a comparison candidate. Before adopting it, inspect the implementation entry point and its tests, verify the required protocol and deployment platform, and reproduce a task from the harness evaluation suite. Popularity, a README feature list, and the presence of a package manifest are insufficient evidence of quality or compatibility.

**Unresolved:** runtime behavior, security boundaries, performance, API/subscription eligibility, dependency health, maintenance status, and fit to the proposed harness were not independently established for this entry. No repository code was executed as part of this screening.

## Source update reviewed 2026-10-28

Reviewed commit: [`dbefc83e32a42b7319fef8af75e3e307506251c8`](https://github.com/guanyang/antigravity-skills/commit/dbefc83e32a42b7319fef8af75e3e307506251c8). Scope: Full Remotion creation skill, sound-effect reference and CLAUDE.md testing reference read. Rendering code, media licenses, subagent evaluation harness and the wider bundle were not reviewed.

The [creation skill](https://github.com/guanyang/antigravity-skills/blob/dbefc83e32a42b7319fef8af75e3e307506251c8/skills/remotion-create/SKILL.md) checks hidden directory contents before choosing an existing folder or new subfolder and distinguishes meaningful .env/.git entries from disposable metadata. That preservation rule is useful; its latest-version scaffold and npm instructions do not fit Teamagent's pinned dependency workflow. The [sound-effect list](https://github.com/guanyang/antigravity-skills/blob/dbefc83e32a42b7319fef8af75e3e307506251c8/skills/remotion-markup/sfx.md) supplies remote assets, without demonstrating license rights, immutable versions or media integrity.

The [documentation experiment](https://github.com/guanyang/antigravity-skills/blob/dbefc83e32a42b7319fef8af75e3e307506251c8/skills/writing-skills/references/CLAUDE_MD_TESTING.md) includes a no-skill baseline and pressure scenarios, but its success criterion is compliance with skill loading, not independent task correctness. Expected results are predictions, and the harness is listed as future work in this file. Test selection precision, unnecessary loading, authority preservation and outcomes alongside compliance; a skill should not override user instructions merely to pass its own rubric. No project, media, subagent experiment or tests were run.

## 2026-11-01 scoped source review

Reviewed commit `0b394cddfb8910f6287441ef8b9c9447e36fc3fc` (commit date `2026-10-31T04:47:03Z`), compared with `dbefc83e32a42b7319fef8af75e3e307506251c8`. Earlier observations remain historical evidence.

**Scope:** Complete main-agent hook classifier diff; nine changed paths inventoried. Host event producers and surrounding fixtures not audited.

The [plan injector](https://github.com/guanyang/antigravity-skills/blob/0b394cddfb8910f6287441ef8b9c9447e36fc3fc/skills/planning-with-files/scripts/inject-plan.py) treats absent or empty agent_id as main-agent input, ignores agent_type, and skips malformed input in the classifier. With the optional skip-subagents setting, pre/post-tool hooks return before state processing for other classifications. The classifier's stdin read is unbounded, and an event field is not independently authenticated identity.

**Teamagent implication (inference):** Version host-specific event contracts and bound input before decoding. Keep subagent filtering distinct from authorization and expose unsupported/unknown host events rather than importing a role heuristic as a universal harness rule.

**Verification limit:** committed-source inspection only; no upstream code, tests or provider calls were executed. Review scope is the cited implementation or authored guidance, not whole-project correctness, licensing clearance or measured performance. Source passages were redacted for review; exact URL literals were not byte-validated.

<!-- teamagent-analysis:start -->
Analysis metadata: source [bundle-antigravity.guanyang](https://github.com/guanyang/antigravity-skills); analyzed commit `0b394cddfb8910f6287441ef8b9c9447e36fc3fc`; commit date 2026-10-31T04:47:03Z; review date 2026-11-01T11:37:37.120Z; depth screened. [Maintenance record](../analyses/repos/ai-skills--bundle-antigravity.guanyang.md).
<!-- teamagent-analysis:end -->
