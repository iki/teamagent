import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import {
  access,
  lstat,
  mkdir,
  readFile,
  readdir,
  rename,
  rm,
  symlink,
  writeFile,
} from "node:fs/promises";
import { hostname } from "node:os";
import { join } from "node:path";
import { test } from "node:test";
import { metadataOwnerAlive, withMetadataLock } from "../app/check/metadata-lock.ts";
import { archive, freezeArchive, type RecordInput } from "../app/conversations/archive.ts";
import {
  finalizeHookDiagnostics,
  reserveHookDiagnostics,
  writeHookDiagnostic,
} from "../app/hooks/storage.ts";
import { digest } from "../app/workflow/storage.ts";
import { assertTemporaryFixture, mkdtemp } from "./temporary.ts";

async function fixture(run: (root: string, dead: number) => Promise<void>): Promise<void> {
  const root = await mkdtemp("metadata-lock-");
  const child = spawnSync(process.execPath, ["-e", "process.exit(0)"], {
    cwd: root,
    windowsHide: true,
    timeout: 5000,
    maxBuffer: 1024,
    encoding: "utf8",
  });
  assert.equal(child.error, undefined);
  assert.equal(child.status, 0);
  assert.ok(Number.isSafeInteger(child.pid) && child.pid > 0);
  assert.equal(metadataOwnerAlive(child.pid), false);
  try {
    await run(root, child.pid);
  } finally {
    await assertTemporaryFixture(root);
    await rm(root, { recursive: true });
  }
}
function owner(pid: number, token = "original", host = hostname()): string {
  return JSON.stringify({ pid, hostname: host, token, startedAt: Date.now() }) + "\n";
}
async function abandoned(path: string, raw: string, legacy = false): Promise<void> {
  if (legacy) await writeFile(path, raw, "utf8");
  else {
    await mkdir(path);
    await writeFile(join(path, "owner.json"), raw, "utf8");
  }
}
async function originals(root: string): Promise<string[]> {
  const directory = join(root, ".lock-recovery");
  const records = (await readdir(directory)).filter((name) => /^[a-f0-9]{64}$/u.test(name));
  return Promise.all(
    records.map((name) => readFile(join(directory, name, "original.json"), "utf8")),
  );
}

await test("fresh dead-owner locks recover without an age wait and retain exact originals", async () => {
  await fixture(async (root, dead) => {
    for (const legacy of [false, true]) {
      const path = join(root, legacy ? "legacy.lock" : "directory.lock");
      const raw = owner(dead, legacy ? "legacy-original" : "directory-original");
      await abandoned(path, raw, legacy);
      let calls = 0;
      await withMetadataLock(
        path,
        async () => {
          calls++;
          assert.equal(
            (await lstat(path)).isDirectory(),
            true,
            "every new acquisition has the directory format",
          );
          assert.notEqual(await readFile(join(path, "owner.json"), "utf8"), raw);
        },
        { legacyFile: legacy },
      );
      assert.equal(calls, 1);
      await assert.rejects(access(path), { code: "ENOENT" });
      assert.ok((await originals(root)).includes(raw));
    }
  });
});

await test("live, reused, foreign, unknown and malformed ownership cannot authorize recovery", async () => {
  await fixture(async (root, dead) => {
    const cases = [
      { name: "live", raw: owner(process.pid), isAlive: () => false },
      {
        name: "reused",
        raw: owner(process.pid, "recorded-before-current-process"),
        isAlive: () => false,
      },
      { name: "foreign", raw: owner(dead, "foreign", "another-host"), isAlive: () => false },
      { name: "unknown", raw: owner(dead), isAlive: () => undefined },
      { name: "malformed", raw: "{broken\n", isAlive: () => false },
      { name: "oversized", raw: "x".repeat(4097), isAlive: () => false },
      {
        name: "missing-required-timestamp",
        raw: JSON.stringify({ pid: dead, hostname: hostname(), token: "missing" }) + "\n",
        isAlive: () => false,
      },
    ];
    for (const item of cases) {
      const path = join(root, item.name);
      await abandoned(path, item.raw);
      await assert.rejects(
        withMetadataLock(path, async () => assert.fail("Protected owner was replaced"), {
          waitMs: 10,
          isAlive: item.isAlive,
          requireStartedAt: true,
        }),
        /locked/,
      );
      assert.equal(await readFile(join(path, "owner.json"), "utf8"), item.raw);
    }
    const initializing = join(root, "initializing");
    await mkdir(initializing);
    await assert.rejects(
      withMetadataLock(initializing, async () => assert.fail("Unknown initializer was replaced"), {
        waitMs: 10,
      }),
      /locked/,
    );
    assert.deepEqual(await readdir(initializing), []);
    const extra = join(root, "extra-evidence");
    await abandoned(extra, owner(dead));
    await writeFile(join(extra, "keep.txt"), "unrelated evidence\n");
    await assert.rejects(
      withMetadataLock(extra, async () => assert.fail("Unexpected evidence was removed"), {
        waitMs: 10,
      }),
      /locked/,
    );
    assert.equal(await readFile(join(extra, "keep.txt"), "utf8"), "unrelated evidence\n");
  });
});

