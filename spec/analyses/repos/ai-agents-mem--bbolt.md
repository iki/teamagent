# bbolt: change evidence

Source: [bbolt](https://github.com/etcd-io/bbolt) · [Analysis](../../projects/ai-agents-mem--bbolt.md) · [memory](../../memory.md), [evolution](../../evolution.md)

Generated: 2026-10-27T18:19:07.717Z. Status: **changed**. Reviewed SHA: `4dc08f7187c709d355a8bcf334fcbcf7d7cfedf6`; commit date: 2026-09-15T04:40:46+01:00; review date: unknown; observed SHA: `a4ef19710eb7ddc41fd1155336baf331b5c57ba8`.

This generated packet is a bounded change locator, not a source review or a quality measurement. [Source comparison](https://github.com/etcd-io/bbolt/compare/4dc08f7187c709d355a8bcf334fcbcf7d7cfedf6...a4ef19710eb7ddc41fd1155336baf331b5c57ba8). Working-tree changes: false; shallow history: false; report changed since recorded review: false.

- Git discovery: unchanged; source lifecycle: active; upstream availability: available.

## Recent commits

- [a4ef19710eb7](https://github.com/etcd-io/bbolt/commit/a4ef19710eb7ddc41fd1155336baf331b5c57ba8) 2026-10-16T11:37:58+01:00: Update changelog for bucket related protection
- [4bfc851d49ea](https://github.com/etcd-io/bbolt/commit/4bfc851d49ea1e6568ffaf272319943c58f1d832) 2026-10-16T11:36:56+01:00: Prevent Bucket from being copied by value
- [7f68b2904e99](https://github.com/etcd-io/bbolt/commit/7f68b2904e99b86eaae187747aa769a50360c14c) 2026-10-15T17:05:41+01:00: Merge pull request #1283 from ahrtr/20260923_movebucket
- [d40960b0dd6e](https://github.com/etcd-io/bbolt/commit/d40960b0dd6ecb8eeed4772e0882f0e70f1841e3) 2026-10-15T14:18:39+01:00: changelog: update 1.3–1.6 changelogs with compact and sparc64 entries   - Add `### CMD` section to v1.3.13, v1.4.4, v1.5.1  with entry     for rejecting compact onto itself (PR etcd-io#1297, etcd-io#1296, etcd-io#1295, etcd-io#1286)   - Add sparc64 arch support entry (PR etcd-io#1292, etcd-io#1299) 
- [f95f8902fd16](https://github.com/etcd-io/bbolt/commit/f95f8902fd167f8086f4466994fe7537b9a30f59) 2026-10-14T15:49:59+01:00: build(deps): Bump golang.org/x/sync from 0.23.0 to 0.24.0
- [c38bb236bfa4](https://github.com/etcd-io/bbolt/commit/c38bb236bfa4863b4555a20bcf50d44bf2c9b8c5) 2026-10-14T15:19:49+01:00: Add support for sparc64 arch
- [e5042fb9c642](https://github.com/etcd-io/bbolt/commit/e5042fb9c6422fe99cf89ba59f6b762caa71d5a6) 2026-10-14T12:40:16+01:00: cmd/bbolt: reject compacting a database onto itself
- [884296fba7c3](https://github.com/etcd-io/bbolt/commit/884296fba7c3dbdbb80a7224f315fbf11f3b10fb) 2026-10-14T12:36:20+01:00: build(deps): Bump golang.org/x/sys from 0.48.0 to 0.49.0
- [80c2fe8eaec8](https://github.com/etcd-io/bbolt/commit/80c2fe8eaec8db27ae2265b2f157e5cd963ede54) 2026-10-10T18:33:14+01:00: Bump go to 1.26.9
- [75524f2eb771](https://github.com/etcd-io/bbolt/commit/75524f2eb77159a0845c70ef23dd4778b672eafc) 2026-10-07T14:03:59+01:00: Support operations after bucket move in the same transaction
- [0b4b4cd91e97](https://github.com/etcd-io/bbolt/commit/0b4b4cd91e97d696c9b6646c13dff06becf8b45d) 2026-09-24T11:26:55+01:00: Add protection into MoveBucket to prevent cyclic move

## Changed paths

- M: `.go-version`
- M: `CHANGELOG/CHANGELOG-1.3.md`
- M: `CHANGELOG/CHANGELOG-1.4.md`
- M: `CHANGELOG/CHANGELOG-1.5.md`
- A: `CHANGELOG/CHANGELOG-1.6.md`
- M: `bucket.go`
- M: `cmd/bbolt/command/command_compact.go`
- M: `cmd/bbolt/command/command_compact_test.go`
- M: `cmd/bbolt/command/errors.go`
- M: `db.go`
- M: `errors/errors.go`
- M: `go.mod`
- M: `go.sum`
- A: `internal/common/bolt_sparc64.go`
- M: `movebucket_test.go`
- M: `tx.go`
- M: `tx_check.go`
