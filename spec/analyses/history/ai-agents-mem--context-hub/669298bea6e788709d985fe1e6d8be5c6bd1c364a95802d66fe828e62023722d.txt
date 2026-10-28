# context-hub

Source: [context-hub](https://github.com/andrewyng/context-hub) · Category: [ai-agents-mem](../categories/ai-agents-mem.md)

Review depth: **inventory / README screening only**. This is an individual coverage record, not a source-code correctness audit or adoption recommendation.

Snapshot: `67dcbeb2eb42c808549f08397920ad58be7c2206`; commit timestamp `2026-05-31T14:39:40-04:00`; 1,857 tracked paths.

## Scope and evidence

Upstream description excerpt (a project claim, automatically extracted from [README](https://github.com/andrewyng/context-hub/blob/67dcbeb2eb42c808549f08397920ad58be7c2206/README.md)):

> Coding agents hallucinate APIs and forget what they learn in a session. Context Hub gives them curated, versioned docs, plus the ability to get smarter with every task. All content is open and maintained as markdown in this repo — you can inspect exactly what your agent reads, and contribute back. Chub is designed for your coding agent to use (not for you to use!). You can prompt your agent to use it (e.g., "Use the CLI command chub to get the latest API documentation for calling OpenAI. Run 'chub help' to understand how it works.") Or by creat

Build/package evidence: [cli/package.json](https://github.com/andrewyng/context-hub/blob/67dcbeb2eb42c808549f08397920ad58be7c2206/cli/package.json); [package.json](https://github.com/andrewyng/context-hub/blob/67dcbeb2eb42c808549f08397920ad58be7c2206/package.json)

License evidence: [LICENSE](https://github.com/andrewyng/context-hub/blob/67dcbeb2eb42c808549f08397920ad58be7c2206/LICENSE) Classification hint: MIT. A root license does not establish rights for every bundled asset, model, or dependency.

## Harness assessment

This entry was catalogued under **ai-agents-mem**. Its category places it in the candidate set for memory, evolution; those associations are navigational and have not been individually validated as implemented capabilities. See [memory](../memory.md) · [evolution](../evolution.md) for the source-reviewed alternatives and proposed integration boundaries.

**Disposition:** retain as a comparison candidate. Before adopting it, inspect the implementation entry point and its tests, verify the required protocol and deployment platform, and reproduce a task from the harness evaluation suite. Popularity, a README feature list, and the presence of a package manifest are insufficient evidence of quality or compatibility.

**Unresolved:** runtime behavior, security boundaries, performance, API/subscription eligibility, dependency health, maintenance status, and fit to the proposed harness were not independently established for this entry. No repository code was executed as part of this screening.
