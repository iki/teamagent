# kanban-code

Source: [kanban-code](https://github.com/langwatch/kanban-code) · Category: [ai-query](../categories/ai-query.md)

Review depth: **inventory / README screening only**. This is an individual coverage record, not a source-code correctness audit or adoption recommendation.

Snapshot: `41041f807791cb5402485fb49a7a2bfbdfb83aee`; commit timestamp `2026-10-03T22:56:41+02:00`; 1,331 tracked paths.

## Scope and evidence

Upstream description excerpt (a project claim, automatically extracted from [README](https://github.com/langwatch/kanban-code/blob/41041f807791cb5402485fb49a7a2bfbdfb83aee/README.md)):

> Native on macOS (SwiftUI liquid glass) and Windows (Tauri). The IDE for 2026. A native macOS app for running multiple Claude Code agents in parallel. Each task is a card on a Kanban board that automatically links your Claude session, git worktree, tmux terminals, and GitHub PR together — cards flow from backlog to done as Claude works, opens PRs, and gets them merged. Push notifications on your phone when agents need attention, remote execution to offload work to a server, and sleep prevention to keep your Mac awake while agents run.

Build/package evidence: [cli/package.json](https://github.com/langwatch/kanban-code/blob/41041f807791cb5402485fb49a7a2bfbdfb83aee/cli/package.json); [plugins/rush/kanban-vault/go.mod](https://github.com/langwatch/kanban-code/blob/41041f807791cb5402485fb49a7a2bfbdfb83aee/plugins/rush/kanban-vault/go.mod); [web/package.json](https://github.com/langwatch/kanban-code/blob/41041f807791cb5402485fb49a7a2bfbdfb83aee/web/package.json); [windows/package.json](https://github.com/langwatch/kanban-code/blob/41041f807791cb5402485fb49a7a2bfbdfb83aee/windows/package.json); [windows/src-tauri/Cargo.toml](https://github.com/langwatch/kanban-code/blob/41041f807791cb5402485fb49a7a2bfbdfb83aee/windows/src-tauri/Cargo.toml)

License evidence: [LICENSE](https://github.com/langwatch/kanban-code/blob/41041f807791cb5402485fb49a7a2bfbdfb83aee/LICENSE) Classification hint: Apache-2.0. A root license does not establish rights for every bundled asset, model, or dependency.

## Harness assessment

This entry was catalogued under **ai-query**. Its category places it in the candidate set for memory, import-generation, decisions; those associations are navigational and have not been individually validated as implemented capabilities. See [memory](../memory.md) · [import-generation](../import-generation.md) · [decisions](../decisions.md) for the source-reviewed alternatives and proposed integration boundaries.

**Disposition:** retain as a comparison candidate. Before adopting it, inspect the implementation entry point and its tests, verify the required protocol and deployment platform, and reproduce a task from the harness evaluation suite. Popularity, a README feature list, and the presence of a package manifest are insufficient evidence of quality or compatibility.

**Unresolved:** runtime behavior, security boundaries, performance, API/subscription eligibility, dependency health, maintenance status, and fit to the proposed harness were not independently established for this entry. No repository code was executed as part of this screening.
