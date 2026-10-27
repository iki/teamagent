# openeval: change evidence

Source: [openeval](https://github.com/Hona/openeval) · [Analysis](../../projects/ai-eval--openeval.md) · [evolution](../../evolution.md), [decisions](../../decisions.md)

Generated: 2026-10-27T18:19:07.717Z. Status: **changed**. Reviewed SHA: `61eeb43d7bea371d00f813500cd1cf56f9116f8d`; commit date: 2026-10-03T19:19:43+10:00; review date: unknown; observed SHA: `0aa21c8e188ff43968d1a18cefac2ac51f3eb2a2`.

This generated packet is a bounded change locator, not a source review or a quality measurement. [Source comparison](https://github.com/Hona/openeval/compare/61eeb43d7bea371d00f813500cd1cf56f9116f8d...0aa21c8e188ff43968d1a18cefac2ac51f3eb2a2). Working-tree changes: false; shallow history: false; report changed since recorded review: false.

- Git discovery: unchanged; source lifecycle: active; upstream availability: available.

## Recent commits

- [0aa21c8e188f](https://github.com/Hona/openeval/commit/0aa21c8e188ff43968d1a18cefac2ac51f3eb2a2) 2026-10-05T11:21:27+10:00: Add candidate spend caps and model-only networking (#30)
- [6ba6f534c307](https://github.com/Hona/openeval/commit/6ba6f534c3077f388cae6acaf7b8367c3072169b) 2026-10-05T10:36:21+10:00: Run candidates on OpenCode 2.0.22 (#29)
- [6d84e1aa285e](https://github.com/Hona/openeval/commit/6d84e1aa285e288d5f71e00bcf7292af98b61687) 2026-10-04T18:02:48+10:00: Retry explicit unresolved recordings without recollecting scored work (#28)
- [18d72ec2a4ad](https://github.com/Hona/openeval/commit/18d72ec2a4ad1f55abc9127b149e9c78c33bcbae) 2026-10-04T17:22:36+10:00: Replay frozen preparation when restoring candidate evidence (#27)
- [3015e70b8736](https://github.com/Hona/openeval/commit/3015e70b87364bb9809d16ccfb99202cc6625621) 2026-10-04T16:49:33+10:00: Restore completed orphan eval sessions (#26)
- [d872260c4017](https://github.com/Hona/openeval/commit/d872260c4017ce7addf200f2ebb0da102cb48aa4) 2026-10-04T15:45:46+10:00: Ignore regenerated debug comments when retaining scored judgments (#25)
- [39635871dac8](https://github.com/Hona/openeval/commit/39635871dac81eb76f340bdb1676e50653f00765) 2026-10-04T15:06:00+10:00: Refresh model display names without changing execution state (#24)
- [c843a497cd31](https://github.com/Hona/openeval/commit/c843a497cd31523215086fdb0a51c8efef9978c9) 2026-10-04T14:26:22+10:00: Preserve scores across metadata-only judge identity changes (#23)

## Changed paths

- M: `.github/workflows/check.yml`
- M: `README.md`
- M: `RELEASING.md`
- M: `bun.lock`
- M: `packages/openeval/README.md`
- M: `packages/openeval/VERIFICATION.md`
- M: `packages/openeval/package.json`
- M: `packages/openeval/src/app/eval-state.ts`
- M: `packages/openeval/src/app/input-fingerprints.test.ts`
- M: `packages/openeval/src/app/input-fingerprints.ts`
- M: `packages/openeval/src/app/load-benchmark.test.ts`
- M: `packages/openeval/src/app/load-benchmark.ts`
- A: `packages/openeval/src/app/model-name-metadata.ts`
- A: `packages/openeval/src/app/model-names-store.test.ts`
- A: `packages/openeval/src/app/model-names.test.ts`
- A: `packages/openeval/src/app/plan-retries.test.ts`
- A: `packages/openeval/src/app/plan-retries.ts`
- M: `packages/openeval/src/app/read-results.test.ts`
- M: `packages/openeval/src/app/read-results.ts`
- A: `packages/openeval/src/app/refresh-model-names.ts`
- A: `packages/openeval/src/app/restore-eval-run.test.ts`
- A: `packages/openeval/src/app/restore-eval-run.ts`
- M: `packages/openeval/src/app/retry-run.ts`
- M: `packages/openeval/src/app/run-benchmark.ts`
- M: `packages/openeval/src/app/run-eval.ts`
- M: `packages/openeval/src/app/scores.test.ts`
- M: `packages/openeval/src/app/scores.ts`
- M: `packages/openeval/src/cli.ts`
- M: `packages/openeval/src/index.ts`
- M: `packages/openeval/src/infra/containers/candidate.ts`
- M: `packages/openeval/src/infra/containers/catalog.ts`
- A: `packages/openeval/src/infra/containers/egress-proxy.test.ts`
- M: `packages/openeval/src/infra/containers/oci.ts`
- M: `packages/openeval/src/infra/containers/runtime/.dockerignore`
- M: `packages/openeval/src/infra/containers/runtime/Dockerfile`
- A: `packages/openeval/src/infra/containers/runtime/egress-proxy.mjs`
- A: `packages/openeval/src/infra/containers/runtime/model-only-network`
- M: `packages/openeval/src/infra/containers/runtime/package.json`
- M: `packages/openeval/src/infra/containers/runtime/server.mjs`
- M: `packages/openeval/src/infra/judging/agent.test.ts`
- A: `packages/openeval/src/infra/judging/code-retention.test.ts`
- M: `packages/openeval/src/infra/judging/code-source.ts`
- M: `packages/openeval/src/infra/judging/tools.ts`
- M: `packages/openeval/src/infra/opencode/session.ts`
- M: `packages/openeval/src/infra/opencode/version.ts`
- M: `packages/openeval/src/infra/recording/index.test.ts`
- A: `packages/openeval/src/infra/restore-archive.ts`
- M: `packages/openeval/src/infra/verification/integration.test.ts`
- M: `packages/openeval/src/types.ts`
- M: `packages/openeval/src/view.ts`
- M: `packages/viewer/package.json`
- M: `packages/viewer/src/model.ts`
- M: `packages/viewer/src/progress.ts`
- M: `packages/website/README.md`
- M: `packages/website/negotiation.test.ts`
- M: `packages/website/package.json`
- M: `packages/website/src/content.ts`
- M: `vendor/session-ui/package.json`
- M: `vendor/session-ui/upstream.json`
