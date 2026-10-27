import { lstat, realpath } from "node:fs/promises";
import { Effect, Layer, Schema } from "effect";
import {
  Media,
  MediaError,
  makeMedia,
  type MediaApi,
  type MediaPlan,
  type MediaResult,
  type MediaRequest,
  type TrainingBinding,
  TrainingBindingSchema,
  evaluateTrainingPolicy,
} from "@/media";
import { scopedHostPromise } from "../imports/lifecycle.ts";
import { removeExtractorStaging } from "../imports/extractors.ts";
import { discoverMedia } from "./catalog.ts";
import { loadMediaConfig, parseMediaConfig } from "./config.ts";
import { createMediaStaging, readInput } from "./files.ts";
import { executeLocal, type MediaExecution } from "./local.ts";
import { executeRemote } from "./providers.ts";
import { executeHeyGen, resumeHeyGen } from "./heygen.ts";
import { executeHeyGenVoice, diagnoseHeyGen } from "./heygen-lifecycle.ts";
import { resolveMediaTrainingPolicy } from "./training.ts";
import { createMediaReceiptStore, MediaReceiptFailure } from "./receipts.ts";
import { executeFish } from "./fish.ts";
import { executeOmniVoice } from "./omnivoice.ts";
import {
  defaultMediaTransport,
  MediaHostFailure,
  MediaHttpFailure,
  MediaPolicyFailure,
  type MediaTransport,
} from "./transport.ts";

