# Module contracts and enforced boundaries

[Architecture rules](README.md) · [Stack](stack.md) · [CLI](cli.md)

Each module owns one responsibility in `lib/<name>/`. Its public `index.ts`
exports the library's schemas, types and operations, plus an explicit
`export { cli } from "./cli.ts"`. Its `cli.ts` exports a literal `cli` descriptor
containing `name`, `description`, and a nonempty `commands` array of named,
described commands. Command names are unique inside that module. Descriptors
contain data only: they never launch a process, load configuration, run an
Effect or register a global handler merely because a consumer imports a module.
The host CLI supplies execution and option parsing for those contracts.

The product modules are:

| Module       | Responsibility                                            | Allowed public module dependencies           |
| ------------ | --------------------------------------------------------- | -------------------------------------------- |
| `agents`     | Adapter identity, events and declared capabilities        | None                                         |
| `artifacts`  | Artifact identity and provenance contracts                | None                                         |
| `workspaces` | Workspace identity and access contracts                   | None                                         |
| `tasks`      | Task lifecycle, attempts and execution contracts          | `agents`, `artifacts`, `workspaces`          |
| `harness`    | Shared transport/configuration schemas and module catalog | `agents`, `artifacts`, `tasks`, `workspaces` |
| `lint`       | Host-only development rules and module inspection         | None                                         |

The executable dependency declaration is
[`moduleDefinitions`](../../lib/lint/modules.ts). Changes to a module's allowed
dependencies are architectural changes and require review of this table and the
tests. Portable modules may not depend on host-only modules. The graph must be
acyclic; a circular dependency is not solved by switching to a type-only import.

Cross-module consumers use `@/<module>` and cannot reach subpaths. Relative
imports stay within their own library; application code also uses the public
alias instead of reaching into `lib/`. Import, export and static dynamic-import
syntax all receive boundary checks. Domain modules remain independent of
React, Tauri, subprocesses, filesystem, browser state and host configuration.

Host implementations remain replaceable. Web and desktop surfaces cannot import
the daemon, storage, CLI, provider adapters or repository maintenance tools.
Storage cannot depend on UI, daemon composition, CLI or provider implementations.
Provider adapters cannot depend on UI, daemon composition, CLI or storage
implementations. Composition roots provide implementations through public
contracts. Build-only tools belong outside a client application's runtime source
when they need host tooling.

## Enforcement and its limits

`teamagent/module-contract` checks public API/CLI exports and static descriptor
shape. `teamagent/module-dependencies` checks the declared graph and host
directions. `teamagent/boundaries` enforces portability, public imports and
runtime ownership. `teamagent/safe-rendering` rejects raw HTML insertion and
executable document markup in client surfaces; generated agent output is data.
`teamagent/client-state` rejects browser persistence APIs in client surfaces:
task records remain in the durable service and credentials remain in memory or
the native host. Any future offline cache needs an explicit reviewed adapter.
`teamagent/adapter-authority` prevents the current file-tool and model adapters
from acquiring subprocess APIs. An installed-process adapter needs its own
reviewed grant/capability contract and a corresponding explicit rule change;
renaming a file does not create an exception.

The check runner also calls `inspectModuleLayout` because a parser cannot visit
an absent file. It reports missing API/CLI entries, unregistered module
directories, nonregular entries, symbolic module paths and invalid graphs.
Parsed-source fixtures exercise permitted and rejected imports, descriptors and
rendering constructs using the installed Oxlint CLI. Layout and graph tests
exercise missing files, cycles, duplicate/unknown dependencies and forbidden
host dependencies.

These checks prevent repeatable structural mistakes. They do not prove that an
operation is authorized, a provider honors cancellation, an artifact matches its
hash, a CLI command dispatches correctly or a browser/native build works. Those
contracts require the corresponding behavior and integration tests.
