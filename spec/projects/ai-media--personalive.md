# personalive

Source: [personalive](https://github.com/GVCLab/PersonaLive) · Category: [ai-media](../categories/ai-media.md)

Review depth: **inventory / README screening only**. This is an individual coverage record, not a source-code correctness audit or adoption recommendation.

Snapshot: `abdd112e01dcf7d89122c2e5efa29fcff0669740`; commit timestamp `2026-08-28T12:01:07+08:00`; 149 tracked paths.

## Scope and evidence

Upstream description excerpt (a project claim, automatically extracted from [README](https://github.com/GVCLab/PersonaLive/blob/abdd112e01dcf7d89122c2e5efa29fcff0669740/README.md)):

> 1  University of Macau  &nbsp;&nbsp;  2  Dzine.ai  &nbsp;&nbsp;  3  GVC Lab, Great Bay University - [ ] If you find PersonaLive useful or interesting, please give us a Star🌟! Your support drives us to keep improving.

Build/package evidence: [webcam/frontend/package.json](https://github.com/GVCLab/PersonaLive/blob/abdd112e01dcf7d89122c2e5efa29fcff0669740/webcam/frontend/package.json)

License evidence: [LICENSE](https://github.com/GVCLab/PersonaLive/blob/abdd112e01dcf7d89122c2e5efa29fcff0669740/LICENSE) Classification hint: Apache-2.0. A root license does not establish rights for every bundled asset, model, or dependency.

## Harness assessment

This entry was catalogued under **ai-media**. Its category places it in the candidate set for import-generation; those associations are navigational and have not been individually validated as implemented capabilities. See [import-generation](../import-generation.md) for the source-reviewed alternatives and proposed integration boundaries.

**Disposition:** retain as a comparison candidate. Before adopting it, inspect the implementation entry point and its tests, verify the required protocol and deployment platform, and reproduce a task from the harness evaluation suite. Popularity, a README feature list, and the presence of a package manifest are insufficient evidence of quality or compatibility.

**Unresolved:** runtime behavior, security boundaries, performance, API/subscription eligibility, dependency health, maintenance status, and fit to the proposed harness were not independently established for this entry. No repository code was executed as part of this screening.

## Speech review: 2026-10-25

The newly cited source files match their exact upstream Git blobs; see [source validation](../data/media-source-validation.json).

Focused snapshot: [`abdd112e01dcf7d89122c2e5efa29fcff0669740`](https://github.com/GVCLab/PersonaLive/commit/abdd112e01dcf7d89122c2e5efa29fcff0669740), commit date 2026-08-28T06:01:07+02:00. Scope: webcam capture, connection queues and video worker dispatch. This adds a source review without rewriting the earlier screening record.

The browser [capture implementation](https://github.com/GVCLab/PersonaLive/blob/abdd112e01dcf7d89122c2e5efa29fcff0669740/webcam/frontend/src/lib/mediaStream.ts#L17-L96) requests video with `audio:false` for camera and screen capture. The [pipeline](https://github.com/GVCLab/PersonaLive/blob/abdd112e01dcf7d89122c2e5efa29fcff0669740/webcam/vid2vid.py#L36-L100) sends image/reference data through multiprocessing queues to a separate process. These observations establish an avatar/video path, not a speech recognizer or voice-cloning backend. Adding synchronized speech requires another capture/processing/output pipeline and a shared clock.

[Connection management](https://github.com/GVCLab/PersonaLive/blob/abdd112e01dcf7d89122c2e5efa29fcff0669740/webcam/connection_manager.py#L23-L82) replaces pending input frames to retain fresh input. That makes sense as a latency tradeoff for visual previews; applying the same policy to audio would erase phonemes and invalidate timestamps. Input and output queues are constructed without a maximum in the inspected code. The later [output full-check](https://github.com/GVCLab/PersonaLive/blob/abdd112e01dcf7d89122c2e5efa29fcff0669740/webcam/connection_manager.py#L143-L168) therefore does not itself demonstrate bounded buffering. Runtime memory behavior was not measured.

A capture-lifecycle concern also deserves a focused fixture: the inspected `stop` method acquires a new camera stream and stops its tracks before clearing the store, rather than explicitly stopping the previously stored stream. This is a source-level risk to investigate, not a claim that every application exit leaks a device. Teamagent should own the actual acquired track handles in a scope and test permission cancellation, device removal and teardown.

Disposition: optional visual-generation worker, separately budgeted from STT/TTS. Preserve frame timestamps, reference-image provenance, user access and generated-media disclosure. Reject architecture claims that avatar similarity establishes voice identity or cloning capability. No GPU inference, webcam capture, latency measurement or model-license audit was performed.

Related: [channel input](../channel-input.md) · [media processing](../media-processing.md) · [generation](../generation.md).
<!-- teamagent-analysis:start -->
Analysis metadata: source [personalive](https://github.com/GVCLab/PersonaLive); analyzed commit `abdd112e01dcf7d89122c2e5efa29fcff0669740`; commit date 2026-08-28T12:01:07+08:00; review date unknown; depth screened. [Maintenance record](../analyses/repos/ai-media--personalive.md).
<!-- teamagent-analysis:end -->
