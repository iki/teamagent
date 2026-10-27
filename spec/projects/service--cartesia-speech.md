# Cartesia Sonic hosted service review

Reviewed: 2026-10-25. Scope: official API and pricing documentation; no inference or SDK execution. Related: [media processing](../media-processing.md), [channel input](../channel-input.md). No Git commit is associated with this service-only review.

The [bytes endpoint](https://docs.cartesia.ai/api-reference/tts/bytes) documents `POST https://api.cartesia.ai/tts/bytes`, Bearer authentication and `Cartesia-Version`, with explicit `model_id`, `transcript`, voice and output format. Its current example selects `sonic-3.6` and WAV/PCM16/44.1kHz. SSE and WebSocket methods are separate transport contracts. Version the API header and model together; do not copy an older SDK voice-object shape without checking the chosen version.

The [pricing page](https://www.cartesia.ai/pricing) offers 100k credits for $5/month, 1.25M for $49 and 8M for $299. At one credit per TTS character, full utilization implies approximately $50,$39.20 and$37.38 per million characters. This arithmetic is a plan-capacity comparison, not a published pay-as-you-go quote: unused credits, overages, cloning and other products change effective cost. The page places commercial use and instant cloning on paid Pro, with professional cloning on higher tiers.

Adoption: a candidate for a later streaming backend, evaluated against the same first-audible-sample and interruption criteria as other services. Maintain a per-account voice registry and explicit API-version compatibility. Treat provider language claims as a coverage hypothesis; test Czech and mixed-language code identifiers rather than inferring them from a multilingual label.

A future adapter should implement one transport first, reject unsupported format/version combinations before charging, and preserve cancellation versus completed-generation status. Managed agents include additional orchestration and billing; they are not equivalent to this TTS endpoint. No Cartesia adapter is established by this research report.
