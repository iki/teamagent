import { mkdtemp } from "./temporary.ts";
import assert from "node:assert/strict";
import { test } from "node:test";
import { chmod, mkdir, readFile, readdir, writeFile } from "node:fs/promises";
import { hostname } from "node:os";
import { join, resolve } from "node:path";
import { workflow, loadTask, saveTask, type VerificationHost } from "../app/workflow/workflow.ts";
import {
  gitEnvironment,
  GitFailure,
  publicPath,
  stageScope,
  type Git,
} from "../app/workflow/git.ts";
import { runProcess, diagnostic } from "../app/workflow/process.ts";
import { boundedText, digest, withLock, workflowCapacity } from "../app/workflow/storage.ts";

const identity = { sessionId: "fixture-session", taskId: "fixture-task" };
async function directory() {
  await mkdir(".cache/conversations", { recursive: true });
  return await mkdtemp(resolve(".cache/conversations/test-workflow-"));
}
const fixtureVerifier: VerificationHost = {
  async identity(root) {
    return { key: digest(await readFile(join(root, "owned.txt"), "utf8")) };
  },
  async run() {},
  async staged() {},
  async live() {},
};
function fixtureGit(root: string, template: string): Git {
  return async (args, input, index) => {
    const nullFile = process.platform === "win32" ? "NUL" : "/dev/null";
    const result = await runProcess(
      root,
      "git",
      ["-c", "core.fsmonitor=false", "-c", `core.attributesFile=${nullFile}`, ...args],
      {
        ...(input === undefined ? {} : { input }),
        timeoutMs: args.includes("commit") ? 600_000 : 60_000,
        env: {
          ...gitEnvironment(index),
          GIT_CONFIG_NOSYSTEM: "1",
          GIT_CONFIG_GLOBAL: nullFile,
          GIT_ATTR_NOSYSTEM: "1",
          GIT_TEMPLATE_DIR: template,
        },
      },
    );
    const detail = diagnostic(result.stderr).slice(-4000);
    assert.equal(result.outcome, "exited", `Fixture Git did not exit normally: ${detail}`);
    assert.equal(result.code, 0, `Fixture Git failed: ${detail}`);
    return result.stdout;
  };
}
function fixtureConfigValue(value: string): string {
  assert.ok(!/[\0\r]/u.test(value), "Fixture Git configuration excludes NUL and CR");
  return `"${value
    .replace(/\\/gu, "\\\\")
    .replace(/"/gu, '\\"')
    .replace(/\n/gu, "\\n")
    .replace(/\t/gu, "\\t")}"`;
}
async function fixture(verifier = fixtureVerifier, persist?: typeof saveTask) {
  const root = await directory();
  const bare = join(root, "remote.git");
  const repo = join(root, "repo");
  const template = join(root, "empty-git-template");
  await mkdir(repo);
  await mkdir(template);
  const git = fixtureGit(repo, template);
  await git(["init", "--bare", bare]);
  const key = join(root, "signing");
  const keygen =
    process.platform === "win32" ? "C:/Windows/System32/OpenSSH/ssh-keygen.exe" : "ssh-keygen";
  const generated = await runProcess(root, keygen, ["-q", "-t", "ed25519", "-N", "", "-f", key]);
  assert.equal(generated.code, 0, "Generate isolated fixture signing key");
  const allowed = join(root, "allowed-signers");
  await writeFile(
    allowed,
    "fixture@example.invalid " + (await readFile(key + ".pub", "utf8")).trim() + "\n",
  );
  // The bare remote received the empty template. Only this working checkout receives
  // fixture-owned configuration; verify Git's parsed values in one process below.
  const settings = [
    ["user", "name", "Workflow Fixture"],
    ["user", "email", "fixture@example.invalid"],
    ["user", "signingkey", key],
    ["core", "autocrlf", "false"],
    ["core", "hooksPath", ".githooks"],
    ["commit", "gpgsign", "true"],
    ["gpg", "format", "ssh"],
    ['gpg "ssh"', "program", keygen],
    ['gpg "ssh"', "allowedSignersFile", allowed],
    ["teamagent", "bunPath", process.execPath],
  ] as const;
  await writeFile(
    join(template, "config"),
    settings
      .map(([section, name, value]) => `[${section}]\n\t${name} = ${fixtureConfigValue(value)}\n`)
      .join(""),
  );
  await git(["init", "-b", "main"]);
  const configured = (await git(["config", "--null", "--list", "--local"])).split("\0");
  for (const [section, name, value] of settings) {
    const keyName = `${section.replace(' "ssh"', ".ssh")}.${name}`.toLowerCase();
    assert.deepEqual(
      configured.filter((entry) => entry.startsWith(`${keyName}\n`)),
      [`${keyName}\n${value}`],
      `Exact isolated Git setting: ${keyName}`,
    );
  }
  await writeFile(join(repo, ".gitignore"), ".cache/\n", "utf8");
  await writeFile(
    join(repo, ".workflow.json"),
    JSON.stringify({
      version: 1,
      repository: "github.com/iki/teamagent",
      remote: "origin",
      ref: "refs/heads/main",
    }) + "\n",
  );
  await writeFile(join(repo, "owned.txt"), "before\n");
  await writeFile(join(repo, "retired.txt"), "historical fixture\n");
  await mkdir(join(repo, ".githooks"));
  for (const name of ["pre-commit", "commit-msg"]) {
    const path = join(repo, ".githooks", name);
    await writeFile(path, "#!/bin/sh\nexit 0\n");
    await chmod(path, 0o755);
  }
  await git(["add", "."]);
  await git(["-c", "commit.gpgsign=false", "commit", "-m", "test: Initialize fixture"]);
  await git(["remote", "add", "origin", bare]);
  await git(["push", "-u", "origin", "main"]);
  let remoteAllowed = true,
    commits = 0,
    pushes = 0,
    uncertainCommit = false;
  // Only the fixture remote-identity observation is substituted; real Git commits/signatures/pushes use the local bare repository.
  const port: Git = async (args, input, index) => {
    if (args[0] === "remote" && args[1] === "get-url")
      return remoteAllowed
        ? "https://github.com/iki/teamagent.git\n"
        : "https://example.invalid/other.git\n";
    if (args[0] === "commit") {
      commits++;
      if (uncertainCommit)
        throw new GitFailure({ code: null, outcome: "transport", stdout: "", stderr: "" });
    }
    if (args.includes("push")) pushes++;
    return await git(args, input, index);
  };
  const host = { git: port, verification: verifier, ...(persist ? { persist } : {}) };
  const call = (request: Record<string, unknown>) =>
    workflow(repo, { ...identity, ...request }, host);
  const prepare = async (scope: { files?: string[]; approvedExistingFiles?: string[] } = {}) => {
    await call({ operation: "begin" });
    await writeFile(join(repo, "owned.txt"), "after\n");
    await call({
      operation: "checkpoint",
      files: scope.files ?? ["owned.txt"],
      approvedExistingFiles: scope.approvedExistingFiles ?? [],
      message: "test: Exercise signed workflow",
      record: {
        ...identity,
        turnId: "turn",
        agent: "codex",
        model: "fixture",
        reasoning: "fixture",
        date: "2026-10-28T12:00:00Z",
        description: "Workflow fixture",
        prompt: "Change fixture",
        response: "Changed and checked.",
        processingLog: [],
      },
    });
    await call({ operation: "verify", phase: "review" });
    await call({ operation: "prepare" });
  };
  return {
    repo,
    allowed,
    git,
    call,
    prepare,
    counts: () => ({ commits, pushes }),
    denyRemote: () => {
      remoteAllowed = false;
    },
    makeUncertain: () => {
      uncertainCommit = true;
    },
  };
}

