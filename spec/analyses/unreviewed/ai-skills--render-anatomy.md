# render-anatomy

Source: [render-anatomy](https://github.com/wheresryan22/anatomy) · [skills](../../skills.md), [evolution](../../evolution.md), [agents](../../agents.md).

Original discovery depth: **unreviewed**. Discovered 2026-10-24T06:36:54.441Z; no source code or capabilities reviewed at discovery; see the scoped review below. [Change evidence](../repos/ai-skills--render-anatomy.md).

## Source update reviewed 2026-10-27

Reviewed commit `1482e8469b0a9e0d8cc18ea2740a01423d29ae80` (commit date `2026-10-18T22:20:24+02:00`). Initial scoped review: skill body, WebGL helper, session accounting/tests, security policy and five declared eval tasks. Large geometry/audit implementations and generated examples remain unreviewed.

[Anatomy](https://github.com/wheresryan22/anatomy) combines procedural SVG/WebGL with a [skill workflow](https://github.com/wheresryan22/anatomy/blob/1482e8469b0a9e0d8cc18ea2740a01423d29ae80/SKILL.md) sharing a pure behavioral model between readout/motion and requiring visual, reduced-motion and geometry checks. Fixed detail/time tiers need task-aware tuning. The [WebGL helper](https://github.com/wheresryan22/anatomy/blob/1482e8469b0a9e0d8cc18ea2740a01423d29ae80/kit/gl.mjs) shares camera coordinates, caps device ratio and returns null on context/compile/link failure, but provides no disposal method. Trusted adapters still need resource cleanup/context-loss handling.

The [security policy](https://github.com/wheresryan22/anatomy/blob/1482e8469b0a9e0d8cc18ea2740a01423d29ae80/SECURITY.md) limits browser helpers to trusted pages and discloses file-access flags and supplied page JavaScript: these helpers are not an untrusted-HTML sandbox. The [session helper](https://github.com/wheresryan22/anatomy/blob/1482e8469b0a9e0d8cc18ea2740a01423d29ae80/scripts/session.mjs) caps idle gaps at ten minutes, deduplicates streamed usage and excludes cache-read tokens; [tests](https://github.com/wheresryan22/anatomy/blob/1482e8469b0a9e0d8cc18ea2740a01423d29ae80/scripts/session.test.mjs) encode that definition and null on missing evidence. Its metric is approximate active time/token accounting, not billed cost/wall time; whole-file reads and traversal need bounds/authorization.

The [eval file](https://github.com/wheresryan22/anatomy/blob/1482e8469b0a9e0d8cc18ea2740a01423d29ae80/evals/evals.json) contains positive expectations, not measured outcomes or near-miss cases. **Disposition:** candidate requiring Bun portability review, restricted rendering, explicit publication scope and independent acceptance. No upstream code/browser/benchmark was executed; visual quality and performance remain unverified.

<!-- teamagent-analysis:start -->
Analysis metadata: source [render-anatomy](https://github.com/wheresryan22/anatomy); analyzed commit `1482e8469b0a9e0d8cc18ea2740a01423d29ae80`; commit date 2026-10-18T22:20:24+02:00; review date 2026-10-28T08:26:04.502Z; depth reviewed. [Maintenance record](../repos/ai-skills--render-anatomy.md).
<!-- teamagent-analysis:end -->
