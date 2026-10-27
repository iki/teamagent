# Mistral Voxtral hosted speech review

Reviewed: 2026-10-25. Scope: current official model card and release announcement; no inference, downloadable checkpoint or deployment license was validated. Related: [media processing](../media-processing.md), [channel input](../channel-input.md).

The [Voxtral TTS 3 model page](https://docs.mistral.ai/models/voxtral-mini-tts-3-0) labels `voxtral-mini-tts-3-0` Public Preview/Premier, released 2026-10-20, with $13/M characters and speech/cloning capabilities. Its nine-language statement conflicts with the [release announcement](https://mistral.ai/news/voxtral-3/), which describes 35+languages and 50+dialects. Preserve this discrepancy; do not choose either number as a universal verified coverage guarantee.

The model page's speech guide link currently redirects into a deprecated guide. This is a practical integration risk: a model card is insufficient evidence for the final wire contract. A later adapter must resolve the current route, model ID, voice enrollment/verification, codec options, token limits and regional endpoint before implementation. It must not inherit legacy request fields merely because both endpoints produce audio.

Adoption: an evaluation candidate for price, regional hosting and speech-agent integration once the preview contract stabilizes. The source's approximately 90 ms first-audio claim is not an end-to-end latency measurement performed by this harness. Require the same prompt/reference set, network region and percentile reporting used for all candidates.

The announcement offers on-premises/private-cloud arrangements through sales; that does not establish permissive weights or self-service local deployment. Keep hosted terms, licensed private deployment and a public source-code license distinct. The recovered Astra notes motivate this candidate but do not settle the language discrepancy or qualify it as a completed backend. No Mistral TTS adapter is implemented by this report.
