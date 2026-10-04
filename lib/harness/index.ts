import { Schema } from "effect";
import { AgentDescriptorSchema } from "@/agents";
import { ArtifactSchema } from "@/artifacts";
import { TaskSchema, TaskEventSchema } from "@/tasks";
import { WorkspaceSchema } from "@/workspaces";

export { cli } from "./cli.ts";

export const WorkspacesSchema = Schema.Array(WorkspaceSchema);
export const TasksSchema = Schema.Array(TaskSchema);
export const EventsSchema = Schema.Array(TaskEventSchema);
export const ArtifactsSchema = Schema.Array(ArtifactSchema);
export const AgentsSchema = Schema.Array(AgentDescriptorSchema);
export const PortSchema = Schema.Int.check(
  Schema.isGreaterThanOrEqualTo(0),
  Schema.isLessThanOrEqualTo(65535),
);
export const PiConfigSchema = Schema.Struct({
  provider: Schema.Literals(["openai", "anthropic"]),
  model: Schema.String.check(Schema.isMinLength(1), Schema.isMaxLength(200)),
});
export type PiConfig = typeof PiConfigSchema.Type;
export const ConfigSchema = Schema.Struct({
  port: PortSchema,
  data: Schema.NonEmptyString,
  pi: Schema.optional(PiConfigSchema),
});
export type HarnessConfig = typeof ConfigSchema.Type;
export const HealthSchema = Schema.Struct({
  status: Schema.Literal("ok"),
  version: Schema.NonEmptyString,
});
export const ConnectionSchema = Schema.Struct({
  url: Schema.NonEmptyString,
  token: Schema.String.check(Schema.isMinLength(32), Schema.isMaxLength(256)),
});
export const ErrorResponseSchema = Schema.Struct({
  error: Schema.Struct({ code: Schema.String, message: Schema.String }),
});
