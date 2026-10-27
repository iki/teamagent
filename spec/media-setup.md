# Media backend setup

[Runtime and CLI](media-runtime.md) · [Backend and service analysis](media-processing.md)

Reviewed 2026-10-25. `aube run --no-install cli media setup [heygen|fish|omnivoice]` prints the same essential requirements and URLs; omit the backend to list all three guides. `--help` includes a concise setup summary. Setup is informational and does not install, download, call a provider or write configuration. API accounts/credits are separate from consumer subscriptions unless the provider explicitly grants API access.

See the [2026-10-27 refresh](analyses/media-refresh-2026-10-27.md) for current policy continuity, conflicting paid HeyGen quotes and Fish's announced S1 retirement. CLI pricing metadata remains dated 2026-10-25; the refresh is not authenticated entitlement evidence or permission to change a selected model.

## Shared configuration

Save a JSON object as `media.json` with only the backends you intend to use. Pass it explicitly using `--config media.json`. Optional `inputRoot` and `outputRoot` default to the configuration directory and its `.cache/media` directory. Relative paths resolve from the configuration file. Output files must not already exist, and output subdirectories must exist.

Set provider secrets in the invoking process environment or a secret manager. Configuration contains environment variable **names**, never the key itself. Media configuration does not automatically read `.env` files. `media backends --config media.json` checks resource/credential presence without contacting a service; it does not prove account access or compatible native packages. Use `media plan REQUEST.json --config media.json` to inspect selection before running work.

`--backend` and `--model` explicitly constrain selection. `--locality local` prevents choosing a cloud adapter. The balanced/quality/latency/cost priorities are configurable policy estimates, not a benchmark derived from a provider leaderboard. Operations have bounded inputs/outputs/timeouts, no implicit provider fallback, and no automatic paid retry.

## Command-scoped secrets and a cache-only working area

