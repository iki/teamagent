# Verification resource ownership

Verification owns the processes and temporary files it creates. Completion means
that owned descendants have stopped and their streams have closed; the direct
child's exit status alone is insufficient. Unconfirmed shutdown fails the check
and retains its scratch directory for inspection. Resource cleanup cannot turn
incomplete verification into reusable success.

## Resource classes

| Resource                                                                      | Owner and lifetime                                                                          |
| ----------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------- |
| Fresh scratch under `.tmp/`                                                   | The scope that created its ownership marker; dispose only after confirmed child shutdown.   |
| Borrowed temporary parent                                                     | Validated routing for a child scope; borrowing grants no authority to dispose the parent.   |
| Native supervisor artifacts under `.cache/verification/native-owned-process/` | A bounded, source-keyed derived cache; no age-based eviction or process adoption.           |
| Workflow locks, receipts, histories and conversation records                  | Their existing workflow and evidence contracts; never temporary-workspace recovery targets. |
| Source checkouts, installed dependencies and original research inputs         | Preserved inputs; never inferred scratch from their location, age or a stored PID.          |

All maintained text uses LF, including ownership markers and native-cache digest
receipts. `.tmp/` is an explicitly registered owned output root. A
link inside a disposable fixture may be removed as a link; its target is never
traversed or removed. Redirected workspace roots or ancestors fail validation.

## Temporary workspaces

`app/check/temporary-workspace.ts` creates fresh marked directories beneath the
physical repository's `.tmp/` directory. Names include a bounded
label and a random UUID. Each private, regular ownership marker is limited to
4 KiB and must match the strict version-one schema: token, host, PID and creation
time. The token must match the directory name. Unknown versions, additional
fields, oversized markers and redirected paths are rejected.

The short project-local root keeps source fixtures outside the existing
`.cache` import exclusion and limits Windows pathname overhead. It is ignored
by Git and checked by the LF gate. Earlier experimental `.cache/temporary`
directories remain registered for LF inspection but are neither adopted nor
pruned by the current ownership API. Import security rules are unchanged.

A child receives `TEMP`, `TMP` and `TMPDIR` for its own scratch. The three
`TEAMAGENT_TEMPORARY_ROOT`, `TEAMAGENT_TEMPORARY_PARENT` and
`TEAMAGENT_TEMPORARY_PARENT_ID` fields describe the enclosing owner. They must be
present together, agree across case variants and validate against the caller's
trusted repository root. The recorded owner must be affirmatively alive; stale
or unknown liveness cannot start new work beneath a recoverable abandoned lease.
The operational working directory may be a Git fixture;
it does not select the repository that owns temporary files. Nested children
retain the top-level routing identity to keep paths short. Building this
environment never mutates the caller's environment.

Only the scope that creates a workspace receives its disposal operation.
Disposal compares the original complete ownership record, validates physical
containment, inspects at most 50,000 entries and 48 directory levels without
following links, then revalidates ownership before removal. Validation failure
prevents removal; cleanup errors remain explicit. Fixture helpers track their
own exact allocations and validate
the same owner and traversal bounds; borrowing a test worker's parent does not
permit deleting another worker's fixtures.

Creating a workspace does not prune previous runs. Explicit recovery is limited
to marked top-level directories in this project's temporary root. It first
admits a bounded inventory of at most 4,096 entries, then considers at most 256
leases per call. A returned cursor supports another explicit bounded call.
Recovery requires a valid matching marker, the same host, an age of at least
24 hours and a definitively absent process. A live or reused PID, permission
error, foreign host, malformed marker or otherwise unknown process state is
preserved. Unmarked entries are preserved. Neither the operating system's
temporary directory nor existing workflow locks, rejection history, diagnostics
or conversations are recovery targets. This API is not a scheduled cleanup job.

## Process ownership

`app/check/owned-process.ts` accepts a physical absolute executable and literal
arguments; it does not use a shell. Argument counts and bytes, configured
deadlines, compiler output and cleanup waits are bounded. Callers separately
bound their captured output and hold scratch until the returned `closed`
promise confirms descendant shutdown. Cancellation is checked before launch
and after asynchronous supervisor preparation.

Windows uses a native Job Object supervisor. The child joins its job atomically
while suspended, before execution, and cannot break away. The supervisor watches
an identity-checked owner process handle and a fresh cancellation event. Normal
exit, cancellation and owner death all terminate and drain the job before
closing its resources. Windows argument quoting preserves literal empty,
quoted, spaced and trailing-backslash arguments; launches are hidden. A failed
or forced supervisor cleanup reports unconfirmed termination and retains
scratch, even when the direct process already exited.

The native helper is compiled with the provisioned Windows compiler, without a
download or dependency repair. Its cache key binds the C# source, TypeScript
adapter, compiler and compiler-configuration bytes, explicit `mscorlib.dll` and
`System.dll` references, architecture and runtime. Automatic compiler response
files and implicit standard references are disabled. Live verification
prerequisites prepare and validate this identity, including the binary digest,
before accepting reusable evidence. Reuse checks the binary's digest;
compilation rechecks its inputs before publishing a digest receipt. Corrupt,
incomplete or unexpected existing artifacts require explicit inspection and are
never overwritten by preparation. A validated empty directory remains retryable.
The cache permits at most 32 keyed directories and a 16-MiB binary. Reaching
capacity fails for explicit inspection; it does not remove older artifacts.
Only the current operation's exact pending files are removed automatically.

POSIX uses a detached process group, terminates that owned group and waits for
its disappearance before reporting confirmed cleanup. This contract does not
claim cleanup after abrupt death of the JavaScript owner or coverage of a
descendant that deliberately leaves the owned process group. Nested owned
adapters also create separate POSIX groups and can survive an outer JavaScript
owner's abrupt death; they are not certified as one owned tree. A final bounded
transport join closes only the caller's pipes and returns unconfirmed when
inherited pipes do not close, preserving scratch instead of hanging indefinitely.
Windows Job Object
guarantees must not be presented as cross-platform evidence.

## Verification and evidence

Workflow commands retain explicit exited, timeout, output-limit, cancelled and
transport outcomes. Tools and unit batches fail when native launch or cleanup
fails. Unit batches retain the 120-second per-test setting and the shared
240-second phase deadline. Resource pressure may reduce admission or leave
queued files unrun; such a result is incomplete verification, not a partial pass.

Fingerprint readers hash full content with 64-KiB buffers, at most four active
readers and a bounded queue of 256. They compare path/open-handle identities,
size and nanosecond timestamps before and after reading, check EOF, and release
descriptors before returning admission capacity. Incremental inventory digests
preserve the previous JSON byte representation. Directory and metadata bounds
are enforced before retaining an unbounded inventory. The existing serial
installed-package reader retains its independently validated streaming contract.

On 2026-11-01, the real Windows run on Bun 1.4.2 passed 30 focused tests across
six files in 5.15 seconds: owned processes (5), temporary workspaces (5), fixture
cleanup (5), fingerprints (8), memory admission (5) and verification resources
(2). Process fixtures exercised literal arguments and streams, nonzero and
failed launches, cancellation and timeout, nested commands, surviving
descendants with inherited or closed pipes, an unrelated live sentinel and
abrupt death of the JavaScript owner. Temporary fixtures exercised borrowed
authority, redirects, preserved link targets, bounded explicit recovery and
cleanup after success, failure and abrupt exit. These are focused Windows
results, not a complete repository gate or POSIX validation.
