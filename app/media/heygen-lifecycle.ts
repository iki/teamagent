import { setTimeout as delay } from "node:timers/promises";
import { Schema } from "effect";
import type {
  MediaDiagnosticRequest,
  MediaDiagnosticResult,
  MediaVoiceRequest,
  MediaVoiceResult,
} from "@/media";
import type { HeyGenSettings } from "./heygen.ts";
import type { MediaExecution } from "./local.ts";
import { providerRequest, requireJson } from "./providers.ts";
import { MediaHostFailure, MediaHttpFailure } from "./transport.ts";

export type HeyGenControlContext = Pick<MediaExecution, "config" | "transport" | "signal">;
const Id = Schema.String.check(Schema.isPattern(/^[A-Za-z0-9_-]{1,256}$/));
const Text = Schema.String.check(Schema.isMaxLength(256));
const Voice = Schema.Struct({
  voice_id: Id,
  status: Schema.String.check(Schema.isMaxLength(64)),
  mode: Schema.optional(Schema.NullOr(Text)),
  name: Schema.optional(Schema.NullOr(Text)),
  language: Schema.optional(Schema.NullOr(Schema.String.check(Schema.isMaxLength(64)))),
  requires_verification: Schema.optional(Schema.Boolean),
  reference_asset_ids: Schema.optional(Schema.Array(Id).check(Schema.isMaxLength(100))),
});
const VoiceResponse = Schema.Struct({ data: Voice });
const ListResponse = Schema.Struct({
  data: Schema.Array(Voice).check(Schema.isMaxLength(100)),
  has_more: Schema.Boolean,
  next_token: Schema.NullOr(Schema.String.check(Schema.isMaxLength(512))),
});
const KeyResponse = Schema.Struct({
  data: Schema.Struct({
    key_id: Id,
    status: Text,
    scope_mode: Text,
    scopes: Schema.Array(Schema.String.check(Schema.isMaxLength(128))).check(
      Schema.isMaxLength(128),
    ),
  }),
});
const DeleteResponse = Schema.Struct({ data: Schema.Struct({ status: Schema.Literal("ok") }) });
const AccountResponse = Schema.Struct({ data: Schema.Struct({ username: Id }) });
const voiceBase = "https://api.heygen.com/v3/models/audio/voices";
async function read(
  context: HeyGenControlContext,
  settings: HeyGenSettings,
  url: string,
  method: "GET" | "DELETE" = "GET",
): Promise<unknown> {
  return requireJson(
    await providerRequest(
      context,
      url,
      settings.apiKeyEnv,
      "x-api-key",
      "application/json",
      new Uint8Array(),
      context.config.limits.processOutputBytes,
      {},
      method,
    ),
  );
}
function resource(voice: typeof Voice.Type): MediaVoiceResult["voices"][number] {
  return {
    id: voice.voice_id,
    name: voice.name ?? null,
    status: voice.status,
    readiness:
      voice.status === "ACTIVE"
        ? "ready"
        : voice.status === "PENDING"
          ? "pending"
          : voice.status === "FAILED"
            ? "failed"
            : "unknown",
    requiresVerification: voice.requires_verification ?? null,
    language: voice.language ?? null,
    mode: voice.mode ?? null,
    referenceAssetIds: voice.reference_asset_ids ?? [],
    limitations: [
      "Voice lifecycle status does not establish identity authorization or deletion of retained source assets.",
      ...(voice.reference_asset_ids === undefined
        ? ["The provider did not expose reference asset IDs in this response."]
        : []),
    ],
  };
}
export async function getHeyGenVoice(
  context: HeyGenControlContext,
  settings: HeyGenSettings,
  voiceId: string,
): Promise<MediaVoiceResult["voices"][number]> {
  Schema.decodeUnknownSync(Id)(voiceId);
  return resource(
    Schema.decodeUnknownSync(VoiceResponse)(
      await read(context, settings, voiceBase + "/" + voiceId),
    ).data,
  );
}
export async function getHeyGenKey(
  context: HeyGenControlContext,
  settings: HeyGenSettings,
): Promise<(typeof KeyResponse.Type)["data"]> {
  return Schema.decodeUnknownSync(KeyResponse)(
    await read(context, settings, "https://api.heygen.com/v3/api_keys/self"),
  ).data;
}
/** Trusted host/test clock; never loaded from user configuration. */
export interface HeyGenWaitClock {
  readonly now: () => number;
  readonly sleep: (milliseconds: number, signal: AbortSignal) => Promise<void>;
}
const waitClock: HeyGenWaitClock = {
  now: () => performance.now(),
  sleep: async (milliseconds, signal) => {
    await delay(milliseconds, undefined, { signal });
  },
};
async function sleepUntil(
  clock: HeyGenWaitClock,
  target: number,
  signal: AbortSignal,
): Promise<void> {
  for (let remaining = target - clock.now(); remaining > 0; remaining = target - clock.now()) {
    signal.throwIfAborted();
    // Timers can truncate fractional delays or wake early; always recheck the absolute target.
    await clock.sleep(Math.ceil(remaining), signal);
  }
  signal.throwIfAborted();
}
export async function executeHeyGenVoice(
  context: HeyGenControlContext,
  settings: HeyGenSettings,
  request: MediaVoiceRequest,
  clock: HeyGenWaitClock = waitClock,
): Promise<MediaVoiceResult> {
  if (request.backend !== "heygen")
    throw new MediaHostFailure("unsupported", "This voice lifecycle adapter only supports HeyGen.");
  const common = { action: request.action, backend: "heygen", nextCursor: null, deleted: false };
  if (request.action === "list") {
    const url = new URL(voiceBase);
    url.searchParams.set("limit", String(request.limit ?? 20));
    if (request.cursor !== undefined) url.searchParams.set("token", request.cursor);
    const data = Schema.decodeUnknownSync(ListResponse)(await read(context, settings, url.href));
    if (data.has_more && (data.next_token === null || data.next_token.length === 0))
      throw new MediaHostFailure(
        "provider",
        "HeyGen returned incomplete voice pagination metadata.",
      );
    return {
      ...common,
      voices: data.data.map(resource),
      nextCursor: data.has_more ? data.next_token : null,
    };
  }
  if (request.voiceId === undefined)
    throw new MediaHostFailure("invalid", "A voice ID is required.");
  if (request.action === "delete") {
    Schema.decodeUnknownSync(Id)(request.voiceId);
    Schema.decodeUnknownSync(DeleteResponse)(
      await read(context, settings, voiceBase + "/" + request.voiceId, "DELETE"),
    );
    return { ...common, deleted: true, voices: [] };
  }
  const timeout = request.timeoutMs ?? Math.min(context.config.limits.timeoutMs, 120000);
  const deadline = clock.now() + timeout;
  const initial =
    request.action === "wait"
      ? {
          ...context,
          config: {
            ...context.config,
            limits: {
              ...context.config.limits,
              timeoutMs: Math.min(context.config.limits.timeoutMs, timeout),
            },
          },
        }
      : context;
  let voice = await getHeyGenVoice(initial, settings, request.voiceId);
  if (request.action === "wait") {
    for (let attempt = 0; voice.readiness === "pending" && attempt < 300; attempt++) {
      context.signal.throwIfAborted();
      const now = clock.now();
      if (now >= deadline) break;
      const nextPollAt = now + (request.pollIntervalMs ?? 1000);
      await sleepUntil(clock, Math.min(nextPollAt, deadline), context.signal);
      if (nextPollAt >= deadline || clock.now() >= deadline) break;
      const bounded = {
        ...context,
        config: {
          ...context.config,
          limits: {
            ...context.config.limits,
            timeoutMs: Math.max(
              1,
              Math.min(context.config.limits.timeoutMs, Math.ceil(deadline - clock.now())),
            ),
          },
        },
      };
      if (clock.now() >= deadline) break;
      voice = await getHeyGenVoice(bounded, settings, request.voiceId);
    }
    if (voice.readiness === "pending")
      voice = {
        ...voice,
        limitations: [
          ...voice.limitations,
          "The bounded wait ended while this voice was still pending; no enrollment was retried.",
        ],
      };
  }
  return { ...common, voices: [voice] };
}
export async function diagnoseHeyGen(
  context: HeyGenControlContext,
  settings: HeyGenSettings,
  request: MediaDiagnosticRequest,
): Promise<MediaDiagnosticResult> {
  if (request.backend !== "heygen")
    throw new MediaHostFailure("unsupported", "This diagnostic adapter only supports HeyGen.");
  const models = ["heygen-voice-1", "heygen-voice-1-turbo", "heygen-voice-1-turbo-free"].map(
    (id) => ({ id, access: "unknown" as const }),
  );
  const limitations = [
    "Model access is unverified: read-only key and voice metadata do not prove inference entitlement.",
    "Account training policy is not established by API-key scopes.",
  ];
  const key = await getHeyGenKey(context, settings);
  const scopes = key.scope_mode === "full" ? [...new Set(["*:*", ...key.scopes])] : key.scopes;
  let accountId: string | null = null;
  if (scopes.some((scope) => ["*:*", "*:read", "account:read", "account:write"].includes(scope))) {
    try {
      accountId = Schema.decodeUnknownSync(AccountResponse)(
        await read(context, settings, "https://api.heygen.com/v3/users/me"),
      ).data.username;
    } catch (error: unknown) {
      if (error instanceof MediaHttpFailure && error.diagnostic.category === "permission")
        limitations.push("Account identity could not be read with these credentials.");
      else throw error;
    }
  } else
    limitations.push(
      "Account identity was not requested because account-read scope was not reported.",
    );
  if (request.voiceId !== undefined) {
    const voice = await getHeyGenVoice(context, settings, request.voiceId);
    limitations.push(
      voice.readiness === "ready"
        ? "The selected voice is ACTIVE; model-specific synthesis access remains unverified."
        : "The selected voice is not confirmed ACTIVE.",
    );
  }
  return {
    backend: "heygen",
    authenticated: key.status === "active",
    accountId,
    credentialBinding: key.key_id,
    scopes,
    models,
    checkedAt: new Date().toISOString(),
    limitations,
  };
}
