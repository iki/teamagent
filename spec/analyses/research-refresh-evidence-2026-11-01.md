# Research refresh evidence — 2026-11-01

[Maintenance contract](../research-sync.md) · [Analysis catalog](README.md) · [Portable measurements and receipt hashes](../data/research-maintenance-2026-11-01.json)

The refresh processed all 548 configured Git sources and 43 text resources. Git synchronization completed its inventory with two explicit exceptions; it returned a partial result, not an all-success result. Analysis preparation identified 272 source reviews. Source inspection, editorial promotion and final repository verification are separate operations: this document records the refresh and evidence used for review, without certifying every upstream project or a later publication tree.

The linked JSON retains command outcomes, measurements, SHA-256 identities and exact expansion scopes. Local `.cache/research/refresh-2026-11-01/` locators are audit aids, not required documentation dependencies or public source citations. They may be absent on another development machine. Reports cite immutable upstream GitHub revisions and preserve their earlier findings. Neither the local caches nor this summary contain authorization to publish a later tree.

## Source and text synchronization

| Operation | Measured result | Meaning |
| --- | --- | --- |
| Final source import | 548 entries; exit 0; 1.956 seconds | Regenerated parent declarations became repository-owned inventory. |
| Full Git sync | 548 checked; exit 1; 395.319 seconds; owned process closed | Discovery completed, with retained operational exceptions below. |
| Analysis preparation | 549 ledger records; exit 0; 84.838 seconds | 255 changed, 16 unreviewed, 1 history-diverged, 276 current and 1 archived before review promotion. |
| Text resource sync | 43 selected; exit 0; 2.760 seconds | One initial import and 42 locally validated static pins; 32 usable-text and 11 partial results. |

These are whole-command wall-clock observations, not controlled benchmarks. Bun reported `1.4.2 (744846f84)` on Windows x64. The runner selected the provisioned Aube 2.5.1 executable; these captures did not independently query its version. Other tool versions are not inferred from earlier tasks.

The first source import returned 489 entries because the regenerated parent category `ai-get` was not recognized. The reviewed alias now preserves canonical `ai-query` inventory/report identities while finding existing checkouts under either category. Ambiguous copies, origin mismatches and case-folded ID collisions fail explicitly. A later import restored 548 entries; the final import additionally normalized IDs to lowercase while preserving display/cache spelling, including `YuE2-Studio`. Parent exports remain regenerable input data. They do not own the updater, portable review state or historical report identities.

The full Git receipt originally recorded 457 unchanged, 86 updated, one cloned, one unchanged-with-local-changes, one updated-with-local-changes, one blocked and one labeled diverged. The last label was subsequently diagnosed as an operational failure in MentisDB, not proven divergence. Wayland's local changes and Hyperframes' local changes were preserved. YuE2-Studio was the fresh clone. The source inventory remained complete even though the operation returned nonzero for exceptions.

