# plan.obra-superpowers: change evidence

Source: [plan.obra-superpowers](https://github.com/obra/superpowers) · [Analysis](../../projects/ai-skills--plan.obra-superpowers.md) · [skills](../../skills.md), [evolution](../../evolution.md), [agents](../../agents.md)

Generated: 2026-10-27T18:19:07.717Z. Status: **changed**. Reviewed SHA: `8ca22dba9a94f28898bbce59f2537ff4d87c747d`; commit date: 2026-09-25T11:06:27-07:00; review date: 2026-10-04; observed SHA: `2ce8aa15d05bd57213e6f746f953aafb7ded7a8b`.

This generated packet is a bounded change locator, not a source review or a quality measurement. [Source comparison](https://github.com/obra/superpowers/compare/8ca22dba9a94f28898bbce59f2537ff4d87c747d...2ce8aa15d05bd57213e6f746f953aafb7ded7a8b). Working-tree changes: false; shallow history: false; report changed since recorded review: false.

- Git discovery: unchanged; source lifecycle: active; upstream availability: available.

## Recent commits

- [2ce8aa15d05b](https://github.com/obra/superpowers/commit/2ce8aa15d05bd57213e6f746f953aafb7ded7a8b) 2026-10-21T14:00:49-07:00: Release v7.0.1: brainstorming retune, skills that better survive compaction, contribution templates (#2581)
- [b739a8af570e](https://github.com/obra/superpowers/commit/b739a8af570e10a95898f2bdf6cec97467fa6c12) 2026-10-20T13:13:37-07:00: Templates: require a human-written summary and the filer's instructions (#2570)
- [bb92a7774141](https://github.com/obra/superpowers/commit/bb92a77741419a4ab5f06e711a283343f1ada0c3) 2026-10-09T17:28:04-07:00: Release v7.0.0: rebuilt brainstorming, Antigravity Marketplace manifest, Windows hook fixes (#2489)

## Changed paths

- A: `.antigravity-plugin/plugin.json`
- M: `.claude-plugin/marketplace.json`
- M: `.claude-plugin/plugin.json`
- M: `.codex-plugin/plugin.json`
- M: `.cursor-plugin/plugin.json`
- M: `.devin-plugin/plugin.json`
- M: `.github/ISSUE_TEMPLATE/bug_report.md`
- D: `.github/ISSUE_TEMPLATE/diagnosis_report.md`
- M: `.github/ISSUE_TEMPLATE/feature_request.md`
- M: `.github/ISSUE_TEMPLATE/platform_support.md`
- M: `.github/PULL_REQUEST_TEMPLATE.md`
- M: `.hermes-plugin/__init__.py`
- M: `.hermes-plugin/plugin.yaml`
- M: `.kimi-plugin/plugin.json`
- M: `.muse-plugin/marketplace.json`
- M: `.muse-plugin/plugin.json`
- M: `.opencode/INSTALL.md`
- M: `.version-bump.json`
- M: `AGENTS.md`
- M: `README.md`
- M: `RELEASE-NOTES.md`
- A: `assets/antigravity-logo.png`
- M: `docs/README.opencode.md`
- M: `docs/porting-to-a-new-harness.md`
- D: `docs/superpowers/plans/2026-01-22-document-review-system.md`
- D: `docs/superpowers/plans/2026-02-19-visual-brainstorming-refactor.md`
- D: `docs/superpowers/plans/2026-03-11-zero-dep-brainstorm-server.md`
- D: `docs/superpowers/plans/2026-03-23-codex-app-compatibility.md`
- D: `docs/superpowers/plans/2026-04-06-worktree-rototill.md`
- D: `docs/superpowers/plans/2026-05-06-lift-drill-into-evals.md`
- D: `docs/superpowers/plans/2026-05-07-pi-extension-and-evals.md`
- D: `docs/superpowers/plans/2026-06-09-sdd-task-scoped-review-dispatch.md`
- D: `docs/superpowers/plans/2026-06-09-visual-companion-issues.md`
- D: `docs/superpowers/plans/2026-06-10-visual-companion-auth-hardening.md`
- D: `docs/superpowers/plans/2026-06-11-visual-companion-final-hardening-fixup.md`
- D: `docs/superpowers/plans/2026-07-06-sdd-plan-scoped-workspace.md`
- D: `docs/superpowers/plans/2026-07-15-sdd-fix-loop-redesign.md`
- D: `docs/superpowers/plans/2026-07-30-codex-efficiency-fixes.md`
- D: `docs/superpowers/plans/2026-08-06-hermes-version-bump-wiring.md`
- D: `docs/superpowers/plans/2026-08-27-diagnosing-superpowers.md`
- M: `docs/superpowers/specs/2026-08-27-diagnosing-superpowers-design.md`
- A: `docs/superpowers/specs/2026-10-05-brainstorming-rebuild-design.md`
- A: `docs/superpowers/specs/2026-10-06-antigravity-marketplace-design.md`
- M: `docs/windows/polyglot-hooks.md`
- M: `gemini-extension.json`
- M: `hooks/run-hook.cmd`
- M: `hooks/session-start`
- M: `package.json`
- M: `scripts/bump-version.sh`
- A: `scripts/render-antigravity-logo.sh`
- M: `scripts/sync-to-codex-plugin.sh`
- M: `skills/brainstorming/SKILL.md`
- A: `skills/brainstorming/builder-check-prompt.md`
- M: `skills/brainstorming/scripts/server.cjs`
- D: `skills/brainstorming/spec-document-reviewer-prompt.md`
- M: `skills/diagnosing-superpowers/SKILL.md`
- M: `skills/diagnosing-superpowers/references/github-issues.md`
- M: `skills/diagnosing-superpowers/templates/issue.md`
- M: `skills/executing-plans/SKILL.md`
- M: `skills/executing-plans/scripts/task-done`
- M: `skills/requesting-code-review/SKILL.md`
- M: `skills/subagent-driven-development/SKILL.md`
- A: `skills/subagent-driven-development/references/batching.md`
- A: `skills/subagent-driven-development/references/cannot-verify.md`
- A: `skills/subagent-driven-development/references/final-review.md`
- A: `skills/subagent-driven-development/references/fix-loop.md`
- A: `skills/subagent-driven-development/references/handling-reports.md`
- A: `skills/subagent-driven-development/references/preflight.md`
- A: `skills/subagent-driven-development/references/resuming.md`
- M: `skills/subagent-driven-development/scripts/sdd-workspace`
- M: `skills/systematic-debugging/SKILL.md`
- M: `skills/writing-skills/SKILL.md`
- R100: `skills/writing-skills/references/CLAUDE_MD_TESTING.md` (from `skills/writing-skills/examples/CLAUDE_MD_TESTING.md`)
- R100: `skills/writing-skills/references/anthropic-best-practices.md` (from `skills/writing-skills/anthropic-best-practices.md`)
- A: `skills/writing-skills/references/bulletproofing.md`
- A: `skills/writing-skills/references/discovery.md`
- A: `skills/writing-skills/references/flowcharts.md`
- R100: `skills/writing-skills/references/graphviz-conventions.dot` (from `skills/writing-skills/graphviz-conventions.dot`)
- R100: `skills/writing-skills/references/persuasion-principles.md` (from `skills/writing-skills/persuasion-principles.md`)
- R097: `skills/writing-skills/references/testing-skills-with-subagents.md` (from `skills/writing-skills/testing-skills-with-subagents.md`)
- M: `tests/antigravity/test-antigravity-tools.sh`
- A: `tests/antigravity/test-logo.sh`
- A: `tests/antigravity/test-plugin-manifest.sh`
- M: `tests/brainstorm-server/lifecycle.test.js`
- M: `tests/brainstorm-server/server.test.js`
- M: `tests/claude-code/test-executing-plans-scripts.sh`
- M: `tests/claude-code/test-sdd-workspace.sh`
- M: `tests/codex-plugin-sync/test-sync-to-codex-plugin.sh`
- M: `tests/hermes/conftest.py`
- M: `tests/hermes/test_plugin.py`
- A: `tests/hooks/test-run-hook-cmd-windows.sh`
- M: `tests/hooks/test-session-start.sh`
- A: `tests/skill-size/test-skill-size.sh`
- M: `tests/version-bump/test-bump-version.sh`
- M: `tests/writing-skills/test-render-graphs.sh`
