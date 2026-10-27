# ax: change evidence

Source: [ax](https://github.com/google/ax) · [Analysis](../../projects/ai-agents--ax.md) · [agents](../../agents.md), [models](../../models.md), [channels](../../channels.md)

Generated: 2026-10-27T18:19:07.717Z. Status: **changed**. Reviewed SHA: `ac2332829f22360ff97b0ba34d94dd0dd782f17e`; commit date: 2026-09-27T16:54:08-07:00; review date: unknown; observed SHA: `41ec50c6398376fa510349b2089237540739d935`.

This generated packet is a bounded change locator, not a source review or a quality measurement. [Source comparison](https://github.com/google/ax/compare/ac2332829f22360ff97b0ba34d94dd0dd782f17e...41ec50c6398376fa510349b2089237540739d935). Working-tree changes: false; shallow history: false; report changed since recorded review: false.

- Git discovery: updated; source lifecycle: active; upstream availability: available.

## Recent commits

- [41ec50c63983](https://github.com/google/ax/commit/41ec50c6398376fa510349b2089237540739d935) 2026-10-27T10:46:26-07:00: README: drop command from example Task (#527)
- [38ad0b2575e5](https://github.com/google/ax/commit/38ad0b2575e512892595909891f9473f2f9352d1) 2026-10-27T10:17:20-07:00: README: describe AX as running millions of tasks per cluster (#525)
- [f73ed55146f6](https://github.com/google/ax/commit/f73ed55146f6575b1d641ff4434572fd037edd1d) 2026-10-27T06:01:36-07:00: README: use a realistic agent task in the intro example (#524)
- [6a225a341ca8](https://github.com/google/ax/commit/6a225a341ca8d336ac8f001102d3e507c33932c7) 2026-10-27T06:01:00-07:00: Add an optional google.protobuf.Struct config field to TaskSpec (#523)
- [888ae0640b08](https://github.com/google/ax/commit/888ae0640b0830858d2ad2583609ae63b17f3eb8) 2026-10-26T20:03:20-07:00: api,cli: remove WatchTask and ax watch (#522)
- [33884fa3d955](https://github.com/google/ax/commit/33884fa3d9558adc768889c8b199eafe1558069d) 2026-10-26T19:12:12-07:00: api,runner: remove the WorkspaceRef goal field and the agent bootstrap (#519)
- [2bfbcb8d2f6b](https://github.com/google/ax/commit/2bfbcb8d2f6b5c61030d2da1daada0774e61f0b4) 2026-10-26T19:03:13-07:00: server, store: move to Postgres and read actor state from Substrate (#515)
- [0f085aa063db](https://github.com/google/ax/commit/0f085aa063db6de888e37def7a8943f7901e6c1e) 2026-10-21T14:57:29-07:00: runner: ignore unknown fields in specs from the control plane (#506)
- [43439b411f01](https://github.com/google/ax/commit/43439b411f019fa975c1df12b85c7b141f0cda47) 2026-10-21T10:29:22-07:00: test: add Kind-based E2E test suite and CI workflow (#474)
- [7b3347f5a8af](https://github.com/google/ax/commit/7b3347f5a8af37676f711e750f354014a1705e24) 2026-10-20T11:08:31-07:00: fix(controller): fail task when ActorTemplate creation fails (#472)
- [d5ff120d168b](https://github.com/google/ax/commit/d5ff120d168ba6cf8376a223075c3133b12dec72) 2026-10-20T10:54:25-07:00: chore(substrate): bump github.com/agent-substrate/substrate to v0.5.0 (#484)
- [6a1d6ea8e7e6](https://github.com/google/ax/commit/6a1d6ea8e7e65d9beecc086c21e97ee6a1ffa01f) 2026-10-20T10:16:57-07:00: api,runner: bind at most one workspace per task (#496)
- [b2c59ae698af](https://github.com/google/ax/commit/b2c59ae698af4452deccef0606317dede1142fa2) 2026-10-19T17:24:28Z: feat(controller): apply Task resource limits to the ActorTemplate (#405)
- [256b58a67df9](https://github.com/google/ax/commit/256b58a67df994cdc0d384953a4020da882a7cfd) 2026-10-19T17:23:29Z: fix(cli): honor the atespace flag when applying resources (#415)
- [8888435d7e27](https://github.com/google/ax/commit/8888435d7e275f1e7ad1c127af9048b2d97ebc13) 2026-10-18T14:47:13-07:00: docs: replace the axolotl logo with axel.svg (#497)
- [8d2ccf36f194](https://github.com/google/ax/commit/8d2ccf36f194f6f58c57b90753bd3986639b562f) 2026-10-16T15:29:44-05:00: lock,cli: renew Redis lock leases and lengthen suspend/resume timeout (#490)
- [f0f16fffbec7](https://github.com/google/ax/commit/f0f16fffbec70cc423c299ef9257f483c49aceaf) 2026-10-16T10:39:34-07:00: Clean up v1alpha1 field names and drop unused fields (#485)
- [92d297e97c43](https://github.com/google/ax/commit/92d297e97c43ff381f82d83315736c270ea1bc69) 2026-10-15T21:13:56Z: feat(cli): forward stdin and Ctrl-C in ax ssh (#413)
- [397f7f27fedb](https://github.com/google/ax/commit/397f7f27fedbaec9a97da646761f943be1db0930) 2026-10-15T12:39:13-04:00: controller,substrate: handle transient Substrate unavailability without permanent Task failure (#463)
- [0126b7261d17](https://github.com/google/ax/commit/0126b7261d17fcbd285f6f7ba569857729568008) 2026-10-15T16:18:32Z: fix(cli): honour ax ssh --help and stop global flag parsing at -- (#411)
- [22954f64bb29](https://github.com/google/ax/commit/22954f64bb299632d7ef78214c716fd039e6c1cf) 2026-10-14T21:33:41-07:00: feat(runner): serve metadata endpoints on loopback only (#479)
- [0c0583cf4bf7](https://github.com/google/ax/commit/0c0583cf4bf7d2db7af70dae24a9ef2a50e2eb5f) 2026-10-14T20:29:36-07:00: Name the mascot (#481)
- [e5fbde792c04](https://github.com/google/ax/commit/e5fbde792c04ca35354d29b96bc5149d3cdc03c2) 2026-10-15T01:48:26Z: docs: add SECURITY.md with reporting process and current trust boundary (#480)
- [0cbfc3dcb3f6](https://github.com/google/ax/commit/0cbfc3dcb3f64d0f77adac728094ebc3ba0f7bd1) 2026-10-14T21:22:40Z: docs: describe review, assignment and merge conventions (#469)
- [82e9551c3a0b](https://github.com/google/ax/commit/82e9551c3a0b322b7ac20cacc9205a2451301ed6) 2026-10-14T13:10:08-07:00: fix(controller): propagate SuspendActor error during task reconciliation. (#464)
- [2e06707c0024](https://github.com/google/ax/commit/2e06707c0024bbf25a898cf304aae065639a65f6) 2026-10-14T14:12:45-05:00: fix(substrate): adapt to Substrate v0.4 API and harden actor RPCs (#457)
- [c2b2b3a1cfb5](https://github.com/google/ax/commit/c2b2b3a1cfb5a54daac04a2be86fa889bf297d27) 2026-10-14T10:36:54-07:00: Clarify Model resource concept description (#401)

## Changed paths

- A: `.github/CODEOWNERS`
- A: `.github/workflows/e2e.yml`
- M: `.github/workflows/go.yml`
- M: `.gitignore`
- M: `CONTRIBUTING.md`
- M: `DESIGN.md`
- M: `Dockerfile.task-runner`
- M: `Makefile`
- M: `README.md`
- A: `SECURITY.md`
- A: `assets/LICENSE`
- A: `assets/axel.svg`
- D: `assets/axolotl-mono.svg`
- D: `assets/axolotl.svg`
- M: `cmd/ax-server/main.go`
- A: `cmd/ax-server/main_test.go`
- D: `cmd/ax-task-runner/antigravity_bootstrap.py`
- M: `cmd/ax-task-runner/main.go`
- A: `cmd/ax-task-runner/main_test.go`
- M: `cmd/ax/apply_test.go`
- M: `cmd/ax/main.go`
- M: `cmd/ax/main_test.go`
- A: `cmd/ax/ssh_interrupt_test.go`
- M: `demo.sh`
- M: `deploy/ax-server.yaml`
- A: `deploy/postgres.yaml`
- D: `deploy/redis.yaml`
- M: `docs/concepts.md`
- M: `docs/logo.md`
- M: `docs/manifests.md`
- M: `docs/networking.md`
- M: `docs/roadmap.md`
- M: `docs/runner.md`
- M: `docs/sandbox.md`
- M: `examples/task.yaml`
- M: `go.mod`
- M: `go.sum`
- A: `hack/cleanup-e2e-kind.sh`
- A: `hack/run-e2e-kind.sh`
- A: `hack/run-e2e.sh`
- A: `hack/setup-e2e-kind.sh`
- M: `internal/controller/reconciler.go`
- M: `internal/controller/reconciler_test.go`
- M: `internal/guest/client.go`
- A: `internal/guest/client_test.go`
- M: `internal/lock/lock.go`
- M: `internal/metadata/server.go`
- M: `internal/metadata/server_test.go`
- A: `internal/server/actor_status_test.go`
- M: `internal/server/server.go`
- M: `internal/server/server_test.go`
- A: `internal/server/status_test.go`
- M: `internal/store/memory/store.go`
- A: `internal/store/postgres/lock.go`
- A: `internal/store/postgres/schema.go`
- A: `internal/store/postgres/schema.sql`
- A: `internal/store/postgres/store.go`
- A: `internal/store/postgres/store_test.go`
- D: `internal/store/redis/store.go`
- M: `internal/store/store.go`
- M: `internal/substrate/client.go`
- M: `internal/substrate/client_test.go`
- M: `internal/tunnel/tunnel.go`
- D: `internal/workspace/planner.go`
- D: `internal/workspace/planner_test.go`
- M: `internal/workspace/setup.go`
- M: `internal/workspace/setup_test.go`
- M: `pkg/apis/v1alpha1/ax.pb.go`
- M: `pkg/apis/v1alpha1/ax.proto`
- M: `pkg/apis/v1alpha1/ax_grpc.pb.go`
- A: `pkg/apis/v1alpha1/resources.go`
- A: `pkg/apis/v1alpha1/resources_test.go`
- M: `pkg/apis/v1alpha1/types.go`
- M: `pkg/apis/v1alpha1/types_test.go`
- M: `runner/runner.go`
- M: `runner/runner_test.go`
- A: `test/e2e/Dockerfile.server`
- A: `test/e2e/Dockerfile.task-runner.e2e`
- A: `test/e2e/README.md`
- A: `test/e2e/e2e_test.go`
- A: `test/e2e/harness_test.go`
- A: `test/e2e/manifests/ax-server.yaml`
- A: `test/e2e/manifests/namespace.yaml`
- A: `test/e2e/manifests/postgres.yaml`
- A: `test/e2e/manifests/workerpool.yaml`
