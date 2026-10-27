# Speech, media and channel runtime

[Harness](harness.md) · [Channel research](channel-input.md) · [Media research](media-processing.md) · [Module boundaries](architecture/modules.md)

The [2026-10-27 public-document refresh](analyses/media-refresh-2026-10-27.md) leaves runtime behavior and the 2026-11-24 policy expiry unchanged. HeyGen speech-to-speech remains unimplemented. Fish still accepts explicit `s1`; its announced 2026-12-31 upstream substitution requires a route review before that date. Source refresh does not authorize inference, account changes or replacement of the prepared Czech-to-English artifacts.

## Implemented interfaces

`@/media` provides validated requests, capability catalogs, deterministic selection plans, typed results and the `Media` Effect service. `@/channels` provides bound input envelopes, attachment processing ports, durable receipt contracts and the speech-event reducer. Both libraries are portable. The Bun implementations are composed in `app/media` and `app/runtime/channels.ts`; package exports are `teamagent/media`, `teamagent/media/bun`, `teamagent/channels` and `teamagent/channels/bun`.

The CLI implements all advertised commands:

| Command                                    | Input and behavior                                                                                |
| ------------------------------------------ | ------------------------------------------------------------------------------------------------- |
| `media setup [BACKEND]`                    | Print setup instructions, configuration examples and official URLs for HeyGen, Fish and OmniVoice |
| `media backends`                           | List configured/installed backends, capabilities and availability limitations                     |
| `media plan REQUEST.json`                  | Validate a request and explain selected/rejected candidates without inference                     |
| `media inspect FILE`                       | FFprobe stream, duration, codec and size metadata                                                 |
| `media convert FILE`                       | Extract/convert audio with optional trimming, channel count and sample rate                       |
| `media transcribe FILE`                    | File STT, optional language, timestamps and speaker labels when supported                         |
| `media synthesize TEXT`                    | TTS using a configured voice, explicit voice ID or local reference recording                      |
| `media clone REFERENCE`                    | Enroll a provider voice; return its voice ID, processing readiness and verification state         |
| `media voice-get/list/wait/delete`         | Inspect, page, explicitly wait for, or delete a HeyGen voice                                      |
| `media diagnose`                           | Read credential/account metadata without a generation request                                     |
| `media receipts` / `receipt ID`            | Read redacted durable media receipts                                                              |
| `media resume ID`                          | Reconcile retained enrollment or recover completed audio without another synthesis                |
| `media import-text FILE --text-format srt` | Extract exact cue wording and source cue mapping without generating speech                        |
| `media record`                             | Capture a specifically selected local microphone for a bounded duration                           |
| `channels inspect INPUT`                   | Decode a channel envelope or construct a convenience input without processing                     |
| `channels ingest INPUT`                    | Bind identity, fingerprint attachments, process and store a completed turn                        |
| `channels status MESSAGE_ID`               | Read the receipt for the selected local binding                                                   |
| `channels speech EVENTS.json`              | Validate/replay partial/final/end/cancel events into a speech state                               |

This increment implements libraries and CLI processing. Authenticated Telegram/Slack/Discord gateways, microphone permission UI, websocket STT transports, continuous duplex conversation, TTS playback and interruption of audible playback are later adapter work. A source channel label on a CLI import is recorded with `authentication: "local"`; it cannot authenticate a remote sender. `channels speech` is an event reducer, not a microphone or provider transport. Media results are local artifacts; they do not submit tasks to Pi or publish messages automatically.

## Explicit configuration and automatic selection

Media commands accept `--config media.config.ts` (or a supported C12 data format). Channel ingestion uses the same media configuration. Only the explicit file executes; ambient files, environment overlays, dotenv, remote inheritance and credential scans are disabled. Credentials are read only from explicitly named environment variables. Existing `.env` research settings have a separate maintenance scope.

