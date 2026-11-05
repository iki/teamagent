import assert from "node:assert/strict";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { test } from "node:test";
import {
  gitEnvironment,
  changedPaths,
  destination,
  snapshot,
  checkedScope,
  signingReady,
  verifyCommitSignature,
  worktreeTree,
  type Git,
} from "../app/workflow/git.ts";
import { verifyPreCommit } from "../app/workflow/pre-commit.ts";
import { runProcess } from "../app/workflow/process.ts";
import { workflow, loadTask } from "../app/workflow/workflow.ts";
import type { Task } from "../app/workflow/model.ts";
import { digest } from "../app/workflow/storage.ts";
import { mkdtemp } from "./temporary.ts";

const commit = "1".repeat(40);
const tree = "2".repeat(40);
const changedTree = "3".repeat(40);
const publicKey = `key::ssh-ed25519 ${Buffer.alloc(32, 7).toString("base64")}`;
const signingRows = [
  "commit.gpgsign\ntrue",
  "gpg.format\nssh",
  `user.signingkey\n${publicKey}`,
  "gpg.ssh.allowedsignersfile\nallowed-signers",
];
const configuration = (rows: readonly string[] = signingRows): string => `${rows.join("\0")}\0`;
const upstreamRows = ["branch.main.remote\norigin", "branch.main.merge\nrefs/heads/main"];
const policy = {
  version: 1,
  repository: "github.com/iki/teamagent",
  remote: "origin",
  ref: "refs/heads/main",
} as const;

async function scopeFixture() {
  const root = await mkdtemp("workflow-observation-");
  const policyText = `${JSON.stringify(policy)}\n`;
  await writeFile(join(root, ".workflow.json"), policyText, "utf8");
  await writeFile(join(root, "owned.txt"), "owned\n", "utf8");
  await writeFile(join(root, "record.md"), "record\n", "utf8");
  const task: Task = {
    version: 1,
    sessionId: "observation-fixture",
    taskId: "scope",
    snapshot: {
      head: commit,
      branch: "main",
      remote: "origin",
      ref: "refs/heads/main",
      destination: digest(
        "https://github.com/iki/teamagent.git\nhttps://github.com/iki/teamagent.git",
      ),
      changes: {},
    },
    policyHash: digest(policyText),
    state: "checkpointed",
    checkpoint: {
      archive: "record.md",
      archiveHash: digest("record\n"),
      responseHash: digest("response\n"),
      message: "test: Inspect fresh scope",
      files: ["owned.txt", "record.md"],
      approvedExistingFiles: [],
      hashes: { "owned.txt": digest("owned\n"), "record.md": digest("record\n") },
    },
    verification: null,
    signingIdentity: null,
    commit: null,
    failure: null,
  };
  return { root, task };
}

function observationResponse(args: readonly string[]): string {
  if (args[0] === "symbolic-ref") return "main\n";
  if (args[0] === "config") return configuration(upstreamRows);
  if (args[0] === "remote") return "https://github.com/iki/teamagent.git\n";
  if (args[0] === "rev-parse") return `${commit}\n`;
  if (args[0] === "diff") return args[1] === "HEAD" ? "owned.txt\0" : "";
  assert.equal(args[0], "ls-files");
  return "record.md\0";
}

