import { lstatSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { Effect, Schema } from "effect";

export interface ModuleDefinition {
  readonly name: string;
  readonly dependencies: readonly string[];
  readonly portable: boolean;
}

/** Explicit upper bound on cross-module dependencies; unused edges grant no runtime authority. */
export const moduleDefinitions: readonly ModuleDefinition[] = [
  { name: "agents", dependencies: [], portable: true },
  { name: "artifacts", dependencies: [], portable: true },
  { name: "workspaces", dependencies: [], portable: true },
  { name: "memory", dependencies: [], portable: true },
  { name: "integrations", dependencies: [], portable: true },
  { name: "media", dependencies: [], portable: true },
  { name: "channels", dependencies: [], portable: true },
  { name: "tasks", dependencies: ["agents", "artifacts", "workspaces"], portable: true },
  {
    name: "harness",
    dependencies: ["agents", "artifacts", "tasks", "workspaces"],
    portable: true,
  },
  { name: "lint", dependencies: [], portable: false },
];

export function validateModuleGraph(definitions: readonly ModuleDefinition[]): readonly string[] {
  const issues: string[] = [];
  const names = new Set<string>();
  for (const module of definitions) {
    if (!/^[a-z][a-z0-9-]*$/.test(module.name)) issues.push(`Invalid module name: ${module.name}.`);
    if (names.has(module.name)) issues.push(`Duplicate module: ${module.name}.`);
    names.add(module.name);
  }
  for (const module of definitions) {
    const dependencies = new Set<string>();
    for (const dependency of module.dependencies) {
      if (!names.has(dependency))
        issues.push(`${module.name} depends on unknown module ${dependency}.`);
      if (dependencies.has(dependency))
        issues.push(`${module.name} repeats dependency ${dependency}.`);
      if (module.portable && definitions.some((item) => item.name === dependency && !item.portable))
        issues.push(`Portable module ${module.name} depends on host module ${dependency}.`);
      dependencies.add(dependency);
    }
  }
  const completed = new Set<string>();
  const visit = (name: string, ancestors: readonly string[]): void => {
    if (ancestors.includes(name)) {
      issues.push(`Module dependency cycle: ${[...ancestors, name].join(" -> ")}.`);
      return;
    }
    if (completed.has(name)) return;
    const module = definitions.find((item) => item.name === name);
    if (module !== undefined)
      for (const dependency of module.dependencies) visit(dependency, [...ancestors, name]);
    completed.add(name);
  };
  for (const name of names) visit(name, []);
  return issues;
}

export class ModuleInspectionError extends Schema.TaggedError<ModuleInspectionError>()(
  "ModuleInspectionError",
  { message: Schema.String },
) {}

/** Complements AST rules: a linter cannot visit an absent entry point. */
export const inspectModuleLayout = (
  root: string,
  definitions: readonly ModuleDefinition[] = moduleDefinitions,
): Effect.Effect<readonly string[], ModuleInspectionError> =>
  Effect.try({
    try: () => {
      const issues = [...validateModuleGraph(definitions)];
      const libraryRoot = join(root, "lib");
      const directories = readdirSync(libraryRoot, { withFileTypes: true });
      for (const entry of directories) {
        if (entry.isSymbolicLink())
          issues.push(`Module path lib/${entry.name} must not be a link.`);
        if (entry.isDirectory() && !definitions.some((module) => module.name === entry.name))
          issues.push(`Register module lib/${entry.name} and its dependencies.`);
      }
      for (const module of definitions) {
        for (const entry of ["index.ts", "cli.ts"]) {
          const relative = `lib/${module.name}/${entry}`;
          try {
            const stat = lstatSync(join(root, relative));
            if (!stat.isFile() || stat.isSymbolicLink())
              issues.push(`${relative} must be a regular source file.`);
          } catch {
            issues.push(`Missing or inaccessible required entry ${relative}.`);
          }
        }
      }
      return issues;
    },
    catch: () => new ModuleInspectionError({ message: "Could not inspect the module directory." }),
  });
