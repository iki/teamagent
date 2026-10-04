# Local harness contract

CLI, browser and Tauri desktop are implemented. Mobile, hosted deployment,
installed-agent sessions, remote teams, retrieval and skill routing remain later
work in the [roadmap](roadmap.md).

## Public modules

| API            | Responsibility                                                     | CLI commands                          |
| -------------- | ------------------------------------------------------------------ | ------------------------------------- |
| `@/workspaces` | Canonical workspace registration and schema                        | `list`, `add`, `show`                 |
| `@/agents`     | Adapter identities and capability evidence                         | `list`, `models`                      |
| `@/artifacts`  | Immutable artifact size/digest contracts                           | `list`, `show`, `export`              |
| `@/tasks`      | Tasks, attempts, events, transitions and Effect repository service | `list`, `add`, `show`, `cancel`       |
| `@/harness`    | Shared configuration and response schemas                          | `serve`, `status`, `modules`, `token` |
| `@/lint`       | Host architecture rules and graph validation                       | `check`                               |

Every library's index explicitly exports its literal CLI descriptor. The CLI
option map is exhaustive over the derived command union. Composition roots,
SQLite and provider adapters live in `app/`; portable libraries cannot import
them. Separate TS configurations check host, library, browser and build tool
environments. [Module rules](architecture/modules.md) enforce the graph.

## Configuration and commands

All commands support `-h/--help`, `-V/--version` without configuration execution
or state reads. Unknown commands/flags and irrelevant flags fail. Scalar repeated
flags use the last value. Booleans support `--write=false`; `--no-write` and
trailing passthrough arguments after `--` are rejected. Module descriptors
generate the command/help catalog.

Default service: `http://127.0.0.1:4318`. Default state: `~/.teamagent`.
`harness serve --port 0` chooses a free port; clients select it with `--url`.
State commands accept `-D/--data`, configuration commands accept `-C/--config`.
Machine results go to stdout as JSON, diagnostics to stderr with Consola.
`harness token` explicitly prints a secret token as text for local pairing.

C12 executes only an explicitly selected existing trusted file:

```ts
export default {
  port: 4318,
  data: "./private-state",
  pi: { provider: "openai", model: "CHOOSE_FROM_AGENTS_MODELS" },
};
```

Pi supports OpenAI with `OPENAI_API_KEY`, or Anthropic with `ANTHROPIC_API_KEY`.
`agents models` reads the pinned catalog without inference. No default model or
credential discovery enables inference. Missing configuration/key leaves Pi
unavailable; an enabled unknown model fails startup. Provider transport is
replaceable independently of Pi's agent loop.

RC/global config, package metadata, dotenv, environment overlays, inheritance and
remote fetching are disabled. Unknown fields, nulls and arrays fail validation.
CLI overrides beat file settings, which beat defaults. File-relative data paths
resolve from the selected file's directory; CLI paths from the invocation
directory. Credentials stay in environment variables, outside config/records.

Desktop starts a fixed compiled sidecar with its OS application data directory
and an ephemeral token through a narrow IPC bridge. Optional `TEAMAGENT_CONFIG`
must name an existing absolute trusted file. Desktop overrides port/data and
stops its service on exit. Browser disconnects leave a separately started CLI
service running. Both preserve durable state.

## Grants, bounds and outcomes

Workspaces must be existing canonical directories. Parent/child registrations
and overlap with private service data are rejected. Two distinct workspaces may
run concurrently; each has one worker until cancellation cleanup ends.

`tasks add OBJECTIVE --workspace ID` defaults to `inspect`, creating a bounded
file inventory without a model or edits. Use `--adapter pi` for agent objectives.
Pi receives `list_files` and `read_file`; explicit `--write` adds `write_file`.
No shell, subprocess, package-install or HTTP-fetch tool is exposed.

File tools reject traversal, absolute/device paths, symbolic links, replaced
workspace roots and private/generated directories. UTF-8 reads/writes cap at
128000 bytes. Updates require the prior SHA-256 revision; new files publish
atomically without overwrite. Inventory caps at 500 files, 128 directories,
8192 entries and four directory levels, with explicit truncation. These checks
are cooperative scope, not an OS filesystem/network sandbox. Other processes
can race changes; capability evidence states that limit.

Tasks default to 120000ms/eight turns. `--duration` allows 1000–900000ms and
`--turns` allows 1–32. Pi caps at 64 tool calls and 4096 output tokens/request.
Public text and finite nonnegative usage are validated; duplicate tool IDs fail.
Tool intent persists before execution. Hidden reasoning, credentials and raw
tool payloads are excluded from durable events and operational logs.

`--key` makes submissions idempotent: same input returns the original task;
changed input conflicts. `succeeded` means the adapter completed normally, not
that generated code or the objective was independently verified. This increment
has no agent test-command tool; Pi must report that limit. Artifact hashes/sizes
are checked. `artifacts show` returns JSON/base64; `export --output FILE` checks
the received digest and refuses overwrite.

Storage bounds: 200 workspaces, 10000 tasks, 2000 events/task (terminal reserve),
32 artifacts/task, 4MiB/artifact. Capacity errors are explicit. Browser responses
and previews cap at 2MiB; larger artifacts use CLI export. These are not benchmarks.

## Recovery and HTTP

SQLite persists accepted tasks before dispatch with owner/attempt epoch fencing.
Leases last 15s and renew every 4s. `daemon.sqlite` transactionally claims local
PID/nonce ownership. Live/unknown owners are rejected; dead-owner replacement is
atomic. Cancel fences durable writes, signals cooperative work, and waits before
workspace reuse. Provider billing can continue for already sent requests.

Graceful shutdown interrupts active attempts and retains the queue. After a crash,
expired attempts become interrupted and are not automatically replayed. Review
retained effects before resubmitting. Exactly-once effects and resumed provider
sessions are not claimed. Browser reconnects restore durable history.

The service binds only 127.0.0.1. Data APIs require a bearer token; health is public.
Host/Origin checks reject rebinding/cross-origin requests. Desktop mode adds only
fixed Tauri origins, still requiring a token. Bodies cap at 32KiB, URLs at 8KiB;
unknown/repeated query keys fail. Responses disable caching. Artifacts download
as attachments; secrets never enter URLs or browser persistence. This is a
single-user local service, not a hosted multi-user authentication system.

Endpoints: `GET|POST /api/workspaces`, `GET|POST /api/tasks`, `GET /api/tasks/:id`,
`GET /api/tasks/:id/events?after=N`, `POST /api/tasks/:id/cancel`,
`GET /api/tasks/:id/artifacts`, `GET /api/artifacts/:id/content`, `GET /api/agents`,
`GET /api/health`. Lists are arrays; errors use `{error:{code,message}}` and a
meaningful HTTP status.

[Reuse and licenses](architecture/reuse.md) · [Verification](harness-verification.md)
