<!-- conversation: d321e92b71482b2a53ae9e5f725ca9d4205946fa04f0dddf2e507c5fd6b966bf -->

Date: 2026-10-25T21:29:46.982Z
Session: 01a10528-79e7-78f2-b4c1-5ab93ef69ee1
Turn: 01a174b5-4ccf-7d22-b63f-1822c3cfe962
Agent: codex
Model: gpt-6-astra
Reasoning level: ultra

Public transcript only. Recognized credentials and requested literal redactions are replaced with [redacted] markers.

## Prompt

Improve the existing teamagent media CLI with non-training selection defaults and transparent voice-data policies, while preserving the prepared Czech-to-English voice workflow. HeyGen is a candidate only after confirmed exclusion or explicit training-risk opt-in.

Context and observed results
We are testing from ../../../x-trigon using cache-only scripts that invoke the existing ../../app/cli/index.ts media entry with Bun. Do not add Trigon-specific package scripts or integrate the unpublished library into that project yet. Preserve the current input/output root boundaries, explicit provider selection, credential isolation, exclusive output writes and no automatic retry of ambiguous provider actions.

The existing CLI successfully inspected the final Czech AAC/M4A (60.032 seconds, mono, 48 kHz) and converted it to a 59.978417-second mono 24 kHz PCM WAV, 2,879,042 bytes. The approved English SRT became 161 words / 905 non-newline characters of plain speech text. On 2026-10-25 the user confirmed the HeyGen training opt-out and provided a fnox-scoped API key. Treat the opt-out as a user assertion, not an authenticated policy verification. Real enrollment and synthesis were then tested; the key was never saved in these cache receipts. The CLI remained in use for local preparation and inspection. Narrow cache-only host/API helpers were required to diagnose and work around the confirmed defects below; no teamagent source changes or Trigon package-script integration were made.

Confirmed provider interoperability defects, 2026-10-25
- Enrollment with the adapter's media_type:audio/wav was rejected with HTTP 400, code invalid_parameter, message "Content type not match audio/wav != audio/x-wav". The same reference WAV bytes (SHA-256 746b4393575f8baedb5157c5b6ffdb8c1cdfb8811eb50d7aba79d8bd4387e4a7) succeeded with only the inline media_type changed to audio/x-wav: HTTP 202 returned voice 91633b967a564d518b602dc983e22c46. A subsequent read-only status request confirmed ACTIVE, language cs. This is an observed provider MIME-alias interoperability mismatch; audio/wav is not inherently invalid. Preserve the source bytes and normalize aliases deliberately in the provider adapter. Evidence: host-clone-http.json, host-clone-wavfix-http.json, host-clone-wavfix-result.json and voice-active.json in this cache directory.
- The ordinary CLI hid the known HTTP rejection behind "error: network: HeyGen enrollment outcome could not be confirmed". The transport destroyed non-2xx responses before recording status/body/request ID, then the enrollment wrapper erased the remaining distinction. Both direct node:https GET and Bun fetch GET authenticated successfully, so the generic label was not proof of a network failure. HTTP diagnostic receipts must retain actionable, redacted evidence; in this particular clone response the request ID was absent and should remain null rather than be invented.
- A successful CLI synthesis response was rejected by its download-location guard because HeyGen supplied the legitimate https://resource2.heygen.ai/text_to_speech/ origin/path instead of the adapter's sole https://files.heygen.ai/generated/ pair. The generation result was discarded without a recoverable download reference, forcing one additional synthesis through a cache-only API helper. The final helper request used heygen-voice-1-turbo-free, language en and expressiveness_boost:0.5; it succeeded with HTTP 200 and request ID 4308937748044313aa3b1a0fb3aca3b6. Provider duration was 51.16451247165533 seconds, with no alignment payload returned. The resulting WAV was 4,512,754 bytes. Evidence: synthesis.stderr.log and native-synthesis-result.json. Do not treat CDN allowlist failure as failed generation, and do not regenerate automatically to recover a completed artifact.
- Final delivery was fitted locally to exactly 60 seconds and saved as Trigon-AI.en.m4a with language eng and 22 retimed SRT cues. Delivery checks recorded 161 approved words, 161 recognized words, zero wording differences and zero timing warnings; approved subtitle wording and line breaks were preserved. The Czech source and prior English placeholder/subtitles were preserved, and merged videos were not changed. Evidence: delivery.json. These measurements establish delivery/timing and text checks, not a claim of perfect perceptual voice identity.

