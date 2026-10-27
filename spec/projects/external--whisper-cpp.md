# whisper.cpp: local transcription adapter

Source: [ggml-org/whisper.cpp](https://github.com/ggml-org/whisper.cpp). Review date: 2026-10-25. Scope: external primary-source review, outside the original local inventory. Analyzed commit: [`1da4dc82fa7996d4edda05890dca65aeceaafd6d`](https://github.com/ggml-org/whisper.cpp/commit/1da4dc82fa7996d4edda05890dca65aeceaafd6d); commit date: 2026-09-11T14:13:24Z. Exact source blobs were retrieved through the GitHub connector. This is a reproducible source snapshot, not a claim that this is the latest release or an installed executable.

## Observed contract

The [CLI documentation](https://github.com/ggml-org/whisper.cpp/blob/1da4dc82fa7996d4edda05890dca65aeceaafd6d/examples/cli/README.md) exposes model/input arguments, language selection, JSON output and an output prefix. A practical adapter uses explicit model and file paths, `-oj`, and `-of` without an extension. [JSON serialization](https://github.com/ggml-org/whisper.cpp/blob/1da4dc82fa7996d4edda05890dca65aeceaafd6d/examples/cli/cli.cpp#L694-L812) emits `result.language` and a `transcription` array. Segment offsets are milliseconds, alongside formatted timestamps and text. Full JSON adds tokens; speaker output is conditional on stereo diarization, while tiny diarization emits turn boundaries with its required model. Neither feature establishes a person's identity.

The source is a native integration candidate, with fewer host-runtime requirements than a Python worker. That does not prove a particular binary is installed, safe, accelerated or compatible with every input codec. Build options and model files remain part of the capability key. The harness should normalize a conservative PCM input, validate structured output, bound subprocess duration/output and report the actual selected device. Do not parse human console progress as the transcript protocol.

## Adoption and verification

Adopt as a first local STT adapter when an explicitly configured executable and model are ready. Avoid installation or model download during automatic selection. Preserve original audio and transform provenance. Require separate flags/capability checks for timestamps, translation and speaker methods; mono normalization must not be applied before a channel-based diarization request.

The first acceptance suite should cover multilingual text, silence, corrupt/truncated audio, Unicode paths, cancellation, absent models, unusually large JSON and exact offset conversion. A filename ending in `.json` is not evidence of a valid completed transcript. Output parsing must reject inconsistent or non-finite times and preserve partial/error status. Compare recognition and latency on the actual target hardware before preferring this backend over another implementation of Whisper. No build, inference or performance benchmark was run here.

Related: [media processing](../media-processing.md) · [channel input](../channel-input.md).