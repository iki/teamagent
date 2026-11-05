import { join } from "node:path";
import { Schema } from "effect";
import { freezeArchive } from "../conversations/archive.ts";
import {
  reviewInputIdentity,
  verifyStagedVerificationReceipts,
} from "../check/verification-cache.ts";
import { inspectLineEndings } from "../check/line-endings.ts";
import { verificationEnvironment } from "../check/tool-prerequisites.ts";
import {
  resolveVerificationWritePolicy,
  verificationWriteVariable,
  type VerificationWritePolicy,
} from "../check/verification-policy.ts";
import { inspectTextExports } from "../research/text-reports.ts";
import {
  atomicText,
  boundedText,
  containedPath,
  taskKey,
  withLock,
  workflowCapacity,
} from "./storage.ts";
import { Request, Task, validateMessage, type Verification } from "./model.ts";
import {
  changedPaths,
  checkedScope,
  destination,
  fileHash,
  gitAt,
  paths,
  publicPath,
  readPolicy,
  remoteHead,
  signingReady,
  snapshot,
  stageScope,
  verifyCommitSignature,
  worktreeTree,
  type Git,
} from "./git.ts";
import { diagnostic, runProcess } from "./process.ts";
import { checkpointHash, reviseCheckpoint } from "./revisions.ts";

export type VerificationHost = {
  identity(root: string): Promise<{ key: string }>;
  run(
    root: string,
    phase: "step" | "review" | "final",
    options?: { readonly receiptWritePolicy: VerificationWritePolicy },
  ): Promise<void>;
  staged(root: string): Promise<void>;
  live(root: string): Promise<void>;
};
export const verificationHost: VerificationHost = {
  identity: reviewInputIdentity,
  staged: verifyStagedVerificationReceipts,
  async live(root) {
    if (inspectLineEndings(root).violations.length)
      throw new Error("Live LF evidence check failed");
    await inspectTextExports(root);
  },
  async run(root, phase, options) {
    const policy =
      options?.receiptWritePolicy ??
      (phase === "final" ? "local" : resolveVerificationWritePolicy(process.env));
    await workflowCapacity(root, 20 * 1024 * 1024);
    const result = await runProcess(
      root,
      process.execPath,
      ["app/check/index.ts", phase === "step" ? "step" : "review"],
      {
        timeoutMs: 300_000,
        maximumBytes: 16 * 1024 * 1024,
        env: { ...(await verificationEnvironment(root)), [verificationWriteVariable]: policy },
      },
    );
    await atomicText(
      join(root, ".cache/workflow/verification.log"),
      diagnostic(result.stdout + result.stderr),
    );
    if (result.code !== 0 || result.outcome !== "exited")
      throw new Error(
        `Verification failed (${result.outcome}); inspect .cache/workflow/verification.log`,
      );
  },
};
const statePath = (session: string, task: string) =>
  `.cache/workflow/tasks/${taskKey(session, task)}.json`;
