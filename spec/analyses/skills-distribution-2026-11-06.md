# Shared skill distribution review

Reviewed on November 6, 2026 using official Vercel Skills release source and GitHub documentation. This review produced nine independently selectable skills under `skills/`: task workspaces, rebase integration, verification evidence, project toolchains, resource lifecycle, conversation records, dependency patches, typed modules, and skill distribution. Existing installed skills and their provenance were preserved. No neighboring project or real agent installation was changed by this review.

## Release boundary

The inspected [1.7.6 manifest](https://github.com/vercel-labs/skills/blob/v1.7.6/package.json) declares Node >=22.20. Its [launcher](https://github.com/vercel-labs/skills/blob/v1.7.6/bin/cli.mjs) has a Node shebang. Teamagent retains Aube dependency ownership and Bun execution; no Node launcher or npm lockfile is introduced. The parent workflow task installed `skills` 1.7.6 through Aube. Bun 1.4.2 directly executed the pinned package and reported 1.7.6. The isolated runtime test installed all nine authored skills with explicit Codex selection and copy placement, verified exact LF bytes and the project lock, then selectively re-added one skill while preserving an unrelated local skill and the lock. It also verified that no global skill lock was written. The measured focused run took 0.940 seconds. Remote SHA fetch behavior remains source-audited rather than live-tested.

The upstream `main` files fetched during this review reported the same version but contained behavior absent from the `v1.7.6` tag. In particular, the release's [parser](https://github.com/vercel-labs/skills/blob/v1.7.6/src/source-parser.ts) treats `@value` as a skill selector. Use quoted `owner/repository#FULL_COMMIT_SHA` with `--skill` for the release, rather than copying `@SHA` examples from newer main. Its [Git adapter](https://github.com/vercel-labs/skills/blob/v1.7.6/src/git.ts) implements a full 40-character SHA fetch fallback after a missing branch/tag. The web review used the release tag; no immutable commit SHA or package tarball integrity was established by that source review. The installed package's exact integrity belongs to the dependency lock and provisioning evidence.

## Consumer operations

The [release command reference](https://github.com/vercel-labs/skills/blob/v1.7.6/docs/commands.md) supports project-scoped selective installation, agent selection, symlink or copy placement, read-only update discovery, and selective updates. Do not use `--all` for a project-specific combination. Its npm package sync and lock restore routes remain experimental. Start with Git-backed selective installs; a skill-only npm package can be evaluated separately if package-manager-controlled distribution becomes useful.

The [update source builder](https://github.com/vercel-labs/skills/blob/v1.7.6/src/update-source.ts) preserves the recorded ref. Consequently, `update -p -y selected-skill` does not advance a SHA pin; a reviewed new SHA requires a new explicit `add`. Keep the project lock and installed content reviewable, preserve unrelated entries, and do not falsify hashes after editing imported copies. A discovery-only check can still use the network and telemetry; use the supported [telemetry opt-out](https://www.skills.sh/docs/cli) for private maintenance.

The authored skills refer to the consumer's workflow/toolchain policy rather than embedding Teamagent's destination, commands, package pins, or authority. Installing them does not configure an agent hook, select a framework, transfer publication authorization, or prove enforcement. Deterministic Git, verification, process, and archive guards stay in tested runtime code. Do not copy that engine into nine independently drifting skill folders.

## Integration and signing

GitHub's native rebase merge creates replacement commits and cannot sign them with the original author's private key. Its documented workaround is local rebase followed by a push to the base branch. A signed PR workflow must combine review of the exact candidate with a permitted local signed integration route; where branch protection forbids that route, the policy conflict needs a deliberate owner decision. Never bypass protection or promise preserved signatures from the native button. See [GitHub's signature documentation](https://docs.github.com/en/authentication/managing-commit-signature-verification/about-commit-signature-verification#signature-verification-for-rebase-and-merge).

## Patch ownership recommendation

Keep shared procedure skills in Teamagent. Prefer a small dedicated neutral repository for patch artifacts and their versioned registry when ownership is migrated: consumer support, upstream fixes, and patch removal have a different release cadence from the harness. Consumers retain selected immutable artifacts and provenance for offline integrity. A skill is the procedure, not the active patch delivery mechanism.

The current [dependency policy](../dependencies.md) remains authoritative. This review does not transfer patch ownership, rename existing provenance, or authorize independent fixes. A later migration must preserve exact bytes/hashes, licenses, supported versions, upstream references, consumer regressions, and removal criteria before changing consumer authority.

## Validation boundary

`test/skills-distribution.test.ts` exercises real pinned CLI execution under Bun in an owned temporary project, with telemetry and bytecode caches disabled and private state paths. It validates local installation, explicit agent placement, copy bytes, selective re-add, foreign-skill preservation and lock behavior. This is not evidence of remote installation, a live agent invoking the skills, or every upstream update route. All nine authored skills passed the installed Skill Creator syntax validator and explicit LF inspection. Independent behavioral review covered integration recovery and selective skill updates. Assembled repository gates provide separate evidence.