```ts
export default {
  inputRoot: "./inputs",
  outputRoot: "./outputs",
  ffmpeg: { executable: "ffmpeg", probeExecutable: "ffprobe" },
  whisperCpp: { executable: "whisper-cli", modelPath: "./models/ggml-base.en.bin" },
  piper: { executable: "piper", modelPath: "./models/voice.onnx" },
  chatterbox: {
    pythonExecutable: "./venv/Scripts/python.exe",
    packageRoot: "./vendor/chatterbox/src",
    weightsDirectory: "./models/chatterbox",
    device: "cpu",
  },
  omnivoice: {
    pythonExecutable: "./venv/Scripts/python.exe",
    packageRoot: "./vendor/OmniVoice",
    weightsDirectory: "./models/OmniVoice",
    device: "cpu",
  },
  recovery: { directory: "./.cache/media-recovery", keyEnv: "MEDIA_RECOVERY_KEY" },
  heygen: { apiKeyEnv: "HEYGEN_API_KEY", speechModel: "heygen-voice-1" },
  fish: { apiKeyEnv: "FISH_API_KEY", speechModel: "s2.1-pro" },
  openai: { apiKeyEnv: "OPENAI_API_KEY" },
  elevenlabs: { apiKeyEnv: "ELEVENLABS_API_KEY", voiceId: "YOUR_ENROLLED_VOICE_ID" },
  limits: {
    inputBytes: 67108864,
    outputBytes: 67108864,
    timeoutMs: 120000,
    processOutputBytes: 4194304,
  },
};
```

Piper requires the companion `modelPath + ".json"` file. If `configPath` is supplied, it must resolve to that same file: the reviewed Python CLI accepts a custom path but does not use it, so the adapter rejects that misleading override.

Configure only the backends you have installed or intend to use. Relative configuration paths resolve from the configuration directory. Inputs resolve within `inputRoot`; outputs resolve within `outputRoot` and never overwrite an existing file. Output subdirectories must already exist. Defaults are the invocation directory for input and `.cache/media` beneath it for output. Executable discovery is passive; launcher shims are rejected and no packages/models are downloaded. Presence of files or credentials is availability evidence, not proof of model compatibility, account access, codec support or audio quality.

The default is automatic selection. `--backend ID`, `--model MODEL`, `--locality local|remote|any` and `--preference balanced|quality|latency|cost` constrain or override it. Required capabilities are filtered before ranking. An explicit backend never falls back. No failed provider operation is retried automatically. Selection plans expose versioned static policy priorities, exclusions and limitations; these priorities are configurable heuristics, not measured model rankings. Lower priorities win, followed by the operation default and stable backend/model IDs. The `priorities` configuration can override each backend's four numeric priorities (0–100).

Balanced and cost defaults favor a usable local backend. Quality favors configured cloud file models; latency uses a local-first prior. These choices need calibration on the user's hardware, languages and held-out recordings. `--locality local` excludes all cloud uploads. An installed local model is not assumed to outperform a cloud provider or to be faster on every device.

| Backend       | Implemented operations and required setup                                                                                                      |
| ------------- | ---------------------------------------------------------------------------------------------------------------------------------------------- |
| `ffmpeg`      | Inspect, convert and bounded recording; installed FFmpeg and FFprobe                                                                           |
| `whisper-cpp` | STT with optional segment timestamps; installed CLI/model plus FFmpeg normalization                                                            |
| `piper`       | WAV TTS; installed CLI, ONNX voice and its JSON config; `--voice` selects a numeric multi-speaker ID                                           |
| `chatterbox`  | WAV synthesis conditioned on `--reference`; explicit Python, source package and local checkpoint directory; isolated worker calls `from_local` |
| `omnivoice`   | WAV reference synthesis; explicit Python/package, complete local model and nested codec, FFmpeg, reference transcript                          |
| `heygen`      | WAV TTS with public/enrolled voice ID; instant MP3/WAV enrollment returns pending readiness; explicit API key                                  |
| `fish`        | WAV/MP3/Opus TTS with voice ID or binary reference plus transcript; private voice enrollment; explicit API key                                 |
| `openai`      | File STT; explicit API credential reference, current `gpt-transcribe` default; no subscription credential extraction                           |
| `elevenlabs`  | File STT with word timestamps/diarization, TTS with configured or supplied voice ID, voice enrollment                                          |

