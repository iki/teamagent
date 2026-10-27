# orca

Source: [orca](https://github.com/stablyai/orca) · Category: [ai-agents-swarm](../categories/ai-agents-swarm.md)

Review depth: **inventory / README screening only**. This is an individual coverage record, not a source-code correctness audit or adoption recommendation.

Snapshot: `08c7152ab6e576951b33c2991ed2dedca4333096`; commit timestamp `2026-09-02T21:48:17-07:00`; 22,903 tracked paths.

## Scope and evidence

Upstream description excerpt (a project claim, automatically extracted from [README](https://github.com/stablyai/orca/blob/08c7152ab6e576951b33c2991ed2dedca4333096/README.md)):

> Run Codex, ClaudeCode, OpenCode or Pi side-by-side — each in its own worktree, tracked in one place. Monitor and steer your agents from your phone — get notified when an agent finishes and send follow-ups from anywhere.

Build/package evidence: [docs/site/package.json](https://github.com/stablyai/orca/blob/08c7152ab6e576951b33c2991ed2dedca4333096/docs/site/package.json); [mobile/package.json](https://github.com/stablyai/orca/blob/08c7152ab6e576951b33c2991ed2dedca4333096/mobile/package.json); [mobile/packages/expo-two-way-audio/android/build.gradle](https://github.com/stablyai/orca/blob/08c7152ab6e576951b33c2991ed2dedca4333096/mobile/packages/expo-two-way-audio/android/build.gradle); [mobile/packages/expo-two-way-audio/package.json](https://github.com/stablyai/orca/blob/08c7152ab6e576951b33c2991ed2dedca4333096/mobile/packages/expo-two-way-audio/package.json); [package.json](https://github.com/stablyai/orca/blob/08c7152ab6e576951b33c2991ed2dedca4333096/package.json)

License evidence: [LICENSE](https://github.com/stablyai/orca/blob/08c7152ab6e576951b33c2991ed2dedca4333096/LICENSE) Classification hint: MIT. A root license does not establish rights for every bundled asset, model, or dependency.

## Harness assessment

This entry was catalogued under **ai-agents-swarm**. Its category places it in the candidate set for agents, decisions; those associations are navigational and have not been individually validated as implemented capabilities. See [agents](../agents.md) · [decisions](../decisions.md) for the source-reviewed alternatives and proposed integration boundaries.

**Disposition:** retain as a comparison candidate. Before adopting it, inspect the implementation entry point and its tests, verify the required protocol and deployment platform, and reproduce a task from the harness evaluation suite. Popularity, a README feature list, and the presence of a package manifest are insufficient evidence of quality or compatibility.

**Unresolved:** runtime behavior, security boundaries, performance, API/subscription eligibility, dependency health, maintenance status, and fit to the proposed harness were not independently established for this entry. No repository code was executed as part of this screening.

<!-- teamagent-analysis:start -->
Analysis metadata: source [orca](https://github.com/stablyai/orca); analyzed commit `08c7152ab6e576951b33c2991ed2dedca4333096`; commit date 2026-09-02T21:48:17-07:00; review date unknown; depth screened. [Maintenance record](../analyses/repos/ai-agents-swarm--orca.md).
<!-- teamagent-analysis:end -->
