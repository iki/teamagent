# External-update review and resource reconciliation - 2026-11-01

This follow-up preserves the [earlier November 1 refresh](run-2026-11-01.md).
Its implementation baseline is
`e94ebfefe90e8457862c90142231c33ef9ee082d`. Source observation, scoped source
review, extraction repair and repository verification are separate evidence.

## External updater and local observations

The external `../.cmd/gu` script was inspected at SHA-256
`1d06894ca0179b70010e27d0e14a7d90415295e2b385bd9aa17d7f57824e1a91`.
It contains a divergent-history hard reset, so this task did not execute it.
Instead, the owned `repos:observe` command inspected revisions left by external
maintenance without fetching, resetting, stashing or executing checkout code.
This is not a fresh upstream availability check for every repository.

The initial observation covered 548 known rows: 535 clean checkouts, two dirty
checkouts and eleven missing old locations. Wayland and HyperFrames local edits
were preserved; source review uses committed Git objects only. Canonical source
matching identified 87 changed revisions before resolving the moved locations.
Those 87, plus four changed revisions recovered at moved locations, now have
explicit scoped review notes. Each retains the previous analyzed SHA, exact new
SHA, cited paths, limitations and architecture consequence. The checked
first promotion recorded 108 acknowledgements: 91 changed revisions, 14 initial
distinct-source reviews, two same-commit reconciliations and one duplicate
identity review. The duplicate was subsequently archived.

Ten locations moved into the parent export's `ai-agents-manage` category. That
reviewed folder alias maps to canonical `ai-agents-swarm`, retaining existing
report identities and history. Regenerated export files are declaration inputs,
never replacement executable code or review-status authority. The owned
inventory, analysis ledger and optional explicitly registered additional sources
remain portable; local checkout locations stay in ignored machine state.