await test("competing directory and legacy recoverers reacquire serially without losing evidence", async () => {
  await fixture(async (root, dead) => {
    for (const legacy of [false, true]) {
      const path = join(root, legacy ? "legacy-race" : "directory-race");
      const raw = owner(dead, legacy ? "legacy-race-original" : "directory-race-original");
      await abandoned(path, raw, legacy);
      const gate = Promise.withResolvers<void>();
      let observed = 0,
        active = 0,
        maximum = 0,
        calls = 0;
      const options = {
        legacyFile: legacy,
        observe: async (phase: string) => {
          if (phase !== "observed-dead") return;
          if (++observed === 2) gate.resolve();
          await gate.promise;
        },
      };
      const action = async () => {
        maximum = Math.max(maximum, ++active);
        calls++;
        await new Promise<void>((done) => setTimeout(done, 10));
        active--;
      };
      const results = await Promise.allSettled([
        withMetadataLock(path, action, options).finally(() => gate.resolve()),
        withMetadataLock(path, action, options).finally(() => gate.resolve()),
      ]);
      for (const result of results) if (result.status === "rejected") throw result.reason;
      assert.equal(calls, 2);
      assert.equal(maximum, 1);
      assert.ok((await originals(root)).includes(raw));
      await assert.rejects(access(path), { code: "ENOENT" });
    }
  });
});

await test("a proven unmoved Windows share failure restarts fresh acquisition within its original deadline", async () => {
  await fixture(async (root, dead) => {
    for (const code of ["EPERM", "EACCES"]) {
      const path = join(root, code),
        raw = owner(dead, code);
      await abandoned(path, raw);
      const failure = Object.assign(new Error("Fixture directory sharing conflict"), { code });
      let observations = 0,
        moves = 0,
        calls = 0;
      await withMetadataLock(
        path,
        async () => {
          calls++;
          assert.notEqual(await readFile(join(path, "owner.json"), "utf8"), raw);
        },
        {
          observe: (phase) => {
            if (phase === "observed-dead") observations++;
            if (phase === "rename-ready" && ++moves === 1) throw failure;
          },
        },
      );
      assert.equal(observations, 2, "the retry must observe the owner again");
      assert.equal(moves, 2);
      assert.equal(calls, 1);
      assert.equal((await originals(root)).filter((original) => original === raw).length, 1);
      await assert.rejects(access(path), { code: "ENOENT" });
    }
  });
});

await test("a competing completed move is recognized after the first absent-target observation", async () => {
  await fixture(async (root, dead) => {
    const path = join(root, "completed-race"),
      raw = owner(dead, "completed-race");
    await abandoned(path, raw);
    const failure = Object.assign(new Error("Fixture directory sharing conflict"), {
      code: "EPERM",
    });
    let moves = 0,
      collisions = 0,
      calls = 0;
    await withMetadataLock(
      path,
      async () => {
        calls++;
      },
      {
        observe: async (phase) => {
          if (phase === "rename-ready" && ++moves === 1) throw failure;
          if (phase === "move-recheck")
            await withMetadataLock(path, async () => {
              calls++;
            });
          if (phase === "move-collision") collisions++;
        },
      },
    );
    assert.equal(moves, 1, "the failed mutation is never retried");
    assert.equal(collisions, 1);
    assert.equal(calls, 2);
    assert.deepEqual(await originals(root), [raw]);
    await assert.rejects(access(path), { code: "ENOENT" });
  });
});

