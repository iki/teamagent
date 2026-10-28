# glados

Source: [glados](https://github.com/dnhkng/GLaDOS) · Category: [ai-agents](../categories/ai-agents.md)

Original review depth: **inventory / README screening only**. The dated update review below has its own explicit scope. This is an individual coverage record, not a source-code correctness audit or adoption recommendation.

Snapshot: `fde319cfb8ceb965e512800b2ffc5b9c0d1574b1`; commit timestamp `2026-09-17T16:39:32+02:00`; 172 tracked paths.

## Scope and evidence

Upstream description excerpt (a project claim, automatically extracted from [README](https://github.com/dnhkng/GLaDOS/blob/fde319cfb8ceb965e512800b2ffc5b9c0d1574b1/README.md)):

> "Science isn't about asking why. It's about asking, 'Why not?'"  -  Cave Johnson GLaDOS is the AI antagonist from Valve's Portal series—a sardonic, passive-aggressive superintelligence who views humans as test subjects worthy of both study and mockery.

Build/package evidence: [pyproject.toml](https://github.com/dnhkng/GLaDOS/blob/fde319cfb8ceb965e512800b2ffc5b9c0d1574b1/pyproject.toml)

License evidence: [LICENSE.txt](https://github.com/dnhkng/GLaDOS/blob/fde319cfb8ceb965e512800b2ffc5b9c0d1574b1/LICENSE.txt) Classification hint: MIT. A root license does not establish rights for every bundled asset, model, or dependency.

## Harness assessment

This entry was catalogued under **ai-agents**. Its category places it in the candidate set for agents, models, channels; those associations are navigational and have not been individually validated as implemented capabilities. See [agents](../agents.md) · [models](../models.md) · [channels](../channels.md) for the source-reviewed alternatives and proposed integration boundaries.

**Disposition:** retain as a comparison candidate. Before adopting it, inspect the implementation entry point and its tests, verify the required protocol and deployment platform, and reproduce a task from the harness evaluation suite. Popularity, a README feature list, and the presence of a package manifest are insufficient evidence of quality or compatibility.

**Unresolved:** runtime behavior, security boundaries, performance, API/subscription eligibility, dependency health, maintenance status, and fit to the proposed harness were not independently established for this entry. No repository code was executed as part of this screening.

## 2026-10-28 scoped update review

Reviewed commit `ea018f57fac8bbdde5057b65e372ddf9ac0758a8` (commit date `2026-10-10T15:11:19+02:00`). The original snapshot above remains historical evidence.

**Scope:** Subagent base contract, ONNX audio-provider selector and hardware-independent selector fixtures; scheduler, memory store, inference sessions and microphone/speech behavior were not audited.

The [subagent contract](https://github.com/dnhkng/GLaDOS/blob/ea018f57fac8bbdde5057b65e372ddf9ac0758a8/src/glados/autonomy/subagent.py) puts timing, threads and lifecycle in a shared scheduler, while workers return domain outputs and publish context slots. `next_run` is explicitly progress metadata rather than scheduling authority; `request_tick` requires a registered scheduler. This is a useful separation for Teamagent: generated status, importance/confidence and notification intent should remain data for a host-owned scheduling/admission policy. The base class forwards those values and does not itself enforce status enums, score ranges, queue bounds or durable storage.

The [audio-provider helper](https://github.com/dnhkng/GLaDOS/blob/ea018f57fac8bbdde5057b65e372ddf9ac0758a8/src/glados/onnx_runtime.py) filters installed ONNX providers in a fixed preference order and appends CPU fallback. Its [fixtures](https://github.com/dnhkng/GLaDOS/blob/ea018f57fac8bbdde5057b65e372ddf9ac0758a8/tests/test_onnx_runtime.py) mock availability, verify ordering/exclusions and ensure the input list is not mutated. They do not measure accelerator use, model support, latency or audio quality. Reporting a session's registered providers also does not prove which provider executed each operation.

Retain this source for worker/scheduler ownership and capability reporting patterns. A Teamagent voice or autonomy adapter still needs actual scheduler cancellation/resource tests, private-context handling and hardware/audio acceptance evidence; no microphone capture, native model run or provider call was performed here.

**Verification limit:** source inspection only; no upstream tests or provider calls were executed. This scoped review does not certify every file in the repository.

<!-- teamagent-analysis:start -->
Analysis metadata: source [glados](https://github.com/dnhkng/GLaDOS); analyzed commit `ea018f57fac8bbdde5057b65e372ddf9ac0758a8`; commit date 2026-10-10T15:11:19+02:00; review date 2026-10-28T08:47:42.123Z; depth screened. [Maintenance record](../analyses/repos/ai-agents--glados.md).
<!-- teamagent-analysis:end -->
