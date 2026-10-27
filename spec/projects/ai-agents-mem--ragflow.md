# ragflow

Source: [ragflow](https://github.com/infiniflow/ragflow) · Category: [ai-agents-mem](../categories/ai-agents-mem.md)

Review depth: **inventory / README screening only**. This is an individual coverage record, not a source-code correctness audit or adoption recommendation.

Snapshot: `2400ca8eb51432b1d304266d0de9ca232d9b53fa`; commit timestamp `2026-10-03T23:52:13+08:00`; 5,100 tracked paths.

## Scope and evidence

Upstream description excerpt (a project claim, automatically extracted from [README](https://github.com/infiniflow/ragflow/blob/2400ca8eb51432b1d304266d0de9ca232d9b53fa/README.md)):

> RAGFlow is a leading open-source Retrieval-Augmented Generation (RAG) engine that fuses cutting-edge RAG with Agent capabilities to create a superior context layer for LLMs. It offers a streamlined RAG workflow adaptable to enterprises of any scale. Powered by a converged context engine and pre-built agent templates, RAGFlow enables developers to transform complex data into high-fidelity, production-ready AI systems with exceptional efficiency and precision. - 2026-08-19 Introduced Knowledge Compilation to generate Wikis, Graphs, Trees, PageInd

Build/package evidence: [go.mod](https://github.com/infiniflow/ragflow/blob/2400ca8eb51432b1d304266d0de9ca232d9b53fa/go.mod); [internal/channels/whatsapp-gateway/package.json](https://github.com/infiniflow/ragflow/blob/2400ca8eb51432b1d304266d0de9ca232d9b53fa/internal/channels/whatsapp-gateway/package.json); [pyproject.toml](https://github.com/infiniflow/ragflow/blob/2400ca8eb51432b1d304266d0de9ca232d9b53fa/pyproject.toml); [sdk/python/pyproject.toml](https://github.com/infiniflow/ragflow/blob/2400ca8eb51432b1d304266d0de9ca232d9b53fa/sdk/python/pyproject.toml); [tools/chatgpt-on-wechat/plugins/requirements.txt](https://github.com/infiniflow/ragflow/blob/2400ca8eb51432b1d304266d0de9ca232d9b53fa/tools/chatgpt-on-wechat/plugins/requirements.txt)

License evidence: [LICENSE](https://github.com/infiniflow/ragflow/blob/2400ca8eb51432b1d304266d0de9ca232d9b53fa/LICENSE) Classification hint: Apache-2.0. A root license does not establish rights for every bundled asset, model, or dependency.

## Harness assessment

This entry was catalogued under **ai-agents-mem**. Its category places it in the candidate set for memory, evolution; those associations are navigational and have not been individually validated as implemented capabilities. See [memory](../memory.md) · [evolution](../evolution.md) for the source-reviewed alternatives and proposed integration boundaries.

**Disposition:** retain as a comparison candidate. Before adopting it, inspect the implementation entry point and its tests, verify the required protocol and deployment platform, and reproduce a task from the harness evaluation suite. Popularity, a README feature list, and the presence of a package manifest are insufficient evidence of quality or compatibility.

**Unresolved:** runtime behavior, security boundaries, performance, API/subscription eligibility, dependency health, maintenance status, and fit to the proposed harness were not independently established for this entry. No repository code was executed as part of this screening.

<!-- teamagent-analysis:start -->
Analysis metadata: source [ragflow](https://github.com/infiniflow/ragflow); analyzed commit `2400ca8eb51432b1d304266d0de9ca232d9b53fa`; commit date 2026-10-03T23:52:13+08:00; review date unknown; depth screened. [Maintenance record](../analyses/repos/ai-agents-mem--ragflow.md).
<!-- teamagent-analysis:end -->
