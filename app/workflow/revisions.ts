import { mkdir, opendir } from "node:fs/promises";
import { dirname } from "node:path";
import { Schema } from "effect";
import { Checkpoint, Hash, type Request, type Task } from "./model.ts";
import { changedPaths, checkedScope, fileHash, publicPath, type Git } from "./git.ts";
import {
  boundedText,
  containedPath,
  digest,
  exclusiveText,
  taskKey,
  workflowCapacity,
} from "./storage.ts";
import { diagnostic } from "./process.ts";

export const checkpointHash = (checkpoint: Checkpoint): string =>
  digest(JSON.stringify(checkpoint));
const Receipt = Schema.Struct({
  version: Schema.Literal(1),
  task: Hash,
  id: Hash,
  requestHash: Hash,
  snapshotHash: Hash,
  policyHash: Hash,
  createdAt: Schema.String.check(
    Schema.isPattern(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/u),
  ),
  reason: Schema.String.check(Schema.isMaxLength(8192)),
  previousHash: Hash,
  nextHash: Hash,
  previous: Checkpoint,
  next: Checkpoint,
});
type Receipt = typeof Receipt.Type;
type RevisionRequest = Extract<Request, { operation: "revise-checkpoint" }>;
const maximumReceiptBytes = 16 * 1024 * 1024;

async function readReceipt(path: string): Promise<{ value: Receipt; hash: string } | null> {
  try {
    const text = await boundedText(path, maximumReceiptBytes);
    return {
      value: Schema.decodeUnknownSync(Schema.fromJsonString(Receipt))(text, {
        onExcessProperty: "error",
      }),
      hash: digest(text),
    };
  } catch (error) {
    if (error instanceof Error && "code" in error && error.code === "ENOENT") return null;
    throw error;
  }
}

/** Explicit repair of owned content; frozen public text and publication authority never change. */
export async function reviseCheckpoint(
  root: string,
  git: Git,
  task: Task,
  request: RevisionRequest,
  persist: (task: Task) => Promise<void>,
): Promise<Task> {
  if (!["checkpointed", "ready"].includes(task.state) || !task.checkpoint || task.commit)
    throw new Error("Checkpoint revision is allowed only before publication starts");
  const previous = task.checkpoint;
  const files = [...request.files].sort();
  const approved = [...(request.approvedExistingFiles ?? [])].sort();
  if (
    new Set(files).size !== files.length ||
    new Set(approved).size !== approved.length ||
    approved.some((path) => !files.includes(path))
  )
    throw new Error("Duplicate scope or invalid existing-file adoption");
  if (!files.includes(previous.archive))
    throw new Error("Revision must preserve the frozen archive in scope");
  for (const path of files) {
    publicPath(path);
    if (task.snapshot.changes[path] !== undefined && !approved.includes(path))
      throw new Error("Pre-existing change needs an explicit revision scope decision");
  }
  if ((await changedPaths(git)).some((path) => !files.includes(path)))
    throw new Error("Unscoped worktree changes prevent checkpoint revision");
  if ((await fileHash(root, previous.archive)) !== previous.archiveHash)
    throw new Error("Frozen archive changed; it cannot be revised");
  const reason = diagnostic(request.reason).trim();
  if (!reason) throw new Error("Revision reason must contain visible text");
  const id = digest(request.revisionId);
  const taskIdentity = taskKey(task.sessionId, task.taskId);
  const relative = `.cache/workflow/revisions/${taskIdentity}/${id}.json`;
  const path = await containedPath(root, relative);
  const requestHash = digest(
    JSON.stringify([request.expectedCheckpointHash, reason, files, approved]),
  );
  const existing = await readReceipt(path);
  let receipt: Receipt;
  let receiptHash: string;
  if (existing) {
    receipt = existing.value;
    receiptHash = existing.hash;
    if (
      receipt.task !== taskIdentity ||
      receipt.id !== id ||
      receipt.requestHash !== requestHash ||
      receipt.snapshotHash !== digest(JSON.stringify(task.snapshot)) ||
      receipt.policyHash !== task.policyHash ||
      receipt.previousHash !== request.expectedCheckpointHash ||
      receipt.previousHash !== checkpointHash(receipt.previous) ||
      receipt.nextHash !== checkpointHash(receipt.next)
    )
      throw new Error("Revision receipt does not match this request or task");
    const current = checkpointHash(previous);
    if (current !== receipt.previousHash && current !== receipt.nextHash)
      throw new Error("Checkpoint revision is stale; inspect the current checkpoint hash");
    if (
      receipt.next.archive !== previous.archive ||
      receipt.next.archiveHash !== previous.archiveHash ||
      receipt.next.responseHash !== previous.responseHash ||
      receipt.next.message !== previous.message ||
      JSON.stringify(receipt.next.files) !== JSON.stringify(files) ||
      JSON.stringify(receipt.next.approvedExistingFiles) !== JSON.stringify(approved)
    )
      throw new Error("Revision receipt attempts to replace frozen checkpoint fields");
    if (
      Object.keys(receipt.next.hashes).length !== files.length ||
      files.some((file) => receipt.next.hashes[file] === undefined)
    )
      throw new Error("Revision receipt scope hash coverage is incomplete");
    await checkedScope(root, git, { ...task, checkpoint: receipt.next });
    if (
      current === receipt.nextHash &&
      task.latestRevision?.receipt === relative &&
      task.latestRevision.hash === receiptHash
    )
      return task;
  } else {
    if (checkpointHash(previous) !== request.expectedCheckpointHash)
      throw new Error("Checkpoint revision is stale; inspect the current checkpoint hash");
    const hashes: Record<string, string> = {};
    for (const file of files) hashes[file] = await fileHash(root, file);
    const next: Checkpoint = { ...previous, files, approvedExistingFiles: approved, hashes };
    await checkedScope(root, git, { ...task, checkpoint: next });
    const nextHash = checkpointHash(next);
    if (nextHash === request.expectedCheckpointHash)
      throw new Error("Checkpoint scope and content did not change");
    receipt = {
      version: 1,
      task: taskIdentity,
      id,
      requestHash,
      snapshotHash: digest(JSON.stringify(task.snapshot)),
      policyHash: task.policyHash,
      createdAt: new Date().toISOString(),
      reason,
      previousHash: request.expectedCheckpointHash,
      nextHash,
      previous,
      next,
    };
    const content = JSON.stringify(Schema.decodeUnknownSync(Receipt)(receipt), null, 2) + "\n";
    if (Buffer.byteLength(content) > maximumReceiptBytes)
      throw new Error("Checkpoint revision receipt byte limit exceeded");
    await workflowCapacity(root, Buffer.byteLength(content) + 8 * 1024 * 1024);
    await mkdir(dirname(path), { recursive: true });
    let count = 0;
    for await (const entry of await opendir(dirname(path))) {
      if (!entry.isFile() || !/^[a-f0-9]{64}\.json$/u.test(entry.name))
        throw new Error("Unexpected revision evidence; inspect it before continuing");
      if (++count >= 64)
        throw new Error("Checkpoint revision count limit reached; existing receipts retained");
    }
    await exclusiveText(path, content);
    receiptHash = digest(content);
  }
  const next: Task = {
    ...task,
    checkpoint: receipt.next,
    state: "checkpointed",
    verification: null,
    signingIdentity: null,
    latestRevision: { receipt: relative, hash: receiptHash },
  };
  await persist(next);
  return next;
}
