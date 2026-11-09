/** Bounded cooperative result storage. No task execution, output restoration or evidence pruning. */
import { randomUUID } from "node:crypto";
import { lstat, mkdir, open, opendir, unlink } from "node:fs/promises";
import { dirname } from "node:path";
import { Schema } from "effect";
import {
  atomicJson,
  boundedRead,
  cacheLimits,
  digest,
  encodedDigest,
  hasCode,
  safePath,
  withCacheLock,
} from "./cache-io.ts";
import { SharedOwnershipRefreshRequired, type SharedResultOwner } from "./shared-result-owner.ts";

export const sharedResultDirectory = ".cache/verification-results/v1";
export const sharedResultLimits = Object.freeze({
  keys: 1024,
  attempts: 8192,
  metadataBytes: 2048,
});
const Hash = Schema.String.check(Schema.isPattern(/^[a-f0-9]{64}$/u));
const Token = Schema.String.check(
  Schema.isPattern(/^[a-f0-9]{8}(?:-[a-f0-9]{4}){3}-[a-f0-9]{12}$/u),
);
const Epoch = Schema.Int.check(
  Schema.isGreaterThan(0),
  Schema.isLessThanOrEqualTo(Number.MAX_SAFE_INTEGER),
);
const Identity = { version: Schema.Literal(1), repository: Hash, key: Hash };
const Attempt = Schema.Struct({
  ...Identity,
  epoch: Epoch,
  token: Token,
  kind: Schema.Literals(["run", "invalidate"]),
});
export type SharedAttempt = typeof Attempt.Type;
const Head = Schema.Struct({
  ...Identity,
  epoch: Epoch,
  token: Token,
  state: Schema.Literals(["running", "passed", "failed"]),
  receipt: Schema.NullOr(Hash),
});
type Head = typeof Head.Type;
const Outcome = Schema.Struct({
  ...Identity,
  epoch: Epoch,
  token: Token,
  state: Schema.Literals(["passed", "failed"]),
  receipt: Schema.NullOr(Hash),
});
const Pending = Schema.Struct({ ...Identity, token: Token });
const Unavailable = Schema.Struct({
  version: Schema.Literal(1),
  repository: Hash,
  reason: Schema.Literal("capacity"),
  keys: Schema.Literal(1024),
  attempts: Schema.Literal(8192),
});
const unavailablePath = `${sharedResultDirectory}/capacity-unavailable.json`;
const Reservation = Schema.Struct({
  version: Schema.Literal(1),
  repository: Hash,
  token: Token,
  generation: Schema.Int.check(Schema.isGreaterThanOrEqualTo(0), Schema.isLessThanOrEqualTo(8192)),
  keys: Schema.Int.check(Schema.isGreaterThanOrEqualTo(0), Schema.isLessThanOrEqualTo(1024)),
  attempts: Schema.Int.check(Schema.isGreaterThanOrEqualTo(0), Schema.isLessThanOrEqualTo(8192)),
});
type Reservation = typeof Reservation.Type;
const reservationPath = sharedResultDirectory + "/reservations.json";
const reservationPendingPath = sharedResultDirectory + "/reservations-pending.json";
const ReservationPending = Schema.Struct({
  version: Schema.Literal(1),
  repository: Hash,
  token: Token,
});
type AdmissionSnapshot = {
  readonly reservation: Reservation | undefined;
  readonly unavailable: boolean;
};
/** Trusted fixture observation only, never configuration; all callbacks run outside locks. */
export type SharedAdmissionObserver = (
  phase: "inventory" | "inventory-complete",
  attempt: number,
) => void | Promise<void>;
class ChangedAdmission extends Error {}
export interface SharedSnapshot {
  readonly stamp: string;
  readonly blocked: boolean;
  readonly bytes?: Uint8Array;
  readonly unavailable?: "capacity";
}
const text = (bytes: Uint8Array): string => {
  const value = new TextDecoder("utf-8", { fatal: true }).decode(bytes);
  if (value.includes("\r") || value.includes("\0"))
    throw new Error("Shared verification evidence must be LF text");
  return value;
};
const encode = (value: unknown): Uint8Array =>
  new TextEncoder().encode(`${JSON.stringify(value)}\n`);
const keyPath = (key: string): string =>
  `${sharedResultDirectory}/${Schema.decodeUnknownSync(Hash)(key)}`;
