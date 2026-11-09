import { lstat, mkdir, readdir, realpath } from "node:fs/promises";
import { basename, dirname, isAbsolute, join, resolve } from "node:path";
import { Schema } from "effect";
import {
  GitObjectId,
  commonDirectoryAndBranch,
  remoteHead,
  remoteHeadOrAbsent,
  remoteMainAndTaskOrAbsent,
  type Git,
  type RepositoryObservation,
} from "./git.ts";
import { Hash, Identity, type Task } from "./model.ts";
import {
  atomicText,
  boundedText,
  containedPath,
  digest,
  exclusiveText,
  taskKey,
  withLock,
} from "./storage.ts";
import { inspectParallelRegistry } from "./parallel-registry.ts";

export const ParallelName = Schema.String.check(Schema.isPattern(/^[a-z0-9][a-z0-9-]{0,47}$/u));
const AbsolutePath = Schema.NonEmptyString.check(Schema.isMaxLength(4096));
export const ParallelEntry = Schema.Struct({
  version: Schema.Literal(1),
  ...Identity,
  name: ParallelName,
  path: AbsolutePath,
  branch: Schema.String.check(Schema.isPattern(/^codex\/[a-z0-9][a-z0-9-]{0,95}$/u)),
  base: GitObjectId,
  destination: Hash,
  policyHash: Hash,
  state: Schema.Literals([
    "creating",
    "open",
    "submitting",
    "prepared",
    "integrating",
    "integrated",
    "uncertain",
    "failed",
  ]),
  source: Schema.NullOr(GitObjectId),
  main: Schema.NullOr(GitObjectId),
  result: Schema.NullOr(GitObjectId),
  workspace: Schema.NullOr(AbsolutePath),
  prNumber: Schema.NullOr(Schema.Int.check(Schema.isGreaterThan(0))),
  tree: Schema.NullOr(GitObjectId),
  reviewKey: Schema.NullOr(Hash),
  signingIdentity: Schema.NullOr(Hash),
  fingerprint: Schema.NullOr(Schema.String.check(Schema.isMaxLength(256))),
  failure: Schema.NullOr(Schema.String.check(Schema.isMaxLength(1000))),
});
export type ParallelEntry = typeof ParallelEntry.Type;
/** Only physical addresses are reused within a command; files, refs and trust remain live. */
export type ParallelLocations = { readonly registry: string; readonly primary: string };
export const parallelName = (name: string, sessionId: string, taskId: string): string =>
  Schema.decodeUnknownSync(ParallelName)(name) + "-" + taskKey(sessionId, taskId).slice(0, 16);

