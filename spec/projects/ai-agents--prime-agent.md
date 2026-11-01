# prime-agent

Source: [prime-agent](https://github.com/PrimeIntellect-ai/prime-agent) · Category: [ai-agents](../categories/ai-agents.md)

Review depth: **inventory / README screening only**. This is an individual coverage record, not a source-code correctness audit or adoption recommendation.

Snapshot: `cfe398105ed8753d0fbcfbeb186934285730a5a3`; commit timestamp `2026-10-03T12:30:09-07:00`; 1,440 tracked paths.

## Scope and evidence

Upstream description excerpt (a project claim, automatically extracted from [README](https://github.com/PrimeIntellect-ai/prime-agent/blob/cfe398105ed8753d0fbcfbeb186934285730a5a3/README.md)):

> Prime Agent is an open-source coding and research agent for general and long-running work. It is designed around two core abstractions: - The **Recursive Language Model (RLM)** treats context as variables (*prompt-as-a-variable*) and tools like recursive subagents as function calls (*programmatic tool /sub-agent calling*) inside a persistent REPL.

Build/package evidence: [Cargo.toml](https://github.com/PrimeIntellect-ai/prime-agent/blob/cfe398105ed8753d0fbcfbeb186934285730a5a3/Cargo.toml); [crates/pa-agent/Cargo.toml](https://github.com/PrimeIntellect-ai/prime-agent/blob/cfe398105ed8753d0fbcfbeb186934285730a5a3/crates/pa-agent/Cargo.toml); [crates/pa-ai/Cargo.toml](https://github.com/PrimeIntellect-ai/prime-agent/blob/cfe398105ed8753d0fbcfbeb186934285730a5a3/crates/pa-ai/Cargo.toml); [crates/pa-cli/Cargo.toml](https://github.com/PrimeIntellect-ai/prime-agent/blob/cfe398105ed8753d0fbcfbeb186934285730a5a3/crates/pa-cli/Cargo.toml); [crates/pa-core/Cargo.toml](https://github.com/PrimeIntellect-ai/prime-agent/blob/cfe398105ed8753d0fbcfbeb186934285730a5a3/crates/pa-core/Cargo.toml)

License evidence: [LICENSE](https://github.com/PrimeIntellect-ai/prime-agent/blob/cfe398105ed8753d0fbcfbeb186934285730a5a3/LICENSE) Classification hint: MIT. A root license does not establish rights for every bundled asset, model, or dependency.

## Harness assessment

This entry was catalogued under **ai-agents**. Its category places it in the candidate set for agents, models, channels; those associations are navigational and have not been individually validated as implemented capabilities. See [agents](../agents.md) · [models](../models.md) · [channels](../channels.md) for the source-reviewed alternatives and proposed integration boundaries.

**Disposition:** retain as a comparison candidate. Before adopting it, inspect the implementation entry point and its tests, verify the required protocol and deployment platform, and reproduce a task from the harness evaluation suite. Popularity, a README feature list, and the presence of a package manifest are insufficient evidence of quality or compatibility.

**Unresolved:** runtime behavior, security boundaries, performance, API/subscription eligibility, dependency health, maintenance status, and fit to the proposed harness were not independently established for this entry. No repository code was executed as part of this screening.

## 2026-10-28 scoped source review

Source: [prime-agent](https://github.com/PrimeIntellect-ai/prime-agent); inspected saved discovery revision `c13415b44239c1333b2c8503070310182e0d4b2d`. Prior analyzed revision `cfe398105ed8753d0fbcfbeb186934285730a5a3` remains historical evidence.

**Scope:** Full abort helper including its embedded tests and crate entry module read. Agent-loop call coverage, provider adapters, tools and resource cleanup were not audited.

The [abort helper](https://github.com/PrimeIntellect-ai/prime-agent/blob/c13415b44239c1333b2c8503070310182e0d4b2d/crates/pa-agent/src/abort.rs) uses a cloneable watch signal and a typed AbortedError marker instead of interpreting arbitrary provider error text as cancellation. It checks pre-aborted state and races the supplied future against the signal. Embedded tests cover observer wakeup, a pending operation interrupted by cancellation and a completed operation. The [crate entry](https://github.com/PrimeIntellect-ai/prime-agent/blob/c13415b44239c1333b2c8503070310182e0d4b2d/crates/pa-agent/src/lib.rs) keeps the agent message representation separate from model-bound messages at the call boundary.

Dropping a future is only the local ownership mechanism: it does not prove a spawned task, subprocess or remote effect stopped. The select is not biased toward cancellation when both branches are ready, and the inspected tests do not assert external cleanup or ambiguous-effect reconciliation. Adapt typed cancellation with scoped resources and adapter-specific acceptance tests; do not infer every await point is covered from the module comment. No Rust build, provider call or tests were executed.

## 2026-10-28 follow-up source review

Reviewed the frozen update from `c13415b44239c1333b2c8503070310182e0d4b2d` to `ea9d9602ec0938d9e454e8963107cd85af1565c6`. Earlier findings above remain historical evidence; this review is limited to the cited source and delta.

In [crates/pa-core/src/session_engine/refine.rs](https://github.com/PrimeIntellect-ai/prime-agent/blob/ea9d9602ec0938d9e454e8963107cd85af1565c6/crates/pa-core/src/session_engine/refine.rs#L490-L514), Refinement calls now resolve the auxiliary model's credential and merged request headers through the session's routing context before constructing the refiner closure. The call retains the session ID; the delta passes those headers into the one-off streaming options instead of sending only an API key.

**Harness implication and limits:** Treat summarization/refinement as real model traffic with the same account, tenant, privacy and budget routing as the main task. Auxiliary calls must not silently drop organization/team scope. The resolver, endpoint restrictions, redaction, billing and promotion policy were not inspected; header propagation alone does not establish safe evolution or credential confinement. This static review does not certify other changed subsystems.

## 2026-11-01 scoped source review

Reviewed frozen commit `c6d4da9421e6087e3fc1a763e947cf37153cd76f` against prior analyzed commit `ea9d9602ec0938d9e454e8963107cd85af1565c6`. Historical reviews above remain separate evidence.

The [worker queue](https://github.com/PrimeIntellect-ai/prime-agent/blob/c6d4da9421e6087e3fc1a763e947cf37153cd76f/crates/pa-daemon/src/worker/queue.rs) and [journal](https://github.com/PrimeIntellect-ai/prime-agent/blob/c6d4da9421e6087e3fc1a763e947cf37153cd76f/crates/pa-daemon/src/journal.rs) now persist suspended input, forced-batch flags and queued images, so a restored queue can remain parked instead of implicitly resuming. A real nonempty pickup resets prior delivery cancellation/completion facts; an empty lookup does not. Legacy records default the added fields.

The inspected journal and [queue fixtures](https://github.com/PrimeIntellect-ai/prime-agent/blob/c6d4da9421e6087e3fc1a763e947cf37153cd76f/crates/pa-daemon/src/worker/tests/queue_tests.rs) update reopen/compaction/checkpoint contracts and retain append-failure state checks. Their changed examples mostly pass false/empty new fields, so they do not themselves demonstrate a true suspended queue with images across a crash. The visible parser also defaults a missing or nonboolean suspension field to false. Teamagent should persist scheduling decisions and multimodal references with explicit versioned validation, distinguish legacy absence from malformed current records and keep restored suspension separate from authorization to resume.

**Coverage:** Read the complete 186-line queue/fixture delta and complete 364-line journal delta with embedded fixtures. Recovery-verdict and spawn-reservation test changes were inspected as compatibility leads only. Full runtime restore/dispatch and new-field crash behavior were not exercised. Source inspection only; no upstream tests, source programs or live providers were executed. This is a scoped architecture review, not a whole-repository correctness or security certification.

<!-- teamagent-analysis:start -->
Analysis metadata: source [prime-agent](https://github.com/PrimeIntellect-ai/prime-agent); analyzed commit `c6d4da9421e6087e3fc1a763e947cf37153cd76f`; commit date 2026-10-30T16:41:56+01:00; review date 2026-11-01T11:33:30.893Z; depth screened. [Maintenance record](../analyses/repos/ai-agents--prime-agent.md).
<!-- teamagent-analysis:end -->
