import { Clock, Effect, Schema } from "effect";
import {
  MediaBackendCatalogSchema,
  MediaError,
  MediaRequestSchema,
  type MediaBackend,
  type MediaCapability,
  type MediaCandidate,
  type MediaPlan,
  type MediaRequest,
} from "./contracts.ts";
import { evaluateTrainingPolicy } from "./training.ts";

export const validateMediaRequest = Effect.fnUntraced(function* (input: unknown) {
  const request = yield* Schema.decodeUnknownEffect(MediaRequestSchema)(input, {
    onExcessProperty: "error",
  }).pipe(
    Effect.mapError(() => new MediaError({ code: "invalid", message: "Invalid media request." })),
  );
  if (request.operation === "synthesize") {
    if (request.reference !== undefined && request.voice !== undefined)
      return yield* new MediaError({
        code: "invalid",
        message: "Choose a voice identifier or reference audio, not both.",
      });
    if (
      request.reference === undefined &&
      (request.referenceText !== undefined || request.voiceAuthorization !== undefined)
    )
      return yield* new MediaError({
        code: "invalid",
        message: "Reference text and authorization provenance require reference audio.",
      });
  }
  if (request.operation === "convert") {
    if (request.output === request.input)
      return yield* new MediaError({
        code: "invalid",
        message: "Conversion output must differ from its input.",
      });
    if ((request.startSeconds ?? 0) + (request.durationSeconds ?? 0) > 86_400)
      return yield* new MediaError({
        code: "invalid",
        message: "Requested conversion range exceeds the duration limit.",
      });
  }
  return request;
});

function distinct(values: readonly string[]): boolean {
  return new Set(values).size === values.length;
}
export const validateMediaBackends = Effect.fnUntraced(function* (input: unknown) {
  const backends = yield* Schema.decodeUnknownEffect(MediaBackendCatalogSchema)(input, {
    onExcessProperty: "error",
  }).pipe(
    Effect.mapError(
      () => new MediaError({ code: "invalid", message: "Invalid media backend catalog." }),
    ),
  );
  if (!distinct(backends.map((backend) => backend.id)))
    return yield* new MediaError({
      code: "invalid",
      message: "Media backend identifiers must be unique.",
    });
  for (const backend of backends) {
    if (backend.available ? backend.unavailableReason !== null : !backend.unavailableReason?.trim())
      return yield* new MediaError({
        code: "invalid",
        message: "Backend availability and its explanation are inconsistent.",
      });
    const keys = backend.capabilities.map(
      (capability) => `${capability.operation}\u0000${capability.model ?? ""}`,
    );
    const defaults = backend.capabilities
      .filter((capability) => capability.default)
      .map((capability) => capability.operation);
    if (!distinct(keys) || !distinct(defaults))
      return yield* new MediaError({
        code: "invalid",
        message: "Backend capabilities or operation defaults are ambiguous.",
      });
    for (const capability of backend.capabilities) {
      if (
        capability.training !== undefined &&
        (capability.training.scope.backendId !== backend.id ||
          capability.training.scope.operation !== capability.operation ||
          capability.training.scope.model !== capability.model)
      )
        return yield* new MediaError({
          code: "invalid",
          message: "Training policy scope does not match its backend capability.",
        });

      const audioOutput = ["convert", "synthesize", "record"].includes(capability.operation);
      if (
        !distinct(capability.formats) ||
        !distinct(capability.timestamps) ||
        (audioOutput ? capability.formats.length === 0 : capability.formats.length !== 0) ||
        (capability.operation !== "transcribe" &&
          (capability.timestamps.length !== 0 || capability.diarization)) ||
        (capability.operation !== "synthesize" &&
          (capability.referenceVoice ||
            capability.referenceRequired ||
            capability.referenceTextRequired ||
            capability.referenceTextSupported ||
            capability.requiresVoiceOrReference ||
            capability.requiresVoice)) ||
        ((capability.referenceTextSupported ||
          capability.referenceRequired ||
          capability.referenceTextRequired ||
          capability.requiresVoiceOrReference) &&
          !capability.referenceVoice) ||
        (capability.referenceTextRequired && !capability.referenceTextSupported) ||
        (capability.operation === "record" &&
          (capability.formats.length !== 1 || capability.formats[0] !== "wav"))
      )
        return yield* new MediaError({
          code: "invalid",
          message: "Backend capability fields do not match their operation.",
        });
    }
  }
  const now = yield* Clock.currentTimeMillis;
  return backends.map((backend) => ({
    ...backend,
    capabilities: backend.capabilities.map((capability) => ({
      ...capability,
      trainingDecision: evaluateTrainingPolicy(capability.training, { now }),
    })),
  }));
});

