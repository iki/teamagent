# mcp-ext-apps: change evidence

Source: [mcp-ext-apps](https://github.com/modelcontextprotocol/ext-apps) · [Analysis](../../projects/ai-query--mcp-ext-apps.md) · [memory](../../memory.md), [import-generation](../../import-generation.md), [decisions](../../decisions.md)

Generated: 2026-10-27T18:19:07.717Z. Status: **changed**. Reviewed SHA: `82221c0c8ce7661efa6771c9d461511b1650495f`; commit date: 2026-09-25T15:47:56+01:00; review date: unknown; observed SHA: `07cda2513b0b691ac261ac69c856062c9afb2824`.

This generated packet is a bounded change locator, not a source review or a quality measurement. [Source comparison](https://github.com/modelcontextprotocol/ext-apps/compare/82221c0c8ce7661efa6771c9d461511b1650495f...07cda2513b0b691ac261ac69c856062c9afb2824). Working-tree changes: false; shallow history: false; report changed since recorded review: false.

- Git discovery: updated; source lifecycle: active; upstream availability: available.

## Recent commits

- [07cda2513b0b](https://github.com/modelcontextprotocol/ext-apps/commit/07cda2513b0b691ac261ac69c856062c9afb2824) 2026-10-27T09:03:11Z: Revert "Bump version to 2.1.0 (#833)" (#835)
- [6cc763a8291b](https://github.com/modelcontextprotocol/ext-apps/commit/6cc763a8291b1fbbca8e3844efbcea1b9162b5a5) 2026-10-27T08:27:15Z: Bump version to 2.1.0 (#833)
- [f89e08a70890](https://github.com/modelcontextprotocol/ext-apps/commit/f89e08a70890da1e3e2b4aea9faed7f793b10a56) 2026-10-27T08:26:10Z: Make the WebMCP polyfill internal (#834)
- [af037beb9b8a](https://github.com/modelcontextprotocol/ext-apps/commit/af037beb9b8ae3dd167c046b4466093241b49302) 2026-10-27T08:13:41Z: pdf-server: validate annotations with per-type schemas (#832)
- [4fb60b3396ea](https://github.com/modelcontextprotocol/ext-apps/commit/4fb60b3396ea55345fd52ef00c4ce02cc868f20e) 2026-10-27T08:02:46Z: Bridge App-registered tools and WebMCP in both directions (middle ground for #797) (#829)
- [7af9a75da720](https://github.com/modelcontextprotocol/ext-apps/commit/7af9a75da720b8a81be0f9aff47b25f75e9530ad) 2026-10-27T07:08:49Z: Bump version to 2.0.4 (#831)
- [f6f01d58266f](https://github.com/modelcontextprotocol/ext-apps/commit/f6f01d58266fb2633c7f38e11c7c249f7c079738) 2026-10-27T06:58:30Z: pdf-server: default to a single interact app tool (#830)
- [015ae78192e4](https://github.com/modelcontextprotocol/ext-apps/commit/015ae78192e4c911e7a29085edda1a5773995e2e) 2026-10-27T04:22:11Z: Security: bump solid-js override to 1.9.17 and refresh vulnerable transitives (#827)
- [517512ce638d](https://github.com/modelcontextprotocol/ext-apps/commit/517512ce638d24d33681814a9e65ee850751e289) 2026-10-27T04:15:13Z: Fix pdf-server saved-page restore (dead pageCount guard since #329) (#828)
- [266a9e3b70db](https://github.com/modelcontextprotocol/ext-apps/commit/266a9e3b70dbd4a4f0546dda95da2a2c1a8be4b7) 2026-10-23T15:52:47+01:00: Add get-screenshot app tool to the map-server example (#821)

## Changed paths

- M: `examples/basic-host/package.json`
- M: `examples/basic-server-preact/package.json`
- M: `examples/basic-server-react/package.json`
- M: `examples/basic-server-solid/package.json`
- M: `examples/basic-server-svelte/package.json`
- M: `examples/basic-server-vanillajs/package.json`
- M: `examples/basic-server-vue/package.json`
- M: `examples/budget-allocator-server/package.json`
- M: `examples/cohort-heatmap-server/package.json`
- M: `examples/customer-segmentation-server/package.json`
- M: `examples/debug-server/package.json`
- M: `examples/integration-server/package.json`
- M: `examples/lazy-auth-server/package.json`
- M: `examples/map-server/README.md`
- M: `examples/map-server/package.json`
- M: `examples/map-server/src/mcp-app.ts`
- M: `examples/pdf-server/README.md`
- M: `examples/pdf-server/main.ts`
- M: `examples/pdf-server/package.json`
- M: `examples/pdf-server/server.test.ts`
- M: `examples/pdf-server/server.ts`
- A: `examples/pdf-server/src/annotation-schemas.ts`
- M: `examples/pdf-server/src/mcp-app.ts`
- M: `examples/pdf-server/src/pdf-annotations.ts`
- M: `examples/qr-server/package.json`
- M: `examples/quickstart/package.json`
- M: `examples/say-server/package.json`
- M: `examples/scenario-modeler-server/package.json`
- M: `examples/shadertoy-server/package.json`
- M: `examples/sheet-music-server/package.json`
- M: `examples/system-monitor-server/package.json`
- M: `examples/threejs-server/package.json`
- M: `examples/transcript-server/package.json`
- M: `examples/video-resource-server/package.json`
- M: `examples/wiki-explorer-server/package.json`
- M: `package-lock.json`
- M: `package.json`
- M: `specification/draft/apps.mdx`
- A: `src/app-webmcp-interop.test.ts`
- M: `src/app.ts`
- M: `src/generated/schema.json`
- M: `src/react/useApp.tsx`
- A: `src/webmcp-polyfill.ts`
- A: `src/webmcp.ts`
- A: `tests/e2e/map-get-screenshot.spec.ts`
- A: `tests/e2e/pdf-app-helpers.ts`
- A: `tests/e2e/pdf-app-interact.spec.ts`
- A: `tests/e2e/pdf-page-restore.spec.ts`
