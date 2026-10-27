# mentisdb

Typed append-only memory records with hash chaining, explicit relations and derived-index synchronization.

Source: [mentisdb](https://github.com/CloudLLM-ai/mentisdb) · Snapshot: `4c9b95041da68c5a26dece9f8776ff54b05b910c` · Category: `ai-agents-mem`.

Evidence level: **Source-reviewed; code was read, not executed or benchmarked.** Review date: 2026-10-04. Conclusions below apply to the inspected snapshot, not an unverified latest release. License and dependency compatibility require the separate catalog/license review before adoption.

## Verified source evidence

- [src/lib.rs:5071-5149](https://github.com/CloudLLM-ai/mentisdb/blob/4c9b95041da68c5a26dece9f8776ff54b05b910c/src/lib.rs#L5071-L5149)
- [src/lib.rs:5180-5244](https://github.com/CloudLLM-ai/mentisdb/blob/4c9b95041da68c5a26dece9f8776ff54b05b910c/src/lib.rs#L5180-L5244)

Appending validates references and translates referenced indices into typed relations with validity timestamps. Optional deduplication compares normalized token sets against a bounded recent window using Jaccard similarity; a sufficient match adds a Supersedes relation. The record includes agent identity, confidence, importance, source episode and the previous record hash. The implementation computes a new hash, writes the record to durable storage, updates in-memory lexical/query indexes, records invalidating relations, and synchronizes vector sidecars and registries.

## Harness implications

The key reusable idea is durable evidence before derived views. Store human inputs, observable tool events and public agent conclusions as attributed records, then build searchable projections. A correction should append an explicit relationship to the earlier claim rather than erase the history. Hash chaining can detect some tampering when a trusted checkpoint exists, but it does not establish that an agent's assertion is true. Do not interpret the project's term thought as permission to retain hidden model chain-of-thought.

## Limitations and tradeoffs

Jaccard similarity is lexical similarity, not proof of semantic equivalence or supersession; near-identical statements can disagree through negation or a changed number. Automatically marking such a record superseded could hide useful evidence. Storage succeeds before several derived-index operations that may fail, so callers need reconciliation and idempotency semantics rather than assuming a returned error means nothing was written. An in-memory chain and sidecars need workload-specific scale testing.

## Adoption and validation

Borrow the event-log and correction-relationship design; evaluate the database as an optional local implementation. Disable automatic supersession until validated on the actual corpus. Test crash after durable append, duplicate client retries, invalid references, sidecar failure, replay integrity, contradictory near-duplicates and tenant separation. Keep deletion/redaction policy explicit because append-only auditability and erasure requirements need deliberate reconciliation.

Related directions: [memory](../memory.md) · [evolution](../evolution.md) · [agents](../agents.md).
