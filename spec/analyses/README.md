# Incremental repository analysis

[Latest run](latest-run.md) · [Repository list](repositories.md) · [Pending work](pending.md) · [Analysis changelog](CHANGELOG.md) · [Architecture changelog](../CHANGELOG.md) · [Methodology](../methodology.md)

`repositories.md` contains one single-line list item per report identity. It links the upstream source, preserved report, related topics and current change evidence. The original `spec/data/inventory.json` and `coverage.json` remain the historical census. New source observations never rewrite their findings or imply that new source code has been reviewed. LF migration changes their text representation only, retaining original bytes and hash provenance in the [migration ledger](line-endings.json).

The [focused speech/media review ledger](media-reviews.md) records the eight exact source versions inspected on 2026-10-25, including external sources outside the managed local census. Its scoped findings do not automatically advance whole-report baselines.

## External citation pins

The repository-owned [external source registry](../data/external-source-pins.json) records immutable public GitHub revisions used by reports outside the managed census. It does not mark those projects as whole-repository reviews or let regenerated parent exports overwrite review status. Local bare Git caches live under `.cache/research/citation-git`; paths are derived from the source identity, not accepted from the registry.

The internal Python maintenance helpers provide explicit acquisition and offline validation:

```sh
python spec/tools/external_sources.py
python spec/tools/external_sources.py --fetch
python spec/tools/validate.py
```

The first command only lists configured pins. `--fetch` is a separate network operation: only registered exact commits, public HTTPS, no credentials or redirects, no checkout, no source execution, and no automatic retry/substitution. Fetches run serially with a 120-second deadline per pin. The monitored cache budgets are 128 MiB per repository and 512 MiB total, checked during transfer; these are application limits rather than OS storage quotas. Partial caches remain available for inspection after failure. An interrupted fetch lock requires checking that its owner has stopped before manual recovery.

Normal validation never fetches. It checks the registered revision, exact cache origin, bare-repository ownership, path containment, Git blob bytes and cited line ranges. Missing commits, changed origins, unsupported Git configuration and escaped cache paths fail explicitly. Successful link verification proves object/line availability, not the semantic correctness of a claim, upstream runtime behavior, model quality or an account's data policy. Offline regression fixtures exercise these boundaries without contacting a provider.

## Three separate dates and versions

- **Analyzed SHA and commit date:** the full immutable commit whose source was reviewed or screened. The commit timestamp is not a review timestamp.
- **Review date:** when the report was actually inspected. Migration reads an explicit date from each report; absent dates remain unknown.
- **Observed SHA and observation date:** the checkout version recorded by discovery and verified again before preparing a change packet. Fetching, changing a folder name, importing a pack, or generating this index never advances the analyzed SHA.

`state.json` is the authoritative, repository-owned review ledger. The portable source inventory is [`git-sources.json`](../../git-sources.json); external generated export headers do not control either file. Another development checkout can clone that inventory into its default `.cache/git` and retain the same analyzed SHAs, report identities and review states. Only discovery/cache locations are machine-local. Each `repos/<id>.json` is a readable metadata and change-evidence sidecar, paired with `repos/<id>.md`. Every active source report has a managed metadata block containing its analyzed SHA, commit date and review date. The report digest excludes only that clearly delimited block, so synchronization does not masquerade as a new review. Edited report prose is flagged pending until explicit review promotion.

`history/<id>/<content-hash>.txt` identifies the exact report-body bytes recorded at that digest. Original hash-addressed snapshots remain immutable; normalized LF versions receive separate hashes and an explicit migration mapping. These snapshots are not active Markdown: relative links retain the report's original base from `state.json` / its sidecar. `history/<id>/<analyzed-sha>--<observed-sha>.json` preserves bounded change evidence across later promotions. Original source findings remain available; reports and evidence are never deleted by archive.