interface RankedCandidate {
  readonly backend: MediaBackend;
  readonly capability: MediaCapability | undefined;
  readonly candidate: MediaCandidate;
}
function compareText(a: string, b: string): number {
  return a < b ? -1 : a > b ? 1 : 0;
}
function rankCandidates(
  request: MediaRequest,
  backends: readonly MediaBackend[],
  now: number,
): RankedCandidate[] {
  const preference = request.preference ?? "balanced";
  const ranked = backends.flatMap((backend) => {
    const relevant = backend.capabilities.filter(
      (capability) => capability.operation === request.operation,
    );
    const capabilities: readonly (MediaCapability | undefined)[] = relevant.length
      ? relevant
      : [undefined];
    return capabilities.map((capability): RankedCandidate => {
      const reasons: string[] = [];
      const trainingDecision = evaluateTrainingPolicy(capability?.training, {
        now,
        allowTraining: request.allowTraining ?? false,
      });
      if (!trainingDecision.eligible) reasons.push(...trainingDecision.reasons);
      if (request.backend !== undefined && backend.id !== request.backend)
        reasons.push("An explicit different backend was requested.");
      if (!backend.available) reasons.push("Backend is unavailable.");
      if (
        request.operation === "synthesize" &&
        backend.id !== "heygen" &&
        (request.language !== undefined ||
          request.expressivenessBoost !== undefined ||
          request.withTimestamps !== undefined)
      )
        reasons.push(
          "Explicit speech language, expressiveness and alignment controls currently require HeyGen; this route cannot silently ignore them.",
        );
      if (
        request.operation === "clone" &&
        backend.id !== "heygen" &&
        (request.language !== undefined ||
          request.similarity !== undefined ||
          request.idempotencyKey !== undefined)
      )
        reasons.push(
          "Clone language, similarity and idempotency controls are currently implemented for HeyGen only.",
        );

      if (
        request.locality !== undefined &&
        request.locality !== "any" &&
        request.locality !== backend.locality
      )
        reasons.push("Backend does not satisfy requested locality.");
      if (!capability) reasons.push("Backend does not support this operation.");
      if (capability) {
        if (request.model !== undefined && request.model !== capability.model)
          reasons.push("Capability does not match the requested model.");
        if (
          (request.operation === "convert" || request.operation === "synthesize") &&
          request.format !== undefined &&
          !capability.formats.includes(request.format)
        )
          reasons.push("Requested audio format is unsupported.");
        if (request.operation === "transcribe") {
          if (
            request.timestamps !== undefined &&
            request.timestamps !== "none" &&
            !capability.timestamps.includes(request.timestamps)
          )
            reasons.push("Requested timestamp granularity is unsupported.");
          if (request.diarization && !capability.diarization)
            reasons.push("Speaker diarization is unsupported.");
        }
        if (
          request.operation === "synthesize" &&
          request.reference !== undefined &&
          !capability.referenceVoice
        )
          reasons.push(
            "Reference-conditioned synthesis is unsupported; enrollment is a separate operation.",
          );
        if (
          request.operation === "synthesize" &&
          request.reference === undefined &&
          capability.referenceRequired
        )
          reasons.push("This synthesis capability requires reference audio.");
        if (
          request.operation === "synthesize" &&
          request.referenceText !== undefined &&
          !capability.referenceTextSupported
        )
          reasons.push("This synthesis capability does not accept a reference transcript.");
        if (
          request.operation === "synthesize" &&
          request.reference !== undefined &&
          request.referenceText === undefined &&
          capability.referenceTextRequired
        )
          reasons.push("This synthesis capability requires the reference recording transcript.");
        if (
          request.operation === "synthesize" &&
          request.voice === undefined &&
          request.reference === undefined &&
          capability.requiresVoiceOrReference
        )
          reasons.push("This synthesis capability requires a voice identifier or reference audio.");
        if (
          request.operation === "synthesize" &&
          request.voice === undefined &&
          capability.requiresVoice
        )
          reasons.push("This synthesis capability requires an explicit voice identifier.");
      }
      const eligible = reasons.length === 0 && capability !== undefined;
      if (eligible)
        reasons.push(
          `Configured ${preference} priority ${capability.policy[preference]}; policy only, not a measured benchmark.`,
        );
      return {
        backend,
        capability: capability === undefined ? undefined : { ...capability, trainingDecision },
        candidate: {
          trainingDecision,
          backendId: backend.id,
          model: capability?.model ?? null,
          eligible,
          policyPriority: eligible ? capability.policy[preference] : null,
          reasons,
        },
      };
    });
  });
  return ranked.toSorted(
    (a, b) =>
      Number(b.candidate.eligible) - Number(a.candidate.eligible) ||
      (a.candidate.policyPriority ?? 101) - (b.candidate.policyPriority ?? 101) ||
      Number(b.capability?.default ?? false) - Number(a.capability?.default ?? false) ||
      compareText(a.backend.id, b.backend.id) ||
      compareText(a.candidate.model ?? "", b.candidate.model ?? ""),
  );
}

