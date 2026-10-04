import { Schema } from "effect";

const text = Schema.String;
export const EvidenceSchema = Schema.Struct({
  path: text,
  lineStart: Schema.optional(Schema.Int),
  lineEnd: Schema.optional(Schema.Int),
  page: Schema.optional(Schema.Int),
  contains: Schema.Array(text),
});
export const CaseSchema = Schema.Struct({
  id: text,
  split: Schema.Literals(["dev", "holdout"]),
  repo: text,
  category: text,
  query: text,
  evidence: Schema.Array(EvidenceSchema),
  answerFacts: Schema.Array(text),
  rationale: text,
  answerable: Schema.Boolean,
});
export type BenchmarkCase = typeof CaseSchema.Type;
export const CodeManifestSchema = Schema.Struct({
  repos: Schema.Array(
    Schema.Struct({
      id: text,
      root: text,
      commit: text,
      files: Schema.Array(Schema.Struct({ path: text, sha256: text, bytes: Schema.Int })),
    }),
  ),
  cases: Schema.Array(CaseSchema),
});
export const DocumentManifestSchema = Schema.Struct({
  sources: Schema.Array(
    Schema.Struct({ id: text, path: text, sha256: text, bytes: Schema.Int, pages: Schema.Int }),
  ),
  cases: Schema.Array(CaseSchema),
});
export const PassageSchema = Schema.Struct({
  id: text,
  sourceId: text,
  path: text,
  lineStart: Schema.Int,
  lineEnd: Schema.Int,
  text,
});
export type Passage = typeof PassageSchema.Type;
export const CorpusSchema = Schema.Struct({
  format: Schema.Literal("teamagent-memory-benchmark-v1"),
  createdAt: text,
  passages: Schema.Array(PassageSchema),
  cases: Schema.Array(CaseSchema),
});
export type Corpus = typeof CorpusSchema.Type;
export const RunSchema = Schema.Struct({
  elapsedMs: Schema.Number,
  hits: Schema.Array(Schema.Struct({ id: text, score: Schema.Number })),
  error: Schema.optional(text),
});
export const SystemSchema = Schema.Struct({
  system: text,
  mode: text,
  ingestMs: Schema.Number,
  queries: Schema.Array(Schema.Struct({ id: text, runs: Schema.Array(RunSchema) })),
});
export type SystemResult = typeof SystemSchema.Type;
export const ResultSchema = Schema.Struct({ systems: Schema.Array(SystemSchema) });

export function parseJson<A>(schema: Schema.Codec<A>, value: string): A {
  const decoded: unknown = JSON.parse(value);
  return Schema.decodeUnknownSync(schema)(decoded);
}
