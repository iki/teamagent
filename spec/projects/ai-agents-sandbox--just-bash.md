# just-bash: interpreted tools with explicit host trust

Source: [just-bash](https://github.com/vercel-labs/just-bash) · Category: `ai-agents-sandbox`

Review depth: **source-reviewed**. Snapshot `7537a260e38648e8998db7a95504102ad80b0194`; assessed 2026-10-04. This is a focused static review of the listed files, not an audit of every code path or a reproduced benchmark. No repository code, model weights, paid endpoints, or installers were run.

## Observed architecture

The repository describes a parser-to-AST-to-interpreter pipeline with virtual filesystems, built-in commands, and resource limits. Its threat model explicitly trusts host-provided filesystem, fetch, custom-command, and transformation hooks, the Node runtime, and dependencies. The network implementation validates configured allow-list entries and selects allowed methods and response-size limits. It delegates parts of SSRF and transport protection to a guarded-fetch dependency.

The threat model is unusually valuable because it identifies what the interpreter does not isolate. A malicious embedding hook can escape the intended boundary by design. Read/write host filesystems also depend on assumptions about concurrent external mutation, whereas an in-memory overlay offers a narrower surface.

## Harness adoption

Use for low-latency transforms over staged text, structured data, and small knowledge-base exports, with an in-memory or constrained overlay filesystem. Default networking off; grant exact destinations only for tasks that need them. Expose a finite command registry and bounded execution rather than general host process spawning.

Maintain a separate execution class for builds, native binaries, package installation, browser rendering, or untrusted dependencies. Those should use OS or VM/container enforcement such as [sandbox-runtime](ai-agents-sandbox--anthropic-sandbox-runtime.md) or [OpenSandbox](ai-agents-sandbox--opensandbox.md).

## Limitations and decision

Adopt as a tool interpreter, not as the sole multi-tenant security boundary. Interpreter compatibility differs from full Bash and platform filesystem behaviors need testing. Host hooks are part of the trusted computing base and must be pinned, reviewed, and capability-limited. Validate output limits, cancellation, path traversal, symlinks, DNS/redirect behavior, and denial-of-service handling against the exact version. The threat model is a design document, not independent security certification.

## Evidence read

- [Threat model and host assumptions](https://github.com/vercel-labs/just-bash/blob/7537a260e38648e8998db7a95504102ad80b0194/THREAT_MODEL.md#L1-L112)
- [Network allow-list setup and bounds](https://github.com/vercel-labs/just-bash/blob/7537a260e38648e8998db7a95504102ad80b0194/packages/just-bash/src/network/fetch.ts#L99-L178)

## Related directions

[Agents](../agents.md) · [Import Generation](../import-generation.md) · [Security](../security.md)

## Source update reviewed 2026-10-28

Reviewed commit: [`7a2a7a57d46095bf6cc8195680a13f76f784681b`](https://github.com/vercel-labs/just-bash/commit/7a2a7a57d46095bf6cc8195680a13f76f784681b). Scope: Full rg command facade and Grep-tool boundary tests; threat-model lines 1-110 read. Search/parser implementations, filesystem/network confinement and comparison fixture corpus were not audited.

The [rg boundary tests](https://github.com/vercel-labs/just-bash/blob/7a2a7a57d46095bf6cc8195680a13f76f784681b/packages/just-bash/src/commands/rg/rg.grep-tool.test.ts) distinguish no matches from invalid options, malformed patterns and read failures, preserve successful matches when another path fails, and pin the special quiet-mode success-with-error behavior. That distinction matters when search output becomes model evidence: an exit-zero quiet result does not establish complete coverage. The [command facade](https://github.com/vercel-labs/just-bash/blob/7a2a7a57d46095bf6cc8195680a13f76f784681b/packages/just-bash/src/commands/rg/rg.ts) delegates parser/search logic, so the tests do not substitute for inspecting those implementations.

The sampled [threat model](https://github.com/vercel-labs/just-bash/blob/7a2a7a57d46095bf6cc8195680a13f76f784681b/THREAT_MODEL.md#L1) explicitly trusts host hooks, dependencies and runtime and excludes concurrent hostile host filesystem mutation. It also documents an unbounded overlapping-root mutation queue that is not integrated with cancellation. Adapt explicit trust assumptions and search-error provenance; do not equate an in-process interpreter with OS isolation or complete Bash/ripgrep compatibility. No script, search command, network or tests from this source were executed.

<!-- teamagent-analysis:start -->
Analysis metadata: source [just-bash](https://github.com/vercel-labs/just-bash); analyzed commit `7a2a7a57d46095bf6cc8195680a13f76f784681b`; commit date 2026-10-22T08:52:03+09:00; review date 2026-10-28T09:45:33.667Z; depth source-reviewed. [Maintenance record](../analyses/repos/ai-agents-sandbox--just-bash.md).
<!-- teamagent-analysis:end -->
