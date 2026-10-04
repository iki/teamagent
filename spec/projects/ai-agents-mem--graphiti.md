# graphiti

Episode-grounded temporal entity relationships with explicit invalidation and entity resolution.

Source: [graphiti](https://github.com/getzep/graphiti) · Snapshot: `3c427640abf909f12f71f963fce15eb514a3c493` · Category: `ai-agents-mem`.

Evidence level: **Source-reviewed; code was read, not executed or benchmarked.** Review date: 2026-10-04. Conclusions below apply to the inspected snapshot, not an unverified latest release. License and dependency compatibility require the separate catalog/license review before adoption.

## Verified source evidence

- [graphiti_core/edges.py:263-285](https://github.com/getzep/graphiti/blob/3c427640abf909f12f71f963fce15eb514a3c493/graphiti_core/edges.py#L263-L285)
- [graphiti_core/graphiti.py:1150-1251](https://github.com/getzep/graphiti/blob/3c427640abf909f12f71f963fce15eb514a3c493/graphiti_core/graphiti.py#L1150-L1251)

EntityEdge stores the fact text, its embedding, supporting episode identifiers, a reference time, validity start/end, and a separate expiration timestamp. Episode ingestion creates a source-bearing episode, extracts entities, resolves their identities, extracts and resolves relationships, and includes invalidated relationships in the persistence path. Node attributes are hydrated using new edges so existing facts are not redundantly summarized. Community updates are an optional later step. These fields and calls are directly present in the inspected implementation.

## Harness implications

Use this model where a team needs to distinguish when a fact held from when the system learned or invalidated it: ownership, architecture decisions, project status, changing user preferences. Retain the source episode separately from extracted assertions. Time-qualified answers should choose the appropriate relation version instead of overwriting history. Entity resolution must be scoped by tenant and workspace; two projects using the same short name must not silently collapse into one entity.

## Limitations and tradeoffs

Extraction, identity matching and contradiction resolution still depend on model judgments. Temporal fields alone do not guarantee correct temporal interpretation. A graph database, extraction model and embedding service increase operational and ingest cost; optional community construction adds more work. Reading the pipeline did not establish crash atomicity across every backend or prove that all deletion paths remove every derived object. Treat graph-derived relations as attributed assertions, not unquestionable facts.

## Adoption and validation

Prototype as the temporal relationship adapter after the immutable source store and lexical baseline work. Do not require a graph for every document or code query. Acceptance tests should include corrected dates, duplicate entities across scopes, contradictory sources, out-of-order episode arrival, replayed imports and permission revocation. Evaluate benefit on relational questions separately from simple document retrieval.

Related directions: [memory](../memory.md) · [evolution](../evolution.md).
