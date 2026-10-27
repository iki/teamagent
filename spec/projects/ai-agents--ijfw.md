# ijfw

Source: [ijfw](https://github.com/FerroxLabs/ijfw) · Category: [ai-agents](../categories/ai-agents.md)

Review depth: **inventory / README screening only**. This is an individual coverage record, not a source-code correctness audit or adoption recommendation.

Snapshot: `eda62f39f08b3028d824de1d806fe05c1402fd94`; commit timestamp `2026-07-11T10:56:21+07:00`; 2,529 tracked paths.

## Scope and evidence

Upstream description excerpt (a project claim, automatically extracted from [README](https://github.com/FerroxLabs/ijfw/blob/eda62f39f08b3028d824de1d806fe05c1402fd94/README.md)):

> IJFW is one shared brain, and a full operating layer, for every AI coding tool you use.** Install it once and your tools remember across sessions, plan before they build, check each other's work for hallucinations, pull in the right specialist for the job, and quietly cut your token bill. All on your machine. All yours. You told Claude Code once, on Monday. Cursor knew on Wednesday. That's  one  of the engines.

Build/package evidence: [installer/package.json](https://github.com/FerroxLabs/ijfw/blob/eda62f39f08b3028d824de1d806fe05c1402fd94/installer/package.json); [mcp-server/package.json](https://github.com/FerroxLabs/ijfw/blob/eda62f39f08b3028d824de1d806fe05c1402fd94/mcp-server/package.json); [package.json](https://github.com/FerroxLabs/ijfw/blob/eda62f39f08b3028d824de1d806fe05c1402fd94/package.json); [test/fixtures/project-types/book/9/code/package.json](https://github.com/FerroxLabs/ijfw/blob/eda62f39f08b3028d824de1d806fe05c1402fd94/test/fixtures/project-types/book/9/code/package.json); [test/fixtures/project-types/software/1/package.json](https://github.com/FerroxLabs/ijfw/blob/eda62f39f08b3028d824de1d806fe05c1402fd94/test/fixtures/project-types/software/1/package.json)

License evidence: [LICENSE](https://github.com/FerroxLabs/ijfw/blob/eda62f39f08b3028d824de1d806fe05c1402fd94/LICENSE) Classification hint: MIT. A root license does not establish rights for every bundled asset, model, or dependency.

## Harness assessment

This entry was catalogued under **ai-agents**. Its category places it in the candidate set for agents, models, channels; those associations are navigational and have not been individually validated as implemented capabilities. See [agents](../agents.md) · [models](../models.md) · [channels](../channels.md) for the source-reviewed alternatives and proposed integration boundaries.

**Disposition:** retain as a comparison candidate. Before adopting it, inspect the implementation entry point and its tests, verify the required protocol and deployment platform, and reproduce a task from the harness evaluation suite. Popularity, a README feature list, and the presence of a package manifest are insufficient evidence of quality or compatibility.

**Unresolved:** runtime behavior, security boundaries, performance, API/subscription eligibility, dependency health, maintenance status, and fit to the proposed harness were not independently established for this entry. No repository code was executed as part of this screening.

<!-- teamagent-analysis:start -->
Analysis metadata: source [ijfw](https://github.com/FerroxLabs/ijfw); analyzed commit `eda62f39f08b3028d824de1d806fe05c1402fd94`; commit date 2026-07-11T10:56:21+07:00; review date unknown; depth screened. [Maintenance record](../analyses/repos/ai-agents--ijfw.md).
<!-- teamagent-analysis:end -->
