# Implementation architecture rules

These are Team Agent's adopted implementation rules, dated 2026-10-04. They
refine the existing [system architecture](../architecture.md),
[channel contracts](../channels.md), [security model](../security.md), and
[delivery plan](../roadmap.md). A selected technology is a design decision, not
evidence that its application or platform integration has been implemented.

| Area                                                 | Rules                                |
| ---------------------------------------------------- | ------------------------------------ |
| TypeScript, Effect, Oxc and module boundaries        | [Stack](stack.md)                    |
| Public module APIs, CLI exports and dependency graph | [Modules](modules.md)                |
| Prior project reuse and source license evidence      | [Reuse decisions](reuse.md)          |
| Bun, Aube, native launchers and measurement          | [Runtime](runtime.md)                |
| Command interfaces and trusted configuration         | [CLI contracts](cli.md)              |
| React, state, Workers, desktop and build graph       | [Applications](applications.md)      |
| Android/iOS, previews, native builds and delivery    | [Mobile](mobile.md)                  |
| Portable scenes, themes, codecs and export           | [Rendering and assets](rendering.md) |

The root package manifest and committed Aube lockfile own the exact versions of
installed JavaScript dependencies. These specifications also select future
application dependencies; add them through Aube when their implementation starts.
Do not install an entire future application stack merely to make a design table
look implemented. Native toolchains and application bundles require their own
version locks, platform checks and release evidence.

The durable control plane remains authoritative for tasks, identity, permissions,
event ordering and artifacts. Shared UI state is not a second task database.
SQLite/local blobs, authenticated remote access and replaceable workers retain
their existing contracts. A static frontend or edge Worker does not replace a
local agent daemon, durable task service, worker sandbox or credential store.

Read the root agent rules and the relevant design before implementation. Record
new decisions in these documents, keep canonical interfaces and generated help
synchronized, and distinguish required checks from checks actually completed.
