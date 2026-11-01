import { createReadStream } from "node:fs";
import { stat } from "node:fs/promises";
import { Schema } from "effect";
import { slug, type RecordInput } from "./archive.ts";
import { maximumInputBytes, readBoundedLines } from "./input.ts";

export const StopInput = Schema.Struct({
  hook_event_name: Schema.Literals(["Stop", "SubagentStop"]),
  session_id: Schema.NonEmptyString,
  turn_id: Schema.NonEmptyString,
  transcript_path: Schema.NullOr(Schema.String),
  agent_transcript_path: Schema.optional(Schema.NullOr(Schema.String)),
  agent_id: Schema.optional(Schema.String),
  last_assistant_message: Schema.NullOr(Schema.String),
  description: Schema.optional(Schema.String),
  redactions: Schema.optional(Schema.Array(Schema.NonEmptyString)),
});
export type StopInput = typeof StopInput.Type;
const Envelope = Schema.Struct({ type: Schema.String, payload: Schema.Unknown });
const Context = Schema.Struct({
  turn_id: Schema.String,
  model: Schema.optional(Schema.String),
  effort: Schema.optional(Schema.String),
  cwd: Schema.optional(Schema.String),
});
const Message = Schema.Struct({
  type: Schema.String,
  role: Schema.optional(Schema.String),
  phase: Schema.optional(Schema.NullOr(Schema.String)),
  content: Schema.optional(Schema.Array(Schema.Unknown)),
});
const Text = Schema.Struct({ type: Schema.String, text: Schema.optional(Schema.String) });
const Session = Schema.Struct({ id: Schema.String });

/** Select public user/commentary/final messages, never command scripts, tools, patches, or reasoning. */
export async function fromTranscript(value: StopInput): Promise<RecordInput> {
  const input = Schema.decodeUnknownSync(StopInput)(value);
  const subagent = input.hook_event_name === "SubagentStop";
  const file = subagent ? input.agent_transcript_path : input.transcript_path;
  if (!file) throw new Error("No transcript supplied; use the explicit RecordInput fallback");
  const metadata = await stat(file);
  if (!metadata.isFile()) throw new Error("Transcript must be a regular file");
  if (metadata.size > 128 * 1024 * 1024)
    throw new Error("Transcript exceeds 128 MiB; use an explicit public record");
  let active = false;
  let found = false;
  let model = "unknown";
  let reasoning = "unknown";
  let previousRoot: string | undefined;
  let contextId = "";
  let sessionId = input.session_id;
  let response = "";
  const prompts: string[] = [];
  const log: string[] = [];
  const explicitResponse = input.last_assistant_message?.trim()
    ? input.last_assistant_message
    : undefined;
  let publicBytes = Buffer.byteLength(explicitResponse ?? "");
  const retain = (text: string, separatorBytes = 0): void => {
    const bytes = Buffer.byteLength(text) + separatorBytes;
    if (bytes > maximumInputBytes - publicBytes)
      throw new Error("Selected public transcript exceeds 8 MiB; use an explicit public record");
    publicBytes += bytes;
  };
  if (publicBytes > maximumInputBytes)
    throw new Error("Selected public transcript exceeds 8 MiB; use an explicit public record");
  const stream = createReadStream(file, { highWaterMark: 64 * 1024 });
  const lines = readBoundedLines(stream, {
    bytes: 128 * 1024 * 1024,
    lineBytes: maximumInputBytes,
  });
  try {
    for await (const line of lines) {
      if (!line.trim()) continue;
      const envelope = Schema.decodeUnknownSync(Schema.fromJsonString(Envelope))(line);
      if (envelope.type === "session_meta") {
        const session = Schema.decodeUnknownSync(Session)(envelope.payload);
        if (!subagent && session.id !== input.session_id)
          throw new Error("Transcript session does not match hook session");
        sessionId = session.id;
      } else if (envelope.type === "turn_context") {
        const context = Schema.decodeUnknownSync(Context)(envelope.payload);
        if (subagent && context.turn_id !== contextId) {
          prompts.length = 0;
          log.length = 0;
          response = "";
          publicBytes = Buffer.byteLength(explicitResponse ?? "");
          model = "unknown";
          reasoning = "unknown";
        }
        contextId = context.turn_id;
        active = subagent || context.turn_id === input.turn_id;
        if (active) {
          found = true;
          model = context.model ?? model;
          reasoning = context.effort ?? reasoning;
          previousRoot = context.cwd;
        }
      } else if (active && envelope.type === "response_item") {
        const message = Schema.decodeUnknownSync(Message)(envelope.payload);
        if (message.type !== "message" || !message.content) continue;
        if (
          message.role !== "user" &&
          !(
            message.role === "assistant" &&
            ["commentary", "final_answer", "final"].includes(message.phase ?? "")
          )
        )
          continue;
        const parts: string[] = [];
        let messageBytes = 0;
        for (const part of message.content) {
          const decoded = Schema.decodeUnknownSync(Text)(part);
          if (!["input_text", "output_text", "text"].includes(decoded.type) || !decoded.text)
            continue;
          messageBytes += Buffer.byteLength(decoded.text) + (parts.length ? 2 : 0);
          if (messageBytes > maximumInputBytes)
            throw new Error(
              "Selected public transcript exceeds 8 MiB; use an explicit public record",
            );
          parts.push(decoded.text);
        }
        const text = parts.join("\n\n");
        if (!text.trim()) continue;
        if (message.role === "user") {
          if (
            !/^(?:\s*<environment_context>|\s*<external_codex_apps_open_page>|\s*# AGENTS\.md)/.test(
              text,
            )
          ) {
            retain(text, prompts.length ? 7 : 0);
            prompts.push(text);
          }
        } else if (message.phase === "commentary") {
          retain(text);
          log.push(text);
        } else if (explicitResponse === undefined) {
          publicBytes -= Buffer.byteLength(response);
          retain(text);
          response = text;
        }
      }
    }
  } finally {
    stream.destroy();
  }
  response = explicitResponse ?? response;
  if (subagent && found && !prompts.length) {
    const missingPrompt =
      "[Delegated prompt unavailable in native subagent transcript; consult the parent conversation.]";
    retain(missingPrompt);
    prompts.push(missingPrompt);
  }
  if (!found || !prompts.length || !response.trim())
    throw new Error("Transcript lacks matching turn, prompt or final response; nothing archived");
  // Forked native transcripts can retain the parent's session_meta. Prefer the
  // host-supplied child identity over mislabeling the parent as the child session.
  if (subagent && sessionId === input.session_id && input.agent_id) sessionId = input.agent_id;
  return {
    sessionId,
    turnId: subagent ? contextId : input.turn_id,
    ...(subagent ? { parentSessionId: input.session_id, parentTurnId: input.turn_id } : {}),
    agent: input.agent_id ? `codex-${slug(input.agent_id)}` : "codex",
    model,
    reasoning,
    date: new Date().toISOString(),
    description: input.description ?? slug(prompts[0]?.split("\n")[0] ?? "response"),
    prompt: prompts.join("\n\n---\n\n"),
    response,
    processingLog: log,
    ...(previousRoot ? { previousRoot } : {}),
    ...(input.redactions ? { redactions: input.redactions } : {}),
  };
}
