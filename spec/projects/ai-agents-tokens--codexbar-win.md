# codexbar-win

Source: [codexbar-win](https://github.com/nesszer/Win-CodexBar) · Category: [ai-agents-tokens](../categories/ai-agents-tokens.md)

Review depth: **inventory / README screening only**. This is an individual coverage record, not a source-code correctness audit or adoption recommendation.

Snapshot: `d5ef504d62d05b6660f1b78c65bcc679badef8e7`; commit timestamp `2026-10-04T02:13:05+07:00`; 1,205 tracked paths.

## Scope and evidence

Upstream description excerpt (a project claim, automatically extracted from [README](https://github.com/nesszer/Win-CodexBar/blob/d5ef504d62d05b6660f1b78c65bcc679badef8e7/README.md)):

> English | 简体中文 | 繁體中文（臺灣） | 日本語 | 한국어 | Español mexicano | Português (Brasil) | Türkçe Win-CodexBar is a Windows system-tray app for keeping AI coding-tool usage visible without opening a dozen dashboards. It ports the spirit of CodexBar to a Tauri + React desktop shell backed by shared Rust provider logic.

Build/package evidence: [Cargo.toml](https://github.com/nesszer/Win-CodexBar/blob/d5ef504d62d05b6660f1b78c65bcc679badef8e7/Cargo.toml); [apps/desktop-tauri/package.json](https://github.com/nesszer/Win-CodexBar/blob/d5ef504d62d05b6660f1b78c65bcc679badef8e7/apps/desktop-tauri/package.json); [apps/desktop-tauri/src-tauri/Cargo.toml](https://github.com/nesszer/Win-CodexBar/blob/d5ef504d62d05b6660f1b78c65bcc679badef8e7/apps/desktop-tauri/src-tauri/Cargo.toml); [rust/Cargo.toml](https://github.com/nesszer/Win-CodexBar/blob/d5ef504d62d05b6660f1b78c65bcc679badef8e7/rust/Cargo.toml)

License evidence: [LICENSE](https://github.com/nesszer/Win-CodexBar/blob/d5ef504d62d05b6660f1b78c65bcc679badef8e7/LICENSE) Classification hint: MIT. A root license does not establish rights for every bundled asset, model, or dependency.

## Harness assessment

This entry was catalogued under **ai-agents-tokens**. Its category places it in the candidate set for models, evolution; those associations are navigational and have not been individually validated as implemented capabilities. See [models](../models.md) · [evolution](../evolution.md) for the source-reviewed alternatives and proposed integration boundaries.

**Disposition:** retain as a comparison candidate. Before adopting it, inspect the implementation entry point and its tests, verify the required protocol and deployment platform, and reproduce a task from the harness evaluation suite. Popularity, a README feature list, and the presence of a package manifest are insufficient evidence of quality or compatibility.

**Unresolved:** runtime behavior, security boundaries, performance, API/subscription eligibility, dependency health, maintenance status, and fit to the proposed harness were not independently established for this entry. No repository code was executed as part of this screening.

## Source update reviewed 2026-10-28

Reviewed commit: [`31b10ce42993d3be2f041e169e82ef174d24c7ec`](https://github.com/nesszer/Win-CodexBar/commit/31b10ce42993d3be2f041e169e82ef174d24c7ec). Scope: Full HTTP proxy settings/embedded tests, shared host-session helpers and Codex directory discovery/tests read. Cost parsers, account ownership, credential reads and native packaging were not audited.

The [HTTP proxy adapter](https://github.com/nesszer/Win-CodexBar/blob/31b10ce42993d3be2f041e169e82ef174d24c7ec/rust/src/core/http_proxy.rs) validates HTTP(S) scheme/host and distinguishes disabled settings from configured credentials. Invalid enabled configuration explicitly calls no_proxy and continues directly; this is a convenience fallback, not an enforceable egress requirement. The settings type derives Debug while containing the password, and accepts URL userinfo, so callers must avoid diagnostic exposure and use protected credential storage. Reject direct fallback when Teamagent policy requires a proxy.

The [session discovery helper](https://github.com/nesszer/Win-CodexBar/blob/31b10ce42993d3be2f041e169e82ef174d24c7ec/rust/src/codex_sessions.rs) respects explicit roots and searches WSL distro home/root directories, deduplicating paths by lowercased spelling. That is discovery rather than authorization and can conflate case-sensitive paths; reading another discovered user's data still needs scope/ownership checks. The [host helper](https://github.com/nesszer/Win-CodexBar/blob/31b10ce42993d3be2f041e169e82ef174d24c7ec/rust/src/host/session.rs) keeps unsupported GUI-session reasons explicit and provides CLI guidance, but does not prove packaged desktop behavior. No credentials, session directories, proxy, native app or tests were accessed/executed.

## Follow-up change review — 2026-10-28

**Compact quota rendering retains estimate and unknown-state distinctions.** Reviewed commit `86ed0ae1b9ee97306b80daebd75666d29fe8c5f9` (commit date `2026-10-28T14:48:46+07:00`), compared with `31b10ce42993d3be2f041e169e82ef174d24c7ec`. The complete no-rename Git path inventory contains 1 changed paths.

The tray renderer replaces a filled square with outlined glyphs and chooses the largest fitting text scale. NaN still uses an unknown marker, estimated values retain their tilde, and error outlines use different alpha. Pixel fixtures check full-scale percentage rows, transparent background, outline boundaries and estimated-versus-exact output. The change concerns display legibility; it does not alter provider quota collection or prove real taskbar accessibility.

Evidence: [rust/src/tray/render.rs:375-466](https://github.com/nesszer/Win-CodexBar/blob/86ed0ae1b9ee97306b80daebd75666d29fe8c5f9/rust/src/tray/render.rs#L375-L466) · [rust/src/tray/render.rs:619-668](https://github.com/nesszer/Win-CodexBar/blob/86ed0ae1b9ee97306b80daebd75666d29fe8c5f9/rust/src/tray/render.rs#L619-L668).

**Harness consequence:** Preserve measured, estimated and unavailable status when compressing telemetry into small surfaces. Validate rendering separately from the provenance and freshness of the values displayed.

**Scope and limits:** Reviewed the complete one-file renderer delta and its pixel fixtures; no native tray session was run. This is a scoped static comparison, not a whole-project correctness or security audit. Upstream tests were read where cited, not run; no upstream code, service, model or provider operation was executed. Historical findings above remain evidence at their own revisions.

## 2026-11-01 scoped source review

Reviewed commit `1d3c1305bfb643b6ea643d176bdc31c381ba27b1` (commit date `2026-10-29T14:28:51+07:00`), compared with `86ed0ae1b9ee97306b80daebd75666d29fe8c5f9`. Earlier observations remain historical evidence.

**Scope:** Codex pace-capability change and complete related duration-selection fixtures. Live provider responses, account entitlement, credential access, pricing and native packaging were not checked.

The [Codex provider declaration](https://github.com/nesszer/Win-CodexBar/blob/1d3c1305bfb643b6ea643d176bdc31c381ba27b1/rust/src/providers/codex/mod.rs) selects a fixed-duration reset-window capability. [Pace fixtures](https://github.com/nesszer/Win-CodexBar/blob/1d3c1305bfb643b6ea643d176bdc31c381ba27b1/rust/src/core/pace_capability.rs) use a reported 43,200-minute window rather than inferring a calendar month, test the resulting elapsed-window fraction and reject selection of session, weekly or calendar-derived alternatives. Source comments attribute the duration to observed provider responses; this review did not independently authenticate an account or establish current plan coverage.

**Teamagent implication (inference):** Preserve provider-reported window duration, reset instant and observation date separately from human labels and derived pace. Treat pace as a forecast with an explicit denominator, not an entitlement or cost guarantee. Unknown or incompatible windows should remain unavailable instead of borrowing another quota's period.

**Verification limit:** committed-source inspection only; no upstream code, tests or provider calls were executed. Review scope is the cited implementation or authored guidance, not whole-project correctness, licensing clearance or measured performance. Source passages were redacted for review; exact URL literals were not byte-validated.

<!-- teamagent-analysis:start -->
Analysis metadata: source [codexbar-win](https://github.com/nesszer/Win-CodexBar); analyzed commit `1d3c1305bfb643b6ea643d176bdc31c381ba27b1`; commit date 2026-10-29T14:28:51+07:00; review date 2026-11-01T11:35:43.470Z; depth screened. [Maintenance record](../analyses/repos/ai-agents-tokens--codexbar-win.md).
<!-- teamagent-analysis:end -->
