# Guarded Windows Git execution

The user approved direct execution of the validated Windows Git payload on
2026-11-08, preserving executable identities, hook/signing checks and every
verification deadline. This changes first-party process selection; it does not
modify the installed Git distribution or author a dependency patch.

## Observed problem

Two complete primary-checkout reviews reached the unchanged 720-second unit
deadline. Separate integration and failure scenarios then each reached their
unchanged 180-second case limit. Their owned descendants stopped and parent
cleanup completed. These failures remain retained evidence, not reusable passes.

Four alternating, serial version probes in one checkout observed
116.5/101.3 milliseconds from the owned process handle to first output for the
core payload, and 278.9/313.8 milliseconds for the canonical launcher. Both
executables returned the same version and confirmed cleanup. The extra launcher
cost approximately 162/213 milliseconds in these paired observations. Small
version probes do not establish the historical cause of the slowdown, complete
workflow equivalence or a full-gate speedup.

## Reviewed source and boundary

The inspected installation is Git `2.56.0.windows.4`, package `2.56.0.4-1`.
The release-matched [wrapper source](https://github.com/git-for-windows/MINGW-packages/blob/20a412e3b61c853fb3a290f02e78f59611d20342/mingw-w64-git/git-wrapper.c)
and its package recipe describe the environment preparation as well as process
launch. The wrapper source SHA256 is
`c24bab1178721707c848b370aabfc3714a570d0ff34b664d318104a86098d58c`.

The first optimization is deliberately limited to the reviewed executable bytes
and supported environment branch. It preserves explicit Git/index controls and
wrapper PATH ordering, sets the matching runtime identity, and handles the
supported HOME, PLINK and MSYS conditions without changing the caller's
environment. Other valid profiles retain canonical execution with a reason.
Invalid installation relationships and changed executable bytes are never
converted into successful direct execution.

Only explicit asynchronous workflow Git callers use the adapter, including the
same private-fixture path exercised by the real workflow scenarios. Generic
process execution and synchronous verification Git calls keep their existing
behavior. Native process ownership, cancellation, output bounds and temporary
workspace cleanup remain in their existing adapters.

## Verification requirements

Verification must cover pure profile admission, actual wrapper/payload
environment and shell-hook parity, private SSH signing and verification,
configuration/index preservation, ordinary versus hook-added Git discovery,
changed-input rejection, and unsupported-profile behavior. Existing long-path,
ownership and cancellation tests remain required. No timing observation waives
the complete implementation and final review gates.

## Implementation evidence

The first real hook comparison caught a compatibility defect: the canonical
wrapper preserves an explicitly empty `PLINK_PROTOCOL`. The adapter now defaults
only a missing value to `ssh`; the unchanged real parity assertion then passed.
The focused run passed all 14 tests, including a private signed publication with
nonempty shell hooks, signature verification and remote confirmation.

On 2026-11-08 the complete `aube run --no-install step:check` passed with Bun
1.4.2, three admitted workers and all 87 test files. The whole command took
647.5 seconds, including format, type, lint, unit and live LF/export checks.
The four previously timing-out Git scenarios completed in 89.2, 89.0, 87.5 and
80.4 seconds; their 180-second limits and the 720-second shared phase stayed
unchanged. There were 658 passing Bun tests and the unchanged Windows skip for
the POSIX escaped-pipe case; the retained Python checks passed too. Descendant
shutdown and scratch cleanup were confirmed. The retained full-run log SHA256 is
`af49f1abdbb18e2e6bed734cbddcfd22cb47ff08e4cb0a149410b2109bc235ed`.

These are worktree implementation measurements, not a controlled historical
speedup claim or proof of primary-checkout/native-hook reuse. Final review,
publication and actual hook-reuse outcomes are recorded separately after the
implementation checkpoint is frozen.
