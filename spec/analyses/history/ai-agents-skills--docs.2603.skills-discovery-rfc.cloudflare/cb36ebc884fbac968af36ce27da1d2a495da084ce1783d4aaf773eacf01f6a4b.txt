# Cloudflare Agent Skills discovery RFC

Source: [cloudflare/agent-skills-discovery-rfc](https://github.com/cloudflare/agent-skills-discovery-rfc) · Reviewed revision: `1bd1167983fa5ac9cd47987710c525308eda1a98` · Review date: 2026-10-04.

Depth: **source-reviewed** (static source/content inspection; repository-wide audit not claimed). Related directions: [skills](../skills.md) · [import-generation](../import-generation.md).

## Evidence inspected

- [`README.md` lines 28–46](https://github.com/cloudflare/agent-skills-discovery-rfc/blob/1bd1167983fa5ac9cd47987710c525308eda1a98/README.md#L28-L46)
- [`README.md` lines 67–129](https://github.com/cloudflare/agent-skills-discovery-rfc/blob/1bd1167983fa5ac9cd47987710c525308eda1a98/README.md#L67-L129)
- [`README.md` lines 163–180](https://github.com/cloudflare/agent-skills-discovery-rfc/blob/1bd1167983fa5ac9cd47987710c525308eda1a98/README.md#L163-L180)

## Observed architecture and behavior

The inspected draft describes a predictable web discovery endpoint under /.well-known/agent-skills/index.json. Its v0.2 changelog replaces the earlier path and manifest structure with a schema URI and one artifact per entry, identified by type, URL, and SHA-256 digest. Single-file skills and archive bundles are distinct distribution forms. The document calls out traversal, symlinks, decompression bombs, and nonexecution of discovered scripts. It is a proposal and example implementation repository, not proof that every publisher or client follows it.

## Implications and tradeoffs for Teamagent

This gives Teamagent a useful domain-to-catalog resolver alongside Git-based discovery. The resolver should negotiate known schema versions and keep the source domain, artifact URL, retrieval time, digest, and trust decision. A digest verifies that retrieved bytes match an index; it does not prove the publisher is trustworthy or prevent a compromised index from advertising malicious new bytes. Resolve redirects and remote destinations under network policy, enforce archive limits, and preserve a pinned artifact across retries. Lazy loading can reduce context, but should never bypass admission review for scripts or capability requests embedded in the body.

## Adoption decision

Implement as an optional discovery provider behind a versioned schema adapter. Support only explicitly understood versions, display unsupported entries as unavailable, and keep a Git/manual import fallback. The first release should register metadata and download to quarantine; activation remains a separate lifecycle step. Test stale indexes, digest mismatches, cross-origin URLs, malicious paths, oversized archives, and interrupted downloads before enabling unattended refresh.

## Verification boundary

No project code, models, installers, or benchmarks were executed during this review. Tests and documentation show intended contracts; they do not establish measured performance, production readiness, or a complete security assessment. Recommendations above are design inferences from the cited snapshot. Verify current APIs, licensing, and deployment requirements before integration.