await test(
  "snapshot and scope observations admit at most two fresh Git reads",
  { timeout: 10_000 },
  async () => {
    const { root, task } = await scopeFixture();
    for (const boundary of ["snapshot", "scope", "committed-scope"] as const) {
      const barrier = Promise.withResolvers<void>();
      const admitted = Promise.withResolvers<void>();
      let active = 0;
      let maximum = 0;
      const calls: string[] = [];
      const git: Git = async (args, input, index) => {
        assert.equal(input, undefined);
        assert.equal(index, undefined);
        active++;
        maximum = Math.max(maximum, active);
        calls.push(args.join(" "));
        if (calls.length === 2) admitted.resolve();
        try {
          await barrier.promise;
          return observationResponse(args);
        } finally {
          active--;
        }
      };
      const operation =
        boundary === "snapshot"
          ? snapshot(root, git, policy)
          : checkedScope(root, git, task, boundary !== "committed-scope");
      await admitted.promise;
      const beforeRelease = calls.length;
      barrier.resolve();
      const result = await operation;
      assert.equal(beforeRelease, 2);
      assert.equal(maximum, 2);
      assert.equal(active, 0);
      assert.equal(calls.length, boundary === "scope" ? 8 : 7);
      if (boundary === "committed-scope")
        assert.equal(
          calls.some((call) => call.startsWith("rev-parse ")),
          false,
        );
      if (result)
        assert.deepEqual(result.changes, {
          "owned.txt": digest("owned\n"),
          "record.md": digest("record\n"),
        });
    }
  },
);

await test(
  "failed observation boundaries join queued reads before rejecting",
  { timeout: 10_000 },
  async () => {
    const { root, task } = await scopeFixture();
    for (const boundary of ["snapshot", "scope"] as const) {
      const barrier = Promise.withResolvers<void>();
      const failed = Promise.withResolvers<void>();
      const failure = new Error("controlled HEAD read failure");
      let completed = false;
      let started = 0;
      let finished = 0;
      const git: Git = async (args) => {
        started++;
        try {
          if (args[0] === "rev-parse") {
            failed.resolve();
            throw failure;
          }
          await barrier.promise;
          return observationResponse(args);
        } finally {
          finished++;
        }
      };
      const pending = (
        boundary === "snapshot" ? snapshot(root, git, policy) : checkedScope(root, git, task)
      ).then(
        () => {
          completed = true;
          return undefined;
        },
        (error: unknown) => {
          completed = true;
          return error;
        },
      );
      await failed.promise;
      await new Promise<void>((done) => setImmediate(done));
      const premature = completed;
      barrier.resolve();
      const result = await pending;
      assert.equal(premature, false);
      assert.equal(result, failure);
      assert.equal(started, boundary === "scope" ? 8 : 7);
      assert.equal(finished, started);
    }
  },
);

await test("fresh scope observations retain every identity, staging and file validation", async () => {
  const { root, task } = await scopeFixture();
  let phase = "valid";
  let reads = 0;
  const git: Git = async (args) => {
    reads++;
    if (phase === "head" && args[0] === "rev-parse") return `${changedTree}\n`;
    if (phase === "staged" && args[0] === "diff" && args[1] === "--cached") return "outside.txt\0";
    if (phase === "outside" && args[0] === "ls-files") return "outside.txt\0";
    if (phase === "destination" && args[0] === "remote")
      return "https://example.invalid/other.git\n";
    return observationResponse(args);
  };
  await checkedScope(root, git, task);
  assert.equal(reads, 8);
  for (const [changed, message] of [
    ["head", /HEAD changed/u],
    ["staged", /Unrelated staged change/u],
    ["outside", /Unreviewed change outside task scope/u],
    ["destination", /outside the approved Teamagent repository/u],
  ] as const) {
    phase = changed;
    const previous: number = reads;
    await assert.rejects(checkedScope(root, git, task), message);
    assert.equal(reads - previous, 8);
  }
  phase = "valid";
  await writeFile(join(root, "owned.txt"), "modified\n", "utf8");
  await assert.rejects(checkedScope(root, git, task), /Checkpoint file changed/u);
  await writeFile(join(root, "owned.txt"), "owned\n", "utf8");
  assert.ok(task.checkpoint);
  await assert.rejects(
    checkedScope(root, git, {
      ...task,
      checkpoint: { ...task.checkpoint, archiveHash: digest("different\n") },
    }),
    /Frozen archive changed/u,
  );
  await assert.rejects(
    checkedScope(root, git, {
      ...task,
      snapshot: { ...task.snapshot, destination: digest("different\n") },
    }),
    /Branch or destination changed/u,
  );
  const beforePolicy = reads;
  await writeFile(join(root, ".workflow.json"), `${JSON.stringify(policy)}\n\n`, "utf8");
  await assert.rejects(checkedScope(root, git, task), /Publication policy changed/u);
  assert.equal(reads, beforePolicy);
});

