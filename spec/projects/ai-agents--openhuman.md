# openhuman

Source: [openhuman](https://github.com/tinyhumansai/openhuman) · Category: [ai-agents](../categories/ai-agents.md)

Review depth: **inventory / README screening only**. This is an individual coverage record, not a source-code correctness audit or adoption recommendation.

Snapshot: `d0d1e51eaed715dce78e332f84010784aead84a0`; commit timestamp `2026-10-03T21:36:31+05:30`; 6,320 tracked paths.

## Scope and evidence

Upstream description excerpt (a project claim, automatically extracted from [README](https://github.com/tinyhumansai/openhuman/blob/d0d1e51eaed715dce78e332f84010784aead84a0/README.md)):

> An open-source agent harness with a Rust core: lightweight, modular, and pluggable into whatever LLM, memory, or search engine you already run. 🇺🇸  English  | 🇨🇳  简体中文  | 🇯🇵  日本語  | 🇰🇷  한국어  | 🇩🇪  Deutsch  | 🇵🇰  اردو

Build/package evidence: [Cargo.toml](https://github.com/tinyhumansai/openhuman/blob/d0d1e51eaed715dce78e332f84010784aead84a0/Cargo.toml); [app/package.json](https://github.com/tinyhumansai/openhuman/blob/d0d1e51eaed715dce78e332f84010784aead84a0/app/package.json); [app/src-tauri-mobile/Cargo.toml](https://github.com/tinyhumansai/openhuman/blob/d0d1e51eaed715dce78e332f84010784aead84a0/app/src-tauri-mobile/Cargo.toml); [app/src-tauri-mobile/package.json](https://github.com/tinyhumansai/openhuman/blob/d0d1e51eaed715dce78e332f84010784aead84a0/app/src-tauri-mobile/package.json); [crates/openhuman-app/Cargo.toml](https://github.com/tinyhumansai/openhuman/blob/d0d1e51eaed715dce78e332f84010784aead84a0/crates/openhuman-app/Cargo.toml)

License evidence: [LICENSE](https://github.com/tinyhumansai/openhuman/blob/d0d1e51eaed715dce78e332f84010784aead84a0/LICENSE) Classification hint: GPL; inspect version. A root license does not establish rights for every bundled asset, model, or dependency.

## Harness assessment

This entry was catalogued under **ai-agents**. Its category places it in the candidate set for agents, models, channels; those associations are navigational and have not been individually validated as implemented capabilities. See [agents](../agents.md) · [models](../models.md) · [channels](../channels.md) for the source-reviewed alternatives and proposed integration boundaries.

**Disposition:** retain as a comparison candidate. Before adopting it, inspect the implementation entry point and its tests, verify the required protocol and deployment platform, and reproduce a task from the harness evaluation suite. Popularity, a README feature list, and the presence of a package manifest are insufficient evidence of quality or compatibility.

**Unresolved:** runtime behavior, security boundaries, performance, API/subscription eligibility, dependency health, maintenance status, and fit to the proposed harness were not independently established for this entry. No repository code was executed as part of this screening.

## 2026-10-28 scoped source review

Source: [openhuman](https://github.com/tinyhumansai/openhuman); inspected saved discovery revision `9d5a06c7b0216d3a496f93f1030d491d734a6bd7`. Prior analyzed revision `d0d1e51eaed715dce78e332f84010784aead84a0` remains historical evidence.

**Scope:** Full CI cancellation wrapper, browser-review launcher, local-session hook and auth-state fixture tests read. Actual session classifier/store, identity restart, process-supervisor tests and browser/native acceptance behavior were not audited.

The [CI wrapper](https://github.com/tinyhumansai/openhuman/blob/9d5a06c7b0216d3a496f93f1030d491d734a6bd7/scripts/ci-cancel-aware.sh) forwards signals, uses a process group when available, escalates TERM to KILL and optionally polls the CI run for cancellation. It also tries to remove watchdog children so inherited pipes do not delay completion. These are concrete lifecycle mechanisms, but cleanup is conditioned on the root child still being alive, descendant enumeration is a snapshot and process-group escape/reparenting is not independently ruled out. The watchdog parses the first 4 KiB with text patterns, passes its bearer token in curl arguments and the wrapper prints the invoked command; trusted credential transport and argument redaction need a separate boundary.

The [local-session hook](https://github.com/tinyhumansai/openhuman/blob/9d5a06c7b0216d3a496f93f1030d491d734a6bd7/app/src/hooks/useLocalSession.ts) keeps offline sessions distinct from account-backed sessions, but managed inference availability is computed from token presence/shape, not a live entitlement or health check. Its context-free fallback does not subscribe to state changes and relies on an unread identity-change restart invariant. The [auth-state tests](https://github.com/tinyhumansai/openhuman/blob/9d5a06c7b0216d3a496f93f1030d491d734a6bd7/app/test/auth-state.test.ts) correctly reject unrecognized response shapes instead of reading them as signed out. The [browser-review launcher](https://github.com/tinyhumansai/openhuman/blob/9d5a06c7b0216d3a496f93f1030d491d734a6bd7/app/scripts/e2e-agent-review.sh) produces an artifact location and can reuse an existing build; neither artifact presence nor that launcher proves native packaging or task correctness. No CI API, processes, browser, native app or tests were executed.

## 2026-10-28 follow-up source review

Reviewed the frozen update from `9d5a06c7b0216d3a496f93f1030d491d734a6bd7` to `d12bab15be83c1d6a051c6f21cca9b3346ec3d89`. Earlier findings above remain historical evidence; this review is limited to the cited source and delta.

In [crates/openhuman-embed/src/agent/compact.rs](https://github.com/tinyhumansai/openhuman/blob/d12bab15be83c1d6a051c6f21cca9b3346ec3d89/crates/openhuman-embed/src/agent/compact.rs#L14-L95), The new compact_thread wrapper admits compaction through the agent lifecycle, checks that inference is available, derives the same route/model settings as a turn, and delegates to the core compactor. Its documented contract promises a sealed old generation, retained system/tool prefixes and a session turn lock; the wrapper itself does not implement those storage operations.

**Harness implication and limits:** Expose idle compaction as an explicit lifecycle operation with source-generation provenance and independent usage accounting. Treat the documented locking and byte preservation as requirements to verify in the core storage implementation, not guarantees established by this wrapper. Compaction may invoke a summarizer despite having no user-facing model turn; no provider call or transcript mutation was executed here. This static review does not certify other changed subsystems.

## 2026-11-01 scoped source review

Reviewed frozen commit `36ba3fde823d3c9eade965b440c72bfdba20810d` against prior analyzed commit `d12bab15be83c1d6a051c6f21cca9b3346ec3d89`. Historical reviews above remain separate evidence.

The [host-only session builder](https://github.com/tinyhumansai/openhuman/blob/36ba3fde823d3c9eade965b440c72bfdba20810d/crates/openhuman-core/src/agent/session_host/builder/host_policy.rs) becomes asynchronous and awaits the shared configured builder before marking the session host-only. The [host-only fixtures](https://github.com/tinyhumansai/openhuman/blob/36ba3fde823d3c9eade965b440c72bfdba20810d/crates/openhuman-core/src/agent/session_host/builder/builder_tests_host_only_tests.rs) and [explicit-definition fixtures](https://github.com/tinyhumansai/openhuman/blob/36ba3fde823d3c9eade965b440c72bfdba20810d/crates/openhuman-core/src/agent/session_host/builder/builder_tests_explicit_definition_tests.rs) are updated to await configuration/session construction and asynchronously supplied host tools. Their visible assertions retain no-tools behavior without a belt, explicit definition identity, and the distinction between ordinary and host-only untrusted-input admission.

This targeted delta is an initialization-contract migration, not evidence of a newly stronger sandbox. Teamagent adapters should publish a ready session only after asynchronous policy/tool construction succeeds, preserve per-session definition identity instead of silently substituting a same-name global definition, and rerun denial fixtures after lifecycle refactors. The underlying policy gate and all construction internals were not re-audited here.

**Coverage:** Read the complete targeted host policy and two builder-test deltas. Most changes are async-call migration; unchanged policy implementation and broader runtime refactor are outside scope. Source inspection only; no upstream tests, source programs or live providers were executed. This is a scoped architecture review, not a whole-repository correctness or security certification.

<!-- teamagent-analysis:start -->
Analysis metadata: source [openhuman](https://github.com/tinyhumansai/openhuman); analyzed commit `36ba3fde823d3c9eade965b440c72bfdba20810d`; commit date 2026-10-31T22:34:05+05:30; review date 2026-11-01T11:33:30.893Z; depth screened. [Maintenance record](../analyses/repos/ai-agents--openhuman.md).
<!-- teamagent-analysis:end -->