Prioritized work
1. Default to non-training backends and model routes. Here training means the provider's reuse of customer inputs, recordings, outputs or derived voice data for general/shared model improvement, not the specifically requested private voice-cloning operation. Enforce the effective account/route policy before ranking and before any content upload, including enrollment. Require an explicit per-invocation --allow-training CLI option to use a known may-train route; neither backend/model overrides, configuration priorities nor fallback may bypass the default. Keep unknown policy blocked pending evidence. Conditional exclusions count only when the relevant opt-out/contract and operation coverage are established. Never enable provider data sharing as a side effect of this option. Mirror the safe default in the library request policy.

2. Always show non-training/training information in backend and model lists, their JSON forms, selection plans and relevant CLI help/setup output. Current model entries live inside media backends; do not pretend a standalone models command already exists. Use precise states such as excluded, permitted, conditional and unknown, with a derived effective decision. Include provider default, operation/model/host scope, account conditions, source URL, review date, evidence/verification level and a concise explanation. Root and operation help must explain the default and --allow-training; backend/model help must disclose route-specific conditions. Display exclusions instead of hiding blocked providers. Keep retention, cloud egress, commercial licensing and voice consent separate. An API key is not proof of opt-out, Enterprise coverage or account sharing settings. Show user assertions as assertions, not authenticated checks.

3. Update spec/media-processing.md and the linked media runtime documentation, per-provider reports and voice-backend review ledger with the dated findings below. Preserve historical evidence and distinguish implemented adapters from research candidates. The full review is saved at ../../../x-trigon/.cache/demo/v2/temp/voice-clone/heygen/MEDIA-TRAINING-ANALYSIS.txt. Propagate policy rules to the operational contract, not only this analysis. Do not mark the implementation complete until the gates and help/listing disclosures exist.

Research summary, checked 2026-10-25:
- ffmpeg, whisper-cpp, piper, chatterbox and omnivoice: inspected local processing/inference has no provider-training path. Require trusted provisioned resources and disclose actual network isolation; Python socket restrictions are not an OS firewall.
- OpenAI API: no training by default unless data sharing is explicitly enabled. Check account conditions. The implemented adapter has STT and optional legacy speech, not custom enrollment. https://developers.openai.com/api/docs/guides/your-data
- ElevenLabs: ordinary accounts may train; disabling Improve the models for everyone excludes future submissions. Enterprise has a default general-training exclusion. Stored cloning resources are separate from training opt-out. https://elevenlabs.io/docs/help-center/legal/is-my-data-used-to-improve-eleven-labs-ai-models
- HeyGen: non-enterprise may train; confirm email opt-out or Enterprise coverage before classifying a route as excluded. Free Voice API has no identified special exemption. https://www.heygen.com/privacy and https://www.heygen.com/security
- Fish: standard terms allow training; Customer Agreement permits aggregated-data improvement except eligible enabled ZDR. Verify exact feature coverage, especially persistent enrollment. Private visibility and paid access are insufficient. https://fish.audio/terms/ and https://fish.audio/enterprise-terms/
- Other candidates/hosts: not researched for this task; unknown must remain blocked.

