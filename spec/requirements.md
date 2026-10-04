# Requirements and acceptance map

[Home](README.md) · [Contracts](contracts.md) · [Evaluation](evaluation.md)

| ID | User direction | Proposed requirement | Design / acceptance evidence |
|---|---|---|---|
| MOD-01 | Any local/API model | Capability-negotiated adapters for text/tools/vision/structured output; explicit unsupported features | [Models](models.md), provider conformance tests |
| MOD-02 | Subscription where possible | Supported account-specific integration, credential ownership and quota accounting; no assumption that every subscription is a generic API | [Models](models.md), authenticated request check |
| AGT-01 | Installed agents | Passive discovery, explicit adapters/protocol negotiation, bounded probe and safe unsupported state | [Agents](agents.md), adapter suite |
| AGT-02 | Team harness | Durable tasks/DAGs, isolated writers, leases, budgets, cancellation and independent verification | [Agents](agents.md), crash/conflict scenarios |
| MEM-01 | Evolving memory | Evidence-grounded episodic/semantic/procedural memory, temporal validity, contradictions and scoped retention | [Memory](memory.md), update/delete/privacy tests |
| MEM-02 | Queries and coding | Hybrid document search plus code symbols/dependencies/diffs with exact citations | [Memory](memory.md), Q&A and code-retrieval suite |
| IMP-01 | Any resource | Common registration for URLs/repos/docs/images/folders with supported MIME adapters and explicit unsupported/error state | [Import/generation](import-generation.md), parser corpus |
| IMP-02 | Manage import tools | Registry, capability probes, versions, limits, dependencies, quarantine, retries and provenance | [Import pipeline](import-pipeline.md), adversarial input suite |
| CHN-01 | Local/cloud | Local host, remote worker and cloud-only profiles without implicit credential/data migration | [Channels](channels.md), host-loss test |
| CHN-02 | Web/desktop/mobile | Shared task/event API, streaming/reconnect, responsive rendering and artifact preview | [Channels](channels.md), device/performance tests |
| CHN-03 | Telegram/Slack/Discord | Identity binding, inbox dedupe, outbox, stale-action protection and rate-aware rendering | [Channels](channels.md), delivery/isolation tests |
| SKL-01 | Manage/tune skills | Source provenance, locked dependencies, explicit model/harness variants and permission equivalence | [Skills](skills.md), compatibility suite |
| SKL-02 | Large library, small task set | Two-stage retrieval, trigger/near-miss tests, context-budgeted loading and deactivation for future context; fresh session when prior content must be excluded | [Skills](skills.md), [lifecycle semantics](contracts.md), selection ablations |
| DEC-01 | Jev-like decisions | Bounded typed choices, structural validation, calibrated abstention, rules fallback and outcome records | [Decisions](decisions.md), shadow/held-out comparison |
| GEN-01 | Generate media | Modality-aware jobs, hardware/API routing, reference inputs, cancellation and verified artifacts | [Generation](generation.md), media job suite |
| GEN-02 | Manage generation tools | Versioned workflow/model/node provenance, resource reservation, credentials and artifact previews | [Import/generation](import-generation.md), reproducibility/recovery checks |
| EVO-01 | Evolve system | Separate candidate proposer/evaluator/promoter; frozen tests, canary and rollback | [Evolution](evolution.md), deliberate-regression test |
| SEC-01 | Cross-cutting trust | Scope/ACL enforcement, sandboxed untrusted code, credential separation and untrusted-data boundaries | [Security](security.md), failure injection |
| OBS-01 | Traceability | Task→attempt→model/tool→evidence/artifact chain, budgets and measured/estimated cost labels | [Contracts](contracts.md), trace completeness checks |

“Any” means extensible coverage through declared adapters and a visible unsupported state. It does not promise that arbitrary formats, binaries, model features or account plans can be safely inferred or converted without integration work.
