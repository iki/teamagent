# RTK: recoverable compression of command output

Source: [rtk](https://github.com/rtk-ai/rtk) · Category: `ai-agents-proxy`

Review depth: **source-reviewed**. Snapshot `c356374fc1c9cff132c02484d2b9195c796b8e8f`; assessed 2026-10-04. This is a focused static review of the listed files, not an audit of every code path or a reproduced benchmark. No repository code, model weights, paid endpoints, or installers were run.

## Observed architecture

RTK is a command-output adapter. Its CLI exposes filtered execution, unfiltered execution with usage tracking, recall by content hash, custom-filter trust management, and filter verification. The shared search implementation runs the requested search engine, groups matches by file, caps output, and retains overflow. The code explicitly distinguishes grep and ripgrep argument semantics instead of rewriting one into the other.

A documented Windows limitation in the inspected code uses a broader stdin-detection rule than Unix. This is a useful reminder that compression tools affect tool semantics and require platform-specific fixtures, even when their primary purpose is reducing tokens.

## Harness adoption

Adopt the pattern of a compact observation plus a stable handle to complete output. Store raw stdout, stderr, exit status, truncation metadata, command arguments, and provenance in the artifact store before presenting a smaller model-facing result. Preserve failures, stack traces, filenames, and diagnostic counts. An agent should be able to request omitted evidence without rerunning a potentially expensive or stateful command.

Treat compression as a decision problem: compress verbose successful output aggressively, retain diagnostic evidence for failures, and bypass lossy transforms for machine-readable contracts or exact-match analysis. Measure total task cost including recall and repeated commands; a smaller first observation is not automatically a cheaper successful task.

## Limitations and decision

Shortlist for optional terminal adapters after regression checks on Windows and the target shell. Custom project filters are executable policy and should be reviewed/versioned like skills. Compression is not durable semantic memory and does not certify that the retained lines are sufficient. The harness should preserve authoritative raw output even when RTK's own recall facility is used.

## Evidence read

- [CLI filter, trust, and recall surface](https://github.com/rtk-ai/rtk/blob/c356374fc1c9cff132c02484d2b9195c796b8e8f/src/main.rs#L730-L787)
- [Search engine preservation and platform caveat](https://github.com/rtk-ai/rtk/blob/c356374fc1c9cff132c02484d2b9195c796b8e8f/src/cmds/system/search.rs#L1-L103)

## Related directions

[Models](../models.md) · [Memory](../memory.md) · [Agents](../agents.md) · [Decisions](../decisions.md)

## Source update reviewed 2026-10-28

Reviewed commit: [`e05c7bdfacfcfe1f845d11f47339e4eae63eb3f5`](https://github.com/rtk-ai/rtk/commit/e05c7bdfacfcfe1f845d11f47339e4eae63eb3f5). Scope: Full proxy HTTP-error mapping and model-registry module including embedded tests read. Compression, proxy request handling, persistence and model-call runtime were not audited.

The [error adapter](https://github.com/rtk-ai/rtk/blob/e05c7bdfacfcfe1f845d11f47339e4eae63eb3f5/proxy/src/error.rs) returns generic server-error messages and tests that upstream/internal details do not reach the HTTP body. It still logs the original details, including possible upstream URLs, so this is client-response redaction rather than end-to-end secret protection. Teamagent needs structured redacted diagnostics at the logging boundary as well as safe user errors.

The [model registry](https://github.com/rtk-ai/rtk/blob/e05c7bdfacfcfe1f845d11f47339e4eae63eb3f5/proxy/src/models.rs) deliberately ships no price estimates and returns None unless both input/output prices are supplied. It documents a shared database copy as authority over per-pod bootstrap seeds, but those persistence paths were not inspected. Matching is first substring, floating prices/cache multipliers lack visible semantic bounds, and poisoned-lock writes silently do nothing. Preserve unknown cost and operator/source provenance, with explicit finite-value validation and update failure reporting. This review establishes neither compression savings nor proxy security. No proxy, model, database or tests were executed.

<!-- teamagent-analysis:start -->
Analysis metadata: source [rtk](https://github.com/rtk-ai/rtk); analyzed commit `e05c7bdfacfcfe1f845d11f47339e4eae63eb3f5`; commit date 2026-10-25T13:57:20+01:00; review date 2026-10-28T09:45:33.667Z; depth source-reviewed. [Maintenance record](../analyses/repos/ai-agents-proxy--rtk.md).
<!-- teamagent-analysis:end -->
