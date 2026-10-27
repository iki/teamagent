# Chatterbox: reference-conditioned local speech

Source: [resemble-ai/chatterbox](https://github.com/resemble-ai/chatterbox). Reviewed 2026-10-25 at [`3f35dfc8fbe63e5b29793289dc68f1875bb317a5`](https://github.com/resemble-ai/chatterbox/commit/3f35dfc8fbe63e5b29793289dc68f1875bb317a5), commit date 2026-05-01. External source review of the English `ChatterboxTTS` path, not all multilingual/turbo variants or an installed model validation.

## Observed implementation

[`from_local`](https://github.com/resemble-ai/chatterbox/blob/3f35dfc8fbe63e5b29793289dc68f1875bb317a5/src/chatterbox/tts.py#L119-L167) loads voice-encoder, T3 and S3Gen safetensors plus tokenizer JSON, optionally saved conditioning; `from_pretrained` instead calls the model downloader. [`generate`](https://github.com/resemble-ai/chatterbox/blob/3f35dfc8fbe63e5b29793289dc68f1875bb317a5/src/chatterbox/tts.py#L169-L251) accepts `audio_prompt_path`, derives conditioning, creates waveform output and applies a Perth watermark. Conditioning is mutable model state. This is reference-conditioned synthesis, not evidence that enrollment trains a new voice model.

[T3 construction](https://github.com/resemble-ai/chatterbox/blob/3f35dfc8fbe63e5b29793289dc68f1875bb317a5/src/chatterbox/models/t3/t3.py#L43-L77) builds its transformer from configuration. [S3 construction](https://github.com/resemble-ai/chatterbox/blob/3f35dfc8fbe63e5b29793289dc68f1875bb317a5/src/chatterbox/models/s3gen/s3gen.py#L41-L54) reaches a tokenizer whose [parent constructor](https://github.com/resemble-ai/chatterbox/blob/3f35dfc8fbe63e5b29793289dc68f1875bb317a5/src/chatterbox/models/s3tokenizer/s3tokenizer.py#L19-L47) belongs to another package. Four checkpoint files alone cannot prove every dependency is available offline. [Package declarations](https://github.com/resemble-ai/chatterbox/blob/3f35dfc8fbe63e5b29793289dc68f1875bb317a5/pyproject.toml#L10-L25) also leave some dependencies unpinned or branch-based.

## Adoption and tradeoffs

Offer an isolated, explicitly configured worker using `from_local`, a provisioned environment and existing checkpoint directory. Record runtime/package and model provenance separately. Never substitute `from_pretrained` after local load failure. Offline environment flags are useful but do not prove every dependency respects them; a network-denied load and synthesis smoke test is the readiness evidence. Missing package assets should produce an unavailable reason.

Use one worker/model conditioning context per job or serialize access. Otherwise a concurrent request may replace another voice's reference. Keep reference hashes and consent/usage scope with the voice resource, and retain output provenance. A successful waveform or embedding similarity does not verify legal identity, consent or perfect imitation. Preserve the model watermark; do not promise it survives arbitrary transformations.

This candidate enables an authorized local cloning workflow without a hosted enrollment service, but adds Python, model-memory and cancellation costs. Keep fixed-voice TTS available for tasks that do not require cloning. Evaluate intelligibility and speaker similarity separately, on authorized references, before claiming a preferred model. No installation, inference, watermark-detection test or performance measurement was performed.

Related: [media processing](../media-processing.md) · [generation](../generation.md).