# openrouter-ai-sdk-provider: change evidence

Source: [openrouter-ai-sdk-provider](https://github.com/OpenRouterTeam/ai-sdk-provider) · [Analysis](../../projects/ai-agents-proxy--openrouter-ai-sdk-provider.md) · [models](../../models.md), [decisions](../../decisions.md)

Generated: 2026-10-27T18:19:07.717Z. Status: **changed**. Reviewed SHA: `1b22b05352cb0f9243a6c3fdd326038dd3705544`; commit date: 2026-09-19T07:14:33-07:00; review date: unknown; observed SHA: `0d2e6922091b77b71cc44e81eba69ed5fbd92f0f`.

This generated packet is a bounded change locator, not a source review or a quality measurement. [Source comparison](https://github.com/OpenRouterTeam/ai-sdk-provider/compare/1b22b05352cb0f9243a6c3fdd326038dd3705544...0d2e6922091b77b71cc44e81eba69ed5fbd92f0f). Working-tree changes: false; shallow history: false; report changed since recorded review: false.

- Git discovery: updated; source lifecycle: active; upstream availability: available.

## Recent commits

- [0d2e6922091b](https://github.com/OpenRouterTeam/ai-sdk-provider/commit/0d2e6922091b77b71cc44e81eba69ed5fbd92f0f) 2026-10-27T01:27:57-04:00: ci: pin third-party actions to commit SHAs & add dependabot config (#618)
- [d8edda07b62d](https://github.com/OpenRouterTeam/ai-sdk-provider/commit/d8edda07b62de696d613ae0115823382465665cd) 2026-10-21T17:08:12-05:00: fix: implement workflow serde hooks for durable execution (#525) (#526)
- [9a4737333e20](https://github.com/OpenRouterTeam/ai-sdk-provider/commit/9a4737333e201df0497cd7aeacc84278fc1e03cd) 2026-10-21T16:35:10-05:00: feat(chat): forward videoProcessing option to video_url.processing (#584)
- [b5f253f74b3d](https://github.com/OpenRouterTeam/ai-sdk-provider/commit/b5f253f74b3d158e86f213d0087c4de98d3d3277) 2026-10-21T16:34:57-05:00: fix: support cache_control on tool providerOptions (#517)
- [8f01d1bd4781](https://github.com/OpenRouterTeam/ai-sdk-provider/commit/8f01d1bd4781a16e721e102d2beb8efeb39e77c6) 2026-10-21T16:26:38-05:00: test(e2e): replace retired anthropic model slugs (#523)
- [b76b19b83edf](https://github.com/OpenRouterTeam/ai-sdk-provider/commit/b76b19b83edfe26d4e4bb3d66baed1cb62d81f76) 2026-10-21T16:26:31-05:00: fix: honour part-level cacheControl on assistant text parts (#585)
- [a76ca9ff8e2d](https://github.com/OpenRouterTeam/ai-sdk-provider/commit/a76ca9ff8e2d49dbe24a9e32d92e8098ccaab75e) 2026-10-21T16:26:23-05:00: fix(usage): preserve is_byok as isByok in providerMetadata.openrouter.usage (#550)
- [bacdd1afc9f1](https://github.com/OpenRouterTeam/ai-sdk-provider/commit/bacdd1afc9f11caebc5708a936d7200a1e0f116a) 2026-10-21T16:26:16-05:00: fix(image): merge runtime provider options with configured routing preferences (#551)
- [55773610ffb0](https://github.com/OpenRouterTeam/ai-sdk-provider/commit/55773610ffb0b6d058edcc05f4c5dab6892c9da5) 2026-10-21T16:26:08-05:00: fix(chat): support OpenAI image detail parameter (#493) (#552)
- [f54b359f6f9b](https://github.com/OpenRouterTeam/ai-sdk-provider/commit/f54b359f6f9bea44910b470f28713c50e1d52a08) 2026-10-21T16:25:59-05:00: fix(chat): forward tool strict setting to API request (#548)
- [cd86f5da5cc9](https://github.com/OpenRouterTeam/ai-sdk-provider/commit/cd86f5da5cc975a978218358f6b9abbe0b036226) 2026-10-21T16:25:50-05:00: perf(chat): avoid re-parsing streamed tool-call arguments on every delta (#586)
- [9ded35b74ff4](https://github.com/OpenRouterTeam/ai-sdk-provider/commit/9ded35b74ff4a498cd67c80a2bf02ff0534a9b60) 2026-10-21T16:25:43-05:00: fix: forward invalid streamed tool arguments to the AI SDK for repair (#575)
- [b7012730f112](https://github.com/OpenRouterTeam/ai-sdk-provider/commit/b7012730f1123d0ecc2a56212796b4a0d7eac3ff) 2026-10-21T16:25:34-05:00: fix: accept max reasoning effort in provider settings (#566)
- [32fd6d93c178](https://github.com/OpenRouterTeam/ai-sdk-provider/commit/32fd6d93c1782d85bef14eaeaf70eb55a596bfdd) 2026-10-21T16:25:27-05:00: feat: support `reasoning` parameter introduced in AI SDK v7 (#518)
- [5fe77f6c79d1](https://github.com/OpenRouterTeam/ai-sdk-provider/commit/5fe77f6c79d16ff025fc22c3fae228ba256a6659) 2026-10-21T16:25:19-05:00: fix: keep separately signed reasoning.text blocks separate when streaming (#583)
- [92961e42dfef](https://github.com/OpenRouterTeam/ai-sdk-provider/commit/92961e42dfef9254b73a27bbf96f262d91f34cee) 2026-10-21T16:25:12-05:00: fix: prevent assigning undefined keys during streaming reasoning accumulation (#540) (#547)
- [4013aa76cbd5](https://github.com/OpenRouterTeam/ai-sdk-provider/commit/4013aa76cbd5b668d3f9f401d8d8bc46c83b6afb) 2026-10-21T16:25:04-05:00: fix: unwrap AI SDK state parts before calling the Decisions API (#577)
- [59fe4942033b](https://github.com/OpenRouterTeam/ai-sdk-provider/commit/59fe4942033bbfe296f47b7a806a72b73b512778) 2026-10-21T16:24:56-05:00: feat: add runtime reranking model support (#553)
- [0ad203a0e50a](https://github.com/OpenRouterTeam/ai-sdk-provider/commit/0ad203a0e50a40a8237f2da0a5a0ea2f619f3404) 2026-10-21T16:24:48-05:00: fix(completion): finish AI SDK v7 migration for the completion model (#536)
- [d9d01b50f480](https://github.com/OpenRouterTeam/ai-sdk-provider/commit/d9d01b50f4802feca2ced9876364116315f6cb57) 2026-10-21T16:24:40-05:00: fix(provider): declare specificationVersion v4 on provider object (#549)

## Changed paths

- A: `.changeset/assistant-part-cache-control.md`
- A: `.changeset/bright-owls-reason.md`
- A: `.changeset/calm-seas-shave.md`
- A: `.changeset/curvy-singers-yawn.md`
- A: `.changeset/decision-state-parts.md`
- A: `.changeset/fix-issue-540-reasoning-signature.md`
- A: `.changeset/forward-invalid-tool-args.md`
- A: `.changeset/forward-tool-strict.md`
- A: `.changeset/incremental-tool-args-scan.md`
- A: `.changeset/merge-image-provider-routing-options.md`
- A: `.changeset/pin-third-party-actions.md`
- A: `.changeset/preserve-usage-is-byok.md`
- A: `.changeset/provider-specification-version.md`
- A: `.changeset/reranking-model-runtime.md`
- A: `.changeset/split-signed-reasoning-blocks.md`
- A: `.changeset/support-image-detail.md`
- A: `.changeset/tool-cache-control.md`
- A: `.changeset/video-processing-mode.md`
- A: `.changeset/warm-completion-lifecycle.md`
- A: `.changeset/workflow-serialization-hooks.md`
- A: `.github/dependabot.yml`
- M: `.github/workflows/ci.yaml`
- M: `.github/workflows/publish-manual.yaml`
- M: `.github/workflows/publish.yaml`
- M: `README.md`
- M: `e2e/cache-control.test.ts`
- M: `e2e/issues/issue-194-grok-invalid-json.test.ts`
- M: `e2e/issues/issue-196-anthropic-1h-cache-ttl.test.ts`
- M: `e2e/issues/issue-248-gemini-web-search-empty-response.test.ts`
- M: `e2e/issues/issue-287-tool-calls-missing-arguments.test.ts`
- M: `e2e/issues/issue-341-cache-control-last-text-part.test.ts`
- M: `e2e/issues/issue-389-system-cache-control.test.ts`
- M: `e2e/issues/issue-391-reasoning-effort-values.test.ts`
- M: `e2e/issues/issue-394-reasoning-end-signature.test.ts`
- M: `e2e/issues/issue-407-token-usage-details.test.ts`
- M: `e2e/issues/issue-419-usage-fallback.test.ts`
- M: `e2e/issues/issue-453-signature-reopen.test.ts`
- M: `e2e/pdf-blob/index.test.ts`
- M: `e2e/pdf-url/index.test.ts`
- M: `e2e/reasoning-effort.test.ts`
- M: `e2e/tools-with-reasoning.test.ts`
- M: `e2e/usage-accounting.test.ts`
- M: `e2e/web-search/index.test.ts`
- M: `src/chat/convert-to-openrouter-chat-messages.test.ts`
- M: `src/chat/convert-to-openrouter-chat-messages.ts`
- M: `src/chat/index.test.ts`
- M: `src/chat/index.ts`
- M: `src/chat/schemas.ts`
- M: `src/completion/index.test.ts`
- M: `src/completion/index.ts`
- M: `src/completion/schemas.ts`
- M: `src/evaluation/index.test.ts`
- M: `src/evaluation/index.ts`
- M: `src/image/index.test.ts`
- M: `src/image/index.ts`
- M: `src/internal/index.ts`
- M: `src/provider.test.ts`
- M: `src/provider.ts`
- A: `src/reranking/index.test.ts`
- A: `src/reranking/index.ts`
- A: `src/reranking/schemas.ts`
- M: `src/schemas/provider-metadata.ts`
- M: `src/tests/provider-options.test.ts`
- M: `src/types/index.ts`
- M: `src/types/openrouter-chat-completions-input.ts`
- A: `src/types/openrouter-reranking-settings.ts`
- A: `src/utils/json-completeness-scanner.test.ts`
- A: `src/utils/json-completeness-scanner.ts`
- A: `src/utils/resolve-reasoning.test.ts`
- A: `src/utils/resolve-reasoning.ts`
- A: `src/utils/workflow-serde.test.ts`
- A: `src/utils/workflow-serde.ts`
