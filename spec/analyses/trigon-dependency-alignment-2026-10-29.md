# Shared dependency alignment — 2026-10-29

All eighteen approved shared JavaScript targets are installed: seven runtime
dependencies and eleven development dependencies. A subsequent frozen install
passed without changing the resulting manifest or lockfile. The full step check
and real browser/Windows desktop acceptance passed. Final review also passed;
signed publication follows the frozen implementation checkpoint.

The logical task `trigon-shared-pins-2026-10-29` began against the clean, signed
and published Teamagent baseline
`ca8e09ea70f548b6c6711ff5fd7588f6d9c20fd7`. It follows the separate
[process transfer](trigon-process-sync-2026-10-28.md); its dependency changes
must not be attributed to the earlier process/cache benchmark baseline.

## Source and scope

The approved targets come from [Trigon](https://github.com/iki/trigon) at immutable
revision `454e372cbc6bb75eafbbc4795391c492bc4fbf96`. The retained
[comparison](../data/trigon-dependency-comparison-2026-10-28.json) has SHA-256
`bcedfbaae8b1b8efa9a9a2d013c038bbc4cda084de4382248c715f0e8ee0a36f`.
This is an explicitly selected source-manifest alignment, not a claim that these
are current registry-latest or independently approved eligible candidates.
The existing dependency CLI's registry-report planner was not supplied a
fabricated report. Historical source findings and measurements remain unchanged.

| Package | Group | Previous | Installed |
| --- | --- | --- | --- |
| `@logtape/logtape` | Runtime | `2.3.10` | `2.4.2` |
| `@modelcontextprotocol/server` | Runtime | `2.3.0` | `2.4.0` |
| `@tauri-apps/api` | Runtime | `2.12.1` | `2.12.4` |
| `effect` | Runtime | `4.0.0-rc.118` | `4.0.6` |
| `react` | Runtime | `19.3.0` | `19.3.1` |
| `react-dom` | Runtime | `19.3.0` | `19.3.1` |
| `zod` | Runtime | `4.6.5` | `4.6.7` |
| `@modelcontextprotocol/client` | Development | `2.3.0` | `2.4.0` |
| `@oxlint/plugins` | Development | `1.86.0` | `1.89.0` |
| `@playwright/test` | Development | `1.63.0` | `1.64.1` |
| `@tauri-apps/cli` | Development | `2.12.1` | `2.12.4` |
| `@types/node` | Development | `26.6.3` | `26.6.5` |
| `@vitejs/plugin-react` | Development | `6.1.1` | `6.1.2` |
| `effect-oxlint` | Development | `0.3.4` | `0.4.0` |
| `oxfmt` | Development | `0.71.0` | `0.74.0` |
| `oxlint` | Development | `1.86.0` | `1.89.0` |
| `oxlint-tsgolint` | Development | `7.0.2003` | `7.0.2005` |
| `vite` | Development | `8.3.2` | `8.3.5` |

The six matching shared pins remain unchanged: `@types/react@19.3.0`,
`@types/react-dom@19.3.0`, `@typescript/native-preview@7.0.0-dev.20260707.2`,
`c12@4.0.0-rc.2`, `cleye@2.7.0` and `consola@3.4.2`. Teamagent retains its four
independent pins: `@earendil-works/pi-agent-core@1.0.1`,
`@earendil-works/pi-ai@1.0.1`, `typebox@1.3.27` and `@types/bun@1.4.2`.
Bun `1.4.2` and Aube `2.5.1` remain the executor and dependency manager.

## Installation and integrity

The bounded local runner invoked one reviewed Aube operation at a time, with
exclusive intent and command-result receipts. It used exact pins, retained
dependency groups and limited registry requests to zero retries with a
15-second per-request timeout. No uncertain action was automatically repeated.

| Operation | Completion time (UTC) | Elapsed seconds | Result |
| --- | --- | --- | --- |
| Add seven runtime targets | `2026-10-29T04:09:31.225Z` | 15.994 | Exit 0, closed; semantic inspection passed |
| Add eleven development targets | `2026-10-29T04:10:59.121Z` | 9.858 | Exit 0, closed; semantic inspection passed |
| `aube install --frozen-lockfile` | `2026-10-29T04:12:05.704Z` | 5.934 | Exit 0, closed; manifest and lock unchanged |

These are individual subprocess elapsed times on the provisioned machine, not
cold-install benchmarks or evidence of a performance improvement. The final
inspection confirmed all 28 direct installed package names and versions against
the manifest. After the frozen install, the manifest SHA-256 was
`ec9724e18477aa3a759a434915fc10998f761dc56d9f2e54c65281b1f9ac326a` and the Aube
lock SHA-256 was
`a5c844e28640fbe0c7dd2db56e109f718860c27a5cdd7e6055b11865d9211bac`.
These identify that installation checkpoint; later formatting or compatibility
changes require their own final verification identity.

The trust file, Cargo lock, Trigon patch registry/license, both supplied native
lifetime files and the source comparison retained their original hashes across
all three stages. The existing `@google/genai` and `protobufjs` lifecycle denials
remain in place. Other manifest fields and all unselected direct pins remained
unchanged. No additional package manager, Cargo update or independent dependency
patch was introduced.

The supplied [Tauri registry](../../patches/trigon/registry.json) explicitly covers
CLI `2.12.1` and `2.12.4`; its adapter and license bytes were reused unchanged.
This does not establish that the historical unguarded lifetime defect reproduces
at `2.12.4`. Native Rust pins, edition and Cargo selections remain Teamagent's.
The [dependency policy](../dependencies.md) still requires a user decision if a
necessary compatible fix is absent from Trigon.

The [portable outcome receipt](trigon-dependency-alignment-2026-10-29-results.json)
collects installation identities and subsequent checks. Detailed local attempts
are retained under
`.cache/review-2026-10-27/trigon-sync-2026-10-28/root/alignment/`; the tracked
receipt carries the portable evidence rather than requiring that cache on
another developer's machine.

## Compatibility and completion boundary

The complete installed Effect `4.0.6` agent guide was read before compatibility
work. Installed guidance and source govern any required API adaptation; the
existing strict types, schemas, lint rules and test coverage remain required.
The current [stack](../architecture/stack.md), [reuse guidance](../architecture/reuse.md)
and [skill audit follow-up](../skills-audit.md) describe the selected versions.

| Check | Status at this checkpoint |
| --- | --- |
| Exact installation and frozen-lock consistency | Passed |
| Preserved pins, manifest roles, trust, native lock and supplied artifacts | Passed |
| Effect/API compatibility, four type programs and type-aware lint | Passed; no application-code adaptation required |
| Implementation step | Passed: 444 Bun tests across 54 files, Python fixtures and live integrity checks; 260.188 seconds |
| Final review | Passed: matching cooperative groups reused with live prerequisites and LF/export checks; 78.813 seconds |
| Browser acceptance with matching Playwright Chromium | Passed: Chromium `156.0.8078.4`; 12.344 seconds |
| Windows desktop/WebView2 acceptance and locked Cargo checks | Passed: four Rust tests, debug build, WebView2 `156.0.4314.50` and managed shutdown; 32.453 seconds |
| Signed alignment commit and confirmed ordinary push | Pending |

The independent dependency audit confirmed expected transitive updates without
source substitutions or same-version integrity edits. The protected hashes
remained unchanged after native acceptance. Rust `1.99.1` and Cargo `1.99.1`
were used; these runs are provisioned-machine checks, not cold/warm performance
comparisons. Release installers, deployment and live providers were not tested.

Successful installation or local acceptance is not publication approval.
Keep fresh compatibility evidence separate from the earlier fixed-pin process
benchmarks. Final publication must use this task's original baseline, exact
reviewed scope and frozen public record; later publication outcomes belong in
receipts rather than changing that record.
