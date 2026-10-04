# agentmemory

Source: [agentmemory](https://github.com/rohitg00/agentmemory) · Category: [ai-agents-mem](../categories/ai-agents-mem.md)

Review depth: **inventory / README screening only**. This is an individual coverage record, not a source-code correctness audit or adoption recommendation.

Snapshot: `2a00e7b38fc4ae4e38af4134586be0bbe9612706`; commit timestamp `2026-10-03T13:30:09+05:30`; 790 tracked paths.

## Scope and evidence

Upstream description excerpt (a project claim, automatically extracted from [README](https://github.com/rohitg00/agentmemory/blob/2a00e7b38fc4ae4e38af4134586be0bbe9612706/README.md)):

> Persistent memory for Claude Code, GitHub Copilot CLI, Cursor, Gemini CLI, Codex CLI, Hermes, OpenClaw, pi, OpenCode, and any MCP client. The gist extends Karpathy's LLM Wiki pattern with confidence scoring, lifecycle, knowledge graphs, and hybrid search: agentmemory is the implementation.

Build/package evidence: [integrations/filesystem-watcher/package.json](https://github.com/rohitg00/agentmemory/blob/2a00e7b38fc4ae4e38af4134586be0bbe9612706/integrations/filesystem-watcher/package.json); [integrations/openclaw/package.json](https://github.com/rohitg00/agentmemory/blob/2a00e7b38fc4ae4e38af4134586be0bbe9612706/integrations/openclaw/package.json); [integrations/pi/package.json](https://github.com/rohitg00/agentmemory/blob/2a00e7b38fc4ae4e38af4134586be0bbe9612706/integrations/pi/package.json); [package.json](https://github.com/rohitg00/agentmemory/blob/2a00e7b38fc4ae4e38af4134586be0bbe9612706/package.json); [packages/mcp/package.json](https://github.com/rohitg00/agentmemory/blob/2a00e7b38fc4ae4e38af4134586be0bbe9612706/packages/mcp/package.json)

License evidence: [LICENSE](https://github.com/rohitg00/agentmemory/blob/2a00e7b38fc4ae4e38af4134586be0bbe9612706/LICENSE) Classification hint: Apache-2.0. A root license does not establish rights for every bundled asset, model, or dependency.

## Harness assessment

This entry was catalogued under **ai-agents-mem**. Its category places it in the candidate set for memory, evolution; those associations are navigational and have not been individually validated as implemented capabilities. See [memory](../memory.md) · [evolution](../evolution.md) for the source-reviewed alternatives and proposed integration boundaries.

**Disposition:** retain as a comparison candidate. Before adopting it, inspect the implementation entry point and its tests, verify the required protocol and deployment platform, and reproduce a task from the harness evaluation suite. Popularity, a README feature list, and the presence of a package manifest are insufficient evidence of quality or compatibility.

**Unresolved:** runtime behavior, security boundaries, performance, API/subscription eligibility, dependency health, maintenance status, and fit to the proposed harness were not independently established for this entry. No repository code was executed as part of this screening.
