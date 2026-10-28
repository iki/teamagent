# claude.fork.openclaude

Source: [claude.fork.openclaude](https://github.com/Gitlawb/openclaude) · Category: [ai-agents](../categories/ai-agents.md)

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

## 2026-10-28 scoped source review

Source: [claude.fork.openclaude](https://github.com/Gitlawb/openclaude); inspected saved discovery revision `20a50493c775f151b61e1fabd5fa678ad1fbdaae`. Prior analyzed revision `9a2910da236395d259c72c3b4ddf92278625a6c1` remains historical evidence.

**Scope:** Complete Gemini credential/endpoint helper only. This catalog alias points to the same repository and revision as the separate OpenClaude tool-pool review; it adds a distinct auth scope, not an independent implementation or benchmark.

The [endpoint helper](https://github.com/Gitlawb/openclaude/blob/20a50493c775f151b61e1fabd5fa678ad1fbdaae/src/utils/geminiAuth.ts#L95-L177) treats project, region and model as URI components and rejects path/query/fragment delimiters, while sharing effective Vertex auth-mode precedence between callers. Its model-specific global-endpoint table is a source snapshot, not independently verified current provider availability. Invalid auth-mode text becomes undefined and falls through to normal credential selection, so startup schema validation must remain separate.

The [credential resolver](https://github.com/Gitlawb/openclaude/blob/20a50493c775f151b61e1fabd5fa678ad1fbdaae/src/utils/geminiAuth.ts#L203-L356) distinguishes API keys, explicit access tokens and ADC; direct Gemini normally requires evidence of a credential file before ambient ADC discovery, while native Vertex may allow the full ambient chain. File existence is a discovery hint, not valid authentication. Optional-module absence is surfaced, but most ADC failures collapse to `none`, losing the difference between absent configuration and a failed identity service.

Default ADC results are cached for five minutes using selected environment/path hints, without token expiry or credential-file content in this helper's key. The default GoogleAuth constructor uses its ambient SDK chain rather than receiving the caller-supplied environment as an isolated credential context; project hints alone do not bind the resulting account. Transport authorization, destination policy, actual expiry refresh and memoizer invalidation remain outside scope. Teamagent should use typed unavailable states and account-bound credential services rather than interpreting these discovery helpers as entitlement or training-policy evidence. No optional module, credential file, Google service or test was accessed or executed.

## 2026-10-28 follow-up source review

Reviewed commit `ffa79d9cbb7f3ca9589601f1657803bae6847722` (commit date `2026-10-27T15:36:29-07:00`), compared with `20a50493c775f151b61e1fabd5fa678ad1fbdaae`. Earlier findings remain historical evidence.

**Scope:** Session-search confidentiality and launcher argument-boundary changes. The complete changed-path inventory contains 29 paths; the assessment below is limited to the cited branches.

Search no longer logs the raw query, prompt excerpt or model response. Transcript loading disables parse-content logging; model-output parsing starts from unknown and accepts only integer indices within the selected-log bounds. Parser/provider errors become a generic failure instead of logging private excerpts. See [src/utils/agenticSessionSearch.ts](https://github.com/Gitlawb/openclaude/blob/ffa79d9cbb7f3ca9589601f1657803bae6847722/src/utils/agenticSessionSearch.ts#L171-L190) and [src/utils/agenticSessionSearch.ts](https://github.com/Gitlawb/openclaude/blob/ffa79d9cbb7f3ca9589601f1657803bae6847722/src/utils/agenticSessionSearch.ts#L247-L302). The launcher stops interpreting its own options at the first CLI argument and forwards the remaining arguments together, preventing prompt words from being interpreted as provider selection. See [scripts/provider-launch.ts](https://github.com/Gitlawb/openclaude/blob/ffa79d9cbb7f3ca9589601f1657803bae6847722/scripts/provider-launch.ts#L57-L74).

For Teamagent, apply confidentiality at diagnostic boundaries as well as ordinary output, and retain explicit parse/unavailable states: some invalid search shapes still return an empty result in this branch. These changes do not establish local-only semantic search, server privacy policy or complete session parser validation.

**Verification limit:** committed-source inspection only; no upstream code, tests or provider calls were executed. This review does not certify every changed file or establish a Teamagent integration.

<!-- teamagent-analysis:start -->
Analysis metadata: source [claude.fork.openclaude](https://github.com/Gitlawb/openclaude); analyzed commit `ffa79d9cbb7f3ca9589601f1657803bae6847722`; commit date 2026-10-27T15:36:29-07:00; review date 2026-10-28T14:29:27.414Z; depth screened. [Maintenance record](../analyses/repos/ai-agents--claude.fork.openclaude.md).
<!-- teamagent-analysis:end -->
