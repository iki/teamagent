# optio

Source: [optio](https://github.com/jonwiggins/optio) · Category: [ai-agents-swarm](../categories/ai-agents-swarm.md)

Review depth: **inventory / README screening only**. This is an individual coverage record, not a source-code correctness audit or adoption recommendation.

Snapshot: `d1bc561661257bd03a031a8c49561de5eb5963d7`; commit timestamp `2026-10-01T09:57:03-06:00`; 2,555 tracked paths.

## Scope and evidence

Upstream description excerpt (a project claim, automatically extracted from [README](https://github.com/jonwiggins/optio/blob/d1bc561661257bd03a031a8c49561de5eb5963d7/README.md)):

> Self-hosted AI agent swarm and workflow orchestration platform — your cluster, your machines, your agents, your code. Optio runs AI agents as durable, observable, triggerable **sessions** — on Kubernetes pods you operate or on the laptops your team already has — and wires them together into workflows and swarms. It began as a ticket-to-merged-PR pipeline, and it still does that end to end. But the same control plane now runs scheduled reports, webhook responders, event-driven automations on your own machine, interactive agent terminals you can 

Build/package evidence: [apps/android/e2e/package.json](https://github.com/jonwiggins/optio/blob/d1bc561661257bd03a031a8c49561de5eb5963d7/apps/android/e2e/package.json); [apps/api/package.json](https://github.com/jonwiggins/optio/blob/d1bc561661257bd03a031a8c49561de5eb5963d7/apps/api/package.json); [apps/cli/package.json](https://github.com/jonwiggins/optio/blob/d1bc561661257bd03a031a8c49561de5eb5963d7/apps/cli/package.json); [apps/site/package.json](https://github.com/jonwiggins/optio/blob/d1bc561661257bd03a031a8c49561de5eb5963d7/apps/site/package.json); [apps/web/package.json](https://github.com/jonwiggins/optio/blob/d1bc561661257bd03a031a8c49561de5eb5963d7/apps/web/package.json)

License evidence: [LICENSE](https://github.com/jonwiggins/optio/blob/d1bc561661257bd03a031a8c49561de5eb5963d7/LICENSE) Classification hint: MIT. A root license does not establish rights for every bundled asset, model, or dependency.

## Harness assessment

This entry was catalogued under **ai-agents-swarm**. Its category places it in the candidate set for agents, decisions; those associations are navigational and have not been individually validated as implemented capabilities. See [agents](../agents.md) · [decisions](../decisions.md) for the source-reviewed alternatives and proposed integration boundaries.

**Disposition:** retain as a comparison candidate. Before adopting it, inspect the implementation entry point and its tests, verify the required protocol and deployment platform, and reproduce a task from the harness evaluation suite. Popularity, a README feature list, and the presence of a package manifest are insufficient evidence of quality or compatibility.

**Unresolved:** runtime behavior, security boundaries, performance, API/subscription eligibility, dependency health, maintenance status, and fit to the proposed harness were not independently established for this entry. No repository code was executed as part of this screening.

## Source update reviewed 2026-10-28

Reviewed commit: [`f2c557d476125429eb327019254fa5a2237902cf`](https://github.com/jonwiggins/optio/commit/f2c557d476125429eb327019254fa5a2237902cf). Scope: Full WebSocket authentication and workspace/role authorization helpers read. Token mint/consume implementation, origin allowlist, route wiring and revocation behavior were not audited.

The [WebSocket authentication helper](https://github.com/jonwiggins/optio/blob/f2c557d476125429eb327019254fa5a2237902cf/apps/api/src/ws/ws-auth.ts) checks browser origin before authentication, uses cookies or credential subprotocols rather than URL query tokens, refreshes workspace membership and retains only the reusable credential that actually authenticated the upgrade. Single-use upgrade-token consumption is delegated to an unread service; PATs are also accepted, so not every subprotocol credential is short-lived. The extractor takes the first matching credential rather than rejecting duplicates.

The [authorization helper](https://github.com/jonwiggins/optio/blob/f2c557d476125429eb327019254fa5a2237902cf/apps/api/src/ws/ws-authz.ts) separates workspace equality, private ownership visibility and mutating-role requirements. Null workspace matching is explicitly a local-development case, and auth-disabled mode bypasses role enforcement. Adapt resource authorization for each WebSocket route and current membership checks; connection establishment does not establish per-message authorization or revocation of a long-lived stream. The separate raw-cookie extraction helper must not be mistaken for proof the cookie authenticated. No sessions, tokens, sockets or tests were exercised.

<!-- teamagent-analysis:start -->
Analysis metadata: source [optio](https://github.com/jonwiggins/optio); analyzed commit `f2c557d476125429eb327019254fa5a2237902cf`; commit date 2026-10-26T20:58:35-06:00; review date 2026-10-28T09:45:33.667Z; depth screened. [Maintenance record](../analyses/repos/ai-agents-swarm--optio.md).
<!-- teamagent-analysis:end -->
