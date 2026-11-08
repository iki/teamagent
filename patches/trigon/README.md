# Selected shared dependency fixes

`registry.json` pins the canonical [Patches](https://github.com/iki/patches)
revision and selected artifact mappings. `catalog.json` and `migration.json`
are exact, hash-bound snapshots from that revision, including reusable upstream
provenance and retained notices. Original consumer context remains in the local
adoption archives. The directory name and
executable artifact paths remain historical compatibility paths; Patches now
owns updates. Ordinary integrity checks use these local copies only.

The ownership migration preserves all three implementation hashes and the
existing Aube selector/lock. Tauri's ID is unchanged; Tinypool's selection now
uses canonical `tinypool-windows-hide-process-workers`, with the old
`tinypool-windows-hide` alias preserved in the archived prior catalog. Refresh stages a
checked canonical candidate without promoting it. The original selected
registry is preserved in the local immutable adoption archives, so the historical
observations below retain their original source identity.

The November 8 neutral-catalog adoption records every previous mapping in
[`adoption.json`](../provenance/catalog-neutral-20261108/adoption.json), beside
the exact original selection, registry and migration snapshots. It preserves
the three executable files, Aube bundle/selector, existing notices and v1
selection shape while adding the required neutral-catalog contribution notice.
Offline catalog validation and the consumer's ordinary regression checks remain
separate evidence.

On 2026-11-01, the selected source advanced to signed Trigon commit
[`9ef18967b46fe01571933c3ba6216823ad961c16`](https://github.com/iki/trigon/commit/9ef18967b46fe01571933c3ba6216823ad961c16),
published on `codex/tinypool-windows-hide-2-2-0` without merging into main or
enqueuing integration. The [Tinypool 2.2.0 artifact](tinypool@2.2.0.patch) preserves
the [supplied bundle](https://github.com/iki/trigon/blob/9ef18967b46fe01571933c3ba6216823ad961c16/patches/tinypool@2.2.0.patch)
bytes: SHA-256 `de8f773eec7e3e36c669f0a21df874afe37d23f88efc1b61498602a9701253be`.
On 2026-11-02, the [subsequent source review](../../spec/analyses/project-launcher-sync-2026-11-02.md)
confirmed that source main includes this branch through merge
[`989e4a8fc16855ac037687c6ed7241c926ec74ab`](https://github.com/iki/trigon/commit/989e4a8fc16855ac037687c6ed7241c926ec74ab).
The supplied patch and Teamagent artifact still share Git blob
`8e3b4d9cf0430855cdbb19d0cad7a19aac90bec8`. The preserved original registry and November 1 evidence
retain their original selection and then-unmerged status; this later observation
does not rewrite that provenance or establish a new installation result.
It adds only `windowsHide: true` after the internal process-worker options spread.
Oxfmt 0.74.0 consumes Tinypool transitively; the exact
`aube.patchedDependencies["tinypool@2.2.0"]` selector references this registered
artifact without adding a direct Tinypool dependency.

The [source regression](https://github.com/iki/trigon/blob/9ef18967b46fe01571933c3ba6216823ad961c16/test/tinypool-windows-hide.test.ts)
and [adapted consumer regression](../../test/tinypool-windows-hide.test.ts) inspect
the resolved formatter dependency before running a real process-worker task and
joining teardown. Each real-worker test first requires the no-launch hidden-options
check. This checks supplied options and lifecycle; native window visibility is
separate evidence. Offline registry/artifact validation does not prove that Aube
applied the patch to the installed consumer. Record the actual install, frozen
install, resolved-package regression and final repository checks separately in
the [maintenance evidence](../../spec/data/research-maintenance-2026-11-01.json).

The two Tauri adapter files under `app/dependencies/trigon/` are byte-identical
copies from [Trigon at the reviewed commit](https://github.com/iki/trigon/tree/454e372cbc6bb75eafbbc4795391c492bc4fbf96/app/trigon-check).
Their recorded compatibility covers the historical CLI 2.12.1 observation and
the supplied conservative guard at CLI 2.12.4. The latter does not claim a newly
reproduced upstream defect. Any absent or incompatible dependency workaround
requires asking the user and keeping the implementation owned by Patches.
The canonical migration rechecks those adapters and required notices against
the selected catalog; existing artifact hashes and historical compatibility
claims remain unchanged.

The accompanying [license](LICENSE.md) is preserved byte-for-byte from
[Trigon's proprietary EULA](https://github.com/iki/trigon/blob/454e372cbc6bb75eafbbc4795391c492bc4fbf96/LICENSE.md),
copyright 2026 Jan Killian and Lucie Manawa. This task explicitly requests reuse
in Teamagent; it does not establish a general redistribution or open-source
license grant. Preserve these notices and evaluate publication rights before
redistributing the supplied files. Package licenses and application distribution
policy remain separate.

The migration also retains Tauri's upstream MIT notice at
`licenses/tauri/LICENSE-MIT` and Tinypool's upstream notice at
`licenses/tinypool/LICENSE`. The selected catalog records which notices apply
to each artifact. Public publication of the canonical catalog is explicitly
authorized, but no source notice is replaced and no blanket license is assigned.
