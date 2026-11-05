# Project-aware tool launcher

`aube run --no-install project:run` launches a selected project's pinned Bun or
Aube through Teamagent's owned process adapter. The host-only API is exported as
`teamagent/project-launcher`; it is development infrastructure, not a portable
domain library or an authorization service.

```sh
aube run --no-install project:run --project /absolute/physical/project --tool bun -- run check
aube run --no-install project:run --project /absolute/physical/project --tool aube -- run --no-install review:check
aube run --no-install project:run --identity
```

Use an absolute physical project directory. Its `.bun-version` and package
engines must agree, and its `packageManager` must pin Aube exactly. The command
runs in that directory and uses literal arguments after `--`. Per-call
`--bun-path` and `--aube-path` select physical executables; shims and mismatched
versions fail. A host Bun with a different version is not a target-runtime
candidate. Missing tools are reported, never installed by resolution.

The caller's environment is inherited by default without mutation. Foreign
`TEAMAGENT_BUN_PATH` and `TEAMAGENT_AUBE_PATH` values do not select a target's
runtime. Selected physical tool directories precede inherited PATH. Repeated
`--path` options explicitly replace inherited PATH directories; an ordinary
launch does not shorten PATH or change global settings. The launched command
retains its own effects: use Aube's `--no-install` for verification commands.

## Optional Mise environment

`--mise-path` explicitly opts into trusted native Windows Mise evaluation. It
does not activate Mise by default, install tools, approve configuration or alter
user settings. A project configuration can execute trusted local code; selecting
it is not a sandbox for untrusted repositories. Non-Windows Mise evaluation is
currently unsupported and fails explicitly.

The provider uses a physical Windows PowerShell executable and a static snapshot
helper in one owned `mise exec --no-deps` call. Tool auto-install and Mise
environment caching are disabled for that capture. It replaces the complete
environment, so a variable removed by Mise stays removed. Empty values remain
empty. Capture is bounded, decoded and validated, and never written to a log or
cache. Failure messages omit provider output and environment values.

The provider flags and controls follow Mise's [exec contract](https://mise.jdx.dev/cli/exec)
and [settings](https://mise.jdx.dev/configuration/settings.html), checked on
November 2, 2026. Actual installed-version behavior is tested separately from
that documentation review.

Temporary files written through the supplied TEMP/TMP routing stay in the
selected project's marked scratch until the launched command and its owned
descendants finish. Trusted configuration can write elsewhere; this routing
does not sandbox arbitrary configuration code or confer ownership of those files.
Temporary routing and injected capture controls are restored deliberately;
provider output cannot adopt a foreign scratch owner. Unconfirmed provider or
command shutdown retains scratch and fails. Explicit [recovery](resources.md)
still requires ownership and shutdown evidence; no lock or evidence pruning is
introduced.

## Ownership, verification and hooks

The explicit project root owns scratch, supervisor artifacts and their locks.
The working directory alone never selects an owner. Supervisor source and
compiler inputs remain trusted Teamagent inputs; the target does not supply an
executable supervisor. Each project's cache retains the existing bounds,
streaming fingerprints and corruption checks. Preparing one project does not
reuse another project's in-flight artifact path.

The returned `closed` promise includes scratch cleanup after confirmed
descendant shutdown. Pipe callers must consume stdout/stderr. Cancellation and
timeouts retain the native Windows Job Object or POSIX group guarantees and
limitations in [resource ownership](resources.md).

`projectLauncherIdentity()` provides a bounded streaming digest of the launcher
and its maintained helper inputs, without environment values. External consumers
must additionally bind their actual target inputs, runtimes, arguments,
environment, provisioned launcher dependencies and outputs through their own
verification contract. Package/lock declarations do not prove installed bytes.
Teamagent's normal prerequisite fingerprint separately covers those bytes. The digest is
not a successful check, an independent attestation or permission to publish.
Teamagent's existing verification engine already includes `app/check` in every
key; new helper changes cannot silently reuse older evidence.

Ordinary checks, Git hooks and conversation hooks keep their pinned local
launchers and do not evaluate Mise implicitly. Hook trust, one public record per
logical task, frozen responses, live LF/export checks and signed publication
remain governed by [verification](verification.md), [conversation
logging](conversation-logging.md) and [workflow](workflow.md).
