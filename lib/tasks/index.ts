import { Context, Effect, Schema } from "effect";
import { AgentIdSchema } from "@/agents";
import type { Artifact, ArtifactInput } from "@/artifacts";
import type { Workspace } from "@/workspaces";

export { cli } from "./cli.ts";

export const TaskStatusSchema = Schema.Literals([
  "queued",
  "running",
  "succeeded",
  "failed",
  "cancelled",
  "interrupted",
]);
export type TaskStatus = typeof TaskStatusSchema.Type;
export const DurationSchema = Schema.Int.check(
  Schema.isGreaterThanOrEqualTo(1000),
  Schema.isLessThanOrEqualTo(900_000),
);
export const CreateTaskInputSchema = Schema.Struct({
  workspaceId: Schema.NonEmptyString,
  objective: Schema.String.check(
    Schema.isMinLength(1),
    Schema.isMaxLength(16_000),
    Schema.isPattern(/\S/),
  ),
  adapterId: AgentIdSchema,
  maxDurationMs: Schema.optional(DurationSchema),
  allowWrites: Schema.optional(Schema.Boolean),
  maxTurns: Schema.optional(
    Schema.Int.check(Schema.isGreaterThanOrEqualTo(1), Schema.isLessThanOrEqualTo(32)),
  ),
  idempotencyKey: Schema.optional(
    Schema.String.check(
      Schema.isMinLength(1),
      Schema.isMaxLength(160),
      Schema.isPattern(/^[a-zA-Z0-9_.:-]+$/),
    ),
  ),
});
export type CreateTaskInput = typeof CreateTaskInputSchema.Type;
export const TaskSchema = Schema.Struct({
  id: Schema.NonEmptyString,
  workspaceId: Schema.NonEmptyString,
  objective: CreateTaskInputSchema.fields.objective,
  adapterId: AgentIdSchema,
  status: TaskStatusSchema,
  createdAt: Schema.NonEmptyString,
  updatedAt: Schema.NonEmptyString,
  revision: Schema.Int.check(Schema.isGreaterThanOrEqualTo(1)),
  attemptId: Schema.NullOr(Schema.NonEmptyString),
  maxDurationMs: DurationSchema,
  allowWrites: Schema.Boolean,
  maxTurns: Schema.Int.check(Schema.isGreaterThanOrEqualTo(1), Schema.isLessThanOrEqualTo(32)),
});
export type Task = typeof TaskSchema.Type;
export const TaskEventTypeSchema = Schema.Literals([
  "accepted",
  "started",
  "message",
  "progress",
  "tool.intent",
  "tool.result",
  "usage",
  "artifact",
  "cancelled",
  "interrupted",
  "failed",
  "completed",
]);
export type TaskEventType = typeof TaskEventTypeSchema.Type;
export const TaskEventSchema = Schema.Struct({
  id: Schema.NonEmptyString,
  taskId: Schema.NonEmptyString,
  sequence: Schema.Int.check(Schema.isGreaterThanOrEqualTo(1)),
  type: TaskEventTypeSchema,
  message: Schema.String.check(Schema.isMaxLength(16_000)),
  createdAt: Schema.NonEmptyString,
});
export type TaskEvent = typeof TaskEventSchema.Type;
export const AttemptSchema = Schema.Struct({
  id: Schema.NonEmptyString,
  owner: Schema.NonEmptyString,
  epoch: Schema.Int.check(Schema.isGreaterThanOrEqualTo(1)),
  expiresAt: Schema.Int.check(Schema.isGreaterThanOrEqualTo(0)),
});
export type Attempt = typeof AttemptSchema.Type;
export interface ClaimedTask {
  readonly task: Task;
  readonly attempt: Attempt;
}
export class HarnessError extends Schema.TaggedError<HarnessError>()("HarnessError", {
  code: Schema.Literals([
    "invalid",
    "not_found",
    "conflict",
    "stale_lease",
    "capacity",
    "storage",
    "integrity",
  ]),
  message: Schema.String,
}) {}

export const validateTaskInput = Effect.fnUntraced(function* (input: unknown) {
  return yield* Schema.decodeUnknownEffect(CreateTaskInputSchema)(input, {
    onExcessProperty: "error",
  }).pipe(
    Effect.mapError(() => new HarnessError({ code: "invalid", message: "Invalid task input." })),
  );
});

export const canTransition = (from: TaskStatus, to: TaskStatus): boolean =>
  (from === "queued" && (to === "running" || to === "cancelled")) ||
  (from === "running" &&
    (to === "succeeded" || to === "failed" || to === "cancelled" || to === "interrupted"));

export interface Store {
  readonly createWorkspace: (input: unknown) => Effect.Effect<Workspace, HarnessError>;
  readonly listWorkspaces: () => Effect.Effect<readonly Workspace[], HarnessError>;
  readonly getWorkspace: (id: string) => Effect.Effect<Workspace, HarnessError>;
  readonly createTask: (input: unknown) => Effect.Effect<Task, HarnessError>;
  readonly listTasks: () => Effect.Effect<readonly Task[], HarnessError>;
  readonly getTask: (id: string) => Effect.Effect<Task, HarnessError>;
  readonly claimTask: (
    id: string,
    owner: string,
    leaseMs: number,
  ) => Effect.Effect<ClaimedTask, HarnessError>;
  readonly renewLease: (
    id: string,
    owner: string,
    epoch: number,
    leaseMs: number,
  ) => Effect.Effect<Attempt, HarnessError>;
  readonly appendEvent: (
    id: string,
    owner: string,
    epoch: number,
    type: TaskEventType,
    message: string,
  ) => Effect.Effect<TaskEvent, HarnessError>;
  readonly finishTask: (
    id: string,
    owner: string,
    epoch: number,
    status: "succeeded" | "failed" | "interrupted",
    message: string,
  ) => Effect.Effect<Task, HarnessError>;
  readonly cancelTask: (id: string) => Effect.Effect<Task, HarnessError>;
  readonly recoverExpiredTasks: () => Effect.Effect<readonly Task[], HarnessError>;
  readonly listEvents: (
    id: string,
    afterSequence?: number,
  ) => Effect.Effect<readonly TaskEvent[], HarnessError>;
  readonly listArtifacts: (id: string) => Effect.Effect<readonly Artifact[], HarnessError>;
  readonly putArtifact: (
    id: string,
    owner: string,
    epoch: number,
    input: ArtifactInput,
  ) => Effect.Effect<Artifact, HarnessError>;
  readonly readArtifact: (
    id: string,
  ) => Effect.Effect<{ readonly artifact: Artifact; readonly content: Uint8Array }, HarnessError>;
  readonly close: () => Effect.Effect<void, HarnessError>;
}

export class TaskRepository extends Context.Service<TaskRepository, Store>()(
  "teamagent/tasks/TaskRepository",
) {}