4. Add voice lifecycle get/list/wait operations. Enrollment currently returns pending, but the caller cannot check ACTIVE using the CLI. Preserve provider readiness and verification information rather than hardcoding requiresVerification:false. Return retained reference asset identifiers and expose cleanup where the provider supports it.
5. Make enrollment and completed-speech recovery resumable: accept a caller-supplied idempotency key where the provider supports it, persist a receipt before the request, and retain that key across reconciliation/resume. Today each enrollment invocation creates a fresh random key that is not saved. Classify confirmed HTTP rejection separately from transport/timeout uncertainty, pending acceptance, successful generation awaiting download and successful publication. Preserve HTTP status, bounded/redacted provider code/message, content type and request ID when supplied; never collapse all provider errors into network. Keep API keys, request authorization headers and uploaded base64 out of receipts/logs. Record absent IDs as null. A known-rejected request may be deliberately corrected under a new attempt/key; an ambiguous attempt must first be reconciled through provider state/history. Never blindly retry an ambiguous clone or billable speech request, and do not promise speech idempotency unless its route supports it.
6. Keep backends/plan passive. Add a separately named, explicitly authenticated diagnostic command for key/scopes/account/model access. Current environment-variable presence is not proof of authentication or readiness. Include dated pricing/entitlement information without treating free generation as a commercial license. Do not silently fall back from a requested free model to paid.
7. Improve provider-specific preflight before remote work: actual reference format/size, name/text limits, voice/model compatibility and output existence. Model-less clone capability should be clearly distinguished from speech models. Surface an explicit conversion plan when normalization is necessary; do not transform input silently. Detect an existing candidate before incurring a synthesis charge.
8. Expose supported HeyGen controls: clone language and similarity; speech language, expressiveness and timestamps where supported. Document that closest-identity guidance currently recommends clone similarity:max and speech expressiveness_boost:0.5, while omitted fields use different defaults. Use Czech cs for this reference and English en for speech. Reject unsupported instant-clone speed/pitch/break controls clearly.
9. Support an explicit SRT-to-speech text import mode that removes numbering/timestamps, preserves approved wording, and retains cue mapping. Current --text-file reads raw text and would speak SRT structure. Report measured audio duration, sample rate and channels, retaining provider-reported duration separately. A 60-second timing target is not guaranteed by the input subtitles and should never be claimed without measurement.
10. Document fnox command-scoped environment injection and hidden-prompt setup, cache-only configuration, no-overwrite candidate outputs, and recovery after ambiguous failures. Do not put credentials in JSON, output receipts, subprocess diagnostics or examples.
11. Fix HeyGen WAV MIME-alias handling using the confirmed same-bytes evidence above. Validate actual media rather than trusting an extension, recognize audio/wav and audio/x-wav as WAV aliases, and select the provider-accepted inline declaration explicitly. Preserve the reference hash and report the normalized declaration without silently transcoding. Add fixtures covering the exact HTTP 400 mismatch and successful alias normalization, so the observed contract mismatch cannot regress. Do not implement blind retries that change MIME after an ambiguous outcome or claim all providers reject audio/wav.
12. Extend the download allowlist with individually reviewed exact HTTPS origin/path pairs, including https://resource2.heygen.ai with /text_to_speech/ and the existing https://files.heygen.ai with /generated/. Add other official CDN pairs only after equivalent review; do not permit arbitrary URLs or every *.heygen.ai host. Preserve credential-free downloads, no cookies, no redirects, rejection of URL userinfo/fragments, byte/time bounds, content-type and WAV integrity validation, and exclusive atomic output publication. Immediately after a successful synthesis response, securely persist a recoverable artifact reference and completed-generation receipt BEFORE download-origin validation or any download. Treat full/signed URLs as bearer-sensitive: use restricted/encrypted local recovery storage, never ordinary stdout or diagnostic logs; expose only a safe origin/path summary there. A download/resume command must revalidate the reference against the current reviewed allowlist and recover the already-generated artifact without another synthesis. Handle expired URLs via the provider's supported existing-result recovery, or report the limitation; do not silently generate again. Preserve unsupported-origin results for review without fetching them.

Validation
First demonstrate rejection without any content upload for default may-train/unknown policies, unverified conditional policies and explicit backend/model attempts to bypass the gate. Cover permitted --allow-training use, unchanged provider settings, account/route evidence invalidation, retained opt-outs, and truthful help/JSON/list/plan disclosures. Unknown must not silently become excluded. Then implement and recheck these boundaries.
Use fixture-driven boundary tests for planning vs execution, pending/active/failed voice states, idempotent resume, preexisting outputs, redacted authentication errors, unsupported controls and exact SRT wording preservation. Reproduce the actual WAV alias rejection before implementing its normalization. Cover known HTTP rejection versus ambiguous transport failure, absent request IDs, successful JSON schema failures and receipt preservation. Demonstrate rejection of the resource2 CDN under the old allowlist, then allow only its reviewed exact origin/path; retain adversarial host/path, redirect, credential-forwarding, oversized-response and invalid-audio rejections. Verify that a completed-generation reference survives unsupported CDN validation, process interruption and download failure, remains confidential, and resumes without another synthesis call. Run real provider calls only when credentials and the chosen model/cost scope are available. Report separately what is statically validated, locally executed and actually provider-tested. Keep this reusable in teamagent and defer Trigon project integration until the CLI/lib is published.

Official references reviewed 2026-10-25
https://developers.heygen.com/docs/api-key-permissions
https://developers.heygen.com/docs/models/heygen-voice
https://developers.heygen.com/docs/voices/heygen-voice-instant-clone
https://developers.heygen.com/docs/voices/heygen-voice-speech
https://www.heygen.com/terms



## Response

Implemented in teamagent:

- Non-training defaults, invocation-only `--allow-training`, and policy/evidence disclosures.
- HeyGen lifecycle and diagnostics, encrypted receipts, and download recovery without regeneration.
- WAV MIME/CDN fixes, speech controls, and SRT wording/cue preservation.

Types, lint, `step:check` and `review:check` passed: **316 tests**. CLI checks from Trigon also passed.