export {
  loadMediaConfig,
  MediaHostConfigSchema,
  type MediaHostConfig,
  type ResolvedMediaConfig,
} from "./config.ts";
export {
  requestMedia,
  downloadMedia,
  runMediaProcess,
  type MediaTransport,
  type MediaHttpOptions,
  type MediaDownloadOptions,
  type MediaHttpResponse,
  type MediaProcessOptions,
} from "./transport.ts";
export interface MediaHostOptions {
  readonly cwd?: string;
  readonly config?: unknown;
  readonly configFile?: string;
  readonly transport?: Partial<MediaTransport>;
  /** Trusted adapter seam for provider-specific authenticated account checks; never executable configuration. */
  readonly trainingVerifier?: (
    backendId: string,
    signal: AbortSignal,
    credential: string | undefined,
  ) => Promise<unknown>;
}
function mediaFailure(error: unknown): MediaError {
  if (error instanceof MediaError) return error;
  if (error instanceof MediaPolicyFailure)
    return new MediaError({ code: "policy", message: error.message });
  if (error instanceof MediaReceiptFailure)
    return new MediaError({
      code: error.policyDenied
        ? "policy"
        : error.outcome === "rejected"
          ? "rejected"
          : error.outcome === "generated-awaiting-download"
            ? "recovery"
            : error.outcome === "uncertain" || error.outcome === "submitting"
              ? "uncertain"
              : "network",
      message: error.message,
      receiptId: error.receiptId,
      outcome: error.outcome,
      diagnostic: error.diagnostic,
    });
  if (error instanceof MediaHttpFailure)
    return new MediaError({
      code:
        error.diagnostic.status === null
          ? "network"
          : error.diagnostic.status >= 400 &&
              error.diagnostic.status < 500 &&
              error.diagnostic.status !== 408
            ? "rejected"
            : "uncertain",
      message: error.message,
      diagnostic: error.diagnostic,
    });
  if (error instanceof MediaHostFailure)
    return new MediaError({
      code: error.kind === "provider" ? "uncertain" : error.kind,
      message: error.message,
    });
  return new MediaError({
    code: "io",
    message:
      "Media processing failed or returned invalid data. No alternative provider was invoked.",
  });
}
export const createMediaHost = Effect.fn("createMediaHost")(function* (
  options: MediaHostOptions = {},
): Effect.fn.Return<MediaApi, MediaError> {
  if (options.configFile !== undefined && options.config !== undefined)
    return yield* new MediaError({
      code: "invalid",
      message: "Choose a media configuration object or an explicit configuration file.",
    });
  const cwd = options.cwd ?? process.cwd();
  const config =
    options.configFile !== undefined
      ? yield* loadMediaConfig(options.configFile, cwd)
      : yield* Effect.try({
          try: () => parseMediaConfig(options.config ?? {}, cwd),
          catch: () =>
            new MediaError({ code: "invalid", message: "Invalid media host configuration." }),
        });
  const inputRoot = yield* Effect.tryPromise({
    try: async () => {
      const root = await realpath(config.inputRoot);
      if (!(await lstat(root)).isDirectory()) throw new Error("invalid input root");
      return root;
    },
    catch: () =>
      new MediaError({
        code: "invalid",
        message: "Media input root must be an existing directory.",
      }),
  });
  const resolved = { ...config, inputRoot };
  const transport: MediaTransport = { ...defaultMediaTransport, ...options.transport };
  const receiptStore = async () => {
    const settings = resolved.config.recovery;
    if (settings === undefined)
      throw new MediaHostFailure(
        "unavailable",
        "Configure recovery.keyEnv and a command-scoped 32-byte base64 key before mutable remote media work or recovery.",
      );
    const encoded = transport.environment(settings.keyEnv);
    if (encoded === undefined || !/^[A-Za-z0-9+/]{43}=$/.test(encoded))
      throw new MediaHostFailure(
        "unavailable",
        "The configured media recovery key must contain exactly 32 bytes encoded as base64.",
      );
    const key = Buffer.from(encoded, "base64");
    if (key.length !== 32 || key.toString("base64") !== encoded)
      throw new MediaHostFailure("invalid", "Invalid media recovery key encoding.");
    return createMediaReceiptStore({
      directory: settings.directory ?? ".cache/media-recovery",
      key,
    });
  };
  const credentialSettings = (backendId: string) =>
    backendId === "heygen"
      ? resolved.config.heygen
      : backendId === "fish"
        ? resolved.config.fish
        : backendId === "openai"
          ? resolved.config.openai
          : backendId === "elevenlabs"
            ? resolved.config.elevenlabs
            : undefined;
  const preparation = async (
    request: MediaRequest,
    signal: AbortSignal,
    operationTransport: MediaTransport = transport,
  ) => {
    const availability = await discoverMedia(resolved, operationTransport);
    const catalog = [];
    for (const entry of availability.catalog) {
      const account =
        entry.id === "heygen" ||
        entry.id === "fish" ||
        entry.id === "openai" ||
        entry.id === "elevenlabs"
          ? resolved.config.training?.[entry.id]
          : undefined;
      let binding: TrainingBinding | undefined;
      let policyAuthenticationFailed = false;
      if (
        entry.available &&
        (request.backend === undefined || request.backend === entry.id) &&
        (request.locality === undefined ||
          request.locality === "any" ||
          request.locality === entry.locality) &&
        entry.capabilities.some(
          (capability) =>
            capability.operation === request.operation &&
            (request.model === undefined || request.model === capability.model),
        ) &&
        account?.evidence.some(
          (evidence) => evidence.kind !== "user-assertion" && evidence.effect === "excluded",
        )
      ) {
        try {
          if (options.trainingVerifier !== undefined) {
            const settings = credentialSettings(entry.id);
            const dynamic = await options.trainingVerifier(
              entry.id,
              signal,
              settings === undefined
                ? undefined
                : operationTransport.environment(settings.apiKeyEnv),
            );
            if (dynamic !== undefined && dynamic !== null)
              binding = Schema.decodeUnknownSync(TrainingBindingSchema)(dynamic, {
                onExcessProperty: "error",
              });
          } else if (entry.id === "heygen" && resolved.config.heygen !== undefined) {
            const diagnostic = await diagnoseHeyGen(
              { config: resolved, transport: operationTransport, signal },
              resolved.config.heygen,
              { backend: "heygen" },
            );
            if (
              diagnostic.authenticated &&
              diagnostic.accountId !== null &&
              diagnostic.credentialBinding !== null
            ) {
              const now = Date.now();
              binding = {
                backendId: "heygen",
                host: "api.heygen.com",
                accountId: diagnostic.accountId,
                credentialBinding: diagnostic.credentialBinding,
                verifiedAt: now,
                expiresAt: now + 60000,
                verification: "authenticated-account",
              };
            }
          }
        } catch (error: unknown) {
          if (request.backend !== undefined) throw error;
          policyAuthenticationFailed = true;
        }
      }
      catalog.push({
        ...entry,
        ...(policyAuthenticationFailed
          ? {
              available: false,
              unavailableReason:
                "Authenticated policy identity check failed; this automatic candidate was excluded before content submission.",
            }
          : {}),
        capabilities: entry.capabilities.map((item) => {
          const training = resolveMediaTrainingPolicy({
            backendId: entry.id,
            operation: item.operation,
            model: item.model,
            ...(account === undefined ? {} : { account }),
            ...(binding === undefined ? {} : { binding }),
          });
          return {
            ...item,
            training,
            trainingDecision: evaluateTrainingPolicy(training, {
              now: Date.now(),
              allowTraining: request.allowTraining ?? false,
            }),
          };
        }),
      });
    }
    return { ...availability, catalog };
  };
  let active = 0;
  const execute = (plan: MediaPlan) =>
    scopedHostPromise<MediaResult, MediaError>({
      try: async (signal) => {
        if (active >= 2) throw new MediaHostFailure("limit", "Media concurrency limit reached.");
        active += 1;
        let stage: string | undefined;
        try {
          const credentials = credentialSettings(plan.backend.id);
          const credential =
            credentials === undefined ? undefined : transport.environment(credentials.apiKeyEnv);
          const executionTransport: MediaTransport =
            credentials === undefined
              ? transport
              : {
                  ...transport,
                  environment: (name) =>
                    name === credentials.apiKeyEnv ? credential : transport.environment(name),
                };
          const availability = await preparation(
            {
              ...plan.request,
              backend: plan.backend.id,
              ...(plan.model === null ? {} : { model: plan.model }),
            },
            signal,
            executionTransport,
          );
          if (!availability.catalog.find((backend) => backend.id === plan.backend.id)?.available)
            throw new MediaHostFailure(
              "unavailable",
              "The selected media backend is no longer available.",
            );
          const currentCapability = availability.catalog
            .find((entry) => entry.id === plan.backend.id)
            ?.capabilities.find(
              (item) => item.operation === plan.request.operation && item.model === plan.model,
            );
          const decision = evaluateTrainingPolicy(currentCapability?.training, {
            now: Date.now(),
            allowTraining: plan.request.allowTraining ?? false,
          });
          if (
            !decision.eligible ||
            decision.effective !== plan.capability.trainingDecision?.effective
          )
            throw new MediaError({ code: "policy", message: decision.reasons.join(" ") });
          const receipts =
            plan.backend.id === "heygen" &&
            (plan.request.operation === "clone" || plan.request.operation === "synthesize")
              ? await receiptStore()
              : undefined;
          const started = performance.now();
          const request = plan.request;
          const input =
            "input" in request
              ? await readInput(inputRoot, request.input, resolved.limits.inputBytes, signal)
              : undefined;
          const reference =
            "reference" in request && request.reference !== undefined
              ? await readInput(inputRoot, request.reference, resolved.limits.inputBytes, signal)
              : undefined;
          stage = await createMediaStaging(resolved.outputRoot);
          const context: MediaExecution = {
            plan: { ...plan, capability: currentCapability ?? plan.capability },
            ...(receipts === undefined ? {} : { receipts }),
            config: { ...resolved, outputRoot: await realpath(resolved.outputRoot) },
            availability,
            transport: executionTransport,
            authorizeUpload: () => {
              if (
                credentials !== undefined &&
                transport.environment(credentials.apiKeyEnv) !== credential
              )
                throw new MediaPolicyFailure();
              const current = evaluateTrainingPolicy(currentCapability?.training, {
                now: Date.now(),
                allowTraining: plan.request.allowTraining ?? false,
              });
              if (!current.eligible || current.effective !== decision.effective)
                throw new MediaPolicyFailure();
            },
            stage,
            signal,
            input,
            reference,
            provenance: {
              trainingDecision: decision,
              inputSha256: input?.sha256 ?? null,
              referenceSha256: reference?.sha256 ?? null,
              toolVersion: null,
              providerRequestId: null,
              elapsedMs: 0,
              limitations: [...plan.backend.limitations, ...plan.capability.limitations],
              ...("voiceAuthorization" in request && request.voiceAuthorization !== undefined
                ? { voiceAuthorization: request.voiceAuthorization }
                : {}),
            },
          };
          let result: MediaResult;
          if (plan.backend.id === "heygen") {
            if (resolved.config.heygen === undefined)
              throw new MediaHostFailure("unavailable", "HeyGen is not configured.");
            result = await executeHeyGen(context, resolved.config.heygen);
          } else if (plan.backend.id === "fish") {
            if (resolved.config.fish === undefined)
              throw new MediaHostFailure("unavailable", "Fish Audio is not configured.");
            result = await executeFish(context, resolved.config.fish);
          } else if (plan.backend.id === "omnivoice") {
            result = await executeOmniVoice(context);
          } else {
            result =
              plan.backend.locality === "remote"
                ? await executeRemote(context)
                : await executeLocal(context);
          }
          return {
            ...result,
            provenance: {
              ...result.provenance,
              elapsedMs: performance.now() - started,
              trainingDecision: decision,
            },
          };
        } finally {
          try {
            if (stage !== undefined) await removeExtractorStaging(stage, resolved.outputRoot);
          } finally {
            active -= 1;
          }
        }
      },
      catch: mediaFailure,
    });
  return makeMedia({
    prepare: (request) =>
      scopedHostPromise({
        try: async (signal) => (await preparation(request, signal)).catalog,
        catch: mediaFailure,
      }),
    voice: (request) =>
      scopedHostPromise({
        try: async (signal) => {
          if (request.backend !== "heygen" || resolved.config.heygen === undefined)
            throw new MediaHostFailure(
              "unsupported",
              "Voice lifecycle is implemented for explicitly configured HeyGen only.",
            );
          return executeHeyGenVoice(
            { config: resolved, transport, signal },
            resolved.config.heygen,
            request,
          );
        },
        catch: mediaFailure,
      }),
    diagnose: (request) =>
      scopedHostPromise({
        try: async (signal) => {
          if (request.backend !== "heygen" || resolved.config.heygen === undefined)
            throw new MediaHostFailure(
              "unsupported",
              "Authenticated diagnostics are implemented for explicitly configured HeyGen only.",
            );
          return diagnoseHeyGen(
            { config: resolved, transport, signal },
            resolved.config.heygen,
            request,
          );
        },
        catch: mediaFailure,
      }),
    recovery: (request) =>
      scopedHostPromise({
        try: async (signal) => {
          const receipts = await receiptStore();
          if (request.action === "list") return receipts.list();
          if (request.receiptId === undefined)
            throw new MediaHostFailure("invalid", "A receipt ID is required.");
          if (request.action === "get") return [await receipts.public(request.receiptId)];
          if (active >= 2) throw new MediaHostFailure("limit", "Media concurrency limit reached.");
          active += 1;
          let stage: string | undefined;
          try {
            stage = await createMediaStaging(resolved.outputRoot);
            return await resumeHeyGen(
              {
                config: { ...resolved, outputRoot: await realpath(resolved.outputRoot) },
                transport,
                signal,
                stage,
                receipts,
              },
              request.receiptId,
              request.output,
            );
          } finally {
            try {
              if (stage !== undefined) await removeExtractorStaging(stage, resolved.outputRoot);
            } finally {
              active -= 1;
            }
          }
        },
        catch: mediaFailure,
      }),
    listBackends: () =>
      scopedHostPromise({
        try: async () => (await discoverMedia(resolved, transport)).catalog,
        catch: mediaFailure,
      }),
    execute,
  });
});
export function mediaHostLayer(options: MediaHostOptions = {}): Layer.Layer<Media, MediaError> {
  return Layer.effect(Media, createMediaHost(options));
}
