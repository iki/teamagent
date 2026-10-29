# Trigon-owned dependency fixes

`registry.json` identifies the exact source revision, supported package pins and
SHA-256 of the supplied artifacts. The normal dependency check is offline and
does not require a sibling Trigon checkout. Refresh stages a candidate; it does
not change this registry or promote new bytes.

The two Tauri adapter files under `app/dependencies/trigon/` are byte-identical
copies from [Trigon at the reviewed commit](https://github.com/iki/trigon/tree/454e372cbc6bb75eafbbc4795391c492bc4fbf96/app/trigon-check).
Their recorded compatibility covers the historical CLI 2.12.1 observation and
the supplied conservative guard at CLI 2.12.4. The latter does not claim a newly
reproduced upstream defect. Any absent or incompatible dependency workaround
requires asking the user and keeping the implementation owned by Trigon.

The accompanying [license](LICENSE.md) is preserved byte-for-byte from
[Trigon's proprietary EULA](https://github.com/iki/trigon/blob/454e372cbc6bb75eafbbc4795391c492bc4fbf96/LICENSE.md),
copyright 2026 Jan Killian and Lucie Manawa. This task explicitly requests reuse
in Teamagent; it does not establish a general redistribution or open-source
license grant. Preserve these notices and evaluate publication rights before
redistributing the supplied files. Package licenses and application distribution
policy remain separate.
