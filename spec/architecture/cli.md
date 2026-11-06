# CLI and configuration contracts

[Architecture rules](README.md) · [Stack](stack.md) · [Runtime](runtime.md)

Use Cleye for strict CLI flags, C12 for trusted local configuration, Effect Schema
for validation and Consola for developer-facing diagnostics. These choices apply
to user commands and maintenance tools as their interfaces are introduced.
The current check, hook and conversation entry points are small internal
protocol adapters. They may validate their finite argument sets directly and
use process streams; add the shared CLI dependencies when a user-facing command
or configuration interface actually needs them.

All public commands share `-h/--help` and `-V/--version` and report the same root
package version. Commands that load configuration share `-C/--config`; commands
that use an asset/data directory share `-D/--data`. Reserve these aliases in one
shared CLI library. Do not add data/config flags to commands that do not need
them. Maintain a catalog of public entry points with canonical help/spec and
README locations; internal probes are not public commands.

Help and version must return before configuration execution, reads, downloads,
generation, worker startup or validation. Reject unknown flags, conflicting
options and deprecated aliases explicitly. Decode parsed input before application
use; central domain parsers own shared time/range or other input notation.
Enable Cleye's `strictFlags` explicitly and preserve it for subcommands. Do not
use `ignoreArgv` to silently discard unsupported flags. Document and test repeated
flags, boolean negation and the `--` terminator when a command supports them.
Typed flag helpers improve parsing but do not replace Effect Schema validation
of JSON or other dynamic values; a generic type argument is not runtime proof.

## Trusted configuration and paths

Use `teamagent.config.ts` when an executable local configuration file is needed.
Loading TypeScript configuration is code execution: only trusted local config is
eligible. Never execute remote/user-uploaded configuration or load it in a
browser. C12 loading does not replace structural and semantic validation.
Set discovery and environment behavior explicitly: disable RC/global RC,
package metadata, dotenv and extended layers unless the command's documented
contract requires them. Disable remote layer fetching and layer dependency
installation; dependency changes remain Aube's responsibility. Validate trusted
local layer paths before enabling inheritance. Select the environment explicitly
and remove C12 control keys before decoding the final domain configuration.

Use the selected version's installed types/source to check C12 options and
defaults; skill examples are guidance, not a replacement for that API contract.
Validate merged configuration as `unknown` with Effect Schema and semantic
checks. Preserve source/layer provenance separately from validated values and
never log raw configuration or diffs. Treat the resolved object as immutable.

An explicit `--config` path resolves from the invocation working directory.
Relative source/output/data/theme paths resolve from that selected file's
directory. CLI overrides take precedence over decoded config, followed by
documented defaults. Explicit read-only data paths may permit a missing default
config; generators must still require their needed source settings. Document
exceptions such as executable lookup through PATH and report paths relative to
the working directory.
Tests must exercise this precedence, missing explicit files, environment
selection, and array/null merging instead of assuming generic deep merging
matches the command's contract. Dotenv and file-backed secrets require explicit
host configuration, bounded reads and validation; they must not appear as an
implicit consequence of loading config.

If live configuration is introduced, acquire the watcher in an Effect scope,
debounce updates and await `unwatch()` during shutdown/test teardown. Publish
only successfully decoded and semantically valid snapshots; retain the previous
snapshot and report a sanitized failure when reloading fails. Test the pinned
version's `acceptHMR`/`onUpdate` lifecycle before depending on callback ordering.

Path adapters enforce directory containment and validate sizes, hashes, versions
and expected coverage before consuming assets. Generators write complete chunks
before atomically replacing a manifest and reject concurrent writers to one
cache/output. Existing export files use exclusive creation unless an explicit
overwrite mode is part of the command contract. Explain partial multi-file
output if later work can fail after an earlier file succeeds.

## Output and documentation

