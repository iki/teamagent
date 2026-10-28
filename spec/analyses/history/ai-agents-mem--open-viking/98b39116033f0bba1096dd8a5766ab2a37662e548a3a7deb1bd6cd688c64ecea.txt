# open-viking

Central context assembly with quotas, deduplication, tiered detail and bounded materialization.

Source: [open-viking](https://github.com/volcengine/OpenViking) · Snapshot: `9d9bc85e1f6a15afa7f23b0d7bf114a7c61cad14` · Category: `ai-agents-mem`.

Evidence level: **Source-reviewed; code was read, not executed or benchmarked.** Review date: 2026-10-04. Conclusions below apply to the inspected snapshot, not an unverified latest release. License and dependency compatibility require the separate catalog/license review before adoption.

## Verified source evidence

- [openviking/retrieve/context_assembler/pipeline.py:54-170](https://github.com/volcengine/OpenViking/blob/9d9bc85e1f6a15afa7f23b0d7bf114a7c61cad14/openviking/retrieve/context_assembler/pipeline.py#L54-L170)

The assembly path validates request options, normalizes quotas and penalties, optionally loads a session for query expansion or turn-based deduplication, and obtains an account-scoped planner when needed. It loads a recall ledger and excludes cooled-down URIs. Candidate fan-out runs inside a request-scoped embedding cache. After retrieval, it prefetches bodies only when the planned detail tier needs them, computes a per-entry cap from the overall token budget, plans entries and renders the result. Optional rewriting is separately enabled and account-resolved.

## Harness implications

This is a strong reference for the harness context compiler: retrieval, selection, body loading and rendering are different operations. Compile a task-specific packet with category quotas, source identities, selected detail level and exact token accounting. Keep a ledger of recently supplied resources to avoid repeatedly spending context on unchanged content. Share in-flight embeddings for identical request-local queries. Skills, episodic notes and reference documents can use one assembly interface while retaining different trust and permission semantics.

## Limitations and tradeoffs

A deduplication cooldown can hide information still needed after compaction or a model switch, so reuse decisions must consider what the current model actually received. Detail degradation and rewritten digests can omit critical constraints. Query planner availability depends on account configuration, and the code distinguishes some unavailable-planner failures from normal operation. This review establishes the assembly mechanics, not all storage isolation, resource import or learning guarantees advertised by the project.

## Adoption and validation

Borrow the context-assembly boundary even if the underlying stores differ. Make the selected evidence manifest inspectable and preserve a route back to full source. Start with deterministic tier selection and optional rewriting. Test small token budgets, repeated turns, model changes, ambiguous intent, planner failure, oversized abstracts and permission changes between candidate retrieval and body fetch.

Related directions: [memory](../memory.md) · [skills](../skills.md) · [evolution](../evolution.md) · [models](../models.md).