const startPath = (key: string, token: string): string =>
  `${keyPath(key)}/${Schema.decodeUnknownSync(Token)(token)}.start.json`;
const outcomePath = (key: string, token: string): string =>
  `${keyPath(key)}/${Schema.decodeUnknownSync(Token)(token)}.outcome.json`;

function increment(epoch: number): number {
  if (!Number.isSafeInteger(epoch) || epoch < 0 || epoch >= Number.MAX_SAFE_INTEGER)
    throw new Error(
      "Shared verification generation exhausted; explicit evidence recovery required",
    );
  return epoch + 1;
}
function identity(owner: SharedResultOwner, key: string) {
  return {
    version: 1 as const,
    repository: Schema.decodeUnknownSync(Hash)(owner.repository),
    key: Schema.decodeUnknownSync(Hash)(key),
  };
}
async function exists(owner: SharedResultOwner, path: string): Promise<boolean> {
  try {
    await lstat(await safePath(owner.primary, path));
    return true;
  } catch (error) {
    if (hasCode(error, "ENOENT")) return false;
    throw error;
  }
}
async function readHead(owner: SharedResultOwner, key: string): Promise<Head | undefined> {
  if (await exists(owner, `${keyPath(key)}/pending.json`))
    throw new Error("Shared verification metadata publication is unconfirmed; preserve evidence");
  const path = `${keyPath(key)}/head.json`;
  if (!(await exists(owner, path))) {
    if (await exists(owner, keyPath(key)))
      throw new Error("Shared verification directory has no confirmed head");
    return undefined;
  }
  const head = Schema.decodeUnknownSync(Schema.fromJsonString(Head), { onExcessProperty: "error" })(
    text(await boundedRead(owner.primary, path, sharedResultLimits.metadataBytes)),
  );
  if (
    head.repository !== owner.repository ||
    head.key !== key ||
    (head.state === "passed") !== (head.receipt !== null)
  )
    throw new Error("Shared verification head identity is invalid");
  const attempt = await readAttempt(owner, head.key, head.token);
  if (attempt.epoch > head.epoch || (head.state !== "failed" && attempt.epoch !== head.epoch))
    throw new Error("Shared verification head generation differs from its start");
  if (head.state === "passed" && attempt.kind !== "run")
    throw new Error("Shared verification success requires an executed check attempt");
  if (head.state === "running") {
    if (attempt.kind !== "run" || (await exists(owner, outcomePath(key, head.token))))
      throw new Error("Shared verification running state has inconsistent terminal evidence");
  } else {
    const outcome = Schema.decodeUnknownSync(Schema.fromJsonString(Outcome), {
      onExcessProperty: "error",
    })(
      text(
        await boundedRead(
          owner.primary,
          outcomePath(key, head.token),
          sharedResultLimits.metadataBytes,
        ),
      ),
    );
    if (
      outcome.repository !== head.repository ||
      outcome.key !== key ||
      outcome.token !== head.token ||
      outcome.epoch !== attempt.epoch ||
      outcome.state !== head.state ||
      outcome.receipt !== head.receipt
    )
      throw new Error("Shared verification terminal evidence differs from its head");
  }
  return head;
}
async function readAttempt(
  owner: SharedResultOwner,
  key: string,
  token: string,
): Promise<SharedAttempt> {
  const attempt = Schema.decodeUnknownSync(Schema.fromJsonString(Attempt), {
    onExcessProperty: "error",
  })(
    text(await boundedRead(owner.primary, startPath(key, token), sharedResultLimits.metadataBytes)),
  );
  if (attempt.repository !== owner.repository || attempt.key !== key || attempt.token !== token)
    throw new Error("Shared verification attempt identity differs");
  return attempt;
}
async function unavailable(owner: SharedResultOwner): Promise<boolean> {
  if (!(await exists(owner, unavailablePath))) return false;
  const value = Schema.decodeUnknownSync(Schema.fromJsonString(Unavailable), {
    onExcessProperty: "error",
  })(text(await boundedRead(owner.primary, unavailablePath, sharedResultLimits.metadataBytes)));
  if (value.repository !== owner.repository)
    throw new Error("Shared verification capacity marker belongs to another repository");
  return true;
}
async function immutable(
  owner: SharedResultOwner,
  path: string,
  bytes: Uint8Array,
  maximum: number,
  duplicate = false,
): Promise<void> {
  if (bytes.length > maximum) throw new Error("Shared verification evidence exceeds byte bounds");
  text(bytes);
  const destination = await safePath(owner.primary, path, true);
  await mkdir(dirname(destination), { recursive: true });
  await safePath(owner.primary, path, true);
  try {
    const handle = await open(destination, "wx", 0o600);
    try {
      await handle.writeFile(bytes);
      await handle.sync();
    } finally {
      await handle.close();
    }
  } catch (error) {
    if (
      !duplicate ||
      !hasCode(error, "EEXIST") ||
      digest(await boundedRead(owner.primary, path, maximum)) !== digest(bytes)
    )
      throw error;
  }
}
async function transaction<T>(
  owner: SharedResultOwner,
  key: string,
  run: () => Promise<T>,
): Promise<T> {
  const path = `${keyPath(key)}/pending.json`;
  const pending = Schema.decodeUnknownSync(Pending)({
    ...identity(owner, key),
    token: randomUUID(),
  });
  const bytes = encode(pending);
  await immutable(owner, path, bytes, sharedResultLimits.metadataBytes);
  // Intentionally retained on every exception, including failed cleanup. A later run cannot
  // interpret an orphan outcome or partially written head as a confirmed transition.
  const result = await run();
  if (
    digest(await boundedRead(owner.primary, path, sharedResultLimits.metadataBytes)) !==
    digest(bytes)
  )
    throw new Error("Shared verification transaction ownership changed");
  await unlink(await safePath(owner.primary, path));
  return result;
}
async function freshOwnership(owner: SharedResultOwner): Promise<void> {
  try {
    await owner.validate();
  } catch (error) {
    if (!(error instanceof SharedOwnershipRefreshRequired)) throw error;
    await owner.refresh();
  }
}
async function locked<T>(
  owner: SharedResultOwner,
  key: string,
  run: (account: AdmissionSnapshot) => Promise<T>,
): Promise<T> {
  for (let attempt = 0; attempt < 3; attempt++) {
    await freshOwnership(owner);
    const result = await withCacheLock(
      owner.primary,
      "shared-result-" + Schema.decodeUnknownSync(Hash)(key),
      async () => {
        // Only this pre-mutation validation can request an outside-lock retry.
        // An exception from run() never replays a partially executed transition.
        try {
          await owner.validate();
        } catch (error) {
          if (error instanceof SharedOwnershipRefreshRequired) return { changed: true as const };
          throw error;
        }
        return { changed: false as const, value: await run(await currentReservation(owner)) };
      },
    );
    if (!result.changed) return result.value;
    await owner.refresh();
  }
  throw new Error("Shared verification ownership snapshot did not stabilize");
}

