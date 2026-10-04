# TypeScript, Effect and Oxc

[Architecture rules](README.md) · [Runtime](runtime.md) · [Applications](applications.md)

Use English for agent communication, code identifiers/comments and repository
documentation. Preserve meaningful proper names, multilingual source data and
language-sensitive fixtures; add localized UI or documentation when requested.

| Component           | Adopted choice                                                                                                                          |
| ------------------- | --------------------------------------------------------------------------------------------------------------------------------------- |
| Language            | TypeScript 7 native preview, pinned as `@typescript/native-preview`; run `tsgo --noEmit`, not an assumed stable `typescript@7` package. |
| Effects and schemas | Pinned Effect v4 RC. Public fallible operations return typed Effects; decode external data with Effect Schema and semantic validation.  |
| Lint                | Oxlint plus `oxlint-tsgolint` for type-aware rules; fail on warnings and unsafe boundary operations.                                    |
| Effect lint         | `effect-oxlint`, augmented by narrowly scoped repository architecture rules with valid and invalid fixtures.                            |
| Format              | Oxfmt, with separate check and explicit write modes.                                                                                    |
| Runtime logs        | LogTape in libraries; only application composition roots configure sinks and levels.                                                    |
| Developer CLI logs  | Consola in CLI and generation adapters, with human status on stderr.                                                                    |
| CLI and config      | Cleye for strict option parsing; C12 for trusted local configuration; Effect Schema for decoded configuration.                          |
| Package management  | Aube owns dependency mutations and the only JavaScript lockfile.                                                                        |
| Execution and tests | Bun runs repository JS/TS scripts, tests and tool launchers.                                                                            |
| Web UI              | React 19 and Vite 8; explicit typed state and dedicated workers.                                                                        |
| Native shells       | Tauri 2 for desktop, Android and iOS.                                                                                                   |
| Web hosting         | Cloudflare Workers + Static Assets; retain durable task service and authentication boundaries.                                          |
| MCP                 | Official MCP SDK v2. Zod is confined to the protocol adapter; Effect validates inward domain values.                                    |

Exact installed pins belong in `package.json` and the Aube lockfile. Preview/RC
upgrades require reading their installed source and rerunning compatibility
checks; do not translate examples from a different major version by assumption.
Before writing Effect code, read all of the installed `node_modules/effect/AGENTS.md`
and follow its linked guides as needed.

## TypeScript contract

Use ES2024, ES modules, bundler module resolution, `verbatimModuleSyntax`,
`allowImportingTsExtensions`, `noEmit`, and `react-jsx` for React sources.
Required safety flags are `strict`, `noUncheckedIndexedAccess`,
`exactOptionalPropertyTypes`, `noImplicitReturns`,
`noFallthroughCasesInSwitch`, and `noImplicitOverride`.

`skipLibCheck` may avoid checking dependency internals; it does not waive adapter
checking or permit unsafe assignments. Add host type declarations only where
needed. Workers, browser DOM and native/Bun host declarations must not be merged
into a global type environment that hides an invalid platform API.

External config, parsed JSON, dynamic modules, files, HTTP bodies, subprocess
messages and worker replies enter as `unknown`. Decode structure and validate
semantics before domain use. Forbid explicit `any`, unsafe assignment/argument/
call/member access, non-null assertions, unchecked casts and broad suppressions.
When an upstream declaration is broken, a small documented adapter or declaration
must mirror the actual pinned API and have an exercised boundary.

## Clean architecture

Libraries live in `lib/`, applications in `app/`, tests in `test/`, and generated
assets in `data/`. Add a module only when it has a real responsibility. Each
library exposes `index.ts`; imports across libraries use `@/<library>`, mapped to
`lib/<library>/index.ts`. Relative imports stay within a library. This alias is
internal source configuration; consumers need bundling or their own resolver.

Keep domain decisions, pure state transitions, schemas and portable algorithms
independent of UI, native runtimes and transport. Filesystem, networking,
subprocesses, environment, wall-clock access, storage and logging configuration
belong in explicit adapters or composition roots. Domain modules cannot import
generator code, Node/Bun APIs, browser globals or host-only codecs.

Effect owns fallibility, dependencies, cancellation, resource scopes and retries.
Run Effects only at host/application boundaries. Do not hide `runPromise`,
`runSync`, detached fibers, eager I/O, ambient clocks or logger configuration in
library imports. Supply service implementations at the composition root. Use
typed errors for expected failures and preserve failure context; never silently
substitute empty success after an unsuccessful operation.

Repository structural rules must guard public entry points, host boundaries,
hidden I/O, Effect execution, schema decoding, logging, browser storage, raw markup,
worker computation and mobile tool launchers as those modules are introduced.
Add a focused rule and regression case for a repeatable architectural review
finding. A textual/AST guard complements semantic tests; it does not establish
that runtime behavior is correct.

## Reliability gates

After each implementation step, `aube run step:check` explicitly formats then runs
strict type checking, type-aware/custom lint and Bun tests. Before review,
`aube run review:check` verifies formatting without rewriting files and runs the
same checks. Either Aube or Bun may dispatch these package scripts. Stop on the
first failure and fix it before advancing.

Use repository-owned agent hooks for the same gates and a Git pre-commit check
when installed. Do not describe a repository script as an automatic hook for an
agent product until that product's integration is configured and verified.
Integration changes also require their applicable browser/workerd/native checks.
Preserve unrelated user edits, source provenance and truthful verification
records. Never log secrets, credentials, private prompt bodies or sensitive query
values in operational logs; conversation archives follow their dedicated policy.
