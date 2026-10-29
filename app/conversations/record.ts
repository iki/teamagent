// Internal Bun hook/CLI adapter: JSON stdin and one JSON success response. Never execute transcript content.
import { fileURLToPath } from "node:url";
import { Schema } from "effect";
import { archive, RecordInput } from "./archive.ts";
import { fromTranscript, StopInput } from "./transcript.ts";
import { readInput } from "./input.ts";
import { activeTask } from "../workflow/workflow.ts";
import { changedPaths, fileHash, gitAt } from "../workflow/git.ts";

const root = fileURLToPath(new URL("../../", import.meta.url));
try {
  if (!process.versions.bun) throw new Error("Conversation recording requires Bun");
  if (process.argv.length > 2) throw new Error("This adapter accepts JSON stdin only");
  const text = await readInput(process.stdin);
  const input = Schema.decodeUnknownSync(
    Schema.fromJsonString(Schema.Union([RecordInput, StopInput])),
  )(text);
  let record;
  if ("hook_event_name" in input) {
    if (input.hook_event_name === "SubagentStop") {
      process.stdout.write(
        JSON.stringify({
          systemMessage:
            "Subagent progress remains with the root task; no separate task archive or publication was created.",
        }) + "\n",
      );
      process.exit(0);
    }
    const task = await activeTask(root, input.session_id);
    if (!task) {
      process.stdout.write(
        JSON.stringify({
          systemMessage:
            "No active workflow task; no per-response archive or publication was fabricated. Use the explicit task checkpoint.",
        }) + "\n",
      );
      process.exit(0);
    }
    if (task.state !== "open") {
      process.stdout.write(
        JSON.stringify({
          systemMessage:
            "The task checkpoint is frozen or closed. This later response was not appended; publication outcomes belong in its receipt.",
        }) + "\n",
      );
      process.exit(0);
    }
    let changed = false;
    for (const path of await changedPaths(gitAt(root)))
      if (
        !path.startsWith("spec/.conversations/") &&
        (await fileHash(root, path)) !== task.snapshot.changes[path]
      )
        changed = true;
    if (!changed) {
      process.stdout.write(
        JSON.stringify({
          systemMessage: "No task-owned source changes; no conversation record created.",
        }) + "\n",
      );
      process.exit(0);
    }
    record = { ...(await fromTranscript(input)), taskId: task.taskId };
  } else {
    if (!input.taskId) throw new Error("Explicit public input requires a logical taskId");
    record = input;
  }
  const file = await archive(root, record);
  process.stdout.write(
    JSON.stringify({ systemMessage: `Conversation archived: spec/.conversations/${file}` }) + "\n",
  );
} catch {
  // Never print a schema error containing the untrusted input. Exit 1 does not request another Stop turn.
  process.stderr.write(
    "Conversation archive failed. Check JSON input, the supplied transcript, and spec/.conversations/.write-lock; no input content was printed.\n",
  );
  process.exitCode = 1;
}