export const planMedia = Effect.fnUntraced(function* (
  input: unknown,
  catalog: unknown,
): Effect.fn.Return<MediaPlan, MediaError> {
  const request = yield* validateMediaRequest(input);
  const backends = yield* validateMediaBackends(catalog);
  if (
    request.backend !== undefined &&
    !backends.some((backend) => backend.id === request.backend && backend.available)
  )
    return yield* new MediaError({
      code: "unavailable",
      message: "The explicitly requested backend is unavailable; no fallback was selected.",
    });
  const ranked = rankCandidates(request, backends, yield* Clock.currentTimeMillis);
  const selected = ranked.find((entry) => entry.candidate.eligible);
  if (!selected?.capability) {
    const relevant = ranked.filter(
      (entry) =>
        entry.capability !== undefined &&
        (request.backend === undefined || entry.backend.id === request.backend) &&
        (request.model === undefined || entry.capability.model === request.model) &&
        (request.locality === undefined ||
          request.locality === "any" ||
          entry.backend.locality === request.locality),
    );
    const blocked =
      relevant.length > 0 && relevant.every((entry) => !entry.candidate.trainingDecision?.eligible);
    return yield* new MediaError({
      code: blocked
        ? "policy"
        : backends.some((backend) => backend.available)
          ? "unsupported"
          : "unavailable",
      message: blocked
        ? `Training policy blocks this request. ${relevant[0]?.candidate.trainingDecision?.reasons[0] ?? "Current route evidence is required."} Inspect media backends or plan for every route decision.`
        : "No available backend satisfies the requested operation, model, locality and capabilities.",
    });
  }
  return {
    request,
    backend: selected.backend,
    capability: selected.capability,
    model: selected.capability.model,
    policy: {
      version: "media-selection/1",
      kind: "configured-policy-not-benchmark",
      preference: request.preference ?? "balanced",
    },
    candidates: ranked.map((entry) => entry.candidate),
    limitations: [
      ...new Set([
        "Ranking expresses configured selection policy, not comparative quality, latency or cost measurements. Availability is not a guarantee of execution success.",
        ...selected.backend.limitations,
        ...selected.capability.limitations,
      ]),
    ],
  };
});

export interface MediaSelectionExplanation {
  readonly request: MediaRequest;
  readonly backends: readonly MediaBackend[];
  readonly candidates: readonly MediaCandidate[];
  readonly selected: MediaPlan | null;
  readonly rejection: { readonly code: MediaError["code"]; readonly message: string } | null;
}

export const explainMediaSelection = Effect.fnUntraced(function* (
  input: unknown,
  catalog: unknown,
): Effect.fn.Return<MediaSelectionExplanation, MediaError> {
  const request = yield* validateMediaRequest(input);
  const backends = yield* validateMediaBackends(catalog);
  const candidates = rankCandidates(request, backends, yield* Clock.currentTimeMillis).map(
    (entry) => entry.candidate,
  );
  const selection = yield* planMedia(request, backends).pipe(
    Effect.match({
      onSuccess: (selected) => ({ selected, rejection: null }),
      onFailure: (error) => ({
        selected: null,
        rejection: { code: error.code, message: error.message },
      }),
    }),
  );
  return { request, backends, candidates, ...selection };
});
