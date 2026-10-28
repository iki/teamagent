# multi-fleet

Source: [multi-fleet](https://github.com/supportersimulator/multi-fleet) · Category: [ai-agents-swarm](../categories/ai-agents-swarm.md)

Review depth: **inventory / README screening only**. This is an individual coverage record, not a source-code correctness audit or adoption recommendation.

Snapshot: `291f6998359bc620936c7fff3f128a17525a26c9`; commit timestamp `2026-05-13T13:25:02-06:00`; 611 tracked paths.

## Scope and evidence

Upstream description excerpt (a project claim, automatically extracted from [README](https://github.com/supportersimulator/multi-fleet/blob/291f6998359bc620936c7fff3f128a17525a26c9/README.md)):

> Cross-machine AI collaboration for Claude Code, Cursor, VS Code, Codex, and Gemini. Real-time peer-to-peer messaging with a **9-priority self-healing fallback chain**, session-aware autonomous task agents, HMAC-signed communication, and fleet-wide productivity visibility. **Messages always deliver** — even when NATS is down, HTTP is blocked, and SSH is your only path.

Build/package evidence: [package.json](https://github.com/supportersimulator/multi-fleet/blob/291f6998359bc620936c7fff3f128a17525a26c9/package.json); [pyproject.toml](https://github.com/supportersimulator/multi-fleet/blob/291f6998359bc620936c7fff3f128a17525a26c9/pyproject.toml)

License evidence: [LICENSE](https://github.com/supportersimulator/multi-fleet/blob/291f6998359bc620936c7fff3f128a17525a26c9/LICENSE) Classification hint: MIT. A root license does not establish rights for every bundled asset, model, or dependency.

## Harness assessment

This entry was catalogued under **ai-agents-swarm**. Its category places it in the candidate set for agents, decisions; those associations are navigational and have not been individually validated as implemented capabilities. See [agents](../agents.md) · [decisions](../decisions.md) for the source-reviewed alternatives and proposed integration boundaries.

**Disposition:** retain as a comparison candidate. Before adopting it, inspect the implementation entry point and its tests, verify the required protocol and deployment platform, and reproduce a task from the harness evaluation suite. Popularity, a README feature list, and the presence of a package manifest are insufficient evidence of quality or compatibility.

**Unresolved:** runtime behavior, security boundaries, performance, API/subscription eligibility, dependency health, maintenance status, and fit to the proposed harness were not independently established for this entry. No repository code was executed as part of this screening.
