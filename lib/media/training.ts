import { Effect, Schema } from "effect";

const Label = Schema.NonEmptyString.check(
  Schema.isMaxLength(256),
  Schema.isPattern(/^[^\p{Cc}]+$/u),
);
const Note = Schema.NonEmptyString.check(Schema.isMaxLength(1000));
const Milliseconds = Schema.Int.check(
  Schema.isBetween({ minimum: 0, maximum: Number.MAX_SAFE_INTEGER }),
);
const SourceUrl = Schema.String.check(
  Schema.isMaxLength(2048),
  Schema.isPattern(/^https:\/\/[^\s]+$/),
);
const State = Schema.Literals(["excluded", "permitted", "conditional", "unknown"]);
const DefaultState = Schema.Literals(["excluded", "permitted", "unknown"]);
const EffectState = Schema.Literals(["excluded", "permitted", "blocked"]);

export const TrainingScopeSchema = Schema.Struct({
  backendId: Label,
  provider: Label,
  host: Label,
  operation: Label,
  model: Schema.NullOr(Label),
  accountId: Schema.NullOr(Label),
  routeRevision: Label,
});
export type TrainingScope = typeof TrainingScopeSchema.Type;

export const TrainingBindingSchema = Schema.Struct({
  backendId: Label,
  host: Label,
  accountId: Label,
  credentialBinding: Label,
  verifiedAt: Milliseconds,
  expiresAt: Milliseconds,
  verification: Schema.Literal("authenticated-account"),
});
export type TrainingBinding = typeof TrainingBindingSchema.Type;

export const TrainingEvidenceSchema = Schema.Struct({
  id: Label,
  scope: TrainingScopeSchema,
  policyRevision: Label,
  credentialBinding: Label,
  accountRevision: Label,
  condition: Label,
  effect: Schema.Literals(["excluded", "permitted"]),
  kind: Schema.Literals(["user-assertion", "document-review", "provider-confirmation"]),
  reviewedAt: Milliseconds,
  expiresAt: Milliseconds,
  invalidated: Schema.Boolean,
  sourceUrl: SourceUrl,
  artifactSha256: Schema.NullOr(Schema.String.check(Schema.isPattern(/^[a-f0-9]{64}$/))),
  reviewer: Label,
  reference: Note,
});
export type TrainingEvidence = typeof TrainingEvidenceSchema.Type;

export const TrainingAccountConfigSchema = Schema.Struct({
  accountId: Label,
  revision: Label,
  evidence: Schema.Array(TrainingEvidenceSchema).check(Schema.isMaxLength(32)),
});
export type TrainingAccountConfig = typeof TrainingAccountConfigSchema.Type;

export const TrainingPolicySchema = Schema.Struct({
  version: Schema.Literal("media-training/1"),
  state: State,
  defaultState: DefaultState,
  scope: TrainingScopeSchema,
  revision: Label,
  accountRevision: Schema.NullOr(Label),
  reviewedAt: Milliseconds,
  expiresAt: Milliseconds,
  sources: Schema.Array(SourceUrl).check(Schema.isMaxLength(16)),
  conditions: Schema.Array(Label).check(Schema.isMaxLength(16)),
  evidence: Schema.Array(TrainingEvidenceSchema).check(Schema.isMaxLength(32)),
  binding: Schema.optional(TrainingBindingSchema),
  explanation: Note,
});
export type TrainingPolicy = typeof TrainingPolicySchema.Type;

export const TrainingDecisionSchema = Schema.Struct({
  effective: EffectState,
  eligible: Schema.Boolean,
  usedTrainingOptIn: Schema.Boolean,
  verification: Schema.Literals(["none", "source-reviewed", "document-reviewed"]),
  reasons: Schema.Array(Note).check(Schema.isMaxLength(16)),
  evidenceIds: Schema.Array(Label).check(Schema.isMaxLength(32)),
  assertionIds: Schema.Array(Label).check(Schema.isMaxLength(32)),
});
export type TrainingDecision = typeof TrainingDecisionSchema.Type;

export const TrainingDecisionOptionsSchema = Schema.Struct({
  now: Milliseconds,
  allowTraining: Schema.optional(Schema.Boolean),
  scope: Schema.optional(TrainingScopeSchema),
});
export type TrainingDecisionOptions = typeof TrainingDecisionOptionsSchema.Type;

export class MediaTrainingError extends Schema.TaggedError<MediaTrainingError>()(
  "MediaTrainingError",
  {
    code: Schema.Literals(["invalid", "training-blocked"]),
    message: Schema.String,
  },
) {}

export function sameTrainingScope(left: TrainingScope, right: TrainingScope): boolean {
  return (
    left.backendId === right.backendId &&
    left.provider === right.provider &&
    left.host === right.host &&
    left.operation === right.operation &&
    left.model === right.model &&
    left.accountId === right.accountId &&
    left.routeRevision === right.routeRevision
  );
}

function current(reviewedAt: number, expiresAt: number, now: number): boolean {
  return (
    Number.isSafeInteger(now) && reviewedAt <= now && now < expiresAt && reviewedAt < expiresAt
  );
}

