# Media source refresh — 2026-10-27

[Media processing](../media-processing.md) · [Runtime](../media-runtime.md) · [Training ledger](media-training-reviews.md) · [Source metadata](../data/media-refresh-2026-10-27.json)

This is a public-document review against the 2026-10-25 findings, not an account check, a provider execution test or a new source-code baseline. The policies still support the existing conditional exclusions. No credentials, recordings, provider settings or prepared delivery files were accessed or changed. The runtime policy revision remains `media-provider-review/2026-10-25`, expiring 2026-11-24; this document does not extend it or replace scoped account evidence.

## Training policy continuity

| Provider report | Current observation | Operational consequence |
|---|---|---|
| [OpenAI](../projects/service--openai-speech.md#public-source-refresh-2026-10-27) | The [API data guide](https://developers.openai.com/api/docs/guides/your-data) retains the default training exclusion unless sharing is enabled. | Preserve exact account/route evidence requirements; retention remains separate. |
| [HeyGen](../projects/service--heygen-voice.md#public-source-refresh-2026-10-27) | The [privacy page](https://www.heygen.com/privacy), dated 2026-10-15, and [security page](https://www.heygen.com/security) retain non-enterprise training permission and Enterprise/opt-out paths. | A public source review does not authenticate the user's asserted opt-out. No Free Voice exception was established. |
| [ElevenLabs](../projects/service--elevenlabs-speech.md#public-source-refresh-2026-10-27) | The [data-use guide](https://elevenlabs.io/docs/help-center/legal/is-my-data-used-to-improve-eleven-labs-ai-models) retains prospective opt-out and Enterprise exclusion. The [retention guide](https://elevenlabs.io/docs/eleven-api/resources/zero-retention-mode) still excludes instant/professional cloning from zero retention. | Keep training exclusion and retained cloning resources separate. |
| [Fish](../projects/external--fish-speech.md#public-source-refresh-2026-10-27) | [Standard terms](https://fish.audio/terms/) permit improvement. The [Customer Agreement](https://fish.audio/enterprise-terms/), dated 2026-08-10, retains eligible ZDR and retained-feature exceptions. | Persistent enrollment still needs operation-specific evidence; a paid/private voice does not establish exclusion. |

Other hosted candidates were not reviewed for training policy and remain unknown. Local processing claims were not re-audited in this public-policy refresh. Nothing here changes consent, commercial rights, authenticated access or effective network isolation.

## HeyGen contract and pricing follow-up

The [speech guide](https://developers.heygen.com/docs/voices/heygen-voice-speech) retains the identity-oriented settings `similarity: max` for enrollment and `expressiveness_boost: 0.5` for synthesis, distinct from omitted-field API defaults. Turbo Free is still advertised through 2026-11-30 with shared capacity. The [instant-clone guide](https://developers.heygen.com/docs/voices/heygen-voice-instant-clone) still documents `audio/wav` for inline WAV and 24-hour idempotency reuse. Keep the previously observed same-bytes `audio/x-wav` workaround: documentation is not evidence that the reported MIME mismatch has been fixed. This review performed no upload.

The pricing conflict affects both paid variants: [current marketing](https://www.heygen.com/models/heygen-voice-1) displays standard $30 and Turbo $15 per million characters, while the [2026-10-21 announcement](https://www.heygen.com/blog/heygen-voice-turbo) lists $15 and $4 respectively. No account quote was checked. Preserve explicit free-model selection and avoid using either public page as a billing guarantee.

The [speech-to-speech guide](https://developers.heygen.com/docs/voices/speech-to-speech) describes `POST /v3/models/audio/sts`, model `heygen-voice-sts-0`, for an ACTIVE owned instant voice. It preserves the input wording and timing; it does not provide a Czech-to-English translation contract. It is an unimplemented research candidate requiring its own policy scope, bounded input validation, receipts and recovery review. Its timeout description says work may still be running, reinforcing the existing prohibition on blind retries. The approved English SRT, existing voice and local duration measurements remain the prepared workflow's evidence. The [permission table](https://developers.heygen.com/docs/api-key-permissions) separates voice reads from mutations; it does not attest to training settings.

## Fish route migration watch

The [pricing and rate-limit guide](https://docs.fish.audio/developer-guide/models-pricing/pricing-and-rate-limits) still lists S2.1-Pro at $15/M UTF-8 bytes, its free variant at $0, and Drama 3 at $50 list/$10 promotion until 2026-11-12 17:00 UTC. It explicitly documents S1 retirement on 2026-12-31 and upstream replacement of subsequent `s1` requests by `s2.1-pro`. The current adapter accepts `s1`; that future upstream behavior is a compatibility risk, not an authorized model substitution. Before that retirement, re-review or disable the obsolete route rather than describing the returned model as pinned. No default/model change or migration was performed by this refresh.

## Evidence limits

All linked pages were opened through public web retrieval on 2026-10-27. Mutable pages expose no reviewed Git revision; retrieval success is not proof that a page is byte-for-byte unchanged or that every linked policy was audited. The initial instant-clone page retrieval failed, then succeeded through the official model-page link. No source substitution was needed. Pricing, promotion deadlines and new route candidates remain dated observations. Existing fixture results and the user-reported 2026-10-25 delivery remain historical evidence, not tests rerun by this review.
