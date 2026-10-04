import { Schema } from "effect";

export { cli } from "./cli.ts";

export const WorkspaceNameSchema = Schema.String.check(
  Schema.isMinLength(1),
  Schema.isMaxLength(120),
  Schema.isPattern(/\S/),
);
export const WorkspacePathSchema = Schema.String.check(
  Schema.isMinLength(1),
  Schema.isMaxLength(4096),
  Schema.isPattern(/^[^\p{Cc}]+$/u),
);
export const CreateWorkspaceInputSchema = Schema.Struct({
  name: WorkspaceNameSchema,
  path: WorkspacePathSchema,
});
export type CreateWorkspaceInput = typeof CreateWorkspaceInputSchema.Type;

export const WorkspaceSchema = Schema.Struct({
  id: Schema.NonEmptyString,
  name: WorkspaceNameSchema,
  path: WorkspacePathSchema,
  createdAt: Schema.NonEmptyString,
});
export type Workspace = typeof WorkspaceSchema.Type;
