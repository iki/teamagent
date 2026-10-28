import { spawnSync } from "node:child_process";
import { Effect } from "effect";
import { inspectModuleLayout } from "@/lint";
import { inspectTextExports } from "../research/text-reports.ts";
import { inspectLineEndings } from "./line-endings.ts";
import { root, runTool, type Tool } from "./tools.ts";

const args = process.argv.slice(2);
if (args.some((arg) => arg !== "--format")) throw new Error("Usage: check [--format]");

const tasks: ReadonlyArray<readonly [Tool, readonly string[]]> = [
  ["format", args.includes("--format") ? [] : ["--check"]],
  ["lint", ["--type-aware", "--deny-warnings"]],
];

for (const [tool, parameters] of tasks) {
  if (tool === "lint") {
    const violations = await Effect.runPromise(inspectModuleLayout(root));
    if (violations.length) {
      process.stderr.write(`${violations.join("\n")}\n`);
      process.exitCode = 1;
      break;
    }
    for (const project of [
      "tsconfig.json",
      "tsconfig.lib.json",
      "tsconfig.tools.json",
      "app/web/tsconfig.json",
    ]) {
      const status = runTool("typecheck", ["--noEmit", "--project", project]);
      if (status !== 0) {
        process.exitCode = status;
        break;
      }
    }
    if (process.exitCode) break;
  }
  process.stderr.write(`Checking ${tool}\n`);
  const status = runTool(tool, parameters);
  if (status !== 0) {
    process.exitCode = status;
    break;
  }
}

if (!process.exitCode) {
  process.stderr.write("Checking tests\n");
  const result = spawnSync(process.execPath, ["test", "--timeout", "120000"], {
    cwd: root,
    stdio: "inherit",
    shell: false,
    windowsHide: true,
    timeout: 240_000,
  });
  if (result.error) throw result.error;
  process.exitCode = result.status ?? 1;
}

if (!process.exitCode) {
  process.stderr.write("Checking LF text\n");
  const inspection = inspectLineEndings(root);
  const exports = await inspectTextExports(root);
  process.stderr.write(
    `LF inventory: ${inspection.textFiles} text, ${inspection.opaqueFiles} opaque (${inspection.verifiedOpaqueInputs} hash-verified historical inputs), ${inspection.retainedOriginals} retained originals, ${inspection.missingOrLinked} missing/linked; ${exports.exports} text exports / ${exports.files} files verified\n`,
  );
  if (inspection.violations.length) {
    process.stderr.write(`${inspection.violations.slice(0, 100).join("\n")}\n`);
    if (inspection.violations.length > 100)
      process.stderr.write(`${inspection.violations.length - 100} additional LF violations\n`);
    process.exitCode = 1;
  }
}
