# Inworld hosted speech review

Reviewed: 2026-10-25. Scope: current official model, transport and pricing documentation; no account or inference testing. Related: [media processing](../media-processing.md), [channel input](../channel-input.md). Service pages are dated observations, not pinned implementation source.

The [documentation index](https://docs.inworld.ai/llms.txt) identifies `inworld-tts-2` and `inworld-tts-2-flash`, Basic authentication using the copied Base64 credential without re-encoding, and different short-lived token paths for clients. TTS 2 uses `deliveryMode` instead of the earlier temperature setting. A generic API-key/Bearer adapter would therefore be incorrect. Keep server credentials in the host; browser or mobile sessions need the documented token exchange.

[Synthesis methods](https://docs.inworld.ai/tts/synthesize-speech) distinguish 2,000-character synchronous requests, 4,000-character streaming requests, persistent WebSocket transport and longer asynchronous jobs. They have different latency and lifecycle semantics. A full-file result is not evidence of interactive streaming, and long text should not silently become many separately billed calls.

[Pricing](https://inworld.ai/pricing) lists on-demand TTS 2 at $25/M characters and Flash at $15/M. Creator costs $25/month with respective $20/$10 usage rates and included credits. Keep plan fees and utilization explicit. The marketing latency figures use different percentiles and measurement boundaries across pages; do not insert them as measured end-to-end values into the selection policy.

Adoption: evaluate as a future low-latency hosted candidate, especially where explicit steering or native streaming is useful. Select using language-specific quality, interruption behavior and actual network region. Broad language support is tiered in the documentation; supported code acceptance and evaluated pronunciation quality are different properties. Preserve the account's retention, residency and token capabilities separately from a general model entry. This report does not implement Inworld transport or verify its availability.
