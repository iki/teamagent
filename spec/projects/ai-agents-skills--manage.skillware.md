# Skillware

Source: [ARPAHLS/skillware](https://github.com/ARPAHLS/skillware) · Reviewed revision: `2d59fadc583b67071c47a7e0870bfaf9f95431b8` · Review date: 2026-10-04.

Depth: **source-reviewed** (static source/content inspection; repository-wide audit not claimed). Related directions: [skills](../skills.md) · [import-generation](../import-generation.md) · [agents](../agents.md).

## Evidence inspected

- [`skillware/core/loader.py` lines 78–138](https://github.com/ARPAHLS/skillware/blob/2d59fadc583b67071c47a7e0870bfaf9f95431b8/skillware/core/loader.py#L78-L138)
- [`skillware/core/loader.py` lines 199–280](https://github.com/ARPAHLS/skillware/blob/2d59fadc583b67071c47a7e0870bfaf9f95431b8/skillware/core/loader.py#L199-L280)

## Observed architecture and behavior

Skillware bundles manifest.yaml, instructions.md, a UI card, and a Python implementation. Its loader resolves direct paths or registry IDs across configured roots, performs optional dependency checks, and returns the bundle. execute_module=False is an explicit inspect-only mode. The default is execute_module=True, which imports skill.py through importlib and executes module initialization. Registry identity mismatches are warnings in the inspected implementation. This is an executable extension system as well as a library of model instructions.

## Implications and tradeoffs for Teamagent

The most useful concept is the separation of descriptive metadata, user-interface schema, requirements, and implementation. Teamagent can represent a callable capability with these facets while retaining a single policy-controlled execution service. Discovery should always select metadata-only inspection, because Python module initialization can have effects before the first skill invocation. Resolve publisher and bundle digest as identity rather than trusting a display name. Dependency checking is not an isolation boundary; a working import can still access the host's filesystem or network. Treat executable bundles more like plugins than passive knowledge documents.

## Adoption decision

Use individual bundles only after dependency, license, and behavior review, and borrow the inspect-only API for the internal registry. Do not directly import arbitrary discovered skills into the orchestrator process. Execute implementations in restricted workers with explicit tool scopes, isolated dependencies, and a typed result schema. Escalate manifest/path identity disagreement to a registration error for managed team libraries, while allowing explicit aliases recorded as metadata.

## Verification boundary

No project code, models, installers, or benchmarks were executed during this review. Tests and documentation show intended contracts; they do not establish measured performance, production readiness, or a complete security assessment. Recommendations above are design inferences from the cited snapshot. Verify current APIs, licensing, and deployment requirements before integration.

## Source update reviewed 2026-10-28

Reviewed commit: [`ad55a64ea41191e52fa9ee5d93d13ff414e3eec5`](https://github.com/ARPAHLS/skillware/commit/ad55a64ea41191e52fa9ee5d93d13ff414e3eec5). Scope: Read secret-provider, environment-loader and UI-schema implementations in full. Dynamic loading, discovery, matching and skill catalog execution were not audited.

The [secret-provider boundary](https://github.com/ARPAHLS/skillware/blob/ad55a64ea41191e52fa9ee5d93d13ff414e3eec5/skillware/core/secrets.py) supports injected mappings and host callbacks, resolves only manifest-declared keys and reports missing required names without printing values. This is useful for separating tenant credentials from process-global state, but a manifest's declaration is not authorization to receive a secret: Teamagent still needs an independent capability allowlist and bounded provider access. The [environment loader](https://github.com/ARPAHLS/skillware/blob/ad55a64ea41191e52fa9ee5d93d13ff414e3eec5/skillware/core/env.py) directly overwrites process environment entries and raises on malformed non-comment lines; it is unsuitable as a multi-tenant isolation mechanism.

The [UI-schema check](https://github.com/ARPAHLS/skillware/blob/ad55a64ea41191e52fa9ee5d93d13ff414e3eec5/skillware/core/ui_schema.py) verifies that each declared output-card key resolves in at least one sample. It does not validate field value types, require each sample to contain every key or reject all malformed sample entries. Preserve that narrow coverage meaning instead of claiming complete schema conformance. Adapt injected credential resolution and explicit output-shape fixtures behind Teamagent's Effect Schema and authorization boundaries; do not adopt the executable loader or catalog on this evidence. No skills or tests were executed.


## 2026-11-01 scoped source review

Reviewed commit `ed21f474925326eb14537baf3a8f6513dc8cb9f6` (commit date `2026-11-01T10:50:44+03:00`), compared with `ad55a64ea41191e52fa9ee5d93d13ff414e3eec5`. Earlier observations remain historical evidence.

**Scope:** Loader schema-construction diff, complete new geo-IP URL/redirect validator and selected network-skill rejection fixtures. HTTP connection/proxy address binding, the entire skill catalog and hosted execution were not audited.

The [loader](https://github.com/ARPAHLS/skillware/blob/ed21f474925326eb14537baf3a8f6513dc8cb9f6/skillware/core/loader.py) constructs tool declarations through the SDK model validator rather than a raw dictionary. The new [URL validator](https://github.com/ARPAHLS/skillware/blob/ed21f474925326eb14537baf3a8f6513dc8cb9f6/skills/networking/geo_ip_rotator/ssrf.py) rejects prohibited schemes, local/metadata destinations and unsafe resolved addresses, and rechecks redirect targets. However, its DNS-failure branch permits a designated documentation-domain set and supplies a hardcoded public address; that branch is a testing convenience, not evidence that the requested destination resolved. [Fixtures](https://github.com/ARPAHLS/skillware/blob/ed21f474925326eb14537baf3a8f6513dc8cb9f6/skills/networking/geo_ip_rotator/test_skill.py) cover local/private/metadata destinations and a prohibited redirect. These checks alone do not establish that the subsequent connection uses the validated address.

**Teamagent implication (inference):** Retain explicit schema validation and redirect checks, but keep failed DNS resolution unknown and blocked in production. Bind validation to the actual connection destination and proxy policy, and isolate executable skills from the orchestrator. A catalog trust label or validated tool schema is not authorization or network containment.

**Verification limit:** committed-source inspection only; no upstream code, tests or provider calls were executed. Review scope is the cited implementation or authored guidance, not whole-project correctness, licensing clearance or measured performance. Source passages were redacted for review; exact URL literals were not byte-validated.

<!-- teamagent-analysis:start -->
Analysis metadata: source [manage.skillware](https://github.com/ARPAHLS/skillware); analyzed commit `ed21f474925326eb14537baf3a8f6513dc8cb9f6`; commit date 2026-11-01T10:50:44+03:00; review date 2026-11-01T11:35:43.470Z; depth source-reviewed. [Maintenance record](../analyses/repos/ai-agents-skills--manage.skillware.md).
<!-- teamagent-analysis:end -->
