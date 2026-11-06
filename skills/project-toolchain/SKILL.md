---
name: project-toolchain
description: Resolve and launch a selected project's pinned tools, including explicit Mise environments. Use for cross-project commands, hooks, worktree setup, or runtime mismatch diagnosis; not for automatically migrating a project's package manager.
---

# Project-aware tool execution

Read the target project's toolchain policy, version files, package manifest, lockfile, and launcher contract. Resolve the physical project root explicitly; the caller's current directory or environment is not sufficient ownership. Retain the project's chosen package manager and runtime. A tool installed on the machine or a skill example does not change that choice.

Prefer the project's validated launcher. Select physical executable paths and check their actual versions against the target's pins. Reject shims, redirected paths, or incompatible overrides where the launcher contract requires physical identity. Do not select a foreign project's runtime from ambient overrides or silently install a missing executable. Pass an argument vector without shell interpolation and use the target root as the command's working directory.

For Aube/Bun projects, Aube owns dependency mutations and its chosen lockfile; Bun executes JavaScript/TypeScript. Use frozen installation for an existing reviewed lockfile and the no-install dispatch mode for verification. Do not add a second lockfile or switch to npm/pnpm/Bun dependency mutation to make an example work. Native ecosystem dependencies retain their own locked toolchain.

## Mise and environment ownership

Mise configuration is trusted executable project input. Evaluate it only through the project's explicit supported route. Missing trust, tools, or platform support is an actionable limitation, not permission to approve configuration, enable auto-install, or fall back to a different environment. Ordinary hook execution must not implicitly introduce configuration evaluation.

When capturing a configured environment, preserve empty values and removals as well as additions. Do not log or persist the complete environment. Bind relevant execution settings into verification identity using the project's privacy-safe contract. Restore temporary routing deliberately; provider output cannot adopt another task's scratch ownership or credentials.

The selected project owns mutable launch outputs and scratch. The launcher and its helper/compiler/dependency bytes are separate trusted inputs and must be fingerprinted where results are reused. A launcher digest alone proves neither target verification nor installed dependency integrity. Await confirmed descendant shutdown and stream closure before reporting completion or disposing scratch. Test real platform behavior for affected native/Windows integration; successful command parsing is insufficient.