OpenAI legacy `/audio/speech` is available only with an explicit `speechModel` and `allowLegacySpeech: true`; it is not the recommended automatic TTS path. Current realtime speech models require a different transport, documented in the research. Chatterbox requires existing `ve.safetensors`, `t3_cfg.safetensors`, `s3gen.safetensors`, `tokenizer.json` and compatible cached dependencies. Python socket connections are blocked in that worker; this is not an OS sandbox for arbitrary installed native code. Missing resources fail. Provider enrollment and local reference conditioning are distinct operations. A timeout or invalid response after enrollment has an unknown provider outcome: check the provider account before retrying so an already-created voice is not duplicated. Optional `--voice-authorization` records supplied provenance; the program does not infer permission or verify a speaker's identity.

## Setup guides and provider models

Use `media setup` for all three new guides or `media setup heygen`, `media setup fish`, `media setup omnivoice` for one. The output includes URLs, configuration, examples and limitations. `--help` includes the essential setup requirements and official links. These informational commands do not load configuration, read credentials, install software, download models or contact providers. Detailed installation steps and example configuration are in [Media backend setup](media-setup.md).

HeyGen defaults to `heygen-voice-1`; supported overrides are `heygen-voice-1-turbo` and `heygen-voice-1-turbo-free`. Turbo supports public/instant voices; professional voices require standard. Fish defaults to `s2.1-pro`; accepted overrides also include `s1`, `s2-pro`, `s2.1-pro-free` and `drama-3`. Both configured `speechModel` values and `--model` overrides are checked against the reviewed identifiers. Fish otherwise silently substitutes a model for an unknown header; this adapter rejects it before a request. Neither free variant is selected implicitly. Prices and access can change; use the [service comparison and primary sources](media-processing.md).

OmniVoice uses `omnivoice-local`, with `--reference` and `--reference-text` required. Fish also requires the transcript for inline references; an explicit or configured voice ID does not need it. HeyGen never creates a clone implicitly during synthesis. Auto-selection removes candidates that lack the requested voice, reference, transcript, model, format or locality capability before applying configurable policy priorities.

Clone results distinguish optional `readiness: "ready" | "pending"` from `requiresVerification`. Processing readiness is not speaker identity verification; absent readiness on older adapters is unknown. HeyGen acceptance is pending until the provider confirms ACTIVE. Fish's created/training states are pending and trained is ready. Voice polling is explicit through `media voice-wait`, with `--timeout-ms`, `--poll-interval-ms` and a poll-count bound; enrollment is never retried automatically. HeyGen retains inline enrollment audio as a provider asset; Fish enrollment explicitly requests private visibility and retains its recording. Credential-free HeyGen downloads accept only HTTPS `files.heygen.ai/generated/` and `resource2.heygen.ai/text_to_speech/` origin/path pairs. No redirects, cookies or authorization headers are sent; output validation and exclusive file publication still apply.

## Durable media receipts and recovery

HeyGen cloning and synthesis require `recovery.keyEnv`, naming an environment variable containing a base64-encoded 32-byte AES key. The optional directory defaults to `.cache/media-recovery` relative to the configuration directory. Missing or changed keys block submission. The key is never saved beside the database. Receipt payloads, output paths, generated references, alignment and supplied authorization provenance are encrypted with AES-256-GCM; an HMAC index supports atomic clone replay checks. SQLite transactions, a bounded lock wait, record/count/byte limits and authenticated ciphertext protect recovery state. POSIX permissions are restricted; this is not a claim of Windows ACL isolation. Preserve the encryption key and database together through separate secure backup channels.

