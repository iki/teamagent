# Web and desktop application rules

[Architecture rules](README.md) · [System boundaries](../architecture.md) ·
[Channels](../channels.md) · [Mobile](mobile.md) · [Rendering](rendering.md)

React 19 with Vite 8 is the selected web frontend; Tauri 2 hosts the shared
frontend on desktop. Use Effect with validated immutable state, schemas,
cancellation and pure transitions. Cloudflare Workers + Static Assets is the
selected hosted web surface. These are implementation decisions; applications,
deployments and platform acceptance must be delivered and verified separately.

## UI and state choices

Keep the React shell small. Domain calculations and heavy transcript/index/media
work run outside rendering, in dedicated workers or the authorized task service.
Do not reconcile thousands of scene primitives or reparse the entire transcript
on every streamed token. Virtualize long lists, coalesce deltas and load heavy
media/codecs lazily. Use semantic controls, keyboard navigation, accessible
descriptions and responsive layouts with a clear reading order.

Compose reusable controls with explicit variants and children instead of growing
boolean mode flags. A provider may inject a typed state/actions/metadata contract;
it must guard a missing context value and leave durable state ownership in the
task service. Prefer React 19 ref props for new components. Define component
types outside renders so streamed updates do not remount inputs or lose focus.
Derive cheap values from current state during rendering; dispatch user actions
from handlers rather than replaying mutations through React effects. Effects
synchronize external subscriptions and clean them up on unmount.

Start independent reads concurrently within a bounded Effect scope; preserve
actual data dependencies and cancellation. Subscribe only to the view state a
component needs, keep typing responsive and defer expensive secondary rendering.
Profile before adding memoization. Lazy-load optional feature code through
statically analyzable imports. Use documented, typed third-party subpaths when
they reduce the measured bundle, while preserving repository `@/<library>`
public entry points. Next.js/RSC, SWR and unbounded module caches in example
guides do not override the selected Vite/Effect architecture.

Schema-validated state is shared across client and server. React local state is
for transient forms. Keep URL-owned view filters, validated device preferences
and durable task state as separate schemas with separate owners. Persist domain
records and versioned migrations, not opaque running fibers or actors. View
changes push browser history; continuous seeking/dragging may replace it.
Back/Forward restores validated view state.

Define option IDs, ordering, labels and validation in one shared registry. Reuse
controlled responsive filter components rather than duplicating option arrays per
surface. Display filtering must preserve the underlying computation and authorization
context; redraws retain pending selections, seeks and ranges.

URLs contain only explicitly shareable view state and opaque authorized IDs.
Do not serialize prompts, credentials, private connection settings, artifact
contents or other personal data into URLs. Server authorization is independent
of URL validation. Reject unknown/repeated parameters, malformed partial groups,
invalid/oversized ranges and overlong URLs. Define explicit limits for each API;
an initial 8 KiB URL/request-body bound is appropriate for small view/query
contracts, not a substitute for a separate streamed attachment contract.

Workers own bounded caches; state carries monotonically increasing request or
revision IDs. Cancel superseded Effects, reject stale completions, dispose old
worker contexts and decode both request and reply payloads. Cancellation cannot
interrupt arbitrary synchronous code already executing; keep long calculations
chunked/cooperative or isolate them appropriately. Cache budgets account for
cache entries, not total heap usage.

| Alternative                              | Decision/reconsideration trigger                                                                                                      |
| ---------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------- |
| TanStack Router / Start                  | Reconsider when route count, nested layouts or routing needs justify it; do not duplicate Effect boundary schemas by default.         |
| Svelte / SvelteKit                       | Not selected; an additional component/compiler/type-check pipeline is unnecessary for this TSX implementation.                        |
| Solid / SolidStart                       | Not selected; keep expensive work outside rendering first, then profile actual UI bottlenecks.                                        |
| Next.js                                  | Not selected; server-component/full-stack complexity is not required for the initial local-first workspace.                           |
| XState                                   | Reconsider for explicit concurrent, multi-stage workflows when it clarifies ownership; avoid duplicating Effect lifecycle management. |
| Zustand / Redux Toolkit / TanStack Query | Do not add a parallel state/cache layer without a demonstrated gap in typed state, worker caches or the task service.                 |

These are repository-specific choices, not framework benchmark claims.

## Interface design and accessibility

Before a new visual surface, define a compact palette, type scale, layout and
content hierarchy grounded in the task workspace and the user's brief. Use real
task, connection and failure states in design fixtures. Review screenshots at
desktop and mobile sizes; decoration and motion must serve comprehension.
Use consistent plain action labels and errors that give a concrete recovery step.