await test("workflow publishes a real SSH-signed fixture commit once and verifies its remote", async () => {
  const f = await fixture();
  await f.prepare();
  await withLock(join(f.repo, ".cache/workflow/.lock"), async () => {
    assert.equal((await f.call({ operation: "status" })).state, "ready");
  });
  const result = await f.call({ operation: "publish" });
  assert.equal(result.state, "pushed");
  assert.ok(result.commit);
  assert.equal((await f.git(["show", "-s", "--format=%G?", "HEAD"])).trim(), "G");
  await f.git(["verify-commit", "HEAD"]);
  assert.deepEqual(f.counts(), { commits: 1, pushes: 1 });
  assert.equal((await f.call({ operation: "publish" })).commit, result.commit);
  assert.deepEqual(f.counts(), { commits: 1, pushes: 1 });
});

await test("workflow preserves a pre-staged deletion while publishing new files with its verified signature", async () => {
  const f = await fixture();
  await f.call({ operation: "begin" });
  await f.git(["rm", "--", "retired.txt"]);
  await writeFile(join(f.repo, "added.txt"), "new reviewed file\n");
  assert.equal((await f.git(["diff", "--cached", "--name-status"])).trim(), "D\tretired.txt");
  await f.prepare({ files: ["owned.txt", "retired.txt", "added.txt"] });
  const prepared = await loadTask(f.repo, identity.sessionId, identity.taskId);
  assert.ok(prepared?.verification);
  const result = await f.call({ operation: "publish" });
  assert.equal(result.state, "pushed");
  assert.equal((await f.git(["rev-parse", "HEAD^{tree}"])).trim(), prepared.verification.tree);
  assert.equal(await f.git(["ls-files", "--", "retired.txt"]), "");
  assert.equal(await f.git(["show", "HEAD:added.txt"]), "new reviewed file\n");
  assert.equal(await f.git(["show", "HEAD:owned.txt"]), "after\n");
  assert.equal((await f.git(["show", "-s", "--format=%G?", "HEAD"])).trim(), "G");
  await f.git(["verify-commit", "HEAD"]);
  assert.deepEqual(f.counts(), { commits: 1, pushes: 1 });
  assert.equal(await f.git(["status", "--porcelain"]), "");
});

