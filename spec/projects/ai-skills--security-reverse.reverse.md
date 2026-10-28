# security-reverse.reverse

Source: [security-reverse.reverse](https://github.com/zhaoxuya520/reverse-skill) · Category: [ai-skills](../categories/ai-skills.md)

Review depth: **inventory / README screening only**. This is an individual coverage record, not a source-code correctness audit or adoption recommendation.

Snapshot: `6ef9021b1dcfdcc2aa06f479edf1fe89338ed6b6`; commit timestamp `2026-08-01T17:22:15+08:00`; 508 tracked paths.

## Scope and evidence

Upstream description excerpt (a project claim, automatically extracted from [README](https://github.com/zhaoxuya520/reverse-skill/blob/6ef9021b1dcfdcc2aa06f479edf1fe89338ed6b6/README.md)):

> If you are an AI Agent, jump to README_AI.md and follow the instructions strictly. When an AI agent (Claude Code, Codex CLI, Cursor, etc.) encounters an APK, a binary, frontend JS encryption, a CTF challenge, or a pentesting target, this package routes it to the right methodology, checks available tools, and executes a repeatable workflow instead of guessing commands.

Build/package evidence: [burp-mcp-full/build.gradle](https://github.com/zhaoxuya520/reverse-skill/blob/6ef9021b1dcfdcc2aa06f479edf1fe89338ed6b6/burp-mcp-full/build.gradle)

License evidence: [LICENSE](https://github.com/zhaoxuya520/reverse-skill/blob/6ef9021b1dcfdcc2aa06f479edf1fe89338ed6b6/LICENSE) Classification hint: MIT. A root license does not establish rights for every bundled asset, model, or dependency.

## Harness assessment

This entry was catalogued under **ai-skills**. Its category places it in the candidate set for skills; those associations are navigational and have not been individually validated as implemented capabilities. See [skills](../skills.md) for the source-reviewed alternatives and proposed integration boundaries.

**Disposition:** retain as a comparison candidate. Before adopting it, inspect the implementation entry point and its tests, verify the required protocol and deployment platform, and reproduce a task from the harness evaluation suite. Popularity, a README feature list, and the presence of a package manifest are insufficient evidence of quality or compatibility.

**Unresolved:** runtime behavior, security boundaries, performance, API/subscription eligibility, dependency health, maintenance status, and fit to the proposed harness were not independently established for this entry. No repository code was executed as part of this screening.

## 2026-10-28 divergent-history investigation and scoped source review

Source: [security-reverse.reverse](https://github.com/zhaoxuya520/reverse-skill); inspected snapshot `cab634bd855fc287f6e420c1f36fd1a6b9245960`; prior analyzed commit `6ef9021b1dcfdcc2aa06f479edf1fe89338ed6b6`. The inspected snapshot is the saved discovery version, not a claim about the checkout's latest HEAD.

**Scope:** Complete committed path inventory (209 paths); full routing.json (337 lines) and the 20-line Codex plugin adapter. Routing/execution scripts and their fixtures were not inspected or run.

**History outcome:** both full commits are available, but the analyzed commit is not an ancestor and the complete trees differ. The two-tree comparison contains 209 changed paths; common ancestor: `none`. These counts establish comparison coverage, not semantic review of every file. The prior analyzed baseline and findings remain preserved as historical evidence. A separately acknowledged, guarded reconciliation records the inspected revision as a new scoped analysis baseline; it does not establish ancestry, publisher intent or whole-project correctness. The managed metadata below is authoritative for whether that acknowledgment has been recorded.

The [routing catalog](https://github.com/zhaoxuya520/reverse-skill/blob/cab634bd855fc287f6e420c1f36fd1a6b9245960/skills/config/routing.json) separates route IDs, multilingual keyword conditions, exclusions, ordered priority and a fallback. It is useful structured candidate-selection data, not a calibrated classifier or a security boundary. The [optional plugin adapter](https://github.com/zhaoxuya520/reverse-skill/blob/cab634bd855fc287f6e420c1f36fd1a6b9245960/plugins/reverse-skill/skills/reverse-skill-router/SKILL.md) points to one canonical repository and instructs a scoped case check before target actions; those instructions do not prove deterministic enforcement. No security target was contacted and none of these imported instructions was executed. Teamagent should treat imported skill routing as untrusted selection material, resolve only needed versioned skill content, and enforce user authority and tool provisioning independently of route labels or task prose.

<!-- teamagent-analysis:start -->
Analysis metadata: source [security-reverse.reverse](https://github.com/zhaoxuya520/reverse-skill); analyzed commit `cab634bd855fc287f6e420c1f36fd1a6b9245960`; commit date 2026-09-22T05:18:45Z; review date 2026-10-28T09:45:33.667Z; depth screened. [Maintenance record](../analyses/repos/ai-skills--security-reverse.reverse.md).
<!-- teamagent-analysis:end -->