Intent is committed as `submitting` before the provider mutation. A successful response is projected into bounded, allowlisted fields and committed before strict response parsing, CDN checks or download. The states `accepted`, `pending`, `rejected`, `uncertain`, `generated-awaiting-download` and `published` distinguish known progress from ambiguity. A crash may leave `submitting`; that is not permission to resend. Malformed responses retain safe metadata, not arbitrary response bodies or echoed uploads. Public `receipt`/`receipts` output contains only redacted CDN categories, identifiers, hashes and typed diagnostics; signed URLs, input text, recordings and credentials remain absent.

A caller-provided clone `--idempotency-key` is bound to the request fingerprint, model and authenticated nonsecret credential binding. Reuse returns the existing receipt and directs explicit reconciliation; a changed request conflicts. A pending or uncertain receipt never silently submits another clone. Speech synthesis has no provider idempotency guarantee. Locally, an unfinished matching account-bound request fingerprint returns its existing receipt even if a new output is supplied. After publication, an explicitly different output can request a deliberate new candidate; elapsed time alone does not authorize a repeat. For a completed speech request, `media resume ID` uses the encrypted retained reference and rechecks the **current** exact download allowlist. It performs no synthesis POST. If only provider duration metadata was absent or invalid, resume may validate/download the retained allowed artifact and report measured WAV duration without inventing a provider duration. An expired reference remains a recoverable receipt with a download failure; the program does not regenerate paid audio. Clone recovery queries an already retained voice ID and refuses to guess by name.

Output publication never overwrites an existing file. Recovery verifies the recorded publication candidate hash before accepting a matching existing artifact; an unpublished destination conflict requires an explicit fresh candidate via `resume ID --output candidate-02.wav`. Once published, resume verifies the original artifact and cannot change its destination. Keep approved originals and candidates separately. If a crash interrupted publication, inspect the receipt and candidate rather than deleting evidence or issuing another generation.

HTTP failures retain nullable status, request ID, content type, bounded provider code and a redacted provider message. Authentication, permission, voice readiness, rate limiting, transient service errors, bad parameters, missing resources, redirects, network failures, timeout, cancellation and malformed responses are distinct. The reviewed MIME-alias message is retained exactly; arbitrary provider text is redacted. A known HTTP rejection differs from an uncertain connection failure, and a retryable classification never triggers an automatic retry.

## Voice lifecycle, policy and exact speech text

HeyGen `voice-get`, `voice-list`, `voice-wait` and `voice-delete` operate on explicitly selected provider resources. These commands and `diagnose` require an explicit `--backend heygen`; there is no implicit provider. List pagination is bounded and explicit through `--cursor` and `--limit`. Wait is cancellable and bounded; it reports pending state when its budget expires. Delete targets one explicit voice ID and does not claim deletion of retained provider source assets. `diagnose` reads key metadata, optional account metadata when scope permits, and optionally a voice; authentication is not evidence of model entitlement, training exclusion, speaker authorization or completed synthesis.

Selection blocks routes permitting general/shared provider model training by default; requested private voice creation is a separate operation. The operation freezes its selected credential and rejects a changed credential before content upload. It rechecks policy expiry at the actual POST boundary, after local preparation and read-only preflight; a local refusal is recorded as not submitted rather than an uncertain provider action. Before content upload, the current route's training policy is checked for provider, host, operation, model and account. Unknown or stale policy blocks execution even with an explicit backend. Known permitted general training requires per-invocation `--allow-training`; that flag cannot override unknown policy. Conditional exclusion requires current scoped documentary evidence and a recent authenticated account binding. A user assertion or key presence alone cannot establish exclusion. Local execution remains subject to separate code/model licenses; policy ranking is not a grant of rights. See the [service analysis](media-processing.md) for source evidence and limitations.

