# Dependency and patch maintenance

Aube owns JavaScript dependency changes and `aube-lock.yaml`; Bun executes tools and tests. Keep runtime/development dependency roles, the workspace's explicit build denials and the single lockfile. Native Cargo changes remain separate and use the checked-in lock. [Runtime rules](architecture/runtime.md) and [the source comparison](analyses/trigon-process-sync/dependencies.md) provide the context.

## Central patch ownership

Trigon is the source of shared-stack dependency fixes. Reuse an applicable supplied fix with its exact source revision, affected versions, prerequisites, original bytes, regression coverage and removal condition. Store the portable required artifacts and provenance in Teamagent so a new checkout does not depend on a sibling directory.

If a required workaround is absent, incompatible or no longer verifiable in Trigon, stop the affected change and ask the user. Present the bounded reproduction and why the supplied fixes do not apply. Do not silently create an independent patch, fork, monkeypatch, declaration shim or repair-agent workaround. This rule applies to normal commands, CI, manual overrides and fallback/repair paths. A direct repository implementation fix is not automatically a third-party dependency patch; record that distinction explicitly.

Do not import all patched packages merely because Trigon uses them. In the inspected snapshot, only the Tauri native-lifetime adapter applies to Teamagent's current stack. Its conservative historical workaround is not proof that the latest upstream release still reproduces the defect. The [reviewed patch inventory](data/trigon-patch-inventory-2026-10-28.json) records all eight active supplied fixes and their applicability.

## Process

Ordinary integrity checks are offline and inspect the committed manifest, provenance and supplied files. Explicit discovery may query Aube for update information; a saved report is untrusted data until structurally and semantically validated. Planning records current and proposed exact pins, dependency roles, source hashes and applicable fixes. Planning never installs packages or runs upstream code.

Applying a reviewed plan is an explicit mutation. Verify its baseline and patch coverage again, persist the attempt before invoking Aube, preserve trust settings, and inspect both manifest and lock changes. Bound process time and diagnostic output; do not automatically retry an uncertain install or launch an agent to invent a repair. Leave honest partial-state evidence if Aube changes files before failing.

Explicit source refresh stages a candidate from an exact supplied Git revision. It does not promote it, execute it, copy configuration or import a successful receipt. Verify source identity and immutable object/file hashes. Normal checks and fresh installs use committed artifacts; local source locations remain optional maintenance inputs.

## Commands

`aube run --no-install deps --help` documents strict action-specific options.
Paths supplied on the command line resolve from the invocation directory;
outputs must be new paths within `.cache/dependencies/`. JSON results go to
stdout and safe diagnostics go to stderr. Help/version are passive.

```sh
aube run --no-install deps check
aube run --no-install deps plan --report .cache/dependencies/outdated.json --output .cache/dependencies/plan.json
aube run --no-install deps discover --output .cache/dependencies/discovered-plan.json
aube run --no-install deps apply --plan .cache/dependencies/plan.json
```

`check` and `plan` are offline. `discover` explicitly contacts the configured
Aube registry with bounded requests. `apply` rechecks the saved plan and current
baseline, changes exact pins through Aube, and runs the review gate. An uncertain
apply retains its lease and receipts; neither another entry point nor an agent
may silently retry it. `source-refresh --source ../trigon --revision FULL_SHA
--output .cache/dependencies/candidates/review` stages an exact local Git
candidate for review without promoting it. The source must match the canonical
[Trigon repository](https://github.com/iki/trigon); normal checks do not require
that sibling directory.

## This alignment

The user approved a separate implementation step aligning 18 shared JavaScript pins, including stable Effect 4.0.6. The [exact comparison](data/trigon-dependency-comparison-2026-10-28.json) distinguishes the 24 shared packages from Teamagent-only and unrelated Trigon packages. Preserve the Pi packages, TypeBox and Bun types; keep C12, Cleye and Consola in their required runtime roles.

The [2026-10-29 alignment report](analyses/trigon-dependency-alignment-2026-10-29.md)
records installation of all 18 targets in their existing groups and a successful
frozen install with unchanged manifest and lock bytes. This explicitly selected
Trigon source comparison is distinct from the CLI's Aube registry-report plans;
no registry eligibility report was fabricated. Compatibility checks, platform
acceptance and signed publication are tracked separately in that report.

Keep Teamagent's Cargo lock and Rust edition. The native Tauri manifest pins already match; four locked crates are newer here. Trigon's Rust setup pin is a separate toolchain decision and does not authorize a downgrade of the observed installation. Read the complete newly installed Effect guidance before adapting APIs, and run fresh compatibility checks after the JavaScript alignment.

## Verification and operational limits

Required evidence includes malformed/stale plans, unknown fixes, modified artifacts, missing prerequisites, unauthorized package changes, failure retention and no implicit network activity in ordinary checks. Test supplied Tauri lifecycle handling and real platform acceptance when its launch path changes. Browser/native execution must be reported separately from type checks, fixture execution and successful bundles.

Do not relax lifecycle trust, disable type-aware lint, weaken schemas or replace native tooling solely to make an update pass. A failing new dependency without an applicable supplied fix triggers the user decision above. No new agent chat, external message, fork push or release is implicitly authorized by dependency maintenance.
