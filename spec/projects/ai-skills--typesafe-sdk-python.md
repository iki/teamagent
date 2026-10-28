# typesafe-sdk-python

Source: [typesafe-sdk-python](https://github.com/typesafe-ai/typesafe-sdk-python) · Category: [ai-skills](../categories/ai-skills.md)

Review depth: **inventory / README screening only**. This is an individual coverage record, not a source-code correctness audit or adoption recommendation.

Snapshot: `f078f1e208a0d885154dc758344ae4fce77ac168`; commit timestamp `2026-09-26T21:19:40Z`; 67 tracked paths.

## Scope and evidence

Upstream description excerpt (a project claim, automatically extracted from [README](https://github.com/typesafe-ai/typesafe-sdk-python/blob/f078f1e208a0d885154dc758344ae4fce77ac168/README.md)):

> Add the `http2` extra (`typesafe-sdk[http2]`) to enable HTTP/2 support. Set `TYPESAFE_API_KEY` in your environment, then instantiate and use the client:

Build/package evidence: [pyproject.toml](https://github.com/typesafe-ai/typesafe-sdk-python/blob/f078f1e208a0d885154dc758344ae4fce77ac168/pyproject.toml)

License evidence: [LICENSE](https://github.com/typesafe-ai/typesafe-sdk-python/blob/f078f1e208a0d885154dc758344ae4fce77ac168/LICENSE) Classification hint: MIT. A root license does not establish rights for every bundled asset, model, or dependency.

## Harness assessment

This entry was catalogued under **ai-skills**. Its category places it in the candidate set for skills; those associations are navigational and have not been individually validated as implemented capabilities. See [skills](../skills.md) for the source-reviewed alternatives and proposed integration boundaries.

**Disposition:** retain as a comparison candidate. Before adopting it, inspect the implementation entry point and its tests, verify the required protocol and deployment platform, and reproduce a task from the harness evaluation suite. Popularity, a README feature list, and the presence of a package manifest are insufficient evidence of quality or compatibility.

**Unresolved:** runtime behavior, security boundaries, performance, API/subscription eligibility, dependency health, maintenance status, and fit to the proposed harness were not independently established for this entry. No repository code was executed as part of this screening.

## Source update reviewed 2026-10-28

Reviewed commit: [`f36e68549ceca3191e5791e5f99ea1baa1a258b5`](https://github.com/typesafe-ai/typesafe-sdk-python/commit/f36e68549ceca3191e5791e5f99ea1baa1a258b5). Scope: Full JSON, configuration, attached-asset, endpoint and multipart helpers read. Transport, asset resolvers, response schema enforcement and sync/async client tests were not audited.

The [asset attachment helper](https://github.com/typesafe-ai/typesafe-sdk-python/blob/f36e68549ceca3191e5791e5f99ea1baa1a258b5/src/typesafe_sdk/_core/attached.py) reference-counts overlapping scopes under a lock and removes entries in finally. Attachments belong to the shared client, not an individual async task, so task-local confidentiality requires separate client ownership or explicit per-call assets. The [endpoint builder](https://github.com/typesafe-ai/typesafe-sdk-python/blob/f36e68549ceca3191e5791e5f99ea1baa1a258b5/src/typesafe_sdk/_core/endpoints.py) resolves only referenced/passed assets and skips resolution when extra_body supplies assets, but extra_body can also replace core fields. These override semantics need validation at the transport boundary.

The [configuration](https://github.com/typesafe-ai/typesafe-sdk-python/blob/f36e68549ceca3191e5791e5f99ea1baa1a258b5/src/typesafe_sdk/_core/config.py) hides credentials from repr and validates scalar timeouts, while leaving base URL authorization and structured Timeout components to other layers. [JSON decoding](https://github.com/typesafe-ai/typesafe-sdk-python/blob/f36e68549ceca3191e5791e5f99ea1baa1a258b5/src/typesafe_sdk/_core/json.py) deliberately falls back to replacement-decoded text, and nonfinite values serialize as strings; neither is typed response validation. [Multipart encoding](https://github.com/typesafe-ai/typesafe-sdk-python/blob/f36e68549ceca3191e5791e5f99ea1baa1a258b5/src/typesafe_sdk/_core/multipart.py) assembles all bytes in memory and relies on callers for safe header fields. Adapt scoped asset lifetime only with task isolation, bounded bytes and strict input/output schemas. No client, assets, network or tests were executed.

<!-- teamagent-analysis:start -->
Analysis metadata: source [typesafe-sdk-python](https://github.com/typesafe-ai/typesafe-sdk-python); analyzed commit `f36e68549ceca3191e5791e5f99ea1baa1a258b5`; commit date 2026-10-14T21:20:45Z; review date 2026-10-28T09:45:33.667Z; depth screened. [Maintenance record](../analyses/repos/ai-skills--typesafe-sdk-python.md).
<!-- teamagent-analysis:end -->
