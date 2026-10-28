# odysseus

Source: [odysseus](https://github.com/pewdiepie-archdaemon/odysseus) · Category: [ai-agents](../categories/ai-agents.md)

Review depth: **inventory / README screening only**. This is an individual coverage record, not a source-code correctness audit or adoption recommendation.

Snapshot: `2992bf6d368a11472323e47d3bfed91e79cefc6b`; commit timestamp `2026-10-01T20:18:33-06:00`; 1,573 tracked paths.

## Scope and evidence

Upstream description excerpt (a project claim, automatically extracted from [README](https://github.com/pewdiepie-archdaemon/odysseus/blob/2992bf6d368a11472323e47d3bfed91e79cefc6b/README.md)):

> A self-hosted AI workspace for chat, agents, research, documents, email, notes, calendar, and local model workflows. `dev` is the default branch and gets the newest changes first. Use `main` if you want the more curated branch.

Build/package evidence: [package.json](https://github.com/pewdiepie-archdaemon/odysseus/blob/2992bf6d368a11472323e47d3bfed91e79cefc6b/package.json); [pyproject.toml](https://github.com/pewdiepie-archdaemon/odysseus/blob/2992bf6d368a11472323e47d3bfed91e79cefc6b/pyproject.toml); [requirements.txt](https://github.com/pewdiepie-archdaemon/odysseus/blob/2992bf6d368a11472323e47d3bfed91e79cefc6b/requirements.txt); [static/js/package.json](https://github.com/pewdiepie-archdaemon/odysseus/blob/2992bf6d368a11472323e47d3bfed91e79cefc6b/static/js/package.json)

License evidence: [LICENSE](https://github.com/pewdiepie-archdaemon/odysseus/blob/2992bf6d368a11472323e47d3bfed91e79cefc6b/LICENSE) Classification hint: AGPL; inspect version. A root license does not establish rights for every bundled asset, model, or dependency.

## Harness assessment

This entry was catalogued under **ai-agents**. Its category places it in the candidate set for agents, models, channels; those associations are navigational and have not been individually validated as implemented capabilities. See [agents](../agents.md) · [models](../models.md) · [channels](../channels.md) for the source-reviewed alternatives and proposed integration boundaries.

**Disposition:** retain as a comparison candidate. Before adopting it, inspect the implementation entry point and its tests, verify the required protocol and deployment platform, and reproduce a task from the harness evaluation suite. Popularity, a README feature list, and the presence of a package manifest are insufficient evidence of quality or compatibility.

**Unresolved:** runtime behavior, security boundaries, performance, API/subscription eligibility, dependency health, maintenance status, and fit to the proposed harness were not independently established for this entry. No repository code was executed as part of this screening.

## 2026-10-28 scoped source review

Source: [odysseus](https://github.com/pewdiepie-archdaemon/odysseus); inspected saved discovery revision `339c6886cbbb2f5cf897b2b6795da448c02c8f20`. Prior analyzed revision `2992bf6d368a11472323e47d3bfed91e79cefc6b` remains historical evidence.

**Scope:** Detached-run lifecycle and tool-name registry; two complete source files read. The 1.78 MB agent loop exceeded capture bounds and was not read; no claim covers its authorization or provider/tool cleanup.

The [detached run manager](https://github.com/pewdiepie-archdaemon/odysseus/blob/339c6886cbbb2f5cf897b2b6795da448c02c8f20/src/agent_runs.py#L117-L209) delays `[DONE]` until the wrapped generator unwinds, binds subscriptions to the exact run object, and makes stop/finish require the opaque run ID. Those mechanisms address response-body replacement and stale-tab cancellation races. Replacement waits for the predecessor task, including a shielded predecessor after cancellation, to serialize session saves; actual persistence belongs to the unread generator. Cancellation is therefore a request plus a local ordering barrier, not proof that an external effect stopped.

The [replay path](https://github.com/pewdiepie-archdaemon/odysseus/blob/339c6886cbbb2f5cf897b2b6795da448c02c8f20/src/agent_runs.py#L212-L305) registers before replay and skips already-replayed sequence numbers. Its 180-second identity-checked eviction applies to terminal runs without subscribers. Running buffers, subscriber queues and run cardinality have no local size bound, and waiting for a predecessor has no timeout; a connected or stuck run can retain its full event stream. The module explicitly promises only process-lifetime survival. Teamagent should retain exact run binding and terminal-after-cleanup ordering while using durable event storage, bounded subscribers and explicit uncertain-effect outcomes.

The [tool tag registry](https://github.com/pewdiepie-archdaemon/odysseus/blob/339c6886cbbb2f5cf897b2b6795da448c02c8f20/src/tool_types.py#L1-L33) keeps parser names separate from the tool facade. A registered name establishes syntax availability, not authorization or execution containment. No source was executed and no run-restart, provider cancellation or end-to-end persistence test was performed.

<!-- teamagent-analysis:start -->
Analysis metadata: source [odysseus](https://github.com/pewdiepie-archdaemon/odysseus); analyzed commit `339c6886cbbb2f5cf897b2b6795da448c02c8f20`; commit date 2026-10-27T16:35:16Z; review date 2026-10-28T09:27:32.685Z; depth screened. [Maintenance record](../analyses/repos/ai-agents--odysseus.md).
<!-- teamagent-analysis:end -->