[Runtime guide](../media-runtime.md) · [Setup](../media-setup.md) · [Training policy](../media-training.md)

HeyGen’s reported opt-out remains a user assertion. HeyGen mutations require the documented recovery-key setup and established exclusion evidence or explicit training-risk opt-in. Trigon files remain unchanged; no new live media calls or package publication occurred.

## Processing Log

I’ll read the saved analysis and receipts, then add the training-policy gate before tackling lifecycle and recovery. I’ll keep the changes reusable in teamagent and preserve the prepared Trigon audio, subtitles and cache workflow.


I’m applying the repository’s Effect, Cleye, C12 and Aube guidance. I’ve split the work across policy enforcement, durable recovery, and HeyGen interoperability; I’ll handle the shared CLI contracts and subtitle import.


The policy review separates general model improvement from the private clone the user requested. The existing HeyGen opt-out will remain labeled as a user assertion; a key, private voice or free model will not establish an exclusion. Recovery receipts will use a separate encryption key so signed artifact URLs stay out of normal JSON output and logs.


The baseline fixture reproduced both defects: unchanged WAV bytes declared as `audio/wav` received the recorded HTTP 400 mismatch, and the old guard rejected the `resource2.heygen.ai/text_to_speech/` URL. That gives us a before/after regression check without uploading the Czech reference again.


The policy and recovery code is in place. I’m now connecting the CLI commands and checking the boundaries: blocked policies must stop before upload, and completed speech must remain recoverable without generating it again.


The CLI will distinguish passive policy information from authenticated account checks. Authentication can establish which account/key is in use; it will not be presented as proof of a training opt-out, model entitlement or commercial license. I’m also checking that an interrupted request cannot be submitted again accidentally.


The local fixtures now cover the WAV alias mismatch, pending voice status, and recovery from a saved generation reference. I’m running the first assembled checks and reviewing duplicate-request handling so a failed download or uncertain submission cannot cause another charge.


Policy checks now run before selection and again before upload. The recovery journal also blocks duplicate unfinished requests even if a caller changes the output filename or clone key. Confirmed rejections remain distinct from uncertain outcomes, and completed downloads preserve the original generation request ID.


The CLI commands and disclosures are connected, including explicit backend selection for diagnostics and voice management. The assembled gate is now checking formatting, types, lint and tests. I’m keeping live-provider results separate from fixture results; this run has made no new enrollment or synthesis calls.


The first full gate passed: 306 tests, strict type checks and lint. Review found two recovery details to tighten before the final gate: a saved audio URL should remain usable when only the provider’s duration field is malformed, and diagnostics should redact unrecognized provider error codes.


Review found a policy timing gap: credentials or exclusion evidence could change between authentication and upload. I’m closing that by fixing the credential used for each operation and rechecking authorization immediately before the content-bearing request.


The upload-boundary fix is in place, with fixtures for credential rotation and evidence expiry during preflight. Documentation link checks also passed. I’m finishing the final regression run and recording which findings come from local execution versus the previously reported live delivery.


The final fixtures also check truthful result disclosures and automatic selection: a failed remote identity check must not prevent an eligible local backend from running. The library now rejects a result that contradicts the training decision in its authorized plan.


The new policy-boundary tests passed. One older test still expected a confirmed Fish HTTP 403 rejection to appear as an uncertain failure. I’m updating it to assert the corrected distinction while retaining its redaction and no-retry checks.


The implementation is frozen for the final checks. This round also invokes the CLI from the Trigon working directory using synthetic subtitles, with all test outputs confined to teamagent’s cache. It will not enroll a voice, generate audio or change provider settings.


The repeated run caught a polling race: an early timer wake-up could trigger a second status read at the end of a 100 ms wait. I’m fixing the wait scheduling and keeping the exact request-count assertion.


The focused HeyGen tests passed, including deterministic early timer wake-ups. Formatting, strict types and lint also passed. The full implementation gate and final review gate are now running with the code unchanged.


The implementation gate passed all 316 tests. The final review gate is running now; the CLI checks from Trigon also passed. The remaining work is to save the verification record and archive the response.


I’ve recorded read-only hashes of the original analysis and receipt files. The verification report separates those user-reported live results from the synthetic tests run here, including the exact SRT wording checks and recovery tests that made no second synthesis call.


Both required gates passed: **316 tests across 43 files**, with formatting, strict types and lint passing. The verification record is saved. I’m completing the repository-required public-response archive before handing this back.


The implementation and verification are complete. The archive writer rejected a missing completion timestamp in a helper record; that record is corrected. I’m retrying the required archive step.