await test("a failed move preserves its error when source or destination cannot prove a non-move", async () => {
  await fixture(async (root, dead) => {
    for (const [index, scenario] of [
      "existing-target",
      "unknown-target",
      "malformed-target",
      "linked-target",
      "replaced-source",
      "unreadable-source",
      "other-error",
    ].entries()) {
      const directory = join(root, String(index)),
        path = join(directory, "lock"),
        raw = owner(dead, scenario);
      await mkdir(directory);
      await abandoned(path, raw);
      const failure = Object.assign(new Error("Fixture move remains unconfirmed"), {
        code: scenario === "other-error" ? "EIO" : "EPERM",
      });
      let moves = 0;
      await assert.rejects(
        withMetadataLock(path, async () => assert.fail("Unconfirmed move acquired a lock"), {
          observe: async (phase) => {
            if (phase !== "rename-ready") return;
            moves++;
            const retained = (await readdir(join(directory, ".lock-recovery"))).filter((name) =>
              /^[a-f0-9]{64}$/u.test(name),
            );
            assert.equal(retained.length, 1);
            const name = retained[0];
            assert.ok(name);
            const target = join(directory, ".lock-recovery", name, "lock");
            if (scenario === "existing-target") await abandoned(target, raw);
            if (scenario === "unknown-target") await mkdir(target);
            if (scenario === "malformed-target") await abandoned(target, "{broken\n");
            if (scenario === "linked-target") {
              const outside = join(directory, "outside");
              await mkdir(outside);
              await symlink(outside, target, process.platform === "win32" ? "junction" : "dir");
            }
            if (scenario === "replaced-source") {
              await rename(path, join(directory, "retained-source"));
              await abandoned(path, owner(process.pid, "replacement"));
            }
            if (scenario === "unreadable-source")
              await rename(join(path, "owner.json"), join(directory, "retained-owner.json"));
            throw failure;
          },
        }),
        (error: unknown) => error === failure,
      );
      assert.equal(moves, 1);
      assert.deepEqual(await originals(directory), [raw]);
      const originalPath =
        scenario === "replaced-source"
          ? join(directory, "retained-source/owner.json")
          : scenario === "unreadable-source"
            ? join(directory, "retained-owner.json")
            : join(path, "owner.json");
      assert.equal(await readFile(originalPath, "utf8"), raw);
    }
  });
});

await test("recovery preserves a replacement owner and respects the original acquisition deadline", async () => {
  await fixture(async (root, dead) => {
    const path = join(root, "replacement");
    const raw = owner(dead);
    const replacement = owner(process.pid, "new-owner");
    await abandoned(path, raw);
    let changed = false;
    await assert.rejects(
      withMetadataLock(path, async () => assert.fail("Replacement owner was stolen"), {
        waitMs: 100,
        observe: async (phase) => {
          if (phase !== "before-move" || changed) return;
          changed = true;
          await rename(path, join(root, "retained-old"));
          await abandoned(path, replacement);
        },
      }),
      /locked/,
    );
    assert.equal(await readFile(join(path, "owner.json"), "utf8"), replacement);
    assert.equal(await readFile(join(root, "retained-old/owner.json"), "utf8"), raw);
    const delayed = join(root, "deadline");
    await abandoned(delayed, raw);
    await assert.rejects(
      withMetadataLock(delayed, async () => assert.fail("Expired acquisition ran"), {
        waitMs: 20,
        observe: async (phase) => {
          if (phase === "before-move") await new Promise<void>((done) => setTimeout(done, 25));
        },
      }),
      /deadline/,
    );
    assert.equal(await readFile(join(delayed, "owner.json"), "utf8"), raw);
  });
});

await test("an interrupted legacy recovery claim is itself recoverable without recursive claims", async () => {
  await fixture(async (root, dead) => {
    const path = join(root, "interrupted.lock");
    const raw = owner(dead, "legacy");
    const claim = owner(dead, "interrupted-claim");
    await abandoned(path, raw, true);
    await abandoned(path + ".recovery-claim", claim);
    let ran = false;
    await withMetadataLock(
      path,
      async () => {
        ran = true;
      },
      { legacyFile: true },
    );
    assert.equal(ran, true);
    assert.deepEqual((await originals(root)).sort(), [raw, claim].sort());
    assert.equal(
      (await readdir(root)).some((name) => name.includes(".recovery-claim.recovery-claim")),
      false,
    );
  });
});

