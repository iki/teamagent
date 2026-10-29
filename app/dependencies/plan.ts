import { Effect, Schema } from "effect";
import {
  DependencyError,
  ManifestSchema,
  OutdatedSchema,
  RegistrySchema,
  dependencyLimits,
  type DependencyBaseline,
  type DependencyManifest,
  type DependencyPlan,
  type PatchRegistry,
} from "./model.ts";

const invalid = () =>
  new DependencyError({
    code: "invalid",
    message: "Invalid dependency manifest, report or patch registry.",
  });

export const decodeManifest = (value: unknown) =>
  Schema.decodeUnknownEffect(ManifestSchema)(value).pipe(Effect.mapError(invalid));
export const decodeRegistry = (value: unknown) =>
  Schema.decodeUnknownEffect(RegistrySchema)(value, { onExcessProperty: "error" }).pipe(
    Effect.mapError(invalid),
  );

/** Active dependency workarounds must have a supplied, exact-version Trigon source. */
export const patchPolicy = Effect.fnUntraced(function* (
  manifest: DependencyManifest,
  registry: PatchRegistry,
) {
  if (
    Object.keys(manifest.dependencies).length + Object.keys(manifest.devDependencies).length >
      dependencyLimits.packages ||
    Object.keys(manifest.dependencies).some((name) => name in manifest.devDependencies)
  )
    return yield* invalid();
  const identities = new Set<string>();
  const paths = new Set<string>();
  for (const fix of registry.fixes) {
    if (identities.has(fix.id)) return yield* invalid();
    identities.add(fix.id);
    for (const file of fix.files) {
      if (
        paths.has(file.artifactPath) ||
        !(
          file.artifactPath.startsWith("app/dependencies/trigon/") ||
          file.artifactPath.startsWith("patches/trigon/")
        )
      )
        return yield* invalid();
      paths.add(file.artifactPath);
    }
    for (const item of fix.packages) {
      const current = manifest.dependencies[item.name] ?? manifest.devDependencies[item.name];
      if (current === undefined || !item.versions.includes(current)) {
        return yield* new DependencyError({
          code: "blocked",
          message: `ASK: ${fix.id} has no supplied Trigon coverage for the current ${item.name} pin.`,
        });
      }
    }
  }
  if (paths.size > dependencyLimits.files) return yield* invalid();
  for (const [selector, path] of Object.entries(manifest.aube?.patchedDependencies ?? {})) {
    const split = selector.lastIndexOf("@");
    const name = selector.slice(0, split);
    const version = selector.slice(split + 1);
    const fix = registry.fixes.find(
      (candidate) =>
        candidate.kind === "package-patch" &&
        candidate.packages.some((item) => item.name === name && item.versions.includes(version)) &&
        candidate.files.some((file) => file.artifactPath === path),
    );
    const current = manifest.dependencies[name] ?? manifest.devDependencies[name];
    if (fix === undefined || (current !== undefined && current !== version)) {
      return yield* new DependencyError({
        code: "blocked",
        message:
          "ASK: an active dependency patch lacks exact supplied Trigon provenance or its package pin changed.",
      });
    }
  }
  return { fixes: registry.fixes.length, files: paths.size };
});

export const buildDependencyPlan = Effect.fnUntraced(function* (input: {
  readonly manifest: unknown;
  readonly registry: unknown;
  readonly report: unknown;
  readonly status: number;
  readonly baseline: DependencyBaseline;
}): Effect.fn.Return<DependencyPlan, DependencyError> {
  const manifest = yield* decodeManifest(input.manifest);
  const registry = yield* decodeRegistry(input.registry);
  yield* patchPolicy(manifest, registry);
  const report = yield* Schema.decodeUnknownEffect(OutdatedSchema)(input.report, {
    onExcessProperty: "error",
  }).pipe(Effect.mapError(invalid));
  if (
    (input.status !== 0 && input.status !== 1) ||
    (input.status === 1 && Object.keys(report).length === 0)
  )
    return yield* invalid();
  const packages =
    Object.keys(manifest.dependencies).length + Object.keys(manifest.devDependencies).length;
  if (
    packages > dependencyLimits.packages ||
    Object.keys(report).length > dependencyLimits.packages
  )
    return yield* invalid();
  for (const name of Object.keys(manifest.dependencies))
    if (name in manifest.devDependencies) return yield* invalid();
  const upgrades: DependencyPlan["upgrades"][number][] = [];
  const blocked: DependencyPlan["blocked"][number][] = [];
  for (const [name, item] of Object.entries(report).sort(([a], [b]) => a.localeCompare(b))) {
    if (manifest[item.dependencyType][name] !== item.current)
      return yield* new DependencyError({
        code: "conflict",
        message: "The Aube report does not match current exact dependency pins.",
      });
    if (item.latest === item.current) continue;
    const unsupported = registry.fixes.some((fix) =>
      fix.packages.some((entry) => entry.name === name && !entry.versions.includes(item.latest)),
    );
    const patched = Object.keys(manifest.aube?.patchedDependencies ?? {}).some(
      (key) => key === `${name}@${item.current}`,
    );
    const stackChanged =
      (name === "effect" && !item.latest.startsWith("4.")) ||
      (name === "@typescript/native-preview" && !item.latest.startsWith("7."));
    if (unsupported || patched || stackChanged) {
      blocked.push({
        package: name,
        reason: stackChanged
          ? "Target leaves the adopted TS7/Effect 4 stack."
          : "Target requires a reviewed compatible Trigon fix and exact patch selector.",
        action: "ask-user-for-trigon-fix",
      });
    } else
      upgrades.push({
        name,
        current: item.current,
        target: item.latest,
        group: item.dependencyType,
      });
  }
  return {
    format: "teamagent-dependency-plan-v1",
    baseline: input.baseline,
    sourceRevision: registry.sourceRevision,
    reportStatus: input.status,
    report,
    upgrades,
    blocked,
    automaticRepair: false,
    provider: "aube-eligible-report",
  };
});

/** Only validated package identifiers and exact versions become command arguments. */
export function dependencyCommands(plan: DependencyPlan): readonly (readonly string[])[] {
  if (plan.blocked.length !== 0) return [];
  const runtime = plan.upgrades
    .filter((item) => item.group === "dependencies")
    .map((item) => `${item.name}@${item.target}`);
  const development = plan.upgrades
    .filter((item) => item.group === "devDependencies")
    .map((item) => `${item.name}@${item.target}`);
  return [
    ...(runtime.length === 0 ? [] : [["add", "--save-exact", ...runtime]]),
    ...(development.length === 0 ? [] : [["add", "--save-exact", "--save-dev", ...development]]),
  ];
}
