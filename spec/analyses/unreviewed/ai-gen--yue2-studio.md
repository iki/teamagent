# yue2-studio

Source: [yue2-studio](https://github.com/timoncool/yue2-studio) · [generation](../../generation.md), [import-generation](../../import-generation.md), [models](../../models.md).

Initially discovered 2026-11-01T10:08:32.081Z as unreviewed. The scoped initial source review below supersedes that discovery-only status; it does not establish runtime validation. [Change evidence](../repos/ai-gen--yue2-studio.md).

## Source update reviewed 2026-11-01

Reviewed commit [`b4b6d362effd5ce2f53bec753fc04ada9a81ff50`](https://github.com/timoncool/yue2-studio/commit/b4b6d362effd5ce2f53bec753fc04ada9a81ff50).

Initial review of the complete [audio facts module](https://github.com/timoncool/yue2-studio/blob/b4b6d362effd5ce2f53bec753fc04ada9a81ff50/crates/music-server/src/audio_facts.rs) shows explicit mono 22.05 kHz preparation, overlapping beat-model inference and least-squares tempo fitting that accounts for skipped beats. Embedded deterministic tests cover mel conversion and beat spacing; the real-song test is ignored unless explicitly provisioned. GPU initialization can fall back to CPU and returns the observed selection. These are implementation details, not a measured accuracy or speed claim.

The complete [process-group helper](https://github.com/timoncool/yue2-studio/blob/b4b6d362effd5ce2f53bec753fc04ada9a81ff50/crates/music-engine/src/process_group.rs) attempts a Windows kill-on-close job, returns false when unavailable, and has a separate release operation for update installers. Teamagent must observe assignment and descendant shutdown rather than infer containment from an attempted call; an updater exception needs explicit ownership. Other process adoption, model provenance, music rights and the remaining 831-path source inventory were not exhaustively audited. No model, installer, upstream tests or native application was executed.

## 2026-11-01 external-update review

Reviewed [https://github.com/timoncool/yue2-studio](https://github.com/timoncool/yue2-studio) at `bd62c50e4b6ea7e0551b1378b198519b7e0376ce` against prior analyzed `b4b6d362effd5ce2f53bec753fc04ada9a81ff50`. Evidence: [docs/stars-dark.svg](https://github.com/timoncool/yue2-studio/blob/bd62c50e4b6ea7e0551b1378b198519b7e0376ce/docs/stars-dark.svg), [docs/stars-light.svg](https://github.com/timoncool/yue2-studio/blob/bd62c50e4b6ea7e0551b1378b198519b7e0376ce/docs/stars-light.svg).

The complete changed-path inventory contains only light and dark star-history SVG charts; the inspected chart labels advance to November 1. No synthesis, model-loading or export implementation changes in this delta.

**Architecture consequence:** Retain the previous candidate assessment. Repository popularity does not establish audio quality, commercial rights, training policy or runtime compatibility.

**Scope and limits:** Reviewed the two-path inventory and bounded chart metadata diff; long SVG geometry was intentionally not analyzed as code. No chart rendering or music generation was executed.

<!-- teamagent-analysis:start -->
Analysis metadata: source [yue2-studio](https://github.com/timoncool/yue2-studio); analyzed commit `bd62c50e4b6ea7e0551b1378b198519b7e0376ce`; commit date 2026-11-01T10:27:24Z; review date 2026-11-01T23:12:06.798Z; depth reviewed. [Maintenance record](../repos/ai-gen--yue2-studio.md).
<!-- teamagent-analysis:end -->
