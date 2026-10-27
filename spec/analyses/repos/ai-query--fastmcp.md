# fastmcp: change evidence

Source: [fastmcp](https://github.com/punkpeye/fastmcp) · [Analysis](../../projects/ai-query--fastmcp.md) · [memory](../../memory.md), [import-generation](../../import-generation.md), [decisions](../../decisions.md)

Generated: 2026-10-27T18:19:07.717Z. Status: **changed**. Reviewed SHA: `3cc03cfea6ca74dd5b0c004de498a3083e8f2348`; commit date: 2026-09-29T22:32:15-07:00; review date: unknown; observed SHA: `febd9b4277166730cf2aa892662aa30a7abd5787`.

This generated packet is a bounded change locator, not a source review or a quality measurement. [Source comparison](https://github.com/punkpeye/fastmcp/compare/3cc03cfea6ca74dd5b0c004de498a3083e8f2348...febd9b4277166730cf2aa892662aa30a7abd5787). Working-tree changes: false; shallow history: false; report changed since recorded review: false.

- Git discovery: updated; source lifecycle: active; upstream availability: available.

## Recent commits (truncated)

- [febd9b427716](https://github.com/punkpeye/fastmcp/commit/febd9b4277166730cf2aa892662aa30a7abd5787) 2026-10-26T21:49:39-07:00: fix: replace resources registered under the same URI (#476)
- [94febe2fac4a](https://github.com/punkpeye/fastmcp/commit/94febe2fac4ab99ed748bacce787be0f0c4955c6) 2026-10-26T21:49:28-07:00: fix(auth): reject all of 127.0.0.0/8 and .localhost as a CIMD host (#475)
- [d60769dfa52d](https://github.com/punkpeye/fastmcp/commit/d60769dfa52d1ce473b9e66af67f6872753bdaf7) 2026-10-26T21:49:06-07:00: fix(cli): validate composite projects that rely on implicit declarations (#474)
- [bda1c22a45ec](https://github.com/punkpeye/fastmcp/commit/bda1c22a45ece343ed9ac6e37147e68d182a1836) 2026-10-26T21:48:58-07:00: fix: advertise object-valued union schemas with a root object type (#471)
- [846e479a68bd](https://github.com/punkpeye/fastmcp/commit/846e479a68bdebb58205b03c9b954f42183e0ad5) 2026-10-26T21:47:49-07:00: fix: keep the last duplicate tool in a registration batch (#477)
- [230ba97ce4dc](https://github.com/punkpeye/fastmcp/commit/230ba97ce4dccdc00fff8e3774c3c64f4cca5d13) 2026-10-26T21:47:43-07:00: fix(edge): pass request headers to SDK request handlers (#473)
- [01ca2aae9a6b](https://github.com/punkpeye/fastmcp/commit/01ca2aae9a6b15ff8ecd6c3e468e9aa7e44880c4) 2026-10-26T21:47:36-07:00: fix: validate draft 2020-12 schemas in jsonSchemaAdapter (#472)
- [b5e3ad62bff8](https://github.com/punkpeye/fastmcp/commit/b5e3ad62bff8c148f29b1464d0e8255d8fb72e67) 2026-10-26T21:47:30-07:00: fix: keep UserError messages visible when extras do not match the output schema (#469)
- [d0bfa664f3e1](https://github.com/punkpeye/fastmcp/commit/d0bfa664f3e13361362052ed661b0485930d482c) 2026-10-26T21:47:22-07:00: fix: reject a second HTTP start and allow stopping twice (#467)
- [299814b55797](https://github.com/punkpeye/fastmcp/commit/299814b5579722489b13de9bc470ba907245f864) 2026-10-26T21:47:15-07:00: fix(openapi): return a tool error when a response cannot satisfy the output schema (#465)
- [67c5e3f5a925](https://github.com/punkpeye/fastmcp/commit/67c5e3f5a925a5fc318f1c76695cc09200b61aed) 2026-10-26T21:47:02-07:00: fix(openapi): keep the definition a sub-schema $ref points into (#463)
- [adff8cf4a028](https://github.com/punkpeye/fastmcp/commit/adff8cf4a028874184e77081165b5f35ceed36ae) 2026-10-26T21:46:54-07:00: fix: accept schema-valued additionalProperties in JSON Schema types (#462)
- [c138517b1e95](https://github.com/punkpeye/fastmcp/commit/c138517b1e952ceb892499b8388a4fd505108d7f) 2026-10-22T21:02:12-07:00: fix: route contextual elicitation through the originating request (#460)
- [5d5015dd281d](https://github.com/punkpeye/fastmcp/commit/5d5015dd281dcdf64dc54fd2cfcf9e672667be89) 2026-10-22T21:01:59-07:00: fix: advertise Zod tool parameters by their input schema (#458)
- [4b867a41bb10](https://github.com/punkpeye/fastmcp/commit/4b867a41bb10cf8c36c081e781e633d5d1f37c94) 2026-10-22T20:59:02-07:00: fix(edge): replace a tool, prompt or resource added again (#461)
- [d6020823238a](https://github.com/punkpeye/fastmcp/commit/d6020823238ad6377187f020eca94b61c1b49f3c) 2026-10-21T20:02:37-07:00: fix: route log messages through the request-scoped notifier (#456)
- [50fa0c61db90](https://github.com/punkpeye/fastmcp/commit/50fa0c61db90ab54ff48c51359b6c231d6a87409) 2026-10-21T20:02:15-07:00: fix: use a URL's declared audio type when file-type reports video/webm (#455)
- [6d808c71eb48](https://github.com/punkpeye/fastmcp/commit/6d808c71eb48d86d3f4796a9132f6b94f2aaf346) 2026-10-21T20:01:51-07:00: fix: detect SVG in imageContent (#453)
- [7cfa26b693ac](https://github.com/punkpeye/fastmcp/commit/7cfa26b693ac849b838fbc22aa5017329f855b15) 2026-10-21T20:00:56-07:00: fix: recheck tool access when a session's auth is updated (#454)
- [633e24ffeb4c](https://github.com/punkpeye/fastmcp/commit/633e24ffeb4cdadaca661d9539bbc84c9367f29e) 2026-10-20T09:39:37-07:00: fix(edge): preserve Zod 3 tool parameter schemas (#452)
- [4914feb9916d](https://github.com/punkpeye/fastmcp/commit/4914feb9916d77e9d5eec8f8d88f9485c37792bf) 2026-10-20T09:39:33-07:00: fix: accept annotations and _meta on tool result content (#451)
- [7402a96d36b3](https://github.com/punkpeye/fastmcp/commit/7402a96d36b3afb3ea9b2a4d5e89dd83a8f1e410) 2026-10-19T23:14:10-07:00: fix(openapi): preserve literal server variable defaults (#448)
- [93c1a2bdb2cf](https://github.com/punkpeye/fastmcp/commit/93c1a2bdb2cfbabb242805e5c1ab02cf5d10f91f) 2026-10-19T23:12:44-07:00: fix(edge): preserve explicit tool result fields (#445)
- [cf6f981305e4](https://github.com/punkpeye/fastmcp/commit/cf6f981305e4f8c11c0a3e1d1401bcdcb1530587) 2026-10-19T23:10:48-07:00: fix(openapi): preserve __proto__ fields through generated tools (#450)
- [ad208db72933](https://github.com/punkpeye/fastmcp/commit/ad208db72933e4431adecabf9e658235afd38135) 2026-10-19T23:10:38-07:00: fix(openapi): recognize mixed-case HTTP URL schemes (#449)
- [4b8d2a0a4099](https://github.com/punkpeye/fastmcp/commit/4b8d2a0a4099fb5e92d4fa6cb9582eba06da778d) 2026-10-19T23:10:28-07:00: fix(openapi): ignore inherited mcpNames overrides (#447)
- [fe9f91a085c1](https://github.com/punkpeye/fastmcp/commit/fe9f91a085c1c361f9295ab4d88e921f0a8519f7) 2026-10-19T23:10:18-07:00: fix(edge): keep a resource's declared mimeType when load returns an object (#446)
- [6f6f89ab2585](https://github.com/punkpeye/fastmcp/commit/6f6f89ab25852812436156a6e41d3a3f9c382403) 2026-10-19T23:10:03-07:00: fix(openapi): keep GETs with object parameters as tools (#444)
- [aabcce65519c](https://github.com/punkpeye/fastmcp/commit/aabcce65519c64836a4c3a66c7d4013bd7b880b2) 2026-10-17T16:04:44-07:00: fix: close owned stdio sessions when stopping (#434)
- [a873f7b2dfcc](https://github.com/punkpeye/fastmcp/commit/a873f7b2dfccfad41d3a8f3f4650160f6cc1f270) 2026-10-17T16:03:02-07:00: fix(auth): retry transient DiskStore rename failures on Windows (#438)
- [6bc23501e25a](https://github.com/punkpeye/fastmcp/commit/6bc23501e25a17c0d2b799390661cb946e82c37d) 2026-10-17T14:35:38-07:00: feat(openapi): serialize simple object path parameters (#433)
- [040cf508e387](https://github.com/punkpeye/fastmcp/commit/040cf508e387527d579e874fa0853e24ccf44b52) 2026-10-17T14:32:13-07:00: fix(openapi): send empty required JSON request bodies (#442)

## Changed paths

- M: `README.md`
- M: `docs/openapi.md`
- M: `scripts/refresh-openapi-benchmark-specs.mjs`
- A: `src/FastMCP.auth-refresh.test.ts`
- M: `src/FastMCP.batch-methods.test.ts`
- M: `src/FastMCP.https.test.ts`
- M: `src/FastMCP.in-memory.test.ts`
- M: `src/FastMCP.input-schema.test.ts`
- M: `src/FastMCP.map-storage.test.ts`
- M: `src/FastMCP.media-fetch.test.ts`
- M: `src/FastMCP.prompt-arguments.test.ts`
- A: `src/FastMCP.resource-templates.test.ts`
- M: `src/FastMCP.session-id.test.ts`
- A: `src/FastMCP.stdio-stop.test.ts`
- M: `src/FastMCP.stdio.test.ts`
- M: `src/FastMCP.test.ts`
- M: `src/FastMCP.ts`
- M: `src/auth/utils/cimd.test.ts`
- M: `src/auth/utils/cimd.ts`
- A: `src/auth/utils/diskStore.rename.test.ts`
- M: `src/auth/utils/diskStore.test.ts`
- M: `src/auth/utils/diskStore.ts`
- M: `src/bin/fastmcp.ts`
- M: `src/bin/validateCommand.test.ts`
- M: `src/bin/validateCommand.ts`
- M: `src/edge/WebStreamableHTTPServerTransport.test.ts`
- M: `src/edge/WebStreamableHTTPServerTransport.ts`
- M: `src/edge/edge.test.ts`
- M: `src/edge/index.ts`
- M: `src/examples/session-id-counter.ts`
- M: `src/getTestPort.test.ts`
- M: `src/getTestPort.ts`
- M: `src/jsonSchemaAdapter.test.ts`
- M: `src/jsonSchemaAdapter.ts`
- M: `src/openapi/__fixtures__/benchmark-specs/sources.json`
- M: `src/openapi/__fixtures__/ensureBenchmarkSpecs.mjs`
- A: `src/openapi/benchmarkSources.test.ts`
- M: `src/openapi/fromOpenAPI.offline.test.ts`
- M: `src/openapi/fromOpenAPI.ts`
- M: `src/openapi/loadSpec.test.ts`
- M: `src/openapi/loadSpec.ts`
- M: `src/openapi/naming.test.ts`
- M: `src/openapi/naming.ts`
- A: `src/openapi/prototypeKeys.test.ts`
- M: `src/openapi/requestBuilder.test.ts`
- M: `src/openapi/requestBuilder.ts`
- M: `src/openapi/resourceMapping.test.ts`
- M: `src/openapi/resourceMapping.ts`
- M: `src/openapi/schemas.test.ts`
- M: `src/openapi/schemas.ts`
- M: `src/openapi/types.ts`
- M: `src/strictInputSchema.ts`
