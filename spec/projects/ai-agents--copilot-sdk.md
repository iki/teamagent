# copilot-sdk

Source: [copilot-sdk](https://github.com/github/copilot-sdk) · Category: [ai-agents](../categories/ai-agents.md)

Review depth: **focused source review**. Snapshot `ef04633cc84e4ba8e79888a39259ca276f5de732` (2026-10-02T22:14:56Z). Reviewed 2026-10-04. This assessment covers the cited implementation/contract, not every subsystem or runtime behavior.

## Finding

A first-party runtime SDK offers session and authentication operations that are stronger than terminal-output scraping.

## Source evidence inspected

- [nodejs/src/client.ts, lines 5–95](https://github.com/github/copilot-sdk/blob/ef04633cc84e4ba8e79888a39259ca276f5de732/nodejs/src/client.ts#L5-L95)
- [nodejs/src/client.ts, lines 2485–2525](https://github.com/github/copilot-sdk/blob/ef04633cc84e4ba8e79888a39259ca276f5de732/nodejs/src/client.ts#L2485-L2525)

## Observed design and algorithms

The client manages a Copilot runtime connection and imports explicit JSON-RPC, session, permission/configuration and runtime-host abstractions. getAuthStatus performs an auth.getStatus request over the connected channel. listModels caches results and uses promise-based locking to avoid concurrent catalog fetches, returning a copy to prevent accidental cache mutation.

## Harness decision

Prefer an official SDK-backed adapter when an installed agent exposes one. Treat auth status and model catalog as separate probes, with timeout and timestamp. Negotiate supported runtime/protocol versions instead of depending on private session files.

## Limits and tradeoffs

A connected SDK and cached model list do not guarantee that an inference turn is entitled, affordable or currently below quota. The reviewed client supports more than a simple process-spawn path; do not infer all transport behaviors from the import list. Current plan eligibility must be verified with the provider.

## Validation before adoption

Test missing or mismatched runtime, stale catalog, account changes, token refresh, permission callbacks and cancellation. Verify a minimal authorized turn in an explicit connection test before marking a model usable. No tests, live inference, installation, or production operation were performed for this review. License indicator: MIT; verify the exact files and dependencies before reuse.

Related directions: [agents](../agents.md) · [models](../models.md).

## 2026-10-28 scoped source review

Source: [copilot-sdk](https://github.com/github/copilot-sdk); inspected saved discovery revision `26536883459ba4cb23c735db8cb3de2c7b899d88`. Prior analyzed revision `ef04633cc84e4ba8e79888a39259ca276f5de732` remains historical evidence.

**Scope:** Complete Rust tool definition, schema normalization and MCP result conversion module. Rust session dispatch, tool tests, other language SDKs and live Copilot transport were not audited.

The [Rust schema helper](https://github.com/github/copilot-sdk/blob/26536883459ba4cb23c735db8cb3de2c7b899d88/rust/src/tool.rs#L85-L118) recursively sorts object keys for stable serialized definitions and offers a fallible alternative for dynamic schemas. It establishes object-map conversion, not validation of the full JSON Schema vocabulary or depth/size bounds. The [typed handler builder](https://github.com/github/copilot-sdk/blob/26536883459ba4cb23c735db8cb3de2c7b899d88/rust/src/tool.rs#L317-L390) deserializes invocation arguments into the chosen Rust type before calling the handler; the original argument value is taken out of the invocation, while session/call metadata remains. Serde decoding is not automatically enforcement of every advertised schema constraint or effect authorization. Declaration-only tools deliberately omit a local handler.

The [MCP conversion helper](https://github.com/github/copilot-sdk/blob/26536883459ba4cb23c735db8cb3de2c7b899d88/rust/src/tool.rs#L120-L205) accepts any object with a content array, extracts selected text/image/resource fields, silently ignores unsupported or malformed blocks, and treats anything other than boolean `isError: true` as success. Binary data and MIME strings are copied without visible byte, encoding or MIME validation. This can produce an empty success from an all-unrecognized content array; transport decoding elsewhere may be stricter, but was not reviewed.

Teamagent should preserve deterministic tool descriptions and typed handler boundaries, while returning explicit unsupported/partial results, validating binary payloads, and enforcing permissions/cancellation at dispatch. SDK type declarations do not prove cross-language parity or remote idempotency. No SDK, CLI, provider or upstream test was executed.

## 2026-10-28 follow-up source review

Reviewed commit `9bc718cb608c4cd3b63e0e71c637dcf1ebfd5409` (commit date `2026-10-27T22:50:27Z`), compared with `26536883459ba4cb23c735db8cb3de2c7b899d88`. Earlier findings remain historical evidence.

**Scope:** Elicitation-source display-name propagation in Node, Go and Python sessions. The complete changed-path inventory contains 22 paths; the assessment below is limited to the cited branches.

All three inspected language adapters now forward elicitationSourceDisplayName alongside the machine source, session ID, request ID, mode and URL. The Python type describes it as a trusted connector-owned display label. See [nodejs/src/session.ts](https://github.com/github/copilot-sdk/blob/9bc718cb608c4cd3b63e0e71c637dcf1ebfd5409/nodejs/src/session.ts#L1543-L1570), [go/session.go](https://github.com/github/copilot-sdk/blob/9bc718cb608c4cd3b63e0e71c637dcf1ebfd5409/go/session.go#L2064-L2082) [python/copilot/session.py](https://github.com/github/copilot-sdk/blob/9bc718cb608c4cd3b63e0e71c637dcf1ebfd5409/python/copilot/session.py#L838-L852) and [python/copilot/session.py](https://github.com/github/copilot-sdk/blob/9bc718cb608c4cd3b63e0e71c637dcf1ebfd5409/python/copilot/session.py#L2983-L3000). These adapters forward that field; this delta does not show how the remote producer establishes its trust.

For Teamagent, retain a user-readable label separately from the authenticated connector identity and bind any approval to the exact request and destination. A display name cannot authorize a URL or prove account scope. The added schema/event generation and all downstream elicitation validation were outside this bounded review.

**Verification limit:** committed-source inspection only; no upstream code, tests or provider calls were executed. This review does not certify every changed file or establish a Teamagent integration.

## 2026-11-01 scoped source review

Reviewed commit `68de1a7afe4bc9e7435d185825043bd9dc9c47cf` (commit date `2026-11-01T02:19:22Z`), compared with `9bc718cb608c4cd3b63e0e71c637dcf1ebfd5409`. Earlier observations remain historical evidence.

**Scope:** Expanded complete Go byte-range provider/fixture diff. Whole-repository diff was oversized; concrete filesystem providers, transport limits and other languages not audited.

The [Go adapter](https://github.com/github/copilot-sdk/blob/68de1a7afe4bc9e7435d185825043bd9dc9c47cf/go/session_fs_provider.go) adds an optional raw-byte range capability independent of binary-file access. It validates non-negative safe-integer offsets/lengths, preserves total byte length and rejects provider responses with inconsistent range sizes. [Fixtures](https://github.com/github/copilot-sdk/blob/68de1a7afe4bc9e7435d185825043bd9dc9c47cf/go/session_fs_range_test.go) cover split UTF-8 bytes, EOF/zero lengths, unsupported providers and errors. An omitted length still reads through EOF, so the interface itself does not impose a practical response-size cap.

**Teamagent implication (inference):** Advertise filesystem capabilities only when each route implements them, distinguish byte offsets from text coordinates, and bind partial reads to source-version evidence. Add actual byte/time budgets and containment checks at host boundaries; numeric validity alone is not bounded resource use.

**Verification limit:** committed-source inspection only; no upstream code, tests or provider calls were executed. Review scope is the cited implementation or authored guidance, not whole-project correctness, licensing clearance or measured performance. Source passages were redacted for review; exact URL literals were not byte-validated.

<!-- teamagent-analysis:start -->
Analysis metadata: source [copilot-sdk](https://github.com/github/copilot-sdk); analyzed commit `68de1a7afe4bc9e7435d185825043bd9dc9c47cf`; commit date 2026-11-01T02:19:22Z; review date 2026-11-01T11:33:30.893Z; depth source-reviewed. [Maintenance record](../analyses/repos/ai-agents--copilot-sdk.md).
<!-- teamagent-analysis:end -->
