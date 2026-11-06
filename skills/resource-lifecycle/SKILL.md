---
name: resource-lifecycle
description: Implement or review ownership of subprocesses, temporary workspaces, verification memory, and cleanup. Use for leaked processes, unsafe cache cleanup, cancellation, or bounded test runners; not for deleting arbitrary project caches.
---

# Owned resources and cleanup

Read the project's resource contract and inspect the actual process/scratch adapters. Identify each resource's creator, borrower, lifetime, bounds, and retained evidence before changing cleanup. Source worktrees, dependencies, research originals, workflow locks, and receipts do not become temporary files because they live under a cache directory.

Own descendants, not only the direct child. Use the project's supported process group or native job mechanism, bound output and runtime at the underlying process, and consume its streams. Cancellation must join termination and stream closure. If descendant shutdown is unconfirmed, fail the operation, preserve its scratch and diagnostics, and do not publish reusable success.

On Windows, suppress background windows at each process boundary, including helpers and grandchildren. Do not assume outer redirection or a hidden parent is inherited. Keep genuinely interactive launches explicit. Retain platform signal and cancellation behavior; a source-level flag check complements a real native regression rather than replacing it.

Allocate test fixtures through the repository's owned temporary-workspace API. Validate physical containment, ancestors, exact markers/tokens, schema version, and bounds. Borrowing a parent grants routing, not deletion authority. Preserve unknown, unreadable, unsupported, or redirected ownership state. Follow the project's text/newline rules for generated markers and outputs.

Dispose known finished scratch only after confirming all owned descendants have stopped. Recover abandoned scratch only through the explicit supported recovery path with its required ownership and shutdown evidence. Age alone or a recycled PID is insufficient. Do not broaden scratch recovery into lock reclamation, worktree pruning, or deletion of source/verification/conversation evidence.

Bound test admission using live available resources and the project's worker cap. Stream large fingerprints and transcripts with cumulative byte limits; per-file or displayed-tail bounds alone do not bound memory. Keep one declared phase deadline where required, without extending individual tests or silently dropping unfinished work. Distinguish process exit, cleanup confirmation, and verification success in receipts and user-facing reports.
