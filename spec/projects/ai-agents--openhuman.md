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

<!-- teamagent-analysis:start -->
Analysis metadata: source [openhuman](https://github.com/tinyhumansai/openhuman); analyzed commit `9d5a06c7b0216d3a496f93f1030d491d734a6bd7`; commit date 2026-10-27T23:06:39+05:30; review date 2026-10-28T09:27:32.685Z; depth screened. [Maintenance record](../analyses/repos/ai-agents--openhuman.md).
<!-- teamagent-analysis:end -->
