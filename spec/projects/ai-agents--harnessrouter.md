# harnessrouter

Source: [harnessrouter](https://github.com/HarnessRouter/harnessrouter) · Category: [ai-agents](../categories/ai-agents.md)

Original review depth: **inventory / README screening only**. The dated update review below has its own explicit scope. This is an individual coverage record, not a source-code correctness audit or adoption recommendation.

Snapshot: `f3192445c82da533fe83b125917efb8c3947aef0`; commit timestamp `2026-10-02T03:22:26-07:00`; 528 tracked paths.

## Scope and evidence

Upstream description excerpt (a project claim, automatically extracted from [README](https://github.com/HarnessRouter/harnessrouter/blob/f3192445c82da533fe83b125917efb8c3947aef0/README.md)):

> Build agent products without handling harness engineering.** HarnessRouter is the infrastructure layer that turns existing harnesses like Codex and Claude Code into plug-and-play agent backends, letting your product run tasks, retrieve results, and switch harnesses through one API. HarnessRouter implements the Unified Harness Protocol (UHP) and provides an OpenAI Responses-compatible API, handling persistent sessions, streaming progress, files, artifacts, cancellation, and structured failures.

Build/package evidence: [gateway/requirements.txt](https://github.com/HarnessRouter/harnessrouter/blob/f3192445c82da533fe83b125917efb8c3947aef0/gateway/requirements.txt); [protocol/conformance/pyproject.toml](https://github.com/HarnessRouter/harnessrouter/blob/f3192445c82da533fe83b125917efb8c3947aef0/protocol/conformance/pyproject.toml); [protocol/site/requirements.txt](https://github.com/HarnessRouter/harnessrouter/blob/f3192445c82da533fe83b125917efb8c3947aef0/protocol/site/requirements.txt); [runner/requirements.txt](https://github.com/HarnessRouter/harnessrouter/blob/f3192445c82da533fe83b125917efb8c3947aef0/runner/requirements.txt); [scripts/support-matrix/package.json](https://github.com/HarnessRouter/harnessrouter/blob/f3192445c82da533fe83b125917efb8c3947aef0/scripts/support-matrix/package.json)

License evidence: [LICENSE](https://github.com/HarnessRouter/harnessrouter/blob/f3192445c82da533fe83b125917efb8c3947aef0/LICENSE) Classification hint: Apache-2.0. A root license does not establish rights for every bundled asset, model, or dependency.

## Harness assessment

This entry was catalogued under **ai-agents**. Its category places it in the candidate set for agents, models, channels; those associations are navigational and have not been individually validated as implemented capabilities. See [agents](../agents.md) · [models](../models.md) · [channels](../channels.md) for the source-reviewed alternatives and proposed integration boundaries.

**Disposition:** retain as a comparison candidate. Before adopting it, inspect the implementation entry point and its tests, verify the required protocol and deployment platform, and reproduce a task from the harness evaluation suite. Popularity, a README feature list, and the presence of a package manifest are insufficient evidence of quality or compatibility.

**Unresolved:** runtime behavior, security boundaries, performance, API/subscription eligibility, dependency health, maintenance status, and fit to the proposed harness were not independently established for this entry. No repository code was executed as part of this screening.

## 2026-10-28 scoped update review

Reviewed commit `20d73fe727c82d13eff8f49b938acbb4d7ca294f` (commit date `2026-10-27T01:40:56-07:00`). The original snapshot above remains historical evidence.

**Scope:** Complete ACP turn client/terminal/stream translator and remote MCP bridge; runner server, container isolation, individual CLI drivers, SDK transports and tests were not reviewed.

The [ACP client](https://github.com/HarnessRouter/harnessrouter/blob/20d73fe727c82d13eff8f49b938acbb4d7ca294f/runner/acp_turn.py#L92-L227) gates recording until the current prompt to avoid replaying loaded history as a new answer and wakes pending calls when the agent closes its stream. Close waits for the main agent to exit, escalating after a grace interval, but its final wait is unbounded and terminal kill/release does not await terminal settlement. Timed-out RPC slots are not removed on the timeout branch, incoming requests launch an unbounded thread per call, and line parsing has no ingress byte/schema budget. These limits matter even when output tail retention is bounded.

The [permission and terminal handlers](https://github.com/HarnessRouter/harnessrouter/blob/20d73fe727c82d13eff8f49b938acbb4d7ca294f/runner/acp_turn.py#L207-L267) automatically choose an allow-like option, or the first option, on the stated assumption that the outer sandbox is the trust boundary. Terminal requests can supply command, working directory and environment additions; the requested output limit has a minimum but no maximum. This is a deliberate unattended-runner trust model, not a reusable authorization mechanism. The surrounding isolation implementation was not reviewed, so Teamagent must not import the automatic grant or arbitrary host-process capability without its own effect boundary.

The [stream translator](https://github.com/HarnessRouter/harnessrouter/blob/20d73fe727c82d13eff8f49b938acbb4d7ca294f/runner/acp_turn.py#L287-L388) sends tool use/result events incrementally and keeps thinking separate from answer text. When an agent never reports completion, it emits explanatory unknown-result text but sets is_error false; consumers that inspect only that flag may treat the synthetic result as success. Tool output clipping is also not accompanied by an explicit truncation field. Preserve unknown, failed and succeeded as distinct machine-readable outcomes and retain source call identity instead of relying on inferred human titles.

The [MCP bridge](https://github.com/HarnessRouter/harnessrouter/blob/20d73fe727c82d13eff8f49b938acbb4d7ca294f/runner/mcp_bridge.py#L27-L105) keeps structuredContent and remote isError, but disables local input validation and silently drops undeclared top-level arguments for closed schemas. That changes the submitted call rather than rejecting it; schema composition and remote validation remain the server's responsibility. Tool/resource/prompt listing does not follow pagination here, and invalid header JSON falls back to no headers. Teamagent should report transformed arguments and incomplete discovery explicitly, with validation and authority bound to the exact executed call.

**Verification limit:** source inspection only; no upstream tests or provider calls were executed. This scoped review does not certify every file in the repository.

## 2026-10-28 follow-up source review

Reviewed commit `b2091142cdca2f1d0cbaffc3e0e42c983dc88b24` (commit date `2026-10-27T13:12:25-07:00`), compared with `20d73fe727c82d13eff8f49b938acbb4d7ca294f`. Earlier findings remain historical evidence.

**Scope:** Relay signature-maker lookup and the exact two harness/model exclusions; large source files were captured with a 2 MiB bound but only cited ranges and their deltas were reviewed. The complete changed-path inventory contains 8 paths; the assessment below is limited to the cited branches.

The relay records the producing model under both tool-call IDs and a truncated SHA-256 digest of each signature, allowing lookup when a harness rewrites call IDs. The process-wide map evicts oldest entries above 50,000; a known other-model signature is replaced in the outgoing provider projection, while an unknown maker remains unknown unless the distrust path is selected. See [runner/server.py](https://github.com/HarnessRouter/harnessrouter/blob/b2091142cdca2f1d0cbaffc3e0e42c983dc88b24/runner/server.py#L4964-L5008) and [runner/server.py](https://github.com/HarnessRouter/harnessrouter/blob/b2091142cdca2f1d0cbaffc3e0e42c983dc88b24/runner/server.py#L5294-L5321). The added fixture covers rewritten IDs without storing raw signatures as map keys; it was inspected, not run. See [runner/tests/test_relay_signature_maker.py](https://github.com/HarnessRouter/harnessrouter/blob/b2091142cdca2f1d0cbaffc3e0e42c983dc88b24/runner/tests/test_relay_signature_maker.py#L161-L177).

For Teamagent, retain producer/model/account/session provenance for opaque continuation material and preserve original history separately from transport repair. The process-wide call-ID map is not itself a tenant namespace or durable store. A provider-confirmed signature rejection and an ambiguous transport failure require different recovery rules; this helper does not establish idempotency for billable actions. The gateway also removes two specific harness/model pairs based on documented upstream observations, not a general model ranking; those observations were not reproduced here. See [gateway/app.py](https://github.com/HarnessRouter/harnessrouter/blob/b2091142cdca2f1d0cbaffc3e0e42c983dc88b24/gateway/app.py#L8396-L8427).

**Verification limit:** committed-source inspection only; no upstream code, tests or provider calls were executed. This review does not certify every changed file or establish a Teamagent integration.

## 2026-11-01 scoped source review

Reviewed frozen commit `e94398d9c91a21ae7e01c630e2eeffa4defe1cfb` against prior analyzed commit `b2091142cdca2f1d0cbaffc3e0e42c983dc88b24`. Historical reviews above remain separate evidence.

The [harness creation path](https://github.com/HarnessRouter/harnessrouter/blob/e94398d9c91a21ae7e01c630e2eeffa4defe1cfb/gateway/app.py) now reserves an optional idempotency key before preparation writes, scopes it by organization/workspace/operation, hashes the request before preparation rewrites it, rejects changed-body reuse and replays an existing result. Missing durable storage refuses keyed creation. The [complete focused fixture](https://github.com/HarnessRouter/harnessrouter/blob/e94398d9c91a21ae7e01c630e2eeffa4defe1cfb/gateway/tests/test_harness_idempotency.py) checks replay, body mismatch, preparation mutation/failure, waiting, workspace separation, deletion and advertised capability.

The recovery policy treats a missing result after 120 seconds as an abandoned claim and takes it over; a caught preparation/upsert exception also releases the claim. Those observations alone do not prove the original worker stopped or that a remote upsert had no effect. The fixture's stale-claim case creates an artificial missing result, not a still-running original operation. Adopt durable request identity and pre-effect receipts, but require ownership/fencing or reconciliation before ambiguous takeover. Do not transfer this age-only policy to billable speech or voice enrollment.

**Coverage:** Read the complete 193-line idempotency fixture and the gateway claim/create delta (selected diff offsets 117–239), plus nearby alias changes. Durable-store atomicity, upsert uncertainty and full preparation side effects were not audited. Source inspection only; no upstream tests, source programs or live providers were executed. This is a scoped architecture review, not a whole-repository correctness or security certification.

## 2026-11-01 external-update review

Reviewed [https://github.com/HarnessRouter/harnessrouter](https://github.com/HarnessRouter/harnessrouter) at `f6592b27e0d46478f895100a20827d60b538acf4` against prior analyzed `e94398d9c91a21ae7e01c630e2eeffa4defe1cfb`. Evidence: [runner/server.py](https://github.com/HarnessRouter/harnessrouter/blob/f6592b27e0d46478f895100a20827d60b538acf4/runner/server.py), [runner/tests/test_produced_cursor.py](https://github.com/HarnessRouter/harnessrouter/blob/f6592b27e0d46478f895100a20827d60b538acf4/runner/tests/test_produced_cursor.py).

Produced-file filtering now recognizes deletion in either Git porcelain status column instead of only a leading D. New fixtures cover unstaged, staged and checkpointed deletion after collection, and verify that the listed remaining file has a downloadable response.

**Architecture consequence:** Artifact inventories must model deletion and independently validate current availability; a prior collection event is not proof an artifact still exists. Parse both index and working-tree state when producing user-visible artifacts.

**Scope and limits:** Read the complete two-file diff and regression assertions. Upstream HTTP tests and file-download behavior were not executed.

<!-- teamagent-analysis:start -->
Analysis metadata: source [harnessrouter](https://github.com/HarnessRouter/harnessrouter); analyzed commit `f6592b27e0d46478f895100a20827d60b538acf4`; commit date 2026-11-01T02:07:14-08:00; review date 2026-11-01T23:12:06.798Z; depth screened. [Maintenance record](../analyses/repos/ai-agents--harnessrouter.md).
<!-- teamagent-analysis:end -->
