# hanzo-sdk

Source: [hanzo-sdk](https://github.com/hanzoai/sdk) · [agents](../../agents.md), [models](../../models.md), [channels](../../channels.md).

Depth: **unreviewed**. Discovered 2026-10-24T06:36:54.441Z; no source code or capabilities reviewed. [Change evidence](../repos/ai-agents--hanzo-sdk.md).

## 2026-10-28 scoped source review

Source: [hanzo-sdk](https://github.com/hanzoai/sdk); inspected saved discovery revision `833140e79c6b80427200c4ae7dd6d5ff1aea7ebe`. This is an initial scoped review of this newly catalogued source.

**Scope:** Full 59-line SDK-index README and LICENSE header lines 1-18 read. Language SDK implementations, registries, private Rust source, gateway/model catalog and installation scripts were not reviewed.

The [README](https://github.com/hanzoai/sdk/blob/833140e79c6b80427200c4ae7dd6d5ff1aea7ebe/README.md#L3-L29) explicitly identifies this repository as a language-SDK index from which nothing ships. It distinguishes a Go module coordinate from the repository URL and discloses that some packages are sourced from repositories and Rust source is not public. Those are useful discovery qualifications, not verification that packages are currently published, APIs are compatible or all clients share equivalent behavior.

There is a concrete licensing discrepancy: the [README labels the project MIT](https://github.com/hanzoai/sdk/blob/833140e79c6b80427200c4ae7dd6d5ff1aea7ebe/README.md#L57-L59), while the checked-in [LICENSE begins with Apache License 2.0](https://github.com/hanzoai/sdk/blob/833140e79c6b80427200c4ae7dd6d5ff1aea7ebe/LICENSE#L1-L4). Preserve both observations and resolve the applicable rights before reuse; do not propagate the README label as established licensing. Treat gateway/model examples and the remote shell installer as unverified documentation. Keep this entry a navigation/index review, inspect a separately pinned language SDK before adoption, and never substitute an unread linked repository for this source. No packages, shell scripts, gateway or credentials were used.

<!-- teamagent-analysis:start -->
Analysis metadata: source [hanzo-sdk](https://github.com/hanzoai/sdk); analyzed commit `833140e79c6b80427200c4ae7dd6d5ff1aea7ebe`; commit date 2026-10-21T05:39:18-04:00; review date 2026-10-28T09:27:32.685Z; depth reviewed. [Maintenance record](../repos/ai-agents--hanzo-sdk.md).
<!-- teamagent-analysis:end -->
