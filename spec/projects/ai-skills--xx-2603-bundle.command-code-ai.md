# xx-2603-bundle.command-code-ai

Source: [xx-2603-bundle.command-code-ai](https://github.com/CommandCodeAI/agent-skills) · Category: [ai-skills](../categories/ai-skills.md)

Review depth: **inventory / README screening only**. This is an individual coverage record, not a source-code correctness audit or adoption recommendation.

Snapshot: `f490dd9016f2729311e90f317dcb6c98be1a1500`; commit timestamp `2026-03-10T16:05:51-07:00`; 375 tracked paths.

## Scope and evidence

Upstream description excerpt (a project claim, automatically extracted from [README](https://github.com/CommandCodeAI/agent-skills/blob/f490dd9016f2729311e90f317dcb6c98be1a1500/README.md)):

> A curated list of practical Skills for enhancing workflows and capabilities of coding agents. Skills are customizable workflows that teach AI assistants how to perform specific tasks according to your unique requirements. Skills enable AI assistants to execute tasks in a repeatable, standardized manner across different platforms and interfaces.

Build/package evidence: [skills/mcp-builder/scripts/requirements.txt](https://github.com/CommandCodeAI/agent-skills/blob/f490dd9016f2729311e90f317dcb6c98be1a1500/skills/mcp-builder/scripts/requirements.txt); [skills/playwright-skill/package.json](https://github.com/CommandCodeAI/agent-skills/blob/f490dd9016f2729311e90f317dcb6c98be1a1500/skills/playwright-skill/package.json); [skills/slack-gif-creator/requirements.txt](https://github.com/CommandCodeAI/agent-skills/blob/f490dd9016f2729311e90f317dcb6c98be1a1500/skills/slack-gif-creator/requirements.txt)

License evidence: [LICENSE](https://github.com/CommandCodeAI/agent-skills/blob/f490dd9016f2729311e90f317dcb6c98be1a1500/LICENSE) Classification hint: MIT. A root license does not establish rights for every bundled asset, model, or dependency.

## Harness assessment

This entry was catalogued under **ai-skills**. Its category places it in the candidate set for skills; those associations are navigational and have not been individually validated as implemented capabilities. See [skills](../skills.md) for the source-reviewed alternatives and proposed integration boundaries.

**Disposition:** retain as a comparison candidate. Before adopting it, inspect the implementation entry point and its tests, verify the required protocol and deployment platform, and reproduce a task from the harness evaluation suite. Popularity, a README feature list, and the presence of a package manifest are insufficient evidence of quality or compatibility.

**Unresolved:** runtime behavior, security boundaries, performance, API/subscription eligibility, dependency health, maintenance status, and fit to the proposed harness were not independently established for this entry. No repository code was executed as part of this screening.
