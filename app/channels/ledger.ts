import { Database } from "bun:sqlite";
import { createHash, randomUUID } from "node:crypto";
import { lstat, mkdir, realpath } from "node:fs/promises";
import { dirname, join, resolve } from "node:path";
import { Effect, Schema } from "effect";
import {
  ChannelError,
  ChannelReceiptSchema,
  type ChannelBinding,
  type ChannelEnvelope,
  type ChannelLedger,
  type ChannelTurn,
} from "@/channels";

const StoredRow = Schema.Struct({
  fingerprint: Schema.String,
  status: Schema.Literals(["processing", "complete", "failed"]),
  result: Schema.NullOr(Schema.String.check(Schema.isMaxLength(1_048_576))),
});
const CountRow = Schema.Struct({ count: Schema.Int });
const hash = (value: string): string => createHash("sha256").update(value).digest("hex");
const key = (binding: ChannelBinding, messageId: string): string =>
  hash(
    JSON.stringify([
      binding.channel,
      binding.account,
      binding.conversation,
      binding.principal,
      messageId,
    ]),
  );
const boundary = <A>(body: () => A): Effect.Effect<A, ChannelError> =>
  Effect.try({
    try: body,
    catch: (error) =>
      error instanceof ChannelError
        ? error
        : new ChannelError({
            code: "storage",
            message: "Channel receipt storage could not complete the operation.",
          }),
  });
export const openChannelLedger = Effect.fnUntraced(function* (
  directory: string,
  binding: ChannelBinding,
) {
  const database = yield* Effect.tryPromise({
    try: async () => {
      const data = resolve(directory);
      await mkdir(data, { recursive: true, mode: 0o700 });
      if ((await lstat(data)).isSymbolicLink() || (await realpath(data)) !== data)
        throw new Error("linked data directory");
      const path = join(data, "channels.sqlite");
      for (const suffix of ["", "-wal", "-shm", "-journal"]) {
        try {
          const info = await lstat(path + suffix);
          if (!info.isFile() || info.isSymbolicLink() || info.size > 268_435_456)
            throw new Error("invalid receipt file");
        } catch (error) {
          if (!(error instanceof Error) || !("code" in error) || error.code !== "ENOENT")
            throw error;
        }
      }
      if ((await realpath(dirname(path))) !== data) throw new Error("changed data directory");
      const db = new Database(path, { create: true, strict: true });
      try {
        db.exec(
          "PRAGMA busy_timeout = 5000; PRAGMA max_page_count = 65536; PRAGMA journal_mode = WAL; CREATE TABLE IF NOT EXISTS channel_receipts (key TEXT PRIMARY KEY, fingerprint TEXT NOT NULL, status TEXT NOT NULL, token TEXT NOT NULL UNIQUE, result TEXT)",
        );
        return db;
      } catch (error) {
        db.close();
        throw error;
      }
    },
    catch: () =>
      new ChannelError({
        code: "storage",
        message: "Cannot open the bounded local channel receipt store.",
      }),
  });
  const ledger: ChannelLedger = {
    claim: (envelope: ChannelEnvelope) =>
      boundary(() =>
        database
          .transaction(() => {
            const identity = key(binding, envelope.messageId);
            const fingerprint = hash(
              JSON.stringify([
                envelope.version,
                envelope.channel,
                envelope.account,
                envelope.conversation,
                envelope.sender,
                envelope.messageId,
                envelope.text ?? null,
                envelope.attachments.map((item) => [
                  item.id,
                  item.kind,
                  item.locator,
                  item.sha256 ?? null,
                ]),
                binding.authentication,
              ]),
            );
            const found: unknown = database
              .query("SELECT fingerprint, status, result FROM channel_receipts WHERE key=?")
              .get(identity);
            if (found !== null) {
              const row = Schema.decodeUnknownSync(StoredRow)(found);
              if (row.fingerprint !== fingerprint)
                throw new ChannelError({
                  code: "conflict",
                  message:
                    "This channel message ID already identifies different content or authentication.",
                });
              if (row.status === "complete" && row.result !== null)
                return {
                  status: "complete" as const,
                  result: Schema.decodeUnknownSync(Schema.fromJsonString(Schema.Unknown))(
                    row.result,
                  ),
                };
              throw new ChannelError({
                code: row.status === "processing" ? "busy" : "conflict",
                message:
                  row.status === "processing"
                    ? "This delivery is processing or was interrupted. Reconcile its receipt before resubmission."
                    : "This delivery previously failed. Inspect its receipt before intentionally using a new message ID.",
              });
            }
            const count = Schema.decodeUnknownSync(CountRow)(
              database.query("SELECT COUNT(*) AS count FROM channel_receipts").get(),
            );
            if (count.count >= 10_000)
              throw new ChannelError({
                code: "capacity",
                message: "The channel receipt store is full.",
              });
            const token = randomUUID();
            database
              .query(
                "INSERT INTO channel_receipts (key,fingerprint,status,token,result) VALUES (?,?,'processing',?,NULL)",
              )
              .run(identity, fingerprint, token);
            return { status: "reserved" as const, token };
          })
          .immediate(),
      ),
    complete: (token: string, result: ChannelTurn) =>
      boundary(() => {
        const encoded = JSON.stringify(result);
        if (Buffer.byteLength(encoded) > 1_048_576)
          throw new ChannelError({
            code: "capacity",
            message: "Channel receipt exceeds its byte bound.",
          });
        if (
          database
            .query(
              "UPDATE channel_receipts SET status='complete', result=? WHERE token=? AND status='processing'",
            )
            .run(encoded, token).changes !== 1
        )
          throw new ChannelError({
            code: "conflict",
            message: "Channel receipt ownership changed before completion.",
          });
      }),
    fail: (token: string) =>
      boundary(() => {
        database
          .query(
            "UPDATE channel_receipts SET status='failed' WHERE token=? AND status='processing'",
          )
          .run(token);
      }),
    status: (scope, messageId) =>
      boundary(() => {
        const found: unknown = database
          .query("SELECT fingerprint, status, result FROM channel_receipts WHERE key=?")
          .get(key(scope, messageId));
        if (found === null) return null;
        const row = Schema.decodeUnknownSync(StoredRow)(found);
        return Schema.decodeUnknownSync(ChannelReceiptSchema)({
          status: row.status,
          result:
            row.result === null
              ? null
              : Schema.decodeUnknownSync(Schema.fromJsonString(Schema.Unknown))(row.result),
        });
      }),
  };
  return { ledger, close: () => boundary(() => database.close()) };
});
