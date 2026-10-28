# ai-sdk.vercel

Source: [ai-sdk.vercel](https://github.com/vercel/ai) · Category: [ai-agents](../categories/ai-agents.md)

Original review depth: **inventory / README screening only**. The dated update review below has its own explicit scope. This is an individual coverage record, not a source-code correctness audit or adoption recommendation.

Snapshot: `15f1a4d0531ac641a4a4d9cc602c0536c1906834`; commit timestamp `2026-10-03T22:29:15+02:00`; 9,128 tracked paths.

## Scope and evidence

Upstream description excerpt (a project claim, automatically extracted from [README](https://github.com/vercel/ai/blob/15f1a4d0531ac641a4a4d9cc602c0536c1906834/README.md)):

> No concise purpose statement extracted; inspect the upstream README.

Build/package evidence: [.github/scripts/notify-released/package.json](https://github.com/vercel/ai/blob/15f1a4d0531ac641a4a4d9cc602c0536c1906834/.github/scripts/notify-released/package.json); [.github/scripts/upload-provenance/package.json](https://github.com/vercel/ai/blob/15f1a4d0531ac641a4a4d9cc602c0536c1906834/.github/scripts/upload-provenance/package.json); [.github/workflows/actions/verify-changesets/package.json](https://github.com/vercel/ai/blob/15f1a4d0531ac641a4a4d9cc602c0536c1906834/.github/workflows/actions/verify-changesets/package.json); [apps/docs/package.json](https://github.com/vercel/ai/blob/15f1a4d0531ac641a4a4d9cc602c0536c1906834/apps/docs/package.json); [examples/ai-e2e-next/package.json](https://github.com/vercel/ai/blob/15f1a4d0531ac641a4a4d9cc602c0536c1906834/examples/ai-e2e-next/package.json)

License evidence: [LICENSE](https://github.com/vercel/ai/blob/15f1a4d0531ac641a4a4d9cc602c0536c1906834/LICENSE) Classification hint: Apache-2.0. A root license does not establish rights for every bundled asset, model, or dependency.

## Harness assessment

This entry was catalogued under **ai-agents**. Its category places it in the candidate set for agents, models, channels; those associations are navigational and have not been individually validated as implemented capabilities. See [agents](../agents.md) · [models](../models.md) · [channels](../channels.md) for the source-reviewed alternatives and proposed integration boundaries.

**Disposition:** retain as a comparison candidate. Before adopting it, inspect the implementation entry point and its tests, verify the required protocol and deployment platform, and reproduce a task from the harness evaluation suite. Popularity, a README feature list, and the presence of a package manifest are insufficient evidence of quality or compatibility.

**Unresolved:** runtime behavior, security boundaries, performance, API/subscription eligibility, dependency health, maintenance status, and fit to the proposed harness were not independently established for this entry. No repository code was executed as part of this screening.

## 2026-10-28 scoped update review

Reviewed commit `c3b6fef1ffcebd52a8fa1495b96785dc9d802880` (commit date `2026-10-27T09:26:11-07:00`). The original snapshot above remains historical evidence.

**Scope:** OAuth discovery URL construction, credential/server binding and refresh-retry branches with selected regression fixtures; shared network guard, credential persistence provider, callback host and the wider AI SDK were not audited.

The [OAuth discovery update](https://github.com/vercel/ai/blob/c3b6fef1ffcebd52a8fa1495b96785dc9d802880/packages/mcp/src/tool/oauth.ts#L609-L768) assigns the appended OIDC path directly instead of resolving a double-slash path as a host-changing URL reference. It checks all candidate origins before fetching and verifies returned metadata against the expected issuer. The inspected [regression fixture](https://github.com/vercel/ai/blob/c3b6fef1ffcebd52a8fa1495b96785dc9d802880/packages/mcp/src/tool/oauth.test.ts#L641-L672) asserts the four candidate requests stay on the original origin. This validates the design intent through source, not an executed transport test; the shared redirect/address guard was outside scope.

[Credential checks](https://github.com/vercel/ai/blob/c3b6fef1ffcebd52a8fa1495b96785dc9d802880/packages/mcp/src/tool/oauth.ts#L1483-L1539) reject an existing confidential client without an issuer or stored server binding, and do not let a flow pin override its issuer. Stored bindings compare authorization-server URL and token endpoint as well as issuer. This distinction matters for Teamagent: permitting a discovered URL does not authorize it to receive a previously issued secret. [Invalid-grant recovery](https://github.com/vercel/ai/blob/c3b6fef1ffcebd52a8fa1495b96785dc9d802880/packages/mcp/src/tool/oauth.ts#L1275-L1325) invalidates only the tokens involved in a failed refresh and carries their binding into the retry, preventing token deletion from erasing the authority constraint. Persistence adapters must actually honor that conditional invalidation contract under concurrent refreshes.

The callback path requires saved server information before exchanging a code, while state comparison is conditional on the provider exposing stored state. The flow saves the server pin and PKCE verifier before redirecting. Teamagent should require durable per-flow state, one-time callback consumption and concurrency-safe credential versions, rather than assuming optional adapter hooks supply them. Inspected mock fixtures also reject issuer override and changed refresh destinations before secret-bearing POSTs; no OAuth flow, provider request or upstream test was executed.

**Verification limit:** source inspection only; no upstream tests or provider calls were executed. This scoped review does not certify every file in the repository.

<!-- teamagent-analysis:start -->
Analysis metadata: source [ai-sdk.vercel](https://github.com/vercel/ai); analyzed commit `c3b6fef1ffcebd52a8fa1495b96785dc9d802880`; commit date 2026-10-27T09:26:11-07:00; review date 2026-10-28T08:47:42.123Z; depth screened. [Maintenance record](../analyses/repos/ai-agents--ai-sdk.vercel.md).
<!-- teamagent-analysis:end -->
