# Agent Skills specification and authoring guidance

Source: [agentskills/agentskills](https://github.com/agentskills/agentskills) · Reviewed revision: `69ef37e9424c0a7ea9dd2293b559e43ec8176379` · Review date: 2026-10-04.

Depth: **source-reviewed** (static source/content inspection; repository-wide audit not claimed). Related directions: [skills](../skills.md) · [evolution](../evolution.md).

## Evidence inspected

- [`docs/specification.mdx` lines 1–80](https://github.com/agentskills/agentskills/blob/69ef37e9424c0a7ea9dd2293b559e43ec8176379/docs/specification.mdx#L1-L80)
- [`docs/skill-creation/evaluating-skills.mdx` lines 7–114](https://github.com/agentskills/agentskills/blob/69ef37e9424c0a7ea9dd2293b559e43ec8176379/docs/skill-creation/evaluating-skills.mdx#L7-L114)
- [`docs/skill-creation/optimizing-descriptions.mdx` lines 28–89](https://github.com/agentskills/agentskills/blob/69ef37e9424c0a7ea9dd2293b559e43ec8176379/docs/skill-creation/optimizing-descriptions.mdx#L28-L89)

## Observed architecture and behavior

The repository defines the SKILL.md interchange format and supplies reference tooling and authoring guidance. The inspected evaluation guide recommends realistic prompts, expected outputs, optional inputs, isolated contexts, and paired runs with and without a skill or against its previous version. A separate description guide distinguishes should-trigger from should-not-trigger cases and emphasizes difficult near misses. Repeating trigger trials exposes nondeterminism. These are two different evaluation problems: retrieving the right procedure and executing it effectively.

## Implications and tradeoffs for Teamagent

Use the format as the portable source layer, then maintain a richer internal registry rather than overloading prose with runtime state. A task should retrieve compact metadata first and fetch the body and resources only after selection. This bounds prompt cost while keeping large reference libraries available. The suggested examples and counts are starting points, not statistical proof. A test can confirm that a file was read without proving the skill improved the result. Likewise, a valid frontmatter document can contain unsafe instructions or incorrect domain advice. Format validation, policy validation, trigger evaluation, and task scoring therefore need separate statuses.

## Adoption decision

Adopt as the canonical interoperability format and baseline authoring protocol. Require positive and near-miss negative trigger fixtures plus paired outcome evaluation for tuned skills. Store evaluation artifacts beside a versioned skill manifest, with model, harness, tool set, seed where applicable, and costs. Extend metadata through namespaced fields and preserve original upstream files so a harness-specific variant remains traceable to its source.

## Verification boundary

No project code, models, installers, or benchmarks were executed during this review. Tests and documentation show intended contracts; they do not establish measured performance, production readiness, or a complete security assessment. Recommendations above are design inferences from the cited snapshot. Verify current APIs, licensing, and deployment requirements before integration.

<!-- teamagent-analysis:start -->
Analysis metadata: source [docs.skills](https://github.com/agentskills/agentskills); analyzed commit `69ef37e9424c0a7ea9dd2293b559e43ec8176379`; commit date 2026-08-09T13:36:04-07:00; review date 2026-10-04; depth source-reviewed. [Maintenance record](../analyses/repos/ai-agents-skills--docs.skills.md).
<!-- teamagent-analysis:end -->
