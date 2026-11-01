# mission-control

Source: [mission-control](https://github.com/builderz-labs/mission-control) · Category: [ai-agents](../categories/ai-agents.md)

Review depth: **inventory / README screening only**. This is an individual coverage record, not a source-code correctness audit or adoption recommendation.

Snapshot: `e28edf8b28c85a32f1fd55ac577d325df6b16e4a`; commit timestamp `2026-09-22T20:01:50+07:00`; 807 tracked paths.

## Scope and evidence

Upstream description excerpt (a project claim, automatically extracted from [README](https://github.com/builderz-labs/mission-control/blob/e28edf8b28c85a32f1fd55ac577d325df6b16e4a/README.md)):

> Dispatch tasks, inspect runs, review failures, track spend, and coordinate agent runtimes An open-source project by Builderz Labs, created and maintained by nyk.

Build/package evidence: [package.json](https://github.com/builderz-labs/mission-control/blob/e28edf8b28c85a32f1fd55ac577d325df6b16e4a/package.json)

License evidence: [LICENSE](https://github.com/builderz-labs/mission-control/blob/e28edf8b28c85a32f1fd55ac577d325df6b16e4a/LICENSE) Classification hint: MIT. A root license does not establish rights for every bundled asset, model, or dependency.

## Harness assessment

This entry was catalogued under **ai-agents**. Its category places it in the candidate set for agents, models, channels; those associations are navigational and have not been individually validated as implemented capabilities. See [agents](../agents.md) · [models](../models.md) · [channels](../channels.md) for the source-reviewed alternatives and proposed integration boundaries.

**Disposition:** retain as a comparison candidate. Before adopting it, inspect the implementation entry point and its tests, verify the required protocol and deployment platform, and reproduce a task from the harness evaluation suite. Popularity, a README feature list, and the presence of a package manifest are insufficient evidence of quality or compatibility.

**Unresolved:** runtime behavior, security boundaries, performance, API/subscription eligibility, dependency health, maintenance status, and fit to the proposed harness were not independently established for this entry. No repository code was executed as part of this screening.

## 2026-11-01 scoped source refresh

Reviewed `e28edf8b28c85a32f1fd55ac577d325df6b16e4a` → `c1a846fe020567bb3ceb3b65db9f00db875618cd`: complete new dotenv writer, its two fixture files, both environment route deltas and their new request fixtures, plus the Hermes value-schema change. The 21-path inventory also contains token, UI, dependency and workflow changes outside this focused review.

The [writer](https://github.com/builderz-labs/mission-control/blob/c1a846fe020567bb3ceb3b65db9f00db875618cd/src/lib/dotenv-writer.ts) rejects CR/LF/NUL values, quotes values according to the intended Hermes reader, replaces exact assignments without replacement-string expansion and drops later duplicate keys. Its file helper creates an exclusive randomized sibling, restricts its mode, fsyncs it and renames it over the destination. [Fixtures](https://github.com/builderz-labs/mission-control/blob/c1a846fe020567bb3ceb3b65db9f00db875618cd/src/lib/__tests__/dotenv-writer-atomic.test.ts) inspect replacement, stricter POSIX modes and temporary-file cleanup after rename failure; mode assertions are explicitly skipped on Windows.

The [integration route](https://github.com/builderz-labs/mission-control/blob/c1a846fe020567bb3ceb3b65db9f00db875618cd/src/app/api/integrations/route.ts) validates submitted values before rewriting and distinguishes an unsafe existing value as a conflict. [Route fixtures](https://github.com/builderz-labs/mission-control/blob/c1a846fe020567bb3ceb3b65db9f00db875618cd/src/app/api/integrations/__tests__/put-env-value.test.ts) assert rejected injections leave the file unchanged. Their authorization/workspace services are mocked, so these assertions do not verify production access control.

For Teamagent, combine literal-value validation and atomic publication with owned paths, concurrency control and actual platform credential protection. The helper does not lock the read-modify-write transaction or fsync the directory, and the [Hermes read branch](https://github.com/builderz-labs/mission-control/blob/c1a846fe020567bb3ceb3b65db9f00db875618cd/src/app/api/hermes/route.ts#L130-L143) still treats every read exception as a new file. Preserve missing versus unreadable outcomes; POSIX mode bits alone do not establish Windows ACL privacy. No upstream tests or filesystem/API operation was executed.

<!-- teamagent-analysis:start -->
Analysis metadata: source [mission-control](https://github.com/builderz-labs/mission-control); analyzed commit `c1a846fe020567bb3ceb3b65db9f00db875618cd`; commit date 2026-10-28T17:22:07+01:00; review date 2026-11-01T11:33:30.893Z; depth screened. [Maintenance record](../analyses/repos/ai-agents--mission-control.md).
<!-- teamagent-analysis:end -->
