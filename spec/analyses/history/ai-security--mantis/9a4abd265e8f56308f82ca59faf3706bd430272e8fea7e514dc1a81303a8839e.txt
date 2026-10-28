# mantis

Source: [mantis](https://github.com/google/mantis) · Category: [ai-security](../categories/ai-security.md)

Review depth: **inventory / README screening only**. This is an individual coverage record, not a source-code correctness audit or adoption recommendation.

Snapshot: `47099edfe7518345850ceaae947e2f91b554ec23`; commit timestamp `2026-09-28T04:47:59-07:00`; 113 tracked paths.

## Scope and evidence

Upstream description excerpt (a project claim, automatically extracted from [README](https://github.com/google/mantis/blob/47099edfe7518345850ceaae947e2f91b554ec23/README.md)):

> designed to generate and execute autonomously generated code that may be unstable or perform unexpected actions. **USE THIS ONLY IN ISOLATED,

Build/package evidence: [reference/requirements.txt](https://github.com/google/mantis/blob/47099edfe7518345850ceaae947e2f91b554ec23/reference/requirements.txt); [reference/sandbox/requirements.txt](https://github.com/google/mantis/blob/47099edfe7518345850ceaae947e2f91b554ec23/reference/sandbox/requirements.txt)

License evidence: [LICENSE](https://github.com/google/mantis/blob/47099edfe7518345850ceaae947e2f91b554ec23/LICENSE) Classification hint: Apache-2.0. A root license does not establish rights for every bundled asset, model, or dependency.

## Harness assessment

This entry was catalogued under **ai-security**. Its category places it in the candidate set for agents, skills, evolution; those associations are navigational and have not been individually validated as implemented capabilities. See [agents](../agents.md) · [skills](../skills.md) · [evolution](../evolution.md) for the source-reviewed alternatives and proposed integration boundaries.

**Disposition:** retain as a comparison candidate. Before adopting it, inspect the implementation entry point and its tests, verify the required protocol and deployment platform, and reproduce a task from the harness evaluation suite. Popularity, a README feature list, and the presence of a package manifest are insufficient evidence of quality or compatibility.

**Unresolved:** runtime behavior, security boundaries, performance, API/subscription eligibility, dependency health, maintenance status, and fit to the proposed harness were not independently established for this entry. No repository code was executed as part of this screening.
