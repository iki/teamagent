# openbot

Source: [openbot](https://github.com/CopilotKit/openbot) · Category: [ai-agents](../categories/ai-agents.md)

Review depth: **inventory / README screening only**. This is an individual coverage record, not a source-code correctness audit or adoption recommendation.

Snapshot: `cb5dc32a44517622c6db4e527e61d3abb389b43c`; commit timestamp `2026-10-02T17:17:11-07:00`; 1,643 tracked paths.

## Scope and evidence

Upstream description excerpt (a project claim, automatically extracted from [README](https://github.com/CopilotKit/openbot/blob/cb5dc32a44517622c6db4e527e61d3abb389b43c/README.md)):

> The AI assistant your company can actually own.** Same shape as ChatGPT, Claude or Grok, with one difference that matters: it runs on your infrastructure and you can change anything about it. Any agent stack, through AG-UI. Each coworker gets a computer of its own: a real browser with its own logins, its own files, and only the tools you grant. Every action decided before it happens and recorded after.

Build/package evidence: [agent-adk/requirements.txt](https://github.com/CopilotKit/openbot/blob/cb5dc32a44517622c6db4e527e61d3abb389b43c/agent-adk/requirements.txt); [agent-ag2/requirements.txt](https://github.com/CopilotKit/openbot/blob/cb5dc32a44517622c6db4e527e61d3abb389b43c/agent-ag2/requirements.txt); [agent-agno/requirements.txt](https://github.com/CopilotKit/openbot/blob/cb5dc32a44517622c6db4e527e61d3abb389b43c/agent-agno/requirements.txt); [agent-bot/package.json](https://github.com/CopilotKit/openbot/blob/cb5dc32a44517622c6db4e527e61d3abb389b43c/agent-bot/package.json); [agent-claude-sdk/requirements.txt](https://github.com/CopilotKit/openbot/blob/cb5dc32a44517622c6db4e527e61d3abb389b43c/agent-claude-sdk/requirements.txt)

License evidence: [LICENSE](https://github.com/CopilotKit/openbot/blob/cb5dc32a44517622c6db4e527e61d3abb389b43c/LICENSE) Classification hint: MIT. A root license does not establish rights for every bundled asset, model, or dependency.

## Harness assessment

This entry was catalogued under **ai-agents**. Its category places it in the candidate set for agents, models, channels; those associations are navigational and have not been individually validated as implemented capabilities. See [agents](../agents.md) · [models](../models.md) · [channels](../channels.md) for the source-reviewed alternatives and proposed integration boundaries.

**Disposition:** retain as a comparison candidate. Before adopting it, inspect the implementation entry point and its tests, verify the required protocol and deployment platform, and reproduce a task from the harness evaluation suite. Popularity, a README feature list, and the presence of a package manifest are insufficient evidence of quality or compatibility.

**Unresolved:** runtime behavior, security boundaries, performance, API/subscription eligibility, dependency health, maintenance status, and fit to the proposed harness were not independently established for this entry. No repository code was executed as part of this screening.
