# onyx

Source: [onyx](https://github.com/onyx-dot-app/onyx) · Category: [ai-agents](../categories/ai-agents.md)

Review depth: **inventory / README screening only**. This is an individual coverage record, not a source-code correctness audit or adoption recommendation.

Snapshot: `f1fbc7a135eb844e21e13f29eaa8acfd83a608e9`; commit timestamp `2026-10-03T04:38:47Z`; 8,342 tracked paths.

## Scope and evidence

Upstream description excerpt (a project claim, automatically extracted from [README](https://github.com/onyx-dot-app/onyx/blob/f1fbc7a135eb844e21e13f29eaa8acfd83a608e9/README.md)):

> "LLMs know about everything public, but what if it could also know what's going on in our team? I want an AI coworker, not an AI new hire." Onyx** is the knowledge/context layer for your team and AI agents.

Build/package evidence: [backend/onyx/server/features/build/sandbox/image/templates/outputs/web/package.json](https://github.com/onyx-dot-app/onyx/blob/f1fbc7a135eb844e21e13f29eaa8acfd83a608e9/backend/onyx/server/features/build/sandbox/image/templates/outputs/web/package.json); [cli/go.mod](https://github.com/onyx-dot-app/onyx/blob/f1fbc7a135eb844e21e13f29eaa8acfd83a608e9/cli/go.mod); [cli/pyproject.toml](https://github.com/onyx-dot-app/onyx/blob/f1fbc7a135eb844e21e13f29eaa8acfd83a608e9/cli/pyproject.toml); [desktop/package.json](https://github.com/onyx-dot-app/onyx/blob/f1fbc7a135eb844e21e13f29eaa8acfd83a608e9/desktop/package.json); [desktop/src-tauri/Cargo.toml](https://github.com/onyx-dot-app/onyx/blob/f1fbc7a135eb844e21e13f29eaa8acfd83a608e9/desktop/src-tauri/Cargo.toml)

License evidence: [LICENSE](https://github.com/onyx-dot-app/onyx/blob/f1fbc7a135eb844e21e13f29eaa8acfd83a608e9/LICENSE) Classification hint: not classified; inspect source. A root license does not establish rights for every bundled asset, model, or dependency.

## Harness assessment

This entry was catalogued under **ai-agents**. Its category places it in the candidate set for agents, models, channels; those associations are navigational and have not been individually validated as implemented capabilities. See [agents](../agents.md) · [models](../models.md) · [channels](../channels.md) for the source-reviewed alternatives and proposed integration boundaries.

**Disposition:** retain as a comparison candidate. Before adopting it, inspect the implementation entry point and its tests, verify the required protocol and deployment platform, and reproduce a task from the harness evaluation suite. Popularity, a README feature list, and the presence of a package manifest are insufficient evidence of quality or compatibility.

**Unresolved:** runtime behavior, security boundaries, performance, API/subscription eligibility, dependency health, maintenance status, and fit to the proposed harness were not independently established for this entry. No repository code was executed as part of this screening.

## 2026-10-28 scoped source review

Source: [onyx](https://github.com/onyx-dot-app/onyx); inspected saved discovery revision `24aafd43aa31e56ebf9859cf50e2a8e3d61adebc`. Prior analyzed revision `f1fbc7a135eb844e21e13f29eaa8acfd83a608e9` remains historical evidence.

**Scope:** Full ODS environment/log commands and environment tests read. Runtime-target locking, Docker executor, dotenv upsert implementation and Onyx agent/retrieval runtime were not audited.

The [environment command](https://github.com/onyx-dot-app/onyx/blob/24aafd43aa31e56ebf9859cf50e2a8e3d61adebc/tools/ods/cmd/env.go) resolves and locks a runtime target, discovers published ports and refuses to edit configuration when the selected PostgreSQL port is unavailable. Its [tests](https://github.com/onyx-dot-app/onyx/blob/24aafd43aa31e56ebf9859cf50e2a8e3d61adebc/tools/ods/cmd/env_test.go) use a fake Docker executable to check preservation of unrelated entries, repeated upserts, dry-run output and unchanged configuration on a missing database. These are useful fixture contracts; they do not prove that a live container or target lock behaves the same way.

Configuration publication is two steps: upsert first, then read/rewrite to remove exact legacy KEY= lines. The latter rewrite is not atomic in this helper, and a failure can leave the earlier update applied. It does not parse every valid dotenv spelling. Missing services are skipped with warnings, but any port-query error is described as a container not running, conflating absent infrastructure with inspection failures. The [log command](https://github.com/onyx-dot-app/onyx/blob/24aafd43aa31e56ebf9859cf50e2a8e3d61adebc/tools/ods/cmd/logs.go) follows logs by default without a local output bound or redaction and passes service arguments directly to Compose. Adapt explicit partial-state reporting, atomic owned configuration updates and a bounded diagnostic adapter; no Docker, configuration write, log streaming or tests were executed.

<!-- teamagent-analysis:start -->
Analysis metadata: source [onyx](https://github.com/onyx-dot-app/onyx); analyzed commit `24aafd43aa31e56ebf9859cf50e2a8e3d61adebc`; commit date 2026-10-27T17:12:11Z; review date 2026-10-28T09:27:32.685Z; depth screened. [Maintenance record](../analyses/repos/ai-agents--onyx.md).
<!-- teamagent-analysis:end -->
