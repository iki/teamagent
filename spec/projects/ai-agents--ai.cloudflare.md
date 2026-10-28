# ai.cloudflare

Source: [ai.cloudflare](https://github.com/cloudflare/ai) · Category: [ai-agents](../categories/ai-agents.md)

Original review depth: **inventory / README screening only**. The dated update review below has its own explicit scope. This is an individual coverage record, not a source-code correctness audit or adoption recommendation.

Snapshot: `0e5bc3b2f489e4b8215905812a36fe69d37afb8d`; commit timestamp `2026-09-11T16:53:10+01:00`; 835 tracked paths.

## Scope and evidence

Upstream description excerpt (a project claim, automatically extracted from [README](https://github.com/cloudflare/ai/blob/0e5bc3b2f489e4b8215905812a36fe69d37afb8d/README.md)):

> Packages and examples for building AI-powered applications on Cloudflare. Includes providers for the Vercel AI SDK and TanStack AI, with support for Workers AI, AI Gateway, and AI Search. The `demos/` directory contains additional focused demos for specific patterns — tool calling, structured output, agents, MCP servers, and more.

Build/package evidence: [demos/agent-scheduler/package.json](https://github.com/cloudflare/ai/blob/0e5bc3b2f489e4b8215905812a36fe69d37afb8d/demos/agent-scheduler/package.json); [demos/agent-task-manager-human-in-the-loop/package.json](https://github.com/cloudflare/ai/blob/0e5bc3b2f489e4b8215905812a36fe69d37afb8d/demos/agent-task-manager-human-in-the-loop/package.json); [demos/agent-task-manager/package.json](https://github.com/cloudflare/ai/blob/0e5bc3b2f489e4b8215905812a36fe69d37afb8d/demos/agent-task-manager/package.json); [demos/evaluator-optimiser/package.json](https://github.com/cloudflare/ai/blob/0e5bc3b2f489e4b8215905812a36fe69d37afb8d/demos/evaluator-optimiser/package.json); [demos/hello-world/package.json](https://github.com/cloudflare/ai/blob/0e5bc3b2f489e4b8215905812a36fe69d37afb8d/demos/hello-world/package.json)

License evidence: [LICENSE](https://github.com/cloudflare/ai/blob/0e5bc3b2f489e4b8215905812a36fe69d37afb8d/LICENSE) Classification hint: MIT. A root license does not establish rights for every bundled asset, model, or dependency.

## Harness assessment

This entry was catalogued under **ai-agents**. Its category places it in the candidate set for agents, models, channels; those associations are navigational and have not been individually validated as implemented capabilities. See [agents](../agents.md) · [models](../models.md) · [channels](../channels.md) for the source-reviewed alternatives and proposed integration boundaries.

**Disposition:** retain as a comparison candidate. Before adopting it, inspect the implementation entry point and its tests, verify the required protocol and deployment platform, and reproduce a task from the harness evaluation suite. Popularity, a README feature list, and the presence of a package manifest are insufficient evidence of quality or compatibility.

**Unresolved:** runtime behavior, security boundaries, performance, API/subscription eligibility, dependency health, maintenance status, and fit to the proposed harness were not independently established for this entry. No repository code was executed as part of this screening.

## 2026-10-28 scoped update review

Reviewed commit `34a8f4c00c0871883215a7114e9a7f3e7747ee1b` (commit date `2026-10-27T10:39:32Z`). The original snapshot above remains historical evidence.

**Scope:** The changed AI Gateway wrapper entry point and its complete local diff; gateway-core reconnect implementation, replacement Agents API, provider-specific translators and account behavior were not audited.

The reviewed [delta](https://github.com/cloudflare/ai/blob/34a8f4c00c0871883215a7114e9a7f3e7747ee1b/packages/ai-gateway-provider/src/index.ts#L344-L359) deprecates the wrapper in favor of the Agents package and explicitly describes a semantic change: replacement fallback is client-side, one request per leg, instead of one universal gateway request. That comment is migration evidence, not inspection of the replacement implementation. Do not infer identical retry, billing, cancellation or data-routing behavior from an API rename; Teamagent's adopted runtime/provider choices remain unchanged.

In the [existing wrapper](https://github.com/cloudflare/ai/blob/34a8f4c00c0871883215a7114e9a7f3e7747ee1b/packages/ai-gateway-provider/src/index.ts#L85-L248), each model's internal fetch is overwritten to collect requests and the chosen model's fetch is overwritten again to consume the gateway response. No restoration occurs in this method. Shared model instances therefore require explicit ownership/concurrency verification before reuse. The gateway-selected fallback index is checked for a matching model, and missing-gateway and authentication errors have distinct handling; a fallback route still needs authorization and provider/data-policy constraints before submission.

Resumable streaming is opt-in and conditional on a run ID; the abort signal and reconnect policy pass to `gateway-core`. This scope did not inspect replay deduplication, expiry behavior or durable resume storage in that dependency. Likewise the `zdr` and logging options are requested headers, not evidence of account eligibility or measured retention. Preserve operation identity, effective destination and policy evidence separately from a successful HTTP response.

**Verification limit:** source inspection only; no upstream tests or provider calls were executed. This scoped review does not certify every file in the repository.

<!-- teamagent-analysis:start -->
Analysis metadata: source [ai.cloudflare](https://github.com/cloudflare/ai); analyzed commit `34a8f4c00c0871883215a7114e9a7f3e7747ee1b`; commit date 2026-10-27T10:39:32Z; review date 2026-10-28T08:47:42.123Z; depth screened. [Maintenance record](../analyses/repos/ai-agents--ai.cloudflare.md).
<!-- teamagent-analysis:end -->