/** Read only while holding the short admission lock; no inventory or native process here. */
async function readReservation(owner: SharedResultOwner): Promise<Reservation | undefined> {
  if (await exists(owner, reservationPendingPath))
    throw new Error("Shared verification reservation publication is unconfirmed");
  if (!(await exists(owner, reservationPath))) {
    if (await exists(owner, sharedResultDirectory))
      throw new Error("Shared verification namespace has no confirmed reservation account");
    return undefined;
  }
  const reservation = Schema.decodeUnknownSync(Schema.fromJsonString(Reservation), {
    onExcessProperty: "error",
  })(text(await boundedRead(owner.primary, reservationPath, sharedResultLimits.metadataBytes)));
  if (
    reservation.repository !== owner.repository ||
    reservation.generation !== reservation.attempts ||
    reservation.keys > reservation.attempts
  )
    throw new Error("Shared verification reservation identity or counts differ");
  return reservation;
}
const currentReservation = (owner: SharedResultOwner): Promise<AdmissionSnapshot> =>
  withCacheLock(owner.primary, "shared-result-admission", async () => ({
    reservation: await readReservation(owner),
    unavailable: await unavailable(owner),
  }));

async function publishReservation(owner: SharedResultOwner, next: Reservation): Promise<void> {
  const marker = encode(
    Schema.decodeUnknownSync(ReservationPending)({
      version: 1,
      repository: owner.repository,
      token: randomUUID(),
    }),
  );
  await immutable(owner, reservationPendingPath, marker, sharedResultLimits.metadataBytes);
  // Reservations are never decremented. If a later key write fails, its reserved
  // slot remains occupied; no cleanup guesses whether capacity can be reclaimed.
  await atomicJson(owner.primary, reservationPath, next);
  const actual = Schema.decodeUnknownSync(Schema.fromJsonString(Reservation), {
    onExcessProperty: "error",
  })(text(await boundedRead(owner.primary, reservationPath, sharedResultLimits.metadataBytes)));
  if (
    encodedDigest(actual) !== encodedDigest(next) ||
    digest(
      await boundedRead(owner.primary, reservationPendingPath, sharedResultLimits.metadataBytes),
    ) !== digest(marker)
  )
    throw new Error("Shared verification reservation publication changed");
  await unlink(await safePath(owner.primary, reservationPendingPath));
}

