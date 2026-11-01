# Vercel Skills CLI

Source: [vercel-labs/skills](https://github.com/vercel-labs/skills) · Reviewed revision: `18f96ea131dab3b0fcc9b27cf7c6f6cbb6174680` · Review date: 2026-10-04.

Depth: **source-reviewed** (static source/content inspection; repository-wide audit not claimed). Related directions: [skills](../skills.md) · [agents](../agents.md) · [evolution](../evolution.md).

## Evidence inspected

- [`src/agents.ts` lines 155–185](https://github.com/vercel-labs/skills/blob/18f96ea131dab3b0fcc9b27cf7c6f6cbb6174680/src/agents.ts#L155-L185)
- [`src/skill-lock.ts` lines 1–59](https://github.com/vercel-labs/skills/blob/18f96ea131dab3b0fcc9b27cf7c6f6cbb6174680/src/skill-lock.ts#L1-L59)

## Observed architecture and behavior

The agent registry supplies per-agent project/global skill directories and installation detectors. The inspected Claude Code and Cline detectors test whether configuration directories exist. This is practical discovery evidence, but it does not establish executable availability, authentication, model access, or a successful structured invocation. The lock entry records provider, original source URL, optional ref and subpath, whole-folder hash, timestamps, and well-known discovery fields. Tracking the entire folder is materially better than hashing only SKILL.md because referenced scripts can change behavior.

## Implications and tradeoffs for Teamagent

Use this registry as an adapter seed and the lock format as an interoperability input. Teamagent still needs separate detected, executable, authenticated, and capability-tested states. Preserve the user's installation rather than replacing it. Import a pinned snapshot into a content-addressed store, then create a project-scoped activation view for selected skills. Treat source discovery and update detection as package-management functions; neither establishes quality or grants permission. A same-name skill from another publisher needs an independent identity. The local source's directory heuristics also mean stale configuration can produce false-positive installation detection.

## Adoption decision

Adopt through a thin optional installer adapter, with explicit version pinning and an internal provenance record. Prefer its existing ecosystem reach over rebuilding every directory convention. Add compatibility probes and rollback around activation. Do not automatically install every search result or activate every installed skill. Evaluate source changes, dependencies, scripts, and trigger behavior before promoting an update.

## Verification boundary

No project code, models, installers, or benchmarks were executed during this review. Tests and documentation show intended contracts; they do not establish measured performance, production readiness, or a complete security assessment. Recommendations above are design inferences from the cited snapshot. Verify current APIs, licensing, and deployment requirements before integration.

## Review update — 2026-10-24

Updated focused revision: `a80e4c9d12d607631249d4d7d059f835d4b2f13a` from [vercel-labs/skills](https://github.com/vercel-labs/skills). The original October 4 evidence remains above and in the immutable maintenance snapshot. This update inspects update identity, content digests and persisted installation state; it does not re-audit every agent adapter.

The current updater groups Git-backed installations by **source and ref**, not source alone. This prevents a skill pinned to one branch/tag from being treated as deleted when another installation from the same repository is checked against a different ref. Both global and project update paths apply that grouping ([global implementation](https://github.com/vercel-labs/skills/blob/a80e4c9d12d607631249d4d7d059f835d4b2f13a/src/update.ts#L553-L566), [project implementation](https://github.com/vercel-labs/skills/blob/a80e4c9d12d607631249d4d7d059f835d4b2f13a/src/update.ts#L844-L856)). An inspected regression fixture creates two skills on separate refs and asserts that update prompts and removals are not invoked ([test](https://github.com/vercel-labs/skills/blob/a80e4c9d12d607631249d4d7d059f835d4b2f13a/tests/update.test.ts#L793-L839)); the fixture was read, not executed here.

Well-known discovery now has a separate update path. Version 0.2 entries compare advertised digests; legacy entries fetch tracked skill content and compare computed digests. Fetch failure remains an error instead of proof of freshness ([update check](https://github.com/vercel-labs/skills/blob/a80e4c9d12d607631249d4d7d059f835d4b2f13a/src/update.ts#L350-L404)). The fallback digest hashes sorted relative paths and file content with NUL separators, while supplied entry digests are retained ([digest function](https://github.com/vercel-labs/skills/blob/a80e4c9d12d607631249d4d7d059f835d4b2f13a/src/providers/wellknown.ts#L808-L819)). The global lock also records source base URL and well-known digest, and respects an XDG state directory ([lock contract](https://github.com/vercel-labs/skills/blob/a80e4c9d12d607631249d4d7d059f835d4b2f13a/src/skill-lock.ts#L10-L74)). A digest is change/integrity evidence, not evidence that content is safe or useful.

**Updated Teamagent decision:** key installed skill variants by canonical source, ref, skill path, content digest and target harness/model compatibility. Keep source refresh, installed version and reviewed promotion separate; failed discovery must not delete a skill or mark it current. Add the two-ref deletion regression and partial-fetch failure cases to future skill-manager acceptance tests. Use complete skill-tree hashes, including references and scripts, rather than only `SKILL.md`. These are design requirements for the planned skill manager, not claims of implemented routing or measured improvement. Related synthesis: [skills](../skills.md), [evolution](../evolution.md), [incremental analysis](../analyses/README.md).

## Source update reviewed 2026-10-28

Reviewed commit: [`533c7df02f9b4d913fb8eba553aa99d86103d1d4`](https://github.com/vercel-labs/skills/commit/533c7df02f9b4d913fb8eba553aa99d86103d1d4). Scope: Full lock-install coordinator, CI detector, install tests and telemetry/audit client read. Installer containment, lock verification, update/sync internals and provider fetchers were not audited.

The [lock installer](https://github.com/vercel-labs/skills/blob/533c7df02f9b4d913fb8eba553aa99d86103d1d4/src/install.ts) defaults frozen mode in CI, groups source fetches and restores to the canonical project skills directory. The [tests](https://github.com/vercel-labs/skills/blob/533c7df02f9b4d913fb8eba553aa99d86103d1d4/tests/install.test.ts) preserve self-hosted Git source URLs instead of substituting GitHub. However, a missing generic source URL only logs and continues, and the caught node_modules sync failure only logs; those branches do not themselves set a failing exit code. Teamagent must report incomplete restoration explicitly and validate frozen hashes in the underlying installer.

The [telemetry client](https://github.com/vercel-labs/skills/blob/533c7df02f9b4d913fb8eba553aa99d86103d1d4/src/telemetry.ts) sends search queries, source/install URLs, skill names and optional metadata in GET query parameters unless an opt-out environment variable is present. Audit responses are asserted to a TypeScript shape without runtime validation and deliberately fail open; they are advisory, not an installation authorization gate. Audit timeout ends after response headers, while telemetry requests themselves are not cancelled by the bounded exit wait. Adapt source identity and explicit partial results; reject these privacy/validation defaults for private Teamagent inputs. No installation, telemetry, audit lookup or tests were executed.

## 2026-10-28 follow-up source review

Reviewed the frozen update from `533c7df02f9b4d913fb8eba553aa99d86103d1d4` to `699d35b21bd3c97dbc0edeae062b2698898bb2e5`. This is a bounded static source review, not an upstream runtime or performance result.

In [src/update.ts](https://github.com/vercel-labs/skills/blob/699d35b21bd3c97dbc0edeae062b2698898bb2e5/src/update.ts#L1091-L1157), The `check` mode installs a reporting callback, avoids prompts and counts outdated skills separately from successful updates. The inspected global path returns before installation (`src/update.ts:805-808`), the project path continues before `installToTargets` (`1032-1035`), and the well-known-source path does not queue changed skills for installation (`532-537`). This is a passive installation check, not an offline operation: discovery/fetch work remains and the function still emits the shared `update` telemetry event.

[Inspected fixtures](https://github.com/vercel-labs/skills/blob/699d35b21bd3c97dbc0edeae062b2698898bb2e5/tests/check.test.ts#L48-L59): The deterministic local-Git fixture changes an upstream skill from v1 to v2, checks that installed content remains v1, and expects exit 1 plus an available-update message; a current install exits 0. Fixtures were inspected, not run. Their content-preservation assertion is stronger than only checking command naming or output.

**Teamagent implication:** Separate inspect, plan and apply in Teamagent skill evolution. Check commands must preserve installed files and locks across Git, hosted and deletion paths, disclose any network/telemetry work, and distinguish 'updates available' from failed verification in structured status.

## Source update reviewed 2026-11-01

Reviewed commit [`92a9a34ac3bf88e695e468b90c7bf32f163d32c8`](https://github.com/vercel-labs/skills/commit/92a9a34ac3bf88e695e468b90c7bf32f163d32c8), compared with `699d35b21bd3c97dbc0edeae062b2698898bb2e5`.

The [local lock entry](https://github.com/vercel-labs/skills/blob/92a9a34ac3bf88e695e468b90c7bf32f163d32c8/src/local-lock.ts) gains an explicit copy mode, and [update placement](https://github.com/vercel-labs/skills/blob/92a9a34ac3bf88e695e468b90c7bf32f163d32c8/src/update.ts) uses the stored choice for both project and global updates while retaining recorded subagent targets. The complete [fixture](https://github.com/vercel-labs/skills/blob/92a9a34ac3bf88e695e468b90c7bf32f163d32c8/tests/update-install-mode.test.ts) installs from a synthetic Git source, updates it, checks that a copy remains a physical copy and checks omission when default mode is used.

Skill-library maintenance should preserve the user's installation topology alongside source identity and content digest. Discovery on a different machine must not silently turn an explicitly copied skill into a symlink. This is source and fixture evidence; initial writer paths, all other changes in the 16-path comparison and runtime behavior across installed agents were not fully audited. No skills were installed or executed and no upstream tests were run.

<!-- teamagent-analysis:start -->
Analysis metadata: source [search.vercel](https://github.com/vercel-labs/skills); analyzed commit `92a9a34ac3bf88e695e468b90c7bf32f163d32c8`; commit date 2026-10-29T09:49:36+09:00; review date 2026-11-01T11:35:43.470Z; depth source-reviewed. [Maintenance record](../analyses/repos/ai-agents-skills--search.vercel.md).
<!-- teamagent-analysis:end -->
