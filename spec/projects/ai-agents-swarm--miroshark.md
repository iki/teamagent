# miroshark

Source: [miroshark](https://github.com/aaronjmars/MiroShark) · Category: [ai-agents-swarm](../categories/ai-agents-swarm.md)

Review depth: **inventory / README screening only**. This is an individual coverage record, not a source-code correctness audit or adoption recommendation.

Snapshot: `6d603395c40c0e7551a752cc0a46bd69017f2699`; commit timestamp `2026-10-01T09:44:31-04:00`; 543 tracked paths.

## Scope and evidence

Upstream description excerpt (a project claim, automatically extracted from README not identified at repository root):

> No concise purpose statement extracted; inspect the upstream README.

Build/package evidence: [backend/pyproject.toml](https://github.com/aaronjmars/MiroShark/blob/6d603395c40c0e7551a752cc0a46bd69017f2699/backend/pyproject.toml); [backend/requirements.txt](https://github.com/aaronjmars/MiroShark/blob/6d603395c40c0e7551a752cc0a46bd69017f2699/backend/requirements.txt); [frontend/package.json](https://github.com/aaronjmars/MiroShark/blob/6d603395c40c0e7551a752cc0a46bd69017f2699/frontend/package.json); [package.json](https://github.com/aaronjmars/MiroShark/blob/6d603395c40c0e7551a752cc0a46bd69017f2699/package.json)

License evidence: [LICENSE](https://github.com/aaronjmars/MiroShark/blob/6d603395c40c0e7551a752cc0a46bd69017f2699/LICENSE) Classification hint: AGPL; inspect version. A root license does not establish rights for every bundled asset, model, or dependency.

## Harness assessment

This entry was catalogued under **ai-agents-swarm**. Its category places it in the candidate set for agents, decisions; those associations are navigational and have not been individually validated as implemented capabilities. See [agents](../agents.md) · [decisions](../decisions.md) for the source-reviewed alternatives and proposed integration boundaries.

**Disposition:** retain as a comparison candidate. Before adopting it, inspect the implementation entry point and its tests, verify the required protocol and deployment platform, and reproduce a task from the harness evaluation suite. Popularity, a README feature list, and the presence of a package manifest are insufficient evidence of quality or compatibility.

**Unresolved:** runtime behavior, security boundaries, performance, API/subscription eligibility, dependency health, maintenance status, and fit to the proposed harness were not independently established for this entry. No repository code was executed as part of this screening.

## Source update reviewed 2026-10-28

Reviewed commit: [`a72ef7bc5fd6265b8ff27234d491a703e216fabc`](https://github.com/aaronjmars/miroshark/commit/a72ef7bc5fd6265b8ff27234d491a703e216fabc). Scope: Full Claude CLI adapter and interface-parity/broadcast-shape tests read. Main LLM client, repair implementation, trace helper and simulation orchestration were not audited.

The [parity tests](https://github.com/aaronjmars/miroshark/blob/a72ef7bc5fd6265b8ff27234d491a703e216fabc/backend/tests/test_unit_llm_client_parity.py) compare adapter signatures without starting the CLI and verify JSON repair is opt-in. This protects a real integration contract, but matching signatures do not mean matching semantics: the [CLI adapter](https://github.com/aaronjmars/miroshark/blob/a72ef7bc5fd6265b8ff27234d491a703e216fabc/backend/app/utils/claude_code_client.py) ignores temperature and maps any truthy max_tokens to one turn rather than a token cap. It flattens role messages into text, passes the prompt in command arguments, fully captures output and may return a repaired partial object. Preserve provenance and validation of repaired output rather than silently treating it as complete evidence.

The adapter emits a response preview even when full prompt logging is disabled and includes raw errors, so private content needs a stricter telemetry boundary. [Broadcast tests](https://github.com/aaronjmars/miroshark/blob/a72ef7bc5fd6265b8ff27234d491a703e216fabc/backend/tests/test_unit_broadcast_trace.py) pin field shape, preserve agent ID zero and avoid mutating the caller dictionary, but do not prove an external service retains those fields. Adapt credential-free parity fixtures and explicit semantic differences. No CLI, model, broadcast or tests were executed.

## Source update reviewed 2026-11-01

Reviewed commit [`4f9289ba129ea8dd3e39339daf3ffada2a14fff7`](https://github.com/aaronjmars/miroshark/commit/4f9289ba129ea8dd3e39339daf3ffada2a14fff7), compared with `a72ef7bc5fd6265b8ff27234d491a703e216fabc`.

The complete two-file delta adds 15-minute deadlines to unit, frontend, agent smoke and lint jobs in [tests.yml](https://github.com/aaronjmars/miroshark/blob/4f9289ba129ea8dd3e39339daf3ffada2a14fff7/.github/workflows/tests.yml), plus workflow/ref concurrency with cancellation restricted to pull-request events. The [image job](https://github.com/aaronjmars/miroshark/blob/4f9289ba129ea8dd3e39339daf3ffada2a14fff7/.github/workflows/docker-image.yml) gets a 30-minute deadline. This is verification scheduling, not a changed swarm algorithm. Teamagent should retain bounded jobs, distinguish supersession from success, and verify descendant cleanup separately from a CI cancellation request. No workflow, build or upstream test was executed.

## External-update review - 2026-11-01

Reviewed `570efde85638223df1271f29ec6bf60e779b2718` against `4f9289ba129ea8dd3e39339daf3ffada2a14fff7` after reconciling the local category move. The complete change inventory contains only [backend/uv.lock](https://github.com/aaronjmars/miroshark/blob/570efde85638223df1271f29ec6bf60e779b2718/backend/uv.lock) and [frontend/package-lock.json](https://github.com/aaronjmars/miroshark/blob/570efde85638223df1271f29ec6bf60e779b2718/frontend/package-lock.json): Tornado moves from 6.5.9 to 6.6 with revised distribution metadata, and follow-redirects from 1.16.1 to 1.16.2 with a new integrity entry.

**Architecture consequence:** This dependency-only update supplies no new agent, decision or adapter behavior to adopt; the earlier CLI semantic and telemetry findings remain applicable. Dependency identity changes must invalidate relevant verification caches, and platform-specific artifacts require their own compatibility checks. Upstream dependency maintenance does not authorize changing Teamagent's shared pins or central patch provenance.

**Scope and limits:** Inspected the two-file delta and changed dependency entries. Recorded artifact hashes and wheel listings were not independently downloaded, authenticated or installed; no vulnerability-fix claim, upstream test result or runtime compatibility result is established by the lockfiles alone. Related directions: [agents](../agents.md), [decisions](../decisions.md), [evolution](../evolution.md).

<!-- teamagent-analysis:start -->
Analysis metadata: source [miroshark](https://github.com/aaronjmars/miroshark); analyzed commit `570efde85638223df1271f29ec6bf60e779b2718`; commit date 2026-11-01T11:30:52-05:00; review date 2026-11-01T23:12:06.798Z; depth screened. [Maintenance record](../analyses/repos/ai-agents-swarm--miroshark.md).
<!-- teamagent-analysis:end -->
