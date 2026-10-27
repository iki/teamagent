import { Schema } from "effect";

const text = Schema.String;
export const InventorySchema = Schema.Array(
  Schema.Struct({
    id: text,
    category: text,
    name: text,
    github: text,
    revision: text,
    report: text,
    topics: Schema.Array(text),
    depth: Schema.optional(text),
    commit_date: Schema.optional(text),
  }),
);
export const ObservedRepositorySchema = Schema.Struct({
  id: text,
  category: text,
  url: text,
  path: text,
  head: Schema.NullOr(text),
  shallow: Schema.NullOr(Schema.Boolean),
  dirty: Schema.NullOr(Schema.Boolean),
  status: text,
  lifecycle: text,
  availability: text,
  aliases: Schema.optional(Schema.Array(text)),
  previousPath: Schema.optional(Schema.NullOr(text)),
});
export type ObservedRepository = typeof ObservedRepositorySchema.Type;
export const GitStateSchema = Schema.Struct({
  schemaVersion: Schema.Literal(1),
  generatedAt: text,
  discoveryComplete: Schema.Boolean,
  repositories: Schema.Array(ObservedRepositorySchema),
});
export const AnalysisRecordSchema = Schema.Struct({
  id: text,
  category: text,
  name: text,
  url: text,
  aliases: Schema.Array(text),
  report: text,
  topics: Schema.Array(text),
  depth: text,
  analyzedSha: Schema.NullOr(text),
  analyzedAt: Schema.NullOr(text),
  analyzedCommitDate: Schema.NullOr(text),
  reportSha256: Schema.NullOr(text),
  lifecycle: Schema.Literals(["active", "archived"]),
});
export type AnalysisRecord = typeof AnalysisRecordSchema.Type;
export const ReviewRequestSchema = Schema.Struct({ id: text, sha: text, reason: text });
export type ReviewRequest = typeof ReviewRequestSchema.Type;
export const ReviewRequestsSchema = Schema.Array(ReviewRequestSchema);
export const ReviewEventSchema = Schema.Struct({
  at: text,
  id: text,
  action: Schema.Literals(["migrated", "added", "reviewed", "renamed", "archived"]),
  previousSha: Schema.NullOr(text),
  sha: Schema.NullOr(text),
  reason: text,
});
export type ReviewEvent = typeof ReviewEventSchema.Type;
export const AnalysisStateSchema = Schema.Struct({
  schemaVersion: Schema.Literal(1),
  migratedAt: text,
  inventorySha256: text,
  records: Schema.Array(AnalysisRecordSchema),
  events: Schema.Array(ReviewEventSchema),
});
export type AnalysisState = typeof AnalysisStateSchema.Type;
export const ChangePacketSchema = Schema.Struct({
  id: text,
  generatedAt: text,
  observedAt: Schema.NullOr(text),
  source: text,
  report: text,
  analyzedSha: Schema.NullOr(text),
  analyzedAt: Schema.NullOr(text),
  analyzedCommitDate: Schema.NullOr(text),
  observedSha: Schema.NullOr(text),
  status: text,
  shallow: Schema.NullOr(Schema.Boolean),
  dirty: Schema.NullOr(Schema.Boolean),
  reportModified: Schema.Boolean,
  commits: Schema.Array(Schema.Struct({ sha: text, date: text, subject: text })),
  files: Schema.Array(
    Schema.Struct({ status: text, path: text, previousPath: Schema.NullOr(text) }),
  ),
  commitsTruncated: Schema.Boolean,
  filesTruncated: Schema.Boolean,
  notes: Schema.Array(text),
});
export type ChangePacket = typeof ChangePacketSchema.Type;
export function parseAnalysisJson<A>(schema: Schema.Codec<A>, value: string): A {
  const input: unknown = JSON.parse(value);
  return Schema.decodeUnknownSync(schema)(input);
}
