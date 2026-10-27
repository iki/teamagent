# MiniMax hosted speech review

Reviewed: 2026-10-25. Scope: official speech pricing and rapid-cloning API; no provider execution. Related: [media processing](../media-processing.md), [generation](../generation.md). No Git commit applies to this service-only review.

The [official pricing table](https://platform.minimax.io/subscribe/token-plan?tab=api-enterprise) lists `speech-2.8-hd` at $100/M characters, `speech-2.8-turbo` at $60/M and rapid cloning at $1.50/voice. These are stated list prices, not measured cost per useful output. Keep synthesis usage and voice-resource charges separate; do not turn a one-time enrollment charge into a per-request rate.

The [clone contract](https://platform.minimax.io/docs/api-reference/voice-cloning-clone) uses Bearer-authenticated `POST https://api.minimax.io/v1/voice_clone`, a previously uploaded `file_id` and a chosen `voice_id`, with optional prompt audio/text and preview synthesis fields. It warns that an unused clone is deleted after 7 days. The response includes structured `base_resp`, so HTTP success alone cannot prove operation success. A future lifecycle must track the source upload, resource ID, verification/preview result and expiration independently.

Adoption: retain as a hosted comparison candidate for expressive content. Before implementation, verify the current synthesis wire format and whether the chosen endpoint returns encoded audio, a URL or streaming frames. Provider-compatible naming is not enough to reuse another adapter. Keep output watermark/provenance controls explicit and preserve rights evidence for the sample.

The retrieved Astra comparison discusses 40 languages and first-use billing details; this scoped review does not independently establish those claims. No service latency, speaker similarity, hardware requirement or paid entitlement was tested. A future adapter should be promoted only after exact contract fixtures and an authorized evaluation on the user's languages and recording conditions.
