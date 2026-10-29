<!-- conversation: 0c9085e9dd2b27af1ce62672638a031f23ddd6c29882b76f170b8e0d8c4d968d -->

Date: 2026-10-04T06:32:44.962Z
Session: unknown
Turn: unknown
Agent: codex
Model: unknown
Reasoning level: unknown

Public transcript only. Recognized credentials and requested literal redactions are replaced with [redacted] markers.

## Prompt

Check installed skills and review any related spec/configs/rules/hooks/code/... if it matches skills best practices, update if needed

## Response

Updated [CLI rules](../architecture/cli.md), [runtime rules](../architecture/runtime.md), and [stack rules](../architecture/stack.md).

- **Aube — installed:** pins, sole lockfile and Bun launchers align. Added frozen setup followed by `aube run --no-install` gates, explicit mutation review and build-trust guidance. Confirmed version 2.5.1 and option through local help.
- **Cleye — future dependency:** added explicit strict flags, inherited subcommand strictness, repeated/boolean/terminator tests and runtime validation. Existing finite internal adapters need no additional CLI package.
- **C12 — future dependency:** added explicit discovery/environment controls, trusted local layers, disabled remote fetching/installing, immutable validated snapshots, precedence tests and scoped watcher cleanup. Current [official documentation](https://github.com/unjs/c12) differs from the installed skill on secret-file option naming, control-key defaults and watcher behavior; rules require checking the selected version's source.
- **Consola — future dependency:** added stderr reporter ownership, machine-output isolation, scoped tags, mock cleanup and explicit prompt cancellation.
- **LogTape — future dependency:** added hierarchical categories, structured properties, lazy diagnostics, portable explicit context, startup configuration, sink disposal and focused record tests.
- **release — unrelated:** explicitly belongs to the upstream LogTape release workflow; no release actions or configuration changes apply here.
- **entire-search — conditional:** applies to recorded historical questions; current-code inspection did not require a history search.

C12 and Consola skill reference links contain hardcoded source-machine paths; their colocated reference files were readable. Imported skills were preserved, and no dependencies were added.

The mandatory step gate passed: formatting, strict types, type-aware/custom lint and 17 tests. Root owns the assembled final review gate and current adapter fixes.

## Processing Log
