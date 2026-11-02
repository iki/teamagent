# Channel input, speech and turn ownership

[Runtime and CLI](media-runtime.md) · [Channels](channels.md) · [Media processing](media-processing.md) · [Contracts](contracts.md) · [Security](security.md)

Research date: 2026-10-25. This document describes source observations and the target channel contract. The implementation scope for this work is the portable channel envelope and speech sequence state, file ingestion, and the media CLI; authenticated bot transports, microphone streaming, playback acknowledgments and full-duplex conversation remain separate integrations. A file transcription command does not establish a functioning Telegram, Slack, Discord, browser or mobile voice session. Refer to [harness](harness.md) for implemented commands.

## Evidence and adoption decisions

| Source | Observed mechanism | Use in Teamagent |
|---|---|---|
| [Paseo](https://github.com/getpaseo/paseo) · [focused review](projects/ai-agents--paseo.md#speech-review-2026-10-25) | Independent VAD and STT sessions, committed-segment ordering, finalization timeout, speech-triggered interruption and playback confirmation | Reference for turn state and cancellation tests; keep completeness and authorization explicit |
| [VoiceStudio](https://github.com/debpalash/VoiceStudio) · [focused review](projects/ai-media--voicestudio.md#speech-review-2026-10-25) | Versioned speech discovery, relative endpoints, explicit runtime routing, sentence-level progressive synthesis | Discover capabilities and distinguish transport streaming from incremental inference |
| [PersonaLive](https://github.com/GVCLab/PersonaLive) · [focused review](projects/ai-media--personalive.md#speech-review-2026-10-25) | Video capture explicitly disables audio; frame processing uses a separate process and queues | Optional visual channel, not a speech backend; frame-dropping semantics must not leak into speech |
| [Streambert](https://github.com/truelockmc/streambert) · [focused review](projects/ai-media--streambert.md#speech-review-2026-10-25) | Playback and subtitle import with bounded ZIP entry expansion | Subtitle/artifact UX reference, not STT, TTS or voice cloning |

These are scoped static reviews. No microphone, native playback, relay, model inference or provider subscription was exercised. Each report preserves its earlier baseline and identifies the new evidence separately.

## One envelope, several payloads

Normalize input after transport authentication into a versioned envelope containing tenant/workspace, installation/account, channel, conversation/thread, actor principal, provider event ID, provider message ID, revision, event kind, source timestamp, receipt timestamp, text and attachment artifact references. Include provenance, processing status, reply target, locale hints and the granted task scope. Keep raw provider payloads outside normal logs and model context. Resolve actor IDs through the installation binding; display names, phone labels and inferred speakers are not identity proofs.

Maintain separate identities for delivery, message and revision. A webhook retry with the same installation/event ID must return the prior receipt without creating another task. An edit changes a message revision. An audio upload followed by transcription completion enriches the existing artifact/turn. Deduplicate using authenticated scope plus provider identity, not text equality: two intentional identical utterances must remain separate. A bounded replay window and durable idempotency record are transport responsibilities; an in-memory envelope reducer alone cannot provide restart-safe exactly-once handling.

Attachments preserve original media hash, MIME/container observations, byte size and access grant. URLs carry an explicit fetch policy; credentials in chat text are never a reason to broaden retrieval. Verify webhook signature and replay age before expensive decoding. Apply limits before allocating buffers, and use authenticated attachment downloads with redirect and destination checks. Sending work to a cloud transcriber is a distinct data-egress decision even when the incoming channel itself is cloud-hosted.

The same envelope accepts text, documents, images, recorded speech and video. Documents/images enter the [import pipeline](import-pipeline.md); audio/video speech enters [media processing](media-processing.md). Unsupported tracks or conversion failures retain their source record and a visible failure. Transcripts remain untrusted source content. A spoken instruction inside a recording, generated speech, or a quoted meeting participant does not acquire execution authority merely by becoming text.

## Speech events and stable turns

Use a session generation, utterance ID, chunk sequence and audio sample offset. A new connection creates a new generation unless explicit resume succeeds; delayed chunks from an older generation cannot modify the new utterance. Validate monotonic sequence, codec/rate consistency, bounded chunk size, maximum duration and final-state transitions before processing. Sample time is the alignment clock; wall time measures transport delay. Keep gaps and discontinuities explicit instead of inventing silent audio.

The proposed event model separates `capture.started`, `audio.chunk`, `speech.started`, `speech.stopped`, `transcript.partial`, `transcript.final`, `utterance.committed`, `playback.started`, `playback.acknowledged`, `cancelled` and `failed`. A transcript revision replaces its predecessor in the UI. Partial text is useful for immediate feedback, but a durable task begins only under an explicit commit policy. Final text can still be corrected: retain revision history and record whether a correction requires user confirmation before changing a running task.

A stream can close before all committed STT segments finish. Track the set and order of committed segments, final results and deadline. Return complete, partial-timeout, cancelled or failed distinctly; never present a concatenation of the available segments as certainly complete. Bound queued audio and outstanding segments. When overloaded, pause capture or mark a gap/failure; silently dropping arbitrary audio chunks changes words and destroys timing evidence.

[Paseo's reviewed controller](projects/ai-agents--paseo.md#speech-review-2026-10-25) supplies a useful segment-ordering and single-final-callback example. Its inspected finalization callback does not carry a separate timeout-completeness field, which is a reason to strengthen the Teamagent contract rather than infer completion from callback delivery.

## VAD, endpointing and barge-in

VAD identifies likely speech frames. Endpointing decides whether a user has finished a conversational turn. Keep them separate. Acoustic silence thresholds are simple and locally available; semantic endpointing can wait for incomplete phrases but adds model dependency and variable delay. Neither should send an irreversible action based on a partial transcript. Push-to-talk/manual commit remains a useful explicit mode for code, names, long pauses and accessibility.

The capture pipeline is device permission → echo cancellation/noise treatment where supported → decode → stateful resampling → frame VAD → turn endpointer → transcription → committed envelope. Preserve the original recording when retention policy allows, and record transformations. Do not reset a resampler at every network chunk. Feed playback reference into echo cancellation where available; otherwise the assistant may trigger its own VAD. Noise suppression and normalization can alter weak consonants or speaker characteristics, so compare processed and unprocessed recognition on the evaluation set.

Barge-in should stop audible playback promptly after confirmed user speech, cancel queued synthesis, and discard late output using a generation token. Interrupting the agent's reasoning or tools is a separate task policy with an acknowledgment; stopping sound does not undo a filesystem write or external action. Record the last audio offset actually played, then reconcile assistant history to what the user heard. Test simultaneous end-of-playback and speech-start, stale acknowledgments, output arriving after cancellation and refused agent interruption. [Paseo](https://github.com/getpaseo/paseo) ([review](projects/ai-agents--paseo.md#speech-review-2026-10-25)) demonstrates immediate VAD-triggered cancellation and explicit interruption failure; the offset-level history contract here is a proposed extension.

Current OpenAI live transcription uses `gpt-live-transcribe` over a transcription session. Its documented session disables turn detection; this model currently supports neither server VAD nor semantic VAD. Therefore Teamagent must retain local/manual endpointing rather than assume all Realtime models share turn detection capabilities. The documented input is 24 kHz PCM and the connection uses the transcription intent. These are provider-specific facts checked 2026-10-25, not a universal audio contract. [Official live transcription guide](https://developers.openai.com/api/docs/guides/realtime-transcription).

## Channel-specific integration boundaries

| Surface | Input contract | Additional acceptance evidence needed |
|---|---|---|
| CLI | Explicit file input or explicit recording device and duration; machine-readable results | Missing executable/model, cancellation, codec validation and bounded output |
| Web | Browser microphone permission, authenticated session, revocable short-lived transport capability | Real browser echo handling, background suspension, reconnect, worklet/buffer behavior |
| Desktop | Native device selection and host service connection | Packaged app permission prompts, device removal, sleep/wake, audio cleanup |
| Mobile | Same server contract with platform capture adapter | Deferred mobile implementation; foreground/background constraints and interruptions |
| Telegram / Slack / Discord | Verified installation and sender, durable receipt, downloaded attachment artifact | Real signature/auth schemes, retries, edits/deletes, attachment expiry, bot permissions and response limits |

Do not publish long-lived provider keys to clients. Proxy authorized operations or mint narrow provider tokens where the provider supports them. Cap both the harness session and upstream session lifetime. An installed agent, existing ChatGPT subscription or channel login does not prove audio API entitlement; each provider connection must report credential, model, format and voice availability independently.

## Evaluation and rollout

Use deterministic fixtures for duplicated events, reordered audio, conflicting revisions, invalid MIME, oversized data, expired attachment access, provider timeouts, cancellation races, silence and late final transcripts. Cross-language endpoint tests need hesitation, numbers, punctuation dictation, code identifiers, overlap and background speech. Diarization labels are descriptive and must never authenticate speakers.

Measure capture-to-first-partial, end-of-speech-to-commit, false interruptions, clipped words, recovery after gaps and audible cancellation latency. Report p50/p95 with device, model, codec, sample rate, chunk size, network profile and cold/warm state. A zero-cost mocked test establishes contract behavior, not audio quality or live provider interoperability. Add real microphone/playback and credentialed provider suites as explicitly separate acceptance steps; do not claim them from passing unit tests.

## External-update synthesis: 2026-11-01 — explicit host capabilities

[Pi Desktop](https://github.com/vastsa/PI-Desktop) ([review](projects/ai-agents--pi-desktop.md)) corrects its declared IPC/audio surface and distinguishes local unsupported helpers from broker-reaching permission/audit paths. The change is documentation only; a method name or permission declaration does not establish working capture/playback. Keep microphone device admission, trusted model resources, actual inference and measured stream latency separate.

[Streambert](https://github.com/truelockmc/streambert) ([review](projects/ai-media--streambert.md)) adds external-player dispatch with selected headers and intentionally excludes cookies, but its inspected launcher uses visible windows, temporary logs and a timer-based startup inference. Do not copy those defaults into Teamagent. Playback needs separately authorized destinations, safe arguments/headers, hidden owned launches and observable termination; HTTP(S) scheme checks and a startup delay do not prove destination safety or successful playback. These were static source reviews, without a live stream or native device test.