const Active = Schema.Struct({ sessionId: Schema.String, taskId: Schema.String });
export async function activeTask(root: string, sessionId: string): Promise<Task | null> {
  try {
    const input = Schema.decodeUnknownSync(Schema.fromJsonString(Active))(
      await boundedText(
        await containedPath(root, `.cache/workflow/active/${taskKey(sessionId, "active")}.json`),
        4096,
      ),
    );
    if (input.sessionId !== sessionId) throw new Error("Active task session mismatch");
    return await loadTask(root, input.sessionId, input.taskId);
  } catch (error) {
    if (error instanceof Error && "code" in error && error.code === "ENOENT") return null;
    throw error;
  }
}
export async function loadTask(root: string, session: string, task: string): Promise<Task | null> {
  try {
    const value = Schema.decodeUnknownSync(Schema.fromJsonString(Task))(
      await boundedText(await containedPath(root, statePath(session, task))),
    );
    if (value.sessionId !== session || value.taskId !== task)
      throw new Error("Task state identity mismatch");
    return value;
  } catch (error) {
    if (error instanceof Error && "code" in error && error.code === "ENOENT") return null;
    throw error;
  }
}
export async function saveTask(root: string, value: Task): Promise<void> {
  const content = JSON.stringify(Schema.decodeUnknownSync(Task)(value), null, 2) + "\n";
  if (Buffer.byteLength(content) > 8 * 1024 * 1024)
    throw new Error("Workflow state limit exceeded");
  await workflowCapacity(root, Buffer.byteLength(content) + 4096);
  await atomicText(await containedPath(root, statePath(value.sessionId, value.taskId)), content);
}
async function requireProof(
  root: string,
  git: Git,
  task: Task,
  verifier: VerificationHost,
): Promise<void> {
  const proof = task.verification;
  if (
    !proof ||
    Date.now() - proof.time < 0 ||
    Date.now() - proof.time > 30 * 60_000 ||
    proof.bun !== (process.versions.bun ?? "") ||
    proof.executable !== process.execPath ||
    proof.key !== (await verifier.identity(root)).key ||
    proof.tree !== (await worktreeTree(root, git))
  )
    throw new Error("Review proof missing, stale or different; run verification again");
  await verifier.live(root);
}
async function requireHooks(root: string, git: Git): Promise<void> {
  if ((await git(["config", "--get", "core.hooksPath"])).trim() !== ".githooks")
    throw new Error("Required Git hooks are not installed");
  for (const name of ["pre-commit", "commit-msg"])
    if (!(await boundedText(await containedPath(root, ".githooks/" + name), 16384)).trim())
      throw new Error("Required Git hook is empty");
}
function status(task: Task) {
  return {
    ok: true,
    state: task.state,
    taskId: task.taskId,
    baseline: task.snapshot.head,
    target: `${task.snapshot.remote}/${task.snapshot.branch}`,
    files: task.checkpoint?.files ?? [],
    archive: task.checkpoint?.archive ?? null,
    checkpointHash: task.checkpoint ? checkpointHash(task.checkpoint) : null,
    revisionReceipt: task.latestRevision?.receipt ?? null,
    commit: task.commit,
    failure: task.failure,
  };
}

