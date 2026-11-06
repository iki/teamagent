import { Schema } from "effect";
import { ParallelPolicy, type Task } from "./model.ts";
import {
  destinationObservation,
  fileHash,
  GitObjectId,
  paths,
  readPolicy,
  remoteHead,
  verifyCommitSignature,
  type Git,
} from "./git.ts";
import { digest, taskKey } from "./storage.ts";
import { loadTask } from "./workflow.ts";
import {
  validateParallelTask,
  type ParallelEntry,
  type ParallelLocations,
} from "./parallel-store.ts";

export async function clean(git: Git): Promise<void> {
  if ((await git(["status", "--porcelain", "--untracked-files=all"])).trim())
    throw new Error("Task/integration checkout must be clean; unrelated work is preserved");
}
export async function exactPolicy(git: Git, commit: string, expected: string) {
  const raw = await git(["show", commit + ":.workflow.json"]);
  if (digest(raw) !== expected)
    throw new Error("Published main policy changed; reconcile before integration");
  return Schema.decodeUnknownSync(Schema.fromJsonString(ParallelPolicy))(raw, {
    onExcessProperty: "error",
  });
}
export async function sourceTask(
  entry: ParallelEntry,
  git: Git,
  known?: ParallelLocations,
): Promise<Task & { commit: string }> {
  const task = await loadTask(entry.path, entry.sessionId, entry.taskId);
  if (!task || task.state !== "pushed" || !task.commit || !task.checkpoint)
    throw new Error("Publish the complete reviewed task branch before integration");
  await validateParallelTask(entry.path, git, task, known);
  const policy = await readPolicy(entry.path);
  const observed = await destinationObservation(git, policy.policy);
  const target = observed.target;
  if (policy.hash !== task.policyHash || target.destination !== entry.destination)
    throw new Error("Task policy or destination changed after publication");
  if (
    target.branch !== entry.branch ||
    observed.head !== task.commit ||
    (await remoteHead(git, "origin", "refs/heads/" + entry.branch)) !== task.commit
  )
    throw new Error("Task branch differs from its confirmed publication");
  await clean(git);
  for (const [path, hash] of Object.entries(task.checkpoint.hashes))
    if ((await fileHash(entry.path, path)) !== hash) throw new Error("Published scope changed");
  if ((await fileHash(entry.path, task.checkpoint.archive)) !== task.checkpoint.archiveHash)
    throw new Error("Published conversation record changed");
  return { ...task, commit: task.commit };
}
export async function sourceCommits(
  git: Git,
  entry: ParallelEntry,
  task: Task & { commit: string },
  fingerprint: string,
): Promise<string[]> {
  Schema.decodeUnknownSync(GitObjectId)(task.commit);
  const raw = await git(["show", "-s", "--format=%H%x00%P%x00%B", task.commit]);
  if (Buffer.byteLength(raw) > 131072 || !raw.endsWith("\n"))
    throw new Error("Source commit observation exceeds bounds or lacks framing");
  const [commit, parent, message] = Schema.decodeUnknownSync(
    Schema.Tuple([
      GitObjectId,
      Schema.String.check(Schema.isMaxLength(1024)),
      Schema.String.check(Schema.isMaxLength(65536)),
    ]),
  )(raw.slice(0, -1).split("\0"), { onExcessProperty: "error" });
  // The exact object's sole parent proves both one-commit ancestry and absence of merges.
  if (commit !== task.commit || parent !== entry.base)
    throw new Error(
      "Each task must publish exactly one final signed commit; extra commits and merges require a separate task",
    );
  const trailer = "Teamagent-Task: " + taskKey(entry.sessionId, entry.taskId);
  if (
    message
      .split("\n")
      .filter((line) => line.startsWith("Teamagent-Task:"))
      .join("\n") !== trailer
  )
    throw new Error("Source history contains an unrelated task commit");
  await verifyCommitSignature(git, commit, fingerprint);
  const changed = paths(
    await git(["diff", "--name-only", "--no-renames", "-z", entry.base, task.commit]),
  );
  if (changed.some((path) => !task.checkpoint?.files.includes(path)))
    throw new Error("Source history changed files outside the published task scope");
  return [commit];
}
