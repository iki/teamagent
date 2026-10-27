# gastown: change evidence

Source: [gastown](https://github.com/gastownhall/gastown) · [Analysis](../../projects/ai-agents--gastown.md) · [agents](../../agents.md), [models](../../models.md), [channels](../../channels.md)

Generated: 2026-10-27T18:19:07.717Z. Status: **changed**. Reviewed SHA: `649b832b7672bc7a2dbef26f5983aba6198b819b`; commit date: 2026-07-23T09:03:02-04:00; review date: unknown; observed SHA: `de2ce8efa7aa3b1ca942b39319c5f4bd5aeac1b1`.

This generated packet is a bounded change locator, not a source review or a quality measurement. [Source comparison](https://github.com/gastownhall/gastown/compare/649b832b7672bc7a2dbef26f5983aba6198b819b...de2ce8efa7aa3b1ca942b39319c5f4bd5aeac1b1). Working-tree changes: false; shallow history: false; report changed since recorded review: false.

- Git discovery: unchanged; source lifecycle: active; upstream availability: available.

## Recent commits

- [de2ce8efa7aa](https://github.com/gastownhall/gastown/commit/de2ce8efa7aa3b1ca942b39319c5f4bd5aeac1b1) 2026-10-25T21:39:22Z: feat(deps): require Dolt 2.6.0
- [617f32a6cab7](https://github.com/gastownhall/gastown/commit/617f32a6cab7966d1b94ccdfc99a6d233f609704) 2026-10-25T03:56:35Z: build(deps): pin the dolt 2.6.0 CLI and test server in images and CI
- [b0a15184c963](https://github.com/gastownhall/gastown/commit/b0a15184c9630e9d0cbdd5caaac140ea9d1d1597) 2026-10-24T18:50:10Z: fix(config): stop agent preset registry aliasing and parallel test mutation
- [c0b37bd5e071](https://github.com/gastownhall/gastown/commit/c0b37bd5e071c16f9e285628da330b2a7dd588ab) 2026-10-24T06:26:17Z: fix(deps): bump promptfoo to 0.125.0 and refresh gt-model-eval lockfile
- [d62fb6a09218](https://github.com/gastownhall/gastown/commit/d62fb6a092186a9b3fa821cf397bb50aad7e4eb5) 2026-10-24T05:57:48Z: fix(deps): bump grpc, thrift, go-archive, x/net and OpenTelemetry for advisories
- [59784471291e](https://github.com/gastownhall/gastown/commit/59784471291eb59c8255fa7326dcf58a34c6a084) 2026-10-24T04:56:51Z: fix(deps): bump klauspost/compress and moby/sys/user for recent advisories
- [ef70b0bf9e58](https://github.com/gastownhall/gastown/commit/ef70b0bf9e588dce00708e36564bfc06b51fac2c) 2026-10-20T18:12:00Z: fix: build with Go 1.26.10 to distrust compromised eMudhra CAs

## Changed paths

- M: `.github/workflows/ci.yml`
- M: `.github/workflows/nightly-integration.yml`
- M: `.github/workflows/release.yml`
- M: `.github/workflows/update-nix-flake.yml`
- M: `.github/workflows/windows-ci.yml`
- M: `CHANGELOG.md`
- M: `Dockerfile`
- M: `Dockerfile.e2e`
- M: `docs/INSTALLING.md`
- M: `docs/SECURITY-DEPENDENCY-EXCEPTIONS.md`
- M: `docs/WASTELAND.md`
- M: `docs/docker.md`
- M: `docs/guides/mvgt-integration.md`
- M: `flake.nix`
- M: `go.mod`
- M: `go.sum`
- M: `gt-model-eval/package-lock.json`
- M: `gt-model-eval/package.json`
- M: `internal/config/agents.go`
- M: `internal/config/agents_test.go`
- M: `internal/config/loader_test.go`
- A: `internal/config/registry_isolation_test.go`
- M: `internal/deps/dolt.go`
- M: `internal/deps/dolt_test.go`
- M: `internal/telemetry/recorder.go`
- M: `internal/testutil/doltserver.go`
- M: `internal/testutil/doltserver_windows.go`
- M: `plugins/dolt-snapshots/go.mod`
- M: `scripts/test-gce-install.sh`
