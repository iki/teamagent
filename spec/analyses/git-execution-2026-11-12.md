# Additional reviewed Windows Git profile

The installed Git distribution changed from `2.56.0.windows.4` to
`2.56.1.windows.1` during the pending workflow verification. The existing
adapter correctly returned canonical execution for the new, unreviewed bytes.
This increment adds one complete reviewed tuple and preserves the original
profile and its [November 8 evidence](git-execution-2026-11-08.md).
It changes repository-owned process selection, not installed Git or a dependency
patch. No test, process or verification deadline is changed.

## Source and binary evidence

The installed package inventory identifies `mingw-w64-ucrt-x86_64-git`
`2.56.1.1-1`. The corresponding immutable
[package recipe and wrapper source](https://github.com/git-for-windows/MINGW-packages/tree/050f94fd8a2198a71f3efc9044e801430d83daef/mingw-w64-git)
were inspected at `050f94fd8a2198a71f3efc9044e801430d83daef`.
The wrapper source and build makefile are byte-identical to the previously
reviewed package revision `20a412e3b61c853fb3a290f02e78f59611d20342`.
The wrapper source SHA256 remains
`c24bab1178721707c848b370aabfc3714a570d0ff34b664d318104a86098d58c`.

| Component                        | Exact installed SHA256                                             |
| -------------------------------- | ------------------------------------------------------------------ |
| Canonical `cmd/git.exe` launcher | `177bc8a9af84fa3a400c694c975fda731d048279c074e1a93947ce8b067ebb48` |
| UCRT64 core and runtime payloads | `9bf8ee81d79f38a11eaf7799499a634c46a718e009a4a9b2b20b115804643302` |

The corresponding
[Git source](https://github.com/git-for-windows/git/tree/7bda9d349370004e1aec464249d784d18e58c001)
was inspected at `7bda9d349370004e1aec464249d784d18e58c001`.
`run-command.c`, `exec-cmd.c` and `gpg-interface.c` are unchanged from the
previously reviewed release. The SSH-selection region of `connect.c` is also
unchanged; its other changes validate advertised reference targets.
This supports retaining the reviewed environment and hook/signing behavior.

The source review manifest SHA256 is
`634bf8be33970887e98d8540d969e32924702f063e0a831b1642d982454d8fdf`.
It binds the retained source bytes, immutable revisions and installed inventory.
This is a matching package-source review, not independently recovered binary
build provenance, reproducible-build attestation or a native parity result.

## Admission and verification

The old `gitPayloadProfile` export remains unchanged. A fixed profile table
adds the new tuple. Both adapters require the launcher, core payload and runtime
payload to belong to one table entry; a mixed release is unsupported even when
each component hash occurs somewhere in the table. Synchronous dispatch also
checks that the selected wrapper or direct executable matches that same entry.
The reusable identity binds the selected profile. Every dispatch still performs
the existing complete byte and physical-path checks; retained discovery never
substitutes for those live observations.

Pure coverage exercises both supported profiles, all eight old/current
launcher/core/runtime combinations, unsupported hashes, wrapper configuration,
HOME bounds, protocol choices and hook-added execution paths. Exactly two
complete tuples are admitted and all six mixed tuples are rejected; the two
release identities differ.

The native tests identify either installed tuple and require actual payload
execution for a supported installation. Existing shell-hook, literal-argument,
exit-status, configuration/index, SSH-signing, remote-confirmation, executable
mutation, raw-byte and alternate-index assertions remain required. An unknown
installation retains the explicit canonical fallback test.

Source review and test definitions do not establish a passing run or a speedup.
Focused native acceptance, the complete implementation check and final review
must pass before publication; their actual results belong in retained receipts
and the task record. Earlier timed-out verification remains failed evidence.