Maintained reports, generated views and active text evidence use UTF-8 with LF on every platform. This supersedes the earlier blanket normalization exception for managed reports. [`.gitattributes`](../../.gitattributes) enforces LF for text; exact-byte originals and registered historical snapshots retain explicit exceptions. The [line-ending migration ledger](line-endings.json) records original and LF hashes and lists retained originals by path and hash. Migration creates new LF snapshots rather than overwriting a file under its old content hash. Original source revisions, commit dates, review dates and findings remain unchanged; a `line-endings-normalized` event records maintenance, not a source review. Verify active report digests and retained history against these records after checkout, following the [verification contract](../verification.md).

## Commands

Run the repository's Bun launcher; Aube owns dependencies. No dependency installation is needed for this command.

```sh
bun app/research/analysis-sync.ts --help
bun app/research/analysis-sync.ts --root .
bun app/research/analysis-sync.ts --root . --write
```

The default is a read-only preview. The writer consumes `.cache/research/git-state.json`, emitted by Git discovery or explicit local observation, and resolves cache paths through the shared research settings. Run `aube run --no-install repos:observe` to publish current local HEAD/dirty observations for already known checkouts before analysis synchronization. This does not fetch, read regenerated source lists, refresh upstream availability or advance any analyzed baseline; failed local inspections remain incomplete. See the [observation contract](../research-sync.md). The writer loads root `.env`, then `.env.local`; it does not inherit ambient research path overrides. `TEAMAGENT_GIT_CACHE` defaults to `.cache/git`, and `TEAMAGENT_REPOMIX_CACHE` to `.cache/git.repomix`. This machine's local Git cache override points at `..`. Source links in reports always use upstream URLs; cache locations stay outside source citations.

After reading changed source, update the report with full-SHA source links, what changed, the review scope, limitations and adoption consequence. Then acknowledge that exact review explicitly:

```sh
bun app/research/analysis-sync.ts --root . --write --review ai-agents--example --sha FULL_SHA --reason "Inspected changed routing and cancellation implementation"
```

Promotion checks the observed checkout HEAD, full commit availability and baseline continuity, and requires changed report prose that cites the new SHA and source. Continuity normally means ancestry. For the same canonical upstream only, two independently available commits with exactly equal complete Git tree IDs also qualify; the packet explicitly records divergent history and the shared tree ID. This does not establish ancestry, identical commit metadata, or equality of external LFS/submodule contents. Explicit review is still required before advancing the baseline. Ordinary promotion blocks different source identities or different trees; the separate explicit divergent-history acknowledgment below handles reviewed same-source rewrites. It records the actual commit date and review time. This mechanism records the maintainer's completed review; it cannot establish the quality of that review. A new source begins **unreviewed** with no analyzed SHA.

Several completed reviews can share one source scan and ledger commit:

```sh
bun app/research/analysis-sync.ts --root . --write --reviews .cache/research/reviews.json
```

The project-relative JSON file contains an array of `{ "id": "analysis-id", "sha": "FULL_SHA", "reason": "Completed review scope" }` objects. It is limited to 100 entries and 256 KB; reasons must be nonempty and at most 2,000 characters. The path cannot escape the project or traverse a symlink/junction. Duplicate or unknown IDs, malformed SHAs, and mixed singular review/archive options are rejected. Every report and source guard must pass before any review evidence or ledger update is published. A first accepted review changes depth from `unreviewed` to `reviewed`; the maintainer must add its relevant findings and report links to the main topic documents. Obsolete discovery-only topic sections are removed when they have no remaining unreviewed sources.
Archive is explicit and reversible by editing/reviewing the ledger under normal change review; absence or an incomplete discovery run never silently archives a source:

```sh
bun app/research/analysis-sync.ts --root . --write --archive ai-agents--example --reason "Superseded; evidence retained"
```

### Reviewing a snapshot after its checkout advances