Keep machine-readable JSON/YAML output on stdout and progress/status on stderr.
Use pinned `yaml` when YAML output is implemented. Maintain one canonical
specification for input notation, option defaults, mutual exclusions, output
formats and examples; derive help modules and README help from it.
Configure an application-owned Consola instance/reporter to keep all diagnostics
on stderr. Do not wrap stdout with `wrapStd`/`wrapAll` for commands with a machine
output contract. Use scoped tags; reserve fatal/error output for real failures.
Test stream separation with a captured reporter or Bun mocks, and restore any
mock/global redirection after each test. Keep interactive prompts out of hooks
and noninteractive commands. An interactive command must handle cancellation
explicitly instead of accepting a default action on cancellation.

Guard shared aliases, catalog coverage, option/help coverage and help/README
mirrors. Changing parsing or input semantics requires explicit documentation
review. A future `docs:sync` command may refresh generated help and acknowledge
a reviewed source digest; normal validation must never silently refresh that
acknowledgment. Semantic examples still need tests beyond structural mirrors.

## Repository check command

The check entry point is root-relative regardless of invocation directory. Its
default checks formatting, strict TypeScript, type-aware/custom lint and tests,
returns nonzero on failure and stops at the first failed stage. `--format` or
`step` is the explicit source-write mode used by `step:check`. `review:check`
does not fix sources, but may publish cooperative `.verification/` receipts and
owned fixture/cache outputs. `--force-fresh` runs the checks instead of accepting
matching success receipts. Module layout, dependency-artifact integrity and raw
LF/export checks remain live. See [verification](../verification.md) and the
[cache contract](../cache.md).

The optional `--workers <1|2|3>` sets an upper bound on unit worker processes.
The default remains automatic resource-derived admission up to three. Repeated
flags select the last value. That value must be an integer from one through
three; zero, larger values, fractions, non-numbers and a missing value fail
before prerequisite work. The initial
count is the smaller of the cap and resource admission, and live memory checks
can reduce admission further. Two and three workers use the same audited batch
inventory, with research first and exclusive; one worker preserves the entire
original file order. The four new multi-step Git scenarios additionally restrict
total active batches to two while any is running; starting a scenario also
requires fewer than two existing active batches. Ordinary audited groups are
queued before those scenarios and can use three slots while none is active,
bounded by the caller cap, live resources and the two-workflow-group cap. Selecting --workers 2 retains that overall cap
throughout. The flag changes scheduling only: every discovered test
still runs unless verification fails, all adopted deadlines stay enforced, and
there is no partial or per-batch success caching. Existing complete exact-input
receipts remain eligible; pair `--workers 2` with `--force-fresh` to measure an
executed full gate. Help and version remain passive with the flag present.

The developer entry points are separate from the product module CLI:

| Entry                                 | Canonical contract                           | Input                                                                               |
| ------------------------------------- | -------------------------------------------- | ----------------------------------------------------------------------------------- |
| `task:parallel`                       | [Parallel workflow](../parallel-workflow.md) | Bounded JSON stdin; isolated task and integration operations                        |
| `skills`                              | [Reusable skills](../reusable-skills.md)     | Pinned Vercel Skills CLI under Bun; explicit names, agents and reviewed source      |
| `task:run`                            | [Repository workflow](../workflow.md)        | Bounded JSON stdin; fixed `.workflow.json` policy                                   |
| `project:run`                         | [Project launcher](../project-launcher.md)   | Explicit physical target, pinned tool and literal arguments after `--`; Mise opt-in |
| `deps`, `deps:check`                  | [Dependency maintenance](../dependencies.md) | Strict action-specific flags; no implicit installation                              |
| `cache:status`, `cache:verify-staged` | [Verification cache](../cache.md)            | Passive history inspection or actual staged-index validation                        |
| `build:web`, `build:desktop`          | [Build cache](../cache.md)                   | Explicit `--cache` or `--force-fresh-cache`; native acceptance remains live         |

Their help/version paths are passive. Fixed JSON policies are decoded data;
these tools do not discover executable C12 configuration or add unused config
and data flags. The conversation writer and Git hook wrappers remain internal
JSON/finite-argument protocol adapters.

Document expensive integration checks separately, including browser downloads,
native prerequisites, loopback servers, credentials and output reports. Do not
make ordinary help invoke them or claim the basic quality gate proves every
native deployment. All JS/TS command and IDE callbacks run Bun; Aube owns installs.
