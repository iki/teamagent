import { isTool, runTool } from "./tools.ts";

const tool = process.argv[2];
if (!isTool(tool)) throw new Error("Expected one of: format, typecheck, lint");
process.exitCode = runTool(tool, process.argv.slice(3));