`media import-text approved.srt --text-format srt` returns plain speech text and cue mapping without model inference. Synthesis also accepts `--text-file approved.srt --text-format srt`; it returns `{result, textImport}`, preserving the import mapping alongside the media result. Ordinary synthesis keeps its flat media result. The parser removes numbering/timestamp structure, normalizes CRLF to logical LF, preserves each cue's wording, punctuation, spaces and internal line breaks, and separates cues with a blank line. Cue source times are provenance, **not measured TTS alignment**. Styled, malformed, out-of-bound or ambiguous input fails instead of silently rewriting it. Explicit HeyGen `--with-timestamps` requests provider character/word alignment; retained alignment survives completed-generation recovery. SRT text is still subject to the selected adapter's text limit and is never silently split into additional paid calls.

HeyGen cloning accepts `--language` and `--similarity`; instant enrollment defaults to `max`. Synthesis accepts `--expressiveness-boost` only for an instant voice (default 0.5 there). Preflight validates local audio/container, size, requested output, voice readiness and model compatibility before mutation. WAV enrollment uses the provider-required `audio/x-wav` alias for the same validated bytes. These checks do not measure voice quality or infer authorization.

## Examples

Run through the shared launcher; commands print JSON and send diagnostics to stderr:

```sh
aube run --no-install cli media setup heygen
aube run --no-install cli media setup fish
aube run --no-install cli media setup omnivoice
aube run --no-install cli media backends --config media.config.ts
aube run --no-install cli media transcribe meeting.wav --config media.config.ts --locality local --timestamps segment
aube run --no-install cli media transcribe meeting.wav --config media.config.ts --backend elevenlabs --timestamps word --diarization
aube run --no-install cli media synthesize "Hello" --config media.config.ts --backend piper --output hello.wav
aube run --no-install cli media synthesize "Hello" --config media.config.ts --backend chatterbox --reference reference.wav --output cloned.wav
aube run --no-install cli media clone reference.wav --config media.config.ts --backend elevenlabs --name "My voice"
aube run --no-install cli media synthesize "Hello" --config media.config.ts --backend elevenlabs --voice RETURNED_VOICE_ID --output hello.mp3
aube run --no-install cli media convert meeting.mp4 --config media.config.ts --format wav --sample-rate 16000 --channels 1 --output meeting.wav
aube run --no-install cli media record --config media.config.ts --input-format dshow --device "audio=Microphone" --duration-seconds 10 --output capture.wav
```

Recording requires an explicit device and platform input driver (`dshow`, `avfoundation`, `alsa` or `pulse`); no microphone is opened by discovery. Duration is 1–300 seconds and must fit the configured timeout plus five seconds. Convert accepts `--start-seconds` and `--duration-seconds`. Synthesis accepts `--text-file FILE` instead of a positional string, with bounded UTF-8 reading. Current synthesis adapters limit each request to 4096 characters (HeyGen: 5000) and do not silently split it into additional billed calls. Raw PCM artifacts include `pcm.encoding`, `pcm.sampleRate` and `pcm.channels`. Local PCM conversion defaults to 16 kHz mono unless overridden; the current remote PCM formats are 24 kHz mono, signed 16-bit little-endian. Use `--format` when the desired container matters; defaults are backend-specific (Piper/Chatterbox/OmniVoice/HeyGen WAV; Fish and the other remote TTS adapters MP3).

```json
{
  "operation": "transcribe",
  "input": "meeting.wav",
  "timestamps": "word",
  "diarization": true,
  "preference": "quality"
}
```

Save that object as `request.json`, then use `media plan request.json --config media.config.ts`. A plan does not open the input file, contact a provider, run an executable or establish quality; it validates the request against passively discovered capabilities.

## Channel inputs, source evidence and delivery

```sh
aube run --no-install cli channels ingest "Please review this" --kind text --message-id message-1 --data .private/channel-state
aube run --no-install cli channels ingest note.md --kind document --message-id message-2 --root inputs --data .private/channel-state
aube run --no-install cli channels ingest meeting.wav --kind audio --message-id message-3 --config media.config.ts --backend whisper-cpp --data .private/channel-state
aube run --no-install cli channels status message-3 --data .private/channel-state
```