The new static article is [Fine-grained version control for agents](https://delta.dev/blog/fine-grained-version-control-for-agents), captured as `agents.261029.fine-grained-version-control.delta.md`. Its publisher metadata gives the date 2026-10-29; first capture was 2026-11-01 at 08:51:18.154 UTC. The importer measured 383,588 original bytes, 31,446 Markdown characters and three captured images, with content hash `6e188765049d9c9caa679bdad9b4a56e62286d866798b5279260364bb95faef2`. Image count does not prove fidelity or completeness, and publisher dates are assertions rather than independent verification. The 42 previous static resources were not remotely refreshed. The 11 partial results retain their social-page/PDF/extraction limitations; a successful synchronization does not erase those limits.

## Frozen review evidence

The reviewed observation is bound to SHA-256 `b6ab5aa8478f017f88ac445521b64965d3ede42b0370c262d46e3ee4e117b8ac`. The pre-promotion analysis ledger is bound to `eaefa252986c5105340764b750a4b6c46098190a4b8332cbe232b9871b402c7c`. Captures read committed Git objects, with bounded output and explicit source identity; they did not execute repository code, source skills, tests or model/provider requests.

MentisDB was handled separately because its checkout could not advance. For the other 271 review identities, a read-only integrity audit checked exact canonical response hashes, source/revision identities, producer hashes and frozen inputs. A separate capture-provenance audit reconciled pending/completion receipts and partition identities. Both audits reported zero missing packets and zero failures. Their `reviewApproval:false` status is deliberate: evidence validity does not establish that a report's conclusions are correct.

All 271 packets had complete summaries. Only 164 had complete full comparisons. Ninety-one full comparisons were unavailable within the collection boundary; 16 new sources had no prior comparison. Thus 107 packets required explicit source expansion. An unavailable comparison was never silently replaced with commit titles or described as complete review.

The captured expansion inventory contains 18 batches, 212 explicit requests across 108 repository identities: 116 source slices and 96 path-scoped comparisons. Of these, 207 completed and five retained unavailable outcomes. The JSON records every requested path/range/version and evidence hash. These counts describe retrieval, not the number of fully reviewed files. Each report identifies the functions and fixtures actually inspected, the adoption consequence and the remaining scope.

Expansion requests were limited to 64 per batch, four workers, 600 lines per source slice, one to eight literal paths per comparison and a 128 MiB evidence store. Narrow reads could be expanded deliberately; the collector did not retry failures or execute source programs. Five unsuccessful requests have specific dispositions:

- Two ClosedLoop after-ranges ending at line 200 exceeded the current 113-line implementation and 189-line fixture. Complete bounded reads subsequently supplied those files.
- A third ClosedLoop path is absent at the current revision. The preserved before-source and two-tree comparison were inspected; this does not prove equivalent behavior disappeared from every other path.
- Two Microsoft agent-framework direct source reads rejected changed-size/opaque text. Their exact paths were available through a complete 30,511-byte scoped comparison, which was inspected instead. The direct reads remain unavailable. The original comparison hash is `b53004d5143435cee656634b25cdc7dc328f73fde31e2f4e696596e3dca2975a`.

## Original bytes and diagnostic presentation

An original Git blob/comparison hash identifies different bytes from a redacted LF presentation hash. The task-local inspector applies `diagnostic()` to source presentation. That function removes sensitive URL components but also reparses URLs: it can add a trailing slash or encode characters that are significant in a source literal. The presentation therefore supports scoped reading, not byte-exact claims about every URL or regular expression.

An A2UI review raised a question about a URL-origin comparison. A standard URL primitive probe used the displayed literal; it did not execute upstream code. A subsequent bounded read of the exact original object established that the source literal had no trailing slash and the diagnostic presentation had added one. The original object hash was `f80bce443507829955d975a1deee098363427c387c2d0537f12d5d715818349a` at commit `825beac2813a6d0ccef3b6fb4124ad6c3c8419f0`. No upstream defect was established or published from that probe. Exact-literal questions require this separate original-object check, with only necessary safe facts exposed.

The first full MentisDB diff capture completed with exit 0 and confirmed process closure, but an outer `diagnostic()` pass over the already serialized inspector JSON broke escaped quoting around URLs. JSON decoding failed. The original log and receipt remain retained with an explicit rejection record; they were not used for source claims. Process success is insufficient evidence validity. A separate Mentis-only expansion preserved structured decoding and canonical response hashing, passed its boundary self-test and produced a complete four-path comparison. Its batch receipt hash is `dee6815e0a35ce25b38ec670698e8b0078fb7d253d6bb405623a6cc8a5953e5b`.

The reusable operational rule is to validate structured output before using it, keep original and presentation hashes distinct, and apply redaction to selected fields before serialization. Never run a text-oriented diagnostic transform over serialized JSON that must later be decoded. Rejected evidence stays retained; it is not repaired in place or promoted because its producer exited successfully.

## Verification and process ownership

Earlier successful maintenance checks and failed attempts remain in the linked measurement record. The later full step run executed format, types, lint and tests: 519 passed, one existing Windows-inapplicable POSIX-pipes test was skipped, and none failed across 67 files. The overall command still failed after 276.475 seconds because the live LF gate found CRLF in four generated review partitions. This is a failed gate, not successful verification with a cosmetic warning.

Before normalization, exact original partition bytes were retained as base64 with original hashes. LF versions received new hashes, and semantic JSON equality was checked. The capture audit verified that migration relationship instead of rewriting earlier producer identities. This four-file maintenance event did not advance any analyzed source SHA.

The follow-up step completed in 85.674 seconds with exit 0 and confirmed process closure. It validated and reused matching cooperative format/types/lint/test receipts, then reran live LF and export-integrity checks. It was not a new execution of all unit tests. That live check covered 20,612 text files, 3,155 opaque files, 27 hash-verified historical inputs, 3,082 retained originals and 79 text exports containing 938 files, with zero missing/linked entries. Later report/document edits still require the repository's normal final gate. Neither elapsed-time difference establishes a controlled speedup.

The user-observed console windows led to explicit hidden-window settings at reviewed nested launch boundaries. Bun/Node launch options require an effective `windowsHide:true`; the reviewed Python and PowerShell/.NET launch sites request native console suppression. The binding-aware lint fixture checks aliases and option overwrite order. Real async and sync Bun fixtures measured a native child's Windows console visibility while checking Unicode stdin, quoted arguments, stderr and a deliberate nonzero exit. The focused six-file Windows run passed 17 tests; the launch-rule fixture also passed. These are local Windows measurements, not other-platform or upstream source-test results. An outer hidden supervisor alone does not hide grandchildren.

An earlier Git attempt was deliberately interrupted after 62 completed rows when the parent category move was discovered. Reconciliation established that its helper was absent, no active Git processes were observed, and the maintenance lock could be acquired/released without deleting it. Completed rows and pending evidence were preserved before the deliberate full rerun. Two separately reviewed stopped scratch directories were removed only after marker/path/owner reconciliation; other scratch and research evidence were preserved. The [resource contract](../resources.md) now distinguishes immediate creator-proof recovery from conservative stale-folder pruning. An absent PID alone does not authorize evidence deletion or lock reclamation.

The Git recovery repair also separates proven non-ancestry from operational fast-forward rejection and uncertain timeout/transport. Its bounded diagnostics retain allowlisted classifications and captured-text hashes without raw private Git/filter payloads. Those hashes describe UTF-8 re-encoded captured text, not necessarily original native stream bytes. No automatic reset or retry was added.

A preliminary offline citation check examined 12,385 relative links, 4,893 pinned source links and 4,337 unique Git blobs in 118.071 seconds. It found zero unmapped external-source links but returned failure for three issues: two links targeted this then-unwritten document, and a source URL containing literal parentheses was misparsed by the Markdown-link checker. The document was subsequently written and that URL was percent-encoded. The later full check passed in 111.726 seconds: 4,894 pinned source links, 4,338 unique Git blobs, zero issues and zero unmapped external citations. A subsequent relative-link-only check passed for 12,404 links without replacing the stronger pinned-source receipt. Blob/line availability does not establish semantic correctness, upstream execution or live public reachability.

The final ledger audit checked all 549 identities, 272 promoted review requests,
549 report digests, 46 topic links for newly catalogued sources and 3,413 history
files. All 2,869 history files tracked at the original task baseline retained
their exact Git blob bytes. It reported zero issues. Earlier attempts could not
resolve bare-name Git in the cache helper; their failure evidence is preserved.
Selecting a verified physical Git executable repaired that read-only audit.

The full implementation step passed in 312.278 seconds before the subsequent
console-launch follow-up. The user then described brief blank PowerShell
windows. A new native probe separately reproduced a visible Python console with
Bun 1.4.2's Node-compatible `spawn`, `windowsHide:true` and `detached:true`;
the non-detached launch passed. This establishes a launch defect, not attribution
of the reported PowerShell windows. The formatter's Tinypool constructor also
omitted `windowsHide`; an isolated mock stopped before native fork. Its recorded
default is an inference from the API declaration, not a visibility measurement.
The corrected production policy keeps POSIX detachment and disables it on
Windows. The compiler now resolves its exact installed native executable through
the owned process boundary, with pinned package/layout validation, rather than
using the upstream JavaScript subprocess launcher. A subsequent focused run
passed 30 tests in seven files, including real Windows signal/cleanup, native
compiler and Git-hook launch checks. Its concurrent 90-second WinEvent monitor
recorded no new console-class SHOW/HIDE events; existing user terminal windows
were recorded separately. This bounded observation covers selected top-level
window classes, and callbacks can outlive short-lived windows. It does not prove
the absence of all possible windows or attribute the earlier PowerShell flashes.

The [supplied Tinypool fix](../dependencies.md) is now mirrored byte-for-byte
from signed, unmerged source revision
`9ef18967b46fe01571933c3ba6216823ad961c16`. The expected pre-patch rejection and
initial source-only tests remain historical evidence. After import, the frozen
install passed with unchanged installation-input hashes, and all 14 Teamagent
regressions passed. Root separately reviewed the complete manifest, lock and
workspace diff: only the selected patch mapping, exact patch hash and the
existing Oxfmt/Tinypool edge and snapshot binding changed; no package versions
or declared lifecycle-trust policy changed. Hash equality alone does not
establish that semantic review.

The subsequent complete implementation check executed all four check groups
and passed 527 tests across 69 files, with only the existing POSIX test skipped
on Windows. A later focused run passed 32 tests across eight files and ran the
actual formatter. Its concurrent 90-second WinEvent observation recorded no new
matching console-class events. This remains bounded visibility evidence and
does not identify the cause of the earlier PowerShell flashes.

The automated active-spec citation audit passed for 4,894 pinned source links
and 4,338 unique blobs, with no issues or unmapped sources. It excludes patch
README links; exact supplied patch/source-fixture checks remain separate. A
separate explicit local refetch recovered the same signed source commit into
the citation cache after a confirmed local rejection and read-only
reconciliation. The earlier public-fetch failure remains retained; public
reachability is not established. Receipt hashes, actual measurements and
limits are in the linked measurement record. Final frozen-workflow review and
Teamagent publication remain pending. The user-deferred shared patch-management
extraction proposal is not part of this implementation.

## Unresolved remote or platform state

[MentisDB](../projects/ai-agents-mem--mentisdb.md) was reviewed only at checked-out `67cb559d3b004951232387ea694df4c490d12ba1`, against the prior baseline `a3f32e5d4514beea1b3f96a585c5cc5844606326`. Fetched `203a19f4447a738c0370b20aa46e9aa21a60ef6e` remains unreviewed and not checked out. Bounded history inspection found zero local-only and 16 upstream-only commits; local HEAD is an ancestor. A read-only tree check reproduced Windows rejection of `fuzz/corpus/chain_key/nul`. An isolated sparse-checkout fixture still rejected a reserved `nul` path during fast-forward. Source protection settings were not relaxed, no reset or force checkout was performed, and no portable workaround is claimed. Its report scopes the access-policy/signing review; it does not certify the entire 56-path update.

[The Vasilyu skills bundle](../projects/ai-skills--bundle.vasilyu83.md) remains `not_found_or_inaccessible` after three recorded authenticated 404 observations across dates. The retained checkout at `01246042082225a482980162543f453067143e8b` moved within its category to the current inaccessible prefix, and private backup status is recorded as complete. This establishes an operational access condition, not proof of deletion. Backup destinations and credentials are omitted here. A future explicit sync should recheck availability while preserving the report and retained source history.

These exceptions do not disappear when review promotion completes. Current analyzed coverage, current checkout state, upstream freshness and repository verification remain separate claims.
