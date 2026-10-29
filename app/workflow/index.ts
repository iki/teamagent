import { fileURLToPath } from "node:url";
import { cli } from "cleye";
import { Schema } from "effect";
import { readInput } from "../conversations/input.ts";
import { workflow } from "./workflow.ts";
import manifest from "../../package.json" with { type: "json" };
export { workflow } from "./workflow.ts";

if (import.meta.main) {
  const args = cli({
    name: "teamagent-task",
    strictFlags: true,
    flags: { version: { type: Boolean, alias: "V", description: "Show version" } },
    help: {
      description:
        "Bounded JSON task workflow on stdin: begin, status, checkpoint, revise-checkpoint, verify, prepare, publish, cancel. Explicit checkpoint revision preserves the frozen public record and requires fresh verification. Signed commits and exact approved-upstream publication; no automatic retry after uncertain actions. Policy: .workflow.json. No credentials in requests.",
      version: manifest.version,
      examples: [
        'JSON stdin: {"operation":"begin","sessionId":"session","taskId":"task"}',
        'JSON stdin: {"operation":"verify","sessionId":"session","taskId":"task","phase":"review"}',
        "Checkpoint requires a public record, a conventional message and explicit relative files. See spec/workflow.md for the complete schema and recovery rules.",
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
    const result = await workflow(fileURLToPath(new URL("../../", import.meta.url)), input);
    process.stdout.write(JSON.stringify(result) + "\n");
  } catch {
    process.stdout.write(
      JSON.stringify({
        ok: false,
        issue:
          "Workflow failed; inspect task state and safe diagnostics. Input and secrets were not printed.",
      }) + "\n",
    );
    process.exitCode = 1;
  }
}
