# cloudflare-computer

Source: [cloudflare-computer](https://github.com/cloudflare/computer) · Category: [ai-agents-sandbox](../categories/ai-agents-sandbox.md)

Review depth: **inventory / README screening only**. This is an individual coverage record, not a source-code correctness audit or adoption recommendation.

Snapshot: `2f76387771c9e4a64dc08a7bbd82cbbcf9fadec1`; commit timestamp `2026-10-02T13:23:47+01:00`; 766 tracked paths.

## Scope and evidence

Upstream description excerpt (a project claim, automatically extracted from [README](https://github.com/cloudflare/computer/blob/2f76387771c9e4a64dc08a7bbd82cbbcf9fadec1/README.md)):

> Durable Object. The Durable Object holds the authoritative state in - **Container** projects the SQLite state into a sandbox container as

Build/package evidence: [examples/artifacts/package.json](https://github.com/cloudflare/computer/blob/2f76387771c9e4a64dc08a7bbd82cbbcf9fadec1/examples/artifacts/package.json); [examples/assets/package.json](https://github.com/cloudflare/computer/blob/2f76387771c9e4a64dc08a7bbd82cbbcf9fadec1/examples/assets/package.json); [examples/celld/package.json](https://github.com/cloudflare/computer/blob/2f76387771c9e4a64dc08a7bbd82cbbcf9fadec1/examples/celld/package.json); [examples/container-legacy/package.json](https://github.com/cloudflare/computer/blob/2f76387771c9e4a64dc08a7bbd82cbbcf9fadec1/examples/container-legacy/package.json); [examples/container/package.json](https://github.com/cloudflare/computer/blob/2f76387771c9e4a64dc08a7bbd82cbbcf9fadec1/examples/container/package.json)

License evidence: [LICENSE](https://github.com/cloudflare/computer/blob/2f76387771c9e4a64dc08a7bbd82cbbcf9fadec1/LICENSE) Classification hint: MIT. A root license does not establish rights for every bundled asset, model, or dependency.

## Harness assessment

This entry was catalogued under **ai-agents-sandbox**. Its category places it in the candidate set for agents, channels; those associations are navigational and have not been individually validated as implemented capabilities. See [agents](../agents.md) · [channels](../channels.md) for the source-reviewed alternatives and proposed integration boundaries.

**Disposition:** retain as a comparison candidate. Before adopting it, inspect the implementation entry point and its tests, verify the required protocol and deployment platform, and reproduce a task from the harness evaluation suite. Popularity, a README feature list, and the presence of a package manifest are insufficient evidence of quality or compatibility.

**Unresolved:** runtime behavior, security boundaries, performance, API/subscription eligibility, dependency health, maintenance status, and fit to the proposed harness were not independently established for this entry. No repository code was executed as part of this screening.

## Source update reviewed 2026-10-28

Reviewed commit: [`d84f912b8c423138d8fea64ca1974eb296ddfc8d`](https://github.com/cloudflare/computer/commit/d84f912b8c423138d8fea64ca1974eb296ddfc8d). Scope: Full runtime wire codec/tests, exec public export/tests and non-workerd proxy stub read. Exec implementation, bridge, RPC authorization and real workerd integration were not audited.

The [wire codec](https://github.com/cloudflare/computer/blob/d84f912b8c423138d8fea64ca1974eb296ddfc8d/packages/computer/src/runtime/wire.ts) transports sequence-tagged text/binary output and structured exit results in newline JSON. It casts parsed data directly to a frame, buffers unfinished lines without a size limit and accepts a final unterminated frame; no ID/order/type/base64 bounds are validated here. The [tests](https://github.com/cloudflare/computer/blob/d84f912b8c423138d8fea64ca1974eb296ddfc8d/packages/computer/src/runtime/wire.test.ts) cover only two exit-event round trips. Teamagent must decode unknown values through bounded schemas and distinguish incomplete transport from successful process completion.

The [exec fixtures](https://github.com/cloudflare/computer/blob/d84f912b8c423138d8fea64ca1974eb296ddfc8d/packages/computer/src/tools/core.test.ts) check backend-dependent object parsing without mutating the input and demonstrate an agent-library-independent interface. They do not establish execution isolation. The [proxy stub](https://github.com/cloudflare/computer/blob/d84f912b8c423138d8fea64ca1974eb296ddfc8d/packages/computer/src/proxy-stub.ts) deliberately throws outside workerd, correctly separating import compatibility from runtime availability. Adapt that platform distinction and richer adversarial wire fixtures. No command, Worker, container, RPC or tests were executed.

<!-- teamagent-analysis:start -->
Analysis metadata: source [cloudflare-computer](https://github.com/cloudflare/computer); analyzed commit `d84f912b8c423138d8fea64ca1974eb296ddfc8d`; commit date 2026-10-27T16:30:53Z; review date 2026-10-28T09:45:33.667Z; depth screened. [Maintenance record](../analyses/repos/ai-agents-sandbox--cloudflare-computer.md).
<!-- teamagent-analysis:end -->