export async function parallelDirectory(git: Git): Promise<string> {
  const value = (await git(["rev-parse", "--path-format=absolute", "--git-common-dir"])).trim();
  return await checkedParallelDirectory(value);
}
export async function checkedParallelDirectory(value: string): Promise<string> {
  if (!isAbsolute(value) || value.length > 4096 || /[\r\n\0]/u.test(value))
    throw new Error("Invalid common Git directory");
  if ((await lstat(value)).isSymbolicLink() || !(await lstat(value)).isDirectory())
    throw new Error("Common Git directory must be a physical directory");
  const physical = await realpath(value);
  if (resolve(physical) !== resolve(value)) throw new Error("Common Git directory is redirected");
  return await containedPath(physical, "teamagent-parallel");
}
export async function primaryWorktree(git: Git): Promise<string> {
  const text = await git(["worktree", "list", "--porcelain", "-z"]);
  if (Buffer.byteLength(text) > 1024 * 1024) throw new Error("Worktree inventory exceeds bounds");
  const rows = text.split("\0");
  const first = rows[0];
  if (!first?.startsWith("worktree ")) throw new Error("Missing primary saved worktree");
  const root = first.slice(9);
  if (!isAbsolute(root) || resolve(await realpath(root)) !== resolve(root))
    throw new Error("Primary worktree must be a physical absolute path");
  return root;
}
export async function parallelDestination(git: Git): Promise<string> {
  const fetch = (await git(["remote", "get-url", "--all", "origin"])).trim();
  const push = (await git(["remote", "get-url", "--push", "--all", "origin"])).trim();
  if (
    fetch !== push ||
    !/^(?:https:\/\/github\.com\/iki\/teamagent|git@github\.com:iki\/teamagent|ssh:\/\/git@github\.com\/iki\/teamagent)(?:\.git)?$/u.test(
      fetch,
    )
  )
    throw new Error("Parallel workflow requires the exact approved Teamagent origin");
  return digest(fetch + "\n" + push);
}
async function registryAddress(
  git: Git,
  known?: Pick<ParallelLocations, "registry">,
): Promise<string> {
  if (!known) return await parallelDirectory(git);
  const value = known.registry;
  if (!isAbsolute(value) || value.length > 4096 || basename(value) !== "teamagent-parallel")
    throw new Error("Invalid resolved registry address");
  const common = dirname(value);
  if ((await lstat(common)).isSymbolicLink() || resolve(await realpath(common)) !== resolve(common))
    throw new Error("Resolved common Git directory is redirected");
  return await containedPath(common, "teamagent-parallel");
}
async function primaryAddress(git: Git, known?: ParallelLocations): Promise<string> {
  if (!known) return await primaryWorktree(git);
  if (
    !isAbsolute(known.primary) ||
    resolve(await realpath(known.primary)) !== resolve(known.primary)
  )
    throw new Error("Resolved primary worktree is redirected");
  return known.primary;
}
async function entryPath(
  git: Git,
  sessionId: string,
  taskId: string,
  known?: Pick<ParallelLocations, "registry">,
): Promise<string> {
  return await containedPath(
    await registryAddress(git, known),
    "entries/" + taskKey(sessionId, taskId) + ".json",
  );
}
export async function loadParallelEntry(
  git: Git,
  sessionId: string,
  taskId: string,
  known?: Pick<ParallelLocations, "registry">,
): Promise<ParallelEntry | null> {
  try {
    const raw = await boundedText(await entryPath(git, sessionId, taskId, known), 16384);
    if (raw.includes("\r")) throw new Error("Parallel workflow metadata must use LF");
    const entry = Schema.decodeUnknownSync(Schema.fromJsonString(ParallelEntry))(raw, {
      onExcessProperty: "error",
    });
    if (entry.sessionId !== sessionId || entry.taskId !== taskId)
      throw new Error("Parallel task identity mismatch");
    return entry;
  } catch (error) {
    if (error instanceof Error && "code" in error && error.code === "ENOENT") return null;
    throw error;
  }
}
export async function saveParallelEntry(
  git: Git,
  value: ParallelEntry,
  known?: Pick<ParallelLocations, "registry">,
): Promise<void> {
  const directory = await registryAddress(git, known);
  await withLock(join(directory, ".registry-lock"), async () => {
    const content = JSON.stringify(Schema.decodeUnknownSync(ParallelEntry)(value), null, 2) + "\n";
    if (Buffer.byteLength(content) > 16384)
      throw new Error("Parallel entry exceeds its metadata bound");
    await inspectParallelRegistry(directory, Buffer.byteLength(content) * 2);
    await writeParallelEntry(directory, value);
  });
}
async function writeParallelEntry(registry: string, value: ParallelEntry): Promise<void> {
  const entry = Schema.decodeUnknownSync(ParallelEntry)(value, { onExcessProperty: "error" });
  const directory = await containedPath(registry, "entries");
  await mkdir(directory, { recursive: true });
  const names = await readdir(directory);
  if (names.length >= 1000 && !names.includes(taskKey(entry.sessionId, entry.taskId) + ".json"))
    throw new Error("Parallel registry capacity exceeded; preserve existing evidence");
  const content = JSON.stringify(entry, null, 2) + "\n";
  const receipt = await containedPath(
    registry,
    "receipts/" + taskKey(entry.sessionId, entry.taskId) + "/" + digest(content) + ".json",
  );
  const receiptDirectory = await containedPath(
    registry,
    "receipts/" + taskKey(entry.sessionId, entry.taskId),
  );
  await mkdir(receiptDirectory, { recursive: true });
  const receipts = await readdir(receiptDirectory);
  if (receipts.length >= 1024 && !receipts.includes(digest(content) + ".json"))
    throw new Error("Parallel receipt capacity exceeded; preserve evidence");
  try {
    await exclusiveText(receipt, content);
  } catch (error) {
    if (
      !(error instanceof Error && "code" in error && error.code === "EEXIST") ||
      (await boundedText(receipt, 16384)) !== content
    )
      throw error;
  }
  await atomicText(
    await containedPath(registry, "entries/" + taskKey(entry.sessionId, entry.taskId) + ".json"),
    content,
  );
}
export async function assertParallelRegistry(
  git: Git,
  reserveBytes = 0,
  limits: { bytes?: number; files?: number } = {},
): Promise<void> {
  const directory = await parallelDirectory(git);
  try {
    await lstat(directory);
  } catch (error) {
    if (error instanceof Error && "code" in error && error.code === "ENOENT") {
      await inspectParallelRegistry(directory, reserveBytes, limits);
      return;
    }
    throw error;
  }
  await withLock(
    join(directory, ".registry-lock"),
    async () => await inspectParallelRegistry(directory, reserveBytes, limits),
  );
}
async function assertIntegrationLocation(
  git: Git,
  entry: ParallelEntry,
  workspace: string,
  fast: boolean,
  known?: ParallelLocations,
): Promise<void> {
  if (!isAbsolute(workspace)) throw new Error("Integration checkout must be absolute");
  if (fast) {
    if (resolve(workspace) !== resolve(entry.path))
      throw new Error("Fast integration must use its registered task checkout");
  } else {
    const parent = await containedPath(await primaryAddress(git, known), ".cache/worktrees");
    const prefix = ".integration-" + taskKey(entry.sessionId, entry.taskId).slice(0, 16) + "-";
    const name = basename(workspace);
    if (
      resolve(dirname(workspace)) !== resolve(parent) ||
      !name.startsWith(prefix) ||
      !/^[A-Za-z0-9_-]{6}$/u.test(name.slice(prefix.length))
    )
      throw new Error("Integration checkout is outside this task's owned candidate path");
  }
  if (
    (await lstat(workspace)).isSymbolicLink() ||
    resolve(await realpath(workspace)) !== resolve(workspace)
  )
    throw new Error("Integration checkout is redirected or belongs to another repository");
}
async function assertIntegrationBinding(
  git: Git,
  entry: ParallelEntry,
  observed: { readonly directory: string; readonly branch: string | null },
  fast: boolean,
  known?: ParallelLocations,
): Promise<void> {
  if ((await checkedParallelDirectory(observed.directory)) !== (await registryAddress(git, known)))
    throw new Error("Integration checkout is redirected or belongs to another repository");
  if (fast ? observed.branch !== entry.branch : observed.branch !== null)
    throw new Error("Integration requires the original task branch or a detached owned candidate");
}
/** Ordinary workflow calls retain their original fresh native query and ordering. */
export async function assertIntegrationWorkspace(
  git: Git,
  entry: ParallelEntry,
  workspace: string,
  candidate: Git,
  fast: boolean,
  known?: ParallelLocations,
): Promise<void> {
  await assertIntegrationLocation(git, entry, workspace, fast, known);
  const observed = await commonDirectoryAndBranch(candidate);
  await assertIntegrationBinding(git, entry, observed, fast, known);
}
/** Trusted host composition only: consume a fresh observation from this exact
 * constructor. Never persist it, accept it from configuration, or reuse it later. */