/** Full inventory is outside every lock; reservation generation is checked again under admission. */
async function admissionSnapshot(
  owner: SharedResultOwner,
  observe: SharedAdmissionObserver | undefined,
  attempt: number,
): Promise<AdmissionSnapshot> {
  await freshOwnership(owner);
  const initial = await currentReservation(owner),
    before = initial.reservation;
  if (initial.unavailable) return initial;
  await observe?.("inventory", attempt);
  let keys = 0,
    starts = 0,
    files = 0,
    bytes = 0;
  if (before !== undefined) {
    const directories = await opendir(await safePath(owner.primary, sharedResultDirectory));
    for await (const entry of directories) {
      const global =
        entry.name === "reservations.json" ||
        entry.name === "reservations-pending.json" ||
        entry.name === "capacity-unavailable.json" ||
        /^reservations\.json\.[a-f0-9-]{36}\.tmp$/u.test(entry.name);
      if (global) {
        if (++files > cacheLimits.files)
          throw new Error("Shared verification inventory exceeds aggregate bounds");
        try {
          const stat = await lstat(
            await safePath(owner.primary, sharedResultDirectory + "/" + entry.name),
          );
          if (
            !stat.isFile() ||
            stat.isSymbolicLink() ||
            stat.nlink !== 1 ||
            stat.size > sharedResultLimits.metadataBytes
          )
            throw new Error("Shared verification reservation metadata exceeds bounds");
          bytes += stat.size;
          if (bytes > cacheLimits.totalBytes)
            throw new Error("Shared verification inventory exceeds aggregate bounds");
        } catch (error) {
          if (
            !hasCode(error, "ENOENT") ||
            (entry.name !== "reservations-pending.json" && !entry.name.endsWith(".tmp"))
          )
            throw error;
        }
        continue;
      }
      if (
        !entry.isDirectory() ||
        !/^[a-f0-9]{64}$/u.test(entry.name) ||
        ++keys > sharedResultLimits.keys
      )
        throw new Error("Shared verification key inventory is invalid or full");
      const directory = await opendir(
        await safePath(owner.primary, sharedResultDirectory + "/" + entry.name),
      );
      for await (const file of directory) {
        const receipt = file.name === "receipt.json";
        const start = /^[a-f0-9-]{36}\.start\.json$/u.test(file.name);
        const temporary = /^head\.json\.[a-f0-9-]{36}\.tmp$/u.test(file.name);
        if (
          !file.isFile() ||
          (!receipt &&
            !start &&
            !temporary &&
            file.name !== "head.json" &&
            file.name !== "pending.json" &&
            !/^[a-f0-9-]{36}\.outcome\.json$/u.test(file.name))
        )
          throw new Error("Unsupported shared verification evidence; preserve it for inspection");
        let stat;
        try {
          stat = await lstat(
            await safePath(
              owner.primary,
              sharedResultDirectory + "/" + entry.name + "/" + file.name,
            ),
          );
        } catch (error) {
          if ((temporary || file.name === "pending.json") && hasCode(error, "ENOENT")) continue;
          throw error;
        }
        if (
          !stat.isFile() ||
          stat.isSymbolicLink() ||
          stat.nlink !== 1 ||
          stat.size > (receipt ? cacheLimits.receiptBytes : sharedResultLimits.metadataBytes)
        )
          throw new Error("Shared verification inventory exceeds per-file bounds");
        bytes += stat.size;
        if (++files > cacheLimits.files || bytes > cacheLimits.totalBytes)
          throw new Error("Shared verification inventory exceeds aggregate bounds");
        if (start && ++starts > sharedResultLimits.attempts)
          throw new Error("Shared verification attempt inventory is full");
      }
    }
  }
  await observe?.("inventory-complete", attempt);
  const after = await currentReservation(owner);
  if (encodedDigest(before ?? null) !== encodedDigest(after.reservation ?? null))
    throw new ChangedAdmission();
  if (keys > (after.reservation?.keys ?? 0) || starts > (after.reservation?.attempts ?? 0))
    throw new Error("Shared verification evidence exceeds its reserved capacity");
  return after;
}

