# deer-flow

Source: [deer-flow](https://github.com/bytedance/deer-flow) · Category: [ai-agents](../categories/ai-agents.md)

Review depth: **inventory / README screening only**. This is an individual coverage record, not a source-code correctness audit or adoption recommendation.

Snapshot: `9eb01b371a478d9be477476eb19bc8381433b2ba`; commit timestamp `2026-10-03T23:11:48+08:00`; 3,468 tracked paths.

## Scope and evidence

Upstream description excerpt (a project claim, automatically extracted from [README](https://github.com/bytedance/deer-flow/blob/9eb01b371a478d9be477476eb19bc8381433b2ba/README.md)):

> On February 28th, 2026, DeerFlow claimed the 🏆 #1 spot on GitHub Trending following the launch of version 2. Thanks a million to our incredible community — you made this happen! 💪🔥 DeerFlow (**D**eep **E**xploration and **E**fficient **R**esearch **Flow**) is an open-source **super agent harness** that orchestrates **sub-agents**, **memory**, and **sandboxes** to do almost anything — powered by **extensible skills**.

Build/package evidence: [backend/packages/extension-api/pyproject.toml](https://github.com/bytedance/deer-flow/blob/9eb01b371a478d9be477476eb19bc8381433b2ba/backend/packages/extension-api/pyproject.toml); [backend/packages/harness/pyproject.toml](https://github.com/bytedance/deer-flow/blob/9eb01b371a478d9be477476eb19bc8381433b2ba/backend/packages/harness/pyproject.toml); [backend/pyproject.toml](https://github.com/bytedance/deer-flow/blob/9eb01b371a478d9be477476eb19bc8381433b2ba/backend/pyproject.toml); [backend/tests/monocle/requirements.txt](https://github.com/bytedance/deer-flow/blob/9eb01b371a478d9be477476eb19bc8381433b2ba/backend/tests/monocle/requirements.txt); [examples/deerflow-extension-bookmarks/pyproject.toml](https://github.com/bytedance/deer-flow/blob/9eb01b371a478d9be477476eb19bc8381433b2ba/examples/deerflow-extension-bookmarks/pyproject.toml)

License evidence: [LICENSE](https://github.com/bytedance/deer-flow/blob/9eb01b371a478d9be477476eb19bc8381433b2ba/LICENSE) Classification hint: MIT. A root license does not establish rights for every bundled asset, model, or dependency.

## Harness assessment

This entry was catalogued under **ai-agents**. Its category places it in the candidate set for agents, models, channels; those associations are navigational and have not been individually validated as implemented capabilities. See [agents](../agents.md) · [models](../models.md) · [channels](../channels.md) for the source-reviewed alternatives and proposed integration boundaries.

**Disposition:** retain as a comparison candidate. Before adopting it, inspect the implementation entry point and its tests, verify the required protocol and deployment platform, and reproduce a task from the harness evaluation suite. Popularity, a README feature list, and the presence of a package manifest are insufficient evidence of quality or compatibility.

**Unresolved:** runtime behavior, security boundaries, performance, API/subscription eligibility, dependency health, maintenance status, and fit to the proposed harness were not independently established for this entry. No repository code was executed as part of this screening.