`--kind` defaults to `envelope` and reads a bounded JSON file; convenience kinds are `text`, `audio`, `video`, `image` and `document`. Channel, account, conversation and sender default to `cli`/`local`/`local`/`local`. Supply `--channel`, `--account`, `--conversation`, `--sender` to bind a different imported identity. Envelopes must match the trusted binding; JSON cannot grant itself authority. Convenience inputs generate a message ID if omitted, so supply a stable ID for retries. Use the same binding and data directory to query a receipt.

```json
{
  "version": 1,
  "channel": "cli",
  "account": "local",
  "conversation": "local",
  "sender": "local",
  "messageId": "message-4",
  "text": "Summarize the attachment",
  "attachments": [{ "id": "recording", "kind": "audio", "locator": "meeting.wav" }]
}
```

Attachments are bounded local regular files within the granted root and outside private state. The host computes SHA-256 before reserving a delivery and verifies provenance after processing. Audio/video uses the media transcription service. Images/documents use source-memory import and retain immutable originals, version IDs and Markdown when extraction is available; absent extracted text is explicit. Text, attachment outputs and speech transcripts remain untrusted source content.

Receipts use SQLite transactions and a 10,000-delivery/256 MiB database bound. An identical completed delivery reuses its validated turn. Changed content, hashes or authentication under an existing ID fails. Processing/failed receipts are visible and are not automatically retried: a previous request may already have incurred provider cost. Inspect and reconcile it before deliberately issuing a new ID. No receipt automatically resumes a paid job after a crash.

Speech events carry `sessionId`, a monotonically increasing `sequence`, and `type` (`partial`, `final`, `end`, `cancel`). Utterances have a stable `utteranceId`; final timing is optional but must be internally consistent. The reducer bounds text, timing, retained utterances and sequence counts, rejects gaps and conflicting replays, and permits an identical last-event replay. Partials never enter finalized text. Ending with unresolved partial speech fails; cancellation discards that partial. A future transport must retain this ordering and connect provider/local VAD and turn-end policy explicitly.

## Verification limits

The user reported a live HTTP 400 MIME-alias mismatch and rejection of a generated `resource2.heygen.ai` reference by the earlier local guard. Isolated fixtures reproduced those prior defects; this is distinct from a live successful enrollment or generation after the fix. Current recovery fixtures cover encrypted persistence, interrupted transactions, replay conflicts, key mismatch, confidential generated references, redacted diagnostics and exact download boundaries. Synthetic Czech/English subtitle fixtures check exact wording and cue mapping without using private approved speech. Credential-free service fixtures cover HeyGen requests/CDN validation and Fish JSON/MessagePack payloads, private enrollment and pending results. The OmniVoice fixture executes the real Python worker with deterministic fake package modules to verify the offline API contract, waveform bounds, cancellation and publication; it does not run model inference. Deterministic domain, host and CLI fixtures exercise selection, provider payloads, validation, bounded I/O, cancellation, replay and provenance without credentials or paid inference. The [native FFmpeg smoke record](data/media-runtime-verification.json) captures a real one-second, 16 kHz WAV inspection, WAV-to-FLAC conversion and FLAC inspection with matching output digest/duration on Windows using Bun 1.4.2 and FFmpeg 9.0.2. Fixture speech responses do not measure WER, diarization error, voice similarity, latency or subjective quality. Live STT/TTS/cloning, actual microphone capture and device playback require configured models/accounts/devices and remain separately identified acceptance work.

The [2026-10-25 policy and recovery verification record](data/media-policy-runtime-2026-10-25.json) records the final implementation/review gates, source hashes, cross-directory CLI smoke checks and preserved cache-evidence hashes. The [link-validation record](data/media-policy-links-2026-10-25.json) covers relative documentation links; it does not verify upstream page availability or perceptual voice identity.
