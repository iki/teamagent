# create.openapi-to-skills: change evidence

Source: [create.openapi-to-skills](https://github.com/neutree-ai/openapi-to-skills) · [Analysis](../../projects/ai-agents-skills--create.openapi-to-skills.md) · [skills](../../skills.md), [evolution](../../evolution.md)

Generated: 2026-10-27T18:19:07.717Z. Status: **changed**. Reviewed SHA: `37696dfa4fc926c5cb527f89a4ba4a5ab3e0d247`; commit date: 2026-06-23T11:55:18+08:00; review date: unknown; observed SHA: `dd3bedcab932a766e86039ad7d0115d58f98987d`.

This generated packet is a bounded change locator, not a source review or a quality measurement. [Source comparison](https://github.com/neutree-ai/openapi-to-skills/compare/37696dfa4fc926c5cb527f89a4ba4a5ab3e0d247...dd3bedcab932a766e86039ad7d0115d58f98987d). Working-tree changes: false; shallow history: false; report changed since recorded review: false.

- Git discovery: unchanged; source lifecycle: active; upstream availability: available.

## Recent commits

- [dd3bedcab932](https://github.com/neutree-ai/openapi-to-skills/commit/dd3bedcab932a766e86039ad7d0115d58f98987d) 2026-10-14T14:41:57+08:00: fix: keep the CLI in published packages; pin npm 11 for publishing (#16)
- [5b94d09bec7b](https://github.com/neutree-ai/openapi-to-skills/commit/5b94d09bec7b5a3f45fb9c66947309a434cceb13) 2026-10-14T14:33:48+08:00: ci: publish with npm trusted publishing instead of a token (#15)
- [3896303f5f6c](https://github.com/neutree-ai/openapi-to-skills/commit/3896303f5f6c9a5b2e338d894e826b2e53959636) 2026-10-14T13:53:49+08:00: chore: bump version to v0.4.0
- [75792e96622e](https://github.com/neutree-ai/openapi-to-skills/commit/75792e96622e1b9d1dbdc1b31f6e675f0d7f19ec) 2026-10-14T13:51:21+08:00: Merge pull request #10 from fabiante/feature/add-openapi-to-skills-skill
- [b3ca52f2f235](https://github.com/neutree-ai/openapi-to-skills/commit/b3ca52f2f2356288dab10403ffe0e396e27ff8d2) 2026-10-14T13:49:50+08:00: docs: centralize CLI guidance in the agent skill
- [5be26b1dfaf6](https://github.com/neutree-ai/openapi-to-skills/commit/5be26b1dfaf6c299d664a096df89047abc888e9c) 2026-10-14T13:48:02+08:00: Merge remote-tracking branch 'origin/main' into pr-10
- [9aa8158a45ae](https://github.com/neutree-ai/openapi-to-skills/commit/9aa8158a45aec536f661953490749892d2fc14be) 2026-10-14T13:46:47+08:00: feat: add opt-in compact resource layout (#14)
- [38a0e200c158](https://github.com/neutree-ai/openapi-to-skills/commit/38a0e200c158df948f59b267a50599fa15e2cbea) 2026-10-14T11:52:02+08:00: test: cover form request body rendering (#13)
- [f33670996b5d](https://github.com/neutree-ai/openapi-to-skills/commit/f33670996b5d46405870e6e1207ba03489a919d8) 2026-10-14T11:46:35+08:00: fix: preserve complete enum values in markdown tables (#12)
- [da9583a39cf5](https://github.com/neutree-ai/openapi-to-skills/commit/da9583a39cf5b6db42713e05e1cda8a1fa94c429) 2026-09-28T09:42:05+02:00: docs(readme): link agent skill in usage
- [fe8e23e6ef81](https://github.com/neutree-ai/openapi-to-skills/commit/fe8e23e6ef811e912629efd8e4270d9804b657f6) 2026-09-28T09:40:24+02:00: feat(skill): add OpenAPI-to-Skills agent skill

## Changed paths

- M: `.github/workflows/publish.yml`
- M: `README.md`
- A: `e2e/compact.test.ts`
- M: `index.ts`
- M: `package.json`
- A: `runtime/validate.mjs`
- A: `skills/openapi-to-skills/SKILL.md`
- A: `skills/openapi-to-skills/references/cli.md`
- M: `src/cli.ts`
- A: `src/compact.test.ts`
- A: `src/compact.ts`
- M: `src/converter.test.ts`
- M: `src/converter.ts`
- A: `src/fixtures/compact.yaml`
- A: `src/overlay.test.ts`
- A: `src/overlay.ts`
- M: `src/parser.ts`
- M: `src/renderer.ts`
- M: `src/spec-loader.ts`
- M: `src/types.ts`
- M: `src/validate.test.ts`
- M: `src/validate.ts`
- A: `src/validator.test.ts`
- A: `src/validator.ts`
- A: `templates/compact-operation.md.eta`
- A: `templates/compact-resource.md.eta`
- A: `templates/compact-skill.md.eta`
