# openeval

Source: [openeval](https://github.com/Hona/openeval) · Category: [ai-eval](../categories/ai-eval.md)

Review depth: **inventory / README screening only**. This is an individual coverage record, not a source-code correctness audit or adoption recommendation.

Snapshot: `61eeb43d7bea371d00f813500cd1cf56f9116f8d`; commit timestamp `2026-10-03T19:19:43+10:00`; 386 tracked paths.

## Scope and evidence

Upstream description excerpt (a project claim, automatically extracted from [README](https://github.com/Hona/openeval/blob/61eeb43d7bea371d00f813500cd1cf56f9116f8d/README.md)):

> Code and LLM judges for agents. Plain functions, isolated runs, inspectable scores. Interactive documentation example. Viewer screenshots use illustrative data and fictional model labels.

Build/package evidence: [package.json](https://github.com/Hona/openeval/blob/61eeb43d7bea371d00f813500cd1cf56f9116f8d/package.json); [packages/openeval/package.json](https://github.com/Hona/openeval/blob/61eeb43d7bea371d00f813500cd1cf56f9116f8d/packages/openeval/package.json); [packages/openeval/src/infra/containers/runtime/noninteractive/package.json](https://github.com/Hona/openeval/blob/61eeb43d7bea371d00f813500cd1cf56f9116f8d/packages/openeval/src/infra/containers/runtime/noninteractive/package.json); [packages/openeval/src/infra/containers/runtime/package.json](https://github.com/Hona/openeval/blob/61eeb43d7bea371d00f813500cd1cf56f9116f8d/packages/openeval/src/infra/containers/runtime/package.json); [packages/openeval/src/infra/verification/runtime/package.json](https://github.com/Hona/openeval/blob/61eeb43d7bea371d00f813500cd1cf56f9116f8d/packages/openeval/src/infra/verification/runtime/package.json)

License evidence: [LICENSE](https://github.com/Hona/openeval/blob/61eeb43d7bea371d00f813500cd1cf56f9116f8d/LICENSE) Classification hint: MIT. A root license does not establish rights for every bundled asset, model, or dependency.

## Harness assessment

This entry was catalogued under **ai-eval**. Its category places it in the candidate set for evolution, decisions; those associations are navigational and have not been individually validated as implemented capabilities. See [evolution](../evolution.md) · [decisions](../decisions.md) for the source-reviewed alternatives and proposed integration boundaries.

**Disposition:** retain as a comparison candidate. Before adopting it, inspect the implementation entry point and its tests, verify the required protocol and deployment platform, and reproduce a task from the harness evaluation suite. Popularity, a README feature list, and the presence of a package manifest are insufficient evidence of quality or compatibility.

**Unresolved:** runtime behavior, security boundaries, performance, API/subscription eligibility, dependency health, maintenance status, and fit to the proposed harness were not independently established for this entry. No repository code was executed as part of this screening.
