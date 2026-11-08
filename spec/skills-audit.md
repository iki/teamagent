# Installed skill audit

Reviewed 2026-10-04 against the 23 repository skills and their relevant references, the pinned installed package APIs, and the current implementation. The inventory is `.agents/skills/`; `skills-lock.json` records their sources and hashes. Installed skills are guidance inputs, not proof that a framework, service or integration exists here.

The [2026-10-29 dependency follow-up](analyses/trigon-dependency-alignment-2026-10-29.md)
updates the installed baseline to stable Effect `4.0.6` and `effect-oxlint` `0.4.0`.
The complete newly installed Effect guide was read before compatibility work.
This retains the original skill audit and imported skill bytes; the follow-up
report records compatibility verification separately.

## Implemented foundation

| Skill                                                     | Application and audit result                                                                                                                                                                                                      |
| --------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| [aube](../.agents/skills/aube/SKILL.md)                   | Retain pinned Aube, the existing lockfile and frozen installs. Gates and hook descriptors use `aube run --no-install` so validation cannot implicitly install dependencies. Bun still owns execution.                             |
| [effect-ts](../.agents/skills/effect-ts/SKILL.md)         | Stable Effect `4.0.6` is installed; agent rules require reading the complete installed Effect guide and relevant source. The package-manager example does not override Aube. Host adapters use Schema at JSON/stream boundaries.  |
| [effect-oxlint](../.agents/skills/effect-oxlint/SKILL.md) | Use typed visitors, diagnostics and Effect-managed per-file rule state. Check examples against the pinned version rather than assuming a newer visitor signature.                                                                 |
| [oxlint](../.agents/skills/oxlint/SKILL.md)               | Strict type-aware lint and deny-warnings remain mandatory. The Bun launcher resolves the native backend explicitly. Unsafe operations, assertions, hidden I/O and dependency boundaries stay checked.                             |
| [oxlint-rules](../.agents/skills/oxlint-rules/SKILL.md)   | Validate rules with accepted/rejected fixtures and real parsed-source Oxlint integration. Rules must distinguish same-library relative imports from cross-library private imports and recognize aliased/namespaced runtime calls. |
| [oxfmt](../.agents/skills/oxfmt/SKILL.md)                 | Add configuration schema metadata and include repository hook JSON in formatting/check scope. Keep skills, source research and immutable conversation records excluded.                                                           |

Host, portable-library, browser and build-tool programs now have separate TypeScript configurations. Browser globals are confined to the UI program; Worker types remain deferred until a hosted surface exists.

The JSON conversation/hook adapters retain their small stream protocol instead of adding interactive CLI packages. They reject unsupported arguments, bound incoming bytes while reading, validate UTF-8 and Schema, emit JSON only on success, and keep diagnostics separate. Archive failures cannot skip verification. Regression coverage protects these contracts.

## Implemented CLI and runtime modules

| Skill                                         | Applicable requirement                                                                                                                                                                                                                           |
| --------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| [cleye](../.agents/skills/cleye/SKILL.md)     | Strict typed options and subcommands, canonical help, intentional aliases, exit behavior and CLI tests. Tiny internal protocol/check wrappers are explicitly exempt from installing a public CLI framework.                                      |
| [c12](../.agents/skills/c12/SKILL.md)         | Trusted executable configuration only; explicit layer/env/dotenv behavior, semantic Schema validation, immutable resolved configuration, config-relative paths and owned watcher cleanup/reload. Verify option names against the pinned version. |
| [consola](../.agents/skills/consola/SKILL.md) | Developer tools use scoped loggers and stderr reporters when stdout is data. Cancellation is not confirmation; global stream wrapping must not corrupt machine output. Tests restore mocks/wrappers.                                             |
| [logtape](../.agents/skills/logtape/SKILL.md) | Runtime libraries use hierarchical categories and structured messages. Hosts configure once, redact fields/patterns, own context and sink disposal, and reset matching async/sync configuration during tests.                                    |

These four dependencies are now installed at exact pins. Cleye drives the public module catalog; C12 loads only explicit trusted configuration with ambient discovery and remote layers disabled; Consola separates CLI diagnostics from JSON output; LogTape records structured runtime task identity and owns host lifecycle cleanup. Configuration tests cover null/array semantics, precedence, paths and disabled environment overlays. CLI tests cover help/version before config execution, strict flags, stream separation and real daemon commands. See [CLI contracts](architecture/cli.md) and [harness behavior](harness.md).

## Product integrations and remaining conditional guidance

