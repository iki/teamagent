# llm-observer-proxy-go

Source: [llm-observer-proxy-go](https://github.com/xxyyue/llm-observer-proxy-go) · Category: [ai-agents-proxy](../categories/ai-agents-proxy.md)

Review depth: **inventory / README screening only**. This is an individual coverage record, not a source-code correctness audit or adoption recommendation.

Snapshot: `dd809dfe1fd411f7eb3852353a8ac1d280643bad`; commit timestamp `2026-08-04T15:48:59+08:00`; 26 tracked paths.

## Scope and evidence

Upstream description excerpt (a project claim, automatically extracted from [README](https://github.com/xxyyue/llm-observer-proxy-go/blob/dd809dfe1fd411f7eb3852353a8ac1d280643bad/README.md)):

> [](https://github.com/xxyyue/llm-observer-proxy-go/actions/workflows/ci.yml) LLM Observer Proxy runs an embedded Bifrost data plane for each evaluation or agent run and stores its observable LLM traffic under a stable `run_id`. The observer records requests, responses, streaming output, tool calls, token usage, cost estimates, errors, and provider-visible reasoning content. It does not require Python, LiteLLM, Docker, or a separate Bifrost process.

Build/package evidence: [go.mod](https://github.com/xxyyue/llm-observer-proxy-go/blob/dd809dfe1fd411f7eb3852353a8ac1d280643bad/go.mod)

License evidence: [LICENSE](https://github.com/xxyyue/llm-observer-proxy-go/blob/dd809dfe1fd411f7eb3852353a8ac1d280643bad/LICENSE) Classification hint: Apache-2.0. A root license does not establish rights for every bundled asset, model, or dependency.

## Harness assessment

This entry was catalogued under **ai-agents-proxy**. Its category places it in the candidate set for models, decisions; those associations are navigational and have not been individually validated as implemented capabilities. See [models](../models.md) · [decisions](../decisions.md) for the source-reviewed alternatives and proposed integration boundaries.

**Disposition:** retain as a comparison candidate. Before adopting it, inspect the implementation entry point and its tests, verify the required protocol and deployment platform, and reproduce a task from the harness evaluation suite. Popularity, a README feature list, and the presence of a package manifest are insufficient evidence of quality or compatibility.

**Unresolved:** runtime behavior, security boundaries, performance, API/subscription eligibility, dependency health, maintenance status, and fit to the proposed harness were not independently established for this entry. No repository code was executed as part of this screening.

<!-- teamagent-analysis:start -->
Analysis metadata: source [llm-observer-proxy-go](https://github.com/xxyyue/llm-observer-proxy-go); analyzed commit `dd809dfe1fd411f7eb3852353a8ac1d280643bad`; commit date 2026-08-04T15:48:59+08:00; review date unknown; depth screened. [Maintenance record](../analyses/repos/ai-agents-proxy--llm-observer-proxy-go.md).
<!-- teamagent-analysis:end -->