await test("upstream batching preserves required keys, strict framing and last-value precedence", async () => {
  const responses = [
    "",
    configuration(upstreamRows).slice(0, -1),
    configuration(upstreamRows.slice(0, 1)),
    configuration([...upstreamRows, "branch.other.remote\nprivate-fixture-value"]),
    configuration([...upstreamRows, "branch.main.remote"]),
    configuration([
      ...upstreamRows,
      ...Array.from({ length: 255 }, () => "branch.main.remote\norigin"),
    ]),
  ];
  for (const response of responses) {
    let reads = 0;
    await assert.rejects(
      destination(async (args) => {
        reads++;
        if (args[0] === "symbolic-ref") return "main\n";
        assert.deepEqual(args, [
          "config",
          "--null",
          "--get-regexp",
          "^branch\\.main\\.(remote|merge)$",
        ]);
        return response;
      }, policy),
      (error: unknown) => {
        assert.ok(error instanceof Error);
        assert.equal(
          error.message,
          "Upstream configuration response is malformed or exceeds bounds",
        );
        assert.equal(error.cause, undefined);
        return true;
      },
    );
    assert.equal(reads, 2);
  }
  const git: Git = async (args) => {
    if (args[0] === "symbolic-ref") return "main\n";
    if (args[0] === "config") return configuration(["branch.main.remote\nwrong", ...upstreamRows]);
    assert.equal(args[0], "remote");
    return "https://github.com/iki/teamagent.git\n";
  };
  assert.equal((await destination(git, policy)).remote, "origin");
  await assert.rejects(
    destination(
      async (args) =>
        args[0] === "config"
          ? configuration([...upstreamRows, "branch.main.remote\nwrong"])
          : git(args),
      policy,
    ),
    /outside the approved publication policy/u,
  );
  let branchReads = 0;
  await assert.rejects(
    destination(async () => {
      branchReads++;
      return "other\n";
    }, policy),
    /outside the approved publication policy/u,
  );
  assert.equal(branchReads, 1);
});

await test(
  "destination keeps Git's fetch and push URL rewriting live",
  { timeout: 30_000 },
  async () => {
    const root = await mkdtemp("workflow-url-query-");
    const template = join(root, "template");
    await mkdir(template);
    const git: Git = async (args) => {
      const result = await runProcess(root, "git", ["-c", "core.fsmonitor=false", ...args], {
        env: {
          ...gitEnvironment(),
          GIT_CONFIG_NOSYSTEM: "1",
          GIT_CONFIG_GLOBAL: process.platform === "win32" ? "NUL" : "/dev/null",
          GIT_TEMPLATE_DIR: template,
        },
      });
      assert.equal(result.outcome, "exited");
      assert.equal(result.code, 0, result.stderr);
      return result.stdout;
    };
    await git(["init", "--quiet", "-b", "main"]);
    const path = join(root, ".git/config");
    const configured = `${await readFile(path, "utf8")}[branch "main"]\n remote = wrong\n merge = refs/heads/wrong\n remote = origin\n merge = refs/heads/main\n[remote "origin"]\n url = fixture:teamagent.git\n[url "https://github.com/iki/"]\n insteadOf = fixture:\n pushInsteadOf = fixture:\n`;
    await writeFile(path, configured, "utf8");
    const initial = await destination(git, policy);
    assert.equal(initial.branch, "main");
    await writeFile(
      path,
      `${configured}[remote "origin"]\n pushurl = https://example.invalid/different.git\n`,
      "utf8",
    );
    await assert.rejects(destination(git, policy), /outside the approved Teamagent repository/u);
    await writeFile(
      path,
      `${configured}[remote "origin"]\n url = https://example.invalid/additional.git\n`,
      "utf8",
    );
    await assert.rejects(destination(git, policy), /outside the approved Teamagent repository/u);
  },
);

