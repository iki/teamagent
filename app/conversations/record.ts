// Internal Bun hook/CLI adapter: JSON stdin and one JSON success response. Never execute transcript content.
import { fileURLToPath } from "node:url";
import { Schema } from "effect";
import { archive, RecordInput } from "./archive.ts";
import { fromTranscript, StopInput } from "./transcript.ts";

const root = fileURLToPath(new URL("../../", import.meta.url));
try {
  let text = "";
  process.stdin.setEncoding("utf8");
  for await (const chunk of process.stdin) {
    text += Schema.decodeUnknownSync(Schema.String)(chunk);
    if (Buffer.byteLength(text) > 8 * 1024 * 1024) throw new Error("Input limit exceeded");
  }
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