await test("publication rechecks disabled signing and forbidden destinations at its mutation boundary", async () => {
  const f = await fixture();
  await f.prepare();
  await f.git(["config", "commit.gpgsign", "false"]);
  await assert.rejects(f.call({ operation: "publish" }), /Signed SSH/);
  assert.deepEqual(f.counts(), { commits: 0, pushes: 0 });
  await f.git(["config", "commit.gpgsign", "true"]);
  f.denyRemote();
  await assert.rejects(f.call({ operation: "publish" }), /outside the approved/);
  assert.deepEqual(f.counts(), { commits: 0, pushes: 0 });
});

await test("publication invalidates changed signer trust and rechecks ignored live evidence", async () => {
  let evidenceValid = true;
  const f = await fixture({
    ...fixtureVerifier,
    async live() {
      if (!evidenceValid) throw new Error("Live evidence changed");
    },
  });
  await f.prepare();
  evidenceValid = false;
  await assert.rejects(f.call({ operation: "publish" }), /Live evidence changed/);
  evidenceValid = true;
  await writeFile(f.allowed, (await readFile(f.allowed, "utf8")) + "# changed trust\n");
  await assert.rejects(f.call({ operation: "publish" }), /Signing identity changed/);
  assert.deepEqual(f.counts(), { commits: 0, pushes: 0 });
});

await test("unrelated initial dirt is preserved and rejected before archive freeze", async () => {
  const f = await fixture();
  const unrelated = join(f.repo, "unrelated.txt");
  await writeFile(unrelated, "existing work\n");
  await assert.rejects(f.prepare(), /Unscoped worktree changes/);
  assert.equal((await f.call({ operation: "status" })).state, "open");
  assert.equal(await readFile(unrelated, "utf8"), "existing work\n");
  await assert.rejects(readdir(join(f.repo, "spec/.conversations")), { code: "ENOENT" });
  assert.deepEqual(f.counts(), { commits: 0, pushes: 0 });
});

await test("managed receipts already dirty at begin require explicit adoption", async () => {
  const f = await fixture();
  await mkdir(join(f.repo, ".verification"));
  const receipt = join(f.repo, ".verification/verification-tests.json");
  await writeFile(receipt, "existing user evidence\n");
  await f.call({ operation: "begin" });
  await assert.rejects(
    f.call({ operation: "verify", phase: "review" }),
    /explicit checkpoint adoption/,
  );
  assert.equal(await readFile(receipt, "utf8"), "existing user evidence\n");
});

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

await test("frozen scope and unrelated partial staging cannot bypass publication checks", async () => {
  const f = await fixture();
  await f.prepare();
  await writeFile(join(f.repo, "unrelated.txt"), "private user work\n");
  await f.git(["add", "unrelated.txt"]);
  await assert.rejects(f.call({ operation: "publish" }), /Unrelated staged/);
  assert.deepEqual(f.counts(), { commits: 0, pushes: 0 });
  await f.git(["reset", "--", "unrelated.txt"]);
  await writeFile(join(f.repo, "owned.txt"), "changed after review\n");
  await assert.rejects(f.call({ operation: "publish" }), /Unreviewed|Checkpoint/);
});

