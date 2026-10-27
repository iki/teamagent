import { describe, expect, test } from "bun:test";
import { rejects } from "node:assert/strict";
import { Effect } from "effect";
import {
  authorizeTraining,
  evaluateTrainingPolicy,
  type TrainingAccountConfig,
  type TrainingEvidence,
  type TrainingPolicy,
} from "@/media";
import { mediaTrainingReview, resolveMediaTrainingPolicy } from "../app/media/training.ts";

const now = mediaTrainingReview.reviewedAt + 60_000;
const account: TrainingAccountConfig = {
  accountId: "fixture-account",
  revision: "account-v1",
  evidence: [],
};
const policy = (backendId = "openai", operation = "transcribe"): TrainingPolicy =>
  resolveMediaTrainingPolicy({
    backendId,
    operation,
    model: "fixture-model",
    account,
  });
const evidence = (
  source: TrainingPolicy,
  overrides: Partial<TrainingEvidence> = {},
): TrainingEvidence => ({
  id: "fixture-document",
  scope: source.scope,
  policyRevision: source.revision,
  credentialBinding: "fixture-key-id",
  accountRevision: account.revision,
  condition: "sharing-disabled",
  effect: "excluded",
  kind: "document-review",
  reviewedAt: now - 1,
  expiresAt: now + 60_000,
  invalidated: false,
  sourceUrl: "https://example.com/fixture-evidence",
  artifactSha256: "a".repeat(64),
  reviewer: "fixture-reviewer",
  reference: "Synthetic account-policy fixture; no real account or provider was contacted.",
  ...overrides,
});
const withEvidence = (
  source: TrainingPolicy,
  items: readonly TrainingEvidence[],
  bound = true,
): TrainingPolicy => ({
  ...source,
  evidence: items,
  ...(bound
    ? {
        binding: {
          backendId: source.scope.backendId,
          host: source.scope.host,
          accountId: account.accountId,
          credentialBinding: "fixture-key-id",
          verifiedAt: now - 1,
          expiresAt: now + 60_000,
          verification: "authenticated-account",
        },
      }
    : {}),
});

