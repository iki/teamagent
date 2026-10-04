# Verification and agent hooks

The root [agent rules](../AGENTS.md) govern implementation. These checks establish the development foundation; they do not certify unimplemented product applications or platforms.

## Commands and failures

| Task                          | Command                          | Contract                                                                                     |
| ----------------------------- | -------------------------------- | -------------------------------------------------------------------------------------------- |
| Reproducible installation     | `aube install --frozen-lockfile` | Exact manifest/lockfile agreement; no secondary lockfile                                     |
| Completed implementation step | `aube run step:check`            | Format owned sources, strict TS7, type-aware Oxlint, regression tests                        |
| Review or delivery            | `aube run review:check`          | Check formatting, strict TS7, type-aware Oxlint, regression tests; no automatic source fixes |
| Hook installation             | `aube run hooks:install`         | Install repository Git hook and record this checkout's Bun executable                        |
| Conversation archive          | `aube run conversations:record`  | Read validated JSON from stdin and preserve a public response record                         |

Either Aube or Bun may dispatch package scripts; Aube alone installs dependencies. The check launcher invokes installed tool entries with the running Bun executable and resolves the platform-native `oxlint-tsgolint` backend directly. It does not depend on Node shebangs, shell interpolation, shortened PATH, or fallback to syntax-only lint.

Any missing dependency, nonzero result, timeout or missing backend is a failure. Repair the cause before advancing. Do not turn off type-aware lint, relax strictness, add blanket suppressions or silently skip checks. Research documents in `spec/` and imported material in `resources/` remain source evidence; formatting covers owned implementation files and the new development specifications without wholesale research rewrites.

## Automated architecture checks

TypeScript enforces strict mode, unchecked-index safety, exact optional fields, explicit returns, switch fallthrough and override checks. Oxlint rejects `any`, unsafe typed operations, non-null assertions and floating promises. Repository rules guard portable library boundaries, public import paths, hidden I/O/clock/logger setup and Effect execution, unsafe casts, executable input and runtime launchers. The lint implementation is explicitly host tooling, not a portable product library. Tests exercise valid and invalid rule fixtures.

Structural checks are not proof of correctness or a sandbox. Schema and semantic validation, least-privilege capabilities, human review and behavioral tests remain required. Add focused rules and regression fixtures for repeated structural review findings. Keep exceptions narrow and documented at the actual third-party adapter.

## Hooks and scope

- `.agents/hooks/after-step.json` and `before-review.json` describe required workflow commands. They are portable instructions, not undocumented automatic integrations.
- `.githooks/pre-commit` executes the read-only review gate. `hooks:install` preserves conflicting existing hook configuration by failing with an explanation. It stores `teamagent.bunPath` only in local Git configuration, so the machine-specific runtime path is not committed.
- `.codex/hooks.json` registers `Stop` and `SubagentStop` through `app/hooks/stop.ts`. Both archive public conversation text. Only root `Stop` checks the assembled codebase; concurrent subagents must not test incomplete shared edits on every subagent completion.
- A failed root check requests one repair continuation. If verification still fails on an already continued stop, it reports the failure without an endless loop. Logging and verification run independently: an archive error cannot skip the code gate, and the hook explicitly reports an unsaved reply. Check diagnostics go to stderr; successful hook stdout is JSON.
- Until automatic hooks are trusted and observed, agents invoke the commands and writer explicitly. Installation does not self-approve product hook trust or alter account-wide settings.

Codex's [official hook documentation](https://learn.chatgpt.com/docs/hooks) defines events, the Windows command override and trust review. The repository enables `features.hooks`. Native transcript formats are not stable APIs; the archiver tests supported event shapes and retains a validated manual fallback.

## Evidence for product work

Cover observable success, typed failures, malformed boundaries, cancellation/resource cleanup, bounded queues/caches and authorization constraints when those behaviors change. Test browser workers in a real browser and Worker deployments against workerd. Native builds require SDK/device or simulator evidence for every claimed platform; record build-only, browser-only and untested states explicitly.

Validate local/HTTP data parity, sizes/hashes/versioning, schema coverage and missing-result semantics where applicable. Keep private values out of logs and public URLs. Benchmarks record actual Bun/browser/native runtime versions, hardware, fixture/source hashes, first-call behavior, warmups, serial samples and spread. Never relabel old evidence or compare mixed methods as a speedup.
