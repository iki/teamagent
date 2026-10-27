# Incremental repository analysis

[Latest run](latest-run.md) · [Repository list](repositories.md) · [Pending work](pending.md) · [Analysis changelog](CHANGELOG.md) · [Architecture changelog](../CHANGELOG.md) · [Methodology](../methodology.md)

`repositories.md` contains one single-line list item per report identity. It links the upstream source, preserved report, related topics and current change evidence. The original `spec/data/inventory.json` and `coverage.json` remain the historical census. New observations never rewrite their evidence or imply that new source code has been reviewed.

The [focused speech/media review ledger](media-reviews.md) records the eight exact source versions inspected on 2026-10-25, including external sources outside the managed local census. Its scoped findings do not automatically advance whole-report baselines.

## Three separate dates and versions

- **Analyzed SHA and commit date:** the full immutable commit whose source was reviewed or screened. The commit timestamp is not a review timestamp.
- **Review date:** when the report was actually inspected. Migration reads an explicit date from each report; absent dates remain unknown.
- **Observed SHA and observation date:** the checkout version recorded by discovery and verified again before preparing a change packet. Fetching, changing a folder name, importing a pack, or generating this index never advances the analyzed SHA.

`state.json` is the authoritative, repository-owned review ledger. The portable source inventory is [`git-sources.json`](../../git-sources.json); external generated export headers do not control either file. Another development checkout can clone that inventory into its default `.cache/git` and retain the same analyzed SHAs, report identities and review states. Only discovery/cache locations are machine-local. Each `repos/<id>.json` is a readable metadata and change-evidence sidecar, paired with `repos/<id>.md`. Every active source report has a managed metadata block containing its analyzed SHA, commit date and review date. The report digest excludes only that clearly delimited block, so synchronization does not masquerade as a new review. Edited report prose is flagged pending until explicit review promotion.

`history/<id>/<content-hash>.txt` preserves the report body at its recorded digest. These are raw immutable snapshots, not active Markdown: relative links retain the original report's base given by `state.json` / the per-report sidecar. `history/<id>/<analyzed-sha>--<observed-sha>.json` preserves bounded change evidence across later promotions. Original source findings remain available; reports and evidence are never deleted by archive.

## Commands

Run the repository's Bun launcher; Aube owns dependencies. No dependency installation is needed for this command.

```sh
bun app/research/analysis-sync.ts --help
bun app/research/analysis-sync.ts --root .
bun app/research/analysis-sync.ts --root . --write
```

The default is a read-only preview. The writer consumes `.cache/research/git-state.json`, emitted by Git discovery, and resolves cache paths through the shared research settings. It loads root `.env`, then `.env.local`; it does not inherit ambient research path overrides. `TEAMAGENT_GIT_CACHE` defaults to `.cache/git`, and `TEAMAGENT_REPOMIX_CACHE` to `.cache/git.repomix`. This machine's local Git cache override points at `..`. Source links in reports always use upstream URLs; cache locations stay outside source citations.

After reading changed source, update the report with full-SHA source links, what changed, the review scope, limitations and adoption consequence. Then acknowledge that exact review explicitly:

```sh
bun app/research/analysis-sync.ts --root . --write --review ai-agents--example --sha FULL_SHA --reason "Inspected changed routing and cancellation implementation"
```

Promotion checks the observed checkout HEAD, full commit availability and ancestry, and requires changed report prose that cites the new SHA and source. It records the actual commit date and review time. This mechanism records the maintainer's completed review; it cannot establish the quality of that review. A new source begins **unreviewed** with no analyzed SHA.

Several completed reviews can share one source scan and ledger commit:

```sh
bun app/research/analysis-sync.ts --root . --write --reviews .cache/research/reviews.json
```

The project-relative JSON file contains an array of `{ "id": "analysis-id", "sha": "FULL_SHA", "reason": "Completed review scope" }` objects. It is limited to 100 entries and 256 KB; reasons must be nonempty and at most 2,000 characters. The path cannot escape the project or traverse a symlink/junction. Duplicate or unknown IDs, malformed SHAs, and mixed singular review/archive options are rejected. Every report and source guard must pass before any review evidence or ledger update is published. A first accepted review changes depth from `unreviewed` to `reviewed`; the maintainer must add its relevant findings and report links to the main topic documents. Obsolete discovery-only topic sections are removed when they have no remaining unreviewed sources.
Archive is explicit and reversible by editing/reviewing the ledger under normal change review; absence or an incomplete discovery run never silently archives a source:

