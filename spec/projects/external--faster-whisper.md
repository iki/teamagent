# faster-whisper: batched and aligned local STT

Source: [SYSTRAN/faster-whisper](https://github.com/SYSTRAN/faster-whisper). Reviewed 2026-10-25 at [`65882eee9f5cdbeeb2d877f1131d48cf241b327d`](https://github.com/SYSTRAN/faster-whisper/commit/65882eee9f5cdbeeb2d877f1131d48cf241b327d), commit date 2025-10-31. External source review; not a discovered installed runtime or a promotion of the local repository ledger.

## Observed implementation

[Result types](https://github.com/SYSTRAN/faster-whisper/blob/65882eee9f5cdbeeb2d877f1131d48cf241b327d/faster_whisper/transcribe.py#L29-L102) expose timed segments, optional words and separate transcription information. The [constructor](https://github.com/SYSTRAN/faster-whisper/blob/65882eee9f5cdbeeb2d877f1131d48cf241b327d/faster_whisper/transcribe.py#L582-L665) supports existing model directories and `local_files_only`, but a missing tokenizer file takes a separate `Tokenizer.from_pretrained` path. A model-only file check is therefore insufficient for offline readiness. [Batch defaults](https://github.com/SYSTRAN/faster-whisper/blob/65882eee9f5cdbeeb2d877f1131d48cf241b327d/faster_whisper/transcribe.py#L237-L282) enable VAD while [ordinary transcription](https://github.com/SYSTRAN/faster-whisper/blob/65882eee9f5cdbeeb2d877f1131d48cf241b327d/faster_whisper/transcribe.py#L700-L744) disables it by default.

The [README](https://github.com/SYSTRAN/faster-whisper/blob/65882eee9f5cdbeeb2d877f1131d48cf241b327d/README.md) documents a lazy segment generator and CTranslate2/PyAV runtime requirements. The wrapper must consume results to complete processing and preserve errors during iteration. Published speed comparisons depend on hardware, precision, beam and batching; they are not measurements of Teamagent.

## Adoption and tradeoffs

Use as an optional isolated worker when a compatible environment and complete model assets already exist. It is attractive for evaluated throughput or word-timing requirements, but it should not force a new Python runtime into the core application. Thread count, batch size, precision and accelerator memory form a resource policy. Batch throughput is not conversational time-to-final, and enabling VAD can change transcript coverage.

Require explicit word-alignment capability and distinguish it from speaker diarization. Store the original time base through any speech-only chunk mapping. Do not compare log probability or no-speech scores directly with another provider's confidence. Ensure local-only operation rejects missing tokenizer/configuration dependencies before loading, and verify it with a network-denied smoke test rather than relying only on a constructor option.

Acceptance should cover generator failure mid-result, silence/overlap, missing language models, VAD boundary errors and resource exhaustion. No package, GPU runtime, model inference or benchmark was executed in this review. The selection policy should retain this candidate until it has target-machine evidence, not rank it first based on repository claims.

Related: [media processing](../media-processing.md) · [channel input](../channel-input.md).