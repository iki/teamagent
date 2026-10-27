# Piper: provisioned local voices

Source: [OHF-Voice/piper1-gpl](https://github.com/OHF-Voice/piper1-gpl). Review date: 2026-10-25. Scope: external primary-source review outside the original inventory. Analyzed commit: [`404aefedbd74baa0bd43e451bc407a2b3aace0f5`](https://github.com/OHF-Voice/piper1-gpl/commit/404aefedbd74baa0bd43e451bc407a2b3aace0f5); commit date: 2026-09-09T21:40:27Z. The exact CLI blob was retrieved through the GitHub connector. Record the installed runtime and voice hashes separately; this review does not claim a local model test.

## Observed contract

The current [Python CLI](https://github.com/OHF-Voice/piper1-gpl/blob/404aefedbd74baa0bd43e451bc407a2b3aace0f5/src/piper/__main__.py#L20-L258) accepts `--model`, `--output-file`, optional `--speaker` and stdin text, with input-file alternatives. It looks for an existing voice and raises an error directing the user to a separate downloader when absent. Supply an explicit WAV output path: omitting it may invoke playback when available or create a default output file. The writer obtains sample rate, sample width and channel count from synthesis chunks; these properties must not be guessed from a generic TTS default.

This is a useful fixed-voice local TTS contract. It does not imply arbitrary voice cloning, matching an externally enrolled voice ID, or availability of every language. Speaker indices belong to the selected model. Treat the ONNX file and its configuration as one versioned voice resource, and distinguish code licensing from each voice's distribution terms. The maintained repository's GPL scope and individual checkpoint licenses require review for the selected deployment; neither establishes a blanket prohibition on local use.

A version-specific configuration caveat is visible in that same source: the CLI declares `--config`, but its model-load call supplies only the model path and CUDA option. It does not forward the parsed configuration argument there. Acceptance of a flag therefore does not establish that a custom configuration file is used. Prefer the verified companion ONNX JSON layout for this adapter until a particular executable/version proves otherwise; native or later CLI implementations may differ. This is a source observation, not an executed regression test.
## Adoption and verification

Use an explicitly provisioned runtime and local voice. A native Piper executable and the current Python module are different launch contracts; discovery should identify which interface it verified, then run the corresponding adapter. Do not install Python dependencies or fetch voices merely because automatic selection finds no candidate. A smaller fixed voice may be a good latency or offline option, but preference requires actual device measurements.

Test input via stdin so arbitrary speech text cannot become command-line switches. Validate the produced WAV, output containment and cancellation behavior, and keep model load latency separate from synthesis latency. Confirm pronunciation for code identifiers, numbers and the user's target languages. Record voice license, model hash, runtime version and synthesis settings with generated artifacts. No audio quality, real-time performance or packaged application behavior was measured by this source inspection.

Related: [media processing](../media-processing.md) · [generation](../generation.md).