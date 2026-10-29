import { cli } from "cleye";
import { createConsola } from "consola";
import { Effect } from "effect";
import { version } from "../../package.json";
import { inspectModuleLayout } from "@/lint";
import { inspectTextExports } from "../research/text-reports.ts";
import { createDependencyRuntime } from "../dependencies/runtime.ts";
import { inspectLineEndings } from "./line-endings.ts";
import { invalidateCachedTask } from "./input-cache.ts";
import { runUnitTests } from "./test-groups.ts";
import { root, runTool } from "./tools.ts";
import { verificationEnvironment } from "./tool-prerequisites.ts";
import {
  cachedVerification,
  reviewSourceIdentity,
  verificationPrerequisites,
  verificationTask,
} from "./verification-cache.ts";

const logger = createConsola({ stdout: process.stderr, stderr: process.stderr });
const argv = cli({
  name: "check",
  parameters: ["[mode]"],
  strictFlags: true,
  flags: {
    version: { type: Boolean, alias: "V", description: "Show the shared Teamagent version" },
    format: {
      type: Boolean,
      description: "Format maintained sources before checking (legacy step mode)",
    },
    forceFresh: {
      type: Boolean,
      description: "Execute every verification group even when a cooperative receipt matches",
    },
  },
  help: {
    version,
    description:
      "Review uses cooperative source receipts. Installed prerequisites and raw LF/export integrity remain live. Reuse never grants publication approval.",
  },
});
if (argv.flags.version) {
  process.stdout.write(`${version}\n`);
  process.exit(0);
}
if (argv._.mode !== undefined && argv._.mode !== "review" && argv._.mode !== "step")
  throw new Error("Expected step or review");
const forceFresh = argv.flags.forceFresh ?? false;

try {
  const environment = await verificationEnvironment(root);
  if (environment.PATH !== undefined) process.env.PATH = environment.PATH;
  await Effect.runPromise(createDependencyRuntime({ root }).check());
  if (argv.flags.format || argv._.mode === "step") {
    if (runTool("format", []) !== 0) throw new Error("Formatting failed");
  }
  const prerequisites = await verificationPrerequisites(root);
  const sourceBefore = await reviewSourceIdentity(root, prerequisites);
  const run = async (
    id: "format" | "types" | "lint" | "tests",
    action: () => Promise<void>,
  ): Promise<void> => {
    const result = await cachedVerification(root, id, prerequisites, action, forceFresh);
    logger.info(
      `${id}: ${result.hit ? "reused matching cooperative receipt" : "executed and verified"}`,
    );
  };
  const checkedTool = (tool: "format" | "typecheck" | "lint", args: readonly string[]): void => {
    if (runTool(tool, args) !== 0) throw new Error(`${tool} failed`);
  };
  await run("format", async () => {
    checkedTool("format", ["--check"]);
  });
  const violations = await Effect.runPromise(inspectModuleLayout(root));
  if (violations.length) throw new Error(violations.join("\n"));
  await run("types", async () => {
    for (const project of [
      "tsconfig.json",
      "tsconfig.lib.json",
      "tsconfig.tools.json",
      "app/web/tsconfig.json",
    ])
      checkedTool("typecheck", ["--noEmit", "--project", project]);
  });
  await run("lint", async () => {
    checkedTool("lint", ["--type-aware", "--deny-warnings"]);
  });
  await run("tests", () => runUnitTests(root));
  try {
    if (JSON.stringify(await verificationPrerequisites(root)) !== JSON.stringify(prerequisites))
      throw new Error(
        "Installed prerequisites or verification environment changed during the gate",
      );
  } catch (error) {
    for (const id of ["format", "types", "lint", "tests"] as const)
      await invalidateCachedTask(root, verificationTask(id, prerequisites));
    throw error;
  }
  logger.info("Checking live LF text and export integrity");
  const inspection = inspectLineEndings(root);
  const exports = await inspectTextExports(root);
  logger.info(
    `LF inventory: ${inspection.textFiles} text, ${inspection.opaqueFiles} opaque (${inspection.verifiedOpaqueInputs} hash-verified historical inputs), ${inspection.retainedOriginals} retained originals, ${inspection.missingOrLinked} missing/linked; ${exports.exports} text exports / ${exports.files} files verified`,
  );
  if (inspection.violations.length)
    throw new Error(
      `${inspection.violations.slice(0, 100).join("\n")}\n${inspection.violations.length > 100 ? `${inspection.violations.length - 100} additional LF violations\n` : ""}`,
    );
  if ((await reviewSourceIdentity(root, prerequisites)).key !== sourceBefore.key)
    throw new Error("Verification source inputs changed across the complete gate");
} catch (error) {
  logger.error(error instanceof Error ? error.message : "Verification failed");
  process.exitCode = 1;
}
