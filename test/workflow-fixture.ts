import { assertTemporaryFixture, mkdtemp } from "./temporary.ts";
import assert from "node:assert/strict";
import { chmod, lstat, mkdir, readFile, readdir, writeFile } from "node:fs/promises";
import { join, resolve } from "node:path";
import {
  loadTask,
  workflow,
  type saveTask,
  type VerificationHost,
} from "../app/workflow/workflow.ts";
import { gitEnvironment, GitFailure, type Git } from "../app/workflow/git.ts";
import { runProcess, diagnostic } from "../app/workflow/process.ts";
import { digest } from "../app/workflow/storage.ts";
import { gitPlatformArguments } from "../app/check/git-platform.ts";
import { resolveGitExecution } from "../app/check/git-execution.ts";

export const identity = { sessionId: "fixture-session", taskId: "fixture-task" };
export async function directory() {
  await mkdir(".cache/conversations", { recursive: true });
  return await mkdtemp(resolve(".cache/conversations/test-workflow-"));
}
export const fixtureVerifier: VerificationHost = {
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
    const execution = await resolveGitExecution(root, {
      ...gitEnvironment(index),
      GIT_CONFIG_NOSYSTEM: "1",
      GIT_CONFIG_GLOBAL: nullFile,
      GIT_ATTR_NOSYSTEM: "1",
      GIT_TEMPLATE_DIR: template,
    });
    const result = await runProcess(
      root,
      execution.executable,
      gitPlatformArguments([
        "-c",
        "core.fsmonitor=false",
        "-c",
        `core.attributesFile=${nullFile}`,
        ...args,
      ]),
      {
        ...(input === undefined ? {} : { input }),
        timeoutMs: args.includes("commit") ? 600_000 : 60_000,
        env: execution.env,
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

type FixtureSeed = Readonly<{
  root: string;
  repo: string;
}>;
let pendingSeed: Promise<FixtureSeed> | undefined;

async function createFixtureSeed(): Promise<FixtureSeed> {
  // This worker's seed is a separate managed fixture, retained until all tests
  // finish. Only its unsigned source history is shared.
  const root = await mkdtemp("workflow-seed-");
  const repo = join(root, "repo");
  const template = join(root, "empty-git-template");
  await mkdir(repo);
  await mkdir(template);
  const git = fixtureGit(repo, template);
  await git(["init", "-b", "main"]);
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
  // Explicit paths exclude all workflow state from the shared unsigned history.
  await git([
    "-c",
    "core.autocrlf=false",
    "add",
    "--",
    ".gitignore",
    ".workflow.json",
    "owned.txt",
    "retired.txt",
    ".githooks/pre-commit",
    ".githooks/commit-msg",
  ]);
  await git([
    "-c",
    "user.name=Workflow Fixture",
    "-c",
    "user.email=fixture@example.invalid",
    "-c",
    "commit.gpgsign=false",
    "commit",
    "-m",
    "test: Initialize fixture",
  ]);
  // No later operation writes this repository. Independent clones use copied
  // objects, and each test changes only its private repository.
  return Object.freeze({ root, repo });
}

async function privateClone(gitDirectory: string): Promise<void> {
  for (const name of ["alternates", "http-alternates"])
    await assert.rejects(lstat(join(gitDirectory, "objects/info", name)), { code: "ENOENT" });
  const pending = [join(gitDirectory, "objects")];
  let entries = 0;
  while (pending.length) {
    const path = pending.pop();
    assert.ok(path);
    for (const name of await readdir(path)) {
      entries++;
      assert.ok(entries <= 256, "Fixture object inventory stays bounded");
      const child = join(path, name);
      const info = await lstat(child);
      assert.equal(info.isSymbolicLink(), false, "Fixture objects do not use symbolic links");
      if (info.isDirectory()) pending.push(child);
      else {
        assert.ok(info.isFile(), "Fixture objects are regular files");
        assert.equal(info.nlink, 1, "Fixture objects do not share hard links");
      }
    }
  }
}

export async function fixture(verifier = fixtureVerifier, persist?: typeof saveTask) {
  pendingSeed ??= createFixtureSeed();
  const seed = await pendingSeed;
  await assertTemporaryFixture(seed.root);
  const root = await directory();
  assert.notEqual(root, seed.root, "Case cleanup cannot own the worker seed");
  const bare = join(root, "remote.git");
  const remote = process.platform === "win32" ? bare.replace(/\\/gu, "/") : bare;
  const repo = join(root, "repo");
  const bareTemplate = join(root, "empty-git-template");
  const template = join(root, "working-git-template");
  await mkdir(bareTemplate);
  await mkdir(template);
  const bareGit = fixtureGit(root, bareTemplate);
  const cloneGit = fixtureGit(root, template);
  const git = fixtureGit(repo, template);
  const key = join(root, "signing");
  const keygen =
    process.platform === "win32" ? "C:/Windows/System32/OpenSSH/ssh-keygen.exe" : "ssh-keygen";
  // Let OpenSSH create each private key with its native permissions; copying a
  // key does not preserve the required Windows access-control boundary.
  const generated = await runProcess(root, keygen, ["-q", "-t", "ed25519", "-N", "", "-f", key]);
  assert.equal(generated.outcome, "exited", "Fixture key generation exits normally");
  assert.equal(generated.termination, "closed", "Fixture key generation confirms cleanup");
  assert.equal(generated.code, 0, "Generate isolated fixture signing key");
  const allowed = join(root, "allowed-signers");
  await writeFile(
    allowed,
    "fixture@example.invalid " + (await readFile(key + ".pub", "utf8")).trim() + "\n",
  );
  // Only the working template carries signing configuration. Clone creates its
  // own origin and upstream entries, also checked exactly below.
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
    ['remote "origin"', "url", remote],
    ['remote "origin"', "fetch", "+refs/heads/*:refs/remotes/origin/*"],
    ['branch "main"', "remote", "origin"],
    ['branch "main"', "merge", "refs/heads/main"],
  ] as const;
  await writeFile(
    join(template, "config"),
    settings
      .filter(([section]) => !section.startsWith("remote ") && !section.startsWith("branch "))
      .map(([section, name, value]) => `[${section}]\n\t${name} = ${fixtureConfigValue(value)}\n`)
      .join(""),
  );
  await bareGit(["clone", "--bare", "--no-hardlinks", "--", seed.repo, bare]);
  await privateClone(bare);
  await cloneGit(["clone", "--no-hardlinks", "--", remote, repo]);
  await privateClone(join(repo, ".git"));
  const configured = (await git(["config", "--null", "--list", "--local"])).split("\0");
  for (const [section, name, value] of settings) {
    const keyName = `${section.replace(/ "([^"]+)"$/u, ".$1")}.${name}`.toLowerCase();
    assert.deepEqual(
      configured.filter((entry) => entry.startsWith(`${keyName}\n`)),
      [`${keyName}\n${value}`],
      `Exact isolated Git setting: ${keyName}`,
    );
  }
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
  const call = async (request: Record<string, unknown>) => {
    try {
      return await workflow(repo, { ...identity, ...request }, host);
    } catch (error) {
      if (!(error instanceof Error) || !error.message.startsWith("Publication stopped;"))
        throw error;
      let detail = "Saved publication failure is unavailable";
      try {
        const saved = await loadTask(repo, identity.sessionId, identity.taskId);
        if (saved?.failure) detail = diagnostic(saved.failure).slice(0, 2000);
      } catch {
        // Preserve the original failure even if its separate diagnostic cannot be read.
      }
      throw new Error(`${error.message}\nFixture publication diagnostic: ${detail}`);
    }
  };
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
