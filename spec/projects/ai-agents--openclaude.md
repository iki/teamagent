# openclaude

Source: [openclaude](https://github.com/Gitlawb/openclaude) · Category: [ai-agents](../categories/ai-agents.md)

Review depth: **inventory / README screening only**. This is an individual coverage record, not a source-code correctness audit or adoption recommendation.

Snapshot: `9a2910da236395d259c72c3b4ddf92278625a6c1`; commit timestamp `2026-09-29T12:59:42+08:00`; 3,492 tracked paths.

## Scope and evidence

Upstream description excerpt (a project claim, automatically extracted from [README](https://github.com/Gitlawb/openclaude/blob/9a2910da236395d259c72c3b4ddf92278625a6c1/README.md)):

> OpenClaude is an open-source coding-agent CLI for cloud and local model providers. Use OpenAI-compatible APIs, Gemini, GitHub Models, Codex OAuth, Codex, Ollama, Atomic Chat, and other supported backends while keeping one terminal-first workflow: prompts, tools, agents, MCP, slash commands, and streaming output.

Build/package evidence: [package.json](https://github.com/Gitlawb/openclaude/blob/9a2910da236395d259c72c3b4ddf92278625a6c1/package.json); [vendor/node-domexception-shim/package.json](https://github.com/Gitlawb/openclaude/blob/9a2910da236395d259c72c3b4ddf92278625a6c1/vendor/node-domexception-shim/package.json); [vscode-extension/openclaude-vscode/package.json](https://github.com/Gitlawb/openclaude/blob/9a2910da236395d259c72c3b4ddf92278625a6c1/vscode-extension/openclaude-vscode/package.json); [web/package.json](https://github.com/Gitlawb/openclaude/blob/9a2910da236395d259c72c3b4ddf92278625a6c1/web/package.json)

License evidence: [LICENSE](https://github.com/Gitlawb/openclaude/blob/9a2910da236395d259c72c3b4ddf92278625a6c1/LICENSE) Classification hint: MIT. A root license does not establish rights for every bundled asset, model, or dependency.

## Harness assessment

This entry was catalogued under **ai-agents**. Its category places it in the candidate set for agents, models, channels; those associations are navigational and have not been individually validated as implemented capabilities. See [agents](../agents.md) · [models](../models.md) · [channels](../channels.md) for the source-reviewed alternatives and proposed integration boundaries.

**Disposition:** retain as a comparison candidate. Before adopting it, inspect the implementation entry point and its tests, verify the required protocol and deployment platform, and reproduce a task from the harness evaluation suite. Popularity, a README feature list, and the presence of a package manifest are insufficient evidence of quality or compatibility.

**Unresolved:** runtime behavior, security boundaries, performance, API/subscription eligibility, dependency health, maintenance status, and fit to the proposed harness were not independently established for this entry. No repository code was executed as part of this screening.

<!-- teamagent-analysis:start -->
Analysis metadata: source [openclaude](https://github.com/Gitlawb/openclaude); analyzed commit `9a2910da236395d259c72c3b4ddf92278625a6c1`; commit date 2026-09-29T12:59:42+08:00; review date unknown; depth screened. [Maintenance record](../analyses/repos/ai-agents--openclaude.md).
<!-- teamagent-analysis:end -->