await test("live, foreign and dead lock owners require explicit recovery and are never stolen", async () => {
  const root = await directory();
  const lock = join(root, "lock");
  await mkdir(lock);
  for (const owner of [
    { token: "live", pid: process.pid, hostname: hostname(), startedAt: 0 },
    { token: "foreign", pid: 999999, hostname: "other-host", startedAt: 0 },
    { token: "dead", pid: 999999, hostname: hostname(), startedAt: 0 },
  ]) {
    await writeFile(join(lock, "owner.json"), JSON.stringify(owner) + "\n");
    await assert.rejects(
      withLock(lock, async () => assert.fail("Lock stolen"), 30),
      /locked/,
    );
    assert.ok((await readFile(join(lock, "owner.json"), "utf8")).includes(owner.token));
  }
});

await test("workflow aggregate cache bounds reject new writes without deleting evidence", async () => {
  const root = await directory();
  const cache = join(root, ".cache/workflow");
  await mkdir(cache, { recursive: true });
  const evidence = join(cache, "evidence.json");
  await writeFile(evidence, "existing evidence\n");
  await assert.rejects(workflowCapacity(root, 100, { bytes: 110 }), /capacity reached/);
  await assert.rejects(workflowCapacity(root, 0, { files: 1 }), /capacity reached/);
  assert.equal(await readFile(evidence, "utf8"), "existing evidence\n");
});

await test("process time, total output, long lines and cancellation are bounded", async () => {
  const root = await directory();
  const hang = join(root, "hang.ts"),
    flood = join(root, "flood.ts");
  await writeFile(hang, "setInterval(() => {}, 1000);\n");
  await writeFile(flood, "process.stdout.write('x'.repeat(200000));\n");
  assert.equal(
    (await runProcess(root, process.execPath, [hang], { timeoutMs: 150 })).outcome,
    "timeout",
  );
  assert.equal(
    (await runProcess(root, process.execPath, [flood], { maximumBytes: 1000 })).outcome,
    "output-limit",
  );
  assert.equal(
    (await runProcess(root, process.execPath, [flood], { maximumLineBytes: 1000 })).outcome,
    "output-limit",
  );
  const abort = new AbortController();
  abort.abort();
  assert.equal(
    (await runProcess(root, process.execPath, [hang], { signal: abort.signal })).outcome,
    "cancelled",
  );
  const file = join(root, "large.txt");
  await writeFile(file, "large");
  await assert.rejects(boundedText(file, 2), /oversized/);
  for (const path of ["../outside", ".env.local", ".cache/private.json", "private.key"])
    assert.throws(() => publicPath(path));
  let gitCalls = 0;
  const untouchedGit: Git = async () => {
    gitCalls++;
    return "";
  };
  await assert.rejects(stageScope(root, untouchedGit, ["large.txt", ".env.local"]), /Private/);
  await assert.rejects(stageScope(root, untouchedGit, ["large.txt", "large.txt"]), /duplicate/);
  assert.equal(gitCalls, 0);
  assert.equal(
    diagnostic("Bearer sensitive https://user:password@example.com/path?token=secret#private\r\n"),
    "Bearer [redacted] https://example.com/path\n",
  );
});

await test("process timeout terminates its child tree instead of leaving inherited pipes open", async () => {
  const root = await directory();
  await writeFile(join(root, "child.ts"), "setInterval(() => {}, 1000);\n");
  await writeFile(
    join(root, "parent.ts"),
    "import { spawn } from 'node:child_process';\nimport { writeFileSync } from 'node:fs';\nconst child = spawn(process.execPath, ['child.ts'], { stdio: 'inherit', windowsHide: true });\nwriteFileSync('child.pid', String(child.pid) + '\\n');\nsetInterval(() => {}, 1000);\n",
  );
  const began = Date.now();
  const result = await runProcess(root, process.execPath, ["parent.ts"], { timeoutMs: 1000 });
  assert.equal(result.outcome, "timeout");
  assert.equal(result.termination, "closed");
  assert.ok(Date.now() - began < 6000);
  const pid = Number((await readFile(join(root, "child.pid"), "utf8")).trim());
  assert.ok(Number.isSafeInteger(pid) && pid > 0);
  assert.throws(() => process.kill(pid, 0), { code: "ESRCH" });
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
