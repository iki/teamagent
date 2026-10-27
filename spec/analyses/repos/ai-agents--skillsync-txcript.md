# skillsync-txcript: change evidence

Source: [skillsync-txcript](https://github.com/skillsynchq/txcript) · [Analysis](../../projects/ai-agents--skillsync-txcript.md) · [agents](../../agents.md), [models](../../models.md), [channels](../../channels.md)

Generated: 2026-10-27T18:19:07.717Z. Status: **changed**. Reviewed SHA: `8cd3b0e63f797b1531a14197f41a0e9eeedec8c6`; commit date: 2026-09-28T20:00:00-07:00; review date: unknown; observed SHA: `c60e686e7ed30e67019288eed80c4be478512d64`.

This generated packet is a bounded change locator, not a source review or a quality measurement. [Source comparison](https://github.com/skillsynchq/txcript/compare/8cd3b0e63f797b1531a14197f41a0e9eeedec8c6...c60e686e7ed30e67019288eed80c4be478512d64). Working-tree changes: false; shallow history: false; report changed since recorded review: false.

- Git discovery: unchanged; source lifecycle: active; upstream availability: available.

## Recent commits

- [c60e686e7ed3](https://github.com/skillsynchq/txcript/commit/c60e686e7ed30e67019288eed80c4be478512d64) 2026-10-22T23:54:00-07:00: fix(codex): preserve interleaved text and tool call block ordering on export (#56)
- [0ec0e3f6f1ef](https://github.com/skillsynchq/txcript/commit/0ec0e3f6f1ef365401c406bc9b473cbbf04521fe) 2026-10-22T23:36:40-07:00: fix(local): resolve a duplicated session id to its most recently modified copy (#87)
- [a77e5535ba7c](https://github.com/skillsynchq/txcript/commit/a77e5535ba7c5eccbf7766e7aad88c23b577ee72) 2026-10-13T18:24:19-07:00: fix(codex): read rollouts Codex has compressed to .jsonl.zst (#85)
- [d00a71092471](https://github.com/skillsynchq/txcript/commit/d00a71092471a536eec359b7839406eb81516c69) 2026-10-12T21:10:32-07:00: chore: satisfy clippy 1.99
- [13289d537029](https://github.com/skillsynchq/txcript/commit/13289d537029ae61b98a14909be0278333046d25) 2026-10-12T20:25:10-07:00: fix(search): search one session at a time, and stop when the client does

## Changed paths

- M: `CHANGELOG.md`
- M: `Cargo.lock`
- M: `Cargo.toml`
- M: `cli/src/cache.rs`
- M: `cli/src/editpane.rs`
- M: `cli/src/lib.rs`
- M: `cli/src/mcp.rs`
- M: `cli/src/pager.rs`
- M: `cli/src/view.rs`
- A: `cli/tests/duplicate_ids.rs`
- M: `docs/formats/codex.md`
- M: `docs/usage.md`
- M: `src/harness/codex.rs`
- M: `src/harness/cowork_remote.rs`
- M: `src/harness/pi.rs`
- M: `src/local.rs`
- M: `src/search.rs`
- M: `tests/README.md`
- M: `tests/integration/codex.rs`
- M: `tests/integration/cowork.rs`
- M: `tests/integration/cursor.rs`
- M: `tests/integration/hermes.rs`
- M: `tests/integration/search.rs`
- M: `tests/integration/store_delete.rs`
- A: `tests/regression/codex_compressed.rs`
- M: `tests/regression/main.rs`
