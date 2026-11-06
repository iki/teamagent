import { Schema } from "effect";

export const dependencyLimits = {
  inputBytes: 1_048_576,
  lockBytes: 8_388_608,
  packages: 256,
  fixes: 32,
  files: 64,
  catalogArtifacts: 256,
  processBytes: 2_097_152,
  processMs: 120_000,
  applyMs: 900_000,
} as const;

export class DependencyError extends Schema.TaggedError<DependencyError>()("DependencyError", {
  code: Schema.Literals(["invalid", "conflict", "blocked", "io", "failed", "uncertain", "limit"]),
  message: Schema.String,
}) {}

export const PackageName = Schema.String.check(
  Schema.isPattern(/^(?:@[a-z0-9._-]+\/)?[a-z0-9][a-z0-9._-]*$/),
  Schema.isMaxLength(214),
);
export const Version = Schema.String.check(
  Schema.isPattern(/^\d+\.\d+\.\d+(?:-[0-9A-Za-z.-]+)?(?:\+[0-9A-Za-z.-]+)?$/),
  Schema.isMaxLength(128),
);
export const Digest = Schema.String.check(Schema.isPattern(/^[0-9a-f]{64}$/));
export const Revision = Schema.String.check(Schema.isPattern(/^[0-9a-f]{40}$/));
export const RelativePath = Schema.String.check(
  Schema.isPattern(/^(?!\/)(?!.*(?:^|\/)\.{1,2}(?:\/|$))[A-Za-z0-9_@./-]+$/),
  Schema.isMaxLength(512),
);
export const ManifestSchema = Schema.Struct({
  packageManager: Schema.Literal("aube@2.5.1"),
  dependencies: Schema.Record(PackageName, Version),
  devDependencies: Schema.Record(PackageName, Version),
  aube: Schema.optional(
    Schema.Struct({
      patchedDependencies: Schema.optional(Schema.Record(Schema.String, RelativePath)),
    }),
  ),
});
export type DependencyManifest = typeof ManifestSchema.Type;

export const OutdatedSchema = Schema.Record(
  PackageName,
  Schema.Struct({
    current: Version,
    wanted: Version,
    latest: Version,
    dependencyType: Schema.Literals(["dependencies", "devDependencies"]),
  }),
);
export type OutdatedReport = typeof OutdatedSchema.Type;

export const FixSchema = Schema.Struct({
  id: Schema.String.check(Schema.isPattern(/^[a-z][a-z0-9-]{1,63}$/)),
  kind: Schema.Literals(["host-adapter", "package-patch"]),
  requires: Schema.Array(Schema.String.check(Schema.isPattern(/^[a-z][a-z0-9-]{1,63}$/))).check(
    Schema.isMaxLength(dependencyLimits.fixes),
  ),
  packages: Schema.Array(
    Schema.Struct({
      name: PackageName,
      versions: Schema.Array(Version).check(Schema.isMaxLength(16)),
    }),
  ).check(Schema.isMinLength(1), Schema.isMaxLength(16)),
  files: Schema.Array(
    Schema.Struct({ sourcePath: RelativePath, artifactPath: RelativePath, sha256: Digest }),
  ).check(Schema.isMinLength(1), Schema.isMaxLength(16)),
  evidence: Schema.String.check(Schema.isMaxLength(2048)),
});
export const RegistrySchema = Schema.Struct({
  format: Schema.Literal("teamagent-patches-selection-v1"),
  sourceRepository: Schema.Literal("https://github.com/iki/patches"),
  sourceRevision: Revision,
  metadata: Schema.Struct({
    catalog: Schema.Struct({
      sourcePath: Schema.Literal("registry.json"),
      artifactPath: Schema.Literal("patches/trigon/catalog.json"),
      sha256: Digest,
    }),
    migration: Schema.Struct({
      sourcePath: Schema.Literal("migration.json"),
      artifactPath: Schema.Literal("patches/trigon/migration.json"),
      sha256: Digest,
    }),
  }),
  notices: Schema.Array(
    Schema.Struct({ sourcePath: RelativePath, artifactPath: RelativePath, sha256: Digest }),
  ).check(Schema.isMinLength(1), Schema.isMaxLength(16)),
  fixes: Schema.Array(FixSchema).check(Schema.isMaxLength(dependencyLimits.fixes)),
});
export type PatchRegistry = typeof RegistrySchema.Type;

export const BaselineSchema = Schema.Struct({
  manifest: Digest,
  lock: Digest,
  trust: Digest,
  registry: Digest,
  cargo: Digest,
});
export type DependencyBaseline = typeof BaselineSchema.Type;
export const UpgradeSchema = Schema.Struct({
  name: PackageName,
  current: Version,
  target: Version,
  group: Schema.Literals(["dependencies", "devDependencies"]),
});
export const BlockSchema = Schema.Struct({
  package: Schema.String,
  reason: Schema.String,
  action: Schema.Literal("ask-user-for-canonical-fix"),
});
export const PlanSchema = Schema.Struct({
  format: Schema.Literal("teamagent-dependency-plan-v1"),
  baseline: BaselineSchema,
  sourceRevision: Revision,
  reportStatus: Schema.Literals([0, 1]),
  report: OutdatedSchema,
  upgrades: Schema.Array(UpgradeSchema).check(Schema.isMaxLength(dependencyLimits.packages)),
  blocked: Schema.Array(BlockSchema).check(Schema.isMaxLength(dependencyLimits.packages)),
  automaticRepair: Schema.Literal(false),
  provider: Schema.Literal("aube-eligible-report"),
});
export type DependencyPlan = typeof PlanSchema.Type;
