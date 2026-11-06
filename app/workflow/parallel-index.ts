import { fileURLToPath } from "node:url";
import { cli } from "cleye";
import { Schema } from "effect";
import manifest from "../../package.json" with { type: "json" };
import { readInput } from "../conversations/input.ts";
import { parallelWorkflow } from "./parallel.ts";
export { parallelWorkflow } from "./parallel.ts";

if (import.meta.main) {
  const args = cli({
    name: "teamagent-parallel",
    strictFlags: true,
    flags: { version: { type: Boolean, alias: "V", description: "Show version" } },
    help: {
      version: manifest.version,
      description:
        "Bounded JSON parallel workflow on stdin: start, status, install, submit, prepare, integrate, reconcile. One final signed commit per task. Worktrees stay under .cache/worktrees; local or reviewed PR mode comes from .workflow.json. Prepare a rebased candidate before cold verification. No force push, automatic retry, cleanup or hook trust.",
      examples: [
        'JSON stdin: {"operation":"start","sessionId":"session","taskId":"task","name":"feature"}',
        'JSON stdin: {"operation":"prepare","sessionId":"session","taskId":"task"}',
        'JSON stdin: {"operation":"integrate","sessionId":"session","taskId":"task"}',
      ],
    },
  });
  if (args.flags.version) {
    process.stdout.write(manifest.version + "\n");
    process.exit(0);
  }
  try {
    if (!process.versions.bun || process.argv.length > 2)
      throw new Error("Bun and JSON stdin are required");
    const input = Schema.decodeUnknownSync(Schema.fromJsonString(Schema.Unknown))(
      await readInput(process.stdin),
    );
    const result = await parallelWorkflow(fileURLToPath(new URL("../../", import.meta.url)), input);
    process.stdout.write(JSON.stringify(result) + "\n");
  } catch {
    process.stdout.write(
      JSON.stringify({
        ok: false,
        issue:
          "Parallel workflow stopped. Inspect the registered task and retained checkout; input and secrets were not printed.",
      }) + "\n",
    );
    process.exitCode = 1;
  }
}
