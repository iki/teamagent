# aci

Source: [aci](https://github.com/aipotheosis-labs/aci) · Category: [ai-query](../categories/ai-query.md)

Review depth: **inventory / README screening only**. This is an individual coverage record, not a source-code correctness audit or adoption recommendation.

Snapshot: `3e4a82fa5fd22f1165af2b39fa3de2b0f031242e`; commit timestamp `2026-05-28T12:32:33+01:00`; 651 tracked paths.

## Scope and evidence

Upstream description excerpt (a project claim, automatically extracted from [README](https://github.com/aipotheosis-labs/aci/blob/3e4a82fa5fd22f1165af2b39fa3de2b0f031242e/README.md)):

> This repo is for the ACI.dev platform. If you're looking for the **Unified MCP** server built with ACI.dev, see aci-mcp. ACI.dev is the open-source tool-calling platform that hooks up 600+ tools into any agentic IDE or custom AI agent. It gives agents intent-aware access to tools with multi-tenant auth, granular permissions, and dynamic tool discovery—exposed as either direct function calls or through a **Unified Model-Context-Protocol (MCP) server**.

Build/package evidence: [backend/pyproject.toml](https://github.com/aipotheosis-labs/aci/blob/3e4a82fa5fd22f1165af2b39fa3de2b0f031242e/backend/pyproject.toml); [frontend/package.json](https://github.com/aipotheosis-labs/aci/blob/3e4a82fa5fd22f1165af2b39fa3de2b0f031242e/frontend/package.json)

License evidence: [LICENSE](https://github.com/aipotheosis-labs/aci/blob/3e4a82fa5fd22f1165af2b39fa3de2b0f031242e/LICENSE) Classification hint: Apache-2.0. A root license does not establish rights for every bundled asset, model, or dependency.

## Harness assessment

This entry was catalogued under **ai-query**. Its category places it in the candidate set for memory, import-generation, decisions; those associations are navigational and have not been individually validated as implemented capabilities. See [memory](../memory.md) · [import-generation](../import-generation.md) · [decisions](../decisions.md) for the source-reviewed alternatives and proposed integration boundaries.

**Disposition:** retain as a comparison candidate. Before adopting it, inspect the implementation entry point and its tests, verify the required protocol and deployment platform, and reproduce a task from the harness evaluation suite. Popularity, a README feature list, and the presence of a package manifest are insufficient evidence of quality or compatibility.

**Unresolved:** runtime behavior, security boundaries, performance, API/subscription eligibility, dependency health, maintenance status, and fit to the proposed harness were not independently established for this entry. No repository code was executed as part of this screening.

<!-- teamagent-analysis:start -->
Analysis metadata: source [aci](https://github.com/aipotheosis-labs/aci); analyzed commit `3e4a82fa5fd22f1165af2b39fa3de2b0f031242e`; commit date 2026-05-28T12:32:33+01:00; review date unknown; depth screened. [Maintenance record](../analyses/repos/ai-query--aci.md).
<!-- teamagent-analysis:end -->
