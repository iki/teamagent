import { Schema } from "effect";

export { cli } from "./cli.ts";

export const AgentIdSchema = Schema.String.check(
  Schema.isMinLength(1),
  Schema.isMaxLength(80),
  Schema.isPattern(/^[a-z][a-z0-9-]*$/),
);
export const CapabilityStatusSchema = Schema.Literals(["supported", "unsupported", "unknown"]);
export const AgentCapabilitiesSchema = Schema.Struct({
  effectInterception: CapabilityStatusSchema,
  approvalInterception: CapabilityStatusSchema,
  filesystemIsolation: CapabilityStatusSchema,
  networkIsolation: CapabilityStatusSchema,
  cancellationEnforcement: CapabilityStatusSchema,
});
export type AgentCapabilities = typeof AgentCapabilitiesSchema.Type;
export const AgentDescriptorSchema = Schema.Struct({
  id: AgentIdSchema,
  name: Schema.NonEmptyString,
  description: Schema.NonEmptyString,
  available: Schema.Boolean,
  capabilities: AgentCapabilitiesSchema,
  evidence: Schema.NonEmptyString,
});
export type AgentDescriptor = typeof AgentDescriptorSchema.Type;
