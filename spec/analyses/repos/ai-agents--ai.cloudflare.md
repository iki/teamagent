# ai.cloudflare: change evidence

Source: [ai.cloudflare](https://github.com/cloudflare/ai) · [Analysis](../../projects/ai-agents--ai.cloudflare.md) · [agents](../../agents.md), [models](../../models.md), [channels](../../channels.md)

Generated: 2026-10-27T18:19:07.717Z. Status: **changed**. Reviewed SHA: `0e5bc3b2f489e4b8215905812a36fe69d37afb8d`; commit date: 2026-09-11T16:53:10+01:00; review date: unknown; observed SHA: `34a8f4c00c0871883215a7114e9a7f3e7747ee1b`.

This generated packet is a bounded change locator, not a source review or a quality measurement. [Source comparison](https://github.com/cloudflare/ai/compare/0e5bc3b2f489e4b8215905812a36fe69d37afb8d...34a8f4c00c0871883215a7114e9a7f3e7747ee1b). Working-tree changes: false; shallow history: false; report changed since recorded review: false.

- Git discovery: updated; source lifecycle: active; upstream availability: available.

## Recent commits

- [34a8f4c00c08](https://github.com/cloudflare/ai/commit/34a8f4c00c0871883215a7114e9a7f3e7747ee1b) 2026-10-27T10:39:32Z: Merge pull request #681 from cloudflare/mcp-demos-oauth-provider-1x
- [899512185ddb](https://github.com/cloudflare/ai/commit/899512185ddbc0e06c73d963c1c5a2065f4975f2) 2026-10-22T18:07:07+01:00: chore: allow workers-oauth-provider 1.2.4 past the release-age gate
- [aa68bcf4c451](https://github.com/cloudflare/ai/commit/aa68bcf4c451626453bed259aff7fe5ae057e1ff) 2026-10-22T18:03:40+01:00: feat(mcp demos): set the OAuth resource from an MCP_RESOURCE var
- [dfc0dbab6092](https://github.com/cloudflare/ai/commit/dfc0dbab6092fd4480973d39d6a9a7609fca927f) 2026-10-22T18:03:40+01:00: feat(mcp demos): move OAuth demos to workers-oauth-provider 1.2.4
- [e64009349c9a](https://github.com/cloudflare/ai/commit/e64009349c9af37cd3820a16ff4448103148b0f1) 2026-10-22T16:39:55+01:00: Merge pull request #680 from cloudflare/mcp-demos-create-mcp-handler
- [e1ff49d21cdc](https://github.com/cloudflare/ai/commit/e1ff49d21cdc3ae6b0c4a3ee947998e18b0d92fe) 2026-10-21T19:32:41+01:00: feat(mcp demos): move every McpAgent demo to createMcpHandler
- [971c1ae25e4a](https://github.com/cloudflare/ai/commit/971c1ae25e4a627a17ef750d82229979a0e3e937) 2026-10-21T19:21:40+01:00: feat(remote-mcp): update OAuth demos to MCP SDK v2
- [f451cc88a212](https://github.com/cloudflare/ai/commit/f451cc88a2124940fcb08e4b2145b64f884edd43) 2026-10-20T16:20:17+01:00: Merge pull request #677 from cloudflare/changeset-release/main
- [70b5fa49dea0](https://github.com/cloudflare/ai/commit/70b5fa49dea0d7d05d67061df85b3e39640c9649) 2026-10-20T15:19:01Z: Version Packages
- [56c548a2ff96](https://github.com/cloudflare/ai/commit/56c548a2ff96add9cd9dee55eda9e595ae4bb39c) 2026-10-20T16:18:06+01:00: Merge pull request #675 from cloudflare/deprecate-providers-for-agents
- [b7fa22e28113](https://github.com/cloudflare/ai/commit/b7fa22e28113713114f1dc49026128802a5e7164) 2026-10-20T15:11:28+01:00: chore: deprecate workers-ai-provider's AI Search in favour of ai-search-provider
- [216177b6b25e](https://github.com/cloudflare/ai/commit/216177b6b25e9f73a544c5c0cbaff252fe6dedc3) 2026-10-20T15:04:07+01:00: chore: deprecate the credentials and REST modes too, now createAI takes an account id and API token
- [acd2dbd10f43](https://github.com/cloudflare/ai/commit/acd2dbd10f4392fef5d8d4335c2054bf25fd5c93) 2026-10-14T15:10:05+02:00: chore: deprecation notes match createAI's catalog ids, BYOK options and resume
- [014629613e01](https://github.com/cloudflare/ai/commit/014629613e0193cb4f969ee75ffba460e0982189) 2026-10-12T13:16:46+01:00: chore: deprecate binding paths superseded by createAI from agents/models/ai-sdk

## Changed paths

- M: `demos/mcp-server-bearer-auth/README.md`
- M: `demos/mcp-server-bearer-auth/package.json`
- M: `demos/mcp-server-bearer-auth/src/index.ts`
- M: `demos/mcp-server-bearer-auth/static/README.md`
- M: `demos/mcp-server-bearer-auth/worker-configuration.d.ts`
- M: `demos/mcp-server-bearer-auth/wrangler.jsonc`
- M: `demos/mcp-slack-oauth/README.md`
- M: `demos/mcp-slack-oauth/package.json`
- M: `demos/mcp-slack-oauth/src/index.ts`
- M: `demos/mcp-slack-oauth/worker-configuration.d.ts`
- M: `demos/mcp-slack-oauth/wrangler.jsonc`
- M: `demos/mcp-stytch-b2b-okr-manager/README.md`
- M: `demos/mcp-stytch-b2b-okr-manager/api/OKRManagerMCP.ts`
- M: `demos/mcp-stytch-b2b-okr-manager/api/index.ts`
- M: `demos/mcp-stytch-b2b-okr-manager/api/lib/auth.ts`
- M: `demos/mcp-stytch-b2b-okr-manager/package.json`
- M: `demos/mcp-stytch-b2b-okr-manager/worker-configuration.d.ts`
- M: `demos/mcp-stytch-b2b-okr-manager/wrangler.jsonc`
- M: `demos/mcp-stytch-consumer-todo-list/README.md`
- M: `demos/mcp-stytch-consumer-todo-list/api/TodoMCP.ts`
- M: `demos/mcp-stytch-consumer-todo-list/api/index.ts`
- M: `demos/mcp-stytch-consumer-todo-list/api/lib/auth.ts`
- M: `demos/mcp-stytch-consumer-todo-list/package.json`
- M: `demos/mcp-stytch-consumer-todo-list/worker-configuration.d.ts`
- M: `demos/mcp-stytch-consumer-todo-list/wrangler.jsonc`
- M: `demos/remote-mcp-auth0/README.md`
- M: `demos/remote-mcp-auth0/mcp-auth0-oidc/README.md`
- M: `demos/remote-mcp-auth0/mcp-auth0-oidc/package.json`
- M: `demos/remote-mcp-auth0/mcp-auth0-oidc/src/index.ts`
- M: `demos/remote-mcp-auth0/mcp-auth0-oidc/worker-configuration.d.ts`
- M: `demos/remote-mcp-auth0/mcp-auth0-oidc/wrangler.jsonc`
- M: `demos/remote-mcp-authkit/README.md`
- M: `demos/remote-mcp-authkit/package.json`
- M: `demos/remote-mcp-authkit/src/index.ts`
- M: `demos/remote-mcp-authkit/src/props.ts`
- M: `demos/remote-mcp-authkit/worker-configuration.d.ts`
- M: `demos/remote-mcp-authkit/wrangler.jsonc`
- M: `demos/remote-mcp-authless/package.json`
- M: `demos/remote-mcp-cf-access-self-hosted/package.json`
- M: `demos/remote-mcp-cf-access-self-hosted/src/index.ts`
- M: `demos/remote-mcp-cf-access-self-hosted/worker-configuration.d.ts`
- M: `demos/remote-mcp-cf-access-self-hosted/wrangler.jsonc`
- M: `demos/remote-mcp-cf-access/README.md`
- M: `demos/remote-mcp-cf-access/package.json`
- M: `demos/remote-mcp-cf-access/src/access-handler.ts`
- M: `demos/remote-mcp-cf-access/src/index.ts`
- M: `demos/remote-mcp-cf-access/worker-configuration.d.ts`
- M: `demos/remote-mcp-cf-access/wrangler.jsonc`
- M: `demos/remote-mcp-github-oauth/README.md`
- M: `demos/remote-mcp-github-oauth/package.json`
- M: `demos/remote-mcp-github-oauth/src/github-handler.ts`
- M: `demos/remote-mcp-github-oauth/src/index.ts`
- M: `demos/remote-mcp-github-oauth/src/utils.ts`
- M: `demos/remote-mcp-github-oauth/worker-configuration.d.ts`
- M: `demos/remote-mcp-github-oauth/wrangler.jsonc`
- M: `demos/remote-mcp-google-oauth/README.md`
- M: `demos/remote-mcp-google-oauth/package.json`
- M: `demos/remote-mcp-google-oauth/src/index.ts`
- M: `demos/remote-mcp-google-oauth/worker-configuration.d.ts`
- M: `demos/remote-mcp-google-oauth/wrangler.jsonc`
- M: `demos/remote-mcp-logto/README.md`
- M: `demos/remote-mcp-logto/package.json`
- M: `demos/remote-mcp-logto/src/index.ts`
- M: `demos/remote-mcp-logto/worker-configuration.d.ts`
- M: `demos/remote-mcp-logto/wrangler.jsonc`
- M: `demos/remote-mcp-server-autorag/README.md`
- M: `demos/remote-mcp-server-autorag/package.json`
- M: `demos/remote-mcp-server-autorag/src/index.ts`
- M: `demos/remote-mcp-server-autorag/static/README.md`
- M: `demos/remote-mcp-server-autorag/worker-configuration.d.ts`
- M: `demos/remote-mcp-server-autorag/wrangler.jsonc`
- M: `demos/remote-mcp-server/README.md`
- M: `demos/remote-mcp-server/package.json`
- M: `demos/remote-mcp-server/src/index.ts`
- M: `demos/remote-mcp-server/static/README.md`
- M: `demos/remote-mcp-server/worker-configuration.d.ts`
- M: `demos/remote-mcp-server/wrangler.jsonc`
- M: `packages/ai-gateway-provider/CHANGELOG.md`
- M: `packages/ai-gateway-provider/README.md`
- M: `packages/ai-gateway-provider/package.json`
- M: `packages/ai-gateway-provider/src/index.ts`
- M: `packages/ai-gateway-provider/src/providers/amazon-bedrock.ts`
- M: `packages/ai-gateway-provider/src/providers/anthropic.ts`
- M: `packages/ai-gateway-provider/src/providers/azure.ts`
- M: `packages/ai-gateway-provider/src/providers/cerebras.ts`
- M: `packages/ai-gateway-provider/src/providers/cohere.ts`
- M: `packages/ai-gateway-provider/src/providers/deepgram.ts`
- M: `packages/ai-gateway-provider/src/providers/deepseek.ts`
- M: `packages/ai-gateway-provider/src/providers/elevenlabs.ts`
- M: `packages/ai-gateway-provider/src/providers/fireworks.ts`
- M: `packages/ai-gateway-provider/src/providers/google-vertex.ts`
- M: `packages/ai-gateway-provider/src/providers/google.ts`
- M: `packages/ai-gateway-provider/src/providers/groq.ts`
- M: `packages/ai-gateway-provider/src/providers/mistral.ts`
- M: `packages/ai-gateway-provider/src/providers/openai.ts`
- M: `packages/ai-gateway-provider/src/providers/openrouter.ts`
- M: `packages/ai-gateway-provider/src/providers/perplexity.ts`
- M: `packages/ai-gateway-provider/src/providers/unified.ts`
- M: `packages/ai-gateway-provider/src/providers/xai.ts`
- M: `packages/workers-ai-provider/CHANGELOG.md`
- M: `packages/workers-ai-provider/README.md`
- M: `packages/workers-ai-provider/package.json`
- M: `packages/workers-ai-provider/src/anthropic.ts`
- M: `packages/workers-ai-provider/src/client-fallback.ts`
- M: `packages/workers-ai-provider/src/gateway-provider.ts`
- M: `packages/workers-ai-provider/src/google.ts`
- M: `packages/workers-ai-provider/src/index.ts`
- M: `packages/workers-ai-provider/src/openai.ts`
- M: `pnpm-lock.yaml`
- M: `pnpm-workspace.yaml`
