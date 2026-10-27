# OpenAI Skills catalog

Source: [openai/skills](https://github.com/openai/skills) · Reviewed revision: `49f948faa9258a0c61caceaf225e179651397431` · Review date: 2026-10-04.

Depth: **source-reviewed** (static source/content inspection; repository-wide audit not claimed). Related directions: [skills](../skills.md) · [agents](../agents.md) · [import-generation](../import-generation.md).

## Evidence inspected

- [`skills/.system/skill-installer/scripts/install-skill-from-github.py` lines 32–117](https://github.com/openai/skills/blob/49f948faa9258a0c61caceaf225e179651397431/skills/.system/skill-installer/scripts/install-skill-from-github.py#L32-L117)

## Observed architecture and behavior

The inspected installer models a GitHub source using owner, repository, ref, paths, and optional repository URL. Download mode validates the GitHub host, retrieves an archive into temporary storage, checks extraction paths against the destination's real path, and rejects repository-relative paths that escape upward. The repository supplies concrete system and curated skill content, but this review focused on installer mechanics rather than claiming every bundled skill was audited.

## Implications and tradeoffs for Teamagent

These checks are useful building blocks for skill acquisition and show why installation must be a distinct service. Teamagent needs to preserve the source ref and content digest, check file/resource relationships, and register an immutable revision before activation. Host-specific default installation directories should be hidden behind the agent adapter. Archive containment addresses one class of attack; it does not establish source trust, safe script behavior, capability compatibility, or archive size limits. Imported instructions remain lower-trust artifacts until admitted under the task's policy. A public catalog can seed a library, but popularity and publisher identity cannot replace task evaluation.

## Adoption decision

Use the upstream catalog as a curated candidate source and its installer as an optional native integration for the corresponding host. Avoid copying the whole catalog into every prompt or rewriting an existing installation without a rollback path. Wrap acquisition with byte/file limits and source lock records. Evaluate a small selected set per target model and harness, especially tool-specific media and document workflows whose execution environments differ substantially.

## Verification boundary

No project code, models, installers, or benchmarks were executed during this review. Tests and documentation show intended contracts; they do not establish measured performance, production readiness, or a complete security assessment. Recommendations above are design inferences from the cited snapshot. Verify current APIs, licensing, and deployment requirements before integration.

<!-- teamagent-analysis:start -->
Analysis metadata: source [agent-codex](https://github.com/openai/skills); analyzed commit `49f948faa9258a0c61caceaf225e179651397431`; commit date 2026-06-23T19:36:12-07:00; review date 2026-10-04; depth source-reviewed. [Maintenance record](../analyses/repos/ai-skills--agent-codex.md).
<!-- teamagent-analysis:end -->
