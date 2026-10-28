# omnigraph

Source: [omnigraph](https://github.com/ModernRelay/omnigraph) · Category: [ai-agents-mem](../categories/ai-agents-mem.md)

Review depth: **inventory / README screening only**. This is an individual coverage record, not a source-code correctness audit or adoption recommendation.

Snapshot: `10a3dc53a392e061aff0dc8fd21d54b6268bdef3`; commit timestamp `2026-10-03T19:51:03Z`; 1,035 tracked paths.

## Scope and evidence

Upstream description excerpt (a project claim, automatically extracted from [README](https://github.com/ModernRelay/omnigraph/blob/10a3dc53a392e061aff0dc8fd21d54b6268bdef3/README.md)):

> Lakehouse graph database for context assembly &amp; multi-agent coordination Multimodal retrieval · Git-style branching · object-storage native

Build/package evidence: [Cargo.toml](https://github.com/ModernRelay/omnigraph/blob/10a3dc53a392e061aff0dc8fd21d54b6268bdef3/Cargo.toml); [crates/omnigraph-api-types/Cargo.toml](https://github.com/ModernRelay/omnigraph/blob/10a3dc53a392e061aff0dc8fd21d54b6268bdef3/crates/omnigraph-api-types/Cargo.toml); [crates/omnigraph-azure-admission/Cargo.toml](https://github.com/ModernRelay/omnigraph/blob/10a3dc53a392e061aff0dc8fd21d54b6268bdef3/crates/omnigraph-azure-admission/Cargo.toml); [crates/omnigraph-bench/Cargo.toml](https://github.com/ModernRelay/omnigraph/blob/10a3dc53a392e061aff0dc8fd21d54b6268bdef3/crates/omnigraph-bench/Cargo.toml); [crates/omnigraph-catalog/Cargo.toml](https://github.com/ModernRelay/omnigraph/blob/10a3dc53a392e061aff0dc8fd21d54b6268bdef3/crates/omnigraph-catalog/Cargo.toml)

License evidence: [LICENSE](https://github.com/ModernRelay/omnigraph/blob/10a3dc53a392e061aff0dc8fd21d54b6268bdef3/LICENSE) Classification hint: MIT. A root license does not establish rights for every bundled asset, model, or dependency.

## Harness assessment

This entry was catalogued under **ai-agents-mem**. Its category places it in the candidate set for memory, evolution; those associations are navigational and have not been individually validated as implemented capabilities. See [memory](../memory.md) · [evolution](../evolution.md) for the source-reviewed alternatives and proposed integration boundaries.

**Disposition:** retain as a comparison candidate. Before adopting it, inspect the implementation entry point and its tests, verify the required protocol and deployment platform, and reproduce a task from the harness evaluation suite. Popularity, a README feature list, and the presence of a package manifest are insufficient evidence of quality or compatibility.

**Unresolved:** runtime behavior, security boundaries, performance, API/subscription eligibility, dependency health, maintenance status, and fit to the proposed harness were not independently established for this entry. No repository code was executed as part of this screening.


## Change review - 2026-10-28

**Persisted adjacency indexes verify snapshot identity and payload structure independently.** Reviewed commit `aee2a02ab0773ebe8844853604bac3a66eac830a` (commit date `2026-10-27T14:20:32Z`). Compared with `10a3dc53a392e061aff0dc8fd21d54b6268bdef3`; the complete Git comparison contains 1433 changed paths.

The persisted graph-index loader uses the owning handle's storage adapter and a 4 GiB read ceiling, checks format/header bounds, matches requested table stamps to the live snapshot, hashes payload bytes and then decodes. Section preludes are cross-checked against header names/stamps; dictionaries bound capacity hints by section size, adjacency endpoints/offset counts are checked and trailing bytes or a stamped edge without adjacency are rejected. A digest alone is correctly not treated as proof of internal consistency.

Read/validation failures become cache misses with logs so callers can rebuild. Save serializes the complete index and delegates one write_bytes call; this module does not establish atomic replacement, concurrent-writer ownership, or a matching write-size admission limit. The 4 GiB transport ceiling still permits substantial decoded allocation. The server's generic JSON/query/path extractors preserve structured 400/413/415 errors but interpolate underlying rejection text, so typed error shape does not itself establish redaction. Its source-scanning fixture is a structural heuristic, not runtime request acceptance.

Evidence: [crates/omnigraph/src/graph_index/persist.rs:70-87](https://github.com/ModernRelay/omnigraph/blob/aee2a02ab0773ebe8844853604bac3a66eac830a/crates/omnigraph/src/graph_index/persist.rs#L70-L87) · [crates/omnigraph/src/graph_index/persist.rs:349-599](https://github.com/ModernRelay/omnigraph/blob/aee2a02ab0773ebe8844853604bac3a66eac830a/crates/omnigraph/src/graph_index/persist.rs#L349-L599) · [crates/omnigraph/src/graph_index/persist.rs:606-664](https://github.com/ModernRelay/omnigraph/blob/aee2a02ab0773ebe8844853604bac3a66eac830a/crates/omnigraph/src/graph_index/persist.rs#L606-L664) · [crates/omnigraph-server/src/extract.rs:1-159](https://github.com/ModernRelay/omnigraph/blob/aee2a02ab0773ebe8844853604bac3a66eac830a/crates/omnigraph-server/src/extract.rs#L1-L159).

**Harness consequence:** Use independent snapshot, digest, structural and coverage checks for derived indexes, with stricter workload-specific encoded/decoded limits. Preserve cache rejection reasons in operational receipts, reserve rebuild resources and verify adapter publication guarantees. Validate and redact transport errors semantically and test actual request limits/authentication separately from a source lint fixture.

**Scope and limits:** Static scoped graph-index read/validation/publication and request-extractor review within the 1,433-path comparison. Storage adapter atomicity, complete graph authorization, adjacency constructor internals and runtime/large-artifact tests were not audited or executed.

## Follow-up change review — 2026-10-28

**Import admission partitions memory before parsing, with explicit accounting limits.** Reviewed commit `dc4a79d3d6b7e17d366a94ff5afb9512aeba78cb` (commit date `2026-10-28T02:58:11+01:00`), compared with `aee2a02ab0773ebe8844853604bac3a66eac830a`. The complete no-rename Git path inventory contains 31 changed paths.

The new load budget carves remaining capacity into per-partition and holder shares, charges with checked atomic addition and derives the minimum admitting limit for a refusal. Sink charges are counted elsewhere and deliberately never refused by this share object; therefore the helper is not by itself a whole-process memory ceiling. The CSV fixture expects low-budget overwrite rejection to preserve the seed row, then admits the same input with a larger budget.

Evidence: [crates/omnigraph/src/engine/operators/load_budget.rs:19-97](https://github.com/ModernRelay/omnigraph/blob/dc4a79d3d6b7e17d366a94ff5afb9512aeba78cb/crates/omnigraph/src/engine/operators/load_budget.rs#L19-L97) · [crates/omnigraph/src/engine/operators/load_budget.rs:105-169](https://github.com/ModernRelay/omnigraph/blob/dc4a79d3d6b7e17d366a94ff5afb9512aeba78cb/crates/omnigraph/src/engine/operators/load_budget.rs#L105-L169) · [crates/omnigraph/src/engine/operators/load_budget.rs:173-269](https://github.com/ModernRelay/omnigraph/blob/dc4a79d3d6b7e17d366a94ff5afb9512aeba78cb/crates/omnigraph/src/engine/operators/load_budget.rs#L173-L269) · [crates/omnigraph-gqt/cases/load_csv_memory_admission_refuses_before_the_parse.gqt:114-141](https://github.com/ModernRelay/omnigraph/blob/dc4a79d3d6b7e17d366a94ff5afb9512aeba78cb/crates/omnigraph-gqt/cases/load_csv_memory_admission_refuses_before_the_parse.gqt#L114-L141).

**Harness consequence:** Reserve import memory before parsing or destructive publication and make ownership of every charged allocation explicit. Preserve the prior version on admission failure and distinguish deterministic per-partition bounds from global memory enforcement.

**Scope and limits:** Reviewed the load-budget helper, its arithmetic/concurrency tests and admission fixture; OIDC changes and the full execution pipeline remain outside this review. This is a scoped static comparison, not a whole-project correctness or security audit. Upstream tests were read where cited, not run; no upstream code, service, model or provider operation was executed. Historical findings above remain evidence at their own revisions.

<!-- teamagent-analysis:start -->
Analysis metadata: source [omnigraph](https://github.com/ModernRelay/omnigraph); analyzed commit `dc4a79d3d6b7e17d366a94ff5afb9512aeba78cb`; commit date 2026-10-28T02:58:11+01:00; review date 2026-10-28T14:52:35.205Z; depth screened. [Maintenance record](../analyses/repos/ai-agents-mem--omnigraph.md).
<!-- teamagent-analysis:end -->