await test(
  "independent Git read pairs join both operations before reporting either failure",
  { timeout: 10_000 },
  async () => {
    for (const kind of ["changes", "urls"] as const) {
      for (const secondFails of [false, true]) {
        const firstError = new Error("first controlled failure");
        const secondError = new Error("second controlled failure");
        const secondStarted = Promise.withResolvers<void>();
        const release = Promise.withResolvers<string>();
        let pairCalls = 0;
        let completed = false;
        const git: Git = (args) => {
          if (args[0] === "symbolic-ref") return Promise.resolve("main\n");
          if (args[0] === "config") return Promise.resolve(configuration(upstreamRows));
          pairCalls++;
          if (pairCalls === 1) throw firstError;
          assert.equal(pairCalls, 2);
          secondStarted.resolve();
          return release.promise;
        };
        const pending = (kind === "changes" ? changedPaths(git) : destination(git, policy)).then(
          () => {
            completed = true;
            return undefined;
          },
          (error: unknown) => {
            completed = true;
            return error;
          },
        );
        await secondStarted.promise;
        await Promise.resolve();
        assert.equal(completed, false);
        if (secondFails) release.reject(secondError);
        else release.resolve("");
        const result = await pending;
        assert.equal(pairCalls, 2);
        if (secondFails) {
          assert.ok(result instanceof AggregateError);
          const failures: unknown = result.errors;
          assert.deepEqual(failures, [firstError, secondError]);
        } else assert.equal(result, firstError);
      }
    }
    assert.deepEqual(
      await changedPaths(async (args) =>
        args[0] === "diff" ? "z.txt\0shared.txt\0" : "a.txt\0shared.txt\0",
      ),
      ["a.txt", "shared.txt", "z.txt"],
    );
  },
);

await test("batched signing configuration preserves Git includes, precedence and fresh public trust", async () => {
  const root = await mkdtemp("workflow-signing-query-");
  await writeFile(join(root, "allowed-signers"), "fixture public trust\n", "utf8");
  await writeFile(
    join(root, "included.conf"),
    `[commit]\n gpgsign = true\n[gpg]\n format = ssh\n[user]\n signingkey = "${publicKey}"\n[gpg "ssh"]\n allowedSignersFile = allowed-signers\n`,
    "utf8",
  );
  await writeFile(
    join(root, "config"),
    "[commit]\n gpgsign = false\n[gpg]\n format = invalid\n[include]\n path = included.conf\n",
    "utf8",
  );
  let queries = 0;
  const git: Git = async (args) => {
    assert.equal(args[0], "config");
    assert.ok(args.includes("--null") && args.includes("--get-regexp"));
    queries++;
    const result = await runProcess(
      root,
      "git",
      ["config", "--file", join(root, "config"), "--includes", ...args.slice(1)],
      {
        env: {
          ...gitEnvironment(),
          GIT_CONFIG_NOSYSTEM: "1",
          GIT_CONFIG_GLOBAL: process.platform === "win32" ? "NUL" : "/dev/null",
        },
      },
    );
    assert.equal(result.outcome, "exited");
    assert.equal(result.code, 0, result.stderr);
    return result.stdout;
  };
  const before = await signingReady(root, git);
  assert.equal(queries, 1);
  await writeFile(join(root, "allowed-signers"), "changed public trust\n", "utf8");
  const after = await signingReady(root, git);
  assert.equal(queries, 2);
  assert.equal(after.fingerprint, before.fingerprint);
  assert.notEqual(after.identity, before.identity);
});

