import { mkdtemp } from "./temporary.ts";
import { test } from "node:test";
import assert from "node:assert/strict";
import { mkdir, readFile, readdir, writeFile } from "node:fs/promises";
import { resolve, join } from "node:path";
import {
  archive,
  archiveTaskKey,
  freezeArchive,
  type RecordInput,
} from "../app/conversations/archive.ts";
import { relativeReferences } from "../app/conversations/paths.ts";
import { redact } from "../app/conversations/privacy.ts";
import { fromTranscript, type StopInput } from "../app/conversations/transcript.ts";

async function temporaryRoot(): Promise<string> {
  await mkdir(".cache/conversations", { recursive: true });
  return mkdtemp(resolve(".cache/conversations/test-"));
}
const record: RecordInput = {
  sessionId: "session",
  turnId: "turn",
  agent: "codex",
  model: "unknown",
  reasoning: "unknown",
  date: "2026-10-04T12:00:00Z",
  description: "Conversation logging",
  prompt: "Prompt",
  response: "Done.",
  processingLog: ["Ran checks."],
};

await test("conversation output and retry identity normalize CRLF and lone CR to LF", async () => {
  const root = await temporaryRoot();
  const file = await archive(root, {
    ...record,
    prompt: "first\r\nsecond\rthird",
    response: "done\r\nnext\rlast",
    processingLog: ["step one\r\nstep two\rstep three"],
  });
  const body = await readFile(join(root, "spec/.conversations", file), "utf8");
  assert.equal(body.includes("\r"), false);
  assert.ok(body.includes("first\nsecond\nthird"));
  assert.ok(body.includes("done\nnext\nlast"));
  assert.equal(
    await archive(root, {
      ...record,
      prompt: "first\nsecond\nthird",
      response: "done\nnext\nlast",
      processingLog: ["step one\nstep two\nstep three"],
    }),
    file,
  );
  assert.equal(await readFile(join(root, "spec/.conversations", file), "utf8"), body);
});

await test("retry identity preserves changed public prompts, progress and metadata with unchanged response", async () => {
  const root = await temporaryRoot();
  const file = await archive(root, record);
  const changed = {
    ...record,
    prompt: "Revised visible prompt",
    processingLog: ["Additional visible check"],
    model: "revised-model",
  };
  assert.equal(await archive(root, changed), file);
  const content = await readFile(join(root, "spec/.conversations", file), "utf8");
  assert.ok(content.includes("Revised visible prompt"));
  assert.ok(content.includes("Additional visible check"));
  assert.ok(content.includes("Model: revised-model"));
  await freezeArchive(root, changed);
  for (const update of [
    { prompt: "Another prompt" },
    { processingLog: ["Another check"] },
    { model: "other-model" },
  ])
    await assert.rejects(archive(root, { ...changed, ...update }), /checkpoint is frozen/);
});

await test("file references stay portable while URLs, relative paths, and slash commands stay intact", () => {
  const root = "C:/_/project";
  assert.equal(
    relativeReferences("[doc](C:/_/project/spec/runtime.md:12)", root),
    "[doc](../runtime.md:12)",
  );
  assert.equal(
    relativeReferences("[space](<C:/_/project/spec/two words.md>)", root),
    "[space](<../two words.md>)",
  );
  assert.equal(
    relativeReferences("`C:\\_\\former\\app\\file.ts`", root, "C:/_/former"),
    "`../../app/file.ts`",
  );
  assert.equal(relativeReferences("[doc](file:///C:/_/project/spec/a.md)", root), "[doc](../a.md)");
  assert.equal(relativeReferences("C:/_/other/file.c", root), "../../../other/file.c");
  const unchanged =
    "[source](https://example.com/docs/a) [local](../../app/a.ts) ../runtime.md app/a.ts Open `/hooks` or `/help`.";
  assert.equal(relativeReferences(unchanged, root), unchanged);
  assert.equal(
    relativeReferences("[doc](/repo/spec/a.md) `/repo/a b.ts`", "/repo"),
    "[doc](../a.md) `../../a b.ts`",
  );
  assert.equal(relativeReferences("D:/outside/a.ts", root), "external-file-a.ts");
  const routes =
    "Open `/api/tasks` and GET /api/status. [Tasks](/api/tasks) [Guide](/docs/guide.md)";
  assert.equal(relativeReferences(routes, root), routes);
  assert.equal(relativeReferences(routes, "/repo"), routes);
  assert.equal(
    relativeReferences("/repo/app/a.ts `/repo/app/b.ts` [file](/repo/spec/a.md)", "/repo"),
    "../../app/a.ts `../../app/b.ts` [file](../a.md)",
  );
  assert.equal(
    relativeReferences("[old](/former/app/a.ts)", "/repo", "/former"),
    "[old](../../app/a.ts)",
  );
});

