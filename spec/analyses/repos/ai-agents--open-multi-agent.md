# open-multi-agent: change evidence

Source: [open-multi-agent](https://github.com/JackChen-me/open-multi-agent) · [Analysis](../../projects/ai-agents--open-multi-agent.md) · [agents](../../agents.md), [models](../../models.md), [channels](../../channels.md)

Generated: 2026-10-27T18:19:07.717Z. Status: **changed**. Reviewed SHA: `3563a9312b304fffca49873c0dcf6c3b259a0f58`; commit date: 2026-10-03T00:26:29+08:00; review date: unknown; observed SHA: `009bdbe079a9dfa00ec1ae5819b79000a2889135`.

This generated packet is a bounded change locator, not a source review or a quality measurement. [Source comparison](https://github.com/JackChen-me/open-multi-agent/compare/3563a9312b304fffca49873c0dcf6c3b259a0f58...009bdbe079a9dfa00ec1ae5819b79000a2889135). Working-tree changes: false; shallow history: false; report changed since recorded review: false.

- Git discovery: unchanged; source lifecycle: active; upstream availability: available.

## Recent commits

- [009bdbe079a9](https://github.com/JackChen-me/open-multi-agent/commit/009bdbe079a9dfa00ec1ae5819b79000a2889135) 2026-10-24T11:41:14+08:00: fix(release-bot): stop when the lockfile nests a published workspace copy (#641)
- [12d7e4ee3501](https://github.com/JackChen-me/open-multi-agent/commit/12d7e4ee3501f85686d546a26945a0659c1b292e) 2026-10-24T10:36:09+08:00: feat(core): accept Zod 4 schemas alongside Zod 3 (#640)
- [8cb66e0cf098](https://github.com/JackChen-me/open-multi-agent/commit/8cb66e0cf098387fd1180aa34fced0cffd0621e0) 2026-10-24T10:21:34+08:00: fix(core): bound validation issue reports sent to the model (#639)
- [5ee9aae9f3c0](https://github.com/JackChen-me/open-multi-agent/commit/5ee9aae9f3c0c35a973b8560970629da42fa424d) 2026-10-24T00:05:03+08:00: chore: release core v1.22.0 and create-oma-app v0.8.11 (#638)
- [88c1fa457860](https://github.com/JackChen-me/open-multi-agent/commit/88c1fa457860fa1e2134221bc21521356f7de3de) 2026-10-23T23:41:06+08:00: fix(release-bot): record deterministic bump overrides before review (#636)
- [28c75be94d38](https://github.com/JackChen-me/open-multi-agent/commit/28c75be94d38d4489ddcfb2eebfe4292970a4b3b) 2026-10-23T22:45:30+08:00: docs: record Team.addTask option fix and credit contributor (#634)
- [331274790969](https://github.com/JackChen-me/open-multi-agent/commit/3312747909698e5edb42e72e57f593277c510778) 2026-10-23T22:27:18+08:00: fix(core): preserve task options in Team.addTask (#633)
- [a938c2a55ddb](https://github.com/JackChen-me/open-multi-agent/commit/a938c2a55ddb014b2d03a52c7cab217926a66356) 2026-10-21T02:36:05+08:00: feat(minimax): default new configurations to M3.1 Flash (#631)
- [4dfa29dd1332](https://github.com/JackChen-me/open-multi-agent/commit/4dfa29dd13323d6c3cbf89e6c1e4ea57343c6716) 2026-10-19T14:24:57+08:00: docs: simplify README feature summaries and quick starts (#630)
- [fa7e65267a57](https://github.com/JackChen-me/open-multi-agent/commit/fa7e65267a57f280b63a90ad81ee7699dec3ca9f) 2026-10-18T21:38:47+08:00: docs: add OrchestrAI to bilingual user showcase (#629)
- [39eecb269746](https://github.com/JackChen-me/open-multi-agent/commit/39eecb269746f939182e4235b84e1ebacbc2d4bb) 2026-10-17T00:00:52+08:00: chore: release core v1.21.3 and create-oma-app v0.8.10 (#627)
- [d4084ef803c4](https://github.com/JackChen-me/open-multi-agent/commit/d4084ef803c4cfb9b241e5545b2ff236ceb2603e) 2026-10-16T10:42:32+08:00: fix(core): resolve dangling symlinks in the filesystem sandbox check (#626)
- [6ec5498643c7](https://github.com/JackChen-me/open-multi-agent/commit/6ec5498643c7e431aa66751f17f47a529e7f927c) 2026-10-10T03:23:19+08:00: chore: release core v1.21.2 and create-oma-app v0.8.9 (#625)
- [d1291c058b25](https://github.com/JackChen-me/open-multi-agent/commit/d1291c058b25781815329e24b825a99b8e6b2582) 2026-10-08T12:57:06+08:00: docs: route community feedback to issues (#624)
- [75a67581c98d](https://github.com/JackChen-me/open-multi-agent/commit/75a67581c98df3bce3c90035dcaf445a989155d2) 2026-10-04T08:21:42+08:00: fix(release-bot): wait up to eight minutes for npm to serve a published version (#622)

## Changed paths

- M: `.github/RELEASING.md`
- M: `.github/workflows/ci.yml`
- M: `CHANGELOG.md`
- M: `CONTRIBUTORS.md`
- M: `README.md`
- M: `README_zh.md`
- M: `docs/coordinator.md`
- M: `docs/durable-approvals.md`
- M: `docs/errors.md`
- M: `docs/providers.md`
- M: `docs/run-journal.md`
- M: `docs/sandbox-and-shell.md`
- M: `docs/tool-configuration.md`
- M: `package-lock.json`
- M: `packages/core/README.md`
- M: `packages/core/README_zh.md`
- M: `packages/core/examples/README.md`
- M: `packages/core/examples/cookbook/narrative-puzzle-hint-arbitration.ts`
- M: `packages/core/examples/integrations/README.md`
- M: `packages/core/examples/integrations/express-customer-support/package.json`
- M: `packages/core/examples/providers/minimax.ts`
- M: `packages/core/package.json`
- M: `packages/core/src/agent/structured-output.ts`
- M: `packages/core/src/cli/oma.ts`
- M: `packages/core/src/eval/evalset.ts`
- M: `packages/core/src/eval/file.ts`
- M: `packages/core/src/eval/gate.ts`
- M: `packages/core/src/eval/judge.ts`
- M: `packages/core/src/eval/scorers/structured-output.ts`
- M: `packages/core/src/index.ts`
- M: `packages/core/src/llm/minimax.ts`
- M: `packages/core/src/memory/shared.ts`
- M: `packages/core/src/orchestrator/consensus.ts`
- M: `packages/core/src/orchestrator/coordinator.ts`
- M: `packages/core/src/orchestrator/task-profiler.ts`
- M: `packages/core/src/team/team.ts`
- M: `packages/core/src/tool/built-in/delegate.ts`
- M: `packages/core/src/tool/built-in/path-safety.ts`
- M: `packages/core/src/tool/executor.ts`
- M: `packages/core/src/tool/framework.ts`
- M: `packages/core/src/types.ts`
- A: `packages/core/src/utils/validation-issues.ts`
- M: `packages/core/tests/built-in-tools.test.ts`
- M: `packages/core/tests/coordinator-manifest.test.ts`
- A: `packages/core/tests/fixtures/zod-versions.ts`
- M: `packages/core/tests/llm-adapter-capabilities.test.ts`
- A: `packages/core/tests/minimax-http.test.ts`
- M: `packages/core/tests/shared-memory.test.ts`
- M: `packages/core/tests/structured-output.test.ts`
- M: `packages/core/tests/team-messaging.test.ts`
- M: `packages/core/tests/tool-executor.test.ts`
- A: `packages/core/tests/validation-issues.test.ts`
- A: `packages/core/tests/zod-versions.test.ts`
- A: `packages/core/vitest.zod3.config.ts`
- M: `packages/create-oma-app/package.json`
- M: `packages/create-oma-app/template/package.json`
- M: `packages/create-oma-app/templates/demo/package.json`
- M: `packages/create-oma-app/templates/pr-review/package.json`
- M: `packages/create-oma-app/templates/security/package.json`
- M: `packages/release-bot/README.md`
- M: `packages/release-bot/package.json`
- M: `packages/release-bot/src/cli.ts`
- M: `packages/release-bot/src/index.ts`
- A: `packages/release-bot/src/lockfile.ts`
- M: `packages/release-bot/src/orchestrator.ts`
- M: `packages/release-bot/src/prepare.ts`
- M: `packages/release-bot/src/publisher.ts`
- M: `packages/release-bot/src/schema.ts`
- A: `packages/release-bot/tests/lockfile.test.ts`
- M: `packages/release-bot/tests/orchestrator.test.ts`
- M: `packages/release-bot/tests/package-boundary.test.ts`
- M: `packages/release-bot/tests/prepare.test.ts`
- M: `packages/release-bot/tests/publisher.test.ts`
- M: `packages/release-bot/tests/schema.test.ts`
