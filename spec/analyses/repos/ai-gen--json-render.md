# json-render: change evidence

Source: [json-render](https://github.com/vercel-labs/json-render) · [Analysis](../../projects/ai-gen--json-render.md) · [generation](../../generation.md), [channels](../../channels.md), [skills](../../skills.md), [security](../../security.md)

Generated: 2026-10-27T18:19:07.717Z. Status: **changed**. Reviewed SHA: `fc2a696a50a30cb30c878ab1eb65e102487eea0f`; commit date: 2026-10-01T14:18:31-03:00; review date: unknown; observed SHA: `c6f73d7d5f69acb80fc89faefd12c0865c8603d1`.

This generated packet is a bounded change locator, not a source review or a quality measurement. [Source comparison](https://github.com/vercel-labs/json-render/compare/fc2a696a50a30cb30c878ab1eb65e102487eea0f...c6f73d7d5f69acb80fc89faefd12c0865c8603d1). Working-tree changes: false; shallow history: false; report changed since recorded review: false.

- Git discovery: unchanged; source lifecycle: active; upstream availability: available.

## Recent commits

- [c6f73d7d5f69](https://github.com/vercel-labs/json-render/commit/c6f73d7d5f69acb80fc89faefd12c0865c8603d1) 2026-10-23T20:52:23-05:00: Prepare v0.21.3 (#431)
- [fe07935ca865](https://github.com/vercel-labs/json-render/commit/fe07935ca865e2cd7f4bd790c7acad8806d0dae5) 2026-10-23T12:05:53-07:00: docs: document published Jev composition packages (#418)
- [3c1e963e7846](https://github.com/vercel-labs/json-render/commit/3c1e963e7846f8deb2f88108b3e13ba1aa7ceee2) 2026-10-23T11:56:15-07:00: fix(skills): namespace shadcn skill to avoid installation conflicts (#417)
- [76d8547573c0](https://github.com/vercel-labs/json-render/commit/76d8547573c01e9aaf98eaf8b0fc92547779b284) 2026-10-23T11:55:54-07:00: docs: document ordered rendering of mixed message parts (#416)
- [aa3e84cb6540](https://github.com/vercel-labs/json-render/commit/aa3e84cb654059363804855532498ff129bb37c7) 2026-10-23T11:55:34-07:00: fix(examples): correct Tailwind @source paths in chat and harness-chat (#415)
- [eeb04244cf3c](https://github.com/vercel-labs/json-render/commit/eeb04244cf3c2f5e15d0a3a9c468737cb589f945) 2026-10-23T11:55:00-07:00: fix(core): apply repeated SpecStream JSONL lines (#414)
- [4e8a3bacf83c](https://github.com/vercel-labs/json-render/commit/4e8a3bacf83cb110ee30559311ad2aecc629cf86) 2026-10-23T11:54:30-07:00: docs(solid): fix registry context and reactive input examples (#413)
- [147ba04a8feb](https://github.com/vercel-labs/json-render/commit/147ba04a8febcb8cf392b81a428b5f79adf255d8) 2026-10-23T11:54:02-07:00: fix(yaml): keep patch state in sync with move and copy (#411)
- [1f3a0800607c](https://github.com/vercel-labs/json-render/commit/1f3a0800607c89d235cac74c34fcd6d460f0fefd) 2026-10-23T11:39:42-05:00: Prepare v0.21.2 (#424)
- [f78cc14f34c1](https://github.com/vercel-labs/json-render/commit/f78cc14f34c138d39a350b5e0991b8adf8b167ab) 2026-10-22T17:12:30-07:00: fix(react): run registry actions without a state setter (#410)
- [3569dad602c5](https://github.com/vercel-labs/json-render/commit/3569dad602c567810949021192a6cb5ac2bac9eb) 2026-10-22T11:56:23-07:00: fix(codegen): quote unsafe object keys when serializing props (#407)
- [36f88e9273c2](https://github.com/vercel-labs/json-render/commit/36f88e9273c256f0a94f3e3a45c348ebada2bbe6) 2026-10-22T11:55:59-07:00: fix(devtools): honor production bundles without a process global (#408)
- [ea7ccc161416](https://github.com/vercel-labs/json-render/commit/ea7ccc161416d34d107d2e1cc6e003fd91c4aca5) 2026-10-22T11:54:23-07:00: fix(react-pdf): draw a repeat container once in renderToBuffer (#409)
- [72568f990e55](https://github.com/vercel-labs/json-render/commit/72568f990e5502c4d3115691facb8ca928a5c9fc) 2026-10-13T13:04:29-05:00: Prepare v0.21.1 release (#394)
- [5473fe1314cf](https://github.com/vercel-labs/json-render/commit/5473fe1314cf0a1bf4c685dbf795912211f9c4f6) 2026-10-12T15:02:47-03:00: fix(core): infer s.any() fields as any (#390)
- [85a7fa0091a4](https://github.com/vercel-labs/json-render/commit/85a7fa0091a41fc09987e4e9105a0b9f2c97f4ef) 2026-10-12T15:02:28-03:00: fix(core): reject partial and empty numeric strings (#389)

## Changed paths

- M: `CHANGELOG.md`
- M: `README.md`
- M: `apps/web/app/api/docs-chat/route.ts`
- M: `apps/web/content/docs/ai-sdk.mdx`
- M: `apps/web/content/docs/api/core.mdx`
- M: `apps/web/content/docs/api/devtools.mdx`
- M: `apps/web/content/docs/api/react.mdx`
- M: `apps/web/content/docs/api/solid.mdx`
- M: `apps/web/content/docs/api/yaml.mdx`
- M: `apps/web/content/docs/changelog.mdx`
- M: `apps/web/content/docs/generation-modes.mdx`
- M: `apps/web/content/docs/jev.mdx`
- M: `apps/web/content/docs/registry.mdx`
- M: `apps/web/content/docs/renderers.mdx`
- M: `apps/web/content/docs/skills.mdx`
- M: `apps/web/lib/jev/README.md`
- M: `apps/web/tests/fixtures/docs-baseline.json`
- M: `examples/chat/app/globals.css`
- M: `examples/harness-chat/app/globals.css`
- M: `examples/solid/src/lib/components/Input.tsx`
- M: `packages/codegen/package.json`
- A: `packages/codegen/src/serialize-keys.test.ts`
- M: `packages/codegen/src/serialize.ts`
- M: `packages/core/README.md`
- M: `packages/core/package.json`
- M: `packages/core/src/schema.test.ts`
- M: `packages/core/src/schema.ts`
- M: `packages/core/src/types.test.ts`
- M: `packages/core/src/types.ts`
- M: `packages/core/src/validation.test.ts`
- M: `packages/core/src/validation.ts`
- A: `packages/core/tsconfig.check.json`
- M: `packages/devtools-react/package.json`
- M: `packages/devtools-solid/package.json`
- M: `packages/devtools-svelte/package.json`
- M: `packages/devtools-vue/package.json`
- M: `packages/devtools/README.md`
- M: `packages/devtools/package.json`
- M: `packages/devtools/src/prod-guard.test.ts`
- M: `packages/devtools/src/prod-guard.ts`
- M: `packages/directives/package.json`
- M: `packages/image/package.json`
- M: `packages/ink/package.json`
- M: `packages/jotai/package.json`
- M: `packages/mcp/package.json`
- M: `packages/next/package.json`
- M: `packages/react-email/package.json`
- M: `packages/react-native/package.json`
- M: `packages/react-pdf/package.json`
- M: `packages/react-pdf/src/render.tsx`
- A: `packages/react-pdf/src/repeat-container.test.tsx`
- M: `packages/react-three-fiber/package.json`
- M: `packages/react/package.json`
- M: `packages/react/src/renderer.test.tsx`
- M: `packages/react/src/renderer.tsx`
- M: `packages/redux/package.json`
- M: `packages/remotion/package.json`
- M: `packages/shadcn-svelte/package.json`
- M: `packages/shadcn/package.json`
- M: `packages/solid/README.md`
- M: `packages/solid/package.json`
- M: `packages/solid/src/hooks.ts`
- M: `packages/svelte/package.json`
- M: `packages/tanstack-start/package.json`
- M: `packages/vue/package.json`
- M: `packages/xstate/package.json`
- M: `packages/yaml/package.json`
- M: `packages/yaml/src/transform.test.ts`
- M: `packages/yaml/src/transform.ts`
- M: `packages/zustand/package.json`
- M: `skills/core/SKILL.md`
- M: `skills/devtools/SKILL.md`
- R099: `skills/json-render-shadcn/SKILL.md` (from `skills/shadcn/SKILL.md`)
- M: `skills/solid/SKILL.md`
- M: `skills/yaml/SKILL.md`
