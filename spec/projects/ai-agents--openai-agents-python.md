# openai-agents-python

Source: [openai-agents-python](https://github.com/openai/openai-agents-python) · Category: [ai-agents](../categories/ai-agents.md)

Original review depth: **inventory / README screening only**. The dated update review below has its own explicit scope. This is an individual coverage record, not a source-code correctness audit or adoption recommendation.

Snapshot: `81f0ccf20c6e24063b9da36fa37f2bdb6a43d8d3`; commit timestamp `2026-10-02T18:35:55Z`; 1,668 tracked paths.

## Scope and evidence

Upstream description excerpt (a project claim, automatically extracted from [README](https://github.com/openai/openai-agents-python/blob/81f0ccf20c6e24063b9da36fa37f2bdb6a43d8d3/README.md)):

> The OpenAI Agents SDK is a lightweight yet powerful framework for building multi-agent workflows. It is provider-agnostic, supporting the OpenAI Responses and Chat Completions APIs, as well as 100+ other LLMs. Looking for the JavaScript/TypeScript version? Check out Agents SDK JS/TS.

Build/package evidence: [examples/live/app/requirements.txt](https://github.com/openai/openai-agents-python/blob/81f0ccf20c6e24063b9da36fa37f2bdb6a43d8d3/examples/live/app/requirements.txt); [examples/realtime/twilio/requirements.txt](https://github.com/openai/openai-agents-python/blob/81f0ccf20c6e24063b9da36fa37f2bdb6a43d8d3/examples/realtime/twilio/requirements.txt); [examples/realtime/twilio_sip/requirements.txt](https://github.com/openai/openai-agents-python/blob/81f0ccf20c6e24063b9da36fa37f2bdb6a43d8d3/examples/realtime/twilio_sip/requirements.txt); [pyproject.toml](https://github.com/openai/openai-agents-python/blob/81f0ccf20c6e24063b9da36fa37f2bdb6a43d8d3/pyproject.toml)

License evidence: [LICENSE](https://github.com/openai/openai-agents-python/blob/81f0ccf20c6e24063b9da36fa37f2bdb6a43d8d3/LICENSE) Classification hint: MIT. A root license does not establish rights for every bundled asset, model, or dependency.

## Harness assessment

This entry was catalogued under **ai-agents**. Its category places it in the candidate set for agents, models, channels; those associations are navigational and have not been individually validated as implemented capabilities. See [agents](../agents.md) · [models](../models.md) · [channels](../channels.md) for the source-reviewed alternatives and proposed integration boundaries.

**Disposition:** retain as a comparison candidate. Before adopting it, inspect the implementation entry point and its tests, verify the required protocol and deployment platform, and reproduce a task from the harness evaluation suite. Popularity, a README feature list, and the presence of a package manifest are insufficient evidence of quality or compatibility.

**Unresolved:** runtime behavior, security boundaries, performance, API/subscription eligibility, dependency health, maintenance status, and fit to the proposed harness were not independently established for this entry. No repository code was executed as part of this screening.

## 2026-10-28 scoped update review

Reviewed commit `bc4c6e124d39626f9ad77c58cb136c67e66c4cf7` (commit date `2026-10-27T17:34:02Z`). The original snapshot above remains historical evidence.

**Scope:** Streaming-result cancellation, cleanup and late-error branches, plus the complete tool.py delta; provider transport, full runner, hosted computer actions and test execution were outside scope.

The [streaming result](https://github.com/openai/openai-agents-python/blob/bc4c6e124d39626f9ad77c58cb136c67e66c4cf7/src/agents/result.py#L941-L987) distinguishes immediate cancellation from after-turn stopping, which can execute pending tools and save the turn before stopping. Immediate cancellation sets the stream-complete state and cancels tasks; that flag does not certify independently verified work or completed external cleanup. Applications must preserve the chosen cancellation semantics and continue settlement/reconciliation instead of presenting every stop as equivalent.

[Cleanup registration](https://github.com/openai/openai-agents-python/blob/bc4c6e124d39626f9ad77c58cb136c67e66c4cf7/src/agents/result.py#L809-L939) gives sandbox/provider cleanup separate tasks and done callbacks, including an early-cancelled run. The [stream finalizer](https://github.com/openai/openai-agents-python/blob/bc4c6e124d39626f9ad77c58cb136c67e66c4cf7/src/agents/result.py#L1106-L1149) waits for the run, rechecks late exceptions, then cleans up; queue-wait cancellation takes a quicker path. Cleanup failures can be logged, and no whole-cleanup deadline is imposed in these methods. Teamagent should retain resource-release outcome and late errors separately from stream delivery, with an outer host deadline and no assumption of external-effect rollback.

The reviewed tool delta returns a deep copy of [MCP annotations](https://github.com/openai/openai-agents-python/blob/bc4c6e124d39626f9ad77c58cb136c67e66c4cf7/src/agents/tool.py#L598-L613), explicitly identifying them as server hints rather than proof of side effects or safe retries. The updated ComputerTool callback documentation says it runs only for model-reported pending checks and that omission continues with a warning; this is documentary evidence in this scope, not a reviewed universal action gate. Preserve host authorization independently. The tool-error formatter also keeps original failure-policy identity separate from model-facing text. No account behavior, provider execution or integration adoption was tested.

**Verification limit:** source inspection only; no upstream tests or provider calls were executed. This scoped review does not certify every file in the repository.

<!-- teamagent-analysis:start -->
Analysis metadata: source [openai-agents-python](https://github.com/openai/openai-agents-python); analyzed commit `bc4c6e124d39626f9ad77c58cb136c67e66c4cf7`; commit date 2026-10-27T17:34:02Z; review date 2026-10-28T08:47:42.123Z; depth screened. [Maintenance record](../analyses/repos/ai-agents--openai-agents-python.md).
<!-- teamagent-analysis:end -->
