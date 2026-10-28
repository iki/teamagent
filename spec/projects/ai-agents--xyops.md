# xyops

Source: [xyops](https://github.com/pixlcore/xyops) · Category: [ai-agents](../categories/ai-agents.md)

Original review depth: **inventory / README screening only**. The dated update review below has its own explicit scope. This is an individual coverage record, not a source-code correctness audit or adoption recommendation.

Snapshot: `ec9727dede8e0f5f6b8f6978fed66a1b6faefb83`; commit timestamp `2026-10-02T10:24:27-07:00`; 311 tracked paths.

## Scope and evidence

Upstream description excerpt (a project claim, automatically extracted from [README](https://github.com/pixlcore/xyops/blob/ec9727dede8e0f5f6b8f6978fed66a1b6faefb83/README.md)):

> xyOps is the next generation of Cronicle:** a complete, self-hosted platform for job scheduling, visual workflow automation, server monitoring, alerting, and incident response. Website | Install | Documentation | CLI | Cronicle migration | Plugin Marketplace | Support

Build/package evidence: [package.json](https://github.com/pixlcore/xyops/blob/ec9727dede8e0f5f6b8f6978fed66a1b6faefb83/package.json)

License evidence: [LICENSE.md](https://github.com/pixlcore/xyops/blob/ec9727dede8e0f5f6b8f6978fed66a1b6faefb83/LICENSE.md) Classification hint: BSD; inspect variant. A root license does not establish rights for every bundled asset, model, or dependency.

## Harness assessment

This entry was catalogued under **ai-agents**. Its category places it in the candidate set for agents, models, channels; those associations are navigational and have not been individually validated as implemented capabilities. See [agents](../agents.md) · [models](../models.md) · [channels](../channels.md) for the source-reviewed alternatives and proposed integration boundaries.

**Disposition:** retain as a comparison candidate. Before adopting it, inspect the implementation entry point and its tests, verify the required protocol and deployment platform, and reproduce a task from the harness evaluation suite. Popularity, a README feature list, and the presence of a package manifest are insufficient evidence of quality or compatibility.

**Unresolved:** runtime behavior, security boundaries, performance, API/subscription eligibility, dependency health, maintenance status, and fit to the proposed harness were not independently established for this entry. No repository code was executed as part of this screening.

## 2026-10-28 scoped update review

Reviewed commit `af06253a33af35db89f0ef1e944a5b001ea01756` (commit date `2026-10-25T18:11:36-07:00`). The original snapshot above remains historical evidence.

**Scope:** The newly added terminal-management layer at the pinned revision; transport authentication, PTY worker execution, scheduler behavior and network/native tests were not audited.

The new [terminal layer](https://github.com/pixlcore/xyops/blob/af06253a33af35db89f0ef1e944a5b001ea01756/lib/term.js#L47-L151) admits terminal creation/reconnection only for an admin socket, binds the terminal record to its username and server, and replaces the client reference on reconnection. Client operations check the terminal's username, while server responses check the terminal's server identity. These are useful host-owned session bindings, but this review did not inspect how those socket identities are authenticated or refreshed; the checks do not establish shell confinement.

[Detached cleanup](https://github.com/pixlcore/xyops/blob/af06253a33af35db89f0ef1e944a5b001ea01756/lib/term.js#L22-L42) sends a close request after the stale interval only when the server/socket is available and records when it was requested. The terminal record is deleted on the [server close event](https://github.com/pixlcore/xyops/blob/af06253a33af35db89f0ef1e944a5b001ea01756/lib/term.js#L173-L236). A disconnected client or sent close request is consequently not proof of a stopped PTY. Output is forwarded when a client socket exists; this layer does not provide durable replay of output missed while detached.

For Teamagent channels, retain separate connected, detached, close-requested and confirmed-closed states, with server ownership and resumable identity. Require payload schemas, bounds/backpressure and cancellation reconciliation at the actual transport/worker boundary before exposing a terminal to agents. This single-layer review does not promote xyOps into an implemented Teamagent channel or verified remote execution boundary.

**Verification limit:** source inspection only; no upstream tests or provider calls were executed. This scoped review does not certify every file in the repository.

<!-- teamagent-analysis:start -->
Analysis metadata: source [xyops](https://github.com/pixlcore/xyops); analyzed commit `af06253a33af35db89f0ef1e944a5b001ea01756`; commit date 2026-10-25T18:11:36-07:00; review date 2026-10-28T08:47:42.123Z; depth screened. [Maintenance record](../analyses/repos/ai-agents--xyops.md).
<!-- teamagent-analysis:end -->
