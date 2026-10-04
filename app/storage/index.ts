import { Database } from "bun:sqlite";
import { createHash, randomUUID } from "node:crypto";
import {
  mkdirSync,
  realpathSync,
  statSync,
  lstatSync,
  openSync,
  closeSync,
  readSync,
  writeFileSync,
} from "node:fs";
import { dirname, isAbsolute, join, relative, resolve } from "node:path";
import { Effect, Layer, Schema } from "effect";
import { ArtifactInputSchema, ArtifactSchema, type Artifact } from "@/artifacts";
import {
  AttemptSchema,
  CreateTaskInputSchema,
  HarnessError,
  TaskEventSchema,
  TaskRepository,
  TaskSchema,
  canTransition,
  type Attempt,
  type Store,
  type Task,
  type TaskEventType,
} from "@/tasks";
import { CreateWorkspaceInputSchema, WorkspaceSchema } from "@/workspaces";
import { pathsOverlap } from "./paths.ts";

export interface StoreOptions {
  readonly databasePath: string;
  readonly blobDirectory: string;
  readonly now?: () => number;
  readonly id?: () => string;
}

const MAX_TASKS = 10_000;
const MAX_EVENTS = 2_000;
const MAX_ARTIFACT_BYTES = 4_194_304;
const MAX_ARTIFACTS = 32;

const fail = (code: HarnessError["code"], message: string): never => {
  throw new HarnessError({ code, message });
};
const attempt = <A>(body: () => A): Effect.Effect<A, HarnessError> =>
  Effect.try({
    try: body,
    catch: (error) =>
      error instanceof HarnessError
        ? error
        : new HarnessError({
            code: "storage",
            message: "The local store could not complete the operation.",
          }),
  });
const decode = <A>(
  schema: Schema.Codec<A>,
  value: unknown,
  code: HarnessError["code"] = "integrity",
): A => {
  try {
    return Schema.decodeUnknownSync(schema)(
      value,
      code === "invalid" ? { onExcessProperty: "error" } : {},
    );
  } catch {
    return fail(
      code,
      code === "invalid" ? "Input failed validation." : "Stored data failed validation.",
    );
  }
};
const digest = (content: Uint8Array): string => createHash("sha256").update(content).digest("hex");
const numberRow = Schema.Struct({ value: Schema.Int });
const taskRow = Schema.Struct({ ...TaskSchema.fields, allowWrites: Schema.Literals([0, 1]) });
const decodeTask = (value: unknown): Task => {
  const row = decode(taskRow, value);
  return decode(TaskSchema, { ...row, allowWrites: row.allowWrites === 1 });
};
const validOwner = Schema.String.check(Schema.isMinLength(1), Schema.isMaxLength(160));
const leaseDuration = Schema.Int.check(
  Schema.isGreaterThanOrEqualTo(1000),
  Schema.isLessThanOrEqualTo(60_000),
);
const cursorSchema = Schema.Int.check(Schema.isGreaterThanOrEqualTo(0));
const taskColumns =
  "id, workspaceId, objective, adapterId, status, createdAt, updatedAt, revision, attemptId, maxDurationMs, allowWrites, maxTurns";

