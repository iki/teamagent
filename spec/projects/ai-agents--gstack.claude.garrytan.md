# gstack.claude.garrytan

Source: [gstack.claude.garrytan](https://github.com/garrytan/gstack) · Category: [ai-agents](../categories/ai-agents.md)

Original review depth: **inventory / README screening only**. The dated update review below has its own explicit scope. This is an individual coverage record, not a source-code correctness audit or adoption recommendation.

Snapshot: `ac20ef1e1380248fcaeea337d39f5fd2b04b7a3b`; commit timestamp `2026-10-03T07:54:09-07:00`; 2,710 tracked paths.

## Scope and evidence

Upstream description excerpt (a project claim, automatically extracted from [README](https://github.com/garrytan/gstack/blob/ac20ef1e1380248fcaeea337d39f5fd2b04b7a3b/README.md)):

> "I don't think I've typed like a line of code probably since December, basically, which is an extremely large change." — Andrej Karpathy, No Priors podcast, March 2026 When I heard Karpathy say this, I wanted to find out how. How does one person ship like a team of twenty? Peter Steinberger built OpenClaw — 247K GitHub stars — essentially solo with AI agents. The revolution is here. A single builder with the right tooling can move faster than a traditional team.

Build/package evidence: [lib/diagram-render/package.json](https://github.com/garrytan/gstack/blob/ac20ef1e1380248fcaeea337d39f5fd2b04b7a3b/lib/diagram-render/package.json); [package.json](https://github.com/garrytan/gstack/blob/ac20ef1e1380248fcaeea337d39f5fd2b04b7a3b/package.json); [test/fixtures/arm-benchmark/bugfix-decoys/package.json](https://github.com/garrytan/gstack/blob/ac20ef1e1380248fcaeea337d39f5fd2b04b7a3b/test/fixtures/arm-benchmark/bugfix-decoys/package.json); [test/fixtures/arm-benchmark/crud-endpoint/package.json](https://github.com/garrytan/gstack/blob/ac20ef1e1380248fcaeea337d39f5fd2b04b7a3b/test/fixtures/arm-benchmark/crud-endpoint/package.json); [test/fixtures/autoplan-existing-app/package.json](https://github.com/garrytan/gstack/blob/ac20ef1e1380248fcaeea337d39f5fd2b04b7a3b/test/fixtures/autoplan-existing-app/package.json)

License evidence: [LICENSE](https://github.com/garrytan/gstack/blob/ac20ef1e1380248fcaeea337d39f5fd2b04b7a3b/LICENSE) Classification hint: MIT. A root license does not establish rights for every bundled asset, model, or dependency.

## Harness assessment

This entry was catalogued under **ai-agents**. Its category places it in the candidate set for agents, models, channels; those associations are navigational and have not been individually validated as implemented capabilities. See [agents](../agents.md) · [models](../models.md) · [channels](../channels.md) for the source-reviewed alternatives and proposed integration boundaries.

**Disposition:** retain as a comparison candidate. Before adopting it, inspect the implementation entry point and its tests, verify the required protocol and deployment platform, and reproduce a task from the harness evaluation suite. Popularity, a README feature list, and the presence of a package manifest are insufficient evidence of quality or compatibility.

**Unresolved:** runtime behavior, security boundaries, performance, API/subscription eligibility, dependency health, maintenance status, and fit to the proposed harness were not independently established for this entry. No repository code was executed as part of this screening.

## 2026-10-28 scoped update review

Reviewed commit `703b0049ebbef6be23e687a2ae9b18d24c5798fc` (commit date `2026-10-27T17:39:03Z`). The original snapshot above remains historical evidence.

**Scope:** Complete design authentication resolution, paid-image persistence, session JSON and approved-image resolution modules; command orchestration, runtime pin installer, network effects and tests were not inspected.

The [image persistence path](https://github.com/garrytan/gstack/blob/703b0049ebbef6be23e687a2ae9b18d24c5798fc/design/src/persist.ts#L60-L188) claims a new filename with exclusive creation, retries only collisions up to 999 candidates, writes and syncs the chosen output, and records failed saves separately from successfully written recovery copies. Failure to write the recovery copy is reported with received byte count instead of claiming success. This is useful accounting after a paid external effect; it does not guarantee that paid data can never be lost. Recovery files are created owner-only but are not fsynced here, and the write loop has no zero-progress check. Base64 decoding alone also does not validate image format or bound decoded size.

[Approved-image resolution](https://github.com/garrytan/gstack/blob/703b0049ebbef6be23e687a2ae9b18d24c5798fc/design/src/approval.ts#L33-L56) keeps an explicit missing target as an error instead of silently substituting a legacy variant. However, empty/wrong-type explicit paths can fall back to the legacy field, resolved paths are not constrained to the record directory, and approval does not bind content bytes or a digest. The [session store](https://github.com/garrytan/gstack/blob/703b0049ebbef6be23e687a2ae9b18d24c5798fc/design/src/session.ts#L23-L79) uses ordinary JSON reads and writes without schema validation, atomic replacement or a revision conflict check. Teamagent should retain the explicit-target principle while binding approval to validated content and treating session state as a versioned boundary.

[Credential resolution](https://github.com/garrytan/gstack/blob/703b0049ebbef6be23e687a2ae9b18d24c5798fc/design/src/auth.ts#L71-L149) reports whether the key came from the dedicated config or environment and warns when its value matches a local dotenv file, without printing the key. That match is an advisory source hint, not verified account or billing identity. An unreadable/malformed config falls back to ambient environment credentials, and the configured base URL is concatenated without destination validation in this helper. Owner-only file creation and a trailing permission adjustment improve local storage hygiene, but transport trust and Windows permission behavior were not verified.

**Verification limit:** source inspection only; no upstream tests or provider calls were executed. This scoped review does not certify every file in the repository.

## 2026-10-28 follow-up source review

Reviewed commit `219f7488bbbfc33e5199ea4a5f3d31f188a7369d` (commit date `2026-10-28T09:59:40Z`), compared with `703b0049ebbef6be23e687a2ae9b18d24c5798fc`. Earlier findings remain historical evidence.

**Scope:** Release-stamp ownership detection and host skill metadata documentation. The complete changed-path inventory contains 244 paths; the assessment below is limited to the cited branches.

Restamping now compares both branch and base additions, excludes base-added text from candidate branch lines, and refuses a failed Git diff instead of treating it as no changes. Its report records excluded base lines. See [lib/restamp.ts](https://github.com/garrytan/gstack/blob/219f7488bbbfc33e5199ea4a5f3d31f188a7369d/lib/restamp.ts#L269-L305) and [lib/restamp.ts](https://github.com/garrytan/gstack/blob/219f7488bbbfc33e5199ea4a5f3d31f188a7369d/lib/restamp.ts#L523-L535). This is a useful preservation pattern, but text-set subtraction is conservative: an identical independently added line can also be excluded, so it is not exact semantic authorship proof.

The Codex host comment now documents a template-supplied default prompt with a fallback; the generator implementing that metadata was not audited. See [hosts/codex.ts](https://github.com/garrytan/gstack/blob/219f7488bbbfc33e5199ea4a5f3d31f188a7369d/hosts/codex.ts#L19-L31). For Teamagent, keep generated skill metadata separate from execution trust and preserve failed/missing source comparisons as explicit refusals. No update, restamp, installer or host agent was executed.

**Verification limit:** committed-source inspection only; no upstream code, tests or provider calls were executed. This review does not certify every changed file or establish a Teamagent integration.

## 2026-11-01 scoped source review

Reviewed commit `b15492a148e2744d24b0ca4da5ba290fb109c340` (commit date `2026-11-01T09:52:31Z`), compared with `219f7488bbbfc33e5199ea4a5f3d31f188a7369d`. Earlier observations remain historical evidence.

**Scope:** Expanded complete approval-record/fixture diff; whole-repository diff was oversized. Carry-forward decision authority, CLI stack-import implementation and publication enforcement not audited.

The [approval record](https://github.com/garrytan/gstack/blob/b15492a148e2744d24b0ca4da5ba290fb109c340/lib/approval-record.ts) identifies repository-scoped records, labels carried answers with their originating gate revision and distinguishes owner-seen content from later carried items. Rendered tables are explicitly display-only. [Fixtures](https://github.com/garrytan/gstack/blob/b15492a148e2744d24b0ca4da5ba290fb109c340/test/approval-record.test.ts) expect idempotent imports across branch records and no partial writes when a named branch is unknown. Human names or relayed words in a record do not authenticate the underlying grant.

**Teamagent implication (inference):** Preserve original authorization, exact reviewed content and later scope deltas as separate records. Portable display/history can explain authority but cannot create it; reconciliation and execution gates must verify the actual session grant and exact destination rather than trust copied approval prose.

**Verification limit:** committed-source inspection only; no upstream code, tests or provider calls were executed. Review scope is the cited implementation or authored guidance, not whole-project correctness, licensing clearance or measured performance. Source passages were redacted for review; exact URL literals were not byte-validated.

## External-update review - 2026-11-01

Reviewed `ab2852fb40219669c583f34a6f69b08f623543b4` against `b15492a148e2744d24b0ca4da5ba290fb109c340`.

The 173-path range repairs verification verdicts when policy changes only execution settings or downgrades a coverage gap. [Configuration parsing](https://github.com/garrytan/gstack/blob/ab2852fb40219669c583f34a6f69b08f623543b4/lib/pregate/config.ts) explicitly records whether the policy declares lanes through `dependencies`, `empty_lanes`, `selection` or `local`, including empty declarations. [Head-policy composition](https://github.com/garrytan/gstack/blob/ab2852fb40219669c583f34a6f69b08f623543b4/lib/pregate/head-policy.ts) retains this distinction when an unreviewed head adds coverage to a lane-less trusted base.

The inspected [lane checker](https://github.com/garrytan/gstack/blob/ab2852fb40219669c583f34a6f69b08f623543b4/lib/pregate/checks/lanes.ts) only stops before execution for a strict missing-lane failure. Under warning mode, selected tests still run; failed, incomplete and remote-required results retain their state, while only a passing execution can become a coverage warning. The complete [verdict fixtures](https://github.com/garrytan/gstack/blob/ab2852fb40219669c583f34a6f69b08f623543b4/test/pregate-policy-lane-verdicts.test.ts) cover red tests beside unmapped files, timeout-only policies, strict empty declarations, head-policy composition, platform obligations and deleted-test ownership. The latter fixtures were inspected, but the corresponding lane-selection algorithm was not audited in this slice.

**Harness consequence:** Keep scheduling configuration, coverage policy and observed test outcomes as separate inputs. A warning about one obligation must not skip or downgrade another obligation's failure, and an unavailable platform check remains outstanding. Preserve trusted-base policy provenance when considering head additions. These four complete implementation deltas and the fixture file were reviewed statically; other shipping, release and policy changes remain outside this scope. No upstream verification command or test was executed.

<!-- teamagent-analysis:start -->
Analysis metadata: source [gstack.claude.garrytan](https://github.com/garrytan/gstack); analyzed commit `ab2852fb40219669c583f34a6f69b08f623543b4`; commit date 2026-11-01T20:15:10Z; review date 2026-11-01T23:12:06.798Z; depth screened. [Maintenance record](../analyses/repos/ai-agents--gstack.claude.garrytan.md).
<!-- teamagent-analysis:end -->