Publication checks all acknowledged report digests and checkout HEADs again before writing derived files, then rechecks each reviewed report immediately before its metadata write. A changed report or checkout aborts without committing the ledger; already written derived files may need reconstruction on the next run. The maintenance lock coordinates this tool's writers, not arbitrary editors or other Git clients. These checks reduce the race window but do not provide an OS transaction across mutable source checkouts and report files. Keep concurrent source updates and report edits quiescent during publication; retained snapshots identify exactly which bytes were reviewed.

The default still rejects a checkout that differs from discovery. For a completed review of the exact discovery snapshot, pass `--checkout-sha FULL_CURRENT_SHA` with the singular review, or add `checkoutSha` to that batch entry. This is an explicit acknowledgment of a newer checkout, not a request to review it. The tracker requires the same canonical source, the reviewed SHA to equal the saved discovery SHA, exact current HEAD equality and full ancestry from the reviewed snapshot to that checkout. It retains the usual prior-baseline continuity and changed-report checks, and rechecks HEAD before publication. Missing history, unrelated rewrites, another source, a mistyped SHA or a further checkout change fails without advancing the ledger.

Only the inspected SHA becomes the analyzed baseline. The newer checkout remains `observation-stale` in pending work until fresh discovery and its additional changes are reviewed. The review event records the acknowledged full checkout SHA. This permits asynchronous source review while preserving the distinction between completed snapshot review and current-source coverage; it does not fetch, switch branches, reset a checkout or silently accept whatever HEAD happens to be present.

## Renames and ambiguous identities

### Explicit divergent-history reconciliation

Ordinary review and rename detection never reset a divergent baseline. After separately inspecting the complete tree comparison and the relevant source, a maintainer can pass `--reconcile-from FULL_PRIOR_ANALYZED_SHA` with a singular review, or `reconcileFrom` in a batch entry. This acknowledgment is restricted to the exact preserved baseline, the same canonical upstream, available full commits and two different complete Git trees. An ordinary ancestry-compatible review, another source, a stale acknowledgment, missing history or an ancestry-inspection error is rejected. A renamed source with incompatible ancestry still requires separate identity investigation; this option does not bypass rename checks.

The changed report must cite both prior and reviewed commits and the upstream URL. The event and immutable change packet retain the two tree IDs and explicitly say that ancestry was not established. The prior analyzed commit and report snapshot remain in history. The report's actual review scope remains authoritative: reconciliation records an intentional new analysis baseline, not whole-project correctness or proof of upstream publisher intent. A separately acknowledged newer descendant checkout remains pending under the snapshot rule above. Never generate these acknowledgments automatically from a failed ordinary promotion.

Canonical remote comparison normalizes GitHub/Gist/GitLab URL forms and `.git` suffixes. It retains the original upstream host; it never substitutes a GitHub mirror for GitLab or Gists. Duplicate source URLs remain distinct report identities, with exact-ID matches preferred. A folder rename with a unique canonical remote preserves the original report ID only after verifying full analyzed ancestry or the narrowly defined same-source identical-tree case above. A changed remote still requires ancestry; copied content alone cannot establish a new upstream identity.

A changed repository URL is not automatically assumed to be a rename: forks can share history. Review the source identity and supply a one-to-one mapping. The mapping still requires full ancestry; shortened SHAs, missing history and ambiguity are rejected.

Once an alias has been verified and recorded for the same canonical upstream, later stale observations retain that identity and report `observation-stale`; they do not become a new rename investigation merely because the checkout advanced. This preserves identity evidence without accepting the new revision. A changed upstream URL still requires fresh continuity and identity checks.

```sh
bun app/research/analysis-sync.ts --root . --write --rename ai-agents--deepseek-tui=ai-agents--codewhale
```

If history is shallow and lacks the analyzed commit, the packet reports `shallow-baseline-missing`. Explicitly fetch/deepen the trusted source history, then rerun discovery and analysis synchronization. The tool never resets the baseline to the oldest available commit or invents a rename from a similar directory name.