Use native buttons, links, labels and headings before custom ARIA. Icon actions
need accessible names; asynchronous status needs an appropriate live region.
Preserve visible, unobscured keyboard focus and restore it after dialogs. Permit
paste, password-manager completion and zoom. Validate forms with associated
errors and focus the first invalid field. Provide tap/click and keyboard
alternatives for gestures. Respect reduced motion and keep animations
interruptible. Test empty, pending, failed and long-content states, contrast,
keyboard-only navigation and a screen reader. Apply the current
[Web Interface Guidelines](https://raw.githubusercontent.com/vercel-labs/web-interface-guidelines/main/command.md)
to implemented UI; their generic URL-state advice never permits private data in
URLs or changes the state ownership rules above.

## Module and platform boundaries

| Planned boundary           | Owns                                                                                    |
| -------------------------- | --------------------------------------------------------------------------------------- |
| Portable app-state library | Schema, URL encoding, pure transitions, request/reply contracts.                        |
| Shared web UI library      | React controls and dependency-injected platform adapters.                               |
| Browser storage adapter    | Bounded, versioned, validated preferences/drafts; never authority over tasks.           |
| Worker libraries           | CPU-heavy transforms, bounded derived caches and cancellation/revision protocol.        |
| Server library             | Typed bounded request handling and report rendering via public domain services.         |
| `app/web`                  | Vite host, Worker routes, bindings, HTTP/MCP protocol adapters and static assets.       |
| `app/desktop/src-tauri`    | Rust entry point, system WebView and narrowly granted native capabilities.              |
| Local daemon               | Durable task/control service, SQLite/blob adapters and authorized worker orchestration. |

As UI modules are introduced, add boundary rules rejecting heavy/local/server imports
in UI, unowned browser storage and raw markup insertion. The current generic rules
already guard platform APIs in portable libraries. React escapes user
text; static HTML may embed only validated renderer output. A native bridge
starts with no filesystem/shell capabilities. Add a narrowly scoped capability
only with a real feature and its authorization tests; the required local-daemon
integration is an explicit implementation task, not an ambient shell privilege.

Tauri uses system WebViews and reuses the DOM frontend. Do not package Chromium
or a Bun runtime merely to display it. Windows needs WebView2; test Linux/macOS
WebViews and packaging separately. Native signing, installers, installed-app
upgrades and rollback need separate evidence from a successful executable build.

| Desktop alternative | Decision                                                                                                                                                         |
| ------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Electrobun          | Not selected; a separate build/distribution stack adds integration risk alongside Aube.                                                                          |
| GPUI                | Not selected; native Rust UI requires replacing DOM interactions and an explicit TS runtime boundary or port. Portable schemas/assets remain the migration seam. |
| Electron            | Not selected; bundling Node/Chromium is unnecessary for the initial shell. Reconsider if a uniform browser engine or required native integration justifies it.   |

## Build graph and assets

Root Bun tasks coordinate a shared frontend asset preparation stage followed by
web/desktop/mobile builds. App directories are source, not separate published
packages. Use one real Aube package-manager declaration and lockfile; retain
`Cargo.lock` for native Rust and use `--locked`.

Use an explicit build graph without a custom incremental cache initially.
Do not add Turborepo with disabled package-manager checks or pretend Aube uses
another lockfile. Reconsider Turborepo only after correct Aube lockfile hashing is
supported and tested; add Nx or other orchestration only for a concrete need.

Asset staging is a fixed generated folder under `.cache/apps/`. Validate the
resolved folder before cleanup; copy only current approved assets/manifests,
fonts and pinned WASM. Resolve config-relative paths through shared adapters.
Browsers fetch large assets on demand; native packages may bundle assets required
for offline capabilities. Frontend builds never publish automatically.

When implemented, provide `web:dev`, `web:build`, `web:preview`, `web:check`,
`web:types`, `desktop:dev`, `desktop:build`, `desktop:bundle`, `apps:build` and
`apps:smoke` tasks. `web:preview` must exercise actual workerd; `web:check` is a
deployment dry run. `apps:build` prepares frontend artifacts, not native Rust
executables. Restart Worker previews around replacement of their asset directory;
use Vite hot reload for continuous frontend development.

## Cloudflare and MCP

Use Workers + Static Assets with an explicit asset binding, rather than a
separate Pages deployment. Treat Workers as a hosted UI/HTTP layer or bounded
service adapter. Durable authenticated task state and host-local credentials
retain their existing service contracts. Offline clients may read cached views
and queue drafts; they cannot manufacture authoritative task completion.

When adding the Worker, use project-local pinned Wrangler through the Bun
launcher and prefer `wrangler.jsonc`. Set the initial compatibility date to the
implementation date; later changes review intervening runtime behavior and rerun
workerd tests. Generate runtime and binding declarations with `wrangler types`
after configuration changes, against that date and its flags; never hand-write
a duplicate `Env` interface. Enable compatibility flags only for demonstrated
dependencies. Follow the [generated types contract](https://developers.cloudflare.com/workers/languages/typescript/)
and the installed Wrangler schema.

Declare the account, Worker, environment and resource targets explicitly.
Bindings are capabilities: grant only required resources and verify every
environment's bindings and secrets independently. Local execution and Preview
names do not establish isolation from production data. If using the Cloudflare
Vite plugin, select its environment at build time and verify the resulting config.
Keep local secrets ignored and deployed secrets outside source and CLI arguments;
secret changes and rollbacks follow the same release authorization as deployment.
Rollback of Worker code does not roll back connected resource data. See
[environment configuration](https://developers.cloudflare.com/workers/wrangler/environments/).

Use bindings for supported Cloudflare service calls. Keep authenticated request
state and I/O out of mutable module globals. Await or return required work;
attach only bounded, nonessential post-response work to `ctx.waitUntil(...)`.
Durable task progress and required notifications remain in the durable service's
event/outbox contract. Stream large payloads with bounds and cancellation instead
of buffering them whole. Fail explicitly on handler errors; do not bypass
authentication by falling through to an origin after an exception.

Normal interaction should avoid sending local data or CPU work to a server
unnecessarily. Explicit authorized report/export endpoints may provide HTML,
Markdown, JSON and SVG/PNG without requiring browser execution. Publish a
discoverable contract with limits and provenance where such endpoints exist.
Server reports must enforce authorization, input bounds, complete-result semantics
and deterministic escaping; never silently truncate a result after budget limits.

Import compiled WebAssembly modules for Workers; browser initialization from
downloaded WASM bytes is not a interchangeable edge deployment strategy. Keep
Workers declarations/bindings separate from DOM types and use narrow typed
response/asset adapters rather than casts or global declaration patches.

Wrangler/Bun compatibility requires actual workerd checks. If a pinned toolchain
needs an Undici compatibility preload, isolate it to the Wrangler child, pin its
upstream dependency, document the specific failure and exercise HTTP/MCP/assets
against workerd. Never patch dependency files, replace application fetch globally,
or treat a historical workaround as necessary without reproducing the failure.

MCP uses the official SDK's Streamable HTTP adapter; prefer stateless requests
for stateless tools. Keep Zod at the protocol edge and revalidate inward values
with Effect. Check exact browser Origin when present, enforce authentication and
tool authorization, bound bodies, and test official-client initialization, listing
and execution. A read-only report tool is not authorization to expose task mutations.
Persistent sessions/subscriptions need deliberate lifecycle and storage contracts.

Bound server work, concurrency, caches, CPU and response size according to the
deployed plan and measured workload. Check current provider limits during
implementation/release; per-IP rate limiting is not a global billing quota.
Use private/no-store and no-referrer for sensitive responses, a restrictive CSP,
redacted operational logging and a reviewed infrastructure/access-log policy.
Do not log full request URLs or enable automatic invocation/trace capture that
collects private values without a deliberate redaction policy.

Production readiness includes an explicit sampled logs/traces configuration and
privacy test. Route application logs through the LogTape host sink. Review
automatic invocation logs and span attributes separately: application redaction
does not sanitize provider-captured URLs. Enable Workers Logs and Traces only
with an acceptable capture policy; record any disabled capture and replacement
diagnostics. See [Workers Logs](https://developers.cloudflare.com/workers/observability/logs/workers-logs/)
and [trace attributes](https://developers.cloudflare.com/workers/observability/traces/spans-and-attributes/).

## Authentication adapter requirements

Authentication identifies a principal; the task service still authorizes each
operation under [security](../security.md) and [channel](../channels.md) rules.
Better Auth is an available integration skill, not an adopted dependency. If
selected, pin it with Aube, read matching-version documentation, keep its server
and database adapter at a host boundary, and review generated migrations whenever
plugins or schemas change. Record which store owns sessions and rate limits;
adding secondary storage must not silently change revocation or durability.

The implemented adapter must use strong managed secrets, explicit trusted origins
and callback destinations, secure HTTP-only cookies over HTTPS, CSRF checks and
persistent rate limits appropriate to its deployment. Trust forwarded identity,
IP and host headers only from an enforced proxy boundary. Do not disable origin,
OAuth state or CSRF checks to make native clients work. Encrypt retained OAuth
tokens, audit security events without token or private profile payloads, and test
expiry, logout, device revocation, recovery flows, forged origins and redirects.
Cached sessions need an explicit revocation delay policy; sensitive operations
must check current authority. Validate these requirements against the selected
version's [security](https://better-auth.com/docs/reference/security) and
[session](https://better-auth.com/docs/concepts/session-management) contracts.

## Acceptance

Regression coverage includes state round trips, malformed/duplicate inputs,
versioned storage, stale-result rejection, cancellation, path/size bounds,
escaping and architecture rules. Integration checks cover real workerd/browser
requests, worker/WASM loading, official MCP clients, reconnect/history, local
storage, exports, responsive layout and accessibility. Native release checks
exercise each supported OS, lifecycle, capabilities and upgrade path.

Measure frontend first paint/usable state separately from daemon startup,
worker calculations, model first token, backend latency and complete results.
Keep raw measurements and screenshots in designated generated directories;
do not import another application's measurements or call local samples an SLA.
For implemented UI, collect browser traces, network requests and an accessibility
snapshot on representative devices, including cold and warm loads. Record LCP,
INP and CLS where measurable; distinguish lab observations from field data and
consult the current [Web Vitals definitions](https://web.dev/articles/vitals).
Prioritize measured bottlenecks and verify resource use before removing assets
or adding preload hints. Missing browser/trace tools or a missing app are explicit
measurement gaps, never passing performance evidence.