| Skill                                                                                                 | Applicable requirement and current scope                                                                                                                                                                                        |
| ----------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| [cloudflare](../.agents/skills/cloudflare/SKILL.md)                                                   | Workers + Static Assets remains the selected web host; durable task/service state keeps its existing ownership. Add a Cloudflare product only for an actual capability.                                                         |
| [workers-best-practices](../.agents/skills/workers-best-practices/SKILL.md)                           | Generated binding types, explicit compatibility/environment config, bounded streaming and request lifetimes, no cross-request user state, and privacy-reviewed telemetry. Runtime validation requires workerd when implemented. |
| [wrangler](../.agents/skills/wrangler/SKILL.md)                                                       | Explicit target/config/environment, binding regeneration, secret storage, dry-run verification and separate deployment/rollback authorization. Preserve the Bun launcher.                                                       |
| [better-auth-best-practices](../.agents/skills/better-auth-best-practices/SKILL.md)                   | Conditional on adopting Better Auth. Use an owned service adapter, server/client separation, schema/migration review and documented storage/session behavior. Installation alone does not select it.                            |
| [better-auth-security-best-practices](../.agents/skills/better-auth-security-best-practices/SKILL.md) | Conditional auth requirements cover trusted origins, CSRF, secure cookies, secret rotation, token protection, session revocation and durable abuse controls. Authorization stays server-owned.                                  |
| [frontend-design](../.agents/skills/frontend-design/SKILL.md)                                         | Define a product-specific visual direction, deliberate typography/layout and clear recovery states; verify rendered screenshots when UI exists.                                                                                 |
| [vercel-composition-patterns](../.agents/skills/vercel-composition-patterns/SKILL.md)                 | Explicit variants, injected/context contracts, guarded providers and React 19 ref conventions without boolean-prop proliferation.                                                                                               |
| [vercel-react-best-practices](../.agents/skills/vercel-react-best-practices/SKILL.md)                 | Bounded concurrent independent reads, minimal derived state/effects, profiling-led memoization and static lazy component imports through public entries. Next.js-specific recipes do not select Next.js.                        |
| [web-design-guidelines](../.agents/skills/web-design-guidelines/SKILL.md)                             | Keyboard/focus/form/link/gesture/accessibility checks, responsive layouts and explicit privacy exceptions for deep links. Review actual UI against current guidelines when it exists.                                           |
| [web-perf](../.agents/skills/web-perf/SKILL.md)                                                       | Use real browser traces/network evidence and separate frontend, worker and service timing. Declare unavailable measurement tooling and never invent performance scores.                                                         |

The React/Vite UI and Tauri desktop now apply the design/composition guidance: semantic controls, explicit forms, bounded concurrent reads, abort/stale-response handling, escaped content and recoverable connection states. Real Chromium and Windows WebView2 tests cover task flows, cancellation, artifact digests, responsive layout and reconnect. Screenshots/accessibility snapshots were inspected; no performance score is claimed. Cloudflare, Workers, Wrangler, Better Auth and mobile remain conditional future integrations. The local service instead uses loopback-only bearer pairing with explicit Host/Origin checks. [Application rules](architecture/applications.md) and [verification evidence](harness-verification.md) describe the boundary.

## Narrow or unrelated skills

The source-memory increment applies the same Effect, Aube, Cleye and Oxc guidance.
Its MCP adapter uses the official v2 SDK, with Zod confined to that adapter and
Effect schemas validating domain input. Document conversion follows the analyzed
MarkItDown worker design with pinned project-local Python dependencies. These
are worker dependencies; Aube remains the only JavaScript package manager.

The distributable `skills/teamagent-memory/SKILL.md` was authored using the
installed system Skill Creator guidance and passed its validator. A separate
implementation reviewer used the installed skill in a temporary workspace to
import a note, sync a changed original, and retrieve the old version with its
citation. Agent configuration formats were checked against current official
documentation. Integration tests preserve user configuration, test idempotence,
rollback and conflict handling, and never modify real user-level agent settings.

- [entire-search](../.agents/skills/entire-search/SKILL.md) applies to historical checkpoint/session questions. A current-code audit does not need an Entire installation or checkpoint search.
- [performance-lint-rules](../.agents/skills/performance-lint-rules/SKILL.md) targets Rust rules under Oxc's `crates/oxc_linter/src/rules/`. This repository has a TypeScript plugin, so those Rust-specific transformations do not apply.
- [release](../.agents/skills/release/SKILL.md) is the upstream LogTape release process. Do not run its publishing, tagging or branch instructions for Team Agent.

## Compatibility notes

The November 6 [shared workflow review](analyses/parallel-workflow-2026-11-06.md)
adds nine authored development skills under `skills/`, independently selectable
through the [distribution contract](reusable-skills.md). Imported skills and
their provenance lock remain separate. Vercel Skills 1.7.6 is pinned through
Aube and executed explicitly with Bun; version-specific ref parsing and
runtime validation are recorded in the [source audit](analyses/skills-distribution-2026-11-06.md).
Workflow, verification, resource ownership and logging stay executable adapters;
skills do not replace enforcement or local publication authority.

The subsequent November 6 Patches migration leaves eight authored development
skills in Teamagent and moves the patch consumer procedure to `iki/patches`,
beside the independent `patch-maintenance` procedure. Its exact original source
was retained there as non-discoverable provenance at that migration. Installation selects only
these two procedures at an explicit reviewed Patches commit; unrelated imported
skills and their hashes remain intact. Catalog/consumer verification and skill
installation results are recorded separately.

The November 8 neutral-catalog adoption advances only those two procedures,
including their supporting references, to the reviewed complete Patches revision.
The update retains the original selected trees and lock as owned evidence and
preserves unrelated installed bytes and pins. Project commands, authority and
verification remain local. Catalog integrity, skill provenance and application
regression results remain distinct; installing instructions proves none of the
application checks.

Imported skill files and their provenance lock stay intact. Some C12/Consola reference links use the publisher's absolute checkout path; the intended Markdown references are also installed alongside each skill. Resolve those references locally. C12 guidance contains version-sensitive options/defaults; use the exact installed API when implementing it. The pinned `effect-oxlint` visitor API expects Effect-returning callbacks, so stateful generators need the supported wrapper rather than blindly copying a newer example.

Keep established choices when samples use npm/pnpm, Node wrappers, a different test runner/schema library, unconditional compatibility flags or operational console logging. Apply the underlying requirement through Aube, Bun, Effect, the current test runner and the repository privacy policy. Review and intentionally update imported skill sources separately; do not silently alter their claimed hashes.
