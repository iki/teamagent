// Internal Bun hook/CLI adapter: JSON stdin and one JSON success response. Never execute transcript content.
import { fileURLToPath } from "node:url";
import { Schema } from "effect";
import { archive, RecordInput } from "./archive.ts";
import { fromTranscript, StopInput } from "./transcript.ts";
import { readInput } from "./input.ts";

const root = fileURLToPath(new URL("../../", import.meta.url));
try {
  if (!process.versions.bun) throw new Error("Conversation recording requires Bun");
  if (process.argv.length > 2) throw new Error("This adapter accepts JSON stdin only");
  const text = await readInput(process.stdin);
  const input = Schema.decodeUnknownSync(
    Schema.fromJsonString(Schema.Union([RecordInput, StopInput])),
  )(text);
  const record = "hook_event_name" in input ? await fromTranscript(input) : input;
  const file = await archive(root, record);
  process.stdout.write(
    JSON.stringify({ systemMessage: `Conversation archived: spec/.conversations/${file}` }),
  );
} catch {
  // Never print a schema error containing the untrusted input. Exit 1 does not request another Stop turn.
  process.stderr.write(
    "Conversation archive failed. Check JSON input, the supplied transcript, and spec/.conversations/.write-lock; no input content was printed.\n",
  );
  process.exitCode = 1;
}