async function reserve(
  owner: SharedResultOwner,
  snapshot: AdmissionSnapshot,
  newKey: boolean,
): Promise<"reserved" | "changed" | "unavailable"> {
  return withCacheLock(owner.primary, "shared-result-admission", async () => {
    const current = await readReservation(owner);
    if (encodedDigest(current ?? null) !== encodedDigest(snapshot.reservation ?? null))
      return "changed";
    if (await unavailable(owner)) return "unavailable";
    const keys = current?.keys ?? 0,
      attempts = current?.attempts ?? 0;
    if (attempts >= sharedResultLimits.attempts || (newKey && keys >= sharedResultLimits.keys)) {
      await immutable(
        owner,
        unavailablePath,
        encode({
          version: 1,
          repository: owner.repository,
          reason: "capacity",
          keys: sharedResultLimits.keys,
          attempts: sharedResultLimits.attempts,
        }),
        sharedResultLimits.metadataBytes,
      );
      return "unavailable";
    }
    await publishReservation(owner, {
      version: 1,
      repository: owner.repository,
      token: randomUUID(),
      generation: attempts + 1,
      keys: keys + (newKey ? 1 : 0),
      attempts: attempts + 1,
    });
    return "reserved";
  });
}

export async function inspectSharedResult(
  owner: SharedResultOwner,
  key: string,
): Promise<SharedSnapshot> {
  return locked(owner, key, async (account) => {
    const head = await readHead(owner, key);
    let bytes: Uint8Array | undefined;
    if (head?.state === "passed") {
      bytes = await boundedRead(
        owner.primary,
        `${keyPath(key)}/receipt.json`,
        cacheLimits.receiptBytes,
      );
      text(bytes);
      if (digest(bytes) !== head.receipt)
        throw new Error("Shared verification receipt integrity failed");
    }
    if (account.unavailable)
      return {
        stamp: `capacity:${encodedDigest(head ?? null)}`,
        blocked: true,
        unavailable: "capacity",
      };
    if (head === undefined) return { stamp: "absent", blocked: false };
    const stamp = encodedDigest(head);
    if (head.state !== "passed") return { stamp, blocked: true };
    if (bytes === undefined) throw new Error("Shared verification passed head has no receipt");
    return { stamp, blocked: false, bytes };
  });
}

// Order only this process's admission transitions for one physical repository.
// Other processes retain the existing snapshot checks and three-attempt bound.
export const sharedAdmissionQueueLimit = 64;
type AdmissionQueue = { tail: Promise<void>; pending: number };
const admissionQueues = new Map<string, AdmissionQueue>();
let pendingAdmissions = 0;

async function start(
  owner: SharedResultOwner,
  key: string,
  kind: SharedAttempt["kind"],
  observe?: SharedAdmissionObserver,
): Promise<SharedAttempt | undefined> {
  const repository = Schema.decodeUnknownSync(Hash)(owner.repository);
  if (pendingAdmissions >= sharedAdmissionQueueLimit)
    throw new Error("Shared verification admission queue exceeds its bound");
  const queue = admissionQueues.get(repository) ?? { tail: Promise.resolve(), pending: 0 };
  admissionQueues.set(repository, queue);
  queue.pending++;
  pendingAdmissions++;
  const operation = queue.tail.then(() => startAdmission(owner, key, kind, observe));
  // Attach both settlement paths immediately; no rejected tail can strand a waiter.
  queue.tail = operation.then(
    () => {},
    () => {},
  );
  try {
    return await operation;
  } finally {
    queue.pending--;
    pendingAdmissions--;
    if (queue.pending === 0) admissionQueues.delete(repository);
  }
}