```sh
bun app/research/analysis-sync.ts --root . --write --archive ai-agents--example --reason "Superseded; evidence retained"
```

## Renames and ambiguous identities

Canonical remote comparison normalizes GitHub/Gist/GitLab URL forms and `.git` suffixes. It retains the original upstream host; it never substitutes a GitHub mirror for GitLab or Gists. Duplicate source URLs remain distinct report identities, with exact-ID matches preferred. A folder rename with a unique canonical remote preserves the original report ID only after verifying that the full analyzed SHA is an ancestor of observed HEAD.

A changed repository URL is not automatically assumed to be a rename: forks can share history. Review the source identity and supply a one-to-one mapping. The mapping still requires full ancestry; shortened SHAs, missing history and ambiguity are rejected.

```sh
bun app/research/analysis-sync.ts --root . --write --rename ai-agents--deepseek-tui=ai-agents--codewhale
```

If history is shallow and lacks the analyzed commit, the packet reports `shallow-baseline-missing`. Explicitly fetch/deepen the trusted source history, then rerun discovery and analysis synchronization. The tool never resets the baseline to the oldest available commit or invents a rename from a similar directory name.

## Efficient, bounded review packets

Each changed repository contributes at most 32 commit summaries and 160 changed paths. The complete two-commit file comparison uses Git's rename detection, with external diff commands and text conversion disabled. Truncated lists are labeled. Git has a 30-second operation deadline and 2 MB output cap; report reads are limited to 1 MB and JSON inputs to 16 MB. No repository code, build script, skill script or generated instructions are executed. Working-tree changes are identified but excluded from committed-source evidence.

A checkout changed since discovery yields `observation-stale`; unavailable baseline objects and diverged history are separate states. Reviewers use the full source comparison and exact file reads when the bounded packet is incomplete. Incremental Git evidence is the default locator; Repomix packs remain optional derived inputs, never substitutes for source provenance or complete tests. See [Repomix audit](repomix.md).

Writes use an exclusive synchronization lock, atomic individual files, and a final state-ledger commit. A crashed run can leave derived views ahead of the ledger; rerunning reconstructs them from the authoritative baseline. A remaining lock is not automatically stolen: establish that its owner is gone before removing it. Immutable snapshots are excluded from formatting. The original 507 coverage records retain their original SHA until a separately logged review advances them.

Atomic file replacement retries only `EBUSY`, `EPERM` and `EACCES`, at most five attempts with one second of total retry waits. It never deletes an existing target to force replacement. Persistent failures preserve the ledger boundary; some derived files may already have been published, so rerunning remains necessary.

## Active link and source validation

The existing [validator](../tools/validate.py) reads current checkout locations and aliases from discovery, but checks each citation against its exact historical Git object. It does not require an old citation to match current HEAD or an edited working tree. Results are written to [current validation](validation.json); the original `spec/data/validation.json` remains unchanged. Immutable archive, conversation and history material is excluded from active-link checks.

The validator checks a Git object's size before reading its content, with an explicit 8 MiB ceiling, 30-second Git operation timeout and concurrency of eight. The ceiling was raised from 2 MB only after verifying an existing cited historical HTML object is 6,271,350 bytes. Missing objects and files above the ceiling still fail explicitly. Checks establish link existence, line ranges and content hashes; they do not establish semantic correctness or that an upstream site is currently reachable.

## Focused voice backend increment

The [voice backend review ledger](voice-backends-reviews.md) records one single-line entry per new source/service report, including full source SHA and commit date where available, explicit unavailable API revisions otherwise, and links to the [supplemental evidence](../data/voice-backends-review-2026-10-25.json). It complements the [earlier speech/media ledger](media-reviews.md) without advancing existing managed analysis baselines.

The [media training policy ledger](media-training-reviews.md) adds four dated hosted-policy reviews, preserving existing source baselines. It distinguishes documentary conditions from live identity verification and records the read-only user-analysis provenance.
