import type {
  TrainingAccountConfig,
  TrainingBinding,
  TrainingPolicy,
  TrainingScope,
} from "@/media";

/** Fixed review dates: process startup must never refresh policy evidence implicitly. */
export const mediaTrainingReview = {
  reviewedAt: 1_792_886_400_000,
  expiresAt: 1_795_478_400_000,
  revision: "media-provider-review/2026-10-25",
} as const;

export interface MediaTrainingPolicyInput {
  readonly backendId: string;
  readonly operation: string;
  readonly model: string | null;
  readonly account?: TrainingAccountConfig;
  readonly routeRevision?: string;
  readonly binding?: TrainingBinding;
}

interface ProviderRule {
  readonly host: string;
  readonly operations: readonly string[];
  readonly state: TrainingPolicy["state"];
  readonly defaultState: TrainingPolicy["defaultState"];
  readonly revision: string;
  readonly sources: readonly string[];
  readonly conditions: readonly string[];
  readonly explanation: string;
}

const localRule = (source: string, operations: readonly string[]): ProviderRule => ({
  host: "local",
  operations,
  state: "excluded",
  defaultState: "excluded",
  revision: "teamagent-local-media/1",
  sources: [source],
  conditions: [],
  explanation:
    "The reviewed adapter uses provisioned local assets without a provider training route. This is a route property, not an attestation of a configured executable, network isolation or model licensing.",
});

const rules: Readonly<Record<string, ProviderRule>> = {
  ffmpeg: localRule("https://github.com/FFmpeg/FFmpeg", ["inspect", "convert", "record"]),
  "whisper-cpp": localRule("https://github.com/ggml-org/whisper.cpp", ["transcribe"]),
  piper: localRule("https://github.com/OHF-Voice/piper1-gpl", ["synthesize"]),
  chatterbox: localRule("https://github.com/resemble-ai/chatterbox", ["synthesize"]),
  omnivoice: localRule("https://github.com/k2-fsa/OmniVoice", ["synthesize"]),
  openai: {
    host: "api.openai.com",
    operations: ["transcribe", "synthesize"],
    state: "conditional",
    defaultState: "excluded",
    revision: "openai-api-data/2026-10-25",
    sources: ["https://developers.openai.com/api/docs/guides/your-data"],
    conditions: ["sharing-disabled", "sharing-enabled"],
    explanation:
      "API content is excluded from general training unless the organization opts in. The current account sharing configuration needs scoped documentary evidence. Retention and zero-data-retention eligibility are separate.",
  },
  elevenlabs: {
    host: "api.elevenlabs.io",
    operations: ["transcribe", "synthesize", "clone"],
    state: "conditional",
    defaultState: "permitted",
    revision: "elevenlabs-data-use/2026-10-25",
    sources: [
      "https://elevenlabs.io/docs/help-center/legal/is-my-data-used-to-improve-eleven-labs-ai-models",
      "https://elevenlabs.io/docs/eleven-api/resources/zero-retention-mode",
    ],
    conditions: ["enterprise-exclusion", "confirmed-opt-out"],
    explanation:
      "Standard data use permits model improvement. Enterprise coverage or a saved prospective opt-out can exclude it. Voice cloning requires persistent provider data and is not covered by zero retention merely because synthesis is.",
  },
  heygen: {
    host: "api.heygen.com",
    operations: ["synthesize", "clone"],
    state: "conditional",
    defaultState: "permitted",
    revision: "heygen-privacy/2026-10-15",
    sources: ["https://www.heygen.com/privacy", "https://www.heygen.com/security"],
    conditions: ["enterprise-exclusion", "confirmed-opt-out"],
    explanation:
      "Non-enterprise content may train or enhance service models. Enterprise coverage or a completed opt-out needs account-specific documentary evidence. A free Voice API model, API key or fast clone creation is not an exclusion.",
  },
  fish: {
    host: "api.fish.audio",
    operations: ["synthesize", "clone"],
    state: "conditional",
    defaultState: "permitted",
    revision: "fish-customer-agreement/2026-08-10",
    sources: ["https://fish.audio/terms/", "https://fish.audio/enterprise-terms/"],
    conditions: ["zdr-covered", "operation-specific-contract"],
    explanation:
      "Standard terms permit model improvement. Eligible zero-data-retention processing excludes training prospectively; feature, model and retained-content exceptions require exact operation evidence. Paid or private accounts alone do not prove an exclusion.",
  },
};

/** Resolve reviewed route metadata only; this does not authenticate an account or change provider settings. */
export function resolveMediaTrainingPolicy(input: MediaTrainingPolicyInput): TrainingPolicy {
  const rule = Object.hasOwn(rules, input.backendId) ? rules[input.backendId] : undefined;
  const supported = rule !== undefined && rule.operations.includes(input.operation);
  const local = supported && rule.host === "local";
  const scope: TrainingScope = {
    backendId: input.backendId,
    provider: input.backendId,
    host: rule?.host ?? "unreviewed",
    operation: input.operation,
    model: input.model,
    accountId: local ? null : (input.account?.accountId ?? null),
    routeRevision: input.routeRevision ?? "teamagent-media-direct/1",
  };
  return {
    version: "media-training/1",
    state: supported ? rule.state : "unknown",
    defaultState: supported ? rule.defaultState : "unknown",
    scope,
    revision: supported ? rule.revision : "unreviewed/1",
    accountRevision: local ? null : (input.account?.revision ?? null),
    reviewedAt: mediaTrainingReview.reviewedAt,
    expiresAt: mediaTrainingReview.expiresAt,
    sources: supported ? rule.sources : [],
    conditions: supported
      ? input.backendId === "fish" && input.operation === "clone"
        ? ["operation-specific-contract"]
        : rule.conditions
      : [],
    evidence: local ? [] : (input.account?.evidence ?? []),
    ...(input.binding === undefined || local ? {} : { binding: input.binding }),
    explanation: supported
      ? rule.explanation
      : "No reviewed policy covers this provider and operation; explicit selection and training opt-in cannot make an unknown route eligible.",
  };
}
