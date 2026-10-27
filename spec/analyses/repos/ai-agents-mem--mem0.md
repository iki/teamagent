# mem0: change evidence

Source: [mem0](https://github.com/mem0ai/mem0) · [Analysis](../../projects/ai-agents-mem--mem0.md) · [memory](../../memory.md), [agents](../../agents.md), [evolution](../../evolution.md)

Generated: 2026-10-27T18:19:07.717Z. Status: **changed**. Reviewed SHA: `abb81c88e1f738a8117d8293530fbc31a5ef8fd9`; commit date: 2026-10-01T21:46:18+05:30; review date: 2026-10-04; observed SHA: `26cdefb46600c0fa5953c4b5ee5003c125539fc4`.

This generated packet is a bounded change locator, not a source review or a quality measurement. [Source comparison](https://github.com/mem0ai/mem0/compare/abb81c88e1f738a8117d8293530fbc31a5ef8fd9...26cdefb46600c0fa5953c4b5ee5003c125539fc4). Working-tree changes: false; shallow history: false; report changed since recorded review: false.

- Git discovery: updated; source lifecycle: active; upstream availability: available.

## Recent commits

- [26cdefb46600](https://github.com/mem0ai/mem0/commit/26cdefb46600c0fa5953c4b5ee5003c125539fc4) 2026-10-26T10:51:39-04:00: docs(platform): add the pricing FAQ page (#7711)
- [2c81af3bbe27](https://github.com/mem0ai/mem0/commit/2c81af3bbe27d9bccb09c772d583df9e9be72ee5) 2026-10-20T21:16:17-04:00: docs(platform): rewrite the BYOK page as a feature guide (#7661)
- [0724291bd864](https://github.com/mem0ai/mem0/commit/0724291bd864cf807e88ee8981c8226644e8fb42) 2026-10-14T21:09:50+05:30: Add OSS Halloween Happy Hour banner to README (#7637)
- [d26ba5e4518c](https://github.com/mem0ai/mem0/commit/d26ba5e4518cef7fff3c66d4f715b21adf9feabe) 2026-10-12T21:58:27+05:30: fix(client): reject empty entity IDs and filters in add and delete_all (#7581)
- [b7ad69afda6b](https://github.com/mem0ai/mem0/commit/b7ad69afda6b6ed030347c66d48a13e4de9dec08) 2026-10-07T18:36:15+05:30: docs(skills): refresh mem0 skills against SDK 2.2.1 / TS 3.3.1 (#7548)
- [d62ce07facea](https://github.com/mem0ai/mem0/commit/d62ce07faceafedd4b10d60704db2b9d89d0afff) 2026-10-07T16:20:38+05:30: fix(vector-store): stop writing service account private key to DEBUG logs in GoogleMatchingEngine (#7506)
- [0516f19f721d](https://github.com/mem0ai/mem0/commit/0516f19f721d1b0bbf9171410031cd28fd1c19ac) 2026-10-07T15:53:25+05:30: fix(ts-oss): stop add() from mutating the caller's filters object (#6797)
- [c93420c49a6b](https://github.com/mem0ai/mem0/commit/c93420c49a6b14c3d446bdb156d96811908fd90a) 2026-10-05T20:52:59+05:30: fix(security): resolve 13 Vanta HIGH Dependabot vulnerabilities (#7528)

## Changed paths

- M: `README.md`
- M: `docs/core-concepts/memory-operations/delete.mdx`
- M: `docs/docs.json`
- A: `docs/images/halloween-happy-hour.png`
- A: `docs/images/platform/byok-accuracy-vs-cost.png`
- A: `docs/images/platform/byok-picks.png`
- M: `docs/llms.txt`
- M: `docs/migration/platform-v2-to-v3.mdx`
- M: `docs/platform/features/async-client.mdx`
- A: `docs/platform/features/byok.mdx`
- M: `docs/platform/features/custom-instructions.mdx`
- A: `docs/platform/pricing.mdx`
- M: `integrations/deepseek-plugin/package.json`
- M: `integrations/deepseek-plugin/pnpm-lock.yaml`
- M: `integrations/n8n-nodes-mem0/package.json`
- M: `integrations/n8n-nodes-mem0/pnpm-lock.yaml`
- M: `integrations/openclaw/package.json`
- M: `integrations/openclaw/pnpm-lock.yaml`
- M: `integrations/openclaw/pnpm-workspace.yaml`
- M: `integrations/pi-agent-plugin/package.json`
- M: `integrations/pi-agent-plugin/pnpm-lock.yaml`
- M: `integrations/pi-agent-plugin/pnpm-workspace.yaml`
- M: `integrations/vercel-ai-sdk/package.json`
- M: `integrations/vercel-ai-sdk/pnpm-lock.yaml`
- M: `integrations/vercel-ai-sdk/pnpm-workspace.yaml`
- M: `integrations/zapier-mem0/package.json`
- M: `integrations/zapier-mem0/pnpm-lock.yaml`
- M: `integrations/zapier-mem0/pnpm-workspace.yaml`
- M: `mem0-ts/package.json`
- M: `mem0-ts/pnpm-lock.yaml`
- M: `mem0-ts/pnpm-workspace.yaml`
- M: `mem0-ts/src/client/mem0.ts`
- A: `mem0-ts/src/client/tests/memoryClient.entityGuards.test.ts`
- M: `mem0-ts/src/oss/src/memory/index.ts`
- A: `mem0-ts/src/oss/tests/memory.add-filters-isolation.test.ts`
- M: `mem0/client/main.py`
- M: `mem0/client/types.py`
- M: `mem0/proxy/main.py`
- M: `mem0/vector_stores/vertex_ai_vector_search.py`
- M: `server/dashboard/package.json`
- M: `server/dashboard/pnpm-lock.yaml`
- M: `server/dashboard/pnpm-workspace.yaml`
- M: `skills/AGENTS.md`
- M: `skills/mem0-cli/README.md`
- M: `skills/mem0-cli/SKILL.md`
- M: `skills/mem0-cli/references/command-reference.md`
- M: `skills/mem0-cli/references/configuration.md`
- M: `skills/mem0-cli/references/workflows.md`
- M: `skills/mem0-integrate/SKILL.md`
- M: `skills/mem0-integrate/references/pipeline.md`
- M: `skills/mem0-integrate/references/subagent-prompts.md`
- M: `skills/mem0-oss-to-platform/README.md`
- M: `skills/mem0-oss-to-platform/SKILL.md`
- M: `skills/mem0-oss-to-platform/references/api-mapping.md`
- M: `skills/mem0-oss-to-platform/references/gotchas.md`
- M: `skills/mem0-oss-to-platform/references/plan-template.md`
- M: `skills/mem0-test-integration/SKILL.md`
- M: `skills/mem0-vercel-ai-sdk/README.md`
- M: `skills/mem0-vercel-ai-sdk/SKILL.md`
- M: `skills/mem0-vercel-ai-sdk/references/memory-utilities.md`
- M: `skills/mem0-vercel-ai-sdk/references/provider-api.md`
- M: `skills/mem0-vercel-ai-sdk/references/usage-patterns.md`
- M: `skills/mem0/SKILL.md`
- M: `skills/mem0/client/differences.md`
- M: `skills/mem0/client/node.md`
- M: `skills/mem0/client/python.md`
- M: `skills/mem0/references/api-reference.md`
- M: `skills/mem0/references/architecture.md`
- M: `skills/mem0/references/features.md`
- M: `skills/mem0/references/integration-patterns.md`
- M: `skills/mem0/references/quickstart.md`
- M: `skills/mem0/references/sdk-guide.md`
- M: `skills/mem0/references/use-cases.md`
- M: `skills/mem0/scripts/mem0_doc_search.py`
- M: `tests/test_client.py`
- A: `tests/test_client_entity_guards.py`
- M: `tests/test_proxy.py`
- M: `tests/vector_stores/test_vertex_ai_vector_search.py`
