# xx-2604-mgp.memory-governance-protocol

Source: [xx-2604-mgp.memory-governance-protocol](https://github.com/HKUDS/MGP) · Category: [ai-agents-mem](../categories/ai-agents-mem.md)

Review depth: **inventory / README screening only**. This is an individual coverage record, not a source-code correctness audit or adoption recommendation.

Snapshot: `54ce6c00e3d0aa731ecbe17e74407cbbb5a96f10`; commit timestamp `2026-04-25T16:35:25+08:00`; 309 tracked paths.

## Scope and evidence

Upstream description excerpt (a project claim, automatically extracted from [README](https://github.com/HKUDS/MGP/blob/54ce6c00e3d0aa731ecbe17e74407cbbb5a96f10/README.md)):

> MGP standardizes how AI runtimes **write, recall, govern, and audit persistent memory** across heterogeneous backends. Think of it as a unified contract layer — your agent talks to one protocol, and any compliant memory backend just works. MCP** standardizes *tools and resources*. **MGP** standardizes *governed memory*. They are peer protocols — complementary, not competing.

Build/package evidence: [compliance/requirements.txt](https://github.com/HKUDS/MGP/blob/54ce6c00e3d0aa731ecbe17e74407cbbb5a96f10/compliance/requirements.txt); [docs/requirements.txt](https://github.com/HKUDS/MGP/blob/54ce6c00e3d0aa731ecbe17e74407cbbb5a96f10/docs/requirements.txt); [pyproject.toml](https://github.com/HKUDS/MGP/blob/54ce6c00e3d0aa731ecbe17e74407cbbb5a96f10/pyproject.toml); [reference/requirements.txt](https://github.com/HKUDS/MGP/blob/54ce6c00e3d0aa731ecbe17e74407cbbb5a96f10/reference/requirements.txt); [sdk/python/pyproject.toml](https://github.com/HKUDS/MGP/blob/54ce6c00e3d0aa731ecbe17e74407cbbb5a96f10/sdk/python/pyproject.toml)

License evidence: [LICENSE](https://github.com/HKUDS/MGP/blob/54ce6c00e3d0aa731ecbe17e74407cbbb5a96f10/LICENSE) Classification hint: MIT. A root license does not establish rights for every bundled asset, model, or dependency.

## Harness assessment

This entry was catalogued under **ai-agents-mem**. Its category places it in the candidate set for memory, evolution; those associations are navigational and have not been individually validated as implemented capabilities. See [memory](../memory.md) · [evolution](../evolution.md) for the source-reviewed alternatives and proposed integration boundaries.

**Disposition:** retain as a comparison candidate. Before adopting it, inspect the implementation entry point and its tests, verify the required protocol and deployment platform, and reproduce a task from the harness evaluation suite. Popularity, a README feature list, and the presence of a package manifest are insufficient evidence of quality or compatibility.

**Unresolved:** runtime behavior, security boundaries, performance, API/subscription eligibility, dependency health, maintenance status, and fit to the proposed harness were not independently established for this entry. No repository code was executed as part of this screening.
