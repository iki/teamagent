# dolt

Source: [dolt](https://github.com/dolthub/dolt) · Category: [ai-agents-mem](../categories/ai-agents-mem.md)

Review depth: **inventory / README screening only**. This is an individual coverage record, not a source-code correctness audit or adoption recommendation.

Snapshot: `372bff8b189fcda226bb13ee66fe1dde14a3c0dd`; commit timestamp `2026-10-02T17:08:16-07:00`; 2,495 tracked paths.

## Scope and evidence

Upstream description excerpt (a project claim, automatically extracted from [README](https://github.com/dolthub/dolt/blob/372bff8b189fcda226bb13ee66fe1dde14a3c0dd/README.md)):

> Dolt is a SQL database that you can fork, clone, branch, merge, push Connect to Dolt just like any MySQL database to read or modify schema

Build/package evidence: [.github/actions/check-deferred-ci/package.json](https://github.com/dolthub/dolt/blob/372bff8b189fcda226bb13ee66fe1dde14a3c0dd/.github/actions/check-deferred-ci/package.json); [.github/actions/ses-email-action/package.json](https://github.com/dolthub/dolt/blob/372bff8b189fcda226bb13ee66fe1dde14a3c0dd/.github/actions/ses-email-action/package.json); [go/go.mod](https://github.com/dolthub/dolt/blob/372bff8b189fcda226bb13ee66fe1dde14a3c0dd/go/go.mod); [integration-tests/go-sql-server-driver/go.mod](https://github.com/dolthub/dolt/blob/372bff8b189fcda226bb13ee66fe1dde14a3c0dd/integration-tests/go-sql-server-driver/go.mod); [integration-tests/mysql-client-tests/go-mysql/go.mod](https://github.com/dolthub/dolt/blob/372bff8b189fcda226bb13ee66fe1dde14a3c0dd/integration-tests/mysql-client-tests/go-mysql/go.mod)

License evidence: [LICENSE](https://github.com/dolthub/dolt/blob/372bff8b189fcda226bb13ee66fe1dde14a3c0dd/LICENSE) Classification hint: Apache-2.0. A root license does not establish rights for every bundled asset, model, or dependency.

## Harness assessment

This entry was catalogued under **ai-agents-mem**. Its category places it in the candidate set for memory, evolution; those associations are navigational and have not been individually validated as implemented capabilities. See [memory](../memory.md) · [evolution](../evolution.md) for the source-reviewed alternatives and proposed integration boundaries.

**Disposition:** retain as a comparison candidate. Before adopting it, inspect the implementation entry point and its tests, verify the required protocol and deployment platform, and reproduce a task from the harness evaluation suite. Popularity, a README feature list, and the presence of a package manifest are insufficient evidence of quality or compatibility.

**Unresolved:** runtime behavior, security boundaries, performance, API/subscription eligibility, dependency health, maintenance status, and fit to the proposed harness were not independently established for this entry. No repository code was executed as part of this screening.


## Change review - 2026-10-28

**Chunk ingestion checks address integrity and Git fetch avoids unnecessary FETCH_HEAD writes.** Reviewed commit `19e0999a01bafac851ba7a80aa03a2d96879070a` (commit date `2026-10-27T12:38:25Z`). Compared with `372bff8b189fcda226bb13ee66fe1dde14a3c0dd`; the complete Git comparison contains 259 changed paths.

refCheckAllSources now hashes each chunk's data before checking its referenced addresses and returns a typed ErrChunkHashMismatch on disagreement. The entire function still returns early when refCheck is nil, so the new hash check is conditional on that path's reference-check configuration; it is not universal verification of every store read/write. NodeStore records a written node's hash after successful Put and reads byte values by collecting leaves then allocating one output buffer, reducing append reallocations while still retaining the complete value.

Git blob-store fetch adds --no-write-fetch-head alongside the explicit forced refspec and empty refmap. It retries once without that flag only for exit 129 plus the exact unknown-option diagnostic, caching that capability result atomically for the adapter. The inspected fixtures create an unusable FETCH_HEAD and emulate an older Git binary; these are meaningful cases but were not run. The new PriorBytesWriter interface is explicitly an external-consumer hook, not evidence Dolt itself uses incremental byte replacement.

Evidence: [go/store/nbs/store.go:2083-2127](https://github.com/dolthub/dolt/blob/19e0999a01bafac851ba7a80aa03a2d96879070a/go/store/nbs/store.go#L2083-L2127) · [go/store/prolly/tree/node_store.go:190-277](https://github.com/dolthub/dolt/blob/19e0999a01bafac851ba7a80aa03a2d96879070a/go/store/prolly/tree/node_store.go#L190-L277) · [go/store/val/value_store.go:39-57](https://github.com/dolthub/dolt/blob/19e0999a01bafac851ba7a80aa03a2d96879070a/go/store/val/value_store.go#L39-L57) · [go/store/blobstore/internal/git/impl.go:381-415](https://github.com/dolthub/dolt/blob/19e0999a01bafac851ba7a80aa03a2d96879070a/go/store/blobstore/internal/git/impl.go#L381-L415) · [go/store/blobstore/internal/git/impl.go:460-476](https://github.com/dolthub/dolt/blob/19e0999a01bafac851ba7a80aa03a2d96879070a/go/store/blobstore/internal/git/impl.go#L460-L476) · [go/store/blobstore/internal/git/impl_test.go:1218-1312](https://github.com/dolthub/dolt/blob/19e0999a01bafac851ba7a80aa03a2d96879070a/go/store/blobstore/internal/git/impl_test.go#L1218-L1312).

**Harness consequence:** Require content-address verification at every admitted source boundary, with explicit coverage when a fast path bypasses it. Bound full-value assembly separately from allocation optimizations. Feature-detect narrowly against a pinned executable and record fallback behavior; this Git compatibility patch does not authorize remote transfers or prove crash durability of the complete database.

**Scope and limits:** Static selected chunk-validation, node-value assembly and Git-fetch implementation/diff review within the 259-path comparison, including two fixture bodies. Complete NBS admission call graph, byte-reuse implementation, database correctness and performance were not audited or executed.

## Follow-up change review — 2026-10-28

**Unique-key preparation is moved into validation and mutable builders are reset between rows.** Reviewed commit `59a0910c01389983554fead8982347c13c6b3c77` (commit date `2026-10-27T18:41:10-04:00`), compared with `19e0999a01bafac851ba7a80aa03a2d96879070a`. The complete no-rename Git path inventory contains 6 changed paths.

The keyless secondary writer now performs unique checks through ValidateKeyViolations, recycles key/prefix builders before preparing fields, and reuses prepared fields for insertion. Deletion resets its builder after a rejected validation; update explicitly validates the new row before insertion. The foreign-key delta corrects a comment and adds tests showing that names participate in equality while table/index names do not. This source read does not establish transactional rollback across the writer stack.

Evidence: [go/libraries/doltcore/sqle/writer/prolly_index_writer_keyless.go:243-296](https://github.com/dolthub/dolt/blob/59a0910c01389983554fead8982347c13c6b3c77/go/libraries/doltcore/sqle/writer/prolly_index_writer_keyless.go#L243-L296) · [go/libraries/doltcore/sqle/writer/prolly_index_writer_keyless.go:377-435](https://github.com/dolthub/dolt/blob/59a0910c01389983554fead8982347c13c6b3c77/go/libraries/doltcore/sqle/writer/prolly_index_writer_keyless.go#L377-L435) · [go/libraries/doltcore/doltdb/foreign_key_coll_test.go:47-93](https://github.com/dolthub/dolt/blob/59a0910c01389983554fead8982347c13c6b3c77/go/libraries/doltcore/doltdb/foreign_key_coll_test.go#L47-L93).

**Harness consequence:** A reusable mutable encoder needs explicit reset and prepare/commit sequencing. Validate conflicts before mutation and test failure followed by reuse; do not infer transaction atomicity solely from a local validation method.

**Scope and limits:** Reviewed keyless writer changes and foreign-key equality fixtures in the six-path delta; the updated SQL-engine dependency was not audited. This is a scoped static comparison, not a whole-project correctness or security audit. Upstream tests were read where cited, not run; no upstream code, service, model or provider operation was executed. Historical findings above remain evidence at their own revisions.

## Change review — 2026-11-01

Reviewed `46d8805d8556599eb0a6472892e67e3bb1e0de03` (2026-10-31T16:46:33Z); 18 paths changed from `59a0910c01389983554fead8982347c13c6b3c77`. Selected fsck traversal hunks extend reachability to working-set roots and commits, preserve ownership labels, distinguish explicitly recorded shallow-clone ghost commits from missing objects and avoid interpreting reference names as format strings. [Integrity walker](https://github.com/dolthub/dolt/blob/46d8805d8556599eb0a6472892e67e3bb1e0de03/go/cmd/dolt/commands/fsck.go).

Repository-memory integrity must account for retained uncommitted/stashed state and explicitly incomplete histories rather than assuming branch heads describe all protected data. This is a scoped static traversal review, not a complete fsck, database repair or shallow-clone test. Integration fixtures are present in the inventory but were not executed or comprehensively inspected; replication/remote-server changes are outside scope.

<!-- teamagent-analysis:start -->
Analysis metadata: source [dolt](https://github.com/dolthub/dolt); analyzed commit `46d8805d8556599eb0a6472892e67e3bb1e0de03`; commit date 2026-10-31T16:46:33Z; review date 2026-11-01T11:35:43.470Z; depth screened. [Maintenance record](../analyses/repos/ai-agents-mem--dolt.md).
<!-- teamagent-analysis:end -->
