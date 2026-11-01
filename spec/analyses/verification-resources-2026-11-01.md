# Verification resource and hook update — 2026-11-01

## Source and scope

The comparison starts at previously reviewed source revision
`cdfb49aa5a3a6e227afae93014e9224ed159b77f` and ends at
[`c4b01c1fa1dba94b355bbf8e52d3a72c2f39d216`](https://github.com/iki/trigon/commit/c4b01c1fa1dba94b355bbf8e52d3a72c2f39d216).
On 2026-11-01 the sibling checkout HEAD and live remote `refs/heads/main`
matched that ending revision. Unrelated staged source assets under banner,
cover and logo directories were preserved; they were not imported or evidence
of a clean source checkout. Teamagent began this task at
`b7bd1a77cf40cf96a1de7a6d2d95650a664e5652` with a clean working tree.

The relevant source change is
`d54047f7ba41762d705e64011bd09782417d31c9`, bounding verification memory and
cleaning owned resources. The later revision makes shared preview-server state
explicitly owned. Earlier intervening commits concern product logging,
operator monitoring, Telegram setup and OAuth lifetimes. Those product
features have no corresponding active Teamagent integration in this task.

These are adaptations to Teamagent's existing verification, publication and
public-conversation contracts, not dependency patches. No package pins,
lifecycle trust, supplied patch bytes or native dependency locks changed.

## Adopted changes

| Area | Teamagent adaptation and verification boundary |
| --- | --- |
| Fingerprints | Stream full file hashes with bounded readers, byte-compatible inventory hashing, before/open/after identity checks and bounded directory enumeration. Keep the already-streamed installed-input implementation. |
| Unit memory | Resample the smaller host/process memory estimate before each batch; admit no new batch below 1 GiB. Join running work and explicitly fail unrun coverage. Preserve existing concurrency cap and deadlines. |
| Process lifetime | Share an owned-process adapter among workflow commands, check tools and unit batches. Windows attaches children to a Job Object before execution; POSIX has a separately stated process-group contract. |
| Temporary files | Fresh marked `.tmp` scopes, validated borrowing, bounded cleanup after confirmed shutdown, and explicit old-dead-owner recovery. Preserve evidence, locks, source checkouts and unrelated temporary files. |
| Test fixtures | Managed async/synchronous fixture helpers, preload cleanup and parsed lint coverage for direct, aliased, namespace, destructured and re-exported native temporary allocation. Standalone browser/native tests own their scopes explicitly. |
| Cache reuse | Validate temporary routing before prerequisite reuse; omit only its three validated routing fields from keys. Keep complete input identity, live LF/export checks, force-fresh rejection history and staged validation. |
| Hooks | Pinned physical tool selection, explicit Windows exit propagation and Git-hook rejection of missing/invalid local runtime configuration. New Windows diagnostic receipts name Job Object cleanup while historical receipt values remain readable. |
| Public records | Enforce native transcript source, line and selected-public-text limits during streaming; reject invalid UTF-8 and preserve original bytes. Existing public-only selection and frozen-record rules remain. |
| Acceptance | Keep browser/native behavior assertions. Desktop additionally checks that graceful daemon shutdown releases its database ownership row, so forced supervisor cleanup cannot hide a lifetime regression. |

The source transcript/archive implementation itself did not change since the
previous review. Streaming transcript limits apply its bounded-output principle
to Teamagent's existing reader; they are not a copied transcript patch.
The shared preview server is absent here, so no Portless runtime or service
configuration was introduced. Its ownership principle is represented by the
resource contract rather than an unused service abstraction.

## Source identities

Paths below are relative to the inspected source repository at the ending pin.
Git blob identities allow review without depending on its mutable worktree.

| Source | Git blob |
| --- | --- |
| `app/trigon-check/cache-fingerprint.ts` | `e5e03a90eae2a973aa1199631ee2e9cc41d07c6d` |
| `app/trigon-check/test-groups.ts` | `a5e20b4da802e7873ab0741f000e4b1897c75f55` |
| `app/trigon-check/temporary-workspace.ts` | `360a22bef9642c381d6097558465d044ceada886` |
| `app/trigon-check/owned-process.ts` | `e21d01592309f90dfabacd111608ca43c5328107` |
| `app/trigon-check/owned-process-windows.cs` | `99b4120e48efdc706f79cab3ee8aa46ce2a57243` |
| `test/temporary.ts` | `010e59dcbc5a9abe799df5f51bf3a1f94ef3e3ec` |

Also reviewed at that same pin: `app/trigon-check/toolchain.ts`,
`app/toolchain.ps1`, `.codex/hooks.json`,
`app/trigon-conversations/bounded-output.ts`,
`app/trigon-conversations/compact-run.ts`,
`app/trigon-conversations/task-git.ts` and `spec/resources.md`.
The [official Codex hook contract](https://learn.chatgpt.com/docs/hooks) was
checked on 2026-11-01 for Windows commands and project trust. No hook trust or
account setting was changed, and fixture success does not establish native
hook activation.

## Evidence and limits

The first focused Windows run on Bun 1.4.2 passed 30 tests across six files
in 5.15 seconds. It covered process descendants, abrupt owner death, temporary
ownership, recovery bounds, fingerprints and memory admission. Subsequent
review added dead-owner borrowing, stronger cache metadata and directory
bounds, and acceptance shutdown evidence; the earlier result is not relabeled
as proof of those later edits. A separate 38-test run passed 36 tests and
exposed Git's redirected hook output and ignored lint fixtures; those failures
are retained as failed test-harness evidence, not counted as a passing gate.

A later focused run passed 70 tests, skipped the POSIX-only escaped-pipe case
and found one remaining hidden-directory lint-discovery fixture. That fixture
now explicitly supplies every declared file with the same production rules.
An initial complete gate then exposed the incompatible `.cache` ancestor for
local imports. The import policy correctly rejected those sources; it was not
relaxed to accommodate verification. Owned scratch now lives under `.tmp`.

The retained citation diagnostic runs the original five Python tests unchanged
under both locations. The old location failed three Git operations with
`Filename too long`: its loose-object path was 265 characters. The new location
shortens the workspace by 12 characters and passes all five tests. Each run
created and removed only its exact fresh marker and empty directory; no old
workspace was adopted or recursively deleted.

On Windows with Aube 2.5.1 and Bun 1.4.2, the corrected
`aube run --no-install step:check` passed formatting, all four strict TypeScript
programs, type-aware lint and **512 tests across 65 files**, with one explicitly
skipped POSIX test. The scheduler retained three processes, the 240-second
shared phase deadline and every test's existing deadline. Its longest batch
took 228.63 seconds. Live inspection verified 19,850 text files, 3,151 opaque
files including 27 hash-verified historical inputs, 3,082 retained originals,
and all 78 text exports comprising 933 files, with zero missing/linked entries.

`aube run --no-install test:web` passed the real browser workflow on Chromium
156.0.8078.4. Before acceptance, the previous five browser evidence files were
copied without overwriting and checked against SHA-256 hashes under
`.cache/web-evidence/archive/verification-resources-2026-11-01/`.
The first desktop attempt stopped at the Rust prerequisite check because its
launcher PATH selected an unavailable shim; it is failed prerequisite evidence,
not native acceptance. The subsequent `test:desktop` run passed with the already
installed configured default Rust 1.96.0 binaries explicitly on PATH, without
installation or settings changes. All four locked Cargo tests passed, followed
by the actual WebView2 156.0.4314.58 workflow and managed daemon shutdown. The
database ownership row was released before success, independently of supervisor
cleanup. The owned `.tmp` root was empty after acceptance.

Logs retain each attempt under `.cache/verification/` with the
`verification-resources-2026-11-01-` prefix and exclusive LF-only creation.
The diagnostic helper is `citation-temporary-diagnostic.py` in that same cache.
Final `review:check` passed with local receipt writes and four validated hits.
SHA-256 comparisons confirmed that every tracked verification receipt remained
byte-identical. Its live checks verified all 78 exports / 933 files again,
with zero missing/linked entries. The before/after hashes and exit status are
retained in `verification-resources-2026-11-01-review-1.json`.

The observed complete fresh step took 340.77 seconds; the subsequent cached
review took 86.85 seconds. These single samples include live prerequisite and
LF/export work and differing cache state; they are not a controlled speedup or
RSS benchmark. The existing root Stop subprocess cap remains 300 seconds, so
a stop without reusable results can still report a timeout. The required direct
step check establishes evidence for the normal subsequent reuse path. No test,
phase or hook deadline was extended. No POSIX runtime claim follows from these
Windows results. Final verification, signature and publication outcomes belong
in workflow receipts after the public implementation response is frozen.

Operational details are in [resource ownership](../resources.md),
[verification](../verification.md), [cache reuse](../cache.md),
[workflow](../workflow.md) and [conversation logging](../conversation-logging.md).