The first refreshed declarations contained 563 configured checkouts, including the
explicit [Open Notebook](https://github.com/lfnovo/open-notebook)
[supplement](../../git-sources.additional.json). The first refreshed local
observation contained 564 rows: 561 clean checkouts, two dirty checkouts and the
old missing ECC identity pending reconciliation. Its retained LF snapshot has
SHA-256 `c3bb09014e917d1c06856e76aab0fc7cb1e278fd22679be9f448ef2c1e1933d5`.
A later committed-object capture also found local changes in
[GitHub Agentic Workflows](https://github.com/github/gh-aw)
([report](unreviewed/ai-agents-swarm--gh-aw.md)); its modified PDF and untracked directory were preserved and excluded
from source review. Observation timestamps are not remote freshness claims.

The pre-cleanup observation completed all 563 configured local inspections: 560 clean
and three dirty, with no missing checkout or failed HEAD inspection. Wayland,
HyperFrames and GitHub Agentic Workflows local changes remain untouched.
The old ECC machine identity is retained as one prior-identity row; the new URL
has `unknown` availability and no remote-check timestamp. The final snapshot
has SHA-256 `2332a41c563d6d7373af79b5834acf359825ad2da24b5ecdb6c5613fbfd2e6da`.
The observer intentionally reports partial status for dirty worktrees and does
not claim fresh source-list discovery or a remote fetch. The analysis inventory
then contained 564 report identities: 562 active and two archived, with no pending
source review at these observed commits.

All configured `ai-*` sources are intended public repositories. An inaccessible
source remains unavailable; a 404 alone does not establish that it became
private or was deleted. Private recovery backups are a separate operation.

### Follow-up: generated Git LFS hooks

The user removed Wayland's extra file and removed the HyperFrames hook files,
then updated HyperFrames. A later bounded check found Wayland clean at its
reviewed SHA and HyperFrames clean at
`2bce65ee1b90a32fbdc9836d31048b3219194f14`. The earlier dirty observations remain
historical evidence; they do not establish that all reported changes were user
edits.

In [GitHub Agentic Workflows](https://github.com/github/gh-aw), the four untracked
files `dev/null/post-checkout`, `post-commit`, `post-merge` and `pre-push` exactly
match standard Git LFS hooks. Their creation at `2026-11-01T22:03:50Z` falls
within the earlier observer run. An isolated reproduction with Git
`2.56.0.windows.4` and Git LFS `3.8.1` recreated all four paths when status used
`core.hooksPath=/dev/null`. Native Windows `NUL` prevented the additions and
preserved correct clean/dirty classification; an empty hook path created hooks
at the checkout root. Disabling LFS filters instead falsely marked unchanged
hydrated content as modified.

The working PDF is 11,569,862 bytes with SHA-256
`c7e215407d4e631556447d8e7e97e804a6c90d58d757baa48ff425a9cf63691b`,
matching its committed LFS pointer exactly. Its recorded modification time
predates the observer. This establishes matching content, not evidence that
the inspection edited the PDF. The corrected [inspection contract](../research-sync.md)
uses native null-device hook suppression and discloses that installed LFS
filters can still maintain private Git cache/configuration. This is separate
from running programs from the reviewed upstream source.

The four exact untracked hooks were preserved with verified LF bytes and hashes,
then removed. Their `dev/null` and `dev` directories were removed only after
confirming they were empty. The cleanup rechecked unchanged HEAD
`3e66bf448eb769907aa571fa35664821a691b965` and PDF bytes; it performed no fetch,
update, hook execution or broader deletion. Its portable receipt is identified
in the [measurement record](../data/research-reconciliation-2026-11-01.json).

After the cleanup and OpenWorker source registration, the fixed observer
successfully inspected all 564 configured checkouts, with zero dirty or missing
checkouts. It did not recreate gh-aw's hooks or fetch/update any source. The
retained LF snapshot hashes to
`50dca57964cbf62f59b3675fcdca2225a2c269662306fd6cc98df8b6f4d3eba3`.
Relative to the prior review ledger, only HyperFrames' new commit and the new
[OpenWorker](https://github.com/andrewyng/openworker) source required promotion.
Both were subsequently promoted through explicit acknowledgements. The final
ledger contains 565 identities: 563 active analyses and two archives, with no
pending review for the observed commits. The task recorded 110 acknowledgements
over 109 identities: 92 changed-revision reviews across 91 existing sources,
15 distinct initial reviews, two same-commit reconciliations and one duplicate
identity disposition. The rejected first follow-up attempt is retained; it
required registering OpenWorker before accepting its acknowledgement and did
not advance reviewed baselines.

## Two update exceptions

- [MentisDB](https://github.com/CloudLLM-ai/mentisdb)
  ([report](../projects/ai-agents-mem--mentisdb.md)): the clean checkout advanced
  to `3a4442a9f65feb2578b04d9977806911aeb719de`, matching its recorded local
  `origin/master`. Upstream commit
  `906d4df44cacc345507f8b7c22d826d86881a05c` renamed the Windows-reserved `nul`
  corpus filename while preserving Git blob
  `20b5be91886d0b6f26dc98a225c0dac05fe2c86e`. No NTFS protection was disabled,
  no sparse-checkout workaround was introduced and no source file was rewritten.
- [Vasilyu public bundle](https://github.com/vasilyu1983/ai-agents-public)
  ([report](../projects/ai-skills--bundle.vasilyu83.md)): authenticated account
  access succeeded while repeated source lookups remained 404; anonymous lookup
  supplied no verified successor. The clean retained checkout remains at
  `01246042082225a482980162543f453067143e8b`. The existing private backup's
  repository identity, private visibility and three expected refs were verified.
  The user explicitly chose to keep the source tracked as inaccessible and
  preserve that backup. No backup destination or credential is published here.

## ECC identity continuity

An anonymous primary API check at `2026-11-01T21:34:18.5940275Z` returned an
explicit 301 from the old Everything Claude Code identity to repository ID
`1136590548`. Separate name and ID lookups returned the same public
[affaan-m/ECC](https://github.com/affaan-m/ECC). The old redirect was not followed
implicitly. The clean, nonshallow local checkout and prior analyzed commit are
both `b38be6a7f6350964d59328b52f0624e1d1d552d1`, with full ancestry verified.
This establishes identity and baseline continuity, not a fresh Git fetch.

The explicit analysis rename preserves the established report ID and old URL
alias. Subsequent maintenance consumes that reviewed mapping, verifies origin
and full baseline ancestry again, and retains the old machine row in bounded
identity history. It must not clone the redirected old URL as another unlisted
repository or copy its remote-check date to the new URL as fresh evidence.

## New sources and duplicate disposition

Fifteen distinct sources received initial scoped reports. Captured inventories
and selected code, documentation and fixtures have different review depths;
none is a whole-project audit. The source/report table below is supplemented by
the specific findings in each architecture direction.

| Source | Scoped report | Captured commit |
| --- | --- | --- |
| [agent-tincan](https://github.com/mvanhorn/agent-tincan) | [Review](unreviewed/ai-agents-swarm--agent-tincan.md) | `2591cf260438572aed7131c85811fd03c1958d71` |
| [gh-agentics](https://github.com/githubnext/agentics) | [Review](unreviewed/ai-agents-swarm--gh-agentics.md) | `139fa09ef17cde4135e696ff8e7af09bc5ddfa6e` |
| [gh-aw](https://github.com/github/gh-aw) | [Review](unreviewed/ai-agents-swarm--gh-aw.md) | `3e66bf448eb769907aa571fa35664821a691b965` |
| [sim](https://github.com/simstudioai/sim) | [Review](unreviewed/ai-agents-swarm--sim.md) | `6ebc04dde09921db796821bab1844306c3d136b0` |
| [simlock](https://github.com/callstackincubator/simlock) | [Review](unreviewed/ai-agents-swarm--simlock.md) | `822ea4c47d68cd8f7b1168192c40bbcffa23f4e9` |
| [uniterm](https://github.com/ys-ll/uniterm) | [Review](unreviewed/ai-agents-swarm--uniterm.md) | `871265e77f38343c1f9452b56e22149d5d903b0c` |
| [agentscope](https://github.com/agentscope-ai/agentscope) | [Review](unreviewed/ai-agents--agentscope.md) | `4acacb9ffb8c148a1f1e68263657a978bcb1e5a3` |
| [agentscope-agentteams](https://github.com/agentscope-ai/agentteams) | [Review](unreviewed/ai-agents--agentscope-agentteams.md) | `ec845f92ed97652272e2d35b2c483e76b6712fd9` |
| [deepagents](https://github.com/langchain-ai/deepagents) | [Review](unreviewed/ai-agents--deepagents.md) | `220aff708682ad0883469a00531e5c4d958b47ec` |
| [goose](https://github.com/aaif-goose/goose) | [Review](unreviewed/ai-agents--goose.md) | `b23d21cabd9b4de0c045dcdd731821a3a15c2bfc` |
| [maxkb](https://github.com/1panel-dev/maxkb) | [Review](unreviewed/ai-agents-mem--maxkb.md) | `d8dd35f6cafa7b8ddeda92d60923087724d29d4c` |
| [claude-howto](https://github.com/luongnv89/claude-howto) | [Review](unreviewed/ai-info--claude-howto.md) | `b968f429866a02d2b18765f418e90cbc7f871b3e` |
| [ai-engineering-interview-questions-company-wise](https://github.com/pallavi-shekhar/ai-engineering-interview-questions-company-wise) | [Review](unreviewed/ai-info--ai-engineering-interview-questions-company-wise.md) | `8fcbddc4ff6910daacf6c371f5056c48c4f2a06a` |
| [open-notebook](https://github.com/lfnovo/open-notebook) | [Review](unreviewed/ai-agents--open-notebook.md) | `a0f6f3081ae06328f0a451b3a3ef2959ca25721d` |
| [OpenWorker](https://github.com/andrewyng/openworker) | [Review](unreviewed/ai-agents--openworker.md) | `bea25db6f2034ec3093933a267f5933cbea04cd5` |

The November 2 OpenWorker addition covers deterministic action gates, the Jev
adapter's finite-probability gap, route/readiness separation, memory and skill
lifecycle, local team transactions, channel binding and English dictation.
All ten related topic additions received independent source review. The later
[HyperFrames review](../projects/ai-gen--hyperframes.md) adds a 101-path comparison
through `2bce65ee1b90a32fbdc9836d31048b3219194f14`, including native cache roots,
preview retries, GPU-dependent LUT fitting and joinable authentication cleanup.
Neither review executed upstream code or changes Teamagent's approved Czech
workflow, non-training policy or provider selection.

The second [Yue2 Studio](https://github.com/timoncool/yue2-studio) entry has the
same canonical origin and full commit
`bd62c50e4b6ea7e0551b1378b198519b7e0376ce` as the existing generation-category
source. Its [duplicate pointer](unreviewed/ai-media--yue2-studio.md) retains the
[primary report](unreviewed/ai-gen--yue2-studio.md). Both configured checkouts
remain; only the duplicate analysis is archived, with an explicit identity
baseline so subsequent divergence can be detected.

## Static text repairs

The [eleven-source text reconciliation](texts/reconciliation-2026-11-01.md)
records retained original bytes, old/new version and content hashes, repaired
links/images, focused social-post extraction and explicit alternate PDF parsing.
These are local derivative improvements; static creation/capture dates and
refresh policy stay unchanged. Earlier failed attempts and export versions are
retained. Partial thread, dynamic-diagram and PDF fidelity limits remain visible.

All eleven candidates were explicitly adopted from retained originals. Two
became `usable-text`; nine retain explicit partial status. The active inventory
contains 43 resources: 34 usable texts, nine partials and zero failed active
imports. Three earlier blocked/failed identities remain in the 46-record ledger.
A subsequent offline static sync performed zero imports and zero capture calls,
preserving pins, creation/capture dates and source configuration bytes.

The new explicit reconciliation entry point checks the exact previous record,
both exports and source/original identity, then writes an immutable before/after
receipt before publishing a new pin. Recovery reuses the exact saved request;
it does not recapture or convert. Repeated Windows `EPERM` during report
replacement was a confirmed local publication failure. No provider action or
remote import was retried to repair it. See the [operational contract](../research-sync.md#explicit-local-derivative-reconciliation).

The final integrity check also identified one NUL in an earlier
[Memento](https://github.com/microsoft/memento) PDF
[text derivative](texts/cx.260408.memento.pdf.report.md) retained alongside the alternate extraction. The 102,989-byte
UTF-8 derivative is already LF and hashes to
`eb27a1d43387bcad8ca7fc151d13430d184cc61c969b8118d5584669b7c73484`
in both immutable export versions; it also matches a previously registered
original and six historical benchmark copies. Its one exact new cache path
uses the existing hash-verified historical-input mechanism. A separately
labeled escaped-NUL rendering reconstructs the original hash exactly and does
not guess the missing glyph. Exports, prepared manifests and source pins were
not rewritten. The supplemental audit records that the current public/private
pin ledgers match the retained pre-repair private hash; no separate earlier
public-ledger byte snapshot was captured. This derivative is not the primary PDF.

## Architecture implications and limits

Updated [agents](../agents.md), [memory](../memory.md), [models](../models.md),
[skills](../skills.md), [channels](../channels.md), [decisions](../decisions.md),
[evolution](../evolution.md), [import/generation](../import-generation.md),
[import pipeline](../import-pipeline.md), [channel input](../channel-input.md),
[media processing](../media-processing.md) and [security](../security.md).
The reports distinguish implemented source behavior from proposals, documentation
corrections, dependency/release metadata and popularity counters. None of those
metadata updates establishes a quality or performance improvement.

Review packets retain complete bounded path inventories and exact source
versions. Six initial oversized full diffs required explicit targeted expansion;
the narrow Oh-my-Openagent follow-up separately inspected account-inventory
behavior rather than inferring a behavioral change from mirror-version comments.
The later Orca review likewise used a complete 4,227-path inventory, a bounded
six-file diff and three current modules after its full diff exceeded the bound.
No upstream program, model, provider, browser application or source test suite
was executed for these source reviews. Authored upstream fixtures were inspected
as evidence of intended coverage, not reported as passing tests.

Research-tool fixtures, static citation checks, full Teamagent verification and
signed publication are recorded separately in the
[measurement record](../data/research-reconciliation-2026-11-01.json) and workflow
receipts. Source hash/link availability does
not prove the semantic conclusion, provider readiness or whole-project safety.

The completed Teamagent implementation gate passed 548 Bun tests with one
existing POSIX-only skip on Windows, plus formatting, types, lint and live
LF/export integrity. The subsequent review gate passed using validated reusable
results and live integrity checks. Final citation validation checked 5,409 pinned
source references against 4,800 exact Git blobs and 13,111 relative links, with
zero issues or unmapped pinned external sources. These local results do not
establish upstream runtime behavior or live provider readiness. Final frozen-task
verification, signature and publication outcomes remain separate workflow receipts.
