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
