# omnigent

Source: [omnigent](https://github.com/omnigent-ai/omnigent) · Category: [ai-agents](../categories/ai-agents.md)

Review depth: **inventory / README screening only**. This is an individual coverage record, not a source-code correctness audit or adoption recommendation.

Snapshot: `f37a484a9238d21dac71b62dd79b87e016947c19`; commit timestamp `2026-10-03T12:04:00-07:00`; 5,867 tracked paths.

## Scope and evidence

Upstream description excerpt (a project claim, automatically extracted from [README](https://github.com/omnigent-ai/omnigent/blob/f37a484a9238d21dac71b62dd79b87e016947c19/README.md)):

> Omnigent is an open-source **meta-harness** that gives you a common orchestration layer over Claude Code, Codex, Cursor, OpenCode, Hermes, Pi, and the agents you write yourself: swap or combine harnesses without rewriting, enforce policies and sandboxing, and collaborate in real time from any device — terminal, browser, phone, or the native desktop app. - **📱 Work with agents from any device, including your phone.** Sessions

Build/package evidence: [.github/actions/e2e-run/claude-billing-notice/package.json](https://github.com/omnigent-ai/omnigent/blob/f37a484a9238d21dac71b62dd79b87e016947c19/.github/actions/e2e-run/claude-billing-notice/package.json); [.github/actions/setup-harness-cli/locks/claude/package.json](https://github.com/omnigent-ai/omnigent/blob/f37a484a9238d21dac71b62dd79b87e016947c19/.github/actions/setup-harness-cli/locks/claude/package.json); [.github/actions/setup-harness-cli/locks/codex/package.json](https://github.com/omnigent-ai/omnigent/blob/f37a484a9238d21dac71b62dd79b87e016947c19/.github/actions/setup-harness-cli/locks/codex/package.json); [.github/actions/setup-harness-cli/locks/pi/package.json](https://github.com/omnigent-ai/omnigent/blob/f37a484a9238d21dac71b62dd79b87e016947c19/.github/actions/setup-harness-cli/locks/pi/package.json); [.github/ci-deps/package.json](https://github.com/omnigent-ai/omnigent/blob/f37a484a9238d21dac71b62dd79b87e016947c19/.github/ci-deps/package.json)

License evidence: [LICENSE](https://github.com/omnigent-ai/omnigent/blob/f37a484a9238d21dac71b62dd79b87e016947c19/LICENSE) Classification hint: Apache-2.0. A root license does not establish rights for every bundled asset, model, or dependency.

## Harness assessment

This entry was catalogued under **ai-agents**. Its category places it in the candidate set for agents, models, channels; those associations are navigational and have not been individually validated as implemented capabilities. See [agents](../agents.md) · [models](../models.md) · [channels](../channels.md) for the source-reviewed alternatives and proposed integration boundaries.

**Disposition:** retain as a comparison candidate. Before adopting it, inspect the implementation entry point and its tests, verify the required protocol and deployment platform, and reproduce a task from the harness evaluation suite. Popularity, a README feature list, and the presence of a package manifest are insufficient evidence of quality or compatibility.

**Unresolved:** runtime behavior, security boundaries, performance, API/subscription eligibility, dependency health, maintenance status, and fit to the proposed harness were not independently established for this entry. No repository code was executed as part of this screening.

<!-- teamagent-analysis:start -->
Analysis metadata: source [omnigent](https://github.com/omnigent-ai/omnigent); analyzed commit `f37a484a9238d21dac71b62dd79b87e016947c19`; commit date 2026-10-03T12:04:00-07:00; review date unknown; depth screened. [Maintenance record](../analyses/repos/ai-agents--omnigent.md).
<!-- teamagent-analysis:end -->
