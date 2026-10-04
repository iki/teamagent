import { spawnSync } from "node:child_process";
import { root, runTool, type Tool } from "./tools.ts";

const args = process.argv.slice(2);
if (args.some((arg) => arg !== "--format")) throw new Error("Usage: check [--format]");

const tasks: ReadonlyArray<readonly [Tool, readonly string[]]> = [
  ["format", args.includes("--format") ? [] : ["--check"]],
  ["typecheck", ["--noEmit"]],
  ["lint", ["--type-aware", "--deny-warnings"]],
];

for (const [tool, parameters] of tasks) {
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
