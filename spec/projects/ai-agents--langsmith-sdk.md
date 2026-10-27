# langsmith-sdk

Source: [langsmith-sdk](https://github.com/langchain-ai/langsmith-sdk) · Category: [ai-agents](../categories/ai-agents.md)

Review depth: **inventory / README screening only**. This is an individual coverage record, not a source-code correctness audit or adoption recommendation.

Snapshot: `61793baa489b316c55a53705da7332a80c2e5db0`; commit timestamp `2026-10-02T14:49:29-07:00`; 1,026 tracked paths.

## Scope and evidence

Upstream description excerpt (a project claim, automatically extracted from [README](https://github.com/langchain-ai/langsmith-sdk/blob/61793baa489b316c55a53705da7332a80c2e5db0/README.md)):

> This repository contains the Python and Javascript SDK's for interacting with the LangSmith platform. Please see LangSmith Documentation for documentation about using the LangSmith platform and the client SDK.

Build/package evidence: [js/internal/environment_tests/test-deepagent-compat/package.json](https://github.com/langchain-ai/langsmith-sdk/blob/61793baa489b316c55a53705da7332a80c2e5db0/js/internal/environment_tests/test-deepagent-compat/package.json); [js/internal/environment_tests/test-exports-cf/package.json](https://github.com/langchain-ai/langsmith-sdk/blob/61793baa489b316c55a53705da7332a80c2e5db0/js/internal/environment_tests/test-exports-cf/package.json); [js/internal/environment_tests/test-exports-cjs/package.json](https://github.com/langchain-ai/langsmith-sdk/blob/61793baa489b316c55a53705da7332a80c2e5db0/js/internal/environment_tests/test-exports-cjs/package.json); [js/internal/environment_tests/test-exports-esbuild/package.json](https://github.com/langchain-ai/langsmith-sdk/blob/61793baa489b316c55a53705da7332a80c2e5db0/js/internal/environment_tests/test-exports-esbuild/package.json); [js/internal/environment_tests/test-exports-esm/package.json](https://github.com/langchain-ai/langsmith-sdk/blob/61793baa489b316c55a53705da7332a80c2e5db0/js/internal/environment_tests/test-exports-esm/package.json)

License evidence: [LICENSE](https://github.com/langchain-ai/langsmith-sdk/blob/61793baa489b316c55a53705da7332a80c2e5db0/LICENSE) Classification hint: MIT. A root license does not establish rights for every bundled asset, model, or dependency.

## Harness assessment

This entry was catalogued under **ai-agents**. Its category places it in the candidate set for agents, models, channels; those associations are navigational and have not been individually validated as implemented capabilities. See [agents](../agents.md) · [models](../models.md) · [channels](../channels.md) for the source-reviewed alternatives and proposed integration boundaries.

**Disposition:** retain as a comparison candidate. Before adopting it, inspect the implementation entry point and its tests, verify the required protocol and deployment platform, and reproduce a task from the harness evaluation suite. Popularity, a README feature list, and the presence of a package manifest are insufficient evidence of quality or compatibility.

**Unresolved:** runtime behavior, security boundaries, performance, API/subscription eligibility, dependency health, maintenance status, and fit to the proposed harness were not independently established for this entry. No repository code was executed as part of this screening.

<!-- teamagent-analysis:start -->
Analysis metadata: source [langsmith-sdk](https://github.com/langchain-ai/langsmith-sdk); analyzed commit `61793baa489b316c55a53705da7332a80c2e5db0`; commit date 2026-10-02T14:49:29-07:00; review date unknown; depth screened. [Maintenance record](../analyses/repos/ai-agents--langsmith-sdk.md).
<!-- teamagent-analysis:end -->
