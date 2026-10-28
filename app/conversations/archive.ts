import { createHash } from "node:crypto";
import { mkdir, readdir, readFile, rename, rmdir, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { Schema } from "effect";
import { relativeReferences } from "./paths.ts";
import { redact } from "./privacy.ts";

const Metadata = Schema.NonEmptyString.check(Schema.isPattern(/^[^\r\n\0]+$/));
const PublicText = Schema.NonEmptyString.check(Schema.isPattern(/\S/));
export const RecordInput = Schema.Struct({
  sessionId: Metadata,
  turnId: Metadata,
  parentSessionId: Schema.optional(Metadata),
  parentTurnId: Schema.optional(Metadata),
  agent: Metadata,
  model: Metadata,
  reasoning: Metadata,
  date: Schema.String.check(Schema.isPattern(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{3})?Z$/)),
  description: PublicText,
  prompt: PublicText,
  response: PublicText,
  processingLog: Schema.Array(Schema.String),
  previousRoot: Schema.optional(Schema.String),
  redactions: Schema.optional(Schema.Array(Schema.NonEmptyString)),
});
export type RecordInput = typeof RecordInput.Type;
export const slug = (value: string): string =>
  value
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 64)
    .replace(/-$/, "") || "unknown";

/** Allocate under one directory lock, then atomically publish an append-only record. */
export async function archive(root: string, value: RecordInput): Promise<string> {
  const input = Schema.decodeUnknownSync(RecordInput)(value);
  const parsedDate = new Date(input.date);
  if (
    !Number.isFinite(parsedDate.valueOf()) ||
    parsedDate.toISOString().slice(0, 19) !== input.date.slice(0, 19)
  ) {
    throw new Error("Invalid UTC completion date");
  }
  const clean = (text: string): string =>
    redact(relativeReferences(text, root, input.previousRoot), input.redactions).replace(
      /\r\n?/gu,
      "\n",
    );
  const response = clean(input.response);
  const identity = createHash("sha256")
    .update(JSON.stringify([input.sessionId, input.turnId, input.agent, response]))
    .digest("hex");
  const marker = `<!-- conversation: ${identity} -->`;
  const folder = join(root, "spec", ".conversations");
  await mkdir(folder, { recursive: true });
  const lock = join(folder, ".write-lock");
  let acquired = false;
  for (let attempt = 0; attempt < 200; attempt++) {
    try {
      await mkdir(lock);
      acquired = true;
      break;
    } catch (error) {
      if (!(error instanceof Error) || !("code" in error) || error.code !== "EEXIST") throw error;
      await new Promise<void>((done) => setTimeout(done, 25));
    }
  }
  if (!acquired)
    throw new Error(
      "Conversation archive locked; inspect spec/.conversations/.write-lock before retrying",
    );
  let temporaryExists = false;
  try {
    let maximum = 0;
    let duplicate: string | undefined;
    const numbers = new Set<number>();
    for (const file of await readdir(folder)) {
      const match = /^\d{6}-(\d+)-.*\.md$/.exec(file);
      if (!match?.[1]) continue;
      const number = Number(match[1]);
      if (!Number.isSafeInteger(number) || number < 1 || numbers.has(number))
        throw new Error("Duplicate or invalid absolute conversation number");
      numbers.add(number);
      maximum = Math.max(maximum, number);
      if ((await readFile(join(folder, file), "utf8")).split(/\r?\n/, 1)[0] === marker)
        duplicate = file;
    }
    if (duplicate) return duplicate;
    if (!Number.isSafeInteger(maximum + 1)) throw new Error("Conversation number overflow");
    const day = input.date.slice(2, 10).replaceAll("-", "");
    const file = `${day}-${maximum + 1}-${slug(clean(input.description))}.${slug(clean(input.agent))}-${slug(clean(input.model))}-${slug(clean(input.reasoning))}.md`;
    const content = [
      marker,
      "",
      `Date: ${parsedDate.toISOString()}`,
      `Session: ${clean(input.sessionId)}`,
      `Turn: ${clean(input.turnId)}`,
      ...(input.parentSessionId ? [`Parent session: ${clean(input.parentSessionId)}`] : []),
      ...(input.parentTurnId ? [`Parent turn: ${clean(input.parentTurnId)}`] : []),
      `Agent: ${clean(input.agent)}`,
      `Model: ${clean(input.model)}`,
      `Reasoning level: ${clean(input.reasoning)}`,
      "",
      "Public transcript only. Recognized credentials and requested literal redactions are replaced with [redacted] markers. Text line endings are normalized to LF.",
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
    const temporary = join(lock, "record.md");
    // A failed write or publication retains the lock and partial record for manual recovery.
    temporaryExists = true;
    await writeFile(temporary, content, { flag: "wx" });
    await rename(temporary, join(folder, file));
    temporaryExists = false;
    return file;
  } finally {
    if (!temporaryExists) await rmdir(lock);
  }
}