async function startAdmission(
  owner: SharedResultOwner,
  key: string,
  kind: SharedAttempt["kind"],
  observe?: SharedAdmissionObserver,
): Promise<SharedAttempt | undefined> {
  // Three snapshot attempts, each entirely outside locks. No lock deadline grows.
  for (let retry = 0; retry < 3; retry++) {
    let snapshot: AdmissionSnapshot;
    try {
      snapshot = await admissionSnapshot(owner, observe, retry);
    } catch (error) {
      if (error instanceof ChangedAdmission && retry < 2) continue;
      throw error;
    }
    const result = await locked(owner, key, async () => {
      const current = await readHead(owner, key);
      const epoch = increment(current?.epoch ?? 0);
      // Always key -> admission. Never hold admission while waiting for a key,
      // scanning the store or discovering Git/registry ownership.
      const reserved = await reserve(owner, snapshot, current === undefined);
      if (reserved !== "reserved") return { state: reserved };
      const attempt: SharedAttempt = { ...identity(owner, key), epoch, token: randomUUID(), kind };
      await transaction(owner, key, async () => {
        await immutable(
          owner,
          startPath(key, attempt.token),
          encode(attempt),
          sharedResultLimits.metadataBytes,
        );
        if (kind === "invalidate")
          await immutable(
            owner,
            outcomePath(key, attempt.token),
            encode({
              ...identity(owner, key),
              epoch: attempt.epoch,
              token: attempt.token,
              state: "failed",
              receipt: null,
            }),
            sharedResultLimits.metadataBytes,
          );
        await atomicJson(owner.primary, keyPath(key) + "/head.json", {
          ...identity(owner, key),
          epoch: attempt.epoch,
          token: attempt.token,
          state: kind === "run" ? "running" : "failed",
          receipt: null,
        });
      });
      return { state: "started" as const, attempt };
    });
    if (result.state === "changed") continue;
    if (result.state === "unavailable") return undefined;
    if ("attempt" in result) return result.attempt;
    throw new Error("Invalid shared verification admission result");
  }
  throw new Error("Shared verification reservation snapshot did not stabilize");
}
export const beginSharedResult = (
  owner: SharedResultOwner,
  key: string,
  observe?: SharedAdmissionObserver,
): Promise<SharedAttempt | undefined> => start(owner, key, "run", observe);
export async function invalidateSharedResult(owner: SharedResultOwner, key: string): Promise<void> {
  await start(owner, key, "invalidate");
}

async function finish(
  owner: SharedResultOwner,
  supplied: SharedAttempt,
  bytes?: Uint8Array,
): Promise<boolean> {
  const attempt = Schema.decodeUnknownSync(Attempt, { onExcessProperty: "error" })(supplied);
  return locked(owner, attempt.key, async () => {
    const original = await readAttempt(owner, attempt.key, attempt.token);
    if (encodedDigest(original) !== encodedDigest(attempt) || attempt.kind !== "run")
      throw new Error("Shared verification completion does not match its start");
    if (await exists(owner, outcomePath(attempt.key, attempt.token)))
      throw new Error("Shared verification attempt already has a terminal outcome");
    const head = await readHead(owner, attempt.key);
    if (head === undefined || head.epoch < attempt.epoch)
      throw new Error("Shared verification start has no valid head");
    const passed = bytes !== undefined;
    const publish =
      passed &&
      head.epoch === attempt.epoch &&
      head.token === attempt.token &&
      head.state === "running";
    const nextEpoch = passed ? head.epoch : increment(head.epoch);
    const receipt = bytes === undefined ? null : digest(bytes);
    await transaction(owner, attempt.key, async () => {
      if (bytes !== undefined)
        await immutable(
          owner,
          `${keyPath(attempt.key)}/receipt.json`,
          bytes,
          cacheLimits.receiptBytes,
          true,
        );
      await immutable(
        owner,
        outcomePath(attempt.key, attempt.token),
        encode({
          ...identity(owner, attempt.key),
          epoch: attempt.epoch,
          token: attempt.token,
          state: passed ? "passed" : "failed",
          receipt,
        }),
        sharedResultLimits.metadataBytes,
      );
      if (publish || !passed)
        await atomicJson(owner.primary, `${keyPath(attempt.key)}/head.json`, {
          ...identity(owner, attempt.key),
          epoch: nextEpoch,
          token: attempt.token,
          state: passed ? "passed" : "failed",
          receipt,
        });
    });
    return publish;
  });
}
export const completeSharedResult = (
  owner: SharedResultOwner,
  attempt: SharedAttempt,
  bytes: Uint8Array,
): Promise<boolean> => finish(owner, attempt, bytes);
export async function failSharedResult(
  owner: SharedResultOwner,
  attempt: SharedAttempt,
): Promise<void> {
  await finish(owner, attempt);
}