Verified with installed fnox 1.42.1 help and its [command execution guide](https://fnox.jdx.dev/guide/running-commands.html), [set command](https://fnox.jdx.dev/cli/set.html) and [configuration reference](https://fnox.jdx.dev/reference/configuration). Configure an encrypted provider or existing secret vault first. Omitting a provider can store plaintext. The commands below omit secret values: fnox prompts with hidden input. `EXISTING_ENCRYPTED_PROVIDER` is the name of a provider already configured by you.

```sh
fnox -c ./.cache/media-demo/fnox.toml -P media set HEYGEN_API_KEY --provider EXISTING_ENCRYPTED_PROVIDER
fnox -c ./.cache/media-demo/fnox.toml -P media set MEDIA_RECOVERY_KEY --provider EXISTING_ENCRYPTED_PROVIDER
```

For `MEDIA_RECOVERY_KEY`, supply a cryptographically random 32-byte key encoded as base64 and retain it in that secret manager. Do not pass keys as command arguments or write the plaintext key beside receipts. Set `env = "exec"` for these secrets to avoid automatic shell injection. `fnox exec` injects into the child command; it is not an isolation boundary. Explicit config paths disable directory discovery but still merge fnox's global configuration; use a dedicated profile and `--no-defaults` to exclude top-level secrets. Do not use secret-printing commands for diagnostics.

For an isolated local trial, create `.cache/media-demo/inputs` and `.cache/media-demo/candidates`, then place this configuration at `.cache/media-demo/media.json`. Copy only the intended inputs there; candidates will not replace approved originals. The storage example does not claim a training-policy exemption: account-scoped policy evidence or an allowed explicit training opt-in is still required before uploading content.

```json
{
  "inputRoot": "inputs",
  "outputRoot": "candidates",
  "recovery": { "directory": "recovery", "keyEnv": "MEDIA_RECOVERY_KEY" },
  "heygen": { "apiKeyEnv": "HEYGEN_API_KEY", "speechModel": "heygen-voice-1" }
}
```

From a different working directory, resolve the repository path explicitly; adjust the first relative path for your location. This invokes the installed Bun 1.4.2 launcher directly without installing dependencies or changing that working directory. Paths in `media.json` remain relative to that file.

```powershell
$project = (Resolve-Path ../teamagent).Path
$mediaConfig = Join-Path $project '.cache/media-demo/media.json'
$secretConfig = Join-Path $project '.cache/media-demo/fnox.toml'
fnox exec -c $secretConfig -P media --no-defaults --if-missing error -- bun (Join-Path $project 'app/cli/index.ts') media diagnose --backend heygen --config $mediaConfig
fnox exec -c $secretConfig -P media --no-defaults --if-missing error -- bun (Join-Path $project 'app/cli/index.ts') media receipts --config $mediaConfig
```

Verify that `bun --version` is 1.4.2, or replace `bun` with your explicit pinned executable. Nonsecret JSON configuration stays separate from fnox; media configuration never scans credentials or dotenv files. The examples scope Teamagent inputs, candidates and recovery storage to the project cache; a configured secret provider may maintain its own external encrypted store.

## Recovery and voice lifecycle

Lifecycle and diagnostic commands require explicit `--backend heygen`; no provider is selected implicitly. Use `media diagnose --backend heygen --config media.json` for authenticated metadata; it makes no generation request and cannot establish paid model access or a training setting. `media voice-list --backend heygen --config media.json` returns a bounded page. `voice-get VOICE_ID` reads readiness, `voice-wait VOICE_ID` explicitly polls within its limits, and `voice-delete VOICE_ID` removes only the selected voice resource. Deletion is an external mutation; it does not claim removal of all provider-retained source audio.

New HeyGen clone and synthesis requests require the recovery key and a writable encrypted receipt store. A clone can supply `--idempotency-key voice-enrollment-01`; reuse returns its original receipt for explicit reconciliation, while a changed fingerprint conflicts. There is no speech-synthesis idempotency promise. Inspect `media receipt RECEIPT_ID --config media.json` after a failure. `submitting` after a crash or `uncertain` after a connection failure is ambiguous: do not blindly create another clone or generation. Reconcile an existing voice ID or provider account first.

`media resume RECEIPT_ID --config media.json` recovers a retained completed generation by downloading its encrypted saved reference under the current exact CDN allowlist, without another synthesis call. Before publication, a destination conflict can use a fresh explicit `--output candidate-02.wav`; existing files are never overwritten. Once published, resume verifies only the original artifact and cannot choose another destination. An expired URL remains a download failure and does not trigger regeneration. Public receipt output includes redacted origin/path categories, safe identifiers and typed diagnostics; it never displays signed URLs, input text, uploaded audio or credentials. Back up the key separately from the encrypted database; replacing the key blocks access rather than silently abandoning earlier replay records.

To verify SRT extraction before a paid request, use `media import-text approved.srt --text-format srt`. For synthesis use `--text-file approved.srt --text-format srt`, respecting the model's text limit. Cue wording and logical line breaks remain exact; subtitle times are not measured audio alignment. `--with-timestamps` explicitly requests HeyGen alignment. `--language` and `--similarity` configure instant cloning; `--expressiveness-boost` applies only to an instant voice. Keep every generated candidate separate from the original recording and approved text.

## HeyGen

[Contract and service review](projects/service--heygen-voice.md).

Primary setup and contract: [HeyGen Voice](https://developers.heygen.com/docs/models/heygen-voice), [developer documentation](https://docs.heygen.com/), [account dashboard](https://app.heygen.com/).

1. Create a HeyGen API key and set `HEYGEN_API_KEY` in the process environment. Verify the account's current API access and price for the chosen model.
2. Save the following configuration. Add `voiceId` once you have a public or enrolled voice, or supply it using `--voice`.
3. For an instant clone, run `media clone` with an MP3/WAV recording. Accepted creation returns `readiness: "pending"`; check the voice's ACTIVE state in the provider account/API before synthesis. Use explicit `media voice-wait VOICE_ID` for bounded polling; creation does not poll automatically.
4. Synthesize a WAV file. Standard Voice supports professional clones; Turbo models support public and instant voices.

```json
{
  "heygen": {
    "apiKeyEnv": "HEYGEN_API_KEY",
    "speechModel": "heygen-voice-1"
  },
  "recovery": { "directory": ".cache/media-recovery", "keyEnv": "MEDIA_RECOVERY_KEY" }
}
```

```sh
aube run --no-install cli media clone reference.wav --backend heygen --config media.json --name "My voice"
aube run --no-install cli media synthesize "Hello" --backend heygen --config media.json --voice VOICE_ID --output hello.wav
aube run --no-install cli media synthesize "Hello" --backend heygen --model heygen-voice-1-turbo --config media.json --voice VOICE_ID --output turbo.wav
```

Models: `heygen-voice-1` (default), `heygen-voice-1-turbo`, `heygen-voice-1-turbo-free`. Promotional access is never assumed or substituted automatically. The adapter implements completed file synthesis, not streaming. Target text is at most 5000 characters; enrollment accepts at most 16 MB decoded audio and a 64-character name. Synthesis requires a voice ID and never silently enrolls the supplied recording. HeyGen retains inline clone audio as a provider asset. Any explicitly returned asset IDs are retained as evidence; absence of an ID is not proof of deletion. Generated WAV is downloaded without credentials only from the exact `https://files.heygen.ai/generated/` or `https://resource2.heygen.ai/text_to_speech/` origin/path pair; redirects are rejected. A different future CDN requires an explicit reviewed adapter update.

## Fish Audio

[Fish source and service review](projects/external--fish-speech.md) · [SDK review](projects/external--fish-audio-python.md).

Primary setup and contract: [Fish Audio documentation](https://docs.fish.audio/), [text-to-speech API](https://docs.fish.audio/api-reference/endpoint/openapi-v1/text-to-speech), [account dashboard](https://fish.audio/).

1. Create an API key and set `FISH_API_KEY` in the process environment.
2. Save the configuration below. Use a reusable voice ID via `voiceId` or `--voice`, or supply `--reference` plus `--reference-text` for one synthesis request.
3. For a reusable private voice, run `media clone`; created/training results remain pending. Verify the provider's trained state before using that ID. The adapter requests `visibility=private` and disables sample generation.
4. Select an output format explicitly when needed. WAV/MP3/Opus are supported; default is MP3. Raw PCM is deliberately unsupported because the hosted API does not specify byte order. Use WAV when sample interpretation matters.

```json
{
  "fish": {
    "apiKeyEnv": "FISH_API_KEY",
    "speechModel": "s2.1-pro"
  }
}
```

```sh
aube run --no-install cli media synthesize "Hello" --backend fish --config media.json --voice VOICE_ID --format wav --output hello.wav
aube run --no-install cli media synthesize "Hello" --backend fish --config media.json --reference reference.wav --reference-text "Exact recorded words" --output hello.mp3
aube run --no-install cli media synthesize "A dramatic reading." --backend fish --model drama-3 --config media.json --voice VOICE_ID --output dramatic.mp3
aube run --no-install cli media clone reference.wav --backend fish --config media.json --name "My voice"
```

Models: `s1`, `s2-pro`, `s2.1-pro` (default), `s2.1-pro-free`, `drama-3`. Unknown model IDs fail locally because the provider documents a fallback for unrecognized headers. The fixed MessagePack encoder sends inline reference audio as binary; JSON base64 is not a supported substitute. Target and reference transcripts are each limited to 4096 characters, reference audio to 10 MiB. This adapter accepts WAV, MP3, M4A and Opus references. Billing counts UTF-8 **bytes**, so rates cannot be compared directly with per-character services without a language/text assumption. Enrollment retains a recording and creates a provider model; inline conditioning returns no managed voice ID, and request retention is governed by the provider. Open-model licensing and hosted API terms are separate.

## OmniVoice

[Source and model review](projects/external--omnivoice.md).

This adapter targets [k2-fsa/OmniVoice](https://github.com/k2-fsa/OmniVoice), source API 0.2.1 at commit `08be0b4ccbac3e13e374e86fbfead4b4cac343e2`. [echonerve/omnivoice](https://github.com/echonerve/omnivoice) is a separate fork, not a repository rename. Model source: [k2-fsa/OmniVoice on Hugging Face](https://huggingface.co/k2-fsa/OmniVoice), reviewed snapshot `c5fdb5ccb189668d56333f77ba2629f4cd7535f4`; [bundled audio tokenizer](https://huggingface.co/k2-fsa/OmniVoice/tree/c5fdb5ccb189668d56333f77ba2629f4cd7535f4/audio_tokenizer). Native conversion: [FFmpeg downloads](https://ffmpeg.org/download.html).

1. Install Python 3.10 or newer in a dedicated environment and install the upstream package/dependencies following the pinned repository's README. `packageRoot` is the directory containing `omnivoice/`, not the environment's executable directory. The reviewed package declares PyTorch/Torchaudio >=2.4 and Transformers >=5.3; use a compatible, deliberately selected build for your device. No JavaScript dependency changes are required.
2. Download the complete model snapshot while online, including the nested audio tokenizer. Materialize ordinary local files rather than Git LFS pointers or cache symlinks. The adapter supports the published unsharded layout below; missing resources fail without a download or alternate backend.
3. Install actual FFmpeg and FFprobe binaries. Set their paths when they are not directly available. Launcher shims that may download software are not accepted as implicit execution targets.
4. Configure the environment's actual Python executable, source root, model directory and `cpu`, `cuda`, `mps` or `xpu` device. Device support depends on the installed PyTorch build; the upstream MPS path uses the CPU for its codec. Use `bin/python` on Unix and `Scripts/python.exe` on Windows.
5. Supply a recording of at most 30 seconds and its exact transcript. Automatic ASR is disabled; the worker normalizes audio to 24 kHz mono WAV with FFmpeg and uses local resources only. Target and reference transcripts are each at most 4096 characters. The returned audio is 24 kHz mono WAV.

```text
models/OmniVoice/
  config.json
  model.safetensors
  tokenizer.json
  tokenizer_config.json
  chat_template.jinja
  audio_tokenizer/
    config.json
    model.safetensors
    preprocessor_config.json
```

```json
{
  "ffmpeg": {
    "executable": "C:/tools/ffmpeg/bin/ffmpeg.exe",
    "probeExecutable": "C:/tools/ffmpeg/bin/ffprobe.exe"
  },
  "omnivoice": {
    "pythonExecutable": "./venv/Scripts/python.exe",
    "packageRoot": "./vendor/OmniVoice",
    "weightsDirectory": "./models/OmniVoice",
    "device": "cpu"
  },
  "limits": { "timeoutMs": 300000 }
}
```

Replace the illustrative executable locations with your real installation. The default timeout is 120 seconds; the configuration above allows five minutes for a slow local run, still within the supported 100–900000 ms bound.

```sh
aube run --no-install cli media backends --config media.json
aube run --no-install cli media synthesize "Hello" --backend omnivoice --config media.json --reference reference.wav --reference-text "Exact recorded words" --output hello.wav
```

The reviewed source code is Apache-2.0. The pretrained model README states CC-BY-NC, and the nested codec has the Boson Higgs Audio 2 Community License. Keep each license with its files and assess your intended use separately; the code license does not grant commercial rights to weights. Python offline flags, `local_files_only`, disabled automatic ASR and socket denial prevent the reviewed Python download paths. Installed package/native code remains trusted and is not isolated by an OS sandbox. Resource presence is not proof of model, dependency or accelerator compatibility.

## Readiness, failures and verification

`readiness: "pending"` describes provider processing. `requiresVerification` separately describes a provider verification requirement; neither field verifies identity or permission to use a voice. Optional `--voice-authorization` records supplied provenance. Check provider status before using pending voices. If enrollment times out or returns an invalid response, its remote outcome may already have occurred: reconcile the account before explicitly retrying. No adapter silently retries enrollment or switches providers.

The user-reported live MIME-alias HTTP 400 and previously rejected completed-generation CDN were reproduced with isolated fixtures. This evidence does not establish live success after the changes. The normal gates use service fixtures, not paid inference. OmniVoice tests execute the actual Python worker against deterministic fake package modules and validate the local API contract, offline behavior, resource checks and output publication. Actual model quality, reference similarity, accelerator compatibility and live service latency remain separate acceptance work; use the [media analysis](media-processing.md) for a source-attributed comparison, not as a runtime benchmark.
