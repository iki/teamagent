# tracedecay

Source: [tracedecay](https://github.com/ScriptedAlchemy/tracedecay) · Category: [ai-agents-mem](../categories/ai-agents-mem.md)

Review depth: **inventory / README screening only**. This is an individual coverage record, not a source-code correctness audit or adoption recommendation.

Snapshot: `413755b1f699477f7ca7d1ca744ed0b4000dedc3`; commit timestamp `2026-10-03T11:55:23-07:00`; 6,792 tracked paths.

## Scope and evidence

Upstream description excerpt (a project claim, automatically extracted from [README](https://github.com/ScriptedAlchemy/tracedecay/blob/413755b1f699477f7ca7d1ca744ed0b4000dedc3/README.md)):

> TraceDecay builds a local semantic graph of your repository so AI coding agents can ask for the right symbols, call relationships, impact radius, docs, and source snippets without scanning the tree. Instead of repeated `grep`, `glob`, and file reads, agents use MCP tools such as `tracedecay_context`, `tracedecay_search`, `tracedecay_callers`, and `tracedecay_impact`.

Build/package evidence: [Cargo.toml](https://github.com/ScriptedAlchemy/tracedecay/blob/413755b1f699477f7ca7d1ca744ed0b4000dedc3/Cargo.toml); [crates/tracedecay-agent-hosts/Cargo.toml](https://github.com/ScriptedAlchemy/tracedecay/blob/413755b1f699477f7ca7d1ca744ed0b4000dedc3/crates/tracedecay-agent-hosts/Cargo.toml); [crates/tracedecay-api/Cargo.toml](https://github.com/ScriptedAlchemy/tracedecay/blob/413755b1f699477f7ca7d1ca744ed0b4000dedc3/crates/tracedecay-api/Cargo.toml); [crates/tracedecay-application/Cargo.toml](https://github.com/ScriptedAlchemy/tracedecay/blob/413755b1f699477f7ca7d1ca744ed0b4000dedc3/crates/tracedecay-application/Cargo.toml); [crates/tracedecay-automation-runtime/Cargo.toml](https://github.com/ScriptedAlchemy/tracedecay/blob/413755b1f699477f7ca7d1ca744ed0b4000dedc3/crates/tracedecay-automation-runtime/Cargo.toml)

License evidence: [LICENSE](https://github.com/ScriptedAlchemy/tracedecay/blob/413755b1f699477f7ca7d1ca744ed0b4000dedc3/LICENSE) Classification hint: MIT. A root license does not establish rights for every bundled asset, model, or dependency.

## Harness assessment

This entry was catalogued under **ai-agents-mem**. Its category places it in the candidate set for memory, evolution; those associations are navigational and have not been individually validated as implemented capabilities. See [memory](../memory.md) · [evolution](../evolution.md) for the source-reviewed alternatives and proposed integration boundaries.

**Disposition:** retain as a comparison candidate. Before adopting it, inspect the implementation entry point and its tests, verify the required protocol and deployment platform, and reproduce a task from the harness evaluation suite. Popularity, a README feature list, and the presence of a package manifest are insufficient evidence of quality or compatibility.

**Unresolved:** runtime behavior, security boundaries, performance, API/subscription eligibility, dependency health, maintenance status, and fit to the proposed harness were not independently established for this entry. No repository code was executed as part of this screening.


## Change review - 2026-10-28

**Reconciliation ownership is explicit while cached reads still trust modification times.** Reviewed commit `950f37db306a12bc3503a290ebfedf22b46f0bd3` (commit date `2026-10-27T10:31:27-07:00`). Compared with `413755b1f699477f7ca7d1ca744ed0b4000dedc3`; the complete Git comparison contains 4525 changed paths.

The reconciliation-task wrapper snapshots owners from ready, recovery-required and faulted profile/project slots and skips opening, replacing and retiring slots. Shutdown waits for owners sequentially and aggregates failures. It accepts both CancelledAndJoined and RuntimeUnavailable, whereas retirement clears an attached owner only after CancelledAndJoined and treats the other terminal outcome as an error. Those distinctions are useful lifecycle evidence, but the wrapper contains no aggregate shutdown deadline and does not itself prove the underlying owner's cancellation contract.

The read cache keys project, session, file, mode and a canonical argument hash, with an explicit global-session key. A cache hit compares modification time only; the stored digest is returned rather than recomputed against the current body. Insertion is transactional but trusts the supplied modification time, digest and body. Same-timestamp content replacement can therefore remain stale. The stored signed token count is clamped at zero then cast to u32, leaving oversized values able to wrap; these boundaries have no local content-size or digest validation.

Evidence: [crates/tracedecay-store-runtime/src/session_registry/memory_graph_reconciliation_tasks.rs:1-143](https://github.com/ScriptedAlchemy/tracedecay/blob/950f37db306a12bc3503a290ebfedf22b46f0bd3/crates/tracedecay-store-runtime/src/session_registry/memory_graph_reconciliation_tasks.rs#L1-L143) · [crates/tracedecay-session-memory/src/context/read_cache.rs:1-242](https://github.com/ScriptedAlchemy/tracedecay/blob/950f37db306a12bc3503a290ebfedf22b46f0bd3/crates/tracedecay-session-memory/src/context/read_cache.rs#L1-L242).

**Harness consequence:** Reuse explicit owner states and joined-retirement receipts, while checking the underlying cancellation guarantee and bounding aggregate shutdown. Treat a read cache as a derived optimization keyed by immutable content identity and recipe, not modification time alone; validate stored row types, counts, byte limits and content hashes before reuse.

**Scope and limits:** Scoped static review of two complete implementation files and the embedded argument-hash fixture within the 4,525-path comparison. Runtime-owner internals, graph publication, database migrations and the full application were not audited; no upstream tests or services were executed.

## Follow-up change review — 2026-10-28

**Resumed JSONL reads retain a proof of the original first complete frame.** Reviewed commit `1003abc0590394675941d1060b8e3027a3ad61ff` (commit date `2026-10-28T01:38:17-07:00`), compared with `950f37db306a12bc3503a290ebfedf22b46f0bd3`. The complete no-rename Git path inventory contains 259 changed paths.

The new ResumeDigest preserves a domain-separated SHA-256 prefix and first-frame witness across chunk boundaries and resumed clones. The durable fingerprint is only a 64-bit digest prefix with a position, explicitly not resumable SHA mid-state; rebuilding after durable resume requires rereading the prefix. Fixtures preserve earlier fingerprint bytes, wait for a terminating newline, compare cold/resumed witnesses and detect header changes beyond an initial 1,024-byte identity window.

Evidence: [crates/tracedecay-sessions/src/runtime/source/jsonl/resume_digest.rs:1-88](https://github.com/ScriptedAlchemy/tracedecay/blob/1003abc0590394675941d1060b8e3027a3ad61ff/crates/tracedecay-sessions/src/runtime/source/jsonl/resume_digest.rs#L1-L88) · [crates/tracedecay-sessions/src/runtime/source/jsonl/resume_digest.rs:95-169](https://github.com/ScriptedAlchemy/tracedecay/blob/1003abc0590394675941d1060b8e3027a3ad61ff/crates/tracedecay-sessions/src/runtime/source/jsonl/resume_digest.rs#L95-L169).

**Harness consequence:** Bind incremental imports to both file generation and complete-prefix/header evidence. Distinguish compact change detectors from full cryptographic provenance, and do not reuse a cursor after source rewriting or text normalization without a migration record.

**Scope and limits:** Reviewed the complete new digest helper and its in-file fixtures; surrounding JSONL admission, daemon, privacy and automation changes were not exhaustively audited. This is a scoped static comparison, not a whole-project correctness or security audit. Upstream tests were read where cited, not run; no upstream code, service, model or provider operation was executed. Historical findings above remain evidence at their own revisions.

## Change review - 2026-11-01

Reviewed `3c31db796f44ebe41c1a74b204531d936232598f` against `1003abc0590394675941d1060b8e3027a3ad61ff`. The selected [capability admission table](https://github.com/ScriptedAlchemy/tracedecay/blob/3c31db796f44ebe41c1a74b204531d936232598f/crates/tracedecay-agent-hosts/src/agents/host_bundle/capability_admission.rs) removes OperatorMcp from the component matches while retaining distinct hook, MCP, CLI and native-diagnostic requirements. This delta does not establish a replacement operator surface. The [unavailable-evidence fixture](https://github.com/ScriptedAlchemy/tracedecay/blob/3c31db796f44ebe41c1a74b204531d936232598f/crates/tracedecay-application/src/primitives/production/unavailable_evidence_tests.rs) retains a definition-mismatch refusal code and an explicit restart-without-cursor recovery action; the formerly combined unrecorded-definition case is removed from this test.

**Harness consequence:** Version component capabilities and invalidate stale cached declarations when a surface disappears. Preserve typed refusal and lawful recovery rather than silently continuing a cursor against changed semantics. Removed test coverage is not proof that the underlying case is impossible or safe elsewhere.

**Scope and limits:** Admission-table and refusal-fixture deltas only; the large host test deletion and broader implementation were not fully re-audited. No host deployment or upstream test was executed.

<!-- teamagent-analysis:start -->
Analysis metadata: source [tracedecay](https://github.com/ScriptedAlchemy/tracedecay); analyzed commit `3c31db796f44ebe41c1a74b204531d936232598f`; commit date 2026-11-01T01:58:07-08:00; review date 2026-11-01T11:35:43.470Z; depth screened. [Maintenance record](../analyses/repos/ai-agents-mem--tracedecay.md).
<!-- teamagent-analysis:end -->
