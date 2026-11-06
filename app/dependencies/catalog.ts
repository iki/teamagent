import { Effect, Schema } from "effect";
import {
  DependencyError,
  Digest,
  PackageName,
  RelativePath,
  Revision,
  Version,
  dependencyLimits,
  type PatchRegistry,
} from "./model.ts";

const Id = Schema.String.check(Schema.isPattern(/^[a-z][a-z0-9-]{1,63}$/));
const Paths = Schema.Array(RelativePath).check(Schema.isMaxLength(dependencyLimits.files));
const Repository = Schema.String.check(
  Schema.isPattern(/^https:\/\/github\.com\/[A-Za-z0-9_.-]+\/[A-Za-z0-9_.-]+$/),
  Schema.isMaxLength(256),
);
const Packages = Schema.Array(
  Schema.Struct({
    name: PackageName,
    versions: Schema.Array(Version).check(Schema.isMinLength(1), Schema.isMaxLength(16)),
  }),
).check(Schema.isMinLength(1), Schema.isMaxLength(16));

// Decode a bounded projection; prose, upstream URLs and instructions are never executed.
const CatalogSchema = Schema.Struct({
  format: Schema.Literal("shared-patch-registry-v1"),
  repository: Schema.Literal("https://github.com/iki/patches"),
  migration: Schema.Literal("migration.json"),
  observation: Schema.Struct({
    sources: Schema.Array(Schema.Struct({ repository: Repository, revision: Revision })).check(
      Schema.isMaxLength(32),
    ),
  }),
  fixes: Schema.Array(
    Schema.Struct({
      id: Id,
      kind: Schema.Literals(["host-adapter", "package-patch", "declaration-adapter"]),
      packages: Packages,
      requires: Schema.Array(Id).check(Schema.isMaxLength(dependencyLimits.fixes)),
      files: Paths,
    }),
  ).check(Schema.isMaxLength(dependencyLimits.fixes)),
});
const MigrationSchema = Schema.Struct({
  format: Schema.Literal("patch-migration-v1"),
  repository: Schema.Literal("https://github.com/iki/patches"),
  artifacts: Schema.Array(
    Schema.Struct({
      path: RelativePath,
      bytes: Schema.Int.check(
        Schema.isGreaterThanOrEqualTo(0),
        Schema.isLessThanOrEqualTo(dependencyLimits.inputBytes),
      ),
      sha256: Digest,
      originalSha256: Digest,
      lfSha256: Digest,
      gitMode: Schema.Literals(["100644", "100755"]),
      lineEndings: Schema.Literal("lf"),
      origin: Schema.Struct({
        repository: Repository,
        revision: Revision,
        path: RelativePath,
        gitBlob: Revision,
      }),
      notices: Paths,
      licenseStatus: Schema.Literals(["retained-notices", "no-source-project-license-found"]),
    }),
  ).check(Schema.isMaxLength(dependencyLimits.catalogArtifacts)),
});

const invalid = () =>
  new DependencyError({
    code: "blocked",
    message:
      "ASK: canonical Patches metadata does not cover the selected fixes, versions, artifacts or notices.",
  });
const portable = (path: string): boolean => path.split("/").every((part) => part.length > 0);
const unique = (values: readonly string[]): boolean =>
  new Set(values.map((value) => value.toLowerCase())).size === values.length;

