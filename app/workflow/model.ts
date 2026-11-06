import { Schema } from "effect";
import { RecordInput } from "../conversations/archive.ts";

export const Id = Schema.NonEmptyString.check(
  Schema.isMaxLength(256),
  Schema.isPattern(/^[^\r\n\0]+$/u),
);
export const Path = Schema.NonEmptyString.check(
  Schema.isMaxLength(4096),
  Schema.isPattern(/^(?!\/)(?!.*\/\/)(?!.*\/$)(?!.*(?:^|\/)\.{1,2}(?:\/|$))[^\p{Cc}\\:]+$/u),
);
export const Hash = Schema.String.check(Schema.isPattern(/^[a-f0-9]{64}$/u));
export const Identity = { sessionId: Id, taskId: Id };
const PolicyFields = {
  repository: Schema.Literal("github.com/iki/teamagent"),
  remote: Schema.Literal("origin"),
  ref: Schema.Literal("refs/heads/main"),
};
export const LegacyPolicy = Schema.Struct({
  version: Schema.Literal(1),
  ...PolicyFields,
});
export const ParallelPolicy = Schema.Struct({
  version: Schema.Literal(2),
  ...PolicyFields,
  mode: Schema.Literals(["local", "pr"]),
});
export const Policy = Schema.Union([LegacyPolicy, ParallelPolicy]);
export type Policy = typeof Policy.Type;
export const Snapshot = Schema.Struct({
  head: Schema.String,
  branch: Schema.String,
  remote: Schema.String,
  ref: Schema.String,
  destination: Hash,
  changes: Schema.Record(Path, Schema.String),
});
export type Snapshot = typeof Snapshot.Type;
export const Checkpoint = Schema.Struct({
  archive: Path,
  archiveHash: Hash,
  responseHash: Hash,
  message: Schema.NonEmptyString.check(Schema.isMaxLength(16384)),
  files: Schema.Array(Path).check(Schema.isMinLength(1), Schema.isMaxLength(10000)),
  approvedExistingFiles: Schema.Array(Path),
  hashes: Schema.Record(Path, Schema.String),
});
export type Checkpoint = typeof Checkpoint.Type;
export const Verification = Schema.Struct({
  key: Hash,
  tree: Schema.String,
  time: Schema.Number,
  bun: Schema.String,
  executable: Schema.String,
});
export const Task = Schema.Struct({
  version: Schema.Literal(1),
  ...Identity,
  snapshot: Snapshot,
  policyHash: Hash,
  state: Schema.Literals([
    "open",
    "checkpointed",
    "ready",
    "committing",
    "committed",
    "pushing",
    "pushed",
    "uncertain",
    "failed",
    "cancelled",
  ]),
  checkpoint: Schema.NullOr(Checkpoint),
  verification: Schema.NullOr(Verification),
  signingIdentity: Schema.NullOr(Hash),
  commit: Schema.NullOr(Schema.String),
  failure: Schema.NullOr(Schema.String),
  policyMigration: Schema.optional(Schema.Struct({ previousHash: Hash, baseline: Schema.String })),
  latestRevision: Schema.optional(Schema.Struct({ receipt: Path, hash: Hash })),
});
export type Task = typeof Task.Type;
export const Request = Schema.Union([
  Schema.Struct({
    operation: Schema.Literals(["begin", "status", "prepare", "publish", "cancel", "adopt-policy"]),
    ...Identity,
  }),
  Schema.Struct({
    operation: Schema.Literal("verify"),
    ...Identity,
    phase: Schema.Literals(["step", "review", "final"]),
  }),
  Schema.Struct({
    operation: Schema.Literal("checkpoint"),
    ...Identity,
    record: RecordInput,
    message: Schema.NonEmptyString.check(Schema.isMaxLength(16384)),
    files: Schema.Array(Path).check(Schema.isMinLength(1), Schema.isMaxLength(10000)),
    approvedExistingFiles: Schema.optional(Schema.Array(Path).check(Schema.isMaxLength(10000))),
  }),
  Schema.Struct({
    operation: Schema.Literal("revise-checkpoint"),
    ...Identity,
    revisionId: Id,
    expectedCheckpointHash: Hash,
    reason: Schema.NonEmptyString.check(Schema.isMaxLength(2048), Schema.isPattern(/\S/u)),
    files: Schema.Array(Path).check(Schema.isMinLength(1), Schema.isMaxLength(9999)),
    approvedExistingFiles: Schema.optional(Schema.Array(Path).check(Schema.isMaxLength(9999))),
  }),
]);
export type Request = typeof Request.Type;
export function validateMessage(message: string): void {
  const subject = message.split("\n")[0] ?? "";
  if (
    !/^(?:feat|fix|perf|refactor|docs|spec|test|build|ci|chore|data)(?:\([a-z0-9][a-z0-9-]*\))?!?: [A-Z][^\r\n]*[^.\s]$/u.test(
      subject,
    ) ||
    subject.length > 100 ||
    /[\r\0]/u.test(message) ||
    /(?:^|\n)Teamagent-Task:/iu.test(message)
  )
    throw new Error(
      "Use type: Capitalized imperative summary, at most 100 characters, no final period or reserved trailer",
    );
  if (subject.includes("!: ") && !/\nBREAKING CHANGE: \S/u.test(message))
    throw new Error("Breaking change requires migration guidance");
}
