import { runTool } from "./tools.ts";

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
