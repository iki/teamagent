# Everything Claude Code: continuous learning

Source: [affaan-m/everything-claude-code](https://github.com/affaan-m/everything-claude-code) · Reviewed revision: `ef648e01899ba3e8dc6371642deaaf64b4477775` · Review date: 2026-10-04.

Depth: **source-reviewed** (static source/content inspection; repository-wide audit not claimed). Related directions: [skills](../skills.md) · [memory](../memory.md) · [evolution](../evolution.md).

## Evidence inspected

- [`skills/continuous-learning-v2/SKILL.md` lines 1–110](https://github.com/affaan-m/everything-claude-code/blob/ef648e01899ba3e8dc6371642deaaf64b4477775/skills/continuous-learning-v2/SKILL.md#L1-L110)
- [`skills/continuous-learning-v2/scripts/instinct-cli.py` lines 125–132](https://github.com/affaan-m/everything-claude-code/blob/ef648e01899ba3e8dc6371642deaaf64b4477775/skills/continuous-learning-v2/scripts/instinct-cli.py#L125-L132)
- [`skills/continuous-learning-v2/scripts/instinct-cli.py` lines 937–979](https://github.com/affaan-m/everything-claude-code/blob/ef648e01899ba3e8dc6371642deaaf64b4477775/skills/continuous-learning-v2/scripts/instinct-cli.py#L937-L979)

## Observed architecture and behavior

The reviewed continuous-learning subsystem stores atomic trigger/action instincts with confidence, domain, source evidence, and project scope. Its documentation describes hooks that capture observations, an observer that extracts patterns, and clustering into larger skills, commands, or agents. It distinguishes project and global stores; the code sets a two-project promotion threshold. Import logic deduplicates IDs by confidence and filters against a confidence threshold. These are operational heuristics, not calibrated probabilities of correctness.

## Implications and tradeoffs for Teamagent

Project scope is especially valuable for avoiding contamination between codebases with incompatible conventions. Teamagent should preserve the observation-to-instinct-to-skill distinction, along with user corrections and outcome evidence. Confidence needs a definition tied to empirical support and uncertainty; a numeric field written by an observer is not enough. Two projects can share the same mistaken convention, or be forks of the same repository, so cross-project count should not alone authorize global promotion. Imports also need source trust and conflict handling instead of accepting the highest reported confidence from any library.

## Adoption decision

Adopt the atomic instinct schema as candidate procedural memory, with separate evidence and validation scores. Use explicit project identity and provenance-aware inheritance. Keep promotion to global scope behind independent held-out evaluation across unrelated repositories. Evaluate hook completeness and privacy under each target harness rather than accepting the documentation's reliability language as measured fact. Preserve original instincts when clustering so regressions can be traced and reversed.

## Verification boundary

No project code, models, installers, or benchmarks were executed during this review. Tests and documentation show intended contracts; they do not establish measured performance, production readiness, or a complete security assessment. Recommendations above are design inferences from the cited snapshot. Verify current APIs, licensing, and deployment requirements before integration.
