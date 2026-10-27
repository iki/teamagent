import { Database } from "bun:sqlite";
import {
  createCipheriv,
  createDecipheriv,
  createHash,
  createHmac,
  randomBytes,
  randomUUID,
  timingSafeEqual,
} from "node:crypto";
import { chmod, lstat, mkdir, open, realpath } from "node:fs/promises";
import { join, resolve } from "node:path";
import { Schema } from "effect";
import { MediaArtifactSchema, TrainingDecisionSchema } from "@/media";
import {
  MediaHostFailure,
  MediaPolicyFailure,
  MediaHttpFailure,
  MediaHttpDiagnosticSchema,
  classifyMediaHttp,
  mediaHttpDetails,
  safeProviderId,
  sanitizeMediaDiagnostic,
  type MediaHttpDiagnostic,
  type MediaHttpResponse,
} from "./transport.ts";

const Id = Schema.String.check(Schema.isPattern(/^[a-zA-Z0-9][a-zA-Z0-9_-]{0,255}$/));
const IdempotencyKey = Schema.String.check(Schema.isPattern(/^[a-zA-Z0-9][a-zA-Z0-9._-]{7,127}$/));
const Hash = Schema.String.check(Schema.isPattern(/^[a-f0-9]{64}$/));
const Path = Schema.String.check(
  Schema.isMinLength(1),
  Schema.isMaxLength(4096),
  Schema.isPattern(/^[^\p{Cc}]+$/u),
);
const State = Schema.Literals([
  "submitting",
  "accepted",
  "pending",
  "rejected",
  "uncertain",
  "generated-awaiting-download",
  "published",
]);
export type MediaReceiptState = typeof State.Type;
const Alignment = Schema.Array(
  Schema.Struct({
    text: Schema.String.check(Schema.isMaxLength(512)),
    startTime: Schema.Number.check(
      Schema.isFinite(),
      Schema.isBetween({ minimum: 0, maximum: 86400 }),
    ),
    endTime: Schema.Number.check(
      Schema.isFinite(),
      Schema.isBetween({ minimum: 0, maximum: 86400 }),
    ),
  }),
).check(Schema.isMaxLength(20000));
const Projection = Schema.Struct({
  audioUrl: Schema.NullOr(Schema.String.check(Schema.isMaxLength(8192))),
  voiceId: Schema.NullOr(Id),
  status: Schema.NullOr(Id),
  requiresVerification: Schema.NullOr(Schema.Boolean),
  duration: Schema.NullOr(
    Schema.Number.check(Schema.isFinite(), Schema.isBetween({ minimum: 0, maximum: 86400 })),
  ),
  assetIds: Schema.Array(Id).check(Schema.isMaxLength(64)),
  originalCharacters: Alignment,
  originalWords: Alignment,
  alignmentValid: Schema.Boolean,
});
export const MediaReceiptSchema = Schema.Struct({
  version: Schema.Literal(1),
  id: Id,
  backend: Id,
  operation: Schema.Literals(["clone", "synthesize"]),
  model: Schema.NullOr(Schema.String.check(Schema.isMaxLength(256))),
  requestDigest: Hash,
  idempotencyKey: Schema.NullOr(IdempotencyKey),
  state: State,
  revision: Schema.Int.check(Schema.isBetween({ minimum: 0, maximum: 10000 })),
  createdAt: Schema.String.check(Schema.isMaxLength(40)),
  updatedAt: Schema.String.check(Schema.isMaxLength(40)),
  output: Schema.NullOr(Path),
  sourceSha256: Schema.NullOr(Hash),
  referenceSha256: Schema.NullOr(Hash),
  withTimestamps: Schema.Boolean,
  trainingDecision: Schema.NullOr(TrainingDecisionSchema),
  voiceAuthorization: Schema.NullOr(Schema.String.check(Schema.isMaxLength(512))),
  requestId: Schema.NullOr(Id),
  voiceId: Schema.NullOr(Id),
  diagnostic: Schema.NullOr(MediaHttpDiagnosticSchema),
  response: Schema.NullOr(Projection),
  artifact: Schema.NullOr(MediaArtifactSchema),
});
export type MediaReceipt = typeof MediaReceiptSchema.Type;
const Begin = Schema.Struct({
  backend: Id,
  operation: Schema.Literals(["clone", "synthesize"]),
  model: Schema.NullOr(Schema.String.check(Schema.isMaxLength(256))),
  requestDigest: Hash,
  idempotencyKey: Schema.optional(IdempotencyKey),
  output: Schema.optional(Path),
  sourceSha256: Schema.optional(Hash),
  referenceSha256: Schema.optional(Hash),
  withTimestamps: Schema.optional(Schema.Boolean),
  newCandidate: Schema.optional(Schema.Boolean),
  trainingDecision: Schema.optional(TrainingDecisionSchema),
  voiceAuthorization: Schema.optional(Schema.String.check(Schema.isMaxLength(512))),
});
export type BeginMediaReceipt = typeof Begin.Type;
const Update = Schema.Struct({
  state: State,
  requestId: Schema.optional(Schema.NullOr(Id)),
  voiceId: Schema.optional(Schema.NullOr(Id)),
  diagnostic: Schema.optional(Schema.NullOr(MediaHttpDiagnosticSchema)),
  response: Schema.optional(Projection),
  artifact: Schema.optional(MediaArtifactSchema),
});
export type UpdateMediaReceipt = typeof Update.Type;
export interface PublicMediaReceipt {
  readonly id: string;
  readonly backend: string;
  readonly operation: "clone" | "synthesize";
  readonly model: string | null;
  readonly state: MediaReceiptState;
  readonly revision: number;
  readonly createdAt: string;
  readonly updatedAt: string;
  readonly requestId: string | null;
  readonly voiceId: string | null;
  readonly diagnostic: MediaHttpDiagnostic | null;
  readonly artifactLocation: {
    readonly origin: string | null;
    readonly path: string | null;
  } | null;
  readonly artifactSha256: string | null;
  readonly artifactSizeBytes: number | null;
  readonly hasIdempotencyKey: boolean;
}
export interface MediaReceiptStore {
  readonly begin: (
    input: BeginMediaReceipt,
  ) => Promise<{ readonly created: boolean; readonly receipt: MediaReceipt }>;
  readonly update: (id: string, input: UpdateMediaReceipt) => Promise<MediaReceipt>;
  readonly captureResponse: (id: string, response: MediaHttpResponse) => Promise<MediaReceipt>;
  readonly fail: (id: string, error: unknown) => Promise<MediaReceipt>;
  readonly load: (id: string) => Promise<MediaReceipt>;
  readonly public: (id: string) => Promise<PublicMediaReceipt>;
  readonly list: () => Promise<readonly PublicMediaReceipt[]>;
}
export class MediaReceiptFailure extends MediaHostFailure {
  readonly policyDenied: boolean;
  readonly receiptId: string;
  readonly outcome: MediaReceiptState;
  readonly diagnostic: MediaHttpDiagnostic | null;
  constructor(receipt: MediaReceipt, cause?: unknown) {
    super(
      cause instanceof MediaHostFailure ? cause.kind : "provider",
      cause instanceof MediaHostFailure
        ? cause.message
        : "Media operation did not complete; inspect its durable receipt before retrying.",
    );
    this.policyDenied = cause instanceof MediaPolicyFailure;
    this.receiptId = receipt.id;
    this.outcome = receipt.state;
    this.diagnostic = cause instanceof MediaHttpFailure ? cause.diagnostic : receipt.diagnostic;
  }
}
export function mediaRequestDigest(value: unknown): string {
  const encoded = JSON.stringify(value);
  if (encoded === undefined || Buffer.byteLength(encoded) > 16 * 1024 * 1024)
    throw new MediaHostFailure("limit", "Receipt request fingerprint exceeds its bound.");
  return createHash("sha256").update(encoded).digest("hex");
}
export function publicMediaReceipt(receipt: MediaReceipt): PublicMediaReceipt {
  let artifactLocation: PublicMediaReceipt["artifactLocation"] = null;
  if (receipt.response?.audioUrl !== null && receipt.response?.audioUrl !== undefined) {
    artifactLocation = { origin: null, path: null };
    try {
      const url = new URL(receipt.response.audioUrl);
      if (url.origin === "https://files.heygen.ai" && url.pathname.startsWith("/generated/"))
        artifactLocation = { origin: url.origin, path: "/generated/[redacted]" };
      if (
        url.origin === "https://resource2.heygen.ai" &&
        url.pathname.startsWith("/text_to_speech/")
      )
        artifactLocation = { origin: url.origin, path: "/text_to_speech/[redacted]" };
    } catch {
      /* Confidential malformed references are never reflected publicly. */
    }
  }
  return {
    id: receipt.id,
    backend: receipt.backend,
    operation: receipt.operation,
    model: receipt.model,
    state: receipt.state,
    revision: receipt.revision,
    createdAt: receipt.createdAt,
    updatedAt: receipt.updatedAt,
    requestId: receipt.requestId,
    voiceId: receipt.voiceId,
    diagnostic: receipt.diagnostic,
    artifactLocation,
    artifactSha256: receipt.artifact?.sha256 ?? null,
    artifactSizeBytes: receipt.artifact?.sizeBytes ?? null,
    hasIdempotencyKey: receipt.idempotencyKey !== null,
  };
}
const Stored = Schema.Struct({ id: Id, payload: Schema.Uint8Array });
const Totals = Schema.Struct({ count: Schema.Int, bytes: Schema.Int });
const maxRecordBytes = 2 * 1024 * 1024;
const maxStoreBytes = 64 * 1024 * 1024;
const transitions: Readonly<Record<MediaReceiptState, readonly MediaReceiptState[]>> = {
  submitting: ["accepted", "pending", "rejected", "uncertain", "generated-awaiting-download"],
  accepted: ["pending", "rejected", "uncertain", "generated-awaiting-download"],
  pending: ["accepted", "rejected", "uncertain", "generated-awaiting-download"],
  rejected: [],
  uncertain: ["accepted", "pending", "rejected", "generated-awaiting-download"],
  "generated-awaiting-download": ["published"],
  published: [],
};
function malformedDiagnostic(response?: MediaHttpResponse): MediaHttpDiagnostic {
  return {
    category: "malformed-response",
    status:
      response !== undefined && response.status >= 100 && response.status <= 599
        ? response.status
        : null,
    requestId: safeProviderId(response?.requestId),
    providerCode: null,
    providerMessage: null,
    contentType: response === undefined ? null : mediaHttpDetails(response).contentType,
    retryable: false,
    bodyTruncated: response?.bodyTruncated ?? false,
  };
}
function projection(response: MediaHttpResponse): {
  readonly value: typeof Projection.Type;
  readonly malformed: boolean;
} {
  const value: typeof Projection.Type = {
    audioUrl: null,
    voiceId: null,
    status: null,
    requiresVerification: null,
    duration: null,
    assetIds: [],
    originalCharacters: [],
    originalWords: [],
    alignmentValid: true,
  };
  let malformed = false;
  if (response.bytes.byteLength > 4 * 1024 * 1024 || response.bodyTruncated === true)
    return { value: { ...value, alignmentValid: false }, malformed: true };
  try {
    const raw: unknown = JSON.parse(
      new TextDecoder("utf-8", { fatal: true }).decode(response.bytes),
    );
    const envelope = Schema.decodeUnknownSync(Schema.Record(Schema.String, Schema.Unknown))(raw);
    const data = Schema.decodeUnknownSync(Schema.Record(Schema.String, Schema.Unknown))(
      envelope.data,
    );
    const audioUrl =
      typeof data.audio_url === "string" && data.audio_url.length <= 8192 ? data.audio_url : null;
    const voiceId = safeProviderId(data.voice_id);
    const status =
      typeof data.status === "string" &&
      /^(ACTIVE|PENDING|PROCESSING|TRAINING|FAILED|DELETED|READY|active|pending|processing|training|failed|deleted|ready)$/.test(
        data.status,
      )
        ? data.status
        : null;
    const requiresVerification =
      typeof data.requires_verification === "boolean" ? data.requires_verification : null;
    if (
      data.requires_verification !== undefined &&
      data.requires_verification !== null &&
      typeof data.requires_verification !== "boolean"
    )
      malformed = true;
    const duration =
      typeof data.duration === "number" &&
      Number.isFinite(data.duration) &&
      data.duration >= 0 &&
      data.duration <= 86400
        ? data.duration
        : null;
    let assetIds: readonly string[] = [];
    try {
      const assets = data.asset_ids ?? (data.asset_id === undefined ? [] : [data.asset_id]);
      assetIds = Schema.decodeUnknownSync(Schema.Array(Id).check(Schema.isMaxLength(64)))(assets);
    } catch {
      malformed = true;
    }
    let originalCharacters: typeof Alignment.Type = [];
    let originalWords: typeof Alignment.Type = [];
    let alignmentValid = true;
    const items = Schema.Array(
      Schema.Struct({
        text: Schema.String.check(Schema.isMaxLength(512)),
        start_time: Schema.Number,
        end_time: Schema.Number,
      }),
    ).check(Schema.isMaxLength(20000));
    try {
      const convert = (input: unknown) =>
        Schema.decodeUnknownSync(Alignment)(
          Schema.decodeUnknownSync(items)(input).map((item) => ({
            text: item.text,
            startTime: item.start_time,
            endTime: item.end_time,
          })),
        );
      originalCharacters = convert(data.original_characters ?? []);
      originalWords = convert(data.original_words ?? []);
      const combined = [...originalCharacters, ...originalWords];
      if (
        combined.length > 20000 ||
        combined.reduce((size, item) => size + item.text.length, 0) > 100000 ||
        combined.some((item) => item.endTime < item.startTime)
      )
        throw new Error("invalid alignment");
    } catch {
      alignmentValid = false;
      malformed = true;
      originalCharacters = [];
      originalWords = [];
    }
    return {
      value: {
        audioUrl,
        voiceId,
        status,
        requiresVerification,
        duration,
        assetIds,
        originalCharacters,
        originalWords,
        alignmentValid,
      },
      malformed,
    };
  } catch {
    return { value: { ...value, alignmentValid: false }, malformed: true };
  }
}
/** Host-only encrypted journal. Key is injected, never persisted. POSIX modes are not Windows ACL isolation. */
export async function createMediaReceiptStore(options: {
  readonly directory: string;
  readonly key: Uint8Array;
  readonly maximumReceipts?: number;
  readonly lockTimeoutMs?: number;
}): Promise<MediaReceiptStore> {
  const maximumReceipts = options.maximumReceipts ?? 256;
  const lockTimeoutMs = options.lockTimeoutMs ?? 2000;
  if (
    options.key.byteLength !== 32 ||
    !Number.isInteger(maximumReceipts) ||
    maximumReceipts < 1 ||
    maximumReceipts > 1024 ||
    !Number.isInteger(lockTimeoutMs) ||
    lockTimeoutMs < 1 ||
    lockTimeoutMs > 5000
  )
    throw new MediaHostFailure("invalid", "Invalid encrypted receipt store configuration.");
  const secret = Buffer.from(options.key);
  const directory = resolve(options.directory);
  await mkdir(directory, { recursive: true, mode: 0o700 });
  const path = join(directory, "media-receipts.sqlite");
  async function checkDirectory(): Promise<void> {
    const info = await lstat(directory);
    if (!info.isDirectory() || info.isSymbolicLink() || (await realpath(directory)) !== directory)
      throw new MediaHostFailure("invalid", "Receipt directory must not contain symbolic links.");
    for (const suffix of ["", "-wal", "-shm", "-journal"]) {
      try {
        const file = await lstat(path + suffix);
        if (!file.isFile() || file.isSymbolicLink() || file.size > maxStoreBytes + 16 * 1024 * 1024)
          throw new MediaHostFailure("invalid", "Invalid receipt storage file.");
      } catch (error: unknown) {
        if (!(error instanceof Error && "code" in error && error.code === "ENOENT")) throw error;
      }
    }
  }
  function encrypt(receipt: MediaReceipt): Uint8Array {
    const plaintext = Buffer.from(JSON.stringify(receipt));
    if (plaintext.byteLength > maxRecordBytes)
      throw new MediaHostFailure("limit", "Receipt exceeds its encrypted record limit.");
    const nonce = randomBytes(12);
    const cipher = createCipheriv("aes-256-gcm", secret, nonce);
    cipher.setAAD(Buffer.from("teamagent-media-receipt/1:" + receipt.id));
    const body = Buffer.concat([cipher.update(plaintext), cipher.final()]);
    return Buffer.concat([Buffer.from([1]), nonce, cipher.getAuthTag(), body]);
  }
  function decrypt(dynamic: unknown): MediaReceipt {
    const row = Schema.decodeUnknownSync(Stored)(dynamic);
    const payload = Buffer.from(row.payload);
    if (payload.byteLength < 30 || payload.byteLength > maxRecordBytes + 29 || payload[0] !== 1)
      throw new Error("invalid encrypted receipt");
    const decipher = createDecipheriv("aes-256-gcm", secret, payload.subarray(1, 13));
    decipher.setAAD(Buffer.from("teamagent-media-receipt/1:" + row.id));
    decipher.setAuthTag(payload.subarray(13, 29));
    const raw: unknown = JSON.parse(
      Buffer.concat([decipher.update(payload.subarray(29)), decipher.final()]).toString("utf8"),
    );
    const fields = Schema.decodeUnknownSync(Schema.Record(Schema.String, Schema.Unknown))(raw);
    const response =
      fields.response == null
        ? fields.response
        : {
            requiresVerification: null,
            ...Schema.decodeUnknownSync(Schema.Record(Schema.String, Schema.Unknown))(
              fields.response,
            ),
          };
    const receipt = Schema.decodeUnknownSync(MediaReceiptSchema)(
      { trainingDecision: null, ...fields, response },
      { onExcessProperty: "error" },
    );
    if (receipt.id !== row.id) throw new Error("receipt identity mismatch");
    return receipt;
  }
  async function transaction<A>(work: (db: Database) => A): Promise<A> {
    try {
      await checkDirectory();
      const db = new Database(path, { create: true, strict: true });
      try {
        db.exec(
          "PRAGMA busy_timeout = " +
            String(lockTimeoutMs) +
            "; PRAGMA max_page_count = 16384; PRAGMA journal_mode = WAL; PRAGMA synchronous = FULL; CREATE TABLE IF NOT EXISTS receipts (id TEXT PRIMARY KEY, key_digest TEXT UNIQUE, payload BLOB NOT NULL); CREATE TABLE IF NOT EXISTS store_metadata (id INTEGER PRIMARY KEY CHECK(id=1), key_check BLOB NOT NULL)",
        );
        return db
          .transaction(() => {
            const verifier = createHmac("sha256", secret)
              .update("teamagent-media-recovery/key-check/1")
              .digest();
            const dynamic: unknown = db
              .query("SELECT key_check FROM store_metadata WHERE id=1")
              .get();
            if (dynamic === null) {
              const totals = Schema.decodeUnknownSync(Totals)(
                db
                  .query(
                    "SELECT count(*) AS count, coalesce(sum(length(payload)),0) AS bytes FROM receipts",
                  )
                  .get(),
              );
              if (totals.count !== 0)
                throw new MediaHostFailure(
                  "io",
                  "Receipt key metadata is missing; restore the original store before submitting again.",
                );
              db.query("INSERT INTO store_metadata(id,key_check) VALUES (1,?)").run(verifier);
            } else {
              const metadata = Schema.decodeUnknownSync(
                Schema.Struct({ key_check: Schema.Uint8Array }),
              )(dynamic);
              if (
                metadata.key_check.byteLength !== verifier.byteLength ||
                !timingSafeEqual(metadata.key_check, verifier)
              )
                throw new MediaHostFailure(
                  "invalid",
                  "The configured recovery key does not match this receipt store.",
                );
            }
            return work(db);
          })
          .immediate();
      } finally {
        db.close();
      }
    } catch (error: unknown) {
      if (error instanceof MediaHostFailure) throw error;
      throw new MediaHostFailure(
        "io",
        "Encrypted media receipt storage failed; no provider operation should be retried automatically.",
      );
    }
  }
  await checkDirectory();
  try {
    const file = await open(path, "wx", 0o600);
    await file.close();
  } catch (error: unknown) {
    if (!(error instanceof Error && "code" in error && error.code === "EEXIST")) throw error;
  }
  if (process.platform !== "win32") {
    await chmod(directory, 0o700);
    await chmod(path, 0o600);
  }
  await transaction(() => undefined);
  const loadFrom = (db: Database, id: string): MediaReceipt => {
    Schema.decodeUnknownSync(Id)(id);
    const row: unknown = db.query("SELECT id,payload FROM receipts WHERE id=?").get(id);
    if (row === null) throw new MediaHostFailure("invalid", "Media receipt was not found.");
    return decrypt(row);
  };
  const save = (db: Database, receipt: MediaReceipt, keyDigest?: string): void => {
    const payload = encrypt(receipt);
    const totals = Schema.decodeUnknownSync(Totals)(
      db
        .query("SELECT count(*) AS count, coalesce(sum(length(payload)),0) AS bytes FROM receipts")
        .get(),
    );
    const old: unknown = db.query("SELECT id,payload FROM receipts WHERE id=?").get(receipt.id);
    const oldBytes = old === null ? 0 : Schema.decodeUnknownSync(Stored)(old).payload.byteLength;
    if (
      (old === null && totals.count >= maximumReceipts) ||
      totals.bytes - oldBytes + payload.byteLength > maxStoreBytes
    )
      throw new MediaHostFailure(
        "limit",
        "Media receipt storage limit reached; preserve or remove old receipts explicitly.",
      );
    if (old === null)
      db.query("INSERT INTO receipts (id,key_digest,payload) VALUES (?,?,?)").run(
        receipt.id,
        keyDigest ?? null,
        payload,
      );
    else db.query("UPDATE receipts SET payload=? WHERE id=?").run(payload, receipt.id);
  };
  const update = (id: string, input: UpdateMediaReceipt): Promise<MediaReceipt> =>
    transaction((db) => {
      const next = Schema.decodeUnknownSync(Update)(input, { onExcessProperty: "error" });
      const current = loadFrom(db, id);
      if (current.state !== next.state && !transitions[current.state].includes(next.state))
        throw new MediaHostFailure(
          "conflict",
          "Receipt state cannot be downgraded or resubmitted.",
        );
      if (
        current.response?.audioUrl != null &&
        next.response !== undefined &&
        next.response.audioUrl !== current.response.audioUrl
      )
        throw new MediaHostFailure(
          "conflict",
          "A completed generation reference cannot be replaced.",
        );
      if (
        current.state === "published" &&
        next.artifact !== undefined &&
        JSON.stringify(current.artifact) !== JSON.stringify(next.artifact)
      )
        throw new MediaHostFailure(
          "conflict",
          "A published artifact cannot be replaced in its receipt.",
        );
      const receipt = Schema.decodeUnknownSync(MediaReceiptSchema)({
        ...current,
        ...next,
        diagnostic:
          next.diagnostic === undefined
            ? current.diagnostic
            : next.diagnostic === null
              ? null
              : sanitizeMediaDiagnostic(next.diagnostic),
        revision: current.revision + 1,
        updatedAt: new Date().toISOString(),
      });
      if (receipt.state === "generated-awaiting-download" && receipt.response?.audioUrl == null)
        throw new MediaHostFailure(
          "invalid",
          "Generated receipt requires a confidential artifact reference.",
        );
      if (receipt.state === "published" && receipt.artifact === null)
        throw new MediaHostFailure("invalid", "Published receipt requires a verified artifact.");
      save(db, receipt);
      return receipt;
    });
  const store: MediaReceiptStore = {
    begin: (input) =>
      transaction((db) => {
        const data = Schema.decodeUnknownSync(Begin)(input, { onExcessProperty: "error" });
        if (data.idempotencyKey !== undefined && data.operation !== "clone")
          throw new MediaHostFailure(
            "unsupported",
            "Speech synthesis has no idempotency guarantee.",
          );
        const keyDigest =
          data.idempotencyKey === undefined
            ? undefined
            : createHmac("sha256", secret)
                .update(JSON.stringify([data.backend, data.operation, data.idempotencyKey]))
                .digest("hex");
        if (keyDigest !== undefined) {
          const row: unknown = db
            .query("SELECT id,payload FROM receipts WHERE key_digest=?")
            .get(keyDigest);
          if (row !== null) {
            const receipt = decrypt(row);
            if (receipt.requestDigest !== data.requestDigest)
              throw new MediaHostFailure(
                "conflict",
                "The idempotency key is already bound to a different request.",
              );
            return { created: false, receipt };
          }
        }
        // The encrypted bounded scan also protects earlier records without a fingerprint index.
        // An explicit new destination permits another completed synthesis, never an uncertain one.
        const dynamic: unknown = db
          .query("SELECT id,payload FROM receipts ORDER BY rowid DESC LIMIT ?")
          .all(maximumReceipts);
        const rows = Schema.decodeUnknownSync(Schema.Array(Stored).check(Schema.isMaxLength(1024)))(
          dynamic,
        );
        for (const row of rows) {
          const prior = decrypt(row);
          if (
            prior.backend !== data.backend ||
            prior.operation !== data.operation ||
            prior.model !== data.model ||
            prior.requestDigest !== data.requestDigest ||
            prior.state === "rejected"
          )
            continue;
          const deliberateCandidate =
            prior.operation === "synthesize" &&
            prior.state === "published" &&
            data.newCandidate === true &&
            data.output !== undefined &&
            data.output !== prior.output;
          if (!deliberateCandidate) return { created: false, receipt: prior };
        }
        const now = new Date().toISOString();
        const receipt: MediaReceipt = {
          version: 1,
          id: randomUUID(),
          backend: data.backend,
          operation: data.operation,
          model: data.model,
          requestDigest: data.requestDigest,
          idempotencyKey: data.idempotencyKey ?? null,
          state: "submitting",
          revision: 0,
          createdAt: now,
          updatedAt: now,
          output: data.output ?? null,
          sourceSha256: data.sourceSha256 ?? null,
          referenceSha256: data.referenceSha256 ?? null,
          withTimestamps: data.withTimestamps ?? false,
          trainingDecision: data.trainingDecision ?? null,
          voiceAuthorization: data.voiceAuthorization ?? null,
          requestId: null,
          voiceId: null,
          diagnostic: null,
          response: null,
          artifact: null,
        };
        save(db, receipt, keyDigest);
        return { created: true, receipt };
      }),
    update,
    captureResponse: async (id, response) => {
      await store.load(id);
      if (response.status < 200 || response.status >= 300)
        return store.fail(id, new MediaHttpFailure(classifyMediaHttp(response)));
      const parsed = projection(response);
      return update(id, {
        state: parsed.value.audioUrl === null ? "accepted" : "generated-awaiting-download",
        response: parsed.value,
        requestId: safeProviderId(response.requestId),
        voiceId: parsed.value.voiceId,
        diagnostic: parsed.malformed
          ? malformedDiagnostic(response)
          : { ...classifyMediaHttp(response), category: "unknown", retryable: false },
      });
    },
    fail: async (id, error) => {
      const found = await store.load(id);
      if (error instanceof MediaPolicyFailure) {
        const unsent = found.state === "submitting" || found.state === "uncertain";
        return update(id, {
          state: unsent ? "rejected" : found.state,
          diagnostic: unsent ? null : found.diagnostic,
        });
      }
      const diagnostic =
        error instanceof MediaHttpFailure
          ? error.diagnostic
          : {
              ...malformedDiagnostic(),
              status: found.diagnostic?.status ?? null,
              requestId: found.diagnostic?.requestId ?? found.requestId,
              contentType: found.diagnostic?.contentType ?? null,
              bodyTruncated: found.diagnostic?.bodyTruncated ?? false,
            };
      const completed =
        found.state === "generated-awaiting-download" ||
        found.state === "published" ||
        found.state === "accepted" ||
        found.state === "pending" ||
        found.state === "rejected";
      const rejected =
        diagnostic.status !== null &&
        diagnostic.status >= 400 &&
        diagnostic.status < 500 &&
        diagnostic.status !== 408;
      return update(id, {
        state: completed ? found.state : rejected ? "rejected" : "uncertain",
        diagnostic,
        requestId:
          found.response !== null ? found.requestId : (found.requestId ?? diagnostic.requestId),
      });
    },
    load: (id) => transaction((db) => loadFrom(db, id)),
    public: async (id) => publicMediaReceipt(await store.load(id)),
    list: () =>
      transaction((db) => {
        const rows: unknown = db
          .query("SELECT id,payload FROM receipts ORDER BY rowid DESC LIMIT ?")
          .all(maximumReceipts);
        return Schema.decodeUnknownSync(Schema.Array(Stored).check(Schema.isMaxLength(1024)))(
          rows,
        ).map((row) => publicMediaReceipt(decrypt(row)));
      }),
  };
  return store;
}