## Efficient, bounded review packets

Each changed repository contributes at most 32 commit summaries and 160 changed paths. The two-commit file comparison disables external diff commands and text conversion, and limits exhaustive rename detection to 1,000 candidates; excess unmatched files remain explicit additions/deletions. Truncated lists are labeled. Git has a 30-second operation deadline and a 2 MB ordinary output cap. File comparisons alone permit up to 8 MiB: the 2026-10-27 Orca and LangWatch inventories were measured at 2,462,658 and 3,816,825 bytes respectively, above the former cap. The larger bounded input does not enlarge the 160-path published packet or certify complete review. A real 33,000-path Git fixture covers this distinction. Report reads remain limited to 1 MB and JSON inputs to 16 MB. No repository code, build script, skill script or generated instructions are executed. Working-tree changes are identified but excluded from committed-source evidence.

A checkout changed since discovery yields `observation-stale`; unavailable baseline objects and diverged history are separate states. Reviewers use the full source comparison and exact file reads when the bounded packet is incomplete. Incremental Git evidence is the default locator; Repomix packs remain optional derived inputs, never substitutes for source provenance or complete tests. See [Repomix audit](repomix.md).

Writes use an exclusive synchronization lock, atomic individual files, and a final state-ledger commit. A crashed run can leave derived views ahead of the ledger; rerunning reconstructs them from the authoritative baseline. A remaining lock is not automatically stolen: establish that its owner is gone before removing it. Immutable snapshots are excluded from formatting. The original 507 coverage records retain their original SHA until a separately logged review advances them.

Atomic file replacement retries only `EBUSY`, `EPERM` and `EACCES`, at most five attempts with one second of total retry waits. It never deletes an existing target to force replacement. Persistent failures preserve the ledger boundary; some derived files may already have been published, so rerunning remains necessary.

Managed report metadata accepts both LF and CRLF line endings, including adjacent blocks with a shared separator. Older Windows-written blocks could enter a report digest and be duplicated on subsequent synchronization. A `metadata-normalized` maintenance event requires either an exact match under the old parser or a verified original hash-addressed snapshot whose metadata-free body exactly matches the current report. The latter recovers an interrupted repair that published the clean report before the ledger. It preserves that original snapshot, source SHA, commit date and review date, and records the new metadata-free digest. This is not a source review. Actual prose changes remain modified and require explicit review; unrelated prose is preserved, while line-ending changes follow the separate recorded LF migration. Repair inputs are checked again before publication, and corrupt history fails explicitly.

## Active link and source validation

The existing [validator](../tools/validate.py) reads current checkout locations and aliases from discovery, but checks each citation against its exact historical Git object. It does not require an old citation to match current HEAD or an edited working tree. Results are written to [current validation](validation.json); the original `spec/data/validation.json` remains unchanged. Immutable archive, conversation and history material is excluded from active-link checks.

The validator checks a Git object's size before reading its content, with an explicit 8 MiB ceiling, 30-second Git operation timeout and concurrency of eight. The ceiling was raised from 2 MB only after verifying an existing cited historical HTML object is 6,271,350 bytes. Missing objects and files above the ceiling still fail explicitly. Checks establish link existence, line ranges and content hashes; they do not establish semantic correctness or that an upstream site is currently reachable.

## Focused voice backend increment

The [voice backend review ledger](voice-backends-reviews.md) records one single-line entry per new source/service report, including full source SHA and commit date where available, explicit unavailable API revisions otherwise, and links to the [supplemental evidence](../data/voice-backends-review-2026-10-25.json). It complements the [earlier speech/media ledger](media-reviews.md) without advancing existing managed analysis baselines.

The [media training policy ledger](media-training-reviews.md) adds four dated hosted-policy reviews, preserving existing source baselines. It distinguishes documentary conditions from live identity verification and records the read-only user-analysis provenance.
