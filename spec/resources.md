# Verification resource ownership

Verification owns the processes and temporary files it creates. Completion means
that owned descendants have stopped and their streams have closed; the direct
child's exit status alone is insufficient. Unconfirmed shutdown fails the check
and retains its scratch directory for inspection. Resource cleanup cannot turn
incomplete verification into reusable success.

Background subprocesses must explicitly suppress Windows console windows at
every launch boundary, including grandchildren and test helpers. Use
`windowsHide: true` for Bun/Node launches, `CREATE_NO_WINDOW` for ordinary Python
children, and `CreateNoWindow` with `UseShellExecute=false` for PowerShell/.NET.
Hiding an outer supervisor does not make these settings inheritable.
Windows background launches must also avoid `detached:true`: Bun 1.4.2's
Node-compatible spawn can allocate a visible console despite `windowsHide:true`.
Use `detached:false` or the reviewed `process.platform !== "win32"` guard;
retain POSIX process groups and the existing owned Windows termination path.
The native regression checks both absence of a console and preserved streams.
Real console-control fixtures need a deliberately isolated hidden console and must
verify its visibility while preserving actual signal and cleanup coverage.
Interactive windows require an explicit user request. Native console-handle
checks complement the lint guard; neither a redirected stream nor a passing
non-Windows test proves the Windows behavior.

## Resource classes

Repository workflow observations admit at most two active Git reads and eight
outstanding reads at one boundary. Independent reads settle before validation
or error return; mutations remain sequenced separately. Failure diagnostic
writes are serialized within each Git adapter. Every later publication boundary
obtains fresh observations, and native ownership/fingerprints remain live.

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

Finished task-owned scratch has no minimum retention period. Its creating scope
disposes it immediately after confirmed descendant shutdown. If that scope has
already stopped, `recoverTemporaryWorkspace` accepts the creator's saved path
and exact original marker bytes, plus an explicit confirmation that the owned
descendants have stopped. It validates a direct physical child of this project's
temporary root, the complete unchanged marker, the same host and a definitively
absent original process, then rechecks those conditions before removal. A live
or reused PID, unknown liveness, marker drift or redirected path blocks recovery.
The descendant confirmation is the trusted caller's assertion after joining or
otherwise verifying shutdown; it is not independent OS attestation. Borrowing a
workspace does not provide its creator's recovery proof. Retain the proof before
launch when recovery across an interrupted owner is required.

Creating a workspace does not prune previous runs. Broader stale-folder cleanup
retains the 24-hour minimum as a conservative buffer for folders whose finished
task scope is not individually established. `pruneTemporaryWorkspaces` is limited
to marked top-level directories in this project's temporary root. It first
admits a bounded inventory of at most 4,096 entries, then considers at most 256
leases per call. A returned cursor supports another explicit bounded call.
Bulk recovery requires a valid matching marker, the same host, an age of at least
24 hours and a definitively absent process. A live or reused PID, permission
error, foreign host, malformed marker or otherwise unknown process state is
preserved. Unmarked entries are preserved. Neither the operating system's
temporary directory nor existing workflow locks, rejection history, diagnostics
or conversations are recovery targets. This API is not a scheduled cleanup job.

The research Git tests run PowerShell and Bash inside a supervised command.
Their repositories belong to that command's marked scratch until the process
tree has stopped. A confirmed run removes its fixtures; unconfirmed shutdown
retains them. This does not reclaim the historical fixture directories under
`.cache/research`.
After validating inherited temporary routing, these fixtures use a direct
command lease under the same project's `.tmp` so Git recovery references fit
the isolated Windows Git path limits. Abrupt worker termination may retain that
independent lease for explicit recovery; an enclosing unit lease does not grant
permission to prune it.

## Process ownership

An explicitly selected physical `projectRoot` can own supervisor artifacts and
locks independently from the command's `cwd`. Default callers retain this
repository as owner. Cross-project preparation still reads the trusted
Teamagent supervisor source and compiler inputs, validates each target cache,
and keys in-flight preparation by both physical owner and source identity.
The [project launcher](project-launcher.md) applies the same owner to scratch and
retains it when either environment capture or command cleanup is unconfirmed.

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

Windows completion requires a fresh, token-bound native record written only
after successful job draining. The host validates its bounded schema, token and
child status against the observed ordinary exit status. Raw external termination,
missing or invalid records, reserved status 253 and unsupported child statuses
remain unconfirmed. This prevents an ordinary forced supervisor exit from
looking like a normally completed failed command. The record is cooperative
completion evidence, not attestation against a hostile actor with the same
filesystem authority. If the cancellation event has already closed, the adapter
briefly joins an already-finishing supervisor before trying to kill it; an
actual forced kill cannot establish successful cleanup.

Each Windows command allocates a marked completion lease in the explicit
project's `.tmp` root. Confirmed completion removes only that lease. Unknown
completion retains it alongside the caller's command scratch for inspection;
no receipt, workflow history or unrelated folder is pruned. The protocol does
not depend on high exit-code bits surviving the Bun transport.
The native writer completes its bounded synchronous write and closes the
exclusive file handle before returning. This live handshake requires visibility to its waiting owner,
not a durable disk flush after every command. It is never recovery authority
after owner exit or power loss; those paths retain their separate proof rules.

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

Fully validated complete keyed artifacts can be read without the publication
lock. Every read still hashes the full input closure before and after artifact
inspection. The six independent input digests use the existing bounded reader
pool and all settle before any result or error is returned. There is no timestamp
shortcut or retained fingerprint result. Cooperative preparation never rewrites
a complete keyed artifact, and the publication lock was already released before
executable launch; this is not protection against noncooperating filesystem edits.

Absent, empty or transiently incomplete artifacts use the existing bounded
publication lock and are reinspected. Previously observed invalid evidence
cannot disappear into an automatic rebuild; only a complete valid reinspection
can recognize a concurrent writer finishing. Compilation, capacity admission,
publication and exact pending-file cleanup remain locked. A warm read may use
valid evidence while an unrelated publication lock exists; it never removes or
adopts that lock, and new publication still requires its normal ownership checks.

POSIX uses a detached process group, terminates that owned group and waits for
its disappearance before reporting confirmed cleanup. Stop, exit and close
share one terminate-and-join operation, including absence and failure outcomes;
they never signal or probe that identifier again after completion. This contract does not
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
360-second phase deadline, explicitly approved on 2026-11-02. Resource pressure may reduce admission or leave
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
