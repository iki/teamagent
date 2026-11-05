import assert from "node:assert/strict";
import { test } from "node:test";
import { mkdir, readFile, readdir, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { loadTask, saveTask } from "../app/workflow/workflow.ts";
import { digest } from "../app/workflow/storage.ts";
import { fixture, fixtureVerifier, identity } from "./workflow-fixture.ts";

await test("ambiguous commit outcome persists and cannot be blindly retried or cancelled", async () => {
  const f = await fixture();
  await f.prepare();
  f.makeUncertain();
  await assert.rejects(f.call({ operation: "publish" }), /No automatic retry/);
  assert.equal((await loadTask(f.repo, identity.sessionId, identity.taskId))?.state, "uncertain");
  await assert.rejects(f.call({ operation: "publish" }), /reconcile/);
  await assert.rejects(f.call({ operation: "cancel" }), /reconciliation/);
  assert.deepEqual(f.counts(), { commits: 1, pushes: 0 });
});

await test("explicit checkpoint revision repairs a failed final check without replacing baseline or frozen public text", async () => {
  let failVerification = false;
  const f = await fixture({
    ...fixtureVerifier,
    async run() {
      if (failVerification) throw new Error("Fixture verification failed");
    },
  });
  await f.prepare();
  const original = await loadTask(f.repo, identity.sessionId, identity.taskId);
  assert.ok(original?.checkpoint);
  const archiveBytes = await readFile(join(f.repo, original.checkpoint.archive));
  failVerification = true;
  await assert.rejects(
    f.call({ operation: "verify", phase: "final" }),
    /Fixture verification failed/,
  );
  await writeFile(join(f.repo, "owned.txt"), "repaired\n");
  await writeFile(join(f.repo, "regression.txt"), "new regression fixture\n");
  failVerification = false;
  const before = await f.call({ operation: "status" });
  const request = {
    operation: "revise-checkpoint",
    revisionId: "repair-1",
    expectedCheckpointHash: before.checkpointHash,
    reason: "Repair the final verification failure",
    files: [...before.files, "regression.txt"],
  };
  const revised = await f.call(request);
  assert.equal(revised.state, "checkpointed");
  assert.notEqual(revised.checkpointHash, before.checkpointHash);
  assert.ok(revised.revisionReceipt);
  const receipt = await readFile(join(f.repo, revised.revisionReceipt), "utf8");
  const current = await loadTask(f.repo, identity.sessionId, identity.taskId);
  assert.ok(current?.checkpoint);
  assert.deepEqual(current.snapshot, original.snapshot);
  assert.equal(current.checkpoint.message, original.checkpoint.message);
  assert.equal(current.checkpoint.archiveHash, original.checkpoint.archiveHash);
  assert.equal(current.verification, null);
  assert.equal(current.signingIdentity, null);
  assert.deepEqual(await readFile(join(f.repo, current.checkpoint.archive)), archiveBytes);
  await assert.rejects(f.call({ operation: "publish" }), /fresh prepared task/);
  assert.deepEqual(await f.call(request), revised);
  assert.equal(await readFile(join(f.repo, revised.revisionReceipt), "utf8"), receipt);
  await assert.rejects(f.call({ ...request, reason: "Different repair" }), /does not match/);
  await assert.rejects(f.call({ ...request, revisionId: "stale-repair" }), /revision is stale/);
  await f.call({ operation: "verify", phase: "final" });
  await f.call({ operation: "prepare" });
  assert.equal((await f.call({ operation: "publish" })).state, "pushed");
  assert.deepEqual(f.counts(), { commits: 1, pushes: 1 });
  await assert.rejects(f.call(request), /only before publication/);
});

await test("checkpoint revision resumes retained receipts after interrupted state persistence", async () => {
  let failure: "before" | "after" | null = null;
  const f = await fixture(fixtureVerifier, async (root, task) => {
    if (task.latestRevision && failure === "before") {
      failure = null;
      throw new Error("Fixture interrupted before state persistence");
    }
    await saveTask(root, task);
    if (task.latestRevision && failure === "after") {
      failure = null;
      throw new Error("Fixture interrupted after state persistence");
    }
  });
  await f.prepare();
  for (const point of ["before", "after"] as const) {
    const before = await f.call({ operation: "status" });
    await writeFile(join(f.repo, "owned.txt"), `repair-${point}\n`);
    const request = {
      operation: "revise-checkpoint",
      revisionId: point,
      expectedCheckpointHash: before.checkpointHash,
      reason: `Repair ${point} interruption`,
      files: before.files,
    };
    failure = point;
    await assert.rejects(f.call(request), /Fixture interrupted/);
    const failed = await f.call({ operation: "status" });
    if (point === "before") assert.equal(failed.checkpointHash, before.checkpointHash);
    else assert.notEqual(failed.checkpointHash, before.checkpointHash);
    const resumed = await f.call(request);
    assert.equal(resumed.state, "checkpointed");
    assert.ok(resumed.revisionReceipt);
    const receipt = await readFile(join(f.repo, resumed.revisionReceipt), "utf8");
    assert.deepEqual(await f.call(request), resumed);
    assert.equal(await readFile(join(f.repo, resumed.revisionReceipt), "utf8"), receipt);
  }
  assert.deepEqual(f.counts(), { commits: 0, pushes: 0 });
});

await test("checkpoint revision rejects altered archives, unscoped changes and post-publication states", async () => {
  const f = await fixture();
  await f.prepare();
  const status = await f.call({ operation: "status" });
  const original = await loadTask(f.repo, identity.sessionId, identity.taskId);
  assert.ok(original?.checkpoint);
  const archive = join(f.repo, original.checkpoint.archive);
  const text = await readFile(archive, "utf8");
  const request = {
    operation: "revise-checkpoint",
    revisionId: "blocked",
    expectedCheckpointHash: status.checkpointHash,
    reason: "Repair",
    files: status.files,
  };
  await writeFile(archive, text + "tampered\n");
  await assert.rejects(f.call(request), /Frozen archive changed/);
  await writeFile(archive, text);
  await writeFile(join(f.repo, "owned.txt"), "repair\n");
  await assert.rejects(f.call({ ...request, files: [original.checkpoint.archive] }), /Unscoped/);
  await assert.rejects(f.call({ ...request, message: "fix: Change frozen message" }));
  for (const state of [
    "open",
    "committing",
    "committed",
    "pushing",
    "pushed",
    "uncertain",
    "failed",
    "cancelled",
  ] as const) {
    await saveTask(f.repo, { ...original, state });
    await assert.rejects(f.call(request), /only before publication/);
  }
  assert.deepEqual(f.counts(), { commits: 0, pushes: 0 });
});

await test("checkpoint revision requires renewed adoption of pre-existing files and retains bounded history", async () => {
  const f = await fixture();
  await writeFile(join(f.repo, "existing.txt"), "pre-existing\n");
  await f.prepare({
    files: ["owned.txt", "existing.txt"],
    approvedExistingFiles: ["existing.txt"],
  });
  const status = await f.call({ operation: "status" });
  await writeFile(join(f.repo, "owned.txt"), "repair\n");
  const request = {
    operation: "revise-checkpoint",
    revisionId: "bounded",
    expectedCheckpointHash: status.checkpointHash,
    reason: "Repair",
    files: status.files,
  };
  await assert.rejects(f.call(request), /Pre-existing change/);
  const revisions = join(
    f.repo,
    ".cache/workflow/revisions",
    digest(JSON.stringify([identity.sessionId, identity.taskId])),
  );
  await mkdir(revisions, { recursive: true });
  for (let index = 0; index < 64; index++)
    await writeFile(join(revisions, `${index.toString(16).padStart(64, "0")}.json`), "{}\n");
  await assert.rejects(
    f.call({ ...request, approvedExistingFiles: ["existing.txt"] }),
    /revision count limit/,
  );
  assert.equal((await readdir(revisions)).length, 64);
  assert.equal((await f.call({ operation: "status" })).checkpointHash, status.checkpointHash);
});
