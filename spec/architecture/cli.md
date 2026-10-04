# CLI and configuration contracts

[Architecture rules](README.md) · [Stack](stack.md) · [Runtime](runtime.md)

Use Cleye for strict CLI flags, C12 for trusted local configuration, Effect Schema
for validation and Consola for developer-facing diagnostics. These choices apply
to user commands and maintenance tools as their interfaces are introduced.

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

## Trusted configuration and paths

Use `teamagent.config.ts` when an executable local configuration file is needed.
Loading TypeScript configuration is code execution: only trusted local config is
eligible. Never execute remote/user-uploaded configuration or load it in a
browser. C12 loading does not replace structural and semantic validation.

An explicit `--config` path resolves from the invocation working directory.
Relative source/output/data/theme paths resolve from that selected file's
directory. CLI overrides take precedence over decoded config, followed by
documented defaults. Explicit read-only data paths may permit a missing default
config; generators must still require their needed source settings. Document
exceptions such as executable lookup through PATH and report paths relative to
the working directory.

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

Guard shared aliases, catalog coverage, option/help coverage and help/README
mirrors. Changing parsing or input semantics requires explicit documentation
review. A future `docs:sync` command may refresh generated help and acknowledge
a reviewed source digest; normal validation must never silently refresh that
acknowledgment. Semantic examples still need tests beyond structural mirrors.

## Repository check command

The check entry point is root-relative regardless of invocation directory. Its
default checks formatting, strict TypeScript, type-aware/custom lint and tests,
returns nonzero on failure and stops at the first failed stage. `--format` is the
explicit write mode used by `step:check`; `review:check` remains read-only apart
from clearly designated test fixtures/build caches.

Document expensive integration checks separately, including browser downloads,
native prerequisites, loopback servers, credentials and output reports. Do not
make ordinary help invoke them or claim the basic quality gate proves every
native deployment. All JS/TS command and IDE callbacks run Bun; Aube owns installs.
