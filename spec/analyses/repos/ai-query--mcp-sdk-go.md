# mcp-sdk-go: change evidence

Source: [mcp-sdk-go](https://github.com/modelcontextprotocol/go-sdk) · [Analysis](../../projects/ai-query--mcp-sdk-go.md) · [memory](../../memory.md), [import-generation](../../import-generation.md), [decisions](../../decisions.md)

Generated: 2026-10-27T18:19:07.717Z. Status: **changed**. Reviewed SHA: `25a53e3f27df62cef7066d81a8704b3df695800a`; commit date: 2026-10-02T17:24:41+02:00; review date: unknown; observed SHA: `3a4636928357264e894e5e3ec96eb5c6be0bed33`.

This generated packet is a bounded change locator, not a source review or a quality measurement. [Source comparison](https://github.com/modelcontextprotocol/go-sdk/compare/25a53e3f27df62cef7066d81a8704b3df695800a...3a4636928357264e894e5e3ec96eb5c6be0bed33). Working-tree changes: false; shallow history: false; report changed since recorded review: false.

- Git discovery: updated; source lifecycle: active; upstream availability: available.

## Recent commits (truncated)

- [3a4636928357](https://github.com/modelcontextprotocol/go-sdk/commit/3a4636928357264e894e5e3ec96eb5c6be0bed33) 2026-10-27T17:58:09+01:00: mcp: clear the caller's protocol version for the initialize handshake (#1165)
- [9ca975152ce0](https://github.com/modelcontextprotocol/go-sdk/commit/9ca975152ce0947c0cc53dcaa11d441375d3d9be) 2026-10-27T17:32:31+01:00: mcp: preserve number precision during schema validation (#1462)
- [43d212642baf](https://github.com/modelcontextprotocol/go-sdk/commit/43d212642baf374b855043bac41622eec14c1b9b) 2026-10-27T11:15:30+01:00: refactor: auto-close  PRs that skip the intake requirements (#1461)
- [a89b2ffa7a20](https://github.com/modelcontextprotocol/go-sdk/commit/a89b2ffa7a204a02ac004f329db746111140f487) 2026-10-27T09:30:56+01:00: mcp: forward session state through LoggingTransport (#1434)
- [fa799c5fc2e2](https://github.com/modelcontextprotocol/go-sdk/commit/fa799c5fc2e2e0f8aa578aa918a6e39607bd0142) 2026-10-26T18:02:52+01:00: auth/extauth: validate the RFC 9207 iss in PerformOIDCLogin (#1442)
- [8f4339609c6d](https://github.com/modelcontextprotocol/go-sdk/commit/8f4339609c6d855d585247b83a37ae1bb7f6f46b) 2026-10-26T14:23:24Z: docs: clarify LoggingTransport log contents (#1452)
- [6f47cb7983b3](https://github.com/modelcontextprotocol/go-sdk/commit/6f47cb7983b371b60460f730beab9794adc9f04c) 2026-10-26T15:14:03+01:00: auth/extauth: only forward an ID-JAG to the MCP authorization server (#1438)
- [3c5cb42616cc](https://github.com/modelcontextprotocol/go-sdk/commit/3c5cb42616cc6060292a03697b969aaf623594d3) 2026-10-26T14:27:58+01:00: mcp: reject null titled enum entries in elicitation schemas (#1447)
- [e5d779e12451](https://github.com/modelcontextprotocol/go-sdk/commit/e5d779e124515995650a8c507347fe393831e857) 2026-10-26T14:20:18+01:00: mcp: wrap ErrConnectionClosed for notifications and interrupted calls (#1449)
- [0f468020bb7f](https://github.com/modelcontextprotocol/go-sdk/commit/0f468020bb7f266291faf1cf72ee2a8a545ae315) 2026-10-26T12:57:02+01:00: fix(mcp): process singleton headers correctly (#1459)
- [0f33af19994c](https://github.com/modelcontextprotocol/go-sdk/commit/0f33af19994c7ed0edf3c12211b51e4bfd2cbece) 2026-10-26T10:28:40Z: fix(mcp): disabled client capabilities exposing roots (#1460)
- [25de74bbd56e](https://github.com/modelcontextprotocol/go-sdk/commit/25de74bbd56e6755de29d0a57bf66e0a7d16f696) 2026-10-26T10:21:37Z: fix(mcp): default maxEventSize not used (#1457)
- [76d05ae026a8](https://github.com/modelcontextprotocol/go-sdk/commit/76d05ae026a8f3fcacfe616bf8d2fd8ac2bbef41) 2026-10-26T10:14:50Z: fix(mcp): use internaljson for mrtr (#1458)
- [b42403f3e7ae](https://github.com/modelcontextprotocol/go-sdk/commit/b42403f3e7ae09b65ac8711e49293ad2533f675a) 2026-10-26T10:35:49+01:00: oauthex: parse WWW-Authenticate in linear time (#1456)
- [2e00768cde3f](https://github.com/modelcontextprotocol/go-sdk/commit/2e00768cde3f1ba31d898ea1f179e206d1ad27ef) 2026-10-23T17:48:12+02:00: mcp: restrict HTTP client redirects to same origin to prevent cross-origin redirect (#1440)
- [78997927c319](https://github.com/modelcontextprotocol/go-sdk/commit/78997927c319e93b92c313a37c1fdc61c7877390) 2026-10-23T10:57:12+02:00: mcp: include insufficient_scope error in WWW-Authenticate header for StatusForbidden (#1421)
- [f77a5d7ee762](https://github.com/modelcontextprotocol/go-sdk/commit/f77a5d7ee762bbd65d9ef4df0a5ebb4905ea3186) 2026-10-23T10:43:52+02:00: mcp: skip non-message events in SSEClientTransport (#1439)
- [12e768b461fd](https://github.com/modelcontextprotocol/go-sdk/commit/12e768b461fd06ea80b0d87e14ac7fa0d24c606a) 2026-10-22T10:53:57+02:00: oauthex: encode and decode client metadata "jwks" as a JSON object (#1435)
- [b874fadc3b4f](https://github.com/modelcontextprotocol/go-sdk/commit/b874fadc3b4fb4e505e9823e5736f01988c0f118) 2026-10-21T17:09:55+02:00: conformance: run the client credentials scenario (#1433)
- [67a946a0d1f3](https://github.com/modelcontextprotocol/go-sdk/commit/67a946a0d1f3a12b0786c3c579d97b39641685f6) 2026-10-21T17:05:21+02:00: auth/extauth: fix token source lifetime and concurrent access in the handlers (#1432)
- [6544ab325ac7](https://github.com/modelcontextprotocol/go-sdk/commit/6544ab325ac7db0817a7ee8e37cdb0f958bcb03b) 2026-10-21T14:55:36+02:00: mcp: marshal ResourceNotFoundError data as JSON (#1427)
- [2afd3b618489](https://github.com/modelcontextprotocol/go-sdk/commit/2afd3b618489acf49f191ed2bc1fcf3accd0d0d6) 2026-10-21T12:49:25+02:00: mcp: export cs.Discover for server/discover (#1428)
- [3ebc6d1eb720](https://github.com/modelcontextprotocol/go-sdk/commit/3ebc6d1eb7206d50590341f409e1499676db7345) 2026-10-20T12:31:16+02:00: mcp: send no response for a cancelled request on 2026-07-28 stdio sessions (#1267)
- [25f488030dbf](https://github.com/modelcontextprotocol/go-sdk/commit/25f488030dbf45fb6faaed055f9ad5fe73902d27) 2026-10-20T11:59:04+02:00: mcp: detach SSE client event stream from the Connect context (#1403)
- [ed357b7ea275](https://github.com/modelcontextprotocol/go-sdk/commit/ed357b7ea275acedd3aa86ec0acd997471902ab5) 2026-10-20T11:28:27+02:00: auth: reuse the dynamically registered client across authorizations (#1419)
- [75b83b6c256b](https://github.com/modelcontextprotocol/go-sdk/commit/75b83b6c256b4709c5286b5e2d570460a071fbc1) 2026-10-20T10:45:02+02:00: mcp: reuse server selection for new streamable requests (#1414)
- [7c501d7e6a5c](https://github.com/modelcontextprotocol/go-sdk/commit/7c501d7e6a5cd65004da55e5a2f7b46888dc3a79) 2026-10-20T10:41:25+02:00: auth: re-authorize when the access token expires without a refresh token (#1418)
- [ac7c4213f4db](https://github.com/modelcontextprotocol/go-sdk/commit/ac7c4213f4dbe2d8c9331a3241f8af5aa631ac9b) 2026-10-19T19:26:33+02:00: oauthex: accept empty list elements in WWW-Authenticate (#1351)
- [e844b98ccb9d](https://github.com/modelcontextprotocol/go-sdk/commit/e844b98ccb9d9febfa32253ac6d0e756491c4b76) 2026-10-19T17:13:04+02:00: scripts: restore server conformance executable bit (#1415)
- [88006afd1bcc](https://github.com/modelcontextprotocol/go-sdk/commit/88006afd1bcce13facd5712e34abfdbc3151eb87) 2026-10-19T16:29:47+02:00: fix(scripts): make --result_dir absolute in server-conformance.sh (#1409)
- [d4093b6b70d4](https://github.com/modelcontextprotocol/go-sdk/commit/d4093b6b70d449c7f152c9c791120ad452fb7df7) 2026-10-19T15:32:26+02:00: mcp: parse SSE field values per the SSE spec (#1412)
- [3e9d812b1814](https://github.com/modelcontextprotocol/go-sdk/commit/3e9d812b181433e7ad88b629ba40a12fdaad94a9) 2026-10-16T18:14:59+02:00: mcp: send handler errors that carry no code as Internal error (#1407)

## Changed paths

- A: `.gitattributes`
- D: `.github/ISSUE_TEMPLATE/bug_report.md`
- A: `.github/ISSUE_TEMPLATE/bug_report.yml`
- A: `.github/ISSUE_TEMPLATE/config.yml`
- D: `.github/ISSUE_TEMPLATE/enhancement.md`
- A: `.github/ISSUE_TEMPLATE/enhancement.yml`
- M: `.github/pull_request_template.md`
- A: `.github/scripts/pr_intake_gate.js`
- A: `.github/workflows/require-linked-issue.yml`
- M: `CONTRIBUTING.md`
- M: `auth/auth.go`
- M: `auth/auth_test.go`
- M: `auth/authorization_code.go`
- M: `auth/authorization_code_test.go`
- M: `auth/extauth/client_credentials.go`
- M: `auth/extauth/client_credentials_test.go`
- M: `auth/extauth/enterprise_handler.go`
- M: `auth/extauth/enterprise_handler_test.go`
- M: `auth/extauth/oidc_login.go`
- M: `auth/extauth/oidc_login_test.go`
- M: `conformance/baseline.yml`
- M: `conformance/everything-client/main.go`
- M: `design/mrtr.md`
- M: `docs/mcpgodebug.md`
- M: `docs/protocol.md`
- M: `docs/server.md`
- M: `docs/troubleshooting.md`
- M: `examples/auth/server/main.go`
- M: `examples/server/auth-middleware/main.go`
- M: `internal/docs/mcpgodebug.src.md`
- M: `internal/docs/protocol.src.md`
- M: `internal/docs/server.src.md`
- M: `internal/docs/troubleshooting.src.md`
- M: `internal/jsonrpc2/conn.go`
- M: `internal/jsonrpc2/conn_test.go`
- M: `internal/jsonrpc2/messages.go`
- M: `internal/jsonrpc2/wire_test.go`
- M: `internal/oauthtest/fake_authorization_server.go`
- M: `internal/oauthtest/fake_idp_server.go`
- M: `internal/readme/contributing.src.md`
- A: `internal/util/redirect.go`
- A: `internal/util/redirect_test.go`
- M: `jsonrpc/jsonrpc.go`
- M: `mcp/client.go`
- M: `mcp/client_test.go`
- M: `mcp/cmd_test.go`
- M: `mcp/error_test.go`
- M: `mcp/event.go`
- M: `mcp/event_test.go`
- M: `mcp/logging.go`
- M: `mcp/mcp_example_test.go`
- M: `mcp/mcp_test.go`
- M: `mcp/mrtr.go`
- M: `mcp/mrtr_test.go`
- M: `mcp/protocol.go`
- M: `mcp/protocol_test.go`
- M: `mcp/resource.go`
- M: `mcp/resource_test.go`
- M: `mcp/server.go`
- M: `mcp/server_test.go`
- M: `mcp/shared.go`
- M: `mcp/shared_test.go`
- M: `mcp/sse.go`
- M: `mcp/sse_test.go`
- M: `mcp/streamable.go`
- M: `mcp/streamable_client.go`
- M: `mcp/streamable_client_test.go`
- M: `mcp/streamable_headers.go`
- M: `mcp/streamable_headers_test.go`
- M: `mcp/streamable_test.go`
- M: `mcp/testdata/conformance/server/lifecycle.txtar`
- M: `mcp/tool.go`
- M: `mcp/tool_test.go`
- M: `mcp/transport.go`
- M: `mcp/transport_test.go`
- M: `oauthex/audience.go`
- M: `oauthex/auth_meta.go`
- M: `oauthex/dcr.go`
- M: `oauthex/dcr_test.go`
- M: `oauthex/resource_meta.go`
- M: `oauthex/resource_meta_test.go`
- M: `oauthex/token_exchange.go`
- M: `oauthex/token_exchange_test.go`
- M: `scripts/client-conformance.sh`
- M: `scripts/server-conformance.sh`
