# halo

Source: [halo](https://github.com/context-labs/halo) · Category: [ai-agents](../categories/ai-agents.md)

Review depth: **inventory / README screening only**. This is an individual coverage record, not a source-code correctness audit or adoption recommendation.

Snapshot: `b7f8509745d67b499b4e80efe20ea37c03426a74`; commit timestamp `2026-08-14T09:39:25Z`; 1,032 tracked paths.

## Scope and evidence

Upstream description excerpt (a project claim, automatically extracted from [README](https://github.com/context-labs/halo/blob/b7f8509745d67b499b4e80efe20ea37c03426a74/README.md)):

> Review ranked failures, bottlenecks, and concrete recommendations. The installer downloads the latest release for your platform and sets up the desktop app. macOS uses a signed, notarized DMG. You can also install directly from the GitHub releases page.

Build/package evidence: [app/package.json](https://github.com/context-labs/halo/blob/b7f8509745d67b499b4e80efe20ea37c03426a74/app/package.json); [demo/appworld/experiments/code/hal/requirements.txt](https://github.com/context-labs/halo/blob/b7f8509745d67b499b4e80efe20ea37c03426a74/demo/appworld/experiments/code/hal/requirements.txt); [demo/appworld/experiments/pyproject.toml](https://github.com/context-labs/halo/blob/b7f8509745d67b499b4e80efe20ea37c03426a74/demo/appworld/experiments/pyproject.toml); [demo/appworld/pyproject.toml](https://github.com/context-labs/halo/blob/b7f8509745d67b499b4e80efe20ea37c03426a74/demo/appworld/pyproject.toml); [demo/openai-agents-sdk-demo/pyproject.toml](https://github.com/context-labs/halo/blob/b7f8509745d67b499b4e80efe20ea37c03426a74/demo/openai-agents-sdk-demo/pyproject.toml)

License evidence: No root license file identified; reuse rights unverified. Classification hint: not classified; inspect source. A root license does not establish rights for every bundled asset, model, or dependency.

## Harness assessment

This entry was catalogued under **ai-agents**. Its category places it in the candidate set for agents, models, channels; those associations are navigational and have not been individually validated as implemented capabilities. See [agents](../agents.md) · [models](../models.md) · [channels](../channels.md) for the source-reviewed alternatives and proposed integration boundaries.

**Disposition:** retain as a comparison candidate. Before adopting it, inspect the implementation entry point and its tests, verify the required protocol and deployment platform, and reproduce a task from the harness evaluation suite. Popularity, a README feature list, and the presence of a package manifest are insufficient evidence of quality or compatibility.

**Unresolved:** runtime behavior, security boundaries, performance, API/subscription eligibility, dependency health, maintenance status, and fit to the proposed harness were not independently established for this entry. No repository code was executed as part of this screening.

<!-- teamagent-analysis:start -->
Analysis metadata: source [halo](https://github.com/context-labs/halo); analyzed commit `b7f8509745d67b499b4e80efe20ea37c03426a74`; commit date 2026-08-14T09:39:25Z; review date unknown; depth screened. [Maintenance record](../analyses/repos/ai-agents--halo.md).
<!-- teamagent-analysis:end -->