function decision(
  effective: TrainingDecision["effective"],
  options: TrainingDecisionOptions,
  reason: string,
  verification: TrainingDecision["verification"] = "none",
  evidenceIds: readonly string[] = [],
  assertionIds: readonly string[] = [],
): TrainingDecision {
  const usedTrainingOptIn = effective === "permitted" && options.allowTraining === true;
  return {
    effective,
    eligible: effective === "excluded" || usedTrainingOptIn,
    usedTrainingOptIn,
    verification,
    reasons: [reason],
    evidenceIds,
    assertionIds,
  };
}

/** Pure policy decision; callers supply time and recheck the current route before effects. */
export function evaluateTrainingPolicy(
  policy: TrainingPolicy | undefined,
  options: TrainingDecisionOptions,
): TrainingDecision {
  if (policy === undefined)
    return decision(
      "blocked",
      options,
      "Training policy is missing; explicit selection cannot bypass it.",
    );
  const assertions = policy.evidence
    .filter((item) => item.kind === "user-assertion")
    .map((item) => item.id);
  if (
    policy.state === "unknown" ||
    policy.defaultState === "unknown" ||
    policy.sources.length === 0
  )
    return decision(
      "blocked",
      options,
      "Training policy is unknown and cannot be overridden.",
      "none",
      [],
      assertions,
    );
  if (!current(policy.reviewedAt, policy.expiresAt, options.now))
    return decision(
      "blocked",
      options,
      "Training policy review is stale or not yet valid.",
      "none",
      [],
      assertions,
    );
  if (options.scope !== undefined && !sameTrainingScope(policy.scope, options.scope))
    return decision(
      "blocked",
      options,
      "Training policy does not match the current account, model, host or operation.",
      "none",
      [],
      assertions,
    );
  if (policy.state !== "conditional") {
    if (policy.state !== policy.defaultState)
      return decision(
        "blocked",
        options,
        "Training policy state contradicts its reviewed default.",
        "none",
        [],
        assertions,
      );
    return decision(
      policy.state,
      options,
      policy.state === "excluded"
        ? "Reviewed route excludes general provider training."
        : "General provider training is permitted; this invocation requires explicit opt-in.",
      "source-reviewed",
      [],
      assertions,
    );
  }
  const binding = policy.binding;
  const bound =
    binding !== undefined &&
    binding.verification === "authenticated-account" &&
    binding.backendId === policy.scope.backendId &&
    binding.host === policy.scope.host &&
    binding.accountId === policy.scope.accountId &&
    current(binding.verifiedAt, binding.expiresAt, options.now) &&
    binding.expiresAt - binding.verifiedAt <= 300_000;
  const evidence = policy.evidence.filter(
    (item) =>
      bound &&
      binding !== undefined &&
      item.credentialBinding === binding.credentialBinding &&
      item.kind !== "user-assertion" &&
      item.artifactSha256 !== null &&
      !item.invalidated &&
      item.policyRevision === policy.revision &&
      item.accountRevision === policy.accountRevision &&
      item.reviewedAt >= policy.reviewedAt &&
      policy.scope.accountId !== null &&
      sameTrainingScope(item.scope, policy.scope) &&
      policy.conditions.includes(item.condition) &&
      current(item.reviewedAt, item.expiresAt, options.now),
  );
  const exclusions = evidence.filter((item) => item.effect === "excluded");
  const permissions = evidence.filter((item) => item.effect === "permitted");
  if (exclusions.length > 0 && permissions.length > 0)
    return decision(
      "blocked",
      options,
      "Current account evidence conflicts; reconcile it before processing content.",
      "none",
      evidence.map((item) => item.id),
      assertions,
    );
  if (exclusions.length > 0)
    return decision(
      "excluded",
      options,
      "Live account binding matches scoped documentary exclusion evidence; authentication does not itself verify the training setting.",
      "document-reviewed",
      exclusions.map((item) => item.id),
      assertions,
    );
  if (permissions.length > 0 || policy.defaultState === "permitted")
    return decision(
      "permitted",
      options,
      "Known provider terms permit general training; explicit per-invocation opt-in is required.",
      permissions.length > 0 ? "document-reviewed" : "source-reviewed",
      permissions.map((item) => item.id),
      assertions,
    );
  return decision(
    "blocked",
    options,
    "Conditional exclusion requires current scoped evidence and live account binding; assertions and API-key presence are insufficient.",
    "none",
    [],
    assertions,
  );
}

/** Decode external values and authorize before any upload or provider effect. */
export const authorizeTraining = Effect.fnUntraced(function* (
  policyInput: unknown,
  optionsInput: unknown,
) {
  const options = yield* Schema.decodeUnknownEffect(TrainingDecisionOptionsSchema)(optionsInput, {
    onExcessProperty: "error",
  }).pipe(
    Effect.mapError(
      () =>
        new MediaTrainingError({ code: "invalid", message: "Invalid training decision context." }),
    ),
  );
  const policy =
    policyInput === undefined
      ? undefined
      : yield* Schema.decodeUnknownEffect(TrainingPolicySchema)(policyInput, {
          onExcessProperty: "error",
        }).pipe(
          Effect.mapError(
            () =>
              new MediaTrainingError({
                code: "invalid",
                message: "Invalid training policy metadata.",
              }),
          ),
        );
  const result = evaluateTrainingPolicy(policy, options);
  if (!result.eligible)
    return yield* new MediaTrainingError({
      code: "training-blocked",
      message: result.reasons[0] ?? "Training policy blocks this operation.",
    });
  return result;
});
