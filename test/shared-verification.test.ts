import { beforeAll, expect, test } from "bun:test";
import { rejects, strictEqual } from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { randomUUID } from "node:crypto";
import { lstat, mkdir, readFile, rename, rm, symlink, writeFile } from "node:fs/promises";
import { join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { Schema } from "effect";
import { cacheDirectory, encodedDigest, receiptDirectory } from "../app/check/cache-io.ts";
import { gitPlatformArguments } from "../app/check/git-platform.ts";
import {
  inputIdentity,
  runCachedTask,
  type CacheTask,
  type CachedTaskResult,
  type PendingCachedTask,
} from "../app/check/input-cache.ts";
import {
  cachedVerification,
  reviewSourceIdentity,
  verificationTask,
  withVerificationResults,
} from "../app/check/verification-cache.ts";
import { sharedResultOwner } from "../app/check/shared-result-owner.ts";
import {
  beginSharedResult,
  completeSharedResult,
  failSharedResult,
  inspectSharedResult,
  invalidateSharedResult,
  sharedResultDirectory,
  sharedResultLimits,
  type SharedAttempt,
} from "../app/check/shared-results.ts";
import {
  loadParallelEntry,
  parallelName,
  saveParallelEntry,
  type ParallelEntry,
} from "../app/workflow/parallel-store.ts";
import { atomicText, taskKey } from "../app/workflow/storage.ts";
import { diagnostic, runProcess, type ProcessResult } from "../app/workflow/process.ts";
import { mkdtemp } from "./temporary.ts";

function git(root: string, args: readonly string[]): string {
  const result = spawnSync(
    "git",
    gitPlatformArguments([
      "-c",
      "user.name=Fixture",
      "-c",
      "user.email=fixture@example.invalid",
      "-c",
      "commit.gpgsign=false",
      "-c",
      "core.hooksPath=/no-fixture-hooks",
      ...args,
    ]),
    { cwd: root, encoding: "utf8", windowsHide: true, timeout: 15_000, maxBuffer: 1024 * 1024 },
  );
  if (result.error || result.status !== 0) {
    const details = diagnostic(result.stderr || result.error?.message || "No stderr")
      .replaceAll(root, "<fixture>")
      .replaceAll(root.replaceAll("\\", "/"), "<fixture>")
      .slice(0, 2048);
    throw new Error(
      `Shared-result fixture Git operation failed (status=${result.status}, signal=${result.signal}, cwdLength=${root.length}): ${details}`,
    );
  }
  return result.stdout;
}
async function primary(): Promise<string> {
  // Native candidate/admin names remain unchanged under the nested full-gate lease.
  const root = await mkdtemp("sv-");
  git(root, ["init", "--quiet"]);
  await writeFile(join(root, ".gitignore"), ".cache/\n", "utf8");
  await writeFile(join(root, ".gitattributes"), "* text eol=lf\n", "utf8");
  await writeFile(join(root, "input.ts"), "export const value = 1;\n", "utf8");
  git(root, ["add", "--", ".gitignore", ".gitattributes", "input.ts"]);
  git(root, ["commit", "--quiet", "-m", "Initial shared-result fixture"]);
  return root;
}
async function registered(root: string, name: string): Promise<string> {
  const sessionId = "shared-result-fixture",
    taskId = name;
  const path = join(root, ".cache/worktrees", parallelName(name, sessionId, taskId));
  const branch = "codex/" + parallelName(name, sessionId, taskId);
  const base = git(root, ["rev-parse", "HEAD"]).trim();
  git(root, ["worktree", "add", "--quiet", "-b", branch, path, base]);
  const entry: ParallelEntry = {
    version: 1,
    sessionId,
    taskId,
    name,
    path,
    branch,
    base,
    destination: encodedDigest("fixture destination"),
    policyHash: encodedDigest("fixture policy"),
    state: "open",
    source: null,
    main: null,
    result: null,
    workspace: null,
    prNumber: null,
    tree: null,
    reviewKey: null,
    signingIdentity: null,
    fingerprint: null,
    failure: null,
  };
  await saveParallelEntry(async (args) => git(root, args), entry);
  return path;
}
let fixture: { root: string; a: string; b: string };
beforeAll(async () => {
  const root = await primary();
  fixture = { root, a: await registered(root, "first"), b: await registered(root, "second") };
}, 120_000);

test("batched ownership preserves native configuration agreement and unborn primary support", async () => {
  const root = await mkdtemp("svo-");
  git(root, ["init", "--quiet"]);
  const unborn = await sharedResultOwner(root);
  await unborn.validate();
  const config = join(root, ".git/config"),
    original = await readFile(config);
  const elsewhere = join(root, ".cache/other");
  await mkdir(elsewhere, { recursive: true });
  const included = join(root, ".cache/owner-config");
  await writeFile(
    included,
    '[core]\n\tworktree = "' + elsewhere.replaceAll("\\", "/") + '"\n',
    "utf8",
  );
  for (const [label, extra] of [
    ["direct-worktree", '[core]\n\tworktree = "' + elsewhere.replaceAll("\\", "/") + '"\n'],
    ["included-worktree", '[include]\n\tpath = "' + included.replaceAll("\\", "/") + '"\n'],
    ["bare", "[core]\n\tbare = true\n"],
    ["malformed", "[malformed\n"],
  ] as const) {
    try {
      await writeFile(config, Buffer.concat([original, Buffer.from("\n" + extra)]));
      if (label === "included-worktree") {
        // Git's repository setup reads core.worktree without expanding includes.
        // Ordinary config sees the included value; native topology still owns root.
        strictEqual(
          resolve(git(root, ["config", "--includes", "--get", "core.worktree"]).trim()),
          resolve(elsewhere),
          label,
        );
        strictEqual(
          resolve(git(root, ["rev-parse", "--show-toplevel"]).trim()),
          resolve(root),
          label,
        );
        const owner = await sharedResultOwner(root);
        strictEqual(resolve(owner.primary), resolve(root), label);
        await owner.validate();
      } else {
        await rejects(sharedResultOwner(root), label);
      }
    } finally {
      await writeFile(config, original);
    }
    await (await sharedResultOwner(root)).validate();
  }
}, 120_000);

test("captured native ownership never survives later branch or Git pointer replacement", async () => {
  const marker = join(fixture.a, ".git"),
    originalMarker = await readFile(marker);
  const admin = git(fixture.a, ["rev-parse", "--absolute-git-dir"]).trim();
  const head = join(admin, "HEAD"),
    originalHead = await readFile(head);
  const otherMarker = await readFile(join(fixture.b, ".git"));
  for (const change of ["branch", "pointer"] as const) {
    let changed = false;
    try {
      await rejects(
        sharedResultOwner(fixture.a, async (phase, attempt) => {
          if (phase !== "registry-snapshot" || attempt !== 0 || changed) return;
          changed = true;
          if (change === "branch")
            await writeFile(head, "ref: refs/heads/codex/changed-owner\n", "utf8");
          else await writeFile(marker, otherMarker);
        }),
        /branch|pointer/u,
      );
      expect(changed).toBe(true);
    } finally {
      await writeFile(head, originalHead);
      await writeFile(marker, originalMarker);
    }
    await (await sharedResultOwner(fixture.a)).validate();
  }
}, 120_000);
const task = (id: string): CacheTask => ({
  id,
  kind: "verification",
  shared: true,
  inputs: ["input.ts"],
});
const receipt = new TextEncoder().encode('{"cooperativeFixture":true}\n');
function required(attempt: SharedAttempt | undefined): SharedAttempt {
  if (!attempt) throw new Error("Fixture unexpectedly reached shared capacity");
  return attempt;
}
function pending(result: CachedTaskResult): PendingCachedTask {
  if (!result.pending) throw new Error("Fixture expected deferred verification completion");
  return result.pending;
}

/** Failure-only diagnostics keep nested cleanup errors visible without accepting them. */
function failureDetails(error: unknown): string {
  const rows: string[] = [];
  const visit = (value: unknown, depth: number): void => {
    if (rows.length >= 16) return;
    rows.push(
      value instanceof Error
        ? diagnostic(`${value.name}: ${value.message}`).slice(0, 256)
        : "Non-Error failure",
    );
    if (value instanceof AggregateError && depth < 4) {
      const errors: readonly unknown[] = value.errors;
      for (const child of errors.slice(0, 16)) visit(child, depth + 1);
    }
  };
  visit(error, 0);
  return rows.join("\n").slice(0, 4096);
}

const FixtureReservation = Schema.Struct({
  version: Schema.Literal(1),
  repository: Schema.String,
  token: Schema.String,
  generation: Schema.Int,
  keys: Schema.Int,
  attempts: Schema.Int,
});
async function fillReservations(root: string, count: number): Promise<void> {
  const path = join(root, sharedResultDirectory, "reservations.json");
  const current = Schema.decodeUnknownSync(Schema.fromJsonString(FixtureReservation), {
    onExcessProperty: "error",
  })(await readFile(path, "utf8"));
  if (count < current.keys || count > sharedResultLimits.keys)
    throw new Error("Invalid fixture capacity");
  // Simulate retained reservations abandoned before their per-key start write.
  // Accounting keeps those slots occupied instead of reclaiming them.
  for (let index = current.keys; index < count; index++)
    await mkdir(join(root, sharedResultDirectory, encodedDigest(["reserved fixture", index])));
  const attempts = current.attempts + count - current.keys;
  await atomicText(
    path,
    JSON.stringify({ ...current, keys: count, attempts, generation: attempts }) + "\n",
  );
}

async function waitForFile(path: string): Promise<void> {
  const deadline = performance.now() + 90_000;
  for (;;) {
    try {
      await lstat(path);
      return;
    } catch (error) {
      if (!(error instanceof Error && "code" in error && error.code === "ENOENT")) throw error;
    }
    if (performance.now() >= deadline)
      throw new Error("Separate-process fixture did not reach its handshake");
    await new Promise<void>((done) => setTimeout(done, 25));
  }
}
function passedChild(result: ProcessResult): void {
  expect(result.code).toBe(0);
  expect(result.outcome).toBe("exited");
  expect(result.termination).toBe("closed");
  expect(result.stdout).toBe('{"passed":true}\n');
}

test("native atomic registration temporaries are bounded separately from permanent entries", async () => {
  const entries = join(fixture.root, ".git/teamagent-parallel/entries");
  const prefix = taskKey("shared-result-fixture", "first");
  const paths = Array.from({ length: 1001 }, () =>
    join(entries, prefix + ".json." + randomUUID() + ".tmp"),
  );
  try {
    for (let offset = 0; offset < 1000; offset += 16)
      await Promise.all(
        paths
          .slice(offset, Math.min(offset + 16, 1000))
          .map((path) => writeFile(path, "", { encoding: "utf8", flag: "wx" })),
      );
    // Two permanent registrations plus 1,000 transient files are not 1,002 permanent entries.
    await (await sharedResultOwner(fixture.a)).validate();
    const extra = paths[1000];
    if (!extra) throw new Error("Missing transient fixture path");
    await writeFile(extra, "", { encoding: "utf8", flag: "wx" });
    await rejects(sharedResultOwner(fixture.a), /transient/u);
  } finally {
    for (const path of paths) await rm(path, { force: true });
  }
}, 120_000);

test("atomic replacement gets a bounded consistent snapshot, but removal and corruption reject", async () => {
  const name = taskKey("shared-result-fixture", "first") + ".json";
  const path = join(fixture.root, ".git/teamagent-parallel/entries", name);
  const original = await readFile(path, "utf8");
  let replacements = 0,
    snapshots = 0;
  const owner = await sharedResultOwner(fixture.a, async (phase, attempt, selected) => {
    if (phase === "registry-snapshot") snapshots++;
    if (phase === "registration-read" && selected === name && attempt === 0) {
      replacements++;
      await atomicText(path, original);
    }
  });
  expect(replacements).toBe(1);
  expect(snapshots).toBe(2);
  const observed = snapshots;
  await owner.validate();
  await inspectSharedResult(owner, encodedDigest("cheap-owner-validation"));
  await inspectSharedResult(owner, encodedDigest("cheap-owner-validation"));
  expect(snapshots).toBe(observed);

  replacements = 0;
  await rejects(
    sharedResultOwner(fixture.a, async (phase, _attempt, selected) => {
      if (phase === "registration-read" && selected === name) {
        replacements++;
        await atomicText(path, original);
      }
    }),
  );
  expect(replacements).toBe(3);

  const backup = join(fixture.root, ".cache/selected-registration.original");
  try {
    await rejects(
      sharedResultOwner(fixture.a, async (phase, _attempt, selected) => {
        if (phase === "registration-read" && selected === name) await rename(path, backup);
      }),
    );
    await rejects(owner.validate());
  } finally {
    await rename(backup, path);
  }
  try {
    await atomicText(path, "{}\n");
    await rejects(sharedResultOwner(fixture.a));
    await rejects(owner.validate());
  } finally {
    await atomicText(path, original);
  }
}, 120_000);

test("linked and oversized temporary or selected registrations fail closed", async () => {
  const entries = join(fixture.root, ".git/teamagent-parallel/entries");
  const name = taskKey("shared-result-fixture", "first") + ".json";
  const path = join(entries, name),
    original = await readFile(path);
  const temporary = join(entries, name + "." + randomUUID() + ".tmp");
  try {
    await writeFile(temporary, "x".repeat(16 * 1024 + 1), { encoding: "utf8", flag: "wx" });
    await rejects(sharedResultOwner(fixture.a), /bounded/u);
  } finally {
    await rm(temporary);
  }
  const target = await mkdtemp("teamagent-registry-link-target-");
  try {
    await symlink(target, temporary, process.platform === "win32" ? "junction" : "dir");
    await rejects(sharedResultOwner(fixture.a), /[Ll]ink|bounded/u);
  } finally {
    await rm(temporary, { recursive: true, force: true });
  }
  try {
    await writeFile(path, "x".repeat(16 * 1024 + 1), "utf8");
    await rejects(sharedResultOwner(fixture.a), /bounded/u);
  } finally {
    await writeFile(path, original);
  }
}, 120_000);

test("unrelated keys in another process proceed while native ownership discovery is paused", async () => {
  const worker = fileURLToPath(new URL("./shared-verification-child.ts", import.meta.url));
  const project = fileURLToPath(new URL("../", import.meta.url));
  const controls = join(fixture.a, ".cache/shared-result-test");
  await mkdir(controls, { recursive: true });
  const slow = runProcess(
    project,
    process.execPath,
    [worker, fixture.a, "ownership", encodedDigest("slow-ownership-process")],
    { timeoutMs: 120_000, maximumBytes: 4096 },
  );
  try {
    await waitForFile(join(controls, "ownership.ready"));
    // The paused child is deliberately unreleased. A hidden global/key lock would
    // make this independent process hit the unchanged five-second lock deadline.
    passedChild(
      await runProcess(
        project,
        process.execPath,
        [worker, fixture.b, "normal", encodedDigest("unrelated-ownership-process")],
        { timeoutMs: 120_000, maximumBytes: 4096 },
      ),
    );
  } finally {
    await writeFile(join(controls, "ownership.release"), "release\n", "utf8");
    passedChild(await slow);
  }
}, 120_000);

test("a nearly-full inventory holds no lock against unrelated-key work in another process", async () => {
  const root = await primary();
  await runCachedTask(root, task("near-capacity-seed"), async () => {});
  await fillReservations(root, sharedResultLimits.keys - 2);
  const worker = fileURLToPath(new URL("./shared-verification-child.ts", import.meta.url));
  const project = fileURLToPath(new URL("../", import.meta.url));
  const controls = join(root, ".cache/shared-result-test");
  await mkdir(controls, { recursive: true });
  const slow = runProcess(
    project,
    process.execPath,
    [worker, root, "inventory", encodedDigest("slow-inventory-process")],
    { timeoutMs: 120_000, maximumBytes: 4096 },
  );
  try {
    await waitForFile(join(controls, "inventory.ready"));
    passedChild(
      await runProcess(
        project,
        process.execPath,
        [worker, root, "normal", encodedDigest("unrelated-inventory-process")],
        { timeoutMs: 120_000, maximumBytes: 4096 },
      ),
    );
  } finally {
    await writeFile(join(controls, "inventory.release"), "release\n", "utf8");
    passedChild(await slow);
  }
  const owner = await sharedResultOwner(root);
  expect((await inspectSharedResult(owner, encodedDigest("slow-inventory-process"))).blocked).toBe(
    false,
  );
  expect(
    (await inspectSharedResult(owner, encodedDigest("unrelated-inventory-process"))).blocked,
  ).toBe(false);
}, 120_000);

test("new registration ambiguity is rejected at final hit and fresh-publication boundaries", async () => {
  const query = async (args: readonly string[]) => git(fixture.root, args);
  const entry = await loadParallelEntry(query, "shared-result-fixture", "second");
  if (!entry) throw new Error("Missing second fixture registration");
  const duplicate = {
    ...entry,
    sessionId: "ambiguous-fixture",
    taskId: "duplicate",
    name: "duplicate",
  };
  const path = join(
    fixture.root,
    ".git/teamagent-parallel/entries",
    taskKey(duplicate.sessionId, duplicate.taskId) + ".json",
  );
  const hit = task("final-hit-ownership");
  await runCachedTask(fixture.a, hit, async () => {});
  try {
    await rejects(
      runCachedTask(fixture.b, hit, async () => {}, {
        validate: async () => {
          await saveParallelEntry(query, duplicate);
        },
      }),
    );
  } finally {
    await rm(path, { force: true });
  }
  const fresh = task("final-fresh-ownership");
  try {
    await rejects(
      runCachedTask(fixture.b, fresh, async () => {
        await saveParallelEntry(query, duplicate);
      }),
    );
  } finally {
    await rm(path, { force: true });
  }
  const key = (await inputIdentity(fixture.a, fresh)).key;
  expect((await inspectSharedResult(await sharedResultOwner(fixture.a), key)).blocked).toBe(true);
  expect((await runCachedTask(fixture.a, fresh, async () => {})).hit).toBe(false);
}, 120_000);

test("unrelated atomic registry churn refreshes outside locks and still records actual failure", async () => {
  const query = async (args: readonly string[]) => git(fixture.root, args);
  const entry = await loadParallelEntry(query, "shared-result-fixture", "first");
  if (!entry) throw new Error("Missing first fixture registration");
  const definition = task("failure-with-registry-churn");
  await runCachedTask(fixture.a, definition, async () => {});
  try {
    await rejects(
      runCachedTask(
        fixture.b,
        definition,
        async () => {
          await saveParallelEntry(query, {
            ...entry,
            reviewKey: encodedDigest("unrelated registry update"),
          });
          throw new Error("Actual failure during unrelated registry churn");
        },
        { forceFresh: true },
      ),
      /Actual failure during unrelated registry churn/u,
    );
    const key = (await inputIdentity(fixture.a, definition)).key;
    expect((await inspectSharedResult(await sharedResultOwner(fixture.a), key)).blocked).toBe(true);
  } finally {
    await saveParallelEntry(query, entry);
  }
}, 120_000);

test("unrelated malformed registry metadata cannot pass the final reuse refresh", async () => {
  const path = join(
    fixture.root,
    ".git/teamagent-parallel/entries",
    encodedDigest("malformed registration fixture") + ".json",
  );
  const definition = task("final-corrupt-registration");
  await runCachedTask(fixture.a, definition, async () => {});
  try {
    await rejects(
      runCachedTask(fixture.b, definition, async () => {}, {
        validate: async () => {
          await writeFile(path, "{}\n", { encoding: "utf8", flag: "wx" });
        },
      }),
    );
  } finally {
    await rm(path, { force: true });
  }
}, 120_000);

test("pending, missing and malformed reservation accounts reject without reconstructing capacity", async () => {
  const root = await primary(),
    definition = task("reservation-interruption");
  await runCachedTask(root, definition, async () => {});
  const owner = await sharedResultOwner(root),
    key = (await inputIdentity(root, definition)).key;
  const account = join(root, sharedResultDirectory, "reservations.json");
  const pending = join(root, sharedResultDirectory, "reservations-pending.json");
  const backup = join(root, ".cache/reservations.original");
  const original = await readFile(account);
  const head = join(root, sharedResultDirectory, key, "head.json"),
    originalHead = await readFile(head);
  try {
    await writeFile(pending, "unconfirmed fixture\n", { encoding: "utf8", flag: "wx" });
    await rejects(inspectSharedResult(owner, key), /unconfirmed/u);
    await rejects(beginSharedResult(owner, key), /unconfirmed/u);
  } finally {
    await rm(pending);
  }
  try {
    await rename(account, backup);
    await rejects(inspectSharedResult(owner, key), /no confirmed reservation/u);
    await rejects(beginSharedResult(owner, key), /no confirmed reservation/u);
  } finally {
    await rename(backup, account);
  }
  try {
    await writeFile(account, "{}\n", "utf8");
    await rejects(inspectSharedResult(owner, key));
    await rejects(beginSharedResult(owner, key));
    expect(await readFile(account, "utf8")).toBe("{}\n");
  } finally {
    await writeFile(account, original);
  }
  expect(await readFile(head)).toEqual(originalHead);
  expect((await inspectSharedResult(owner, key)).blocked).toBe(false);
}, 120_000);

test("registered worktrees reuse exact results and both rejection stores remain authoritative", async () => {
  const definition = task("cross-worktree");
  let runs = 0;
  const run = async () => {
    runs++;
  };
  expect((await inputIdentity(fixture.a, definition)).key).toBe(
    (await inputIdentity(fixture.b, definition)).key,
  );
  expect((await runCachedTask(fixture.a, definition, run)).hit).toBe(false);
  expect((await runCachedTask(fixture.b, definition, run)).hit).toBe(true);
  expect(runs).toBe(1);
  await rejects(
    runCachedTask(
      fixture.b,
      definition,
      async () => {
        throw new Error("Actual failed fresh check");
      },
      { forceFresh: true },
    ),
  );
  // A's older local receipt cannot bypass B's shared failure.
  expect((await runCachedTask(fixture.a, definition, run)).hit).toBe(false);
  // A's new shared success cannot clear B's local cumulative rejection.
  expect((await runCachedTask(fixture.b, definition, run)).hit).toBe(false);
  expect((await runCachedTask(fixture.a, definition, run)).hit).toBe(true);
  expect(runs).toBe(3);
}, 120_000);

test("late failures invalidate newer success and stale successes cannot overwrite a failure", async () => {
  const owner = await sharedResultOwner(fixture.root),
    key = encodedDigest("late-failure");
  const a = required(await beginSharedResult(owner, key));
  const b = required(await beginSharedResult(owner, key));
  expect(await completeSharedResult(owner, b, receipt)).toBe(true);
  await failSharedResult(owner, a);
  expect((await inspectSharedResult(owner, key)).blocked).toBe(true);
  const c = required(await beginSharedResult(owner, key));
  expect(await completeSharedResult(owner, c, receipt)).toBe(true);
  const old = required(await beginSharedResult(owner, key));
  const newer = required(await beginSharedResult(owner, key));
  await failSharedResult(owner, newer);
  expect(await completeSharedResult(owner, old, receipt)).toBe(false);
  expect((await inspectSharedResult(owner, key)).blocked).toBe(true);
  await rejects(completeSharedResult(owner, old, receipt), /terminal outcome/u);
}, 120_000);

test("raw inputs and prerequisite values remain part of cross-worktree identity", async () => {
  const definition = task("input-boundaries");
  await runCachedTask(fixture.a, definition, async () => {});
  expect(
    (
      await runCachedTask(
        fixture.b,
        { ...definition, values: ["different installed tool identity"] },
        async () => {},
      )
    ).hit,
  ).toBe(false);
  const path = join(fixture.b, "input.ts"),
    original = await readFile(path);
  try {
    await writeFile(path, "export const value = 1;\r\n", "utf8");
    expect((await runCachedTask(fixture.b, definition, async () => {})).hit).toBe(false);
    await rejects(
      runCachedTask(
        fixture.b,
        definition,
        async () => {
          await writeFile(path, "export const value = 2;\n", "utf8");
        },
        { forceFresh: true },
      ),
      /inputs changed/u,
    );
  } finally {
    await writeFile(path, original);
  }
}, 120_000);

test("an abandoned execution is superseded without deleting its start", async () => {
  const owner = await sharedResultOwner(fixture.root),
    key = encodedDigest("abandoned-execution");
  const abandoned = required(await beginSharedResult(owner, key));
  const recovered = required(await beginSharedResult(owner, key));
  expect(await completeSharedResult(owner, recovered, receipt)).toBe(true);
  expect((await inspectSharedResult(owner, key)).bytes).toEqual(receipt);
  expect(
    await readFile(
      join(fixture.root, sharedResultDirectory, key, `${abandoned.token}.start.json`),
      "utf8",
    ),
  ).toContain(abandoned.token);
}, 120_000);

test("concurrent starts serialize metadata while only the newest attempt publishes", async () => {
  const owner = await sharedResultOwner(fixture.root),
    key = encodedDigest("concurrent-begins");
  const attempts = (
    await Promise.all([
      beginSharedResult(owner, key),
      beginSharedResult(owner, key),
      beginSharedResult(owner, key),
    ])
  )
    .map(required)
    .sort((left, right) => left.epoch - right.epoch);
  expect(attempts.map((attempt) => attempt.epoch)).toEqual([1, 2, 3]);
  for (const attempt of attempts)
    expect(await completeSharedResult(owner, attempt, receipt)).toBe(attempt.epoch === 3);
  expect((await inspectSharedResult(owner, key)).bytes).toEqual(receipt);
}, 120_000);

test("a concurrent shared invalidation during hit validation prevents reuse", async () => {
  const definition = task("hit-invalidation");
  await runCachedTask(fixture.a, definition, async () => {});
  const owner = await sharedResultOwner(fixture.b),
    key = (await inputIdentity(fixture.b, definition)).key;
  await rejects(
    runCachedTask(
      fixture.b,
      definition,
      async () => {
        throw new Error("A hit cannot execute this callback");
      },
      {
        validate: async () => {
          await invalidateSharedResult(owner, key);
        },
      },
    ),
    /changed during/u,
  );
  expect((await inspectSharedResult(owner, key)).blocked).toBe(true);
}, 120_000);

test("metadata interruption and missing pointed result fail closed", async () => {
  const owner = await sharedResultOwner(fixture.root),
    key = encodedDigest("interrupted-metadata");
  const attempt = required(await beginSharedResult(owner, key));
  const directory = join(fixture.root, sharedResultDirectory, key);
  // Simulate a durable result before the corresponding head, with its transaction unconfirmed.
  await writeFile(join(directory, "receipt.json"), receipt);
  await writeFile(join(directory, "pending.json"), '{"incompleteFixture":true}\n', "utf8");
  await rejects(inspectSharedResult(owner, key), /unconfirmed/u);
  await rejects(beginSharedResult(owner, key), /unconfirmed/u);
  expect(await readFile(join(directory, `${attempt.token}.start.json`), "utf8")).toContain(
    attempt.token,
  );
  const missing = encodedDigest("missing-result"),
    fresh = required(await beginSharedResult(owner, missing));
  await completeSharedResult(owner, fresh, receipt);
  await rm(join(fixture.root, sharedResultDirectory, missing, "receipt.json"));
  await rejects(inspectSharedResult(owner, missing));
}, 120_000);

test("an unknown metadata owner stays protected and generations never wrap", async () => {
  const owner = await sharedResultOwner(fixture.root),
    key = encodedDigest("overflow");
  const attempt = required(await beginSharedResult(owner, key));
  const directory = join(fixture.root, sharedResultDirectory, key);
  await writeFile(
    join(directory, `${attempt.token}.start.json`),
    JSON.stringify({ ...attempt, epoch: Number.MAX_SAFE_INTEGER }) + "\n",
    "utf8",
  );
  await writeFile(
    join(directory, "head.json"),
    JSON.stringify({
      version: 1,
      repository: owner.repository,
      key,
      epoch: Number.MAX_SAFE_INTEGER,
      token: attempt.token,
      state: "running",
      receipt: null,
    }) + "\n",
    "utf8",
  );
  await rejects(beginSharedResult(owner, key), /generation exhausted/u);
  const locked = encodedDigest("unknown-owner");
  const path = join(fixture.root, ".cache/verification", `shared-result-${locked}.lock`);
  await writeFile(path, '{"fixture":"unknown owner"}\n', { encoding: "utf8", flag: "wx" });
  await rejects(inspectSharedResult(owner, locked), /locked/u);
  expect(await readFile(path, "utf8")).toBe('{"fixture":"unknown owner"}\n');
}, 120_000);

test("ownership excludes unregistered worktrees and independent repositories", async () => {
  const unregistered = join(fixture.root, ".cache/worktrees/unregistered");
  git(fixture.root, ["worktree", "add", "--quiet", "--detach", unregistered, "HEAD"]);
  await rejects(sharedResultOwner(unregistered), /registration/u);
  const unrelated = await primary();
  expect((await sharedResultOwner(unrelated)).repository).not.toBe(
    (await sharedResultOwner(fixture.root)).repository,
  );
  expect(
    (await inspectSharedResult(await sharedResultOwner(unrelated), encodedDigest("late-failure")))
      .stamp,
  ).toBe("absent");
}, 120_000);

test("a detached candidate uses the persisted native registration and changes invalidate ownership", async () => {
  const query = async (args: readonly string[]) => git(fixture.root, args);
  const entry = await loadParallelEntry(query, "shared-result-fixture", "first");
  if (!entry) throw new Error("Missing fixture registration");
  const candidate = join(
    fixture.root,
    ".cache/worktrees",
    `.integration-${taskKey(entry.sessionId, entry.taskId).slice(0, 16)}-ABC123`,
  );
  git(fixture.root, ["worktree", "add", "--quiet", "--detach", candidate, "HEAD"]);
  await saveParallelEntry(query, { ...entry, state: "integrating", workspace: candidate });
  const owner = await sharedResultOwner(candidate);
  expect(owner.repository).toBe((await sharedResultOwner(fixture.a)).repository);
  await saveParallelEntry(query, entry);
  await rejects(owner.validate(), /registration/u);
}, 120_000);

test("oversized and redirected shared evidence is not reusable", async () => {
  const root = await primary(),
    owner = await sharedResultOwner(root),
    key = encodedDigest("oversized");
  const attempt = required(await beginSharedResult(owner, key));
  await completeSharedResult(owner, attempt, receipt);
  await writeFile(
    join(root, sharedResultDirectory, key, "receipt.json"),
    "x".repeat(64 * 1024 + 1),
    "utf8",
  );
  await rejects(inspectSharedResult(owner, key), /bounds/u);
  const target = await mkdtemp("teamagent-shared-link-target-");
  const redirected = encodedDigest("redirected");
  await symlink(
    target,
    join(root, sharedResultDirectory, redirected),
    process.platform === "win32" ? "junction" : "dir",
  );
  await rejects(inspectSharedResult(owner, redirected), /[Ll]ink/u);
}, 120_000);

test("CI executes and output-producing or nonportable tasks cannot share", async () => {
  for (const definition of [
    { ...task("build"), kind: "build" as const, outputs: ["output"] },
    { ...task("outputs"), outputs: ["output"] },
    { ...task("private"), portable: false },
  ])
    await rejects(
      runCachedTask(fixture.a, definition, async () => {}),
      /portable verification/u,
    );
  const definition = task("ci");
  await runCachedTask(fixture.a, definition, async () => {});
  const previous = process.env.GITHUB_ACTIONS;
  process.env.GITHUB_ACTIONS = "true";
  try {
    expect((await runCachedTask(fixture.b, definition, async () => {})).hit).toBe(false);
  } finally {
    if (previous === undefined) Reflect.deleteProperty(process.env, "GITHUB_ACTIONS");
    else process.env.GITHUB_ACTIONS = previous;
  }
}, 120_000);

test("production group success waits for the complete live prerequisite barrier", async () => {
  const prerequisitePath = join(fixture.a, ".cache/live-prerequisite.fixture");
  await writeFile(prerequisitePath, "original tool bytes\n", "utf8");
  const prerequisites: readonly [string] = [encodedDigest(await readFile(prerequisitePath))];
  const definition = verificationTask("format", prerequisites);
  const local = join(fixture.a, cacheDirectory, "verification-format.json");
  const owner = await sharedResultOwner(fixture.b);
  let key = "",
    executed = 0;
  await rejects(
    withVerificationResults(fixture.a, prerequisites, async (retain) => {
      const result = await cachedVerification(
        fixture.a,
        "format",
        prerequisites,
        async () => {
          executed++;
        },
        true,
      );
      retain("format", result);
      key = result.key;
      expect((await inspectSharedResult(owner, key)).blocked).toBe(true);
      expect((await inspectSharedResult(owner, key)).bytes).toBeUndefined();
      await rejects(readFile(local), { code: "ENOENT" });
      // A second worktree must execute while the first gate still owes its live checks.
      await rejects(
        runCachedTask(fixture.b, definition, async () => {
          executed++;
          throw new Error("Second worktree executed instead of reusing premature success");
        }),
        /executed instead/u,
      );
      await writeFile(prerequisitePath, "changed tool bytes\n", "utf8");
      if (encodedDigest(await readFile(prerequisitePath)) !== prerequisites[0])
        throw new Error("Live prerequisite bytes changed after the group");
    }),
    /Live prerequisite bytes changed/u,
  );
  expect(executed).toBe(2);
  expect((await inspectSharedResult(owner, key)).blocked).toBe(true);
  await rejects(readFile(local), { code: "ENOENT" });

  await writeFile(prerequisitePath, "original tool bytes\n", "utf8");
  await withVerificationResults(fixture.a, prerequisites, async (retain) => {
    retain(
      "format",
      await cachedVerification(fixture.a, "format", prerequisites, async () => {
        executed++;
      }),
    );
    expect(encodedDigest(await readFile(prerequisitePath))).toBe(prerequisites[0]);
    // Nothing is published while even the final callback is still executing.
    expect((await inspectSharedResult(owner, key)).blocked).toBe(true);
  });
  expect((await inspectSharedResult(owner, key)).blocked).toBe(false);
  expect(
    (
      await runCachedTask(fixture.a, definition, async () => {
        throw new Error("Expected verified reuse");
      })
    ).hit,
  ).toBe(true);
}, 120_000);

test("a failed final barrier settles and invalidates all four retained groups", async () => {
  const prerequisites = [encodedDigest("all retained groups failure settlement")];
  const groups = ["format", "types", "lint", "tests"] as const;
  const keys: string[] = [];
  const failure = new Error("Final live barrier rejected all retained groups");
  let executions = 0;
  await rejects(
    withVerificationResults(fixture.a, prerequisites, async (retain) => {
      for (const id of groups) {
        const result = await cachedVerification(fixture.a, id, prerequisites, async () => {
          executions++;
        });
        expect(result.hit).toBe(false);
        expect(result.pending).toBeDefined();
        retain(id, result);
        keys.push(result.key);
      }
      throw failure;
    }),
    (error: unknown) => {
      if (error !== failure)
        throw new Error(
          "Failure settlement did not preserve the sole barrier error:\n" + failureDetails(error),
        );
      return true;
    },
  );
  expect(executions).toBe(4);
  expect(keys).toHaveLength(4);
  const owner = await sharedResultOwner(fixture.b);
  for (const key of keys) {
    const result = await inspectSharedResult(owner, key);
    expect(result.blocked).toBe(true);
    expect(result.bytes).toBeUndefined();
  }
}, 120_000);

test("a shared-only hit retains its consumed key when a later source barrier fails", async () => {
  const prerequisites = [encodedDigest("shared-only hit source failure fixture")];
  const definition = verificationTask("tests", prerequisites);
  const source = join(fixture.b, ".gitattributes"),
    original = await readFile(source);
  const previous = process.env.TEAMAGENT_VERIFICATION_CACHE_WRITE;
  process.env.TEAMAGENT_VERIFICATION_CACHE_WRITE = "local";
  let key = "";
  try {
    await withVerificationResults(fixture.a, prerequisites, async (retain) => {
      const result = await cachedVerification(fixture.a, "tests", prerequisites, async () => {});
      retain("tests", result);
      key = result.key;
    });
    const before = await reviewSourceIdentity(fixture.b, prerequisites);
    const failure = new Error("Final source identity changed after shared-only reuse");
    await rejects(
      withVerificationResults(fixture.b, prerequisites, async (retain) => {
        const result = await cachedVerification(fixture.b, "tests", prerequisites, async () => {
          throw new Error("Expected shared-only hit before source changes");
        });
        expect(result.hit).toBe(true);
        expect(result.key).toBe(key);
        retain("tests", result);
        await rejects(readFile(join(fixture.b, cacheDirectory, "verification-tests.json")), {
          code: "ENOENT",
        });
        await writeFile(source, "* text eol=lf\n# changed after shared-only reuse\n", "utf8");
        expect((await inputIdentity(fixture.b, definition)).key).not.toBe(key);
        if ((await reviewSourceIdentity(fixture.b, prerequisites)).key !== before.key)
          throw failure;
      }),
      (error: unknown) => {
        if (error !== failure)
          throw new Error(
            "Shared-only invalidation did not preserve the sole barrier error:\n" +
              failureDetails(error),
          );
        return true;
      },
    );
    // B had no local receipt from which invalidation could rediscover this old key.
    expect((await inspectSharedResult(await sharedResultOwner(fixture.a), key)).blocked).toBe(true);
    let executions = 0;
    expect(
      (
        await runCachedTask(fixture.a, definition, async () => {
          executions++;
        })
      ).hit,
    ).toBe(false);
    expect(executions).toBe(1);
  } finally {
    await writeFile(source, original);
    if (previous === undefined)
      Reflect.deleteProperty(process.env, "TEAMAGENT_VERIFICATION_CACHE_WRITE");
    else process.env.TEAMAGENT_VERIFICATION_CACHE_WRITE = previous;
  }
}, 120_000);

test("deferred local publication cannot clear an identical newer rejection or supersede a later start", async () => {
  const definition = task("deferred-local-order");
  const options = { forceFresh: true, deferReceipt: true, receiptWritePolicy: "local" as const };
  const fail = async (): Promise<void> => {
    throw new Error("Same-key failure");
  };
  await rejects(runCachedTask(fixture.a, definition, fail));
  const rejectionPath = join(
    fixture.a,
    cacheDirectory,
    "rejected-verification-deferred-local-order.json",
  );
  const rejectedBytes = await readFile(rejectionPath, "utf8");
  const older = await runCachedTask(fixture.a, definition, async () => {}, options);
  await rejects(runCachedTask(fixture.a, definition, fail, { forceFresh: true }));
  expect(await readFile(rejectionPath, "utf8")).toBe(rejectedBytes);
  await pending(older).complete();
  expect(await readFile(rejectionPath, "utf8")).toBe(rejectedBytes);
  expect((await inspectSharedResult(await sharedResultOwner(fixture.a), older.key)).blocked).toBe(
    true,
  );
  const local = join(fixture.a, cacheDirectory, "verification-deferred-local-order.json");
  await rejects(readFile(local), { code: "ENOENT" });

  const first = await runCachedTask(fixture.a, definition, async () => {}, options);
  const second = await runCachedTask(fixture.a, definition, async () => {}, options);
  await pending(first).complete();
  await rejects(readFile(local), { code: "ENOENT" });
  expect(await readFile(rejectionPath, "utf8")).toBe(rejectedBytes);
  await pending(second).complete();
  await rejects(readFile(rejectionPath), { code: "ENOENT" });
  expect(
    (
      await runCachedTask(fixture.b, definition, async () => {
        throw new Error("Expected current-generation reuse");
      })
    ).hit,
  ).toBe(true);
}, 120_000);

test("deferred completion rechecks current inputs and settles other groups after an uncertain failure", async () => {
  const definition = task("deferred-input-change");
  const result = await runCachedTask(fixture.a, definition, async () => {}, { deferReceipt: true });
  const source = join(fixture.a, "input.ts"),
    original = await readFile(source);
  try {
    await writeFile(source, "export const value = 2;\n", "utf8");
    await rejects(pending(result).complete(), /inputs changed before/u);
  } finally {
    await writeFile(source, original);
  }
  expect((await inspectSharedResult(await sharedResultOwner(fixture.a), result.key)).blocked).toBe(
    true,
  );

  const prerequisites = [encodedDigest("uncertain gate fixture")];
  let uncertainPath = "",
    secondKey = "";
  try {
    await rejects(
      withVerificationResults(fixture.a, prerequisites, async (retain) => {
        const first = await cachedVerification(fixture.a, "types", prerequisites, async () => {});
        const second = await cachedVerification(fixture.a, "lint", prerequisites, async () => {});
        retain("types", first);
        retain("lint", second);
        secondKey = second.key;
        uncertainPath = join(fixture.root, sharedResultDirectory, first.key, "pending.json");
        await writeFile(uncertainPath, "{}\n", { encoding: "utf8", flag: "wx" });
        throw new Error("Final export integrity rejected the gate");
      }),
      (error: unknown) =>
        error instanceof AggregateError &&
        error.errors.some(
          (item: unknown) =>
            item instanceof Error && item.message.includes("Final export integrity"),
        ),
    );
    expect((await inspectSharedResult(await sharedResultOwner(fixture.a), secondKey)).blocked).toBe(
      true,
    );
    expect(await readFile(uncertainPath, "utf8")).toBe("{}\n");
    await rejects(readFile(join(fixture.a, cacheDirectory, "verification-lint.json")), {
      code: "ENOENT",
    });
  } finally {
    if (uncertainPath) await rm(uncertainPath);
  }
}, 120_000);

test("capacity disables every old receipt while genuine checks keep running", async () => {
  const root = await primary(),
    definition = task("capacity-existing");
  await runCachedTask(root, definition, async () => {}, { receiptWritePolicy: "tracked" });
  await fillReservations(root, sharedResultLimits.keys);

  let notices = 0,
    executions = 0;
  const options = {
    sharedUnavailable: () => {
      notices++;
    },
  };
  expect(
    (
      await runCachedTask(
        root,
        task("capacity-new"),
        async () => {
          executions++;
        },
        options,
      )
    ).sharedUnavailable,
  ).toBe("capacity");
  await rejects(
    runCachedTask(
      root,
      definition,
      async () => {
        throw new Error("Fresh failure at full capacity");
      },
      { ...options, forceFresh: true },
    ),
  );
  expect(
    (
      await runCachedTask(
        root,
        definition,
        async () => {
          executions++;
        },
        options,
      )
    ).hit,
  ).toBe(false);
  // Neither successful execution nor local rejection clearing removes the global marker.
  expect(
    (
      await runCachedTask(
        root,
        definition,
        async () => {
          executions++;
        },
        options,
      )
    ).hit,
  ).toBe(false);
  expect(notices).toBe(4);
  expect(executions).toBe(3);
  expect(
    (
      await inspectSharedResult(
        await sharedResultOwner(root),
        (await inputIdentity(root, definition)).key,
      )
    ).unavailable,
  ).toBe("capacity");

  await rejects(
    runCachedTask(
      root,
      definition,
      async () => {
        throw new Error("Retained rejection at capacity");
      },
      { forceFresh: true },
    ),
  );
  const rejection = join(root, cacheDirectory, "rejected-verification-capacity-existing.json");
  const rejectedBytes = await readFile(rejection, "utf8");
  const retained = join(root, receiptDirectory, "verification-capacity-existing.json");
  const retainedBytes = await readFile(retained, "utf8");
  const deferred = await runCachedTask(root, definition, async () => {}, { deferReceipt: true });
  expect(deferred.sharedUnavailable).toBe("capacity");
  await pending(deferred).complete();
  expect(await readFile(rejection, "utf8")).toBe(rejectedBytes);
  expect(await readFile(retained, "utf8")).toBe(retainedBytes);
}, 120_000);

test("a forced CI failure invalidates normal worktrees with the same complete key", async () => {
  const definition = task("ci-failure-ordering");
  await runCachedTask(fixture.a, definition, async () => {});
  const original = await inputIdentity(fixture.a, definition);
  const previous = process.env.GITHUB_ACTIONS;
  process.env.GITHUB_ACTIONS = "true";
  try {
    expect((await inputIdentity(fixture.b, definition)).key).toBe(original.key);
    await rejects(
      runCachedTask(fixture.b, definition, async () => {
        throw new Error("Actual forced CI failure");
      }),
      /forced CI failure/u,
    );
  } finally {
    if (previous === undefined) Reflect.deleteProperty(process.env, "GITHUB_ACTIONS");
    else process.env.GITHUB_ACTIONS = previous;
  }
  expect((await runCachedTask(fixture.a, definition, async () => {})).hit).toBe(false);
  expect((await runCachedTask(fixture.a, definition, async () => {})).hit).toBe(true);
}, 120_000);
