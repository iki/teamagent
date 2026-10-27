# E2B: remote sandbox SDK and command lifecycle

Source: [e2b](https://github.com/e2b-dev/e2b) · Category: `ai-agents-sandbox`

Review depth: **source-reviewed**. Snapshot `a9e893bcb9b44cc53778a45975c58fdfa0f0da7e`; assessed 2026-10-04. This is a focused static review of the listed files, not an audit of every code path or a reproduced benchmark. No repository code, model weights, paid endpoints, or installers were run.

## Observed architecture

The JavaScript SDK creates a sandbox from a template and options, resolves connection configuration, and delegates to the sandbox API. A debug mode returns a local/debug identity rather than creating a production sandbox. Optional MCP configuration starts a gateway inside the sandbox with a generated token; bootstrap failure attempts sandbox destruction before surfacing the error.

The command handle separates stdout, stderr, exit code, command failure, and a process identifier. The broader SDK surface includes connection, lifetime extension, and destruction. These are the right lifecycle primitives for durable harness workers: a task can outlive a browser request and reconnect to an existing worker without pretending it is a fresh execution.

## Harness adoption

Implement an E2B adapter for users choosing hosted environments. Record template identity, sandbox identifier, timeout, policy, and credential scope in each attempt. Reconcile expired or missing sandboxes on reconnect, and persist output/artifacts continuously rather than waiting for job completion. Make cancellation idempotent and distinguish process cancellation from whole-environment destruction.

Use a shared harness execution contract so local [OpenSandbox](ai-agents-sandbox--opensandbox.md) workers and hosted workers remain interchangeable at the task layer. Network, hardware, cost, and data-residency constraints still filter the eligible worker set.

## Limitations and decision

This repository review establishes SDK behavior, not the complete hosted infrastructure's security implementation or pricing. The debug path is unsuitable evidence for production isolation tests. A startup cleanup attempt may itself fail, so an external lease reaper remains necessary. Avoid passing unrelated user credentials into the optional MCP gateway. Evaluate cold starts, reconnect behavior, artifact transfer, quotas, and billed idle time with an authorized pilot before adopting default cloud execution.

## Evidence read

- [Sandbox creation, MCP bootstrap, cleanup on failure](https://github.com/e2b-dev/e2b/blob/a9e893bcb9b44cc53778a45975c58fdfa0f0da7e/packages/js-sdk/src/sandbox/index.ts#L282-L345)
- [Command results and command handles](https://github.com/e2b-dev/e2b/blob/a9e893bcb9b44cc53778a45975c58fdfa0f0da7e/packages/js-sdk/src/sandbox/commands/commandHandle.ts#L1-L85)

## Related directions

[Agents](../agents.md) · [Generation](../generation.md) · [Security](../security.md)

<!-- teamagent-analysis:start -->
Analysis metadata: source [e2b](https://github.com/e2b-dev/e2b); analyzed commit `a9e893bcb9b44cc53778a45975c58fdfa0f0da7e`; commit date 2026-10-02T14:22:20-07:00; review date unknown; depth source-reviewed. [Maintenance record](../analyses/repos/ai-agents-sandbox--e2b.md).
<!-- teamagent-analysis:end -->