await test("task naming is descriptive, concurrent, retry-safe, and preserves history", async () => {
  const root = await temporaryRoot();
  const folder = join(root, "spec/.conversations");
  await mkdir(folder, { recursive: true });
  const historical = "261001-9-historical.codex-unknown-unknown.md";
  await writeFile(join(folder, historical), "Historical text\n");
  const [first, second, retry] = await Promise.all([
    archive(root, record),
    archive(root, { ...record, turnId: "other" }),
    archive(root, record),
  ]);
  assert.equal(first, retry);
  assert.notEqual(first, second);
  assert.match(first, /^261004-conversation-logging(?:-[a-f0-9]{12})?\.codex-unknown-unknown\.md$/);
  assert.equal((await readdir(folder)).length, 3);
  assert.equal(await readFile(join(folder, historical), "utf8"), "Historical text\n");
  const content = await readFile(join(folder, first), "utf8");
  for (const heading of ["Prompt", "Response", "Processing Log"])
    assert.ok(content.includes(`## ${heading}`));
  assert.equal(await archive(root, { ...record, response: "Updated final." }), first);
  const spaced = await archive(root, { ...record, response: "Done. " });
  assert.equal(spaced, first);
  assert.match(await readFile(join(folder, spaced), "utf8"), /## Response\n\nDone\. \n/);
});

await test("metadata and dates are validated and duplicate identities stop allocation", async () => {
  const root = await temporaryRoot();
  await assert.rejects(archive(root, { ...record, date: "2026-02-30T12:00:00Z" }), /Invalid UTC/);
  await assert.rejects(archive(root, { ...record, agent: "codex\nforged" }));
  await assert.rejects(archive(root, { ...record, prompt: "  " }));
  const first = await archive(root, record);
  await writeFile(
    join(root, "spec/.conversations/261004-corrupt.md"),
    await readFile(join(root, "spec/.conversations", first), "utf8"),
  );
  await assert.rejects(archive(root, record), /Duplicate task/);
  assert.equal(
    (await readFile(join(root, "spec/.conversations", first), "utf8")).includes("## Response"),
    true,
  );
});

await test("logical task checkpoints freeze exact public text and preserve later status separately", async () => {
  const root = await temporaryRoot();
  const first = await archive(root, {
    ...record,
    taskId: "task",
    response: "First public answer.",
  });
  const next = {
    ...record,
    taskId: "task",
    turnId: "next",
    response: "Approved implementation.\r\nDone.",
  };
  assert.equal(await archive(root, next), first);
  const frozen = await freezeArchive(root, next);
  const before = await readFile(join(root, frozen.archive), "utf8");
  assert.ok(before.includes("First public answer."));
  assert.ok(before.includes("Approved implementation.\nDone."));
  assert.ok(before.includes("<!-- teamagent-frozen:"));
  await assert.rejects(
    archive(root, { ...next, response: "Committed and pushed later." }),
    /checkpoint is frozen/,
  );
  assert.equal(await readFile(join(root, frozen.archive), "utf8"), before);
  await assert.rejects(
    freezeArchive(root, { ...next, response: "Different checkpoint." }),
    /checkpoint is frozen/,
  );
  await assert.rejects(
    freezeArchive(root, {
      ...record,
      taskId: "pending",
      questions: [{ number: 1, question: "Choose?", options: ["A", "B"] }],
    }),
    /Unanswered/,
  );
  const pending = {
    ...record,
    taskId: "answered",
    questions: [{ number: 1, question: "Choose?", options: ["A", "B"] }],
  };
  await archive(root, pending);
  const answered = await freezeArchive(root, {
    ...pending,
    turnId: "answer",
    response: "Choice recorded",
    questions: [{ number: 1, question: "Choose?", options: ["A", "B"], answer: "B" }],
  });
  const answeredText = await readFile(join(root, answered.archive), "utf8");
  assert.ok(answeredText.includes("## Answer 1\n\nB"));
  assert.ok(!answeredText.includes("<!-- teamagent-answer-pending:"));
  const sameTurn = { ...pending, taskId: "same-turn" };
  await archive(root, sameTurn);
  const sameFrozen = await freezeArchive(root, {
    ...sameTurn,
    questions: [{ number: 1, question: "Choose?", options: ["A", "B"], answer: "A" }],
  });
  const sameText = await readFile(join(root, sameFrozen.archive), "utf8");
  assert.ok(sameText.includes("## Answer 1\n\nA"));
  await assert.rejects(
    archive(root, {
      ...sameTurn,
      questions: [{ number: 1, question: "Choose?", options: ["A", "B"], answer: "B" }],
    }),
    /checkpoint is frozen/,
  );
});

await test("direct archive input is bounded before allocating or writing an aggregate record", async () => {
  const root = await temporaryRoot();
  const chunk = "x".repeat(1024 * 1024);
  await assert.rejects(
    archive(root, { ...record, processingLog: Array.from({ length: 9 }, () => chunk) }),
    /Conversation input byte limit exceeded/,
  );
  await assert.rejects(readdir(join(root, "spec/.conversations")), { code: "ENOENT" });
});

await test("archive inventory has an aggregate byte bound independent of per-file size", async () => {
  const root = await temporaryRoot();
  const folder = join(root, "spec/.conversations");
  await mkdir(folder, { recursive: true });
  await writeFile(join(folder, "261001-first.md"), "a".repeat(512));
  await writeFile(join(folder, "261001-second.md"), "b".repeat(512));
  await assert.rejects(archive(root, record, 600), /inventory byte limit/);
  await assert.rejects(archive(root, record, 129 * 1024 * 1024), /Invalid archive inventory bound/);
});

await test("legacy public marker examples cannot impersonate another task or a frozen checkpoint", async () => {
  const root = await temporaryRoot();
  const folder = join(root, "spec/.conversations");
  await mkdir(folder, { recursive: true });
  const example = `Historical public examples:\n<!-- teamagent-task: ${archiveTaskKey(record)} -->\n<!-- teamagent-frozen: ${"a".repeat(64)} -->\n`;
  await writeFile(join(folder, "261001-historical.md"), example);
  const file = await archive(root, record);
  assert.notEqual(file, "261001-historical.md");
  assert.equal(await readFile(join(folder, "261001-historical.md"), "utf8"), example);
  await freezeArchive(root, record);
});

await test("recognized credentials and requested literal names never enter the archive or filename", async () => {
  const privateKey =
    "-----BEGIN PRIVATE KEY-----\nexample-private-material\n-----END PRIVATE KEY-----";
  const sensitive = `api_key=example-secret password: 'hide me' Bearer abcdef.123 https://name:pass@example.com ${privateKey} sk-12345678901234567890`;
  const cleaned = redact(sensitive);
  assert.doesNotMatch(
    cleaned,
    /example-secret|hide me|abcdef|name:pass|example-private-material|sk-123/,
  );
  const root = await temporaryRoot();
  const file = await archive(root, {
    ...record,
    description: "former-project setup",
    prompt: sensitive,
    response: "former-project ready",
    redactions: ["former-project"],
  });
  assert.doesNotMatch(file, /former-project/);
  assert.doesNotMatch(
    await readFile(join(root, "spec/.conversations", file), "utf8"),
    /former-project|example-secret|hide me|abcdef|name:pass|example-private-material/,
  );
});

const envelope = (type: string, payload: unknown) => ({ type, payload });
const context = (id: string, metadata = true) =>
  envelope("turn_context", {
    turn_id: id,
    ...(metadata ? { model: "actual-model", effort: "high", cwd: "/repo" } : {}),
  });
const message = (role: string, text: string, phase?: string) =>
  envelope("response_item", {
    type: "message",
    role,
    ...(phase ? { phase } : {}),
    content: [{ type: "input_text", text }],
  });
async function transcriptFixture(lines: readonly unknown[]): Promise<string> {
  const path = join(await temporaryRoot(), "input.jsonl");
  await writeFile(path, lines.map((line) => JSON.stringify(line)).join("\n"));
  return path;
}
const stop = (path: string): StopInput => ({
  hook_event_name: "Stop",
  session_id: "session",
  turn_id: "selected",
  transcript_path: path,
  last_assistant_message: null,
});

await test("native export isolates the selected session/turn, steering, and public progress", async () => {
  const path = await transcriptFixture([
    envelope("session_meta", { id: "session" }),
    context("earlier"),
    message("user", "UNRELATED"),
    context("selected"),
    message("user", "<environment_context>metadata</environment_context>"),
    message("user", "<external_codex_apps_open_page>metadata</external_codex_apps_open_page>"),
    message("user", "Implement logging"),
    message("developer", "PRIVATE INSTRUCTIONS"),
    message("assistant", "PRIVATE THOUGHTS", "analysis"),
    envelope("response_item", { type: "reasoning", summary: "PRIVATE REASONING" }),
    message("assistant", "Checking the hooks.", "commentary"),
    message("user", "Also use relative paths"),
    envelope("event_msg", {
      type: "item_completed",
      item: { type: "CommandExecution", command: ["SECRET COMMAND"], stdout: "SECRET OUTPUT" },
    }),
    envelope("response_item", { type: "function_call_output", output: "SECRET OUTPUT" }),
    message("assistant", "Recorded.", "final_answer"),
    context("later"),
    message("user", "UNRELATED LATER"),
  ]);
  const input = stop(path);
  const parsed = await fromTranscript(input);
  assert.equal(parsed.model, "actual-model");
  assert.equal(parsed.reasoning, "high");
  assert.equal(parsed.prompt, "Implement logging\n\n---\n\nAlso use relative paths");
  assert.equal(parsed.response, "Recorded.");
  assert.deepEqual(parsed.processingLog, ["Checking the hooks."]);
  assert.doesNotMatch(
    JSON.stringify(parsed),
    /PRIVATE|SECRET|UNRELATED|environment_context|external_codex/,
  );
  assert.equal(
    (await fromTranscript({ ...input, last_assistant_message: "Latest final." })).response,
    "Latest final.",
  );
  await assert.rejects(fromTranscript({ ...input, turn_id: "missing" }), /lacks matching/);
  await assert.rejects(fromTranscript({ ...input, session_id: "wrong" }), /session does not match/);
  await assert.rejects(fromTranscript({ ...input, transcript_path: null }), /No transcript/);
});

await test("subagents use their own latest turn and do not inherit an earlier final or model", async () => {
  const path = await transcriptFixture([
    envelope("session_meta", { id: "child-session" }),
    context("earlier"),
    message("user", "Earlier prompt"),
    message("assistant", "Earlier final", "final_answer"),
    context("child-turn", false),
    message("user", "Current child prompt"),
  ]);
  const input: StopInput = {
    ...stop(path),
    hook_event_name: "SubagentStop",
    agent_id: "child",
    agent_transcript_path: path,
  };
  await assert.rejects(fromTranscript(input), /lacks matching/);
  const parsed = await fromTranscript({ ...input, last_assistant_message: "Child final" });
  assert.equal(parsed.sessionId, "child-session");
  assert.equal(parsed.turnId, "child-turn");
  assert.equal(parsed.agent, "codex-child");
  assert.equal(parsed.model, "unknown");
  assert.equal(parsed.reasoning, "unknown");
  assert.equal(parsed.prompt, "Current child prompt");
  assert.equal(parsed.response, "Child final");
});

await test("a prompt-free native subagent archives only its visible final with an honest absence marker", async () => {
  const path = await transcriptFixture([
    envelope("session_meta", { id: "child-session" }),
    context("inherited"),
    message("user", "INHERITED PROMPT"),
    message("developer", "PRIVATE DELEGATION"),
    context("child-turn"),
    message("assistant", "Public child update", "commentary"),
  ]);
  const input: StopInput = {
    ...stop(path),
    hook_event_name: "SubagentStop",
    agent_transcript_path: path,
    last_assistant_message: "Current visible final",
  };
  const parsed = await fromTranscript(input);
  assert.match(parsed.prompt, /Delegated prompt unavailable in native subagent transcript/);
  assert.equal(parsed.parentSessionId, "session");
  assert.equal(parsed.parentTurnId, "selected");
  assert.equal(parsed.turnId, "child-turn");
  assert.deepEqual(parsed.processingLog, ["Public child update"]);
  assert.equal(parsed.response, "Current visible final");
  assert.doesNotMatch(JSON.stringify(parsed), /INHERITED PROMPT|PRIVATE DELEGATION/);
  const inheritedPath = await transcriptFixture([
    envelope("session_meta", { id: "session" }),
    context("child-turn"),
  ]);
  const inherited = await fromTranscript({
    ...input,
    agent_transcript_path: inheritedPath,
    agent_id: "actual-child-id",
  });
  assert.equal(inherited.sessionId, "actual-child-id");
  assert.equal(inherited.parentSessionId, "session");
  await assert.rejects(
    fromTranscript({
      ...stop(path),
      session_id: "child-session",
      turn_id: "child-turn",
      last_assistant_message: "Root final",
    }),
    /lacks matching/,
  );
});