export async function assertObservedIntegrationWorkspace(
  git: Git,
  entry: ParallelEntry,
  workspace: string,
  observed: RepositoryObservation,
  fast: boolean,
  known: ParallelLocations,
): Promise<void> {
  if (resolve(observed.root) !== resolve(workspace))
    throw new Error("Observed integration checkout differs from its native repository root");
  await assertIntegrationLocation(git, entry, workspace, fast, known);
  await assertIntegrationBinding(git, entry, observed, fast, known);
}
export async function validateParallelTask(
  root: string,
  git: Git,
  task: Task,
  known?: ParallelLocations,
): Promise<ParallelEntry> {
  const entry = await loadParallelEntry(git, task.sessionId, task.taskId, known);
  if (
    !entry ||
    resolve(await realpath(root)) !== resolve(entry.path) ||
    task.snapshot.branch !== entry.branch ||
    task.snapshot.head !== entry.base ||
    task.snapshot.destination !== entry.destination ||
    (task.policyHash !== entry.policyHash &&
      (task.policyMigration?.previousHash !== entry.policyHash ||
        task.policyMigration.baseline !== entry.base))
  )
    throw new Error("Task does not match its original registered worktree and baseline");
  const expected = await containedPath(
    await primaryAddress(git, known),
    ".cache/worktrees/" + parallelName(entry.name, entry.sessionId, entry.taskId),
  );
  if (resolve(entry.path) !== resolve(expected) || (await lstat(entry.path)).isSymbolicLink())
    throw new Error("Task worktree escaped its registered location");
  return entry;
}
/** A missing task ref may be created only for the original registered published-main baseline. */
export async function publicationBaseline(root: string, git: Git, task: Task): Promise<void> {
  const known = task.snapshot.branch.startsWith("codex/")
    ? { registry: await parallelDirectory(git), primary: await primaryWorktree(git) }
    : undefined;
  if (known) await validateParallelTask(root, git, task, known);
  if (
    known &&
    (task.snapshot.remote !== "origin" ||
      task.snapshot.ref !== "refs/heads/" + task.snapshot.branch)
  )
    throw new Error("Registered publication requires its exact task ref on origin");
  const observed = known ? await remoteMainAndTaskOrAbsent(git, task.snapshot.branch) : undefined;
  const head = observed
    ? observed.source
    : await remoteHeadOrAbsent(git, task.snapshot.remote, task.snapshot.ref);
  if (head === task.snapshot.head) return;
  if (head !== null || !task.snapshot.branch.startsWith("codex/"))
    throw new Error("Remote differs from task baseline");
  await validateParallelTask(root, git, task, known);
  const main = observed?.main;
  if (!main) throw new Error("Cannot verify exact remote branch");
  // Exact equality proves this already-local baseline is currently published main.
  // Advanced main still needs a fetched object and a fresh ancestry observation.
  if (main === task.snapshot.head) return;
  await git(["fetch", "--no-tags", "origin", "refs/heads/main"]);
  if ((await remoteHead(git, "origin", "refs/heads/main")) !== main)
    throw new Error("Main changed during initial branch publication");
  await git(["merge-base", "--is-ancestor", task.snapshot.head, main]);
}
