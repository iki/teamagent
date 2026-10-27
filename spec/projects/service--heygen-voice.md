# HeyGen Voice service review

Reviewed: 2026-10-25. Scope: current public API documentation, not a provider account or inference run. Service documentation has no reviewed Git commit; mutable sources are dated in the [supplemental ledger](../data/voice-backends-review-2026-10-25.json). Related: [media processing](../media-processing.md), [generation](../generation.md), [channel input](../channel-input.md).

The useful integration is the dedicated HeyGen Voice API. `POST https://api.heygen.com/v3/models/audio/tts` uses `X-Api-Key`, an explicit `model`, `voice_id` and `text`. It returns a 44.1 kHz WAV URL; `/tts/stream` uses SSE. Public or owned voices must be ACTIVE. The three documented models are `heygen-voice-1`, `heygen-voice-1-turbo` and `heygen-voice-1-turbo-free`; professional clones require the standard model. Free requests do not automatically switch to paid synthesis. [Speech contract](https://developers.heygen.com/docs/voices/heygen-voice-speech).

Instant enrollment uses `POST /v3/models/audio/voices` with `mode: instant`, then `GET /v3/models/audio/voices/{voice_id}` to reconcile PENDING, ACTIVE or FAILED. A recording, its upload, a voice ID and readiness are separate resources. The guide recommends `similarity: max` for identity matching; synthesis expressiveness is a separate control. Its first-three-minutes rule is a provider preprocessing rule, not evidence that arbitrary long uploads are harmless. [Enrollment guide](https://developers.heygen.com/docs/voices/heygen-voice-instant-clone).

Design consequence: retain an idempotency key and pending receipt before reporting an enrollment outcome. A returned ID is not proof of readiness. A synthesis result URL is untrusted transport data: use a fixed permitted output origin, bound bytes/time, withhold credentials from the download, inspect the actual WAV and publish locally only after validation. SSE parsing, timestamps and audio playback cancellation need separate adapters; a file download adapter does not implement a live conversation.

Pricing is unresolved across current primary pages. The [Voice marketing page](https://www.heygen.com/heygen-voice) lists $30 per million characters, while the [Turbo announcement](https://www.heygen.com/blog/heygen-voice-turbo) lists standard $15 and Turbo $4. Turbo Free is documented through 2026-11-30 with capacity limits. Keep a dated, route-specific quote and account billing evidence; do not silently reconcile these figures or carry a promotion into a permanent cost profile. The [fal service review](service--fal-speech.md) covers a distinct billing route.

Adoption: suitable for an explicit hosted TTS/enrollment adapter and a controlled speaker-fidelity evaluation. Leaderboard and latency claims do not establish quality for the user's voice, language or recording. The recovered Astra comparison supplies hypotheses, not verified measurements.

## Training policy review 2026-10-25

The [privacy policy](https://www.heygen.com/privacy) applies to API use and permits model improvement from non-enterprise content. The [security policy](https://www.heygen.com/security) identifies Enterprise exclusion and an opt-out path. Neither a free Voice API model nor instant clone creation establishes an account exclusion.

The harness therefore records a known-permitted default with conditional exclusions. A reviewed Enterprise agreement or completed opt-out must match a live authenticated account/key identity, exact model, host, operation and current revisions; account diagnosis alone does not verify opt-out. Without that exclusion, only explicit per-invocation training opt-in permits content processing. See the [training boundary](../media-training.md) and [dated policy ledger](../analyses/media-training-reviews.md). This scoped review does not inspect or modify an actual account. The policy page is dated 2026-10-15; a service source commit is unavailable.

## Public-source refresh 2026-10-27

The [refresh ledger](../analyses/media-refresh-2026-10-27.md#heygen-contract-and-pricing-follow-up) records continued policy conditions, current MIME documentation versus observed interoperability, and price disagreement for both paid variants. It also reviews the [speech-to-speech route](https://developers.heygen.com/docs/voices/speech-to-speech) as an unimplemented candidate. Preserving input words/timing does not translate the Czech source into the approved English script. No account verification, generation, download or new CDN approval was performed; the existing user assertion and delivery evidence keep their original status.
