# buzz

Source: [buzz](https://github.com/block/buzz) · Category: [ai-agents](../categories/ai-agents.md)

Review depth: **inventory / README screening only**. This is an individual coverage record, not a source-code correctness audit or adoption recommendation.

Snapshot: `e982f70fba29cdaa9a8378f118a0e498537bd8db`; commit timestamp `2026-10-03T15:12:15-04:00`; 5,489 tracked paths.

## Scope and evidence

Upstream description excerpt (a project claim, automatically extracted from [README](https://github.com/block/buzz/blob/e982f70fba29cdaa9a8378f118a0e498537bd8db/README.md)):

> A workspace where humans and agents build together, on a relay you own. Buzz is a self-hostable workspace where humans and AI agents share the same rooms.

Build/package evidence: [Cargo.toml](https://github.com/block/buzz/blob/e982f70fba29cdaa9a8378f118a0e498537bd8db/Cargo.toml); [admin-web/package.json](https://github.com/block/buzz/blob/e982f70fba29cdaa9a8378f118a0e498537bd8db/admin-web/package.json); [benchmarks/harbor-buzz-orchestra/pyproject.toml](https://github.com/block/buzz/blob/e982f70fba29cdaa9a8378f118a0e498537bd8db/benchmarks/harbor-buzz-orchestra/pyproject.toml); [benchmarks/harbor-buzz-orchestra/testbed/pyproject.toml](https://github.com/block/buzz/blob/e982f70fba29cdaa9a8378f118a0e498537bd8db/benchmarks/harbor-buzz-orchestra/testbed/pyproject.toml); [crates/buzz-acp/Cargo.toml](https://github.com/block/buzz/blob/e982f70fba29cdaa9a8378f118a0e498537bd8db/crates/buzz-acp/Cargo.toml)

License evidence: [LICENSE](https://github.com/block/buzz/blob/e982f70fba29cdaa9a8378f118a0e498537bd8db/LICENSE) Classification hint: Apache-2.0. A root license does not establish rights for every bundled asset, model, or dependency.

## Harness assessment

This entry was catalogued under **ai-agents**. Its category places it in the candidate set for agents, models, channels; those associations are navigational and have not been individually validated as implemented capabilities. See [agents](../agents.md) · [models](../models.md) · [channels](../channels.md) for the source-reviewed alternatives and proposed integration boundaries.

**Disposition:** retain as a comparison candidate. Before adopting it, inspect the implementation entry point and its tests, verify the required protocol and deployment platform, and reproduce a task from the harness evaluation suite. Popularity, a README feature list, and the presence of a package manifest are insufficient evidence of quality or compatibility.

**Unresolved:** runtime behavior, security boundaries, performance, API/subscription eligibility, dependency health, maintenance status, and fit to the proposed harness were not independently established for this entry. No repository code was executed as part of this screening.

## 2026-10-28 scoped source review

Source: [buzz](https://github.com/block/buzz); inspected saved discovery revision `ff9eb8f4dc56c312983287321ea8748b93c62145`. Prior analyzed revision `e982f70fba29cdaa9a8378f118a0e498537bd8db` remains historical evidence.

**Scope:** Complete auth service with embedded tests, plus MCP hook dispatch 340–449 and regular dispatch/restart 515–729. Signature verifier internals, replay/membership enforcement, process-kill helpers and provider loop were not audited.

The [auth service](https://github.com/block/buzz/blob/ff9eb8f4dc56c312983287321ea8748b93c62145/crates/buzz-auth/src/lib.rs#L129-L168) delegates NIP-42 verification to blocking CPU work, then grants all known scopes and no channel restriction; its comment explicitly assigns channel access to relay membership checks. Authentication alone therefore does not prove channel authority. Embedded tests cover scope lookup, accepted auth, wrong challenge and wrong event kind. Deterministic username-derived keys are gated by test/dev compilation, whose production feature selection was not inspected.

The [MCP dispatch](https://github.com/block/buzz/blob/ff9eb8f4dc56c312983287321ea8748b93c62145/crates/buzz-agent/src/mcp.rs#L515-L666) rechecks tool availability after restart, distinguishes application errors from broken transport, and prefers cancellation when its response and cancel branch are both ready. The first cancellation-state check happens after sending the request; cancellation cannot be interpreted as proof that the remote tool never started. Cancellation notification is delegated and fire-and-forget, and this regular call path provides no explicit local timeout. A broken current call returns an error rather than automatically replaying it within that invocation.

[Hook calls](https://github.com/block/buzz/blob/ff9eb8f4dc56c312983287321ea8748b93c62145/crates/buzz-agent/src/mcp.rs#L340-L444) run allowed servers concurrently, bound each call, restore configuration order and intentionally drop errors/empty output. The implementation kills on the second consecutive timeout, more narrowly than the nearby general comment. This fail-open hook contract is unsuitable as an authorization gate, and output caps do not bound the number of concurrent servers. Teamagent should distinguish optional context hooks, deterministic policy, remote cancellation acknowledgement and uncertain effects. No Rust build, relay, MCP process, provider or upstream test was executed.

## 2026-10-28 follow-up source review

Reviewed commit `24a370606044c0c7be787cc2fd98ec0bfe1d606b` (commit date `2026-10-28T00:22:45Z`), compared with `ff9eb8f4dc56c312983287321ea8748b93c62145`. Earlier findings remain historical evidence.

**Scope:** Relay authorization diagnostic attribution and denial-reason changes. The complete changed-path inventory contains 99 paths; the assessment below is limited to the cited branches.

Owner admission diagnostics now distinguish banned owners, unavailable ban checks, owner-link conflicts and unavailable owner links. Successful AUTH records the proven key for the shadow line; added fixtures require pairing/upgrade diagnostics to name that proven key instead of the token's asserted key. See [crates/buzz-relay/src/handlers/auth.rs](https://github.com/block/buzz/blob/24a370606044c0c7be787cc2fd98ec0bfe1d606b/crates/buzz-relay/src/handlers/auth.rs#L128-L154), [crates/buzz-relay/src/handlers/auth.rs](https://github.com/block/buzz/blob/24a370606044c0c7be787cc2fd98ec0bfe1d606b/crates/buzz-relay/src/handlers/auth.rs#L1608-L1663) and [crates/buzz-relay/src/handlers/auth.rs](https://github.com/block/buzz/blob/24a370606044c0c7be787cc2fd98ec0bfe1d606b/crates/buzz-relay/src/handlers/auth.rs#L437-L450).

For Teamagent, keep asserted identity, verified principal, denial reason and unavailable verification separate in audit records. Shadow-mode diagnostics do not themselves enforce admission, and recording a public key still needs the appropriate privacy policy. Fixtures were inspected only; relay membership enforcement, database migrations and native mobile behavior were not executed or re-audited.

**Verification limit:** committed-source inspection only; no upstream code, tests or provider calls were executed. This review does not certify every changed file or establish a Teamagent integration.

## 2026-11-01 scoped source review

Reviewed commit `acf56fff6fbfece9f143de3f096cb1d258fb9a9f` (commit date `2026-10-31T11:55:47-07:00`), compared with `24a370606044c0c7be787cc2fd98ec0bfe1d606b`. Earlier observations remain historical evidence.

**Scope:** Expanded complete verifier/test diff and first 210 lines of the current verifier. Whole-repository diff was oversized; the profile parser, remaining verifier and live issuer integration not audited.

The [verifier change](https://github.com/block/buzz/blob/acf56fff6fbfece9f143de3f096cb1d258fb9a9f/crates/buzz-auth/src/nip_fi/verifier.rs) attaches optional public-profile evidence after the existing admission path, restricts eligible subject classes and excludes agent-owned profiles. The [new fixture](https://github.com/block/buzz/blob/acf56fff6fbfece9f143de3f096cb1d258fb9a9f/crates/buzz-auth/src/nip_fi/verifier/tests.rs) expects malformed profile claims to leave admission/capabilities unchanged, and excludes profile names from debug output. The inspected key-snapshot constructor also binds issuer, positive generation and deadline with a bounded key count; this slice does not prove complete cryptographic or key-refresh correctness.

**Teamagent implication (inference):** Separate display metadata from authenticated identity and capabilities, and keep optional enrichment from granting authority. Bind reusable identity evidence to issuer and freshness generation, redact personal profile data in diagnostics, and preserve unavailable authority separately from rejected credentials.

**Verification limit:** committed-source inspection only; no upstream code, tests or provider calls were executed. Review scope is the cited implementation or authored guidance, not whole-project correctness, licensing clearance or measured performance. Source passages were redacted for review; exact URL literals were not byte-validated.

## External-update review - 2026-11-01

Reviewed `cde6c1bf5b1fa1fde6045de8ea29f6ac1c7e6867` against `acf56fff6fbfece9f143de3f096cb1d258fb9a9f`.

The 104-path update includes a focused relay liveness repair. [WebSocket opening](https://github.com/block/buzz/blob/cde6c1bf5b1fa1fde6045de8ea29f6ac1c7e6867/mobile/lib/shared/relay/relay_websocket.dart) now gives both header-bearing and ordinary connection attempts their own HTTP client and a ten-second default upgrade deadline. Timeout force-closes that client instead of only abandoning a waiting future. [RelaySocket](https://github.com/block/buzz/blob/cde6c1bf5b1fa1fde6045de8ea29f6ac1c7e6867/mobile/lib/shared/relay/relay_socket.dart) passes the deadline through so its existing disconnected/reconnect path can progress.

The inspected [liveness fixture](https://github.com/block/buzz/blob/cde6c1bf5b1fa1fde6045de8ea29f6ac1c7e6867/mobile/test/shared/relay/relay_socket_liveness_test.dart) accepts TCP without answering the upgrade and checks both disconnection and peer-observed socket closure, with and without scoped headers. This tests more than merely receiving a timeout exception.

**Harness consequence:** Bound channel connection establishment and own the underlying resource so timeout releases it; distinguish connection/upgrade deadlines from established-session heartbeat failure. This scoped static review covers those three complete deltas; channel auto-join, authentication, unread state and other mobile changes were not audited. No socket, relay, packaged mobile app or upstream test was executed.

<!-- teamagent-analysis:start -->
Analysis metadata: source [buzz](https://github.com/block/buzz); analyzed commit `cde6c1bf5b1fa1fde6045de8ea29f6ac1c7e6867`; commit date 2026-11-01T14:17:41-05:00; review date 2026-11-01T23:12:06.798Z; depth screened. [Maintenance record](../analyses/repos/ai-agents--buzz.md).
<!-- teamagent-analysis:end -->
