---
name: task-worktrees
description: Start and coordinate parallel repository tasks in isolated Git branches and worktrees. Use for task workspace setup, concurrent edit delegation, or ownership recovery; not for ordinary editing in an already assigned workspace.
---

# Parallel task workspaces

Read the target repository's instructions and workflow policy. Resolve its canonical Git repository, main ref, branch prefix, worktree/cache root, task command, and integration mode. These are project settings; installing this skill does not select them or authorize publishing.

Use the repository's tested task command when available. Keep one stable logical task ID, original baseline, branch, and worktree across follow-ups and agent handoffs. A native chat/session ID is additional metadata, not the task ID. Capture the actual starting HEAD and pre-existing changes before implementation. Never invent an earlier baseline or adopt every dirty file as task-owned.

Create one branch and one worktree per independently deliverable task under the configured `.cache` worktree area. Validate physical containment and the Git worktree inventory; an existing path or branch is not proof of ownership. Keep main as an integration surface. Do not move or stash unrelated edits to make a checkout available. Reuse a workspace only after its saved task identity, repository, branch, and ownership match.

Assign subagents explicit file or module ownership. Subagents working on one logical task can share its worktree when their writes are disjoint; separate tasks get separate worktrees. Agree on shared API/config changes before editing them. Return changed paths, checks, and unresolved findings to the task owner; subagents do not independently integrate the parent task.

Git objects, refs, configuration, and some hook settings are shared between worktrees. Keep mutable task state, build outputs, scratch, and installed dependency layouts separate unless the project explicitly implements safe sharing. Package stores can be shared through their package manager; a writable `node_modules` link into another task is not an isolated installation. Provision the target worktree from its own pins and lockfile. Do not copy private settings or approve tool configuration implicitly.

Serialize only the integration boundary through the repository's ownership mechanism. Parallel implementation and eligible verification can continue while another task integrates. A changed base means checking the new candidate; a lock does not freeze a remote branch. Do not steal locks based on age or PID alone.

After confirmed integration, remove a task worktree only through the project's cleanup command after verifying its exact identity, clean state, retained evidence, and stopped descendants. Interrupted or uncertain tasks remain recoverable. A `.cache` location does not make source worktrees or task records disposable. Retain the task-to-commit mapping after cleanup.
