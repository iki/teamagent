# streambert

Source: [streambert](https://github.com/truelockmc/streambert) · Category: [ai-media](../categories/ai-media.md)

Review depth: **inventory / README screening only**. This is an individual coverage record, not a source-code correctness audit or adoption recommendation.

Snapshot: `4afe564e5ea2565c96d6f2e61679c00fad2d498c`; commit timestamp `2026-09-11T18:33:35+02:00`; 106 tracked paths.

## Scope and evidence

Upstream description excerpt (a project claim, automatically extracted from [README](https://github.com/truelockmc/streambert/blob/4afe564e5ea2565c96d6f2e61679c00fad2d498c/README.md)):

> [](https://github.com/truelockmc/streambert/issues?q=is%3Aissue+is%3Aclosed) A cross-platform Electron Desktop App to stream and download any Movie, TV Series or Anime in the World. Zero Ads and Tracking

Build/package evidence: [package.json](https://github.com/truelockmc/streambert/blob/4afe564e5ea2565c96d6f2e61679c00fad2d498c/package.json)

License evidence: [LICENSE](https://github.com/truelockmc/streambert/blob/4afe564e5ea2565c96d6f2e61679c00fad2d498c/LICENSE) Classification hint: GPL; inspect version. A root license does not establish rights for every bundled asset, model, or dependency.

## Harness assessment

This entry was catalogued under **ai-media**. Its category places it in the candidate set for import-generation; those associations are navigational and have not been individually validated as implemented capabilities. See [import-generation](../import-generation.md) for the source-reviewed alternatives and proposed integration boundaries.

**Disposition:** retain as a comparison candidate. Before adopting it, inspect the implementation entry point and its tests, verify the required protocol and deployment platform, and reproduce a task from the harness evaluation suite. Popularity, a README feature list, and the presence of a package manifest are insufficient evidence of quality or compatibility.

**Unresolved:** runtime behavior, security boundaries, performance, API/subscription eligibility, dependency health, maintenance status, and fit to the proposed harness were not independently established for this entry. No repository code was executed as part of this screening.

## Speech review: 2026-10-25

The newly cited source files match their exact upstream Git blobs; see [source validation](../data/media-source-validation.json).

Focused snapshot: [`18207c43fc982d4a25ad8f061690cb6fda8b452e`](https://github.com/truelockmc/streambert/commit/18207c43fc982d4a25ad8f061690cb6fda8b452e), commit date 2026-10-17T15:57:47+02:00. Scope: source inspection of subtitle ingestion, not the entire Electron application. The earlier inventory baseline remains intact.

The inspected [subtitle module](https://github.com/truelockmc/streambert/blob/18207c43fc982d4a25ad8f061690cb6fda8b452e/src/ipc/subtitles.js#L1-L87) searches/downloads subtitle assets and extracts supported subtitle extensions from ZIP entries. It imposes a decompressed-entry bound, uses a filename basename and caps inflation output. Its request helper has a timeout and clears the timer. These are concrete ingestion mechanisms, unlike a claim that the application can recognize or synthesize speech.

The module is not evidence of STT, TTS, voice enrollment or conversational endpointing. Its useful role is playback and accompanying text artifacts. The [language-hint logic](https://github.com/truelockmc/streambert/blob/18207c43fc982d4a25ad8f061690cb6fda8b452e/src/ipc/subtitles.js#L89-L114) also illustrates that subtitle labels can be inferred from metadata rather than established by audio recognition. A harness should preserve the distinction between provider metadata, filename heuristics and model-detected language.

For Teamagent, subtitles can be imported as timed evidence linked to the exact media artifact. Retain their source URL/license, retrieval time, language provenance and synchronization offset. Externally supplied subtitles are not an authoritative transcription of a recording until their alignment/content has been checked. A user correction becomes a versioned derivative instead of overwriting the original.

Borrow the bounded extraction intent, but do not adopt a handwritten ZIP scanner as a general archive-security boundary without dedicated format validation and adversarial tests. Entry-size bounds alone do not cover total entry count, total expansion, repeated work, archive structure, network redirects or trust in external providers. The proposed importer must enforce these independently. Test malicious names, unsupported compression, truncated data and subtitle encoding before production reuse.

Disposition: useful media/subtitle UX reference; exclude from automatic speech-backend candidates. No playback, network subtitle request, extraction fixture or security exploit was executed during this focused review.

Related: [media processing](../media-processing.md) · [channel input](../channel-input.md) · [import and generation](../import-generation.md).
<!-- teamagent-analysis:start -->
Analysis metadata: source [streambert](https://github.com/truelockmc/streambert); analyzed commit `4afe564e5ea2565c96d6f2e61679c00fad2d498c`; commit date 2026-09-11T18:33:35+02:00; review date unknown; depth screened. [Maintenance record](../analyses/repos/ai-media--streambert.md).
<!-- teamagent-analysis:end -->
