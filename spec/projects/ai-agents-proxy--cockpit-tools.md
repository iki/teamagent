# cockpit-tools

Source: [cockpit-tools](https://github.com/jlcodes99/cockpit-tools) · Category: [ai-agents-proxy](../categories/ai-agents-proxy.md)

Review depth: **inventory / README screening only**. This is an individual coverage record, not a source-code correctness audit or adoption recommendation.

Snapshot: `2d0f13f9e2b1c7a2b30bab08b3805829808aa85f`; commit timestamp `2026-10-01T17:54:42Z`; 3,198 tracked paths.

## Scope and evidence

Upstream description excerpt (a project claim, automatically extracted from [README](https://github.com/jlcodes99/cockpit-tools/blob/2d0f13f9e2b1c7a2b30bab08b3805829808aa85f/README.md)):

> 一款**通用的 AI IDE 账号管理工具**，目前支持 **Antigravity IDE**、**Codex**、**GitHub Copilot**、**Windsurf**、**Kiro**、**Cursor**、**Grok CLI**、**CodeBuddy**、**CodeBuddy CN**、**Qoder**、**Trae**、**TRAE SOLO**、**Trae CN**、**TRAE SOLO CN**、**Zed** 和 **ZCode**，并支持多账号多实例并行运行。 本工具旨在帮助用户高效管理多个 AI IDE 账号，支持一键切换、配额监控、自动唤醒与应用多开并行运行，助您充分利用不同账号的资源。

Build/package evidence: [Cargo.toml](https://github.com/jlcodes99/cockpit-tools/blob/2d0f13f9e2b1c7a2b30bab08b3805829808aa85f/Cargo.toml); [crates/cockpit-cli/Cargo.toml](https://github.com/jlcodes99/cockpit-tools/blob/2d0f13f9e2b1c7a2b30bab08b3805829808aa85f/crates/cockpit-cli/Cargo.toml); [crates/cockpit-core/Cargo.toml](https://github.com/jlcodes99/cockpit-tools/blob/2d0f13f9e2b1c7a2b30bab08b3805829808aa85f/crates/cockpit-core/Cargo.toml); [package.json](https://github.com/jlcodes99/cockpit-tools/blob/2d0f13f9e2b1c7a2b30bab08b3805829808aa85f/package.json); [sidecars/cockpit-cliproxy/go.mod](https://github.com/jlcodes99/cockpit-tools/blob/2d0f13f9e2b1c7a2b30bab08b3805829808aa85f/sidecars/cockpit-cliproxy/go.mod)

License evidence: No root license file identified; reuse rights unverified. Classification hint: not classified; inspect source. A root license does not establish rights for every bundled asset, model, or dependency.

## Harness assessment

This entry was catalogued under **ai-agents-proxy**. Its category places it in the candidate set for models, decisions; those associations are navigational and have not been individually validated as implemented capabilities. See [models](../models.md) · [decisions](../decisions.md) for the source-reviewed alternatives and proposed integration boundaries.

**Disposition:** retain as a comparison candidate. Before adopting it, inspect the implementation entry point and its tests, verify the required protocol and deployment platform, and reproduce a task from the harness evaluation suite. Popularity, a README feature list, and the presence of a package manifest are insufficient evidence of quality or compatibility.

**Unresolved:** runtime behavior, security boundaries, performance, API/subscription eligibility, dependency health, maintenance status, and fit to the proposed harness were not independently established for this entry. No repository code was executed as part of this screening.

## Source update reviewed 2026-10-28

Reviewed commit: [`2cfe5e51314bfc0bf70bdda1ba08aed82c7dc8bf`](https://github.com/jlcodes99/cockpit-tools/commit/2cfe5e51314bfc0bf70bdda1ba08aed82c7dc8bf). Scope: Focused review of account-proxy eligibility, card projection, removal/reload implementation and the complete 77-line removal regression suite. Other 1,667 changed paths not fully reviewed.

The [removal helper](https://github.com/jlcodes99/cockpit-tools/blob/2cfe5e51314bfc0bf70bdda1ba08aed82c7dc8bf/src/utils/codexProxyRemoval.ts) separates committed deletion from refresh completion, always rereads account/target projections after partial deletion, and retains a successful catalog result so a refresh retry need not delete twice. [Tests](https://github.com/jlcodes99/cockpit-tools/blob/2cfe5e51314bfc0bf70bdda1ba08aed82c7dc8bf/src/utils/codexProxyRemoval.test.ts) cover partial unbinding, failed projection reads and waiting for all refreshes. The [card projection](https://github.com/jlcodes99/cockpit-tools/blob/2cfe5e51314bfc0bf70bdda1ba08aed82c7dc8bf/src/utils/codexProxyDisplay.ts) also distinguishes saved bindings from live running nodes. Adopt the mutation-versus-projection distinction and truthful partial results, adding durable operation identity for crash recovery because this helper's progress is only in memory. These UI predicates are not server authorization. Native OAuth, credential handling, network kernels, subscription eligibility and packaged behavior remain unaudited in this update; no source tests or application were executed.


## Source update reviewed 2026-11-01

Reviewed commit [`3edfff631a57244ebafde75dc6f7d02ffb6ad7ba`](https://github.com/jlcodes99/cockpit-tools/commit/3edfff631a57244ebafde75dc6f7d02ffb6ad7ba), compared with `2cfe5e51314bfc0bf70bdda1ba08aed82c7dc8bf`.

The selected [quota scheduler](https://github.com/jlcodes99/cockpit-tools/blob/3edfff631a57244ebafde75dc6f7d02ffb6ad7ba/src-tauri/src/modules/codex_quota_refresh_scheduler.rs) adds device-restriction checks inside background refresh operations, including the shared worker, rather than making duplicate/cancelled callers repeat storage reads. The current [README](https://github.com/jlcodes99/cockpit-tools/blob/3edfff631a57244ebafde75dc6f7d02ffb6ad7ba/README.en.md) describes migration from selectable Go/Rust engines to Rust-only service execution. The inspected deletion of the old Go cooldown module is historical evidence, not the active implementation or proof that quota protection disappeared.

README claims about account continuity, voice routing and signed macOS releases remain upstream statements: account-crossing ciphertext acceptance, provider entitlements, actual package signatures and microphone availability were not tested here. Teamagent should preserve explicit account/model admission and observed completion across adapter changes; a transport-compatible route is not permission to reuse subscription credentials or upload voice data. The current scheduler diff was fully read; two oversized README lines were explicitly omitted and the broader 2,444-path update was not exhaustively audited. No upstream service, model, account or native application was executed.

<!-- teamagent-analysis:start -->
Analysis metadata: source [cockpit-tools](https://github.com/jlcodes99/cockpit-tools); analyzed commit `3edfff631a57244ebafde75dc6f7d02ffb6ad7ba`; commit date 2026-11-01T07:57:26Z; review date 2026-11-01T11:35:43.470Z; depth screened. [Maintenance record](../analyses/repos/ai-agents-proxy--cockpit-tools.md).
<!-- teamagent-analysis:end -->