/** The host owns the store's lifetime. Use storeLayer when composing Effect services. */
export const openStore = (options: StoreOptions): Effect.Effect<Store, HarnessError> =>
  attempt(() => {
    const now = options.now ?? Date.now;
    const id = options.id ?? randomUUID;
    const timestamp = (): string => new Date(now()).toISOString();
    const databasePath =
      options.databasePath === ":memory:" ? ":memory:" : resolve(options.databasePath);
    if (databasePath !== ":memory:") mkdirSync(dirname(databasePath), { recursive: true });
    mkdirSync(options.blobDirectory, { recursive: true });
    const blobDirectory = realpathSync(options.blobDirectory);
    const database = new Database(databasePath, { create: true, strict: true });
    let closed = false;
    try {
      database.exec(
        "PRAGMA foreign_keys = ON; PRAGMA journal_mode = WAL; PRAGMA busy_timeout = 5000;",
      );
      const version = decode(
        Schema.Struct({ user_version: Schema.Int }),
        database.query("PRAGMA user_version").get(),
      ).user_version;
      if (version > 1) fail("integrity", "This database requires a newer harness version.");
      database
        .transaction(() => {
          database.exec(`
        CREATE TABLE IF NOT EXISTS workspaces (
          id TEXT PRIMARY KEY, name TEXT NOT NULL, path TEXT NOT NULL UNIQUE, createdAt TEXT NOT NULL
        );
        CREATE TABLE IF NOT EXISTS tasks (
          id TEXT PRIMARY KEY, workspaceId TEXT NOT NULL REFERENCES workspaces(id), objective TEXT NOT NULL,
          adapterId TEXT NOT NULL, status TEXT NOT NULL, createdAt TEXT NOT NULL, updatedAt TEXT NOT NULL,
          revision INTEGER NOT NULL, attemptId TEXT, maxDurationMs INTEGER NOT NULL,
          allowWrites INTEGER NOT NULL CHECK(allowWrites IN (0,1)), maxTurns INTEGER NOT NULL,
          idempotencyKey TEXT UNIQUE, requestHash TEXT NOT NULL
        );
        CREATE UNIQUE INDEX IF NOT EXISTS workspace_writer ON tasks(workspaceId) WHERE status = 'running';
        CREATE TABLE IF NOT EXISTS attempts (
          id TEXT PRIMARY KEY, taskId TEXT NOT NULL REFERENCES tasks(id), owner TEXT NOT NULL,
          epoch INTEGER NOT NULL, expiresAt INTEGER NOT NULL, UNIQUE(taskId, epoch)
        );
        CREATE TABLE IF NOT EXISTS events (
          id TEXT PRIMARY KEY, taskId TEXT NOT NULL REFERENCES tasks(id), sequence INTEGER NOT NULL,
          type TEXT NOT NULL, message TEXT NOT NULL, createdAt TEXT NOT NULL, UNIQUE(taskId, sequence)
        );
        CREATE TABLE IF NOT EXISTS artifacts (
          id TEXT PRIMARY KEY, taskId TEXT NOT NULL REFERENCES tasks(id), name TEXT NOT NULL,
          mediaType TEXT NOT NULL, size INTEGER NOT NULL, sha256 TEXT NOT NULL, createdAt TEXT NOT NULL,
          UNIQUE(taskId, name)
        );
        PRAGMA user_version = 1;
      `);
        })
        .immediate();
    } catch (error) {
      database.close();
      throw error;
    }

    const ensureOpen = (): void => {
      if (closed) fail("storage", "The store is closed.");
    };
    const count = (sql: string, key?: string): number => {
      const statement = database.query(sql);
      return decode(numberRow, key === undefined ? statement.get() : statement.get(key)).value;
    };
    const getTask = (taskId: string): Task => {
      ensureOpen();
      const value: unknown = database
        .query(`SELECT ${taskColumns} FROM tasks WHERE id = ?`)
        .get(taskId);
      if (value === null) return fail("not_found", "Task not found.");
      return decodeTask(value);
    };
    const getWorkspace = (workspaceId: string) => {
      ensureOpen();
      const value: unknown = database
        .query("SELECT * FROM workspaces WHERE id = ?")
        .get(workspaceId);
      if (value === null) return fail("not_found", "Workspace not found.");
      return decode(WorkspaceSchema, value);
    };
    const addEvent = (taskId: string, type: TaskEventType, message: string) => {
      const sequence =
        count("SELECT COALESCE(MAX(sequence),0) AS value FROM events WHERE taskId = ?", taskId) + 1;
      if (sequence > MAX_EVENTS) return fail("capacity", "The task event limit was reached.");
      const event = decode(
        TaskEventSchema,
        { id: id(), taskId, sequence, type, message, createdAt: timestamp() },
        "invalid",
      );
      database
        .query("INSERT INTO events(id,taskId,sequence,type,message,createdAt) VALUES(?,?,?,?,?,?)")
        .run(event.id, event.taskId, event.sequence, event.type, event.message, event.createdAt);
      return event;
    };
    const checkOwner = (
      taskId: string,
      owner: string,
      epoch: number,
    ): { task: Task; attempt: Attempt } => {
      const task = getTask(taskId);
      if (task.status !== "running" || task.attemptId === null)
        return fail("stale_lease", "The task has no active execution lease.");
      const lease = decode(
        AttemptSchema,
        database
          .query("SELECT id,owner,epoch,expiresAt FROM attempts WHERE id = ?")
          .get(task.attemptId),
      );
      if (lease.owner !== owner || lease.epoch !== epoch || lease.expiresAt <= now())
        return fail("stale_lease", "The execution lease is expired or belongs to another worker.");
      return { task, attempt: lease };
    };
    const updateStatus = (task: Task, status: Task["status"]): Task => {
      if (!canTransition(task.status, status))
        return fail("conflict", "The requested task transition is not permitted.");
      database
        .query("UPDATE tasks SET status = ?, updatedAt = ?, revision = revision + 1 WHERE id = ?")
        .run(status, timestamp(), task.id);
      return getTask(task.id);
    };
    const atomic = <A>(body: () => A): Effect.Effect<A, HarnessError> =>
      attempt(() => {
        ensureOpen();
        return database.transaction(body).immediate();
      });
    const readBlob = (artifact: Artifact): Uint8Array => {
      const file = join(blobDirectory, artifact.sha256);
      const stats = lstatSync(file);
      if (
        !stats.isFile() ||
        stats.isSymbolicLink() ||
        stats.size !== artifact.size ||
        stats.size > MAX_ARTIFACT_BYTES
      )
        return fail("integrity", "Artifact size or file type does not match its manifest.");
      const descriptor = openSync(file, "r");
      try {
        const buffer = Buffer.alloc(artifact.size + 1);
        let offset = 0;
        while (offset < buffer.byteLength) {
          const read = readSync(descriptor, buffer, offset, buffer.byteLength - offset, offset);
          if (read === 0) break;
          offset += read;
        }
        const content = buffer.subarray(0, offset);
        if (offset !== artifact.size || digest(content) !== artifact.sha256)
          return fail("integrity", "Artifact bytes do not match their manifest.");
        return content;
      } finally {
        closeSync(descriptor);
      }
    };

    return {
      createWorkspace: (input) =>
        atomic(() => {
          const parsed = decode(CreateWorkspaceInputSchema, input, "invalid");
          if (!isAbsolute(parsed.path)) return fail("invalid", "Workspace paths must be absolute.");
          let path: string;
          try {
            path = realpathSync(parsed.path);
            if (!statSync(path).isDirectory())
              return fail("invalid", "Workspace path must name an existing directory.");
          } catch {
            return fail("invalid", "Workspace path must name an accessible existing directory.");
          }
          const registered = decode(
            Schema.Array(WorkspaceSchema),
            database.query("SELECT * FROM workspaces").all(),
          );
          const existing = registered.find((workspace) => relative(workspace.path, path) === "");
          if (existing !== undefined) {
            if (existing.name !== parsed.name)
              return fail("conflict", "This directory is already registered under another name.");
            return existing;
          }
          if (registered.some((workspace) => pathsOverlap(workspace.path, path)))
            return fail(
              "conflict",
              "Workspace directories cannot contain or overlap another registered workspace.",
            );
          if (count("SELECT COUNT(*) AS value FROM workspaces") >= 200)
            return fail("capacity", "The workspace limit was reached.");
          const workspace = decode(WorkspaceSchema, {
            ...parsed,
            path,
            id: id(),
            createdAt: timestamp(),
          });
          database
            .query("INSERT INTO workspaces(id,name,path,createdAt) VALUES(?,?,?,?)")
            .run(workspace.id, workspace.name, workspace.path, workspace.createdAt);
          return workspace;
        }),
      listWorkspaces: () =>
        attempt(() => {
          ensureOpen();
          return decode(
            Schema.Array(WorkspaceSchema),
            database.query("SELECT * FROM workspaces ORDER BY createdAt,id").all(),
          );
        }),
      getWorkspace: (workspaceId) => attempt(() => getWorkspace(workspaceId)),
      createTask: (input) =>
        atomic(() => {
          const parsed = decode(CreateTaskInputSchema, input, "invalid");
          getWorkspace(parsed.workspaceId);
          const maxDurationMs = parsed.maxDurationMs ?? 120_000;
          const allowWrites = parsed.allowWrites ?? false;
          const maxTurns = parsed.maxTurns ?? 8;
          const requestHash = digest(
            new TextEncoder().encode(
              JSON.stringify([
                parsed.workspaceId,
                parsed.objective,
                parsed.adapterId,
                maxDurationMs,
                allowWrites,
                maxTurns,
              ]),
            ),
          );
          if (parsed.idempotencyKey !== undefined) {
            const previous: unknown = database
              .query(`SELECT ${taskColumns}, requestHash FROM tasks WHERE idempotencyKey = ?`)
              .get(parsed.idempotencyKey);
            if (previous !== null) {
              const record = decode(
                Schema.Struct({ ...taskRow.fields, requestHash: Schema.String }),
                previous,
              );
              if (record.requestHash !== requestHash)
                return fail("conflict", "The idempotency key belongs to a different request.");
              return decodeTask(record);
            }
          }
          if (count("SELECT COUNT(*) AS value FROM tasks") >= MAX_TASKS)
            return fail("capacity", "The task limit was reached.");
          const createdAt = timestamp();
          const task = decode(TaskSchema, {
            id: id(),
            workspaceId: parsed.workspaceId,
            objective: parsed.objective,
            adapterId: parsed.adapterId,
            status: "queued",
            createdAt,
            updatedAt: createdAt,
            revision: 1,
            attemptId: null,
            maxDurationMs,
            allowWrites,
            maxTurns,
          });
          database
            .query(
              `INSERT INTO tasks(${taskColumns},idempotencyKey,requestHash) VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
            )
            .run(
              task.id,
              task.workspaceId,
              task.objective,
              task.adapterId,
              task.status,
              task.createdAt,
              task.updatedAt,
              task.revision,
              task.attemptId,
              task.maxDurationMs,
              allowWrites ? 1 : 0,
              maxTurns,
              parsed.idempotencyKey ?? null,
              requestHash,
            );
          addEvent(task.id, "accepted", "Task accepted into the durable queue.");
          return task;
        }),
      listTasks: () =>
        attempt(() => {
          ensureOpen();
          return database
            .query(`SELECT ${taskColumns} FROM tasks ORDER BY createdAt DESC,id`)
            .all()
            .map(decodeTask);
        }),
      getTask: (taskId) => attempt(() => getTask(taskId)),
      claimTask: (taskId, owner, leaseMs) =>
        atomic(() => {
          decode(validOwner, owner, "invalid");
          decode(leaseDuration, leaseMs, "invalid");
          const task = getTask(taskId);
          if (task.status !== "queued")
            return fail("conflict", "Only a queued task can be claimed.");
          if (
            count(
              "SELECT COUNT(*) AS value FROM tasks WHERE workspaceId = ? AND status = 'running'",
              task.workspaceId,
            ) > 0
          )
            return fail("conflict", "Another task owns this workspace.");
          const epoch =
            count("SELECT COALESCE(MAX(epoch),0) AS value FROM attempts WHERE taskId = ?", taskId) +
            1;
          const lease = decode(AttemptSchema, {
            id: id(),
            owner,
            epoch,
            expiresAt: now() + leaseMs,
          });
          database
            .query("INSERT INTO attempts(id,taskId,owner,epoch,expiresAt) VALUES(?,?,?,?,?)")
            .run(lease.id, taskId, owner, epoch, lease.expiresAt);
          database.query("UPDATE tasks SET attemptId = ? WHERE id = ?").run(lease.id, taskId);
          const running = updateStatus(task, "running");
          addEvent(taskId, "started", "Worker acquired the workspace execution lease.");
          return { task: running, attempt: lease };
        }),
      renewLease: (taskId, owner, epoch, leaseMs) =>
        atomic(() => {
          decode(leaseDuration, leaseMs, "invalid");
          const current = checkOwner(taskId, owner, epoch);
          const renewed = { ...current.attempt, expiresAt: now() + leaseMs };
          database
            .query("UPDATE attempts SET expiresAt = ? WHERE id = ?")
            .run(renewed.expiresAt, renewed.id);
          return renewed;
        }),
      appendEvent: (taskId, owner, epoch, type, message) =>
        atomic(() => {
          checkOwner(taskId, owner, epoch);
          if (!["message", "progress", "tool.intent", "tool.result", "usage"].includes(type))
            return fail("invalid", "Lifecycle events are owned by the task store.");
          // Keep room for the terminal lifecycle event even when a noisy worker exhausts its budget.
          if (
            count("SELECT COUNT(*) AS value FROM events WHERE taskId = ?", taskId) >=
            MAX_EVENTS - 1
          )
            return fail("capacity", "The task event limit was reached.");
          return addEvent(taskId, type, message);
        }),
      finishTask: (taskId, owner, epoch, status, message) =>
        atomic(() => {
          const current = checkOwner(taskId, owner, epoch);
          const task = updateStatus(current.task, status);
          addEvent(taskId, status === "succeeded" ? "completed" : status, message);
          return task;
        }),
      cancelTask: (taskId) =>
        atomic(() => {
          const task = getTask(taskId);
          if (task.status === "cancelled") return task;
          const cancelled = updateStatus(task, "cancelled");
          addEvent(
            taskId,
            "cancelled",
            "Cancellation requested; further worker writes are rejected.",
          );
          return cancelled;
        }),
      recoverExpiredTasks: () =>
        atomic(() => {
          const rows = database
            .query(
              `SELECT ${taskColumns
                .split(", ")
                .map((column) => `tasks.${column}`)
                .join(
                  ", ",
                )} FROM tasks JOIN attempts ON tasks.attemptId = attempts.id WHERE tasks.status = 'running' AND attempts.expiresAt <= ?`,
            )
            .all(now());
          return rows.map((row) => {
            const task = updateStatus(decodeTask(row), "interrupted");
            addEvent(
              task.id,
              "interrupted",
              "Worker lease expired. Effects may be incomplete; no automatic replay was attempted.",
            );
            return task;
          });
        }),
      listEvents: (taskId, afterSequence = 0) =>
        attempt(() => {
          getTask(taskId);
          decode(cursorSchema, afterSequence, "invalid");
          return decode(
            Schema.Array(TaskEventSchema),
            database
              .query("SELECT * FROM events WHERE taskId = ? AND sequence > ? ORDER BY sequence")
              .all(taskId, afterSequence),
          );
        }),
      listArtifacts: (taskId) =>
        attempt(() => {
          getTask(taskId);
          return decode(
            Schema.Array(ArtifactSchema),
            database
              .query("SELECT * FROM artifacts WHERE taskId = ? ORDER BY createdAt,id")
              .all(taskId),
          );
        }),
      putArtifact: (taskId, owner, epoch, input) =>
        atomic(() => {
          checkOwner(taskId, owner, epoch);
          const parsed = decode(ArtifactInputSchema, input, "invalid");
          if (parsed.content.byteLength > MAX_ARTIFACT_BYTES)
            return fail("capacity", "Artifact exceeds the four MiB limit.");
          const artifact = decode(ArtifactSchema, {
            id: id(),
            taskId,
            name: parsed.name,
            mediaType: parsed.mediaType,
            size: parsed.content.byteLength,
            sha256: digest(parsed.content),
            createdAt: timestamp(),
          });
          const existing: unknown = database
            .query("SELECT * FROM artifacts WHERE taskId = ? AND name = ?")
            .get(taskId, artifact.name);
          if (existing !== null) {
            const previous = decode(ArtifactSchema, existing);
            if (previous.sha256 !== artifact.sha256 || previous.mediaType !== artifact.mediaType)
              return fail("conflict", "An immutable artifact already uses this name.");
            readBlob(previous);
            return previous;
          }
          if (
            count("SELECT COUNT(*) AS value FROM events WHERE taskId = ?", taskId) >=
            MAX_EVENTS - 1
          )
            return fail("capacity", "The task event limit was reached.");
          if (
            count("SELECT COUNT(*) AS value FROM artifacts WHERE taskId = ?", taskId) >=
            MAX_ARTIFACTS
          )
            return fail("capacity", "The task artifact limit was reached.");
          const file = join(blobDirectory, artifact.sha256);
          try {
            writeFileSync(file, parsed.content, { flag: "wx", mode: 0o600 });
          } catch {
            readBlob(artifact);
          }
          database
            .query(
              "INSERT INTO artifacts(id,taskId,name,mediaType,size,sha256,createdAt) VALUES(?,?,?,?,?,?,?)",
            )
            .run(
              artifact.id,
              artifact.taskId,
              artifact.name,
              artifact.mediaType,
              artifact.size,
              artifact.sha256,
              artifact.createdAt,
            );
          addEvent(taskId, "artifact", "An artifact was verified and stored.");
          return artifact;
        }),
      readArtifact: (artifactId) =>
        attempt(() => {
          ensureOpen();
          const value: unknown = database
            .query("SELECT * FROM artifacts WHERE id = ?")
            .get(artifactId);
          if (value === null) return fail("not_found", "Artifact not found.");
          const artifact = decode(ArtifactSchema, value);
          return { artifact, content: readBlob(artifact) };
        }),
      close: () =>
        attempt(() => {
          if (!closed) {
            database.close();
            closed = true;
          }
        }),
    };
  });

export const storeLayer = (options: StoreOptions) =>
  Layer.effect(
    TaskRepository,
    Effect.acquireRelease(openStore(options), (store) => store.close().pipe(Effect.orDie)),
  );
