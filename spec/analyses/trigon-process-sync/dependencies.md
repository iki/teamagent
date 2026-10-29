# Dependency and patch workflow transfer analysis

Analysis date: 2026-10-28. Source: [Trigon](https://github.com/iki/trigon) at `454e372cbc6bb75eafbbc4795391c492bc4fbf96`, using the parent task's frozen source identity. Teamagent baseline: `176569773159e4eb907fb11feda252ecc307e8f7`. Relevant Trigon code, policies and patch artifacts are clean in the parent inventory; mutable verification receipts and unrelated assets are not source inputs for this analysis.

This is an implementation proposal, not an adopted contract. No dependency installation, Trigon task, model/provider call, agent dispatch, upstream request, trust change, commit or publication was performed by this dependency audit. The 50 inspected files total 467,675 bytes; every captured source was already LF. The [tracked source inventory](../../data/trigon-process-source-2026-10-28.json) records the inspected Trigon paths, hashes and revision. The [dependency comparison](../../data/trigon-dependency-comparison-2026-10-28.json) contains the exact shared pins, and the [patch inventory](../../data/trigon-patch-inventory-2026-10-28.json) records all eight active Trigon fixes. Original byte captures and the original/LF hash manifest are local audit artifacts under `.cache/review-2026-10-27/trigon-sync-2026-10-28/deps/`; a clean checkout does not contain that cache and must use the immutable source references to reconstruct source evidence. Remote fork publication/signature and issue/PR statuses are Trigon's dated assertions, not newly authenticated checks by this audit.

## What changed relative to Teamagent

Teamagent already shares Bun 1.4.2, Aube 2.5.1, strict TS7, Effect, Oxc, Cleye, C12 and the basic `step:check`/`review:check` contract. It currently has no `deps` workflow, `deps.toml`, patch-series registry, maintained patch history, skills-update command or dependency-agent lease/receipt protocol. Its package metadata is a smaller product runtime, including Pi and media/import host adapters; Trigon has considerably more preview, Cloudflare, visualization and native deployment tooling.

The main reusable sources are [dependency maintenance](https://github.com/iki/trigon/blob/454e372cbc6bb75eafbbc4795391c492bc4fbf96/spec/deps.md), [patch policy](https://github.com/iki/trigon/blob/454e372cbc6bb75eafbbc4795391c492bc4fbf96/spec/patching.md), the [dependency runner](https://github.com/iki/trigon/blob/454e372cbc6bb75eafbbc4795391c492bc4fbf96/app/trigon-check/deps.ts), [upgrade planner](https://github.com/iki/trigon/blob/454e372cbc6bb75eafbbc4795391c492bc4fbf96/app/trigon-check/upgrade-plan.ts), [patch checker](https://github.com/iki/trigon/blob/454e372cbc6bb75eafbbc4795391c492bc4fbf96/app/trigon-check/patch-policy.ts), [skills maintenance](https://github.com/iki/trigon/blob/454e372cbc6bb75eafbbc4795391c492bc4fbf96/app/trigon-check/skills-maintain.ts) and their tests. Source paths in the captured inventories identify their location when inspected; the repository and immutable revision identify the portable source.

| Area | Reuse | Teamagent adaptation |
| --- | --- | --- |
| Validated options | Cleye flags/negative aliases; data-only TOML; CLI > file > defaults; help before configuration or effects | Teamagent names and errors; bound TOML/source reads; one reviewed `smol-toml@1.9.1` dependency if TOML is retained |
| Upgrade planner | Validate Aube JSON before mutation; exact pins; preserve dependency groups; stale direct-patch registration rejection | Preserve Teamagent's actual shipped/runtime groups; do not copy Trigon's tool-only package list |
| Dependency sequencing | Skills once; discover; patch review; fresh package discovery; install; checks; one consolidated repair | Integrate the chosen Teamagent task lifecycle and the stronger Trigon-only patch ownership rule |
| Failure handling | Independent local stages continue; one writer; no infinite repair loop; real checks after repair | Bounded/redacted LF diagnostics and original-byte retention; no automatic trust changes |
| Patch state | Stable fix IDs; one semantic patch per file; ordered series; exact concatenation bundle; matching Aube selector; current/history split | Add a machine-readable immutable Trigon source registry; reject unregistered dependency workarounds; support an empty active package-patch set |
| Agents | Lazy connection; exact project + unique idle conversation; explicit ACP executables; no CLI fallback; noninteractive permission denial | Future dispatch/publication must follow the user-approved workflow and host capability contract, not imported Trigon-specific publication assumptions |
| Recovery | Unique run IDs; original file/hash baseline; lease retained after ambiguous dispatched work; no blind retry | Keep Teamagent's existing source/evidence and staged work exclusions; bound cleanup and protect paths |
| Skills | Staging, regular-file-tree check, identity validation, rollback and no overwrite in install mode | Use Teamagent's own source list; preserve its product skill and unrelated installed guides; normalize imported text with retained originals |

## Exact shared dependency gaps

There are 24 shared direct packages: 18 differing pins and six equal pins. These are source-manifest comparisons, not a fresh registry eligibility report or a claim that all versions can be upgraded without code changes.

| Package | Teamagent | Trigon |
| --- | --- | --- |
| `@logtape/logtape` | `2.3.10` | `2.4.2` |
| `@modelcontextprotocol/client` | `2.3.0` | `2.4.0` |
| `@modelcontextprotocol/server` | `2.3.0` | `2.4.0` |
| `@oxlint/plugins` | `1.86.0` | `1.89.0` |
| `@playwright/test` | `1.63.0` | `1.64.1` |
| `@tauri-apps/api` | `2.12.1` | `2.12.4` |
| `@tauri-apps/cli` | `2.12.1` | `2.12.4` |
| `@types/node` | `26.6.3` | `26.6.5` |
| `@vitejs/plugin-react` | `6.1.1` | `6.1.2` |
| `effect` | `4.0.0-rc.118` | `4.0.6` |
| `effect-oxlint` | `0.3.4` | `0.4.0` |
| `oxfmt` | `0.71.0` | `0.74.0` |
| `oxlint` | `1.86.0` | `1.89.0` |
| `oxlint-tsgolint` | `7.0.2003` | `7.0.2005` |
| `react` | `19.3.0` | `19.3.1` |
| `react-dom` | `19.3.0` | `19.3.1` |
| `vite` | `8.3.2` | `8.3.5` |
| `zod` | `4.6.5` | `4.6.7` |

Unchanged shared pins: `@types/react@19.3.0`, `@types/react-dom@19.3.0`, `@typescript/native-preview@7.0.0-dev.20260707.2`, `c12@4.0.0-rc.2`, `cleye@2.7.0`, `consola@3.4.2`. Bun/Aube also match. Teamagent-only dependencies are the two `@earendil-works` packages at 1.0.1, `typebox@1.3.27`, and `@types/bun@1.4.2`; their versions are not supplied by Trigon and must retain independent compatibility checks. Trigon-only packages number 32 and should not be installed merely to duplicate its manifest.

Effect RC-to-stable plus the Effect lint upgrade is a material compatibility step. Read the new installed Effect guide and affected source, then validate every Teamagent adapter; do not translate a source API mechanically or suppress errors. The stack specification must stop describing the adopted pin as an RC if stable 4.0.6 is adopted. New version baselines must be recorded separately from scheduling/cache benchmarks so changes in dependency performance are not mislabeled as scheduler gains.

## Native dependencies and toolchain scope

The [tracked native comparison](../../data/trigon-native-comparison-2026-10-28.json) adds seven original/LF source captures totaling 220,967 bytes; all were already LF. Their byte captures and hash manifest remain local audit artifacts in the same cache directory. No Rust, Cargo or Tauri command was executed by this dependency audit. This section compares the checked-in native contracts, not newly demonstrated binary compatibility. The wider task separately recorded installed Rust **1.99.1** in its [filtered readiness receipt](../../data/trigon-process-readiness-2026-10-28.json); this distinguishes an actual version observation from the native manifest comparison, which deliberately reports the installed toolchain as unqueried by this subaudit. The readiness receipt does not certify a native build, signing operation or remote publication. Do not downgrade that installed Rust merely to match Trigon's setup pin.

Both manifests already use exactly `tauri = 2.12.1` and `tauri-build = 2.7.1`, with no explicit features. Trigon combines those Rust pins in its [native manifest](https://github.com/iki/trigon/blob/454e372cbc6bb75eafbbc4795391c492bc4fbf96/app/desktop/src-tauri/Cargo.toml) with JS `@tauri-apps/api` and `@tauri-apps/cli` 2.12.4 in its [package manifest](https://github.com/iki/trigon/blob/454e372cbc6bb75eafbbc4795391c492bc4fbf96/package.json). Therefore aligning Teamagent's two JS Tauri packages to the supplied Trigon versions does **not require a Cargo manifest or lockfile upgrade** on the available source evidence. Keep `--locked`, verify the actual desktop build/tests after changing the JS launcher, and confirm the Cargo lockfile stays unchanged. A newly discovered compatibility failure must be investigated; it is not permission for an automatic native update or unsupplied workaround.

The Cargo lockfiles share 381 crate names. Four have different version selections, all newer in Teamagent:

| Crate | Teamagent lock | Trigon lock | Recommendation |
| --- | --- | --- | --- |
| `cc` | `1.6.0` | `1.5.1` | Retain Teamagent |
| `libc` | `0.2.190` | `0.2.189` | Retain Teamagent |
| `mio` | `1.2.4` | `1.2.3` | Retain Teamagent |
| `tokio` | `1.53.2` | `1.53.1` | Retain Teamagent |

All shared exact name/version identities have matching source and checksum fields. Tauri runtime/runtime-wry remain 2.12.1, codegen/macros 2.7.1 and utils 2.10.1 in both locks. Do not overwrite Teamagent's lockfile with Trigon's, downgrade these four indirect selections, or run a broad Cargo update as part of JS alignment.

Preserve Teamagent's explicit native dependencies `serde = 1.0.229` with derive, `serde_json = 1.0.151`, `getrandom = 0.4.3`, and `url = 2.5.8`. Trigon contains these versions transitively; its smaller direct manifest is not a reason to remove Teamagent's required declarations. Trigon adds only the mobile-conditioned direct `tauri-plugin-geolocation = 2.4.1` and associated `tauri-plugin` lock entry. Teamagent mobile implementation is deferred, so neither should be imported.

Teamagent uses Rust edition 2024 and declares minimum `rust-version = 1.90`; this is **not an installed-toolchain pin**. Its desktop launcher resolves `rustc`/`cargo` from PATH. None of the inspected root/native `rust-toolchain`, `rust-toolchain.toml`, Mise, `.tool-versions` or `.cargo/config.toml` locations pins its Rust toolchain. Trigon uses edition 2021 and pins Rust **1.99.0** in its [Mise inventory](https://github.com/iki/trigon/blob/454e372cbc6bb75eafbbc4795391c492bc4fbf96/mise.toml) and [native CI setup](https://github.com/iki/trigon/blob/454e372cbc6bb75eafbbc4795391c492bc4fbf96/.github/actions/mobile-setup/action.yml). Preserve Teamagent's edition and minimum; record Rust 1.99.0 as a separately reviewed portable setup candidate if adopting the toolchain inventory. Importing that setup policy must not silently install or switch the local toolchain. Trigon's own dependency contract explicitly keeps toolchain and Cargo maintenance separate from `deps`.

Trigon's release profile (`panic = abort`, one codegen unit, LTO, size optimization and stripping) is a build optimization candidate, not a dependency prerequisite. Its effect on native size, build time, debugging and panic behavior needs the separate benchmark/build review; do not copy it merely to match a manifest.

The proposed package-upgrade choice remains precisely the **18 differing shared JavaScript pins** above. It excludes Cargo changes, Rust installation, Trigon-only app/mobile dependencies, and all four Teamagent-only JavaScript packages: `@earendil-works/pi-agent-core@1.0.1`, `@earendil-works/pi-ai@1.0.1`, `typebox@1.3.27`, `@types/bun@1.4.2`. Retain those declarations and pins. A minimal workflow parser such as the supplied `smol-toml@1.9.1`, if the TOML design is adopted, is a separately identified process dependency rather than part of the 18-pin alignment.

## Which supplied patches apply

The [tracked patch inventory](../../data/trigon-patch-inventory-2026-10-28.json) records all eight active Trigon fixes, of which two are Aube package patches. The immutable source provides the [atomic series](https://github.com/iki/trigon/blob/454e372cbc6bb75eafbbc4795391c492bc4fbf96/patches/series.json), [Portless bundle](https://github.com/iki/trigon/blob/454e372cbc6bb75eafbbc4795391c492bc4fbf96/patches/portless@0.15.12.patch) and [Wrangler bundle](https://github.com/iki/trigon/blob/454e372cbc6bb75eafbbc4795391c492bc4fbf96/patches/wrangler@4.153.0.patch); package selectors must match exactly before installation. These are source evidence and future import candidates, not installed Teamagent patches.

| Fix | Current Teamagent relevance | Recommendation |
| --- | --- | --- |
| `tauri-native-lifetime` | Direct: `app/desktop/build.ts` invokes upstream `tauri.js`, with CLI 2.12.1, the historically affected Trigon pin | Reuse the provided `native-lifetime.ts` + `tauri-cli.ts` implementation and regression. Route the existing desktop launcher through it. Validate the selected CLI pin and actual desktop completion. |
| `portless-bun-tls` | Portless absent | Keep as a documented central source only; import if stable HTTPS preview becomes an approved scope item. |
| `bun-undici-resolution`, `bun-undici-fetch`, `wrangler-verified-bun-fetch` | Wrangler/Miniflare/Undici direct tooling absent | Do not add now solely for policy parity. If workerd tooling is adopted, consume the documented prerequisite stack and exact package patch together. Never install the preload globally into Teamagent's daemon or media clients. |
| `cf-bun-config`, `cf-api-config-coupling` | cf/config/deployment surface absent | Future candidates, not current requirements. Their distinct removal criteria remain separate. |
| `avif-encoder-types` | AVIF encoder absent | Do not import an unused codec or ambient declaration. |

The current Tauri source regression does not claim a newly reproduced defect at CLI 2.12.4: Trigon explicitly says the latest unguarded failure is unreproduced. Its historical 2.12.1 observations and deterministic lifetime tests justify evaluating the supplied conservative guard, not claiming upstream confirmation. All 160 native launches remain part of Trigon's regression inventory; a performance transfer must preserve behavior coverage or justify a separately reviewed alternative rather than silently shortening it.

`zstddec@0.3.4` is a historical resolved patch, not an active fix. Teamagent's `app/imports/assets.d.ts` is a supported source-asset import declaration, and its native tsgolint-path override is a documented tool extension point. Neither is evidence of a new third-party defect requiring an invented patch.

## Portable centralized patch ownership

Recommended model: **Trigon owns fixes; Teamagent consumes immutable reviewed snapshots**.

1. Keep a tracked Teamagent source registry containing Trigon repository identity, full source commit, fix ID, affected package/version, canonical source path, SHA-256, source/fork base and head, any prerequisite fixes, regression command and removal condition.
2. For package diffs, keep byte-identical checked-in mirrors required by Aube. The copies are installation artifacts, not a second independently edited patch implementation. The guard compares their bytes to the imported source hashes and the ordered series. Frozen installation and verification use those local artifacts, with no implicit fetch.
3. For the small Tauri host adapter, the supplied files are already portable and can be copied unchanged together, with Teamagent wiring outside them. Record provenance for both files. Do not import all Trigon build/preview code to obtain the guard.
4. An explicit source-refresh command may use an optional local Trigon checkout or a bounded public Git cache; another developer must not need a sibling checkout. Resolve exact Git objects, verify the repository identity and hashes, and never execute the clone's scripts. Normal gates remain offline.
5. A changed source revision is a review candidate, not automatic promotion. Preserve prior source identity/hash and tests. Refresh only the selected fix; do not follow a moving branch during installation.
6. A missing, incompatible or changed unapproved fix blocks the dependent update. Ask the user before authoring/applying a dependency workaround absent from Trigon. A new package version that the existing patch does not cover is not automatically authorized by an older patch ID. Prefer adding the fix centrally in Trigon after approval, then importing the reviewed result.
7. The restriction covers forks, preloads, declaration shims and application-side bypasses of dependency defects. It must be present in repair prompts and deterministic planning/receipt checks, not only AGENTS prose. Backend/model options, CI, fallback or a generic repair request must not bypass it.
8. Teamagent-owned process/cache/logging adaptations are not new dependency patches. They may adapt Trigon's workflow contract while preserving shared third-party bytes. No automatic upstream comments, reactions, forks or pushes follow merely from importing the patch policy.

## Collisions and review issues

### Must resolve in the adoption design

- **Publication and agent scope:** Trigon's default dependency options enable patch/repair agents and its final phase expects a single verified commit at the remote tip or a validated manual handoff. That is inseparable from the broader task/publication choice. Do not transplant the embedded `iki/trigon` URLs, Trigon project name, task identity, automatic publication expectation or agent-message authorization into Teamagent unchanged.
- **Dependency scope:** decide whether this change aligns the 18 differing shared pins now, or imports the maintenance system first and leaves package upgrades as a separate run. Recommended: align the reviewed shared base in a distinct implementation step, then benchmark the chosen versions. Do not import Trigon's 32 unrelated packages or update Pi/typebox without their own review.
- **Patch authority:** the user's stronger rule supersedes Trigon's generic permission to prepare new fixes. A repair agent must return a pending proposal when Trigon has no compatible supplied patch. This cannot be satisfied by copying the current Trigon repair prompt unchanged.
- **LF and bounded I/O:** `deps-runtime.ts` currently redirects child output directly into logs, without a file byte cap or LF normalization. It uses a one-hour subprocess timeout; several source/receipt readers and the patch-policy directory walk lack Teamagent's explicit byte/realpath/entry bounds. Adapt the host layer to bounded raw retention plus redacted LF views, contained paths, atomic receipts and explicit incomplete results. The patch checker must reject links/junction escapes as well as lexical traversal.
- **Cleanup bounds:** ACP shutdown awaits process/stream termination after a kill request without a separate final termination deadline. Preserve the existing no-early-cleanup regression while adding a bounded failure path; do not silently hang a Teamagent gate indefinitely or treat an uncertain process as stopped.
- **Runtime dependency groups:** Trigon's `dependency-policy.ts` requires C12/Cleye/Consola and several asset tools to be devDependencies. Teamagent uses the former in its operational CLI. Keep the product's packaging contract; do not import the literal Trigon allowlist or add absent packages just to satisfy it.
- **Existing install trust:** retain `aube-workspace.yaml` denials for `@google/genai` and `protobufjs`. No new dependency-build approval, linker switch, broad trust relaxation or second JS lockfile is authorized. Cargo and toolchain updates remain separate.
- **Skills inventory:** reuse the maintenance mechanism, not Trigon's entire `.skills.conf`. Teamagent's product skill, Entire guide and current scoped library remain intact. Trigon's explicit source selectors are useful, but unrelated auth guides or existing records must not be silently removed; copied skill bytes need the same LF/original provenance treatment.

### Documentation and evidence corrections

- Trigon's [runtime specification](https://github.com/iki/trigon/blob/454e372cbc6bb75eafbbc4795391c492bc4fbf96/spec/runtime.md) still mentions Portless 0.15.7 and `deps:upgrade`, while current package/code/dependency documentation uses 0.15.12 and `deps`. Do not import those stale references.
- Trigon's [patch registry](https://github.com/iki/trigon/blob/454e372cbc6bb75eafbbc4795391c492bc4fbf96/spec/patches.md) retains audit date 2026-10-27 despite the later reusable-fork additions. Treat each supplied immutable version as evidence and recheck remote status only when the associated change actually requires it; do not claim today's authenticated GitHub status from this local read.
- Trigon's release-age behavior is delegated to Aube's eligible candidate report; no Teamagent numeric release-age policy should be invented from the word “eligible.” Before mutation, inspect the actual effective non-secret Aube policy and make any required portable policy decision explicitly. Avoid reading or copying credential-bearing global configuration.
- Global launchers, default remote URLs, full-access fallback, project/chat names, cache roots and root/protocol module boundaries are adaptation points. No absolute developer path or secret profile belongs in the portable rules.

## Suggested user questions

1. Should this synchronization also align the 18 shared dependency pins to Trigon now (recommended), or first import the workflows while leaving the current runtime pins? This determines whether the Effect RC-to-stable migration and native/browser acceptance are part of this delivery.
2. Should invoking `deps` enable named-agent repair/patch review by default, or stay local-only unless explicitly enabled? Recommendation depends on the separately chosen task/commit/push workflow. CI remains agent-free in either case.
3. Confirm the portable patch-source model if needed: checked-in, byte-identical artifacts pinned to Trigon's immutable source, with explicit refresh and no sibling checkout requirement. This implements the already-settled central ownership requirement; it is not a request to invent an independent patch repository.

There is **no currently identified required dependency workaround missing from Trigon**. The useful Tauri fix is provided. If a new issue appears during real upgrades or benchmark implementation, stop the dependent change and ask with a concrete reproduction, available Trigon evidence and proposed central fix scope.

## Implementation sequence after the user's choices

1. Record the source commit and adopted/retained/deferred map; preserve the task baseline and unrelated files. Update rules with the central patch gate before allowing new dependency repair.
2. Import the minimal pure option/planner/patch-policy pieces with Teamagent-specific contract fixtures. Add bounded source/provenance storage and LF log adapters, then run the mandatory gate.
3. If selected, upgrade the shared base with Aube exact pins and its lockfile, preserving deny-builds. Re-read the installed stable Effect guide and fix ordinary compatibility changes without weakening strictness. Missing Trigon workaround means a pending question, not a locally invented shim.
4. Reuse the supplied native-lifetime adapter and run focused deterministic and actual native CLI tests, followed by applicable desktop acceptance. Retain evidence separately from any performance experiment.
5. Integrate the agreed task lifecycle/agent coordinator and skills updater. Fixture-test CI/local-only/no-op runs, unknown patches, stale selectors, hash mismatch, absent source, source path escape, ambiguous dispatch, existing work preservation, bounded shutdown and no silent retries.
6. Benchmark the actual selected dependency/runtime pins and run Teamagent's real verification/build targets. Reuse Trigon's measured techniques only when scope/isolation/input contracts hold; preserve both cold and warm evidence.
7. Publish only through the user-selected Teamagent commit/push policy. Do not copy Trigon's release bump, upstream contribution, deployment or full-access fallback behavior without that choice.
