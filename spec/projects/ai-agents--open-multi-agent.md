# open-multi-agent

Source: [open-multi-agent](https://github.com/JackChen-me/open-multi-agent) · Category: [ai-agents](../categories/ai-agents.md)

Original review depth: **inventory / README screening only**. The dated update review below has its own explicit scope. This is an individual coverage record, not a source-code correctness audit or adoption recommendation.

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

## 2026-10-28 scoped update review

Reviewed commit `009bdbe079a9dfa00ec1ae5819b79000a2889135` (commit date `2026-10-24T11:41:14+08:00`). The original snapshot above remains historical evidence.

**Scope:** Tool execution/gating, delegation and path-safety implementation with selected gate/truncation fixtures; durable approval storage and complete built-in-tool behavior were not audited.

The [executor](https://github.com/JackChen-me/open-multi-agent/blob/009bdbe079a9dfa00ec1ae5819b79000a2889135/packages/core/src/tool/executor.ts#L180-L355) validates input before the optional tool gate, rejects malformed decisions, checks cancellation again after awaiting a decision, and compares durable decision content with the current call before execution. These are useful ordering requirements. This scope did not inspect the durable approval store or its trust model, and an omitted gate permits execution; the library hook is not by itself a mandatory authorization service. The inspected [deny/cancel fixtures](https://github.com/JackChen-me/open-multi-agent/blob/009bdbe079a9dfa00ec1ae5819b79000a2889135/packages/core/tests/tool-executor.test.ts#L130-L194) assert that the tool is not invoked after rejection or cancellation during a pending gate.

The [delegation tool](https://github.com/JackChen-me/open-multi-agent/blob/009bdbe079a9dfa00ec1ae5819b79000a2889135/packages/core/src/tool/built-in/delegate.ts) checks roster membership, self/cyclic delegation, depth and available pool slots before waiting for a child, avoiding one nested-pool deadlock path. It returns child success/error and token usage, with shared-memory writes treated as best effort. Teamagent still needs aggregate budgets, durable child identity and explicit memory-write failures where memory is required for the task.

[Path safety](https://github.com/JackChen-me/open-multi-agent/blob/009bdbe079a9dfa00ec1ae5819b79000a2889135/packages/core/src/tool/built-in/path-safety.ts) resolves existing ancestors/symlinks, checks workspace containment and returns the canonical candidate. A null workspace disables that boundary, and a pathname checked before opening remains exposed to mutable-ancestor races; canonicalization is not an OS sandbox. Likewise [output truncation](https://github.com/JackChen-me/open-multi-agent/blob/009bdbe079a9dfa00ec1ae5819b79000a2889135/packages/core/src/tool/executor.ts#L499-L519) bounds returned text after production, with a tiny budget falling back to an unmarked slice. Separate host resource limits, explicit truncation metadata and effect-time filesystem enforcement remain necessary.

**Verification limit:** source inspection only; no upstream tests or provider calls were executed. This scoped review does not certify every file in the repository.

## 2026-11-01 scoped source refresh

Reviewed `009bdbe079a9dfa00ec1ae5819b79000a2889135` → `0b263fedca977d5f831539e02ddda1ec53917ecb`: all four changed core implementation deltas and their four test deltas. Documentation, package/version and template updates in the 18-path inventory were not compatibility-tested. Earlier findings remain historical evidence.

The [stream adapter](https://github.com/JackChen-me/open-multi-agent/blob/0b263fedca977d5f831539e02ddda1ec53917ecb/packages/core/src/llm/openai.ts#L265-L331) associates missing-index tool fragments with an explicit call ID or the most recent slot. [Fixtures](https://github.com/JackChen-me/open-multi-agent/blob/0b263fedca977d5f831539e02ddda1ec53917ecb/packages/core/tests/openai-adapter.test.ts#L354-L402) cover distinct complete calls and a continuation without either identifier. This is a provider-compatibility heuristic, not proof that arbitrary interleaved or mixed sparse-index streams can be reconstructed unambiguously. Teamagent should expose uncertain call identity instead of dispatching guessed arguments.

The [schema converter](https://github.com/JackChen-me/open-multi-agent/blob/0b263fedca977d5f831539e02ddda1ec53917ecb/packages/core/src/tool/framework.ts) excludes numeric-enum reverse mappings and uses an explicit null union for nullable enums. [Parity tests](https://github.com/JackChen-me/open-multi-agent/blob/0b263fedca977d5f831539e02ddda1ec53917ecb/packages/core/tests/zod-versions.test.ts) compare finite candidate values against both supported schema versions. Preserve semantic schema parity at the adapter boundary; model-facing conversion does not replace tool admission.

The [executor's error formatter](https://github.com/JackChen-me/open-multi-agent/blob/0b263fedca977d5f831539e02ddda1ec53917ecb/packages/core/src/tool/executor.ts#L449-L466) now survives circular values, failed serialization and failed coercion. Its [tests](https://github.com/JackChen-me/open-multi-agent/blob/0b263fedca977d5f831539e02ddda1ec53917ecb/packages/core/tests/tool-executor.test.ts#L225-L314) preserve sibling results and require no tool invocation after a failing gate. Serialization resilience is separate from bounded/redacted diagnostics. The text-call parser also ignores quotes outside JSON objects; recovered text remains untrusted proposed tool input. No tests, provider or tool was executed.

<!-- teamagent-analysis:start -->
Analysis metadata: source [open-multi-agent](https://github.com/JackChen-me/open-multi-agent); analyzed commit `0b263fedca977d5f831539e02ddda1ec53917ecb`; commit date 2026-10-30T01:42:30+08:00; review date 2026-11-01T11:33:30.893Z; depth screened. [Maintenance record](../analyses/repos/ai-agents--open-multi-agent.md).
<!-- teamagent-analysis:end -->
