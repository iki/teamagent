# Project launcher and maintenance review — 2026-11-02

## Source and scope

The initial comparison starts at
`c4b01c1fa1dba94b355bbf8e52d3a72c2f39d216`, the ending source pin in the
[November 1 resource import](verification-resources-2026-11-01.md), and ends at
[`05bd72600bf481d18156bef9eb4533ee04d2c053`](https://github.com/iki/trigon/commit/05bd72600bf481d18156bef9eb4533ee04d2c053).
The initial local source observation found that ending HEAD. A separate live
`ls-remote` read on November 2 confirmed the same `refs/heads/main` revision at
the canonical remote. This comparison uses committed Git objects, not mutable
source worktree contents. Teamagent began the review at
`2e43cfd5b337ba2ff2f0bdafeb8c7a9fca338579` with a clean working tree.

The principal applicable change is
[`f487085df6957c55b03f204ebb2d82583532c17a`](https://github.com/iki/trigon/commit/f487085df6957c55b03f204ebb2d82583532c17a),
which adds explicit project selection, physical runtime selection and optional
Mise environment acquisition. The source also merged the already imported
Tinypool process-worker patch at
[`989e4a8fc16855ac037687c6ed7241c926ec74ab`](https://github.com/iki/trigon/commit/989e4a8fc16855ac037687c6ed7241c926ec74ab).
Other intervening changes primarily concern branding assets and the source
application's shared preview service.

The launcher is an adaptation of repository-owned host code. It does not select
new JavaScript dependencies, change package pins, relax dependency trust or
authorize changing another project's settings. Shared dependency patches remain
under the [central patch policy](../dependencies.md).

## Adoption decisions

These decisions define this increment's intended behavior; the verification
section separately records which implementation and acceptance checks ran.

| Area | Decision and boundary |
| --- | --- |
| Project selection | Require an explicit absolute physical target. Its agreeing Bun metadata and exact Aube package-manager pin select the runtime; the implementation checkout supplies the reviewed launcher code. |
| Physical runtime resolution | Resolve per invocation, reject shims and wrong versions, and accept explicit per-call runtime paths. Do not inherit another project's runtime override. Prefer the current Bun executable only when its version matches the target pin. |
| PATH | Preserve the caller's environment by default. Explicit absolute replacement directories are deliberate input; add selected runtime directories without silently truncating inherited PATH or changing global settings. |
| Mise | Offer explicit Windows-only acquisition through a physical Mise executable and a static native PowerShell snapshot helper. Default operation does not invoke Mise or load dotenv. No implicit installation, trust change, secret grant or weaker fallback is permitted. |
| Environment privacy | Bound private capture in memory, validate structure and reject errors without secret values or parser excerpts. Replace the environment so removed variables stay removed; restore only fields injected by the provider. Do not persist snapshots. |
| Lifetime | The selected project owns marked scratch and native supervisor artifacts. Keep temporary configuration available through environment acquisition and command completion; release it only after confirmed descendant shutdown. |
| Reuse | Expose an identity covering the complete consumed launcher/helper/configuration closure. Target sources, relevant environment and external prerequisite state remain separate inputs. An identity match never grants execution or publication authority. |
| Hooks and public records | Retain the existing pinned execution, bounded diagnostics, public-only logging, explicit writer fallback and frozen-response contract. Hook trust and native activation require their own explicit evidence. |

## Retained stronger safeguards

The source launcher disposes temporary storage when its process completion
promise settles, without testing whether termination was confirmed. Its
environment-capture cleanup likewise disposes storage after requesting stop.
Teamagent's [resource contract](../resources.md) is stricter: an unconfirmed
shutdown must retain scratch. Environment-acquisition failures must preserve
that uncertainty through the outer launcher rather than letting an exception
path dispose a still-owned directory.

Teamagent also retains bounded, locked native-cache preparation, validation of
existing artifacts, explicit compiler references and compiler-configuration
identity. Adding target ownership must not adopt the source's automatic rewrite
of incomplete or corrupt native artifacts. Unknown state requires inspection;
there is no evidence pruning or lock reclamation.

Launcher identity must retain bounded full-content fingerprinting and cover the
actual local helper closure. The source's synchronous whole-file identity
implementation is not justification to remove streaming or input bounds.
Project-local scratch continues to use the short `.tmp` root, keeping fixtures
outside the import system's `.cache` exclusion and avoiding the earlier Windows
pathname regression. Borrowed ownership never grants authority to delete a
parent scope.

Verification still checks complete inputs and prerequisites, output integrity,
rejection history and the staged index. LF/export integrity and relevant
external state remain live. All unit coverage, memory admission and existing
deadlines remain required. Neither optional Mise nor launcher identity makes
captured credentials or changing external configuration reusable evidence.

## Already present and deferred changes

The compared source range changes no implementation in verification
fingerprinting, input-cache reuse, unit memory admission, temporary-workspace
recovery, agent hooks or public conversation ingestion. Conversation application
changes are release metadata only. The prior import and subsequent Teamagent
maintenance already cover streaming fingerprints and public transcripts, marked
fixture cleanup, live memory admission, Windows descendant ownership, hidden
processes and immediate disposal of proven finished scratch. Those earlier
results remain dated evidence rather than tests of this increment.

The Tinypool patch is already installed in Teamagent's declared dependency
graph. Its current source and local artifact have identical Git blob and SHA-256
identities. Only the current merge-status documentation changes; the original
registry pin and historical selection evidence remain intact. No new dependency
installation result is inferred from source equality.

The source D1 acceptance tool now assigns Miniflare an explicit owned
persistence directory and retains it when runtime shutdown fails. Teamagent
has no active Miniflare consumer, so that specific adapter is not imported.
Its ownership principle is already required by the resource contract.

Shared Portless routes, source-host paths, operator state and preview setup are
not applicable to the active Teamagent surfaces. The launcher may preserve a
caller-supplied environment value, but it does not discover, adopt, restart or
reconfigure shared services. Branding paths, image families, release graph and
mobile-specific cache edits are likewise outside this increment.

## Source identities

Paths below are relative to the source repository at the ending pin. Blob
identities refer to immutable Git objects, without depending on source worktree
files or transferring another repository's successful verification receipts.

| Source | Git blob |
| --- | --- |
| `app/trigon-check/project-launcher.ts` | `4368c59b898727f35763bce312caf4d747d435e6` |
| `app/trigon-check/project-environment.ts` | `d34a4fa8e7ac61a436d22ff17668841ab25fb309` |
| `app/trigon-check/project-launch.ts` | `f3b30e61675edc1e7df6347ff4cdfb8eaadb4d1f` |
| `app/trigon-check/environment-snapshot.ps1` | `ed3f9f554c19b1fde107e9ca7b01892a62575998` |
| `app/trigon-check/toolchain.ts` | `bbc1ff90966b770695ead4e93edeafad1deeee02` |
| `app/trigon-check/owned-process.ts` | `7f84031630d2b0b53eaee6cb979a6d6bf4334568` |
| `app/trigon-check/location-d1.ts` | `91b16322f03443ad1cc7c74034a0966cdf37ac70` |
| `patches/tinypool@2.2.0.patch` | `8e3b4d9cf0430855cdbb19d0cad7a19aac90bec8` |
| `spec/project-launcher.md` | `46db285aeec4ac703706cfd9f22be7fd35729821` |
| `spec/resources.md` | `9a70244c71275f59d9d5930151ddf682b6ce59f4` |
| `spec/workflow.md` | `3baa70fc683cdb8b545332398e7cc612a37d475e` |

The Tinypool artifact retains SHA-256
`de8f773eec7e3e36c669f0a21df874afe37d23f88efc1b61498602a9701253be`.
Its original selected source revision remains
`9ef18967b46fe01571933c3ba6216823ad961c16`; the merge has that revision as its
second parent. See the [artifact record](../../patches/trigon/README.md).

## Verification and limits

The first diagnostic launch rejected an unresolved linked Bun path before any
test ran. The diagnostic runner was corrected to resolve the selected physical
executable; that attempt remains recorded. The next focused Windows run passed
51 tests, skipped the existing POSIX-only case and failed three cleanup cases.
It completed with confirmed outer process cleanup in 27.234 seconds.

Those failures exposed two implementation defects. Aborting a private capture
reader on output overflow could destroy its pipe before owned shutdown; capture
now requests cancellation while continuing to drain/discard bounded output.
Separately, a forced Windows supervisor termination could report the same raw
exit code as an ordinary completed child. That observation could not establish
successful job draining. A tagged-exit-status prototype retained the
external-termination reproduction but failed its real runtime check: the pinned
Bun process interface exposed only the low byte. That third focused attempt
passed 41 tests, skipped one and failed 17 in 26.515 seconds; no full gate ran.
Its outer diagnostic command also reported unconfirmed cleanup and retained its
marked scratch. The failed attempt and scratch are preserved for inspection.

The completion protocol instead uses an explicit bounded native record written
after confirmed cleanup. This adapts our own transport
to its observed status semantics; it does not modify Bun or add a dependency
patch. Raw process exit alone cannot authorize scratch disposal. An
already-finished cancellation event does not by itself justify a forced kill.
The record remains cooperative evidence, not an attestation against a hostile
process with the same filesystem authority. All original failure reproductions
remain required.

The fourth focused run passed 59 tests with the existing POSIX-only case skipped
and no failures. Its nine files covered both runtime launchers, environment
boundaries, native completion, Git hooks and conversation records. It took
34.396 seconds with confirmed outer cleanup. Its retained log has SHA-256
`5fa3dcef830233dafa5b1421aa459ac7ce83005dfa2ac1dc309cb548a3f2b3ea`.

The first assembled step passed formatting, all four TypeScript programs and
type-aware lint but failed the unit phase: four batches failed, including the
research maintenance case at its unchanged 120-second limit. The assembled
attempt took 347.406 seconds with confirmed outer cleanup; its log has SHA-256
`ab63023add36b1f9da8a52f99a88f16ff9abe7ec1559eb63e0cc68f3a18b6c60`.
Unchanged research and hook paths also slowed compared with earlier local
evidence. The research case directly invokes PowerShell and does not use the
new per-command completion protocol, while a small owned-process fixture stayed
near its earlier timing. This suggests host contention rather than establishing
a launcher regression; no contemporaneous resource sample proves the cause.
Deadlines and coverage remain unchanged. Failed diagnostics and retained scratch
are preserved, not converted into reusable success.

Static review also found that Effect Schema diagnostics can quote malformed
runtime metadata and version output. Selection now replaces those errors with
a fixed, cause-free diagnostic; API and captured-CLI regressions cover that
privacy boundary without changing controlled mismatch diagnostics.

The isolated research rerun passed both cases in 114.414 seconds (92.820 and
20.867 seconds inside Bun), still slower than the earlier sample. Its log has
SHA-256 `cb6464197a80ed144eb26ecacc615c32cfadbf623a22d69cbc1edefc3a60f844`.
The scheduler now preserves fixed failure reasons per known batch without
printing arbitrary exception text. This makes a failed phase actionable while
keeping coverage, admission, joining and the original deadlines unchanged.

The fifth focused run passed 61 tests with one POSIX-only skip in 35.510 seconds
and confirmed cleanup. It includes malformed runtime metadata and executable
version-output privacy cases. A small missing-tool guidance update may have
overlapped that run; the subsequent full gate must verify the final bytes.
Its log has SHA-256
`f58955810ee5faf356070df6521a0a1997c06fff9b428af7123607d5bdfa07b1`.

Real installed Mise `2026.10.25 windows-x64 (2026-10-31)` passed an isolated
literal-environment acceptance with Bun 1.4.2 in 2.245 seconds. It verified
added, removed, preserved and empty values, command execution and confirmed
scratch cleanup. Its environment contained synthetic application values and
explicit runtime/system paths; the snapshot was neither logged nor persisted.
The fixture used a project-owned
explicit global configuration, isolated state/config/cache directories, offline
operation and disabled auto-install/cache controls. It did not modify user
configuration, enable hook trust or exercise arbitrary secret-manager plugins.
The log has SHA-256
`30362b871d6aecfa7abf8af7c4647b125aa91af7454ab9e0fbcedb8381b22047`.

The sixth focused run passed all 12 runtime-guidance and scheduler-boundary tests
in 1.939 seconds; its log has SHA-256
`0ea5760dc7fcf17022a63c3fa5ec55d44372b74a0a4f86f8bcc9b111d4d8b674`.
The second assembled step again passed format, types and lint, then failed:
research maintenance reached 120 seconds, and the remaining, workflow and cache
batches reached the shared phase deadline. Its 297.406-second attempt ended
with confirmed cleanup and log SHA-256
`1707331cb7de2b3eacfab3a379538773c6f295c69182fcbf701679d75e07c356`.
A subsequent three-sample host observation found 13–32% CPU usage and roughly
18.3 GiB free memory. This was after the failure, not a resource trace of it.

Review identified an unnecessary durability cost in the new handshake:
`WriteThrough` plus `Flush(true)` forced disk persistence for every command.
The writer now uses ordinary flushing and closes the exclusive file before
returning. A fresh live owner needs visibility, while dead-owner recovery never
trusts this record. Token/status checks, receipt bounds and all ownership checks
remain unchanged. Microsoft's [flush contract](https://learn.microsoft.com/en-us/dotnet/api/system.io.filestream.flush?view=netframework-4.8.1)
and [file options](https://learn.microsoft.com/en-us/dotnet/api/system.io.fileoptions?view=netframework-4.8.1)
distinguish that visibility from forced intermediate-cache persistence. This
removes unnecessary I/O; a causal speedup has not been established. Fixture
coverage, batch order and deadlines were not reduced to accommodate the failure.

After that change, 31 focused cleanup/launcher tests passed with the existing
POSIX-only skip in 34.164 seconds (log SHA-256
`fe3aadf5f1ddf82068f467974d10be87b60f54d24c3ca2e121a10c3bb1bc0bac`).
The third assembled step still failed the same four batches in 316.774 seconds,
with confirmed outer cleanup and log SHA-256
`cf7accd95a3491d255652700a5933092ae3bd9cc37534fcdc82b03de16e5a657`.
Consequently the flush correction does not establish a solution to the combined
run's slowdown. The normal gate remains failed and cannot authorize publication.
Separate diagnostic batches preserve their existing inventory, 120-second test
setting and 240-second batch cap, but do not certify the shared phase deadline.

Browser acceptance passed in 9.978 seconds with Chromium `156.0.8078.4`; its
log has SHA-256
`031df76cee224cdf28e78f1c07d550dde51f245a512f778bffe7c2c7648eb14d`.
Desktop acceptance passed four native Rust tests, the debug application build,
the actual WebView2 workflow (`156.0.4314.58`) and managed shutdown in 30.250
seconds. Its log has SHA-256
`5b7b78b7e636f13a0dd7d6c4aa9a04af7d90ba9e997255ac920aad11f4c348de`.
Both commands confirmed outer descendant cleanup. The prior five browser/native
evidence files were preserved with an exclusive hash manifest under
`.cache/web-evidence/archive/project-launcher-sync-2026-11-02/` before generated
evidence was refreshed. Native builds used the provisioned physical Rust 1.96.0
toolchain with the checked-in lockfile; no tool installation or trust change ran.

The isolated diagnosis retained the exact existing batch inventories and did
not change normal scheduling. Results were:

| Diagnostic | Result | Wall time | Log SHA-256 |
| --- | --- | --- | --- |
| Remaining 69-file batch | 449 completed cases passed, one POSIX skip; batch timed out | 240.817 s | `28c60f5056bd835802892a34b51feef15bc46a3e5bfb9f8f2ba119621973b771` |
| Workflow | 14 completed cases passed; batch timed out | 241.499 s | `3dbb71cded5ae25109dea08da3e5bc54205b9ef791123589903ea8586a550360` |
| Research | 2 passed | 82.185 s | `d978220c4b940cb7e61678ecb68becb30f46b45bb215c009ed97beb8fa656e40` |
| Analysis | 25 passed | 37.561 s | `34c8389b50fedec25c4748f65242268ccb5b98daafda9959b524e93a1896f0a3` |
| Verification cache | 47 passed | 60.036 s | `ffee23f96f509e589b26acff205256d11dbcae1b767f67282a7775ed804134e9` |
| Unfinished remaining files, including the partially run fixture file | 38 passed across 8 files | 9.349 s | `e00b6d2205b9990a48768d3808e07c1cea6377fc0f87d2976ad0c26f27d0f478` |
| Unfinished workflow cases | 2 passed; 14 previously observed cases explicitly filtered | 37.133 s | `25b711d45e3e0337e81b1007109afc6861a147aba0878a73e6c04f64ec383831` |

These overlapping diagnostic counts are not a successful aggregate gate or a
single-run test total. Unfinished cases were tested explicitly, not relabeled
as skipped. The earlier 193.86-second workflow sample contained the same 16
cases, including all four checkpoint-revision cases; the current workflow test
blob matches the task baseline. Added cases do not explain that suite's drift.

A 100-sample host-only measurement of fresh completion allocation, synthetic
record writing, full validation and disposal averaged 8.004 ms (median 7.562 ms,
95th percentile 11.178 ms, maximum 24.841 ms). It excludes native startup and
compiler fingerprints and does not model concurrent storage contention. Its
log has SHA-256
`1b0938ca12337d0cbc6a153e86820b17e13b536262cca12006721e8d32b4f8a8`.
This measurement alone does not justify weakening nested ownership or adding a
borrowed completion scope; neither change was made.

Two diagnostic native comparisons preserved the baseline wrapper/C# originals,
current source hashes, compiled artifacts and per-sample timings. Each used two
excluded warmups per variant, then 20 alternating pairs of the same short Bun
command, serial execution and unchanged per-launch fingerprints. The baseline
was `2e43cfd5b337ba2ff2f0bdafeb8c7a9fca338579`; its only adaptation was an
absolute import of the unchanged shared cache helper. Its original root and
source-key behavior remained intact in a recreated managed fixture layout.

| Writer sample | Baseline mean / median | Current mean / median | Measurements SHA-256 |
| --- | --- | --- | --- |
| Managed file writer | 327.812 / 306.132 ms | 403.674 / 375.720 ms | `437625b219a1d48bf27b66d1b94158bba4a4ce42e97f2ea51ddf95cfb56df503` |
| Direct native writer | 252.827 / 226.276 ms | 250.446 / 233.388 ms | `8626f4c1cecbbafd0a6a72b3d3cdd15e829148bfa450d0b2e2b876dd22c21642` |

The first sample found roughly 23% mean overhead. The producer was then changed
to bounded ASCII JSON, exclusive `CreateFileW(CREATE_NEW)` and synchronous
`WriteFile`, with an exact byte-count check and checked `CloseHandle` before
return. Any create, partial-write or close failure remains status 253 and cannot
confirm cleanup. The [native file contract](https://learn.microsoft.com/en-us/windows/win32/api/fileapi/nf-fileapi-createfilew)
and [synchronous write contract](https://learn.microsoft.com/en-us/windows/win32/api/fileapi/nf-fileapi-writefile)
support the preserved visibility and no-overwrite boundaries. A producer collision
regression preserves an existing sentinel and independently verifies fixture
shutdown; the project-isolation fixture also uses a spaced Unicode target path.

The second paired sample had no mean regression, but baseline timings also
changed materially between runs. These small cooperative-command samples do
not establish an end-to-end speedup or equivalent failure safety for the old
implementation. Both completed all 44 warmup/measured launches and disposed only
their verified managed scratch. Manifests and originals remain under ignored
comparison directories `d00d4736-7d53-43a4-adc4-842a59c5385a` and
`c83ab112-9255-4a3d-a454-22f35135a6fa` with the common prefix
`.cache/verification/project-launcher-2026-11-02-owned-comparison-`.
Their manifest hashes are respectively
`45110dcb2b47de6641d4041f702171b7664018c781dc6b893d43bff3b902878d`
and `15d7eedf2b9a3c3b2a12b882adb1fcf0a814f38b0d1741e8964e37ee1ee8940a`.
Real Mise acceptance also passed again on the pre-native-writer version in
3.119 seconds with the same redacted log hash as its first run.

The final native-writer focused run passed 32 cases with one POSIX-only skip in
23.309 seconds, including the producer collision and spaced Unicode project
path. Its log has SHA-256
`d5a75d42051eb58215fa0825da8177b73451bbaf2cff3216bad342e8f0a3c7eb`.
The fourth assembled step passed format, all four type programs and lint, but
still failed three batches at the shared deadline: remaining, workflow and
verification-cache. Research passed in this attempt. Its total wall time was
321.573 seconds, with confirmed cleanup and log SHA-256
`b17364992687092cc18282018d0794ef6f465650ebea9f147d4041ab84f087eb`.
The normal repository gate therefore remains incomplete; successful focused
diagnostics do not authorize publication.

Final acceptance on that writer passed again: browser in 9.827 seconds (log
SHA-256 `c05abe3999878091d7ad4fd1b59a1a29c389ccf7f400bb93f99adee9a28c817f`),
desktop including native tests/build/WebView2 shutdown in 23.102 seconds (log
SHA-256 `f416cf90fbf29e61ac61c0fbf9cde98cbc5d966bcf561aa2e3aa217260c7e2db`),
and real Mise in 1.705 seconds with the same redacted log hash as its first run.
Each confirmed outer cleanup. The first task acceptance's five evidence files
were also preserved under the archive suffix `project-launcher-sync-2026-11-02-web-1`
before this final refresh.

Required review completed in 286.295 seconds with exit 1 and confirmed outer
cleanup. It reused validated format, type and lint results, then the remaining,
verification-cache and workflow batches exceeded the unchanged unit-phase
deadline. Its retained log has SHA-256
`1c22e5a5d52da1291fc08ed246022c12fc53ea922566071aaee89bf7459a7bb1`.
Successful focused/platform checks do not turn this into a passing repository
gate. The task records the implemented changes and this unresolved verification
limit; final readiness, commit and push were not attempted. The original baseline
and failed diagnostics remain available for follow-up, without deadline changes,
skipped coverage, evidence pruning or lock reclamation.

This source comparison does not claim hook activation, a memory benchmark or an
end-to-end performance improvement. Later verification and any publication
outcome belong in separate workflow receipts; the frozen task record must remain
unchanged.
Required regression coverage includes independent project pins and native
caches, foreign overrides, malformed boundaries, exact argument/stream/exit
behavior, environment removals and privacy, cancellation and retained scratch
when shutdown cannot be confirmed. Final test outcomes belong here before
checkpoint freeze; later verification and publication outcomes belong in the
workflow receipts.

## Stop-hook repair continuation

The subsequent native Stop hook was observed invoking review and preserving the
frozen archive. Its review failed the remaining, workflow and verification-cache
batches at the shared deadline, with confirmed outer cleanup; log SHA-256
`4a55032fba15e16c2eb0f873976359162c8e46af86cb9c66152fa0ff36e21f3b`.
This establishes observed execution, without changing product trust settings.
The archive hook explicitly declined to append to the frozen record.

The repair preserves all sixteen workflow case bodies and assertions, split
between eleven ordinary cases and five recovery/revision cases. Stateless
helpers allocate independent managed fixtures. Additional audited import,
pre-commit and owned-launcher groups remove long sequential paths from the
remaining batch. Unknown suites remain together, every file is scheduled once,
and live admission, three-worker maximum, 120-second test setting and shared
240-second phase deadline remain unchanged.

Workflow signing configuration now uses one bounded NUL-framed Git query with
required-key validation and last-value precedence. Preparation retains its
fresh signing read after remote inspection, removing only the earlier duplicate.
Pre-commit seeds its temporary index from its already validated staged tree and
still rereads the active index for drift. Signature status and fingerprint use
one framed response for the same commit; independent cryptographic verification
and all before/after-commit trust checks remain live. No native fingerprint or
ownership check was removed.

An initial focused launch failed before tests because the hook deadline had
left a native-cache lock owned by PID 2872. Process inspection confirmed that
owner absent and no surviving Teamagent supervisor, alongside the hook's closed
Job Object receipt. Explicit recovery preserved the exact lock (SHA-256
`5b1e48e86ab49b8d3f03246f98f959c1d20ac589a9f15906d7fac67665258c6b`)
and inspection receipt, rechecked the owner and exact bytes, and removed only
that abandoned lock. No automatic reclamation or evidence pruning was added.
Evidence remains in
`.cache/verification/project-launcher-2026-11-02-repair-lock-1/`.

The next focused run passed all fifteen workflow-query and scheduler tests in
1.625 seconds, with confirmed cleanup and log SHA-256
`9b0e3c02b0933680454b92b07b25772e973cee9d439d2e92b2a760fc9594fac3`.
This is focused evidence, not a complete repository gate or a controlled speed
comparison. The original failed runs, baseline and frozen public archive remain
unchanged; repaired scope and later outcomes require separate workflow receipts.

That first repaired full step still failed at the shared deadline (293.588
seconds overall, confirmed cleanup, log SHA-256
`66e89c6ba2e031b511f264165565c398b02e07cb3094a89db6e03b35c2448f4f`).
The remaining group passed 418 tests in 120.63 seconds, the two workflow groups
passed eleven and five cases in 175.94 and 168.77 seconds, and import surfaces
passed 32 cases in 69.38 seconds. Batch times overlap. Research began too late
to finish, while cache, pre-commit and the final groups exhausted the remaining
budget. Completed reported test times already consumed about 702 worker-seconds
of the 720 available; reordering alone could not address the unfinished work.

Further repairs batch working-tree cache inspection from four Git processes to
two without caching observations or changing working-byte projections. Strict
bounded tags retain tracked, untracked, ignored-but-tracked, assumed-unchanged
and skip-worktree inputs, including SHA-256 repositories. Eight new inventory
regressions plus ten scheduler tests passed in 5.845 seconds with confirmed
cleanup (log SHA-256
`ee2d783475e73a7c374c4b6b4855bd7451e444d28413ed0b244f9a876be94c0c`).

Workflow observations additionally batch upstream configuration and join
independent fresh reads with at most two active and eight outstanding Git reads
per observation boundary. All live scope, tree, trust and signature checks
remain; mutation sequences do not overlap. Failure diagnostic writes are
serialized per adapter. Private fixture templates now include verified remote
settings, eliminating twelve setup commands across the workflow cases, and
independent bare/working initialization uses distinct templates and a joined
pair. Research starts alongside the first workflow group instead of waiting
behind both. These are structural reductions; end-to-end results must still be
measured by the unchanged full gate.

The eleven expanded workflow-query regressions passed in 6.470 seconds (log
SHA-256 `cca908be021c12f91a14aeb08049e41027869a67d42fe98c2bd860a19326b245`).
A subsequent step found TS7022 in a test counter; an explicit `number`
annotation corrected the inference error without changing its assertion.
The failed type-check attempt remains recorded with log SHA-256
`008840fdc4cd5bccc129338a53ebc9f06ea7e0f34564c1fa5467eb8aea153bb6`.

The next full step again passed formatting, types and lint but failed unit
verification (295.685 seconds overall, confirmed cleanup, log SHA-256
`6e00dcbf906045cc21aff3289e68b73a69cbfb9f1acae7c9f5c316c86548ed33`).
The main workflow batch completed in 128.37 seconds versus 175.94 in the earlier
repair attempt. These changed-source runs are not a controlled benchmark.
Research's first subprocess reached its existing 120-second limit; late
workflow-revision, cache and pre-commit work remained incomplete, and two groups
never started. Completed reported cases consumed about 708 worker-seconds;
passing subsets still do not constitute a complete successful gate.

Research checkout inspection now obtains full HEAD and shallow status in one
strictly LF-framed response, reducing each fresh observation from four Git
processes to three. Every original mutation-boundary observation remains.
Thirteen malformed and four valid parser cases require no extra subprocesses;
four validated fixture identity writes remove eight setup launches. The focused
research run passed both tests in 96.382 seconds, with its longer subprocess
finishing in 78.003 seconds. Cleanup was confirmed; log SHA-256 is
`c12c3ccfef98c1dedf07d08b9cf23eb56d75813df079ebaa06cb2b87359abf78`.

A native-cache diagnostic compared three independent Bun workers sharing one
prepared project cache with three workers using private prepared caches. Each
worker made twelve complete warm identity calls; compilation and an initial
warm call were excluded, with a common start barrier. The observed adapter
delegated the unchanged lock and preserved the full input/artifact checks.

| Cache topology | Round wall time | Cumulative lock acquisition time | Cumulative lock hold time |
| --- | ---: | ---: | ---: |
| Shared | 1,363.257 ms | 2,108.794 ms | 768.384 ms |
| Private | 686.031 ms | 90.527 ms | 872.795 ms |

Acquisition includes lock setup and waiting; hold includes release. No retry
count was inferred. The fixed-order, one-round sample measures warm identity
contention, not whole-command or whole-suite speedup. Source originals,
adaptations, runtime identity, compiled artifacts and all samples are retained
under the diagnostic suffix `bd521087-d2da-4df4-b2fe-4adc91961661` in
`.cache/verification/project-launcher-2026-11-02-native-contention-*`.
The measurement SHA-256 is
`2eec0acf9be9f5b69317bd766150111fdca901109aa8ab0eaa131dd2e4e294c7`;
the successful outer log hash is
`bfe734b6da4b90b95fea2b707ff3ad7fcc85cedf37f94f89f77b98c9357a6000`.
An earlier diagnostic failed during warm-up before collecting measurements;
its evidence and confirmed cleanup remain preserved separately. The successful
run used a short, directly owned fixture root and disposed it only after every
worker's shutdown was confirmed.

An initial workflow fixture optimization shared a worker-local immutable unsigned
seed and disposable key source. Each case received private key/trust copies and
independent bare/working clones, with hard links, symbolic object links and
alternates rejected. Exact per-case Git settings remain asserted, and all real
workflow verification/signing/publication cases remain unchanged. This removes
forty setup process starts across twelve fixtures in two workers;
it is not a measured whole-suite speedup. Prepared workflow state and successful
verification evidence are never copied into a case.

The native warm-read repair retains all six source/compiler/reference digests,
joins their bounded streaming reads, rechecks their complete identity and repeats
binary/path inspection. Complete artifacts avoid the publication lock; absent
or invalid artifacts retain locked reinspection/publication without repair
permission. Retained lock bytes are not removed or adopted.

With the same three-worker/twelve-call protocol, the repaired shared-cache round
took 287.887 ms and the private-cache round 322.539 ms, with zero warm lock calls
in both. Inputs, source adaptations and original compiled binaries remain under
diagnostic suffix `896fc9b3-799c-4fad-8c94-f2247258c98d`. Measurements SHA-256:
`a530a6abfd22cff2074156d4faeb9d88fabed639746323dd518c80ae6bb7118a`;
outer log SHA-256:
`278e94ed107f34c33f02a30e326d23326b0db713f943173eea27c7d668fdfff8`.
These warm identity samples are not whole-suite or machine-cold timings.

The combined focused run passed 59 cases and skipped the existing POSIX-only
case, but three real signing cases failed after private key copying (log
SHA-256 `07b867540e1d2b0ce04278c0428eb5a089a13f3509582e54760a71fd699e21b8`).
A bounded fixture diagnostic confirmed OpenSSH rejected inherited permissions
on a copied private key; its isolated reproduction has log SHA-256
`c1c19df1e94b0d293bbf2f790f495446d597a38de353c72e7f7d1c636de3a8bf`.
The revised fixture shares only the immutable unsigned repository seed and
restores native key generation independently for each case. It applies no ACL
workaround and copies no private key. This retains thirty fewer setup process
starts than the original fixture while preserving distinct private keys/trust
and every real publication assertion. New verification must establish success;
the failed copy-based attempt is not counted as a pass.

The corrected private-key fixture passed all three real publication cases in
74.264 seconds with confirmed cleanup (log SHA-256
`db0d44e5baf209a4d9d8a88475bd74041db85b2e3ca2bcfae7646c00565e2133`).
A subsequent type check found tuple inference in a native stream fixture; a
literal tuple annotation fixed it, and strict types passed in 3.075 seconds
(log SHA-256
`7ebe2341cfbaf6f69832c32a25c5f87dd526d39dbda6dd7957e282106be337dd`).

The last full attempt under the 240-second unit budget passed formatting,
types and lint, and completed the main workflow, remaining, research, imports,
cache and revision batches without assertion failures. Those completed batches
alone used approximately 658 of the available 720 worker-seconds. Owned-launcher,
pre-commit and analysis batches remained unfinished at the shared deadline.
The failed step took 290.725 seconds overall with confirmed cleanup; log SHA-256
`8f91ebdf5bf7161d6d66f45bfc7a3763cec3fc019c74d996ece97da5829e5256`.
No partial result was promoted to successful unit evidence.

On 2026-11-02 the user explicitly approved raising only the shared unit phase
from 240 to 360 seconds. Individual test limits remain 120 seconds, active
workers remain capped at three, and coverage and resource admission are
unchanged. The independently bounded assembled hooks and workflow operations
retain their prior limits; a cold run is not guaranteed to fit them. Complete
step evidence may be reused only under the existing exact-input contract.
The first invocation after this change stopped before launching Aube because
the diagnostic runner requires a physical executable path. Its exclusive
pending record remains retained; this is not a test result.

After the native warm-cache repair, browser acceptance passed in 9.667 seconds
with Chromium 156.0.8078.4 (log SHA-256
`f1d271f1d6304e133853b44fadaf9ad9bf67901f229440a880ac4f9f69315c08`).
Desktop acceptance passed four Rust tests, the locked native build and actual
WebView2 workflow/shutdown in 25.103 seconds with WebView2 156.0.4314.58
(log SHA-256
`313153bffa7a7a47370e458f08c95f1b9e37d24330f425a002a5decfa561fc62`).
Real Mise 2026.10.25 acceptance passed added, removed and empty environment
values in 1.621 seconds without persisting those values (log SHA-256
`30362b871d6aecfa7abf8af7c4647b125aa91af7454ab9e0fbcedb8381b22047`).
All three used Bun 1.4.2 and confirmed owned-process cleanup. Prior browser
evidence remains in the exclusive `project-launcher-sync-2026-11-02-web-2`
archive with verified original hashes.

The first complete run with the approved 360-second unit phase reached every
batch and confirmed cleanup, but remained failed verification. Research
maintenance reached its unchanged 120-second subprocess limit. Two document
reconciliation cases reported a changed expected pin and an atomic-rename
permission error. The other batches passed, including all 38 owned-launcher
cases (37 passed and the existing POSIX-only case skipped), seven pre-commit
cases and 25 analysis cases. Overall duration was 414.314 seconds; log SHA-256
`15bf46ee32629c29f8a20355c9acfff346f6ffb96a0979f1287cff6f8cfc53f1`.
These failures are retained rather than relabeled as cache hits or evidence of
successful verification.

## Source advance during repair

A final committed-object inspection found four newer source commits through
[`fd399cca7dd90f3f3f8601233986a6e5ad81b578`](https://github.com/iki/trigon/commit/fd399cca7dd90f3f3f8601233986a6e5ad81b578).
This is the final inspected source boundary for this task, extending the initial
`05bd7260` comparison without replacing its historical observations.

The POSIX shutdown change at that final pin contributes a shared, once-only
terminate-and-join operation. Teamagent already waited for process-group
disappearance; the adaptation prevents repeated stop/exit/close paths from
signaling a later reused group identifier, including after an initial `ESRCH`.
Signal, observation or wait failures retain an unconfirmed result and scratch.
The existing five-second group deadline and six-second transport fallback
remain. Portable lifecycle fixtures cover these outcomes; Windows execution
does not establish actual POSIX runtime acceptance.

[`635876a6f0495adce88b43eddba93af2dcaa8bd2`](https://github.com/iki/trigon/commit/635876a6f0495adce88b43eddba93af2dcaa8bd2)
also contributes test lifecycle discipline: join output before assertions and
do not await nonexistent POSIX failed-spawn pipe completion. The explicit
permission-error assertion and real platform cases remain.

[`d9c723502d955f69dc46989d94fb3dbb8a2e6acb`](https://github.com/iki/trigon/commit/d9c723502d955f69dc46989d94fb3dbb8a2e6acb)
contributes the GitHub Actions verification policy: execute verification rather
than accepting submitted cooperative passed receipts. Tracked/local routing,
failed-key rejection, local reuse and integrity-validated build reuse retain
their separate contracts. Only isolated test workers remove the outer Actions
flag so private fixtures can test both policies; the parent runner retains it.
Source-specific layered workflow caches, producers and security jobs are not
copied into a repository without corresponding GitHub workflow definitions.

The typed input-group and test-cohort DAG introduced by
[`ee43acf5b638c09238287f6eb3ef81f60a8545af`](https://github.com/iki/trigon/commit/ee43acf5b638c09238287f6eb3ef81f60a8545af) is a separate
architecture candidate, not a safe direct port of another product's dependency
groups. Teamagent retains its four current verification groups. A future audit
must account for shared fixtures, the complete check helper closure, consumed
Python tools and memory skill, runtime-read documents/assets, spawned scripts,
installed/native prerequisites and meaningful environment. Proof cohorts must
remain independent of resource-dependent execution batches; unknown suites
need a broad fallback. Input fingerprints and passed receipts remain distinct,
and no narrow result may be inferred from an older broad result.

That adoption additionally requires transitive-input and unknown-suite
regressions, input additions/removals/renames/modes, definition changes, staged
catalog agreement, mid-run mutation, failure history and exact test multiset
coverage at one, two and three workers. It must preserve full raw working-byte
hashes for ignored-but-tracked, assume-unchanged, skip-worktree and filtered
files. The source's index/status shortcut for clean files and deferred browser
readiness do not meet those existing Teamagent boundaries.

The newer range adds no further project-launcher/Mise, temporary-workspace,
fingerprint memory-bound, hook or public conversation-ingestion implementation
changes. Conversation changes in that range concern release metadata. The
observed native Stop invocation and explicit frozen-archive skip remain the
evidence for hook execution in this task; no trust setting was changed.

The document-state failure exposed a pre-existing serialization inconsistency:
failed captures returned raw record property order while saved state used
Effect Schema's declared field order. Reconciliation hashes the full record,
so the two representations could disagree. Text sync now validates every final
per-source record before storing it, returning it or publishing progress. A
deterministic injected export failure verifies matching saved/returned bytes
and hashes, retained source identity, explicit offline recovery and exact retry.
The exact expected-pin guard remains unchanged. Ordinary reconciliation
fixtures now reject an initial export failure at setup instead of proceeding
with misleading pin evidence.

The second document failure occurred during native directory publication
(`rename: EPERM`), before the inventory assertion. The retained log does not
identify the external handle or permission cause. No whole-test retry, source
recapture, destination replacement, permission relaxation or dependency patch
was introduced to hide that outcome. The research diagnostic
`source_list_publication_failed` also occurs in an intentional negative fixture;
it is not evidence of the subprocess timeout's cause.

The latest cleanup/CI-policy focused run passed 71 tests with the existing
POSIX-only skip in 196.461 seconds, with confirmed cleanup (log SHA-256
`54d30a7e95ea0be599550892eb73fc65bdbc5366ae237f2f1fda047f5366a30c`).
Research maintenance completed in 87.871 seconds and identity reconciliation in
21.638 seconds. The Actions policy regression completed in 9.751 seconds.
These are focused results, not a complete successful gate.

The first focused document run passed the new deterministic record-order
regression but failed three ordinary cases during initial export setup. It
finished in 4.190 seconds with confirmed cleanup; log SHA-256
`587a31620477740b5bd752ff690d8e0e3f0dea0f4db5b884583e0bdddbaee7bb`.
The queued full step did not run after that failure.

A bounded private directory-publication probe on Bun 1.4.2/Windows made 24
independent publications. Three first attempts returned `EPERM`; each same
source/destination pair succeeded on its second attempt after a ten-millisecond
delay, taking approximately 12.1–13.0 milliseconds in total. Every attempt
rechecked physical paths, source/parent identity, destination absence and the
prepared manifest hash. All 24 completed and the owned workspace was disposed.
This establishes transient rename failure in this environment without identifying
the external cause or claiming a general performance result. The first human
summary missed rows in PowerShell's mixed table display; the explicit JSON
inspection corrected that summary. The original machine evidence is unchanged:
probe SHA-256 `88b9c1258b007a6d51c31ef409b5c2c71767debbf72cc625d4a99eb9ee842172`,
outer log SHA-256 `c7f9f2cd5e32401e0df182f82d090d6e1717fa707ef8c33583a1576a1f086a74`,
under `.cache/verification/project-launcher-2026-11-02-memory-rename-probe*`.

Research process completion now wakes when its joined native tasks complete
instead of always waiting for the remainder of the existing 20-millisecond
poll. Fault/deadline checks and final stream/process joining remain. Two fixture
ref pairs use one fresh, strictly framed observation each, preserving all original
identity, upstream and configuration assertions. The potential gain is limited
to trailing poll delay and two avoided Git launches; whole-suite improvement is
not inferred. Fresh checkout observations across mutations remain unchanged.

The first research run after that optimization failed at its new ref-pair
fixture, before completion (65.045 seconds overall, confirmed cleanup, log
SHA-256 `9c90fbf2766a550c76d0602758934d6b633c5226dd538669214f285da4a83ff9`).
The installed Git prints a literal `--end-of-options` line for an ordinary
multi-ref `rev-parse`; the strict two-ID parser correctly rejected it. Selecting
`--revs-only` removes option output without relaxing framing or identity checks.
That protocol correction requires verification before the run can count as a pass.

The export repair retains one prepared source/version in an Effect-owned
resource. On Windows only, `EPERM`/`EBUSY` from the final rename permits six
attempts with cancellable waits of 10, 20, 40, 80 and 160 milliseconds. Each
attempt validates the original physical parent/staging identities, the exact
file inventory and streamed hashes, and destination absence including dangling
links. The destination is verified again after publication. Neither acquisition
nor conversion is retried. A persistent native failure remains a typed error;
identity/content drift retains uncertain staging instead of deleting it.

Because a retry holds prepared staging across an asynchronous wait, each store
now admits at most two active exports. Extra calls fail with typed capacity
before allocating staging; there is no queue. Nested resource finalizers release
the slot only after cleanup joins, including acquisition failure, cancellation
and cleanup failure. Seven new regression cases cover these limits, exact-byte
reuse, persistent/non-retryable errors, collisions, replacement/content drift,
typed cleanup errors and cancellation. The trusted host-only rename port is
not loaded from external source configuration. No dependency or runtime patch
was introduced. Portable rename still does not reserve the destination against
concurrent external writers; this repair does not claim an OS no-replace primitive.

The first combined memory/research check passed 55 cases, including all seven
new export behaviors, the corrected ref-pair queries, all document cases and
Git identity reconciliation. It failed one remaining research fixture: an
unbounded `Move-Item` setup operation could not rename a newly cloned checkout.
The run took 96.741 seconds overall with confirmed cleanup; log SHA-256
`7d4ccc1b66d50209000dd90b9203f883933a82726166576e714c6ccace3a592c`.
The two setup renames now use the already fixture-tested bounded native
directory mover, with the same physical cache root, validated same-parent
paths, destination checks and explicit success assertions. The Bash reuse and
ambiguity tests themselves remain intact. No complete step ran after this
focused failure.

The November 4 step passed format but stopped at strict TypeScript before unit
execution (101.960 seconds, confirmed cleanup, log SHA-256
`e559c88fb1fb00735fafb63018b70af17aa5cfcdc3851b833d7797d8618825f3`).
The export inventory lookup now produces a definite set or its existing typed
integrity failure, and the fixture starts with a concrete empty buffer before
capturing its first prepared manifest. Exact byte comparisons, failure behavior
and all assertions remain. The queued review did not start after this failed step.

All four TypeScript projects then passed in 3.521 seconds (log SHA-256
`7ebe2341cfbaf6f69832c32a25c5f87dd526d39dbda6dd7957e282106be337dd`).
The next full step passed format, types, lint and module layout, but failed
after 418.594 seconds with confirmed shutdown (log SHA-256
`339d1db7dd7ab772c4fbaeae2d96f23e7b3deda610c5a133e676c2d5337c1ee8`).
It discovered 76 files. All 440 cases in the remaining group passed, including
the repaired memory cases. Cache, both workflow groups, imports, pre-commit
and launchers passed; the POSIX runtime case retained its Windows skip.
Research maintenance timed out near its final Bash cases at its own 120-second
limit, and analysis finished 23 of 25 cases before the shared 360-second limit.
A single host sample during the run showed 16 available CPUs, about 22.7 GB
free memory and 44% busy CPU over one second. It is neither a measurement of
unit admission nor evidence of the cause of the timeout.

The three-worker queue now admits research with a small HTTP and memory CLI/MCP
group before the busiest Git fixtures. Document imports remain an independent
tail group. Unknown files retain discovery order and two- and one-worker paths
retain their existing grouping. Replaying the prior timings estimates 353.82
and 351.61 seconds for the last two inventories using the prior 74.14-second
complete analysis observation; neither estimate is a fresh execution result.

The cache tests create one unsigned worker-local seed and 28 private clones
with copied Git objects, no alternates, remote or upstream. A real staged
commit in a clone must leave the seed's refs, index and working files unchanged.
Fixture setup now uses 59 Git starts instead of 84. A repeated status read
also became a single observation with both assertions retained. The research
fixture's last three malformed dotenv cases share one Git Bash driver; each
loader still runs in an isolated subshell, against its own exact input, and
must return both exit code 2 and the case-specific dotenv error. A focused
real-Bash run passed all five assertions. Neither change skips a case or
increases concurrency or time limits.

The focused cache and scheduler run passed all 58 tests in 98.564 seconds
with confirmed shutdown (log SHA-256
`bec76518ea3a6eae236c47011d8ccca0d2f20226ec60ba4e5315457827b9b43f`).

Research Git still resolves a real application for every command. Using
PowerShell's application-only lookup directly avoids the pipeline on success;
the original missing-command path preserves its diagnostic. An alternating
12-pair lookup probe measured medians of 0.559 ms and 12.867 ms respectively,
excluding Git execution. A real function smoke test confirmed the selected
executable follows both tested PATH orderings and a missing Git still fails.
Adjacent HEAD/stash pairs around three injected failures now use the strict
two-ref helper, avoiding four starts without reusing state across mutations.

Previously the maintenance case left each generated repository under
`.cache/research`; the first count found 137 directories and a later count
found 139 after focused fixture probes. All historical data was left intact.
New research maintenance and identity checkouts belong to the
process supervisor's marked scratch. Both real test cases keep the 120-second
process bound and 125-second test bound; uncertain shutdown retains the command
directory instead of treating a direct child exit as proof of cleanup.

The following complete attempt began on November 4 at 13:15:14 UTC. Format,
types and lint passed; unit output then stopped before any of the three initial
batches completed. The environment resumed on November 5 and the outer runner
reported timeout with confirmed shutdown after 65,560.912 elapsed seconds
(log SHA-256 `01224ff27e64618631134024a63c25e61aa4d0ac31b0bd99d64d4997874d25b2`).
This interrupted observation is retained as incomplete verification, not a
unit timing benchmark or a passing result. No new limit was introduced.

The November 5 rerun completed all ten batches within the shared unit phase:
609 tests passed, two failed and one retained its Windows skip across all
76 files. The complete step took 432.762 seconds, with confirmed shutdown;
log SHA-256 `ac4b5845a6663f543022bf89219d42794f3289549dd1816c5641f42ea40143b1`.
No group hit the shared deadline. Research maintenance failed after 81.025
seconds while creating a recovery branch; identity reconciliation passed in
23.153 seconds and removed its command scratch. The other failure was immediate
launcher cancellation returning unconfirmed shutdown. It remained a failure
rather than being treated as successful cleanup. All other suites, including
analysis and cache, completed successfully. Review was not started.

A paired real-Git probe reproduced the recovery failure under the actual
isolated unit environment: the nested recovery ref was 257 characters and its
lock was 262, causing exit 128 with a filename-too-long error. Direct owned
command scratch reduced those lengths to 211 and 216, and the same operation
succeeded. Both commands confirmed shutdown. The first probe inherited a
machine-wide long-path setting and passed both layouts; that observation is
retained separately rather than confused with the isolated result.

Research fixtures now validate inherited routing before removing only the
three temporary-parent routing fields from a copied environment. The command
owns its direct marked lease, and both existing cases require the fixture and
command directory to disappear after confirmed closure. A forced worker exit
may retain that independent lease for explicit recovery. No Git setting,
ownership check, fixture case or deadline was relaxed.

Review found a startup race consistent with the cancellation failure: the
helper previously attempted to open the event once, then the caller
could force termination after a short unsuccessful wait. The helper now holds
a stable process handle and waits for event creation or supervisor exit.
The existing five-second helper, six-second transport fallback, native job
drain bound and completion-record validation remain in force. A deterministic
native fixture delays event creation until the stop helper observes the missing
event. The immediate-cancellation fixture uses its own marked parent so a
failure cannot trigger eager fixture cleanup before shutdown is established.
The original failing fixture drained stderr and unconditionally removed its
root, so its native failure record was not recoverable. The deterministic
regression establishes the race independently; it does not reconstruct that
lost diagnostic.

The latest complete durations put workflow at 161.65 seconds and revisions at
149.79, so the queue now starts workflow first when their slots open. With all
other step timings fixed, modeling research at 125–135 seconds estimates
348.21–354.85 seconds for the unit phase. That excludes dispatch and cleanup
overhead and is not a measured pass; research at 145 seconds would still exceed
the limit in this model. The real full gate remains required.

The repaired research pair passed in 97.030 seconds with confirmed shutdown:
maintenance took 78.099 seconds and identity reconciliation 18.456. Both cases
verified their direct command directory and checkout were removed. Log SHA-256
is `33ccf27c7694b2b2a884d1d3b74d53a3392d6e5f2a5b8e8c835fd515c9cc45f2`.

Both focused native cancellation cases passed in 1.61 seconds with confirmed
outer shutdown. The forced missing-event regression took 871 ms; immediate
launcher cancellation took 520 ms. Log SHA-256 is
`b9e7962da30f8fd3d1fb29ec7bc1dd5f542387ca707479dec2e3c601f05cb1fd`.
A separate read-only review found no deadline, coverage or cleanup-provenance
regression. The complete gate is still required after these focused passes.

The following step passed format but caught a strict tuple-typing error in the
new cancellation fixture before unit execution. Its two stream promises now
retain their tuple type so the captured stderr is definite; no runtime
assertion changed. The failed step took 45.500 seconds with confirmed shutdown
(log SHA-256 `bba983e6d6e78ae1cf37c12b4d8c17b307466c149aa104f665e1bb8e39059271`).

## Final repair verification — 2026-11-05

The complete step passed in 455.979 seconds, including initial and final
prerequisite checks and live integrity inspection. All 76 test files ran:
612 cases passed, none failed, and the existing POSIX-only runtime case was
skipped on Windows. All groups completed within the approved 360-second unit
phase. Research passed in 115.46 seconds, with the new cancellation regression
included in the passing 43-case launcher group. No test limit or coverage was
removed. Log SHA-256:
`ffca1c0d57253ade857c762a115c4745c482b4eb514b82b90748537105eb369d`.

The explicitly requested `aube run --no-install review:check` then passed in
91.331 seconds with confirmed shutdown. It validated matching cooperative
receipts and reran live integrity checks: 23,297 text files, 3,359 opaque inputs
(28 hash-verified historical inputs), 3,082 retained originals, no missing or
linked inputs, and all 90 text exports / 1,088 export files. Log SHA-256:
`b1c49cab6e7f092c3cfa518822b4302e21a4123e69184434dd508db4cf688cf9`.

Fresh platform acceptance also passed with confirmed shutdown. The browser
workflow took 10.653 seconds on Chromium 156.0.8078.4 (log SHA-256
`594e96366cb1cf1144fd5d85463f253b4cfd960686b7068be3629b6df366d798`).
Desktop acceptance took 58.582 seconds, covering four native tests, a locked
native build, the real WebView2 workflow and managed shutdown on version
156.0.4314.58 (log SHA-256
`329515ead7e0fe74613b3a460149ae5a655c4770c84c7705811147e4f1990104`).
Real Mise 2026.10.25 acceptance took 2.044 seconds and verified literal
configuration, empty values, removals and cleanup on Bun 1.4.2, without
persisting environment values (log SHA-256
`30362b871d6aecfa7abf8af7c4647b125aa91af7454ab9e0fbcedb8381b22047`).
Five preceding platform artifacts were copied with verified hashes to the
existing evidence archive before refresh.

The final scope audit found exactly 52 changed owned files and no unrelated
changes. The original baseline and frozen conversation bytes remain unchanged.
Checkpoint revision, final workflow proof and publication outcomes are recorded
separately by the workflow, without rewriting that public record.