describe("media training policy", () => {
  test("missing and unknown policies deny execution even with explicit opt-in", async () => {
    let executed = 0;
    for (const source of [
      undefined,
      policy("unreviewed-provider"),
      policy("toString"),
      policy("__proto__"),
    ]) {
      await rejects(
        Effect.runPromise(
          authorizeTraining(source, { now, allowTraining: true }).pipe(
            Effect.andThen(
              Effect.sync(() => {
                executed += 1;
              }),
            ),
          ),
        ),
      );
    }
    expect(executed).toBe(0);
  });

  test("reviewed local routes exclude general provider training; unsupported operations remain unknown", () => {
    expect(evaluateTrainingPolicy(policy("piper", "synthesize"), { now }).effective).toBe(
      "excluded",
    );
    expect(
      evaluateTrainingPolicy(policy("piper", "clone"), { now, allowTraining: true }).eligible,
    ).toBe(false);
  });

  test("known permitted defaults need per-invocation opt-in without mutation", async () => {
    const source = policy("heygen", "synthesize");
    const before = JSON.stringify(source);
    expect(evaluateTrainingPolicy(source, { now }).eligible).toBe(false);
    const result = await Effect.runPromise(authorizeTraining(source, { now, allowTraining: true }));
    expect(result.effective).toBe("permitted");
    expect(result.usedTrainingOptIn).toBe(true);
    expect(JSON.stringify(source)).toBe(before);
    expect(evaluateTrainingPolicy(source, { now }).eligible).toBe(false);
  });

  test("assertions, API-key-like statements and absent artifacts do not establish exclusions", () => {
    const source = policy();
    const asserted = evidence(source, {
      kind: "user-assertion",
      reference: "An API key exists and I believe sharing is disabled.",
    });
    const result = evaluateTrainingPolicy(withEvidence(source, [asserted]), {
      now,
      allowTraining: true,
    });
    expect(result.effective).toBe("blocked");
    expect(result.assertionIds).toEqual([asserted.id]);
    expect(
      evaluateTrainingPolicy(withEvidence(source, [evidence(source, { artifactSha256: null })]), {
        now,
      }).eligible,
    ).toBe(false);
  });

  test("passive documentary evidence cannot authenticate an account or credential", () => {
    const source = policy();
    expect(
      evaluateTrainingPolicy(withEvidence(source, [evidence(source)], false), {
        now,
        allowTraining: true,
      }).effective,
    ).toBe("blocked");
    const changedKey = evidence(source, { credentialBinding: "other-key-id" });
    expect(evaluateTrainingPolicy(withEvidence(source, [changedKey]), { now }).eligible).toBe(
      false,
    );
  });

  test("expired, future, overlong or mismatched live identity receipts cannot authorize exclusion", () => {
    const source = policy();
    const reviewed = withEvidence(source, [evidence(source)]);
    const binding = reviewed.binding;
    if (binding === undefined) throw new Error("Fixture requires a binding receipt.");
    for (const changed of [
      { ...binding, expiresAt: now },
      { ...binding, verifiedAt: now + 1 },
      { ...binding, expiresAt: now + 300_000 },
      { ...binding, backendId: "other-provider" },
      { ...binding, accountId: "other-account" },
      { ...binding, host: "other.example" },
    ])
      expect(
        evaluateTrainingPolicy({ ...reviewed, binding: changed }, { now, allowTraining: true })
          .eligible,
      ).toBe(false);
  });

  test("current scoped document review records its verification level", () => {
    const source = policy();
    const result = evaluateTrainingPolicy(withEvidence(source, [evidence(source)]), { now });
    expect(result.effective).toBe("excluded");
    expect(result.verification).toBe("document-reviewed");
    expect(result.usedTrainingOptIn).toBe(false);
  });

  test("changes to account, model, host, operation, route or evidence revision invalidate exclusion", () => {
    const source = policy();
    const item = evidence(source);
    const scopes = [
      { ...source.scope, accountId: "other-account" },
      { ...source.scope, model: "other-model" },
      { ...source.scope, host: "other.example" },
      { ...source.scope, operation: "synthesize" },
      { ...source.scope, routeRevision: "route-v2" },
    ];
    for (const scope of scopes) {
      expect(
        evaluateTrainingPolicy(withEvidence(source, [{ ...item, scope }]), { now }).eligible,
      ).toBe(false);
    }
    for (const changed of [
      { ...item, policyRevision: "policy-v2" },
      { ...item, accountRevision: "account-v2" },
      { ...item, invalidated: true },
      { ...item, expiresAt: now },
      { ...item, reviewedAt: now + 1 },
    ])
      expect(evaluateTrainingPolicy(withEvidence(source, [changed]), { now }).eligible).toBe(false);
  });

  test("stale policy and explicit route override remain blocked before execution", async () => {
    const source = policy();
    let executed = false;
    await rejects(
      Effect.runPromise(
        authorizeTraining(withEvidence(source, [evidence(source)]), {
          now,
          allowTraining: true,
          scope: { ...source.scope, host: "override.example" },
        }).pipe(
          Effect.andThen(
            Effect.sync(() => {
              executed = true;
            }),
          ),
        ),
      ),
    );
    expect(executed).toBe(false);
    expect(
      evaluateTrainingPolicy({ ...source, expiresAt: now }, { now, allowTraining: true }).eligible,
    ).toBe(false);
  });

  test("conflicting documentary records block even otherwise permitted defaults", () => {
    const source = policy("heygen", "synthesize");
    const exclusion = evidence(source, { condition: "confirmed-opt-out" });
    const permission = evidence(source, {
      id: "other-document",
      condition: "confirmed-opt-out",
      effect: "permitted",
    });
    expect(
      evaluateTrainingPolicy(withEvidence(source, [exclusion, permission]), {
        now,
        allowTraining: true,
      }).effective,
    ).toBe("blocked");
  });

  test("Fish persistent clone cannot reuse synthesis ZDR eligibility", () => {
    const source = policy("fish", "clone");
    const result = evaluateTrainingPolicy(
      withEvidence(source, [evidence(source, { condition: "zdr-covered" })]),
      { now },
    );
    expect(result.effective).toBe("permitted");
    expect(result.eligible).toBe(false);
  });

  test("external metadata rejects unknown flags and nonboolean training opt-in", async () => {
    await rejects(
      Effect.runPromise(
        authorizeTraining(policy("heygen", "synthesize"), { now, allowTraining: "true" }),
      ),
    );
    await rejects(
      Effect.runPromise(authorizeTraining(policy("heygen", "synthesize"), { now, bypass: true })),
    );
  });
});
