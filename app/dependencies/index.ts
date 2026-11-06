#!/usr/bin/env bun
import { cli } from "cleye";
import { createConsola } from "consola";
import { Effect } from "effect";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { version } from "../../package.json";
import { DependencyError } from "./model.ts";
import { createDependencyRuntime } from "./runtime.ts";

const argv = cli({
  name: "teamagent deps",
  parameters: ["[action]"],
  strictFlags: true,
  flags: {
    version: { type: Boolean, alias: "V", description: "Show the shared Teamagent version" },
    report: { type: String, description: "Saved Aube outdated JSON for an offline plan" },
    output: {
      type: String,
      description: "New output path below .cache/dependencies/; never overwritten",
    },
    plan: { type: String, description: "Reviewed exact dependency plan to apply" },
    source: {
      type: String,
      description: "Explicit local Patches Git checkout for candidate refresh",
    },
    revision: {
      type: String,
      description: "Full immutable Patches commit SHA for candidate refresh",
    },
  },
  help: {
    version,
    description:
      "Dependency maintenance: check | plan | discover | apply | source-refresh. Check/plan are offline. Discover contacts the configured Aube registry. Apply changes dependencies through Aube and runs review:check. Missing/incompatible Patches fixes block and require asking the user; no automatic repair, trust changes, agent dispatch or retry. Refresh only stages a source candidate. An uncertain apply retains its lease and receipts for reconciliation.",
    examples: [
      "teamagent deps check",
      "teamagent deps plan --report .cache/dependencies/outdated.json --output .cache/dependencies/plan.json",
      "teamagent deps discover --output .cache/dependencies/plan.json",
      "teamagent deps apply --plan .cache/dependencies/plan.json",
      "teamagent deps source-refresh --source ../x-patches --revision FULL_COMMIT_SHA --output .cache/dependencies/candidates/review",
    ],
  },
});

const reporter = createConsola({
  reporters: [
    {
      log: (entry) => process.stderr.write(`${entry.type}: ${entry.args.map(String).join(" ")}\n`),
    },
  ],
});
const fromCwd = (path: string | undefined): string | undefined =>
  path === undefined ? undefined : resolve(process.cwd(), path);
const reject = (message: string): never => {
  throw new DependencyError({ code: "invalid", message });
};

try {
  if (argv.flags.version) process.stdout.write(`${version}\n`);
  else {
    if (argv._.length > 1 || argv._["--"].length !== 0) reject("Unexpected dependency arguments.");
    const action = argv._.action;
    const permitted: Readonly<Record<string, readonly string[]>> = {
      check: [],
      plan: ["report", "output"],
      discover: ["output"],
      apply: ["plan"],
      "source-refresh": ["source", "revision", "output"],
    };
    if (action === undefined) argv.showHelp();
    else {
      const allowed = permitted[action] ?? reject("Unknown dependency action.");
      for (const [name, value] of Object.entries(argv.flags))
        if (value !== undefined && name !== "help" && name !== "version" && !allowed.includes(name))
          reject("A flag is not supported by this dependency action.");
      const root = resolve(dirname(fileURLToPath(import.meta.url)), "../..");
      const runtime = createDependencyRuntime({ root });
      let operation: Effect.Effect<unknown, DependencyError> = Effect.fail(
        new DependencyError({ code: "invalid", message: "Unknown dependency action." }),
      );
      switch (action) {
        case "check":
          operation = runtime.check();
          break;
        case "plan":
          operation = runtime.plan(fromCwd(argv.flags.report), fromCwd(argv.flags.output));
          break;
        case "discover":
          operation = runtime.discover(
            fromCwd(argv.flags.output) ?? reject("Discover requires --output."),
          );
          break;
        case "apply":
          operation = runtime.apply(fromCwd(argv.flags.plan) ?? reject("Apply requires --plan."));
          break;
        case "source-refresh":
          operation = runtime.sourceRefresh(
            fromCwd(argv.flags.source) ?? reject("Refresh requires --source."),
            argv.flags.revision ?? reject("Refresh requires --revision."),
            fromCwd(argv.flags.output) ?? reject("Refresh requires --output."),
          );
          break;
        default:
          reject("Unknown dependency action.");
      }
      await Effect.runPromise(
        operation.pipe(
          Effect.match({
            onFailure: (error) => {
              reporter.error(`${error.code}: ${error.message}`);
              process.exitCode = 1;
            },
            onSuccess: (value) => {
              process.stdout.write(`${JSON.stringify(value, null, 2)}\n`);
            },
          }),
        ),
      );
    }
  }
} catch (error) {
  reporter.error(
    error instanceof DependencyError
      ? `${error.code}: ${error.message}`
      : "invalid: Dependency options could not be processed.",
  );
  process.exitCode = 1;
}
