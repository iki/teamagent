import { runTool } from "./tools.ts";

for (const project of [
  "tsconfig.json",
  "tsconfig.lib.json",
  "tsconfig.tools.json",
  "app/web/tsconfig.json",
]) {
  const status = await runTool("typecheck", ["--noEmit", "--project", project]);
  if (status !== 0) {
    process.exitCode = status;
    break;
  }
}