await test("signing queries reject malformed, incomplete and excessive NUL records without exposing values", async () => {
  const root = await mkdtemp("workflow-signing-framing-");
  await writeFile(join(root, "allowed-signers"), "fixture public trust\n", "utf8");
  const invalid = [
    "",
    configuration().slice(0, -1),
    `${configuration()}\0`,
    configuration(signingRows.slice(0, -1)),
    configuration([...signingRows, "user.secret\nprivate-fixture-value"]),
    configuration([...signingRows, "commit.gpgsign"]),
    configuration([...signingRows, `user.signingkey\n${"x".repeat(16385)}`]),
    configuration([...signingRows, ...Array.from({ length: 253 }, () => "commit.gpgsign\ntrue")]),
    configuration([
      ...signingRows,
      ...Array.from({ length: 5 }, () => `user.signingkey\n${"ž".repeat(7000)}`),
    ]),
  ];
  for (const response of invalid) {
    await assert.rejects(
      signingReady(root, async () => response),
      (error: unknown) => {
        assert.ok(error instanceof Error);
        assert.equal(
          error.message,
          "Signing configuration response is malformed or exceeds bounds",
        );
        assert.equal(error.cause, undefined);
        return true;
      },
    );
  }
  await assert.rejects(
    signingReady(root, async () => configuration([...signingRows, "commit.gpgsign\nfalse"])),
    /Signed SSH commits must remain enabled/u,
  );
  assert.ok(
    await signingReady(root, async () => configuration(["commit.gpgsign\nfalse", ...signingRows])),
  );
});

await test("commit signature batching retains independent verification and exact framing", async () => {
  const fingerprint = "SHA256:fixture";
  for (const response of [
    `G\0${fingerprint}\n`,
    `B\0${fingerprint}\n`,
    "G\0different\n",
    `G\0${fingerprint}\0extra\n`,
    `G\0${fingerprint}`,
    `G\0${"x".repeat(1025)}\n`,
  ]) {
    const calls: string[] = [];
    const git: Git = async (args) => {
      assert.equal(args.at(-1), commit);
      const command = args[0];
      assert.ok(command);
      calls.push(command);
      if (command === "verify-commit") return "";
      assert.deepEqual(args, ["show", "-s", "--format=%G?%x00%GF", commit]);
      return response;
    };
    const checked = verifyCommitSignature(git, commit, fingerprint);
    if (response === `G\0${fingerprint}\n`) await checked;
    else await assert.rejects(checked);
    assert.deepEqual(calls, ["verify-commit", "show"]);
  }
  let calls = 0;
  await assert.rejects(
    verifyCommitSignature(
      async () => {
        calls++;
        throw new Error("cryptographic verification failed");
      },
      commit,
      fingerprint,
    ),
    /cryptographic verification failed/u,
  );
  assert.equal(calls, 1);
});

await test("pre-commit reuses its captured alternate-index tree and still rejects index drift", async () => {
  for (const drift of ["none", "during-snapshot", "during-review"] as const) {
    const root = await mkdtemp("workflow-index-query-");
    const indexFile = join(root, "alternate-index");
    await writeFile(indexFile, "controlled alternate-index fixture\n", "utf8");
    let activeTree = tree;
    let activeReads = 0;
    let seeds = 0;
    let reviews = 0;
    const git: Git = async (args, _input, index) => {
      if (args[0] === "write-tree") {
        if (index === indexFile) {
          activeReads++;
          return `${activeTree}\n`;
        }
        assert.ok(index);
        return `${tree}\n`;
      }
      assert.ok(index && index !== indexFile);
      if (args[0] === "read-tree") {
        assert.equal(args[1], activeTree);
        seeds++;
        if (drift === "during-snapshot") activeTree = changedTree;
      } else assert.deepEqual(args, ["add", "-A"]);
      return "";
    };
    const checked = verifyPreCommit(root, {
      git,
      indexFile,
      async review() {
        reviews++;
        if (drift === "during-review") activeTree = changedTree;
      },
      async staged(_root, options) {
        assert.equal(options?.indexFile, indexFile);
      },
    });
    if (drift === "none") {
      await checked;
      assert.equal(activeReads, 4);
      assert.equal(seeds, 2);
      assert.equal(reviews, 1);
    } else {
      await assert.rejects(checked, /index changed|changed the staged or working tree/u);
      assert.equal(reviews, drift === "during-snapshot" ? 0 : 1);
    }
    await assert.rejects(
      worktreeTree(
        root,
        async () => {
          throw new Error("An invalid seed must fail before querying Git");
        },
        "invalid-tree",
      ),
    );
  }
});

