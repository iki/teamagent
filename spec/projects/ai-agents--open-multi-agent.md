# open-multi-agent

Source: [open-multi-agent](https://github.com/JackChen-me/open-multi-agent) · Category: [ai-agents](../categories/ai-agents.md)

Review depth: **inventory / README screening only**. This is an individual coverage record, not a source-code correctness audit or adoption recommendation.

Snapshot: `3563a9312b304fffca49873c0dcf6c3b259a0f58`; commit timestamp `2026-10-03T00:26:29+08:00`; 663 tracked paths.

## Scope and evidence

Upstream description excerpt (a project claim, automatically extracted from [README](https://github.com/JackChen-me/open-multi-agent/blob/3563a9312b304fffca49873c0dcf6c3b259a0f58/README.md)):

> OMA (Open Multi-Agent) is a self-hosted TypeScript agent runtime: consequential actions wait for durable, tamper-evident approvals, and every run leaves a record you can verify offline, byte for byte. No telemetry. No hosted control plane. Your keys, your models — cloud, local (Ollama, vLLM, llama-server), or Chinese providers — your environment. Nothing stops working when the people who built it leave.

Build/package evidence: [package.json](https://github.com/JackChen-me/open-multi-agent/blob/3563a9312b304fffca49873c0dcf6c3b259a0f58/package.json); [packages/core/examples/integrations/express-customer-support/package.json](https://github.com/JackChen-me/open-multi-agent/blob/3563a9312b304fffca49873c0dcf6c3b259a0f58/packages/core/examples/integrations/express-customer-support/package.json); [packages/core/examples/integrations/with-vercel-ai-sdk/package.json](https://github.com/JackChen-me/open-multi-agent/blob/3563a9312b304fffca49873c0dcf6c3b259a0f58/packages/core/examples/integrations/with-vercel-ai-sdk/package.json); [packages/core/package.json](https://github.com/JackChen-me/open-multi-agent/blob/3563a9312b304fffca49873c0dcf6c3b259a0f58/packages/core/package.json); [packages/create-oma-app/package.json](https://github.com/JackChen-me/open-multi-agent/blob/3563a9312b304fffca49873c0dcf6c3b259a0f58/packages/create-oma-app/package.json)

License evidence: [LICENSE](https://github.com/JackChen-me/open-multi-agent/blob/3563a9312b304fffca49873c0dcf6c3b259a0f58/LICENSE) Classification hint: MIT. A root license does not establish rights for every bundled asset, model, or dependency.

## Harness assessment

This entry was catalogued under **ai-agents**. Its category places it in the candidate set for agents, models, channels; those associations are navigational and have not been individually validated as implemented capabilities. See [agents](../agents.md) · [models](../models.md) · [channels](../channels.md) for the source-reviewed alternatives and proposed integration boundaries.

**Disposition:** retain as a comparison candidate. Before adopting it, inspect the implementation entry point and its tests, verify the required protocol and deployment platform, and reproduce a task from the harness evaluation suite. Popularity, a README feature list, and the presence of a package manifest are insufficient evidence of quality or compatibility.

**Unresolved:** runtime behavior, security boundaries, performance, API/subscription eligibility, dependency health, maintenance status, and fit to the proposed harness were not independently established for this entry. No repository code was executed as part of this screening.
