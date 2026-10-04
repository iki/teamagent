import { Database } from "bun:sqlite";
import { randomBytes, timingSafeEqual } from "node:crypto";
import { mkdir, open } from "node:fs/promises";
import { join } from "node:path";
import { Schema } from "effect";

const Credential = Schema.String.check(Schema.isPattern(/^[a-f0-9]{64}$/));
const Lock = Schema.Struct({
  pid: Schema.Int.check(Schema.isGreaterThanOrEqualTo(1)),
  nonce: Schema.NonEmptyString,
});
export const readToken = async (data: string): Promise<string> => {
  const file = await open(join(data, "token"), "r");
  try {
    const bytes = Buffer.alloc(128);
    const result = await file.read(bytes, 0, bytes.length, 0);
    if (result.bytesRead > 66) throw new Error("Invalid local pairing token file");
    return Schema.decodeUnknownSync(Credential)(
      new TextDecoder("utf-8", { fatal: true }).decode(bytes.subarray(0, result.bytesRead)).trim(),
    );
  } finally {
    await file.close();
  }
};

export async function ensureToken(data: string, supplied?: string): Promise<string> {
  await mkdir(data, { recursive: true, mode: 0o700 });
  if (supplied !== undefined) return Schema.decodeUnknownSync(Credential)(supplied);
  const token = randomBytes(32).toString("hex");
  try {
    const file = await open(join(data, "token"), "wx", 0o600);
    try {
      await file.writeFile(token, "utf8");
    } finally {
      await file.close();
    }
    return token;
  } catch (error) {
    if (!(error instanceof Error && "code" in error && error.code === "EEXIST")) throw error;
    return readToken(data);
  }
}

export function authorized(header: string | null, token: string): boolean {
  const candidate = Buffer.from(header ?? "");
  const expected = Buffer.from(`Bearer ${token}`);
  return candidate.length === expected.length && timingSafeEqual(candidate, expected);
}

/** SQLite serializes owner comparison and replacement, including dead-process recovery. */
export async function acquireDaemonLock(data: string): Promise<() => Promise<void>> {
  await mkdir(data, { recursive: true, mode: 0o700 });
  const nonce = randomBytes(16).toString("hex");
  const database = new Database(join(data, "daemon.sqlite"), { create: true, strict: true });
  try {
    database.exec(
      "PRAGMA busy_timeout = 5000; CREATE TABLE IF NOT EXISTS owner (singleton INTEGER PRIMARY KEY CHECK(singleton = 1), pid INTEGER NOT NULL, nonce TEXT NOT NULL);",
    );
    database
      .transaction(() => {
        const row: unknown = database
          .query("SELECT pid,nonce FROM owner WHERE singleton = 1")
          .get();
        if (row !== null) {
          const current = Schema.decodeUnknownSync(Lock)(row);
          let running = true;
          try {
            process.kill(current.pid, 0);
          } catch (error) {
            if (error instanceof Error && "code" in error && error.code === "ESRCH")
              running = false;
          }
          // Unknown liveness and reused process IDs fail closed.
          if (running) throw new Error("A daemon already owns this data directory");
        }
        database
          .query(
            "INSERT INTO owner(singleton,pid,nonce) VALUES(1,?,?) ON CONFLICT(singleton) DO UPDATE SET pid=excluded.pid,nonce=excluded.nonce",
          )
          .run(process.pid, nonce);
      })
      .immediate();
  } catch (error) {
    database.close();
    throw error;
  }
  let released = false;
  return () => {
    if (released) return Promise.resolve();
    try {
      database
        .transaction(() => {
          const current = Schema.decodeUnknownSync(Lock)(
            database.query("SELECT pid,nonce FROM owner WHERE singleton = 1").get(),
          );
          if (current.nonce !== nonce) throw new Error("Daemon lock ownership changed");
          database.query("DELETE FROM owner WHERE singleton = 1 AND nonce = ?").run(nonce);
        })
        .immediate();
      return Promise.resolve();
    } catch (error) {
      return Promise.reject(error);
    } finally {
      released = true;
      database.close();
    }
  };
}
