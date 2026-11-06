import assert from "node:assert/strict";
import { test } from "node:test";
import { readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { loadTask, workflow } from "../app/workflow/workflow.ts";
import { fixture, identity } from "./workflow-fixture.ts";
import { parallelFixture, parallelIdentity } from "./parallel-workflow-fixture.ts";

const policy = (mode: "local" | "pr") =>
  JSON.stringify({
    version: 2,
    repository: "github.com/iki/teamagent",
    remote: "origin",
    ref: "refs/heads/main",
    mode,
  }) + "\n";

await test("explicit policy adoption preserves the original task and frozen archive and invalidates proof once", async () => {
  const f = await fixture();
  await f.prepare();
  const before = await loadTask(f.repo, identity.sessionId, identity.taskId);
  assert.ok(before?.checkpoint);
  assert.ok(before.verification);
  const archive = await readFile(join(f.repo, before.checkpoint.archive), "utf8");
  await writeFile(join(f.repo, ".workflow.json"), policy("local"));
  await f.call({ operation: "adopt-policy" });
  const adopted = await loadTask(f.repo, identity.sessionId, identity.taskId);
  assert.ok(adopted);
  assert.deepEqual(adopted.snapshot, before.snapshot);
  assert.deepEqual(adopted.checkpoint, before.checkpoint);
  assert.notEqual(adopted.policyHash, before.policyHash);
  assert.equal(adopted.verification, null);
  assert.equal(adopted.signingIdentity, null);
  assert.equal(await readFile(join(f.repo, before.checkpoint.archive), "utf8"), archive);
  await f.call({ operation: "adopt-policy" });
  assert.deepEqual(await loadTask(f.repo, identity.sessionId, identity.taskId), adopted);
  await writeFile(join(f.repo, ".workflow.json"), policy("pr"));
  await assert.rejects(f.call({ operation: "adopt-policy" }));
  assert.deepEqual(f.counts(), { commits: 0, pushes: 0 });
});

await test("a registered v2 task may adopt only a mode change without changing its original baseline", async () => {
  const f = await parallelFixture();
  const started = (await f.call({ operation: "start", name: "mode-change" })).entry;
  assert.ok(started);
  assert.ok(f.host.verification);
  const host = { git: f.git(started.path), verification: f.host.verification };
  await workflow(started.path, { ...parallelIdentity, operation: "begin" }, host);
  const before = await loadTask(started.path, parallelIdentity.sessionId, parallelIdentity.taskId);
  assert.ok(before);
  await writeFile(join(started.path, ".workflow.json"), policy("pr"));
  await workflow(started.path, { ...parallelIdentity, operation: "adopt-policy" }, host);
  const adopted = await loadTask(started.path, parallelIdentity.sessionId, parallelIdentity.taskId);
  assert.ok(adopted);
  assert.deepEqual(adopted.snapshot, before.snapshot);
  assert.notEqual(adopted.policyHash, before.policyHash);
  await writeFile(
    join(started.path, ".workflow.json"),
    policy("pr").replace("iki/teamagent", "other/project"),
  );
  await assert.rejects(
    workflow(started.path, { ...parallelIdentity, operation: "adopt-policy" }, host),
  );
});