await test("preparation reads signing settings after the live remote check", async () => {
  const root = await mkdtemp("workflow-prepare-query-");
  await writeFile(
    join(root, ".workflow.json"),
    `${JSON.stringify({ version: 1, repository: "github.com/iki/teamagent", remote: "origin", ref: "refs/heads/main" })}\n`,
    "utf8",
  );
  await writeFile(join(root, "owned.txt"), "before\n", "utf8");
  await writeFile(join(root, "allowed-signers"), "fixture public trust\n", "utf8");
  await mkdir(join(root, ".githooks"));
  for (const name of ["pre-commit", "commit-msg"])
    await writeFile(join(root, ".githooks", name), "#!/bin/sh\nexit 0\n", "utf8");
  let changed = false;
  let remoteChecked = false;
  let signingQueries = 0;
  const git: Git = async (args) => {
    if (args[0] === "symbolic-ref") return "main\n";
    if (args[0] === "remote") return "https://github.com/iki/teamagent.git\n";
    if (args[0] === "rev-parse") return `${commit}\n`;
    if (args[0] === "write-tree") return `${tree}\n`;
    if (args[0] === "read-tree" || args[0] === "add" || args[0] === "ls-files") return "";
    if (args[0] === "diff") return args[1] === "HEAD" && changed ? "owned.txt\0" : "";
    if (args[0] === "ls-remote") {
      remoteChecked = true;
      return `${commit}\trefs/heads/main\n`;
    }
    assert.equal(args[0], "config");
    if (args.includes("--get-regexp")) {
      if (args.at(-1) === "^branch\\.main\\.(remote|merge)$") return configuration(upstreamRows);
      signingQueries++;
      return configuration([...signingRows, `commit.gpgsign\n${remoteChecked ? "false" : "true"}`]);
    }
    assert.equal(args[2], "core.hooksPath");
    return ".githooks\n";
  };
  const identity = { sessionId: "query-fixture", taskId: "prepare-freshness" };
  const host = {
    git,
    verification: {
      async identity() {
        return { key: "a".repeat(64) };
      },
      async run() {},
      async live() {},
      async staged() {},
    },
  };
  await workflow(root, { ...identity, operation: "begin" }, host);
  await writeFile(join(root, "owned.txt"), "after\n", "utf8");
  changed = true;
  await workflow(
    root,
    {
      ...identity,
      operation: "checkpoint",
      files: ["owned.txt"],
      message: "test: Exercise preparation freshness",
      record: {
        ...identity,
        turnId: "turn",
        agent: "codex",
        model: "fixture",
        reasoning: "fixture",
        date: "2026-11-02T12:00:00Z",
        description: "Signing query fixture",
        prompt: "Check signing freshness",
        response: "Checked the boundary.",
        processingLog: [],
      },
    },
    host,
  );
  await workflow(root, { ...identity, operation: "verify", phase: "review" }, host);
  await assert.rejects(
    workflow(root, { ...identity, operation: "prepare" }, host),
    /Signed SSH commits must remain enabled/u,
  );
  assert.equal(remoteChecked, true);
  assert.equal(signingQueries, 1);
  assert.equal((await loadTask(root, identity.sessionId, identity.taskId))?.state, "checkpointed");
});
