import { mkdir, readdir } from "node:fs/promises";
import { join } from "node:path";
import { Schema } from "effect";
import { relativeReferences } from "./paths.ts";
import { redact } from "./privacy.ts";
import {
  atomicText,
  boundedText,
  digest,
  lf,
  withLock,
  containedPath,
} from "../workflow/storage.ts";

const Metadata = Schema.NonEmptyString.check(
  Schema.isMaxLength(256),
  Schema.isPattern(/^[^\r\n\0]+$/u),
);
const PublicText = Schema.NonEmptyString.check(
  Schema.isPattern(/\S/u),
  Schema.isMaxLength(2 * 1024 * 1024),
);
const Question = Schema.Struct({
  number: Schema.Int.check(Schema.isGreaterThanOrEqualTo(1)),
  question: PublicText,
  options: Schema.Array(PublicText).check(Schema.isMaxLength(26)),
  answer: Schema.optional(PublicText),
});
export const RecordInput = Schema.Struct({
  sessionId: Metadata,
  turnId: Metadata,
  taskId: Schema.optional(Metadata),
  parentSessionId: Schema.optional(Metadata),
  parentTurnId: Schema.optional(Metadata),
  agent: Metadata,
  model: Metadata,
  reasoning: Metadata,
  date: Schema.String.check(
    Schema.isPattern(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{3})?Z$/u),
  ),
  description: PublicText,
  prompt: PublicText,
  response: PublicText,
  processingLog: Schema.Array(Schema.String.check(Schema.isMaxLength(2 * 1024 * 1024))).check(
    Schema.isMaxLength(10000),
  ),
  questions: Schema.optional(Schema.Array(Question).check(Schema.isMaxLength(100))),
  previousRoot: Schema.optional(Schema.String),
  redactions: Schema.optional(Schema.Array(Schema.NonEmptyString)),
});
export type RecordInput = typeof RecordInput.Type;
export class FrozenArchive extends Error {
  constructor(readonly file: string) {
    super(
      "Task checkpoint is frozen; later outcomes require a publication receipt and were not archived",
    );
  }
}
export const slug = (value: string): string =>
  value
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/gu, "-")
    .replace(/^-|-$/gu, "")
    .slice(0, 64)
    .replace(/-$/u, "") || "unknown";
export const archiveTaskKey = (
  input: Pick<RecordInput, "sessionId" | "turnId" | "taskId" | "agent">,
): string => digest(JSON.stringify([input.sessionId, input.agent, input.taskId ?? input.turnId]));
export function cleanPublic(root: string, input: RecordInput, text: string): string {
  return lf(redact(relativeReferences(text, root, input.previousRoot), input.redactions)).replace(
    /<!--(?=\s*\/?(?:teamagent-|conversation:))/gu,
    "&lt;!--",
  );
}
/** Q/A uses its own reconciliation markers; every other visible turn field binds retries. */
function publicTurnMarker(root: string, input: RecordInput): string {
  const clean = (text: string) => cleanPublic(root, input, text);
  return `<!-- conversation: ${digest(
    JSON.stringify({
      session: clean(input.sessionId),
      task: clean(input.taskId ?? input.turnId),
      turn: clean(input.turnId),
      parentSession: clean(input.parentSessionId ?? ""),
      parentTurn: clean(input.parentTurnId ?? ""),
      agent: clean(input.agent),
      model: clean(input.model),
      reasoning: clean(input.reasoning),
      date: new Date(input.date).toISOString(),
      description: clean(input.description),
      prompt: clean(input.prompt),
      response: clean(input.response),
      processingLog: input.processingLog.map(clean),
    }),
  )} -->`;
}
const taskHeader = (content: string, marker: string): boolean => content.startsWith(marker + "\n");
const frozenFooter = (content: string): boolean =>
  /\n<!-- teamagent-frozen: [a-f0-9]{64} -->\n$/u.test(content);
function hasResponse(content: string, marker: string): boolean {
  return (
    content.startsWith(marker + "\n") ||
    (/^<!-- teamagent-task: [a-f0-9]{64} -->\n/u.test(content) &&
      content.includes("\n" + marker + "\nTurn: "))
  );
}

