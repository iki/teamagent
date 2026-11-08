# Reusable development skills

Teamagent maintains the source skills under `skills/`. Consumers install only
the combination their project needs through the pinned Vercel Skills CLI.
Installed `.agents/skills/` content and `skills-lock.json` are consumer inputs;
edit the maintained source here and distribute a reviewed revision instead of
changing a consumer's copy without updating provenance.

| Skill                                                             | Select when                                                                                   |
| ----------------------------------------------------------------- | --------------------------------------------------------------------------------------------- |
| [task-worktrees](../skills/task-worktrees/SKILL.md)               | Independent coding tasks need isolated branches and worktrees.                                |
| [rebase-integration](../skills/rebase-integration/SKILL.md)       | Completed tasks enter linear main history, with optional PR review.                           |
| [verification-evidence](../skills/verification-evidence/SKILL.md) | A project implements or reviews exact-input verification/build reuse.                         |
| [project-toolchain](../skills/project-toolchain/SKILL.md)         | Tools must run with the target project's physical pins and optional trusted Mise environment. |
| [resource-lifecycle](../skills/resource-lifecycle/SKILL.md)       | Processes, memory admission, temporary ownership or cleanup need implementation or review.    |
| [conversation-records](../skills/conversation-records/SKILL.md)   | Public agent activity must be recorded once per logical task with frozen completion evidence. |
| [typed-modules](../skills/typed-modules/SKILL.md)                 | The project has adopted the TypeScript/Effect/Oxc module boundary contract.                   |
| [skills-distribution](../skills/skills-distribution/SKILL.md)     | Selected skill sources are installed, reviewed or updated across projects.                    |

Patch procedures are maintained separately in [Patches](https://github.com/iki/patches):

| Skill                                                                                    | Select when                                                             |
| ---------------------------------------------------------------------------------------- | ----------------------------------------------------------------------- |
| [dependency-patches](https://github.com/iki/patches/tree/main/skills/dependency-patches) | A consumer selects, updates or retires supplied fixes.                  |
| [patch-maintenance](https://github.com/iki/patches/tree/main/skills/patch-maintenance)   | A canonical owner develops fixes and manages upstream/removal evidence. |

Teamagent no longer publishes a duplicate authored `dependency-patches` source.
Its original transfer remains historical evidence outside the current neutral
public catalog. Install the two procedures
explicitly from a reviewed Patches commit; do not rewrite unrelated installed skills.

The existing [teamagent-memory](../skills/teamagent-memory/SKILL.md) remains a
separate product integration. Workflow installation does not select memory,
authentication, a UI framework, mobile support or a deployment platform.

For parallel development, start with task-worktrees, rebase-integration,
verification-evidence, resource-lifecycle and conversation-records. Add the
toolchain, patch and stack skills only when their contracts apply. A project
using a different package manager or language can adopt worktrees without
adopting Teamagent's stack.

## Installation and updates

Teamagent pins `skills` 1.7.6 as a development dependency in the Aube lockfile.
The `skills` package script runs its entry through Bun explicitly. Consumers
should likewise use their package manager and pinned runtime; the npm package
is the CLI distribution channel, not permission to create another lockfile.

For an Aube/Bun consumer, first review and pin the tool:

```sh
aube add -D --save-exact skills@1.7.6
bun node_modules/skills/bin/cli.mjs --version
```

Resolve a published Teamagent revision and replace `FULL_REVIEWED_SHA` with its
full 40-character commit. From the consumer's project root:

```sh
bun node_modules/skills/bin/cli.mjs add "iki/teamagent#FULL_REVIEWED_SHA" --skill task-worktrees rebase-integration verification-evidence resource-lifecycle conversation-records --agent codex --copy --yes
```

The two patch procedures have their own reviewed immutable source:

```sh
bun node_modules/skills/bin/cli.mjs add "iki/patches#FULL_REVIEWED_PATCHES_SHA" --skill dependency-patches patch-maintenance --agent codex --copy --yes
```

Review that selected installation and its provenance lock separately from
Teamagent skill updates. Each source may advance independently.

The November 8 catalog adoption advances only `dependency-patches` and
`patch-maintenance`, including their supporting references. Reject selected
local content drift before replacement, retain the old selected trees and lock
as owned evidence, and verify the complete new trees against the reviewed source
revision. Preserve every unrelated installed file, lock entry and configured pin.
The selective update neither activates hook trust nor performs broad dependency
or skill maintenance.

Select additional supported agents explicitly when requested. Do not infer
permission to change user-global installations, every detected agent, credentials
or product-hook trust. Review the selected content and project lock diff before
committing. Existing staging/rollback adapters should keep those protections;
plain upstream CLI execution is not an atomic multi-source update transaction.
For automated use, disable telemetry in the child environment and bound the
process, output, selected source and destination.

In this release `#SHA` selects a Git revision; `@name` selects a skill. To advance
a pinned consumer, review a new Teamagent SHA and repeat the selected `add` with
that SHA. Updating a SHA-pinned source preserves its old ref. Avoid a broad
`skills update` in automation: source/scope/agent discovery can exceed the
selected change. The official CLI's check/update functions may contact upstream
sources; they do not belong in credential-free offline repository verification.

Authored skills are ordinary versioned source in the Teamagent repository. A
published signed commit is enough for Git-backed installation; a separate npm
skill-pack publication is unnecessary. The CLI's npm skill-pack commands remain
experimental in the reviewed version. See the [version-specific source audit](analyses/skills-distribution-2026-11-06.md)
for primary references and runtime validation limits.

## Local policy and enforcement

Each consumer keeps a small local policy: exact repository/remote/base branch,
worktree root, integration mode, signing requirement, verification and acceptance
commands, public-record location, runtime/dependency pins and canonical patch
owner. Product data adoption, release/version rules, preview ownership and
deployment permission remain local. A skill is neither authorization nor
independent verification evidence.

Teamagent's concrete policy is `.workflow.json`; [parallel workflow](parallel-workflow.md)
and [repository task checkpoints](workflow.md) define its executable contract.
The source skills are deliberately portable instructions. Git mutation, locks,
schema validation, redaction and process ownership remain tested adapters. A
future shared tooling package should expose these adapters once their project
boundaries stabilize, rather than copying an engine into every skill.

The [comparison](analyses/parallel-workflow-2026-11-06.md) includes the patch-owner
recommendation and project-specific [Trigon](analyses/adopt-parallel-workflow-trigon.md)
and [Ženy z Kraje](analyses/adopt-parallel-workflow-zeny.md) adoption prompts.
