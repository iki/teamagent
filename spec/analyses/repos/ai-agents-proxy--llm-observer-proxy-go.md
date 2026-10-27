# llm-observer-proxy-go: change evidence

Source: [llm-observer-proxy-go](https://github.com/xxyyue/llm-observer-proxy-go) · [Analysis](../../projects/ai-agents-proxy--llm-observer-proxy-go.md) · [models](../../models.md), [decisions](../../decisions.md)

Generated: 2026-10-27T18:19:07.717Z. Status: **changed**. Reviewed SHA: `dd809dfe1fd411f7eb3852353a8ac1d280643bad`; commit date: 2026-08-04T15:48:59+08:00; review date: unknown; observed SHA: `f07e370c78d4d6efc482e366edb6368bdcf292d6`.

This generated packet is a bounded change locator, not a source review or a quality measurement. [Source comparison](https://github.com/xxyyue/llm-observer-proxy-go/compare/dd809dfe1fd411f7eb3852353a8ac1d280643bad...f07e370c78d4d6efc482e366edb6368bdcf292d6). Working-tree changes: false; shallow history: false; report changed since recorded review: false.

- Git discovery: unchanged; source lifecycle: active; upstream availability: available.

## Recent commits

- [f07e370c78d4](https://github.com/xxyyue/llm-observer-proxy-go/commit/f07e370c78d4d6efc482e366edb6368bdcf292d6) 2026-10-25T21:20:15+08:00: Remove raw source payload duplication from ATIF exports
- [bbfe76fd1bcc](https://github.com/xxyyue/llm-observer-proxy-go/commit/bbfe76fd1bcc19f54e855f538ee8d179da4cebe0) 2026-10-25T19:34:57+08:00: Preserve ATIF input checkpoints and portable image assets
- [c006e44f0f09](https://github.com/xxyyue/llm-observer-proxy-go/commit/c006e44f0f09dff937fb5b8ab962ca4420585af6) 2026-10-25T17:05:38+08:00: Handle legacy buffered and repeated trajectory records
- [fdf0903e4906](https://github.com/xxyyue/llm-observer-proxy-go/commit/fdf0903e4906ca587f9b1d34a06972f3a36ab4cb) 2026-10-25T16:52:18+08:00: Add ATIF trajectory export via HTTP and CLI

## Changed paths

- M: `.github/workflows/ci.yml`
- M: `README.md`
- A: `cmd/llm-observer-proxy/export.go`
- A: `cmd/llm-observer-proxy/export_assets_test.go`
- A: `cmd/llm-observer-proxy/export_test.go`
- M: `cmd/llm-observer-proxy/main.go`
- M: `docs/CHANGELOG.md`
- M: `docs/control-plane-api.md`
- A: `docs/trajectory-export.md`
- M: `go.mod`
- M: `go.sum`
- M: `internal/control/integration_test.go`
- M: `internal/control/server.go`
- A: `internal/control/trajectory_assets_test.go`
- A: `internal/control/trajectory_test.go`
- M: `internal/observer/normalize.go`
- M: `internal/observer/observer.go`
- A: `internal/proxy/capture_test.go`
- M: `internal/proxy/dataplane.go`
- M: `internal/proxy/manager.go`
- A: `internal/trajectory/assets.go`
- A: `internal/trajectory/assets_test.go`
- A: `internal/trajectory/build.go`
- A: `internal/trajectory/compact_extra_test.go`
- A: `internal/trajectory/content.go`
- A: `internal/trajectory/content_test.go`
- A: `internal/trajectory/context.go`
- A: `internal/trajectory/context_test.go`
- A: `internal/trajectory/metrics.go`
- A: `internal/trajectory/parse.go`
- A: `internal/trajectory/read.go`
- A: `internal/trajectory/trajectory_test.go`
- A: `internal/trajectory/types.go`
- A: `scripts/validate_atif.py`