/** Host-only workflow: publication authority comes from the committed policy, never request options. */
export async function workflow(
  root: string,
  input: unknown,
  host: { git?: Git; verification?: VerificationHost; persist?: typeof saveTask } = {},
): Promise<ReturnType<typeof status>> {
  const request = Schema.decodeUnknownSync(Request)(input, { onExcessProperty: "error" });
  if (request.operation === "status") {
    const task = await loadTask(root, request.sessionId, request.taskId);
    if (!task) throw new Error("Task state is not registered");
    return status(task);
  }
  const git = host.git ?? gitAt(root);
  const verifier = host.verification ?? verificationHost;
  return await withLock(await containedPath(root, ".cache/workflow/.lock"), async () => {
    let task = await loadTask(root, request.sessionId, request.taskId);
    const save = async (next: Task) => {
      task = next;
      await (host.persist ?? saveTask)(root, next);
    };
    if (request.operation === "begin") {
      if (task) return status(task);
      const active = await activeTask(root, request.sessionId);
      if (
        active &&
        active.taskId !== request.taskId &&
        !["pushed", "cancelled"].includes(active.state)
      )
        throw new Error(
          "Another logical task remains active; finish or explicitly cancel it first",
        );
      const configured = await readPolicy(root);
      const initial: Task = {
        version: 1,
        sessionId: request.sessionId,
        taskId: request.taskId,
        snapshot: await snapshot(root, git, configured.policy),
        policyHash: configured.hash,
        state: "open",
        checkpoint: null,
        verification: null,
        signingIdentity: null,
        commit: null,
        failure: null,
      };
      await save(initial);
      await atomicText(
        await containedPath(
          root,
          `.cache/workflow/active/${taskKey(request.sessionId, "active")}.json`,
        ),
        JSON.stringify({ sessionId: request.sessionId, taskId: request.taskId }) + "\n",
      );
      return status(initial);
    }
    if (!task) throw new Error("Begin the task before changing files; no baseline is inferred");
    if (request.operation === "cancel") {
      if (!["open", "checkpointed", "ready"].includes(task.state))
        throw new Error("A started publication requires reconciliation, not cancellation");
      const next: Task = { ...task, state: "cancelled" };
      await save(next);
      return status(next);
    }
    if (request.operation === "revise-checkpoint")
      return status(await reviseCheckpoint(root, git, task, request, save));
    if (request.operation === "checkpoint") {
      if (task.state !== "open")
        throw new Error("Task checkpoint is already frozen or publication started");
      if (
        request.record.sessionId !== request.sessionId ||
        (request.record.taskId ?? request.record.turnId) !== request.taskId ||
        request.record.agent !== "codex"
      )
        throw new Error("Checkpoint record belongs to another root task");
      validateMessage(request.message);
      const approved = request.approvedExistingFiles ?? [];
      const files = [...request.files];
      if (files.length >= 10000)
        throw new Error("Checkpoint scope must leave one slot for its archive");
      if (new Set(files).size !== files.length || approved.some((path) => !files.includes(path)))
        throw new Error("Duplicate scope or invalid existing-file adoption");
      let sourceChanges = false;
      const changed = new Set(await changedPaths(git));
      if ([...changed].some((path) => !files.includes(path)))
        throw new Error(
          "Unscoped worktree changes prevent an exact verified commit; isolate the task or explicitly adopt authorized paths before checkpointing",
        );
      for (const path of files) {
        publicPath(path);
        if (task.snapshot.changes[path] !== undefined && !approved.includes(path))
          throw new Error("Pre-existing change needs an explicit scope decision");
        if (
          !path.startsWith("spec/.conversations/") &&
          (await fileHash(root, path)) !== task.snapshot.changes[path] &&
          changed.has(path)
        )
          sourceChanges = true;
      }
      if (!sourceChanges)
        throw new Error(
          "No task-owned repository content changed; no archive or publication needed",
        );
      const frozen = await freezeArchive(root, { ...request.record, taskId: request.taskId });
      if (!files.includes(frozen.archive)) files.push(frozen.archive);
      const hashes: Record<string, string> = {};
      for (const path of files) hashes[path] = await fileHash(root, path);
      const next: Task = {
        ...task,
        checkpoint: {
          ...frozen,
          message: request.message,
          files,
          approvedExistingFiles: approved,
          hashes,
        },
        verification: null,
        state: "checkpointed",
      };
      await checkedScope(root, git, next);
      await save(next);
      return status(next);
    }
    if (request.operation === "verify") {
      if (!["open", "checkpointed", "ready"].includes(task.state))
        throw new Error("Publication state cannot be verified into a new attempt");
      for (const name of ["format", "types", "lint", "tests"]) {
        const path = `.verification/verification-${name}.json`;
        if (
          task.snapshot.changes[path] !== undefined &&
          !task.checkpoint?.approvedExistingFiles.includes(path)
        )
          throw new Error(
            "Pre-existing verification receipt needs explicit checkpoint adoption before verification",
          );
      }
      const before = await verifier.identity(root);
      const head = (await git(["rev-parse", "HEAD"])).trim();
      await save({
        ...task,
        verification: null,
        state: task.state === "ready" ? "checkpointed" : task.state,
      });
      await verifier.run(root, request.phase);
      const after = await verifier.identity(root);
      if (
        request.phase !== "step" &&
        (before.key !== after.key || head !== (await git(["rev-parse", "HEAD"])).trim())
      )
        throw new Error("Verification inputs changed while checks ran");
      let checkpoint = task.checkpoint;
      if (checkpoint && request.phase !== "step") {
        const files = [...checkpoint.files];
        const hashes = { ...checkpoint.hashes };
        const changed = new Set(await changedPaths(git));
        for (const name of ["format", "types", "lint", "tests"]) {
          const path = `.verification/verification-${name}.json`;
          if (changed.has(path)) {
            if (!files.includes(path)) files.push(path);
            hashes[path] = await fileHash(root, path);
          }
        }
        checkpoint = { ...checkpoint, files, hashes };
      }
      const proof: typeof Verification.Type | null =
        request.phase === "step"
          ? null
          : {
              key: after.key,
              tree: await worktreeTree(root, git),
              time: Date.now(),
              bun: process.versions.bun ?? "",
              executable: process.execPath,
            };
      const next: Task = { ...task, checkpoint, verification: proof };
      await save(next);
      return status(next);
    }
    if (request.operation === "prepare") {
      if (task.state !== "checkpointed" && task.state !== "ready")
        throw new Error("Freeze the task checkpoint first");
      await checkedScope(root, git, task);
      await requireProof(root, git, task, verifier);
      await requireHooks(root, git);
      if ((await remoteHead(git, task.snapshot.remote, task.snapshot.ref)) !== task.snapshot.head)
        throw new Error("Remote differs from task baseline");
      const next: Task = {
        ...task,
        signingIdentity: (await signingReady(root, git)).identity,
        state: "ready",
      };
      await save(next);
      return status(next);
    }
    if (task.state === "pushed") {
      if (
        !task.commit ||
        (await git(["rev-parse", "HEAD"])).trim() !== task.commit ||
        (await remoteHead(git, task.snapshot.remote, task.snapshot.ref)) !== task.commit
      )
        throw new Error("Previously published state changed; reconcile before reporting success");
      return status(task);
    }
    if (task.state !== "ready" || !task.checkpoint)
      throw new Error(
        "Only a fresh prepared task can publish; reconcile previous attempts, never blindly retry",
      );
    await checkedScope(root, git, task);
    await requireProof(root, git, task, verifier);
    await requireHooks(root, git);
    const expectedSigner = await signingReady(root, git);
    if (expectedSigner.identity !== task.signingIdentity)
      throw new Error("Signing identity changed since preparation");
    // Revalidate authorization here even when prepare was never called by this process.
    await destination(git, (await readPolicy(root)).policy);
    if ((await remoteHead(git, task.snapshot.remote, task.snapshot.ref)) !== task.snapshot.head)
      throw new Error("Remote changed before publication");
    const checkpoint = task.checkpoint;
    await workflowCapacity(root, 64 * 1024 * 1024);
    try {
      await save({ ...task, state: "committing" });
      await stageScope(root, git, checkpoint.files);
      const staged = paths(await git(["diff", "--cached", "--name-only", "--no-renames", "-z"]));
      if (!staged.length || staged.some((path) => !checkpoint.files.includes(path)))
        throw new Error("Staged scope is empty or unrelated");
      await checkedScope(root, git, task);
      await verifier.staged(root);
      const tree = (await git(["write-tree"])).trim();
      if (tree !== task.verification?.tree)
        throw new Error("Staged tree differs from verified tree");
      if ((await signingReady(root, git)).identity !== task.signingIdentity)
        throw new Error("Signing identity changed before commit");
      await git(
        ["commit", "--gpg-sign", "--file=-"],
        checkpoint.message + "\n\nTeamagent-Task: " + taskKey(task.sessionId, task.taskId) + "\n",
      );
      const commit = (await git(["rev-parse", "HEAD"])).trim();
      await save({ ...task, state: "committed", commit });
      if (
        (await git(["rev-parse", "HEAD^{tree}"])).trim() !== tree ||
        (await git(["rev-parse", "HEAD^"])).trim() !== task.snapshot.head
      )
        throw new Error("Committed tree or parent changed");
      await verifyCommitSignature(git, commit, expectedSigner.fingerprint);
      await checkedScope(root, git, task, false);
      if ((await signingReady(root, git)).identity !== task.signingIdentity)
        throw new Error("Signing trust changed during commit");
      if ((await remoteHead(git, task.snapshot.remote, task.snapshot.ref)) !== task.snapshot.head)
        throw new Error("Remote changed after commit; local commit retained");
      await save({ ...task, state: "pushing" });
      await git([
        "-c",
        "push.followTags=false",
        "-c",
        "push.recurseSubmodules=no",
        "push",
        "--porcelain",
        task.snapshot.remote,
        `${commit}:${task.snapshot.ref}`,
      ]);
      if ((await remoteHead(git, task.snapshot.remote, task.snapshot.ref)) !== commit)
        throw new Error("Remote publication is not confirmed");
      const next: Task = { ...task, state: "pushed", commit };
      await save(next);
      return status(next);
    } catch (error) {
      const latest = await loadTask(root, task.sessionId, task.taskId);
      if (latest)
        await save({
          ...latest,
          state:
            latest.state === "committing" || latest.state === "pushing" ? "uncertain" : "failed",
          failure: diagnostic(error instanceof Error ? error.message : "Publication failed").slice(
            0,
            1000,
          ),
        });
      throw new Error(
        "Publication stopped; inspect task status and Git state before reconciliation. No automatic retry.",
      );
    }
  });
}