/** One public logical-task record. Old names/contents remain valid until explicit migration. */
export async function archive(
  root: string,
  value: RecordInput,
  maximumInventoryBytes = 128 * 1024 * 1024,
): Promise<string> {
  if (
    !Number.isSafeInteger(maximumInventoryBytes) ||
    maximumInventoryBytes < 1 ||
    maximumInventoryBytes > 128 * 1024 * 1024
  )
    throw new Error("Invalid archive inventory bound");
  const input = Schema.decodeUnknownSync(RecordInput)(value);
  // Count validated strings before hashing, redaction, concatenation or serialization.
  let inputBytes = 0;
  const countInput = (text: string | undefined): void => {
    if (text === undefined) return;
    inputBytes += Buffer.byteLength(text);
    if (inputBytes > 8 * 1024 * 1024) throw new Error("Conversation input byte limit exceeded");
  };
  for (const text of [
    input.sessionId,
    input.turnId,
    input.taskId,
    input.parentSessionId,
    input.parentTurnId,
    input.agent,
    input.model,
    input.reasoning,
    input.date,
    input.description,
    input.prompt,
    input.response,
    input.previousRoot,
  ])
    countInput(text);
  for (const text of input.processingLog) countInput(text);
  for (const text of input.redactions ?? []) countInput(text);
  for (const question of input.questions ?? []) {
    countInput(question.question);
    countInput(question.answer);
    for (const text of question.options) countInput(text);
  }
  const date = new Date(input.date);
  if (
    !Number.isFinite(date.valueOf()) ||
    date.toISOString().slice(0, 19) !== input.date.slice(0, 19)
  )
    throw new Error("Invalid UTC completion date");
  const clean = (text: string) => cleanPublic(root, input, text);
  const response = clean(input.response);
  const marker = publicTurnMarker(root, input);
  const task = archiveTaskKey(input);
  const taskMarker = `<!-- teamagent-task: ${task} -->`;
  const folder = await containedPath(root, "spec/.conversations");
  await mkdir(folder, { recursive: true });
  return await withLock(join(folder, ".write-lock"), async () => {
    const names = (await readdir(folder)).filter((name) => /^\d{6}-[^/]+\.md$/u.test(name));
    if (names.length > 20000) throw new Error("Conversation inventory limit exceeded");
    let prior: { file: string; content: string } | undefined;
    let inventoryBytes = 0;
    for (const file of names) {
      const content = await boundedText(join(folder, file));
      inventoryBytes += Buffer.byteLength(content);
      if (inventoryBytes > maximumInventoryBytes)
        throw new Error("Conversation inventory byte limit exceeded");
      if (!taskHeader(content, taskMarker) && !hasResponse(content, marker)) continue;
      if (prior) throw new Error("Duplicate task or response archive identity");
      prior = { file, content };
    }
    // Frozen task records retain their implementation checkpoint; later status belongs in receipts.
    const questionsPresent = (input.questions ?? []).every((question) => {
      const hash = digest(JSON.stringify([clean(question.question), question.options.map(clean)]));
      return (
        prior?.content.includes(`<!-- teamagent-question: ${question.number} ${hash} -->`) &&
        (!question.answer ||
          prior.content.includes(
            `<!-- teamagent-answer: ${question.number} ${digest(clean(question.answer))} -->`,
          ))
      );
    });
    if (
      prior &&
      taskHeader(prior.content, taskMarker) &&
      frozenFooter(prior.content) &&
      (!hasResponse(prior.content, marker) || !questionsPresent)
    )
      throw new FrozenArchive(prior.file);
    if (prior && hasResponse(prior.content, marker) && questionsPresent) return prior.file;
    let file =
      prior?.file ??
      `${input.date.slice(2, 10).replaceAll("-", "")}-${slug(clean(input.description))}.${slug(clean(input.agent))}-${slug(clean(input.model))}-${slug(clean(input.reasoning))}.md`;
    if (!prior && names.includes(file)) {
      file = file.replace(/(\.[^.]+\.md)$/u, `-${task.slice(0, 12)}$1`);
      if (names.includes(file)) throw new Error("Conversation filename identity collision");
    }
    let content = [
      ...(prior
        ? [prior.content, "", "## Follow-up", ""]
        : [
            taskMarker,
            "",
            `Date: ${date.toISOString()}`,
            `Session: ${clean(input.sessionId)}`,
            `Task: ${clean(input.taskId ?? input.turnId)}`,
            ...(input.parentSessionId ? [`Parent session: ${clean(input.parentSessionId)}`] : []),
            ...(input.parentTurnId ? [`Parent turn: ${clean(input.parentTurnId)}`] : []),
            "",
            "Public transcript only. Recognized credentials and requested redactions are replaced with [redacted] markers. Text uses LF.",
            "",
          ]),
      marker,
      `Turn: ${clean(input.turnId)}`,
      `Date: ${date.toISOString()}`,
      `Description: ${clean(input.description)}`,
      ...(input.parentSessionId ? [`Parent session: ${clean(input.parentSessionId)}`] : []),
      ...(input.parentTurnId ? [`Parent turn: ${clean(input.parentTurnId)}`] : []),
      `Agent: ${clean(input.agent)}`,
      `Model: ${clean(input.model)}`,
      `Reasoning level: ${clean(input.reasoning)}`,
      "",
      "## Prompt",
      "",
      clean(input.prompt),
      "",
      "## Response",
      "",
      response,
      "",
      "## Processing Log",
      "",
      ...input.processingLog.flatMap((entry) => [clean(entry), ""]),
    ].join("\n");
    for (const question of input.questions ?? []) {
      const questionHash = digest(
        JSON.stringify([clean(question.question), question.options.map(clean)]),
      );
      const questionMarker = `<!-- teamagent-question: ${question.number} ${questionHash} -->`;
      const pending = `<!-- teamagent-answer-pending: ${question.number} -->`;
      const existing = new RegExp(
        `<!-- teamagent-question: ${question.number} ([a-f0-9]{64}) -->`,
        "u",
      ).exec(content);
      if (existing && existing[1] !== questionHash)
        throw new Error("Question number already names different content");
      if (!existing)
        content += [
          "",
          questionMarker,
          `## Question ${question.number}`,
          "",
          clean(question.question),
          "",
          ...question.options.flatMap((option, index) => [
            `${String.fromCharCode(65 + index)}. ${clean(option)}`,
            "",
          ]),
          pending,
          "",
        ].join("\n");
      if (question.answer) {
        content = content.replace(
          pending,
          `<!-- teamagent-answer-resolved: ${question.number} -->`,
        );
        const answerMarker = `<!-- teamagent-answer: ${question.number} ${digest(clean(question.answer))} -->`;
        if (!content.includes(answerMarker))
          content += [
            "",
            answerMarker,
            `## Answer ${question.number}`,
            "",
            clean(question.answer),
            "",
          ].join("\n");
      }
    }
    if (Buffer.byteLength(content) > 8 * 1024 * 1024)
      throw new Error("Conversation record limit exceeded");
    await atomicText(join(folder, file), content);
    return file;
  });
}