/** Verify local selections, or propose new hashes without changing their paths/versions. */
export const catalogSelection = Effect.fnUntraced(function* (
  selected: PatchRegistry,
  catalogInput: unknown,
  migrationInput: unknown,
  refresh = false,
): Effect.fn.Return<PatchRegistry, DependencyError> {
  const catalog = yield* Schema.decodeUnknownEffect(CatalogSchema)(catalogInput).pipe(
    Effect.mapError(invalid),
  );
  const migration = yield* Schema.decodeUnknownEffect(MigrationSchema)(migrationInput).pipe(
    Effect.mapError(invalid),
  );
  if (
    !unique(catalog.fixes.map((fix) => fix.id)) ||
    !unique(migration.artifacts.map((artifact) => artifact.path)) ||
    migration.artifacts.reduce((sum, artifact) => sum + artifact.bytes, 0) >
      dependencyLimits.lockBytes
  )
    return yield* invalid();
  const observations = catalog.observation.sources.map(
    (source) => `${source.repository}#${source.revision}`,
  );
  if (!unique(observations)) return yield* invalid();
  const observed = new Set(observations);
  const artifacts = new Map(migration.artifacts.map((artifact) => [artifact.path, artifact]));
  const fixes = new Map(catalog.fixes.map((fix) => [fix.id, fix]));
  for (const artifact of migration.artifacts) {
    if (
      !portable(artifact.path) ||
      !portable(artifact.origin.path) ||
      !observed.has(`${artifact.origin.repository}#${artifact.origin.revision}`) ||
      artifact.sha256 !== artifact.originalSha256 ||
      artifact.sha256 !== artifact.lfSha256 ||
      !unique(artifact.notices) ||
      artifact.notices.some((path) => !artifacts.has(path)) ||
      (artifact.licenseStatus === "retained-notices" && artifact.notices.length === 0)
    )
      return yield* invalid();
  }
  for (const fix of catalog.fixes) {
    if (
      !unique(fix.requires) ||
      !unique(fix.files) ||
      !unique(fix.packages.map((item) => item.name)) ||
      fix.packages.some((item) => !unique(item.versions)) ||
      fix.requires.some((id) => !fixes.has(id)) ||
      fix.files.some((path) => !artifacts.has(path))
    )
      return yield* invalid();
  }
  const visited = new Set<string>();
  const active = new Set<string>();
  const acyclic = (id: string): boolean => {
    if (active.has(id)) return false;
    if (visited.has(id)) return true;
    const fix = fixes.get(id);
    if (fix === undefined) return false;
    active.add(id);
    for (const prerequisite of fix.requires) if (!acyclic(prerequisite)) return false;
    active.delete(id);
    visited.add(id);
    return true;
  };
  if (catalog.fixes.some((fix) => !acyclic(fix.id))) return yield* invalid();
  const selectedIds = new Set(selected.fixes.map((fix) => fix.id));
  const requiredNotices = new Set<string>();
  const selectedFixes: PatchRegistry["fixes"][number][] = [];
  for (const selection of selected.fixes) {
    const canonical = fixes.get(selection.id);
    if (
      canonical === undefined ||
      canonical.kind !== selection.kind ||
      canonical.packages.length !== selection.packages.length ||
      canonical.requires.length !== selection.requires.length ||
      canonical.requires.some((id) => !selection.requires.includes(id) || !selectedIds.has(id)) ||
      selection.packages.some((item) => {
        const compatible = canonical.packages.find((candidate) => candidate.name === item.name);
        return (
          compatible === undefined ||
          item.versions.some((version) => !compatible.versions.includes(version))
        );
      })
    )
      return yield* invalid();
    const files: PatchRegistry["fixes"][number]["files"][number][] = [];
    for (const file of selection.files) {
      const artifact = artifacts.get(file.sourcePath);
      if (
        artifact === undefined ||
        !canonical.files.includes(file.sourcePath) ||
        artifact.licenseStatus !== "retained-notices" ||
        (!refresh && artifact.sha256 !== file.sha256)
      )
        return yield* invalid();
      for (const notice of artifact.notices) requiredNotices.add(notice);
      files.push({ ...file, sha256: artifact.sha256 });
    }
    selectedFixes.push({ ...selection, files });
  }
  if (selected.notices.length !== requiredNotices.size) return yield* invalid();
  const notices: PatchRegistry["notices"][number][] = [];
  for (const notice of selected.notices) {
    const artifact = artifacts.get(notice.sourcePath);
    if (
      artifact === undefined ||
      !requiredNotices.delete(notice.sourcePath) ||
      (!refresh && artifact.sha256 !== notice.sha256)
    )
      return yield* invalid();
    notices.push({ ...notice, sha256: artifact.sha256 });
  }
  if (requiredNotices.size !== 0) return yield* invalid();
  return { ...selected, fixes: selectedFixes, notices };
});
