# openrig

Source: [openrig](https://github.com/mvschwarz/openrig) · [agents](../../agents.md), [models](../../models.md), [channels](../../channels.md).

Historical discovery: 2026-10-24T06:36:54.441Z, initially unreviewed. Dated scoped reviews below supersede that discovery-only status; they do not establish runtime validation. [Change evidence](../repos/ai-agents--openrig.md).

## 2026-10-28 scoped source review

Source: [openrig](https://github.com/mvschwarz/openrig); inspected saved discovery revision `84d6bbdbd92abdcfe818e7d3f8097b4cc31ac175`. This is an initial scoped review of this newly catalogued source.

**Scope:** Full CLI session-name parser, provider-readiness helper and agent-validation CLI tests read. Gateway admission, daemon provider selection, client transport, schema validator and actual provider authentication were not audited.

The [session-name contract](https://github.com/mvschwarz/openrig/blob/84d6bbdbd92abdcfe818e7d3f8097b4cc31ac175/packages/cli/src/session-name.ts) separates lexical classification from gateway admission. External references are classified before canonical member/rig names, and additional at-signs remain in the rig component for a later lookup to reject. It deliberately does not trim or validate the full character set. Human-seat classification must occur at callers; neither a human-shaped identifier nor successful parsing authenticates a person. The comments describe three mirrored copies and a parity test, but that parity test and the admission boundary were not inspected.

The [provider-readiness helper](https://github.com/mvschwarz/openrig/blob/84d6bbdbd92abdcfe818e7d3f8097b4cc31ac175/packages/cli/src/provider-auth.ts) distinguishes absent tools, local credential presence and unresolved configuration. An explicitly non-OpenAI provider can use a validated environment-variable name, and its success message correctly disclaims provider acceptance and propagation to managed seats. Other configuration layers remain unresolved. Raw caught error messages enter diagnostics, so the execution adapter needs redaction and bounds. The [agent CLI tests](https://github.com/mvschwarz/openrig/blob/84d6bbdbd92abdcfe818e7d3f8097b4cc31ac175/packages/cli/test/agent.test.ts) exercise a fake daemon that accepts/rejects by an INVALID substring; they do not validate production schemas or authorization. Adapt honest readiness states and separate name parsing, identity and admission; no daemon, provider or tests were run.

## 2026-10-28 follow-up source review

Reviewed the frozen update from `84d6bbdbd92abdcfe818e7d3f8097b4cc31ac175` to `6957751f5e39af15a3ccf04a579a8477d2744d88`. Earlier findings above remain historical evidence; this review is limited to the cited source and delta.

In [packages/daemon/src/domain/terminal/terminal-provider.ts](https://github.com/mvschwarz/openrig/blob/6957751f5e39af15a3ccf04a579a8477d2744d88/packages/daemon/src/domain/terminal/terminal-provider.ts#L111-L153), The terminal-provider contract now returns a stable workspace identity and following status for explicitly followed tasks, and exposes an optional followView operation with a required stillCurrent callback. Existing result fields distinguish opened, absent and degraded seats from hard provider failure.

**Harness implication and limits:** Negotiate live-follow support independently of ordinary view rendering, and recheck view generation before applying asynchronous updates. Optional interface members and a callback signature do not prove that a provider invokes the check or fences stale writes. Implementation, reconnection, cancellation and real terminal behavior were not audited; no provider was launched. This static review does not certify other changed subsystems.

## 2026-11-01 scoped source review

Reviewed frozen commit `b25dd19a5a818e8cba7bfe2b0267093c0305cb4e` against prior analyzed commit `6957751f5e39af15a3ccf04a579a8477d2744d88`. Historical reviews above remain separate evidence.

The [Codex permission observer](https://github.com/mvschwarz/openrig/blob/b25dd19a5a818e8cba7bfe2b0267093c0305cb4e/packages/daemon/src/domain/codex-rebuild-permissions.ts) now requires exact native argv rather than splitting a display command. Missing/malformed arguments leave policy unverified before transcript lookup; the observer retains its process-start, occupant-generation and thread-identity checks. The [fixtures](https://github.com/mvschwarz/openrig/blob/b25dd19a5a818e8cba7bfe2b0267093c0305cb4e/packages/daemon/test/codex-rebuild-permissions.test.ts) cover a spaced profile, absent/empty/NUL/wrong-executable argv, a thread-like option value and valid native-log joining. These are mocked process observations, not evidence that every host can obtain authenticated argv.

The [seat lifecycle](https://github.com/mvschwarz/openrig/blob/b25dd19a5a818e8cba7bfe2b0267093c0305cb4e/packages/daemon/src/domain/seat-lifecycle-service.ts) also reports unknown effort when exact arguments cannot be read and labels managed community stops `paneOnly`. Its [stop fixture](https://github.com/mvschwarz/openrig/blob/b25dd19a5a818e8cba7bfe2b0267093c0305cb4e/packages/daemon/test/seat-lifecycle-service.test.ts) retains the audit event while asserting the selected pane is killed. Teamagent should distinguish configured, emitted and observed policy, and distinguish closing a viewer from verified termination of the underlying agent/provider work.

**Coverage:** Read all four targeted permission/lifecycle implementation and fixture deltas. Native argv collection and other lifecycle paths were not re-audited. Source inspection only; no upstream tests, source programs or live providers were executed. This is a scoped architecture review, not a whole-repository correctness or security certification.

<!-- teamagent-analysis:start -->
Analysis metadata: source [openrig](https://github.com/mvschwarz/openrig); analyzed commit `b25dd19a5a818e8cba7bfe2b0267093c0305cb4e`; commit date 2026-10-30T07:49:24-07:00; review date 2026-11-01T11:33:30.893Z; depth reviewed. [Maintenance record](../repos/ai-agents--openrig.md).
<!-- teamagent-analysis:end -->