export async function freezeArchive(
  root: string,
  input: RecordInput,
): Promise<{ archive: string; archiveHash: string; responseHash: string }> {
  if (input.questions?.some((question) => !question.answer))
    throw new Error("Unanswered review question");
  const file = await archive(root, input);
  const path = "spec/.conversations/" + file;
  return await withLock(join(root, "spec/.conversations/.write-lock"), async () => {
    const target = await containedPath(root, path);
    let content = await boundedText(target);
    const response = cleanPublic(root, input, input.response);
    const marker = publicTurnMarker(root, input);
    if (
      !taskHeader(content, `<!-- teamagent-task: ${archiveTaskKey(input)} -->`) ||
      !hasResponse(content, marker)
    )
      throw new Error("Archive does not contain this exact task response");
    if (content.includes("<!-- teamagent-answer-pending:"))
      throw new Error("Archive has unanswered review questions");
    const responseHash = digest(response);
    const frozen = `<!-- teamagent-frozen: ${responseHash} -->`;
    if (frozenFooter(content) && !content.endsWith("\n" + frozen + "\n"))
      throw new Error("Task archive already frozen with another response");
    if (!frozenFooter(content)) {
      content += "\n" + frozen + "\n";
      await atomicText(target, content);
    }
    return { archive: path, archiveHash: digest(content), responseHash };
  });
}
