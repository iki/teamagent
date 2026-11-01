import { assertTemporaryFixtureSync, mkdtempSync } from "./temporary.ts";
import { afterEach, describe, expect, test } from "bun:test";
import { mkdirSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { Effect } from "effect";
import { type Store } from "@/tasks";
import { openStore } from "../app/storage/index.ts";

const run = Effect.runPromise;
async function rejectsCode(promise: Promise<unknown>, code: string): Promise<void> {
  const result = await promise.then(
    () => undefined,
    (error: unknown) => error,
  );
  expect(result).toMatchObject({ code });
}
const temporaryDirectories: string[] = [];
afterEach(() => {
  for (const directory of temporaryDirectories.splice(0)) {
    const target = resolve(directory);
    assertTemporaryFixtureSync(target);
    rmSync(target, { recursive: true, force: true });
  }
});
async function fixture() {
  const directory = mkdtempSync(join(tmpdir(), "teamagent-store-"));
  temporaryDirectories.push(directory);
  const workspacePath = join(directory, "workspace");
  mkdirSync(workspacePath);
  let time = 1_000_000;
  const options = {
    databasePath: join(directory, "store.sqlite"),
    blobDirectory: join(directory, "blobs"),
    now: () => time,
  };
  const store = await run(openStore(options));
  const workspace = await run(
    store.createWorkspace({ name: "Test workspace", path: workspacePath }),
  );
  const create = (repository: Store = store, objective = "Inspect files") =>
    run(repository.createTask({ workspaceId: workspace.id, objective, adapterId: "inspect" }));
  return {
    directory,
    workspacePath,
    options,
    store,
    workspace,
    create,
    advance: (ms: number) => {
      time += ms;
    },
  };
}

describe("durable SQLite harness", () => {
  test("canonical workspace ownership excludes parent and child registrations", async () => {
    const f = await fixture();
    try {
      const nested = join(f.workspacePath, "nested");
      mkdirSync(nested);
      await rejectsCode(run(f.store.createWorkspace({ name: "Nested", path: nested })), "conflict");
      await rejectsCode(
        run(f.store.createWorkspace({ name: "Parent", path: f.directory })),
        "conflict",
      );
      expect(
        await run(f.store.createWorkspace({ name: f.workspace.name, path: f.workspacePath })),
      ).toEqual(f.workspace);
      const sibling = join(f.directory, "workspace-sibling");
      mkdirSync(sibling);
      expect((await run(f.store.createWorkspace({ name: "Sibling", path: sibling }))).path).toBe(
        sibling,
      );
    } finally {
      await run(f.store.close());
    }
  });

  test("event exhaustion leaves room for a truthful terminal failure", async () => {
    const f = await fixture();
    try {
      const task = await f.create();
      const claim = await run(f.store.claimTask(task.id, "worker", 60_000));
      for (let index = 0; index < 1_997; index++)
        await run(
          f.store.appendEvent(
            task.id,
            "worker",
            claim.attempt.epoch,
            "progress",
            "Bounded progress",
          ),
        );
      await rejectsCode(
        run(f.store.appendEvent(task.id, "worker", claim.attempt.epoch, "progress", "Over budget")),
        "capacity",
      );
      await run(
        f.store.finishTask(
          task.id,
          "worker",
          claim.attempt.epoch,
          "failed",
          "Event budget reached.",
        ),
      );
      const final = await run(f.store.listEvents(task.id, 1_999));
      expect(final).toMatchObject([
        { sequence: 2_000, type: "failed", message: "Event budget reached." },
      ]);
    } finally {
      await run(f.store.close());
    }
  });

  test("artifact count limits preserve idempotent retries and reject excess outputs", async () => {
    const f = await fixture();
    try {
      const task = await f.create();
      const claim = await run(f.store.claimTask(task.id, "worker", 60_000));
      const content = new TextEncoder().encode("Shared bytes");
      for (let index = 0; index < 32; index++)
        await run(
          f.store.putArtifact(task.id, "worker", claim.attempt.epoch, {
            name: `output-${index}.txt`,
            mediaType: "text/plain",
            content,
          }),
        );
      expect(
        (
          await run(
            f.store.putArtifact(task.id, "worker", claim.attempt.epoch, {
              name: "output-0.txt",
              mediaType: "text/plain",
              content,
            }),
          )
        ).name,
      ).toBe("output-0.txt");
      await rejectsCode(
        run(
          f.store.putArtifact(task.id, "worker", claim.attempt.epoch, {
            name: "excess.txt",
            mediaType: "text/plain",
            content,
          }),
        ),
        "capacity",
      );
      expect(await run(f.store.listArtifacts(task.id))).toHaveLength(32);
    } finally {
      await run(f.store.close());
    }
  });

  test("persists accepted commands, enforces idempotency and survives a closed/reopened store", async () => {
    const f = await fixture();
    const input = {
      workspaceId: f.workspace.id,
      objective: "Inspect files",
      adapterId: "inspect",
      idempotencyKey: "request-1",
    };
    try {
      const task = await run(f.store.createTask(input));
      expect(task.allowWrites).toBe(false);
      expect(task.maxTurns).toBe(8);
      expect(task.maxDurationMs).toBe(120_000);
      expect(await run(f.store.createTask(input))).toEqual(task);
      await rejectsCode(run(f.store.createTask({ ...input, allowWrites: true })), "conflict");
      await run(f.store.close());
      const reopened = await run(openStore(f.options));
      try {
        expect(await run(reopened.getTask(task.id))).toEqual(task);
        expect(await run(reopened.createTask(input))).toEqual(task);
        expect(await run(reopened.listEvents(task.id))).toMatchObject([
          { sequence: 1, type: "accepted" },
        ]);
      } finally {
        await run(reopened.close());
      }
    } finally {
      await run(f.store.close());
    }
  });

  test("two connections atomically fence workspace owners and stale epochs", async () => {
    const f = await fixture();
    const second = await run(openStore(f.options));
    try {
      const one = await f.create();
      const two = await f.create(second, "Second task");
      const claim = await run(f.store.claimTask(one.id, "worker-a", 5_000));
      await rejectsCode(run(second.claimTask(one.id, "worker-b", 5_000)), "conflict");
      await rejectsCode(run(second.claimTask(two.id, "worker-b", 5_000)), "conflict");
      await rejectsCode(
        run(second.appendEvent(one.id, "worker-b", claim.attempt.epoch, "message", "late")),
        "stale_lease",
      );
      await rejectsCode(
        run(
          f.store.finishTask(
            one.id,
            "worker-a",
            claim.attempt.epoch + 1,
            "succeeded",
            "wrong epoch",
          ),
        ),
        "stale_lease",
      );
      await run(
        f.store.finishTask(one.id, "worker-a", claim.attempt.epoch, "succeeded", "Completed"),
      );
      await rejectsCode(
        run(f.store.finishTask(one.id, "worker-a", claim.attempt.epoch, "succeeded", "Again")),
        "stale_lease",
      );
      expect((await run(second.claimTask(two.id, "worker-b", 5_000))).task.status).toBe("running");
    } finally {
      await run(second.close());
      await run(f.store.close());
    }
  });

  test("recovery interrupts expired work without replay and never interrupts a live lease", async () => {
    const f = await fixture();
    try {
      const task = await f.create();
      const claim = await run(f.store.claimTask(task.id, "worker", 5_000));
      f.advance(4_000);
      const renewed = await run(f.store.renewLease(task.id, "worker", claim.attempt.epoch, 5_000));
      expect(renewed.expiresAt).toBe(1_009_000);
      expect(await run(f.store.recoverExpiredTasks())).toEqual([]);
      await run(f.store.close());
      const reopened = await run(openStore(f.options));
      try {
        expect((await run(reopened.getTask(task.id))).status).toBe("running");
        f.advance(5_001);
        await rejectsCode(
          run(reopened.renewLease(task.id, "worker", claim.attempt.epoch, 5_000)),
          "stale_lease",
        );
        expect(await run(reopened.recoverExpiredTasks())).toMatchObject([
          { id: task.id, status: "interrupted" },
        ]);
        expect(await run(reopened.recoverExpiredTasks())).toEqual([]);
        await rejectsCode(run(reopened.claimTask(task.id, "new-worker", 5_000)), "conflict");
        expect(await run(reopened.listEvents(task.id))).toMatchObject([
          { sequence: 1, type: "accepted" },
          { sequence: 2, type: "started" },
          { sequence: 3, type: "interrupted" },
        ]);
      } finally {
        await run(reopened.close());
      }
    } finally {
      await run(f.store.close());
    }
  });

  test("cancellation fences active writes, is idempotent, and prevents queued claims", async () => {
    const f = await fixture();
    try {
      const queued = await f.create();
      expect((await run(f.store.cancelTask(queued.id))).status).toBe("cancelled");
      expect((await run(f.store.cancelTask(queued.id))).revision).toBe(2);
      await rejectsCode(run(f.store.claimTask(queued.id, "worker", 5_000)), "conflict");
      const active = await f.create();
      const claim = await run(f.store.claimTask(active.id, "worker", 5_000));
      await run(f.store.cancelTask(active.id));
      await rejectsCode(
        run(f.store.appendEvent(active.id, "worker", claim.attempt.epoch, "message", "late")),
        "stale_lease",
      );
      await rejectsCode(
        run(
          f.store.putArtifact(active.id, "worker", claim.attempt.epoch, {
            name: "answer.txt",
            mediaType: "text/plain",
            content: new Uint8Array(),
          }),
        ),
        "stale_lease",
      );
    } finally {
      await run(f.store.close());
    }
  });

  test("artifacts are immutable, content addressed, bounded, and verified on every read", async () => {
    const f = await fixture();
    try {
      const task = await f.create();
      const claim = await run(f.store.claimTask(task.id, "worker", 5_000));
      const input = {
        name: "answer.md",
        mediaType: "text/markdown",
        content: new TextEncoder().encode("# Report"),
      };
      const artifact = await run(
        f.store.putArtifact(task.id, "worker", claim.attempt.epoch, input),
      );
      expect(await run(f.store.putArtifact(task.id, "worker", claim.attempt.epoch, input))).toEqual(
        artifact,
      );
      expect(new TextDecoder().decode((await run(f.store.readArtifact(artifact.id))).content)).toBe(
        "# Report",
      );
      await rejectsCode(
        run(
          f.store.putArtifact(task.id, "worker", claim.attempt.epoch, {
            ...input,
            content: new TextEncoder().encode("Changed"),
          }),
        ),
        "conflict",
      );
      await rejectsCode(
        run(
          f.store.putArtifact(task.id, "worker", claim.attempt.epoch, {
            ...input,
            name: "large.txt",
            content: new Uint8Array(4_194_305),
          }),
        ),
        "capacity",
      );
      expect(await run(f.store.listArtifacts(task.id))).toHaveLength(1);
      writeFileSync(join(f.options.blobDirectory, artifact.sha256), "! Report");
      await rejectsCode(run(f.store.readArtifact(artifact.id)), "integrity");
    } finally {
      await run(f.store.close());
    }
  });

  test("validates external fields and exposes ordered event cursors without forged lifecycle events", async () => {
    const f = await fixture();
    try {
      await rejectsCode(
        run(f.store.createWorkspace({ name: "Invalid", path: f.workspacePath, extra: true })),
        "invalid",
      );
      await rejectsCode(
        run(
          f.store.createTask({
            workspaceId: f.workspace.id,
            objective: "Inspect",
            adapterId: "inspect",
            grants: ["shell"],
          }),
        ),
        "invalid",
      );
      await rejectsCode(
        run(f.store.createWorkspace({ name: "Invalid", path: "relative" })),
        "invalid",
      );
      await rejectsCode(
        run(f.store.createWorkspace({ name: "Other name", path: f.workspacePath })),
        "conflict",
      );
      await rejectsCode(
        run(
          f.store.createTask({ workspaceId: "absent", objective: "Inspect", adapterId: "inspect" }),
        ),
        "not_found",
      );
      await rejectsCode(
        run(
          f.store.createTask({ workspaceId: f.workspace.id, objective: "", adapterId: "inspect" }),
        ),
        "invalid",
      );
      const task = await f.create();
      const claim = await run(f.store.claimTask(task.id, "worker", 5_000));
      await run(
        f.store.appendEvent(task.id, "worker", claim.attempt.epoch, "progress", "Reading metadata"),
      );
      await run(
        f.store.appendEvent(
          task.id,
          "worker",
          claim.attempt.epoch,
          "tool.intent",
          '{"effectId":"attempt:call","tool":"list"}',
        ),
      );
      expect((await run(f.store.listEvents(task.id, 2))).map((event) => event.sequence)).toEqual([
        3, 4,
      ]);
      await rejectsCode(run(f.store.listEvents(task.id, -1)), "invalid");
      await rejectsCode(
        run(f.store.appendEvent(task.id, "worker", claim.attempt.epoch, "completed", "Forged")),
        "invalid",
      );
      await rejectsCode(
        run(
          f.store.appendEvent(
            task.id,
            "worker",
            claim.attempt.epoch,
            "message",
            "x".repeat(16_001),
          ),
        ),
        "invalid",
      );
      expect(await run(f.store.listEvents(task.id))).toHaveLength(4);
    } finally {
      await run(f.store.close());
    }
  });
});
