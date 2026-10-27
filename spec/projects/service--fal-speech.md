# fal and managed speech hosting routes

Reviewed: 2026-10-25. Scope: primary hosting documentation, not a code review or an inference benchmark. Related: [media processing](../media-processing.md), [generation](../generation.md), [HeyGen review](service--heygen-voice.md), [Fish review](external--fish-speech.md).

[fal's HeyGen standard endpoint](https://fal.ai/models/heygen/heygen-voice) lists$0.03/1,000 input characters and returns an audio artifact object plus duration. Its [Turbo endpoint](https://fal.ai/models/heygen/heygen-voice/turbo/api) is a distinct model route. The retrieved page did not expose a current Turbo rate, so the Astra note's$4/M list and$2/M promotion remain unverified for this route. Do not copy the direct HeyGen API key, request shape, output-origin allowlist or billing assumptions into fal transport.

A managed host adds another identity and lifecycle layer: host account/key, queue/request ID, model route, upstream model, voice-resource scope, artifact URL, retention and billable unit. Record both host and model vendor. A voice ID created at the vendor may not be portable to its host; verify that contract instead of silently enrolling a duplicate voice or uploading a reference elsewhere.

[LiveKit's Fish integration](https://docs.livekit.io/agents/models/tts/fishaudio/) provides another managed inference path. Its model table can differ from Fish direct availability, including a retired free variant and region constraints. A model being available at one route does not prove availability, pricing or data residency on another.

Adoption: treat managed hosting as a separate backend option, useful when its account consolidation or transport integration fits the deployment. Evaluate total queue-plus-synthesis latency and effective completed-task cost. Cancellation may stop local waiting without cancelling billable upstream work; preserve that distinction and reconcile unknown outcomes. Neither a marketplace commercial-use badge nor local-model source license substitutes for the host's actual terms and the user's rights in reference recordings.