await test("a stale rename cannot move the new live owner over retained quarantine", async () => {
  await fixture(async (root, dead) => {
    const path = join(root, "rename-race");
    const raw = owner(dead);
    await abandoned(path, raw);
    const ready = Promise.withResolvers<void>();
    const proceed = Promise.withResolvers<void>();
    const entered = Promise.withResolvers<void>();
    const release = Promise.withResolvers<void>();
    let holder: Promise<PromiseSettledResult<void>[]> | undefined;
    let replacement = "",
      collision = false,
      calls = 0;
    const late = withMetadataLock(
      path,
      async () => {
        calls++;
      },
      {
        observe: async (phase) => {
          if (phase === "rename-ready") {
            ready.resolve();
            await proceed.promise;
          }
          if (phase === "move-collision") {
            collision = true;
            assert.equal(await readFile(join(path, "owner.json"), "utf8"), replacement);
            release.resolve();
          }
        },
      },
    ).finally(() => {
      ready.resolve();
      release.resolve();
    });
    const lateOutcome = Promise.allSettled([late]);
    await ready.promise;
    const first = withMetadataLock(
      path,
      async () => {
        calls++;
      },
      {
        observe: async (phase) => {
          if (phase !== "moved") return;
          holder = Promise.allSettled([
            withMetadataLock(path, async () => {
              replacement = await readFile(join(path, "owner.json"), "utf8");
              entered.resolve();
              await release.promise;
            }).finally(() => entered.resolve()),
          ]);
          await entered.promise;
          proceed.resolve();
        },
      },
    );
    const results = (
      await Promise.all([Promise.allSettled([first.finally(() => proceed.resolve())]), lateOutcome])
    ).flat();
    proceed.resolve();
    release.resolve();
    if (holder) results.push(...(await holder));
    for (const result of results) if (result.status === "rejected") throw result.reason;
    assert.equal(collision, true);
    assert.equal(calls, 2);
    assert.deepEqual(await originals(root), [raw]);
  });
});

await test("recovery capacity and redirected paths preserve ownership and unrelated data", async () => {
  await fixture(async (root, dead) => {
    const path = join(root, "capacity");
    const raw = owner(dead);
    await abandoned(path, raw);
    const evidence = join(root, ".lock-recovery");
    await mkdir(evidence);
    for (let slot = 0; slot < 32; slot++)
      await writeFile(join(evidence, `${slot}.reservation.json`), '{"retained":true}\n');
    await assert.rejects(
      withMetadataLock(path, async () => assert.fail("Unreserved recovery ran")),
      /capacity/,
    );
    assert.equal(await readFile(join(path, "owner.json"), "utf8"), raw);
    assert.equal((await readdir(evidence)).length, 32);
    const outside = join(root, "outside");
    await mkdir(outside);
    await writeFile(join(outside, "sentinel"), "preserve\n");
    await symlink(outside, join(root, "linked"), process.platform === "win32" ? "junction" : "dir");
    await assert.rejects(
      withMetadataLock(join(root, "linked/lock"), async () => assert.fail("Redirected lock ran")),
      /redirected/,
    );
    await assert.rejects(
      withMetadataLock(join(root, "linked/new-parent/lock"), async () =>
        assert.fail("Nested redirected lock ran"),
      ),
      /redirected/,
    );
    assert.deepEqual(await readdir(outside), ["sentinel"]);
  });
});

await test("archive and hook recovery stays in ignored workflow evidence and preserves native diagnostic scans", async () => {
  await fixture(async (root, dead) => {
    const conversations = join(root, "spec/.conversations");
    await mkdir(conversations, { recursive: true });
    const archiveOwner = owner(dead, "archive-owner");
    await abandoned(join(conversations, ".write-lock"), archiveOwner);
    const record: RecordInput = {
      sessionId: "lock-recovery-fixture",
      turnId: "archive-turn",
      agent: "codex",
      model: "unknown",
      reasoning: "unknown",
      date: "2026-11-08T12:00:00Z",
      description: "Lock recovery fixture",
      prompt: "Record this fixture.",
      response: "Recorded.",
      processingLog: ["Fixture record prepared."],
    };
    const file = await archive(root, record);
    const frozen = await freezeArchive(root, record);
    assert.equal(frozen.archive, "spec/.conversations/" + file);
    assert.deepEqual(await readdir(conversations), [file]);
    const hookRoot = join(root, ".cache/hook-diagnostics");
    await mkdir(hookRoot, { recursive: true });
    const reserveOwner = owner(dead, "hook-reserve-owner");
    await abandoned(join(hookRoot, ".lock"), reserveOwner);
    const reservation = await reserveHookDiagnostics(root, "review", 1024);
    const receipt = '{"fixture":true}\n';
    const log = "fixture log\n";
    await writeHookDiagnostic(root, reservation, "receipt", receipt);
    await writeHookDiagnostic(root, reservation, "log", log);
    const finalizeOwner = owner(dead, "hook-finalize-owner");
    await abandoned(join(hookRoot, ".lock"), finalizeOwner);
    await finalizeHookDiagnostics(root, reservation, {
      receiptHash: digest(receipt),
      logHash: digest(log),
    });
    await reserveHookDiagnostics(root, "archive", 1024);
    assert.equal(
      (await readdir(hookRoot)).some((name) => name.startsWith(".lock")),
      false,
    );
    assert.deepEqual(
      (await originals(join(root, ".cache/workflow"))).sort(),
      [archiveOwner, reserveOwner, finalizeOwner].sort(),
    );
  });
});
