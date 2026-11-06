---
name: skills-distribution
description: Distribute selected repository-owned skills through the Vercel Skills CLI with reviewed versions and project-level provenance. Use for cross-project skill installation, updates, or packaging; not for implicitly changing agent trust, hooks, or dependency ownership.
---

# Distribute selected skills

Read the target project's skills/toolchain policy and existing installed-skill lock. Keep authored skill sources separate from installed copies. Select only the skills and agents needed by the target; a shared collection is not a mandate to adopt every stack or workflow it describes. Before any noninteractive install or replacement, compare every selected installed skill (including supporting files) with the previously reviewed content and its recorded source. Check tracked and untracked edits, symlink destinations and local overrides. Preserve any drift in an owned backup or commit and resolve whether to retain, upstream or replace it before proceeding; a lock hash alone does not prove the installed files are unchanged. Do not overwrite unrelated local skills or customize imported bytes while retaining their original claimed hash.

Use a reviewed pinned Vercel `skills` CLI through the target's approved launcher. Official examples use `npx`; that is not permission to introduce another package manager or runtime. The reviewed **1.7.6** package declares Node >=22.20 and a Node shebang. Bun-only projects must validate direct Bun execution of that pinned package before adopting a Bun wrapper. Do not silently fall back to Node or weaken dependency trust if compatibility fails.

## Versioned installation and updates

For CLI 1.7.6, quote a Git source with `#` and a full 40-character commit SHA, then select names and agents explicitly. The following uses `skills` as a placeholder for the project's validated invocation, not a dependency command:

```sh
skills add "owner/repository#FULL_COMMIT_SHA" --skill selected-skill --agent codex --yes
skills list --agent codex
skills check -p
skills add "owner/repository#NEW_REVIEWED_FULL_COMMIT_SHA" --skill selected-skill --agent codex --yes
```

At this version, `owner/repository@value` selects a skill; it is not the full-SHA pin syntax. Current upstream `main` can differ from the release despite sharing its version string. Verify examples against the exact installed release source. `check` may contact sources and telemetry even though it preserves installed content. Set the CLI's supported telemetry opt-out for private maintenance.

Use project scope unless global installation is explicitly requested. Inspect selected-agent discovery and symlink/copy behavior. Agent placement does not activate hooks or grant permissions. Retain installed skill content and the project's `skills-lock.json` according to its version-control policy; review unexpected source, path, agent-target, or unrelated lock changes.

Prefer explicit selected `add` with the reviewed revision and target agents for replacement. Do not use a generic `update` command whose agent discovery or placement has not been validated for that project. Selective `update` follows the saved ref. A SHA-pinned source stays at that SHA; advance it with an explicit `add` at a newly reviewed revision. Review changed instructions and compatibility before promotion. Do not hand-edit computed hashes to disguise drift, blindly update every installed skill, or treat a hash match as behavioral validation.

The release's npm-packaged skill sync and lock restoration commands are experimental. Use them only when deliberately selected and tested against the pinned version; Git-backed selective installation is sufficient for a collection maintained in a repository. Skills carry instructions and small needed resources; shared enforcement code should remain a separately versioned, tested dependency instead of being copied into every skill.

Author each skill around one useful capability with a discriminating description. Keep project destinations, authorizations, pins, commands, limits, and schemas in the project's own policy. Validate skill syntax and references, then exercise meaningful scenarios when behavior is risky. Installation success alone does not establish that agents follow the intended workflow.

Release references: [commands](https://github.com/vercel-labs/skills/blob/v1.7.6/docs/commands.md), [source parser](https://github.com/vercel-labs/skills/blob/v1.7.6/src/source-parser.ts), [update ref handling](https://github.com/vercel-labs/skills/blob/v1.7.6/src/update-source.ts).
