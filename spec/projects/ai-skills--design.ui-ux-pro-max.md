# design.ui-ux-pro-max

Source: [design.ui-ux-pro-max](https://github.com/nextlevelbuilder/ui-ux-pro-max-skill) · Category: [ai-skills](../categories/ai-skills.md)

Review depth: **inventory / README screening only**. This is an individual coverage record, not a source-code correctness audit or adoption recommendation.

Snapshot: `477bcb28c9812b385cb51a4605ddf30d7b2266e2`; commit timestamp `2026-10-03T23:05:26+07:00`; 682 tracked paths.

## Scope and evidence

Upstream description excerpt (a project claim, automatically extracted from [README](https://github.com/nextlevelbuilder/ui-ux-pro-max-skill/blob/477bcb28c9812b385cb51a4605ddf30d7b2266e2/README.md)):

> An AI skill that provides design intelligence for building professional UI/UX across multiple platforms and frameworks. Visual inspiration, not a benchmark.  An author-supplied project recorded  before  this skill existed; its UI contains Vietnamese. Historical footage, not an English demo or a runtime test of the skill — see  media provenance .

Build/package evidence: [.claude/skills/ui-styling/scripts/requirements.txt](https://github.com/nextlevelbuilder/ui-ux-pro-max-skill/blob/477bcb28c9812b385cb51a4605ddf30d7b2266e2/.claude/skills/ui-styling/scripts/requirements.txt); [.claude/skills/ui-styling/scripts/tests/requirements.txt](https://github.com/nextlevelbuilder/ui-ux-pro-max-skill/blob/477bcb28c9812b385cb51a4605ddf30d7b2266e2/.claude/skills/ui-styling/scripts/tests/requirements.txt); [cli/assets/skills/ui-styling/scripts/requirements.txt](https://github.com/nextlevelbuilder/ui-ux-pro-max-skill/blob/477bcb28c9812b385cb51a4605ddf30d7b2266e2/cli/assets/skills/ui-styling/scripts/requirements.txt); [cli/assets/skills/ui-styling/scripts/tests/requirements.txt](https://github.com/nextlevelbuilder/ui-ux-pro-max-skill/blob/477bcb28c9812b385cb51a4605ddf30d7b2266e2/cli/assets/skills/ui-styling/scripts/tests/requirements.txt); [cli/package.json](https://github.com/nextlevelbuilder/ui-ux-pro-max-skill/blob/477bcb28c9812b385cb51a4605ddf30d7b2266e2/cli/package.json)

License evidence: [LICENSE](https://github.com/nextlevelbuilder/ui-ux-pro-max-skill/blob/477bcb28c9812b385cb51a4605ddf30d7b2266e2/LICENSE) Classification hint: MIT. A root license does not establish rights for every bundled asset, model, or dependency.

## Harness assessment

This entry was catalogued under **ai-skills**. Its category places it in the candidate set for skills; those associations are navigational and have not been individually validated as implemented capabilities. See [skills](../skills.md) for the source-reviewed alternatives and proposed integration boundaries.

**Disposition:** retain as a comparison candidate. Before adopting it, inspect the implementation entry point and its tests, verify the required protocol and deployment platform, and reproduce a task from the harness evaluation suite. Popularity, a README feature list, and the presence of a package manifest are insufficient evidence of quality or compatibility.

**Unresolved:** runtime behavior, security boundaries, performance, API/subscription eligibility, dependency health, maintenance status, and fit to the proposed harness were not independently established for this entry. No repository code was executed as part of this screening.

## Source update reviewed 2026-10-28

Reviewed commit: [`28b3b8dee8c976df4fa3e94aed4e092ad43fcb03`](https://github.com/nextlevelbuilder/ui-ux-pro-max-skill/commit/28b3b8dee8c976df4fa3e94aed4e092ad43fcb03). Scope: Full uninstall command and corporate-identity generator tests read. Platform configuration, deletion helpers, generator implementation and provider/image validation were not audited.

The [uninstaller](https://github.com/nextlevelbuilder/ui-ux-pro-max-skill/blob/28b3b8dee8c976df4fa3e94aed4e092ad43fcb03/cli/src/commands/uninstall.ts) derives modern and legacy platform locations from shared configuration, includes bundled sibling skills and defaults confirmation to no. It recursively removes matching directories without checking an ownership manifest or local modifications in this function, and catches all platform-configuration errors before falling back to legacy locations. Confirmation of a product name does not prove every matching path is owned by that install; adopt contained, ownership-aware deletion receipts instead.

The [generator fixtures](https://github.com/nextlevelbuilder/ui-ux-pro-max-skill/blob/28b3b8dee8c976df4fa3e94aed4e092ad43fcb03/.claude/skills/design/scripts/tests/test_cip_generate.py) isolate the SDK and restore module state, test extension selection, model overrides, no-call prompt-only mode and failure exit codes. They explicitly accept exit zero when only part of a requested set succeeds. Their tiny signature-like byte fixtures are not valid decoded image verification, and a constant model ID assertion does not establish provider availability. Preserve requested/generated/failed item counts and validate bytes independently before publication. No uninstall, provider request, image generation or tests were run.

## 2026-11-01 scoped source review

Reviewed commit `3a13158ff1f32156cbe144108de48eda2ecaed9a` (commit date `2026-11-01T14:04:28+07:00`), compared with `28b3b8dee8c976df4fa3e94aed4e092ad43fcb03`. Earlier observations remain historical evidence.

**Scope:** Complete search-loader and applicability-version diffs; 33 changed paths inventoried. Search implementation, guidance corpus and embedded-Python execution not audited.

The [search entry](https://github.com/nextlevelbuilder/ui-ux-pro-max-skill/blob/3a13158ff1f32156cbe144108de48eda2ecaed9a/cli/assets/scripts/search.py) prepends its own absolute script directory before importing sibling core/design-system modules, accommodating embedded isolated Python that omits that directory. The [core declaration](https://github.com/nextlevelbuilder/ui-ux-pro-max-skill/blob/3a13158ff1f32156cbe144108de48eda2ecaed9a/cli/assets/scripts/core.py) updates a stack applicability version. This is a loading/metadata change, not validation of the guidance against that framework release.

**Teamagent implication (inference):** Provision skill executables as trusted, hash-bound bundles including sibling modules. Resolve imports independently of the caller's working directory while retaining code trust and compatibility checks; a version label alone does not establish a tested harness/model variant.

**Verification limit:** committed-source inspection only; no upstream code, tests or provider calls were executed. Review scope is the cited implementation or authored guidance, not whole-project correctness, licensing clearance or measured performance. Source passages were redacted for review; exact URL literals were not byte-validated.

<!-- teamagent-analysis:start -->
Analysis metadata: source [design.ui-ux-pro-max](https://github.com/nextlevelbuilder/ui-ux-pro-max-skill); analyzed commit `3a13158ff1f32156cbe144108de48eda2ecaed9a`; commit date 2026-11-01T14:04:28+07:00; review date 2026-11-01T11:37:37.120Z; depth screened. [Maintenance record](../analyses/repos/ai-skills--design.ui-ux-pro-max.md).
<!-- teamagent-analysis:end -->
