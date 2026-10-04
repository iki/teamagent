import { Context, Effect, Schema } from "effect";

export { cli } from "./cli.ts";

const BoundedString = Schema.NonEmptyString.check(Schema.isMaxLength(4096));
export const InstallationScopeSchema = Schema.Literals(["project", "global"]);
export const IntegrationInputSchema = Schema.Struct({
  agent: Schema.String.check(Schema.isPattern(/^[a-z][a-z0-9-]{0,79}$/)),
  scope: InstallationScopeSchema,
  components: Schema.Literals(["skill", "mcp", "both"]),
});
export type IntegrationInput = typeof IntegrationInputSchema.Type;
export const DiscoveredAgentSchema = Schema.Struct({
  id: BoundedString,
  name: BoundedString,
  detected: Schema.Boolean,
  evidence: Schema.Array(BoundedString),
  executable: Schema.NullOr(BoundedString),
  authentication: Schema.Literal("unknown"),
  runtimeCapabilities: Schema.Literal("untested"),
  projectSkills: BoundedString,
  globalSkills: Schema.NullOr(BoundedString),
  mcpInstallation: Schema.Boolean,
});
export type DiscoveredAgent = typeof DiscoveredAgentSchema.Type;
export const IntegrationFileSchema = Schema.Struct({
  path: BoundedString,
  kind: Schema.Literals(["skill", "mcp"]),
  status: Schema.Literals(["create", "update", "unchanged"]),
});
export const IntegrationPlanSchema = Schema.Struct({
  agent: BoundedString,
  scope: InstallationScopeSchema,
  root: BoundedString,
  files: Schema.Array(IntegrationFileSchema),
  command: BoundedString,
  args: Schema.Array(BoundedString),
  notice: Schema.String,
});
export type IntegrationPlan = typeof IntegrationPlanSchema.Type;
export const IntegrationResultSchema = Schema.Struct({
  plan: IntegrationPlanSchema,
  backups: Schema.Array(BoundedString),
});
export type IntegrationResult = typeof IntegrationResultSchema.Type;
export class IntegrationError extends Schema.TaggedError<IntegrationError>()("IntegrationError", {
  code: Schema.Literals(["invalid", "unsupported", "conflict", "io"]),
  message: Schema.String,
}) {}
export const validateIntegrationInput = Effect.fnUntraced(function* (input: unknown) {
  return yield* Schema.decodeUnknownEffect(IntegrationInputSchema)(input, {
    onExcessProperty: "error",
  }).pipe(
    Effect.mapError(
      () => new IntegrationError({ code: "invalid", message: "Invalid integration input." }),
    ),
  );
});
export interface IntegrationService {
  readonly list: () => Effect.Effect<readonly DiscoveredAgent[], IntegrationError>;
  readonly plan: (input: unknown) => Effect.Effect<IntegrationPlan, IntegrationError>;
  readonly install: (input: unknown) => Effect.Effect<IntegrationResult, IntegrationError>;
}
export class Integrations extends Context.Service<Integrations, IntegrationService>()(
  "teamagent/integrations/Integrations",
) {}
