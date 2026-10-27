# Research maintenance run — 2026-10-27

[Workflow](../research-sync.md) · [Measurements](../data/research-sync-2026-10-27.json) · [Repository index](repositories.md) · [Pending reviews](pending.md) · [Previous run](run-2026-10-24.md)

## Portable repository sources

The owned [git-sources.json](../../git-sources.json) contains 532 repositories across 18 populated categories. All 19 requested categories are eligible; the supplied exports contain no `ai-agents-swarm` entries. `sources:sync` reads regenerable parent exports as inert declarations; `repos:sync` reads the owned inventory. The imported shell header has no execution authority. The auxiliary URL export was empty, so the import recorded an explicit warning and used the complete validated clone declarations. Parent export bytes match the saved pre-run originals. Ordinary maintenance leaves the legacy root export files untouched.

The source import and runtime updater now have separate responsibilities. A fresh checkout uses the owned inventory and its default `.cache/git`; `.env.local` can select another import directory/cache. Analyzed SHAs, commit dates, report identities and review evidence remain in the repository-owned ledger. Rejected imports preserve the prior inventory. Fixtures cover malformed data, inert regenerated headers, absent auxiliary exports and a fresh checkout without a parent source folder.

## Git outcomes and recovery

The full run attempted all 532 sources: 206 updated cleanly, one updated with local changes, 323 were unchanged, one was unchanged with local changes, and one remained blocked. Thus 207 advanced and 324 were already current. Hyperframes local changes were stashed, restored and retained in a recovery stash; Wayland's already-current dirty checkout was preserved without an unnecessary stash. No checkout was reset or cleaned.

The [Vasily source](https://github.com/vasilyu1983/ai-agents-public) again returned authenticated not-found/inaccessible responses. A timestamp-deserialization defect had discarded its October 24 observation. After a typed normalization fix and a real state-file round-trip regression, the retained earlier observation was restored from the pre-run evidence and a separate authenticated recheck confirmed the elapsed window. Its checkout received the configured operational removed prefix. This classification does not establish whether upstream was deleted, private or temporarily unavailable.

A private backup was created and three retained Git refs were verified. The backup scope includes retained local/origin branches, tags and HEAD objects; it excludes uncommitted/ignored files, unfetched history and historical LFS/submodule payloads. Its private remote identity remains in local operational state. The full-run snapshot is retained separately from the targeted recheck, which does not replace the complete scan's coverage.

## Analysis reconciliation

All 533 report identities received refreshed change evidence. Three scoped reviews were promoted: [Emdash](unreviewed/ai-agents--emdash.md), [Pi](../projects/ai-agents--pi.md) and [Paseo](../projects/ai-agents--paseo.md). Their exact source SHAs, commit dates and report digests are recorded in the ledger. Related agents, models, channels, decisions, security and evolution recommendations were reconciled. Twenty-three current-revision source citations were checked against pinned Git objects and line ranges; upstream fixtures were inspected, not executed.

The final index contains 165 current identities, 332 changed, seven history-diverged, two rename-unverified, one inspection-failed, one unavailable and 25 unreviewed. The 368 remaining identities require further review or reconciliation. Fetching and preparing change packets did not automatically advance their analyzed commits, archive unavailable projects or resolve ambiguous identities. The one-record difference between 532 checkouts and 533 report identities retains the earlier ambiguous Better Icons identity.

The [media source refresh](media-refresh-2026-10-27.md) reviewed 15 official pages and retained the existing training-policy expiry and account-evidence requirements. It records HeyGen pricing conflicts and Fish's announced route retirement. The prepared Czech-to-English workflow was preserved; no live media call or downstream integration occurred.

## Static articles and explicit refresh

An initial full public-source refresh preceded the user's static-resource correction; its [historical review](texts/review-2026-10-27.md) and versions remain preserved. The new default then processed all 42 configured entries: 38 saved resources retained their exact source/version/hash identities and previous remote-check times, while only four never-captured sources were attempted. No saved article or image was refetched, and no new source version was published.

The resulting catalog has 29 usable retained texts, eight partial captures, one blocked PDF wrapper and four failed initial imports. Kiro's prior successful capture is retained without a new request. All 38 saved sources have first-capture dates; 24 entries have publication dates from retained publisher metadata (14 HTML metadata, ten JSON-LD), and 18 remain explicitly unknown. File names and capture times were not treated as publication evidence. The final alias/locator validation run reproduced these outcomes without changing recorded dates. See the [first static-policy measurements](texts/static-policy-verification-2026-10-27.json), [final implementation measurements](texts/static-policy-final-verification-2026-10-27.json) and [source catalog](texts/README.md).

Only a URL marked `refresh=true` in a root resource list is rechecked after capture. Available page/image ETag and Last-Modified validators are scoped to exact final URLs. A 304 reuses only checksum-verified retained bytes, while images are checked independently; content hashes detect changes when validators are absent. Missing/corrupt static cache data is an explicit failure, including on another development machine; transfer the cache/exported evidence rather than assuming a saved ledger includes its bytes.

## Verification

The final implementation step passed formatting, strict type checks, type-aware lint and 336 tests across 45 files, with zero failures and 1,240 assertions. Focused HTTP/static fixtures, Git state round trips, failed-export pinning, alias reuse, exact-locator binding and real sync outcomes are recorded separately from provider/model testing.

<!-- final-verification:start -->
The final review gate also passed: 336 tests, zero failures and 1,240 assertions across 45 files (212.25 seconds for the test subprocess). Active validation checked 1,208 Markdown documents, 10,137 relative links and 2,297 pinned source links against 2,235 unique Git blobs, with zero issues. Twenty-three unmapped external source links remain explicitly unverified; this check does not establish semantic correctness or public reachability. The dated validation snapshot and log digests are recorded in the measurements file.
<!-- final-verification:end -->

Historical evidence and unrelated working-tree changes were preserved. No package release, public publication, dependency upgrade or Trigon integration was performed.
