# Reuse decisions for the local harness

[System architecture](../architecture.md) · [Module boundaries](modules.md)

Local source and license files were checked on 2026-10-04 at the exact snapshots
already reviewed in the project reports. This records implementation choices,
not a claim that the upstream projects' complete dependency trees or production
behavior have been audited.

| Reference                                    | Verified source snapshot and license                                                                                                                                     | Reuse boundary                                                                                                                                                                    |
| -------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| [Pi](../projects/ai-agents--pi.md)           | `83692682f095528f8b71652ddacff7075e36e893`; root MIT license, copyright Mario Zechner; local `@earendil-works/pi-agent-core` package is version `1.0.1` and declares MIT | Use the packaged agent loop behind our own worker adapter, retaining package license notices. Keep task identity, durable events, authorization and budgets in our control plane. |
| [Paseo](../projects/ai-agents--paseo.md)     | `749fe3e5ae52b6e1e4eaeadce3182e901caa96d9`; Apache-2.0 except incorporated components retaining their original terms                                                     | Independently implement the focused provider-registry and capability-negotiation pattern. Do not fork its application or copy its dependency graph.                               |
| [Multica](../projects/ai-agents--multica.md) | `b2561aad61055dd9937fc08f6497846b1458d018`; custom Multica License combining Apache-2.0 with additional hosting, commercial embedding and attribution conditions         | Study atomic owner-token/epoch checks as a general concurrency pattern. No source or UI copying and no Multica runtime dependency.                                                |

Pi exposes both an event-stream wrapper and `runAgentLoop` with an awaited event
sink and `AbortSignal`. An adapter using the awaited sink can enforce bounded
processing and durable event writes without relying on an unchecked consumer
queue. Agent messages remain provider data until the model conversion boundary;
our adapter decodes incoming values and emits only the public task event contract.
Untrusted model output never becomes a permission grant. Verify the installed
package API against the source snapshot before selecting either entry point.

Paseo's registry explicitly distinguishes support for exact tool preapproval and
defaults unsupported providers to false. Our adapter descriptions likewise expose
individual guarantees instead of claiming uniform sandboxing from a shared
interface. Passive discovery must not launch an interactive session or perform
inference, and a missing provider is reported as unavailable.

Multica's owner-token check prevents stale renewal/release of a lease, but does
not stop an expired worker from creating an external effect. Our task attempts
therefore need epoch checks on accepted writes and honest handling of uncertain
provider outcomes. The initial SQLite implementation does not require Redis.

The earlier Multica report's Apache-2.0 indicator was incomplete. Its source
license has additional terms, including for hosted services and branding. That
report is corrected; the safe reuse decision here is an independently implemented
concurrency mechanism, with no copied implementation.

## Source memory and integrations

The import adapter uses the already analyzed [MarkItDown](../projects/ai-query--markitdown.md)
package `0.1.8` (MIT) in an isolated Python environment with exact transitive pins.
It uses explicit converters and pypdf `6.11.0` for PDF image extraction. Network
retrieval, source identity, sync, resource limits, version storage and access
scope remain host responsibilities. Docling remains a potential richer converter;
it is not required for this implementation.

Passive agent discovery reuses registry data from
[Vercel Skills](https://github.com/vercel-labs/skills/blob/18f96ea131dab3b0fcc9b27cf7c6f6cbb6174680/src/agents.ts),
MIT copyright Vercel, at `18f96ea131dab3b0fcc9b27cf7c6f6cbb6174680`. The package
did not expose a suitable library API, so `app/integrations/registry.ts` contains
the reviewed 79-entry snapshot and its license notice. Codex's global skill
location is updated from current official documentation. No upstream CLI,
installation scripts or agent executables run during discovery.

Protocol implementation uses the official MCP SDK `2.4.0`, with Zod `4.6.7`
restricted to its adapter. Agent configuration formats were checked against
[Codex MCP](https://developers.openai.com/codex/mcp),
[Claude Code MCP](https://code.claude.com/docs/en/mcp), and
[Cursor MCP](https://cursor.com/docs/context/mcp). The installer preserves
unrelated settings rather than replacing agent configurations.
