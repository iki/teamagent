# glean-api-go

Source: [glean-api-go](https://github.com/gleanwork/api-client-go) · Category: [ai-agents-mem](../categories/ai-agents-mem.md)

Review depth: **inventory / README screening only**. This is an individual coverage record, not a source-code correctness audit or adoption recommendation.

Snapshot: `6a4d2de36d85c5a0b54bcb1ca554f24da0d1ddc0`; commit timestamp `2026-10-03T07:21:21-06:00`; 3,114 tracked paths.

## Scope and evidence

Upstream description excerpt (a project claim, automatically extracted from [README](https://github.com/gleanwork/api-client-go/blob/6a4d2de36d85c5a0b54bcb1ca554f24da0d1ddc0/README.md)):

> The Glean Go SDK provides convenient access to the Glean REST API for Go 1.18+. It offers strongly typed request and response structs, context-based request handling, and uses the standard net/http package. This SDK combines both the Client and Indexing API namespaces into a single unified package:

Build/package evidence: [go.mod](https://github.com/gleanwork/api-client-go/blob/6a4d2de36d85c5a0b54bcb1ca554f24da0d1ddc0/go.mod); [tests/mockserver/go.mod](https://github.com/gleanwork/api-client-go/blob/6a4d2de36d85c5a0b54bcb1ca554f24da0d1ddc0/tests/mockserver/go.mod)

License evidence: [LICENSE](https://github.com/gleanwork/api-client-go/blob/6a4d2de36d85c5a0b54bcb1ca554f24da0d1ddc0/LICENSE) Classification hint: MIT. A root license does not establish rights for every bundled asset, model, or dependency.

## Harness assessment

This entry was catalogued under **ai-agents-mem**. Its category places it in the candidate set for memory, evolution; those associations are navigational and have not been individually validated as implemented capabilities. See [memory](../memory.md) · [evolution](../evolution.md) for the source-reviewed alternatives and proposed integration boundaries.

**Disposition:** retain as a comparison candidate. Before adopting it, inspect the implementation entry point and its tests, verify the required protocol and deployment platform, and reproduce a task from the harness evaluation suite. Popularity, a README feature list, and the presence of a package manifest are insufficient evidence of quality or compatibility.

**Unresolved:** runtime behavior, security boundaries, performance, API/subscription eligibility, dependency health, maintenance status, and fit to the proposed harness were not independently established for this entry. No repository code was executed as part of this screening.
