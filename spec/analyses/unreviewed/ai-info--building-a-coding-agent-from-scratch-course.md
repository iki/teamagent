# building-a-coding-agent-from-scratch-course

Source: [building-a-coding-agent-from-scratch-course](https://github.com/decodingai-magazine/building-a-coding-agent-from-scratch-course) · [decisions](../../decisions.md), [evolution](../../evolution.md), [memory](../../memory.md).

Initially discovered 2026-11-01T10:08:32.081Z as unreviewed. The scoped initial source review below supersedes that discovery-only status; it does not establish runtime validation. [Change evidence](../repos/ai-info--building-a-coding-agent-from-scratch-course.md).

## Source update reviewed 2026-11-01

Reviewed commit [`2ba55b548dbb2bb352c3651e20c8a21f3e5eb9d4`](https://github.com/decodingai-magazine/building-a-coding-agent-from-scratch-course/commit/2ba55b548dbb2bb352c3651e20c8a21f3e5eb9d4).

The complete [permission gate](https://github.com/decodingai-magazine/building-a-coding-agent-from-scratch-course/blob/2ba55b548dbb2bb352c3651e20c8a21f3e5eb9d4/src/decode/permissions/gate.py) and [unit fixtures](https://github.com/decodingai-magazine/building-a-coding-agent-from-scratch-course/blob/2ba55b548dbb2bb352c3651e20c8a21f3e5eb9d4/tests/unit/decode/permissions/test_gate.py) implement deny rules from either user or agent before any allow, then mode defaults, then ask. Changing the selected agent replaces its rule set. The pure policy object returns a decision; a separate resolver owns user interaction.

An explicit allow is evaluated before plan-mode restrictions in this implementation, so the default plan-mode mutation denial is not an unconditional read-only boundary. Teamagent should make its own precedence contract explicit and test override combinations. Debug logging also includes the request subject, which cannot be copied into Teamagent's public diagnostics without privacy filtering. This scoped initial review does not verify rule parsing, every tool enforcement point, the resolver or all 700 inventoried paths. No upstream tests or agent session was executed.

<!-- teamagent-analysis:start -->
Analysis metadata: source [building-a-coding-agent-from-scratch-course](https://github.com/decodingai-magazine/building-a-coding-agent-from-scratch-course); analyzed commit `2ba55b548dbb2bb352c3651e20c8a21f3e5eb9d4`; commit date 2026-10-24T11:43:03+03:00; review date 2026-11-01T11:35:43.470Z; depth reviewed. [Maintenance record](../repos/ai-info--building-a-coding-agent-from-scratch-course.md).
<!-- teamagent-analysis:end -->
