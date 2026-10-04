# GitHub Spec Kit

Source: [github/spec-kit](https://github.com/github/spec-kit) · Reviewed revision: `ae5ade7234be5cb1d975f736c4e06dd46d1326d6` · Review date: 2026-10-04.

Depth: **source-reviewed** (static source/content inspection; repository-wide audit not claimed). Related directions: [skills](../skills.md) · [evolution](../evolution.md) · [agents](../agents.md).

## Evidence inspected

- [`src/specify_cli/agents.py` lines 307–387](https://github.com/github/spec-kit/blob/ae5ade7234be5cb1d975f736c4e06dd46d1326d6/src/specify_cli/agents.py#L307-L387)
- [`templates/commands/implement.md` lines 1–84](https://github.com/github/spec-kit/blob/ae5ade7234be5cb1d975f736c4e06dd46d1326d6/templates/commands/implement.md#L1-L84)

## Observed architecture and behavior

Spec Kit materializes development commands for different agent formats. The inspected renderer supports Markdown and TOML, with careful handling of non-string descriptions, backslashes, triple quotes, and control characters. The implementation template separates prerequisite discovery, extension hooks, checklist state, and task execution. It explicitly distinguishes requirements-quality checklist completion from implementation completion. This is useful operational structure for specification-driven work, with parts enforced by tools and parts delegated to agent instructions.

## Implications and tradeoffs for Teamagent

Teamagent should represent requirements, plans, tasks, verification evidence, and decisions as typed artifacts with stable IDs and links. Formatting commands into a host's native syntax is worthwhile, but a prompt that requests a gate does not equal a runtime-enforced gate. Extension hooks need the same provenance and permissions as other executable plugins. Checklist validity should be tied to the exact specification revision; editing a requirement can invalidate an earlier check. The inspected template's detailed workflow also illustrates why heavyweight spec processes should be selected for consequential changes, not injected into every small edit.

## Adoption decision

Offer a spec-driven coding bundle or importer rather than adopting Spec Kit's directory conventions as the entire harness architecture. Reuse format adapters and artifact templates where suitable. Enforce required state transitions in the task engine, with policy-controlled overrides recorded as decisions. Evaluate cross-platform paths, command escaping, hook failures, stale checklists, and end-to-end requirement-to-test traceability. Preserve the user's chosen workflow and allow a lightweight task path where a full specification adds little value.

## Verification boundary

No project code, models, installers, or benchmarks were executed during this review. Tests and documentation show intended contracts; they do not establish measured performance, production readiness, or a complete security assessment. Recommendations above are design inferences from the cited snapshot. Verify current APIs, licensing, and deployment requirements before integration.
