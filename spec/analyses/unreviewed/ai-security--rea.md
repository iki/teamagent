# rea

Source: [rea](https://github.com/morluto/rea) · [security](../../security.md), [agents](../../agents.md), [skills](../../skills.md).

Historical discovery: 2026-10-24T06:36:54.441Z, initially unreviewed. Dated scoped reviews below supersede that discovery-only status; they do not establish runtime validation. [Change evidence](../repos/ai-security--rea.md).

## Source update reviewed 2026-10-28

Reviewed commit: [`0cd7ef456bf960da265e04b341e82a24b1e377d5`](https://github.com/morluto/rea/commit/0cd7ef456bf960da265e04b341e82a24b1e377d5). Scope: Initial focused source review of five complete protocol, timeout, logging, result-delivery and browser-observation modules. Backend implementations and live tools were not exercised.

The [Ghidra response parser](https://github.com/morluto/rea/blob/0cd7ef456bf960da265e04b341e82a24b1e377d5/src/ghidra/protocol.ts) accepts JSON as unknown, validates a strict discriminated response and separates remote errors from malformed transport data. It does not itself bound line bytes or authenticate the sender. The [startup policy](https://github.com/morluto/rea/blob/0cd7ef456bf960da265e04b341e82a24b1e377d5/src/mcpStartupPolicy.ts) explicitly distinguishes client timeout guidance from enforced phase deadlines and labels its estimate as a single-request allowance rather than a bulk-work bound. Adapt those distinctions without changing Teamagent's Effect Schema/service choices.

The [browser observation schema](https://github.com/morluto/rea/blob/0cd7ef456bf960da265e04b341e82a24b1e377d5/src/domain/webExecution.ts) records UTF-16/exclusive coverage offsets, unavailable coverage, unknown causal attribution, excluded observations and the instrumentation's effects on execution. Successful results require confirmed cleanup, while the broader observation shape can preserve unconfirmed cleanup. This is a useful evidence vocabulary, not proof that the runtime fulfills it. [Tool logging](https://github.com/morluto/rea/blob/0cd7ef456bf960da265e04b341e82a24b1e377d5/src/server/toolLogging.ts) emits names, duration and status without caller inputs; thrown exceptions bypass that completion log. [Result delivery](https://github.com/morluto/rea/blob/0cd7ef456bf960da265e04b341e82a24b1e377d5/src/server/toolResult.ts) attaches schema-validated continuation requests for retained evidence, but the byte-budget implementation and retention ownership are outside this review. No reverse-engineering tool, browser instrumentation or tests were run.


## 2026-10-28 follow-up source review

Reviewed commit `df7119aeede60f9f81a74f29d6606c49adb79d8e` (commit date `2026-10-28T18:17:45+08:00`), compared with `0cd7ef456bf960da265e04b341e82a24b1e377d5`. Earlier findings remain historical evidence.

**Scope:** Complete new GuidedWorkflowAccess.ts and registerGuidedWorkflowTool.ts branches; the much larger analysis/runtime delta remains outside this focused inspection. The complete changed-path inventory contains 230 paths. Citations below identify current lines visible in the captured committed diff; this is a scoped assessment, not a whole-repository audit.

Guided workflow access validates an unknown request, exposes a provider-free list/render operation, and distinguishes an unknown identifier from one excluded by the selected tool-family scope. It separately validates arguments for the selected contract before rendering. MCP registration derives the available prompts from the server's advertised families and passes that set into the access function. [src/application/GuidedWorkflowAccess.ts](https://github.com/morluto/rea/blob/df7119aeede60f9f81a74f29d6606c49adb79d8e/src/application/GuidedWorkflowAccess.ts#L21-L81); [src/server/registerGuidedWorkflowTool.ts](https://github.com/morluto/rea/blob/df7119aeede60f9f81a74f29d6606c49adb79d8e/src/server/registerGuidedWorkflowTool.ts#L7-L20).

This is a useful separation between passive guidance discovery and execution. Rendering a valid prompt neither runs an analysis nor authorizes a tool operation. A Teamagent adapter must retain that distinction and enforce the actual capability scope at execution, because advertised visibility by itself is not authority. No reverse-engineering target, provider or upstream service was run.

**Verification limit:** static committed-source inspection only; no upstream code, tests, deployments or provider calls were executed. Imported instructions remain research data, and this review does not establish a Teamagent integration.

## 2026-11-01 scoped source review

Reviewed frozen commit `60c0cf977a34c99afa7942466625aeba74969bdf` against prior analyzed commit `df7119aeede60f9f81a74f29d6606c49adb79d8e`. Historical reviews above remain separate evidence.

The [JSON authentication estimator](https://github.com/morluto/rea/blob/60c0cf977a34c99afa7942466625aeba74969bdf/src/application/JsonAuthenticationHeadroom.ts) adds a maximum-value-byte budget and optional serialized-size work. Its iterator stack exits once the estimated parsed representation exceeds the budget and skips expensive string escaping once that threshold is crossed. The returned value is explicitly a lower bound after early termination, not an exact complete measurement. The [new adversarial fixture](https://github.com/morluto/rea/blob/60c0cf977a34c99afa7942466625aeba74969bdf/src/application/JsonAuthenticationHeadroom.test.ts) places an oversized first value before a throwing getter and checks the later property is never visited.

Teamagent should reject over-budget representations before cloning/canonicalizing them, with a bounded traversal as well as bounded input bytes. This estimate is conservative arithmetic, not measured heap allocation; the selected code still accesses object properties and does not establish safety for arbitrary executable objects, cycles or proxies. Restrict the boundary to validated parsed JSON and keep a separate deadline/depth policy.

**Coverage:** Read the complete targeted estimator and new test delta. Wider authentication callers and existing traversal tests were not re-audited. Source inspection only; no upstream tests, source programs or live providers were executed. This is a scoped architecture review, not a whole-repository correctness or security certification.

## External-update review - 2026-11-01

Reviewed `d3ab0faf52a02ff5a618f3ed7beb608b78752abd` against `60c0cf977a34c99afa7942466625aeba74969bdf`.

The 418-path update has a focused lifecycle improvement in [call-relationship traversal](https://github.com/morluto/rea/blob/d3ab0faf52a02ff5a618f3ed7beb608b78752abd/src/application/CallRelationshipTraversal.ts): provider cancellation or unconfirmed owned-resource cleanup returns stopped, while an ordinary unavailable read and an unreadable response retain separate states. The stopped result identifies discovered procedures that were not expanded, preserving uncertainty instead of continuing into unresolved provider state.

The complete inspected [direct cleanup delta](https://github.com/morluto/rea/blob/d3ab0faf52a02ff5a618f3ed7beb608b78752abd/src/application/DirectAnalysisCleanup.ts) and [composed-error delta](https://github.com/morluto/rea/blob/d3ab0faf52a02ff5a618f3ed7beb608b78752abd/src/domain/analysisErrorCleanup.ts) retain the primary failure alongside cleanup failure and project remediation for the invocation that owns the resources. They preserve admitted partial observation and avoid duplicating captured output in a nested error projection. Shared projection/redaction internals were not re-audited.

The first 190 diff lines of the new [MCP boundary fixture](https://github.com/morluto/rea/blob/d3ab0faf52a02ff5a618f3ed7beb608b78752abd/tests/boundary/mcp/callGraphCleanupIncomplete.test.ts) construct an owned-worker cleanup failure and expect traversal to stop before the queued sibling, with an inline partial observation, explicit cleanup resources and unknown goal status. Remaining fixture cases were not read in this slice.

**Harness consequence:** Treat cleanup completeness as a separate execution prerequisite, keep useful partial evidence with its unexpanded scope, and assign retry/recovery authority to the actual resource owner. A primary analysis failure does not erase a cleanup obligation, and releasing a caller's view does not establish process termination. This scoped review covers three complete implementation deltas and the stated fixture prefix, not the remaining reverse-engineering providers, installers or application boundaries. No upstream program, native analyzer, MCP service, fixture or test was executed.

<!-- teamagent-analysis:start -->
Analysis metadata: source [rea](https://github.com/morluto/rea); analyzed commit `d3ab0faf52a02ff5a618f3ed7beb608b78752abd`; commit date 2026-11-02T03:14:29+08:00; review date 2026-11-01T23:12:06.798Z; depth reviewed. [Maintenance record](../repos/ai-security--rea.md).
<!-- teamagent-analysis:end -->
