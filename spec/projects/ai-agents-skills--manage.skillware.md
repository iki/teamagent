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

<!-- teamagent-analysis:start -->
Analysis metadata: source [manage.skillware](https://github.com/ARPAHLS/skillware); analyzed commit `2d59fadc583b67071c47a7e0870bfaf9f95431b8`; commit date 2026-10-02T19:00:24+03:00; review date 2026-10-04; depth source-reviewed. [Maintenance record](../analyses/repos/ai-agents-skills--manage.skillware.md).
<!-- teamagent-analysis:end -->
