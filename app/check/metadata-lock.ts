/** Cooperative metadata ownership; recovering a lock never completes its interrupted action. */
import { createHash, randomUUID } from "node:crypto";
import type { BigIntStats } from "node:fs";
import {
  link,
  lstat,
  mkdir,
  open,
  opendir,
  realpath,
  rename,
  rmdir,
  unlink,
} from "node:fs/promises";
import { hostname } from "node:os";
import { basename, dirname, isAbsolute, join, resolve } from "node:path";
import { Schema } from "effect";

const Owner = Schema.Struct({
  pid: Schema.Int.check(Schema.isGreaterThan(0)),
  hostname: Schema.NonEmptyString.check(Schema.isMaxLength(256)),
  token: Schema.NonEmptyString.check(Schema.isMaxLength(256)),
  startedAt: Schema.optional(Schema.Finite),
});
const ownerBytes = 4096;
const reservationCount = 32;
const evidenceBytes = 1024 * 1024;
const hash = (bytes: string | Uint8Array) => createHash("sha256").update(bytes).digest("hex");
const hasCode = (error: unknown, code: string) =>
  error instanceof Error && "code" in error && error.code === code;
const samePath = (left: string, right: string) =>
  process.platform === "win32"
    ? resolve(left).toLowerCase() === resolve(right).toLowerCase()
    : resolve(left) === resolve(right);
const sameFile = (left: BigIntStats, right: BigIntStats, immutablePublication = false) =>
  left.dev === right.dev &&
  left.ino === right.ino &&
  left.mode === right.mode &&
  left.size === right.size &&
  left.mtimeNs === right.mtimeNs &&
  (immutablePublication || (left.nlink === right.nlink && left.ctimeNs === right.ctimeNs));

/** ESRCH alone establishes absence; a reused PID is conservatively alive. */
export function metadataOwnerAlive(pid: number): boolean | undefined {
  try {
    process.kill(pid, 0);
    return true;
  } catch (error) {
    return hasCode(error, "ESRCH") ? false : undefined;
  }
}

async function physical(path: string, directory: boolean): Promise<BigIntStats> {
  if (!isAbsolute(path) || path.length > 4096 || /[\r\n\0]/u.test(path))
    throw new Error("Metadata lock paths must be bounded absolute physical paths");
  const info = await lstat(path, { bigint: true });
  const rejection = info.isSymbolicLink()
    ? "symbolic-link"
    : (directory ? !info.isDirectory() : !info.isFile())
      ? "unexpected-kind"
      : !samePath(await realpath(path), path)
        ? "canonical-path-mismatch"
        : undefined;
  if (rejection)
    throw new Error(
      `Metadata lock path is redirected or has an unexpected kind: ${rejection}; expected ${directory ? "directory" : "file"}`,
    );
  return info;
}

async function ensureDirectory(path: string): Promise<void> {
  if (!isAbsolute(path) || path.length > 4096)
    throw new Error("Metadata directory must be bounded and absolute");
  const missing: string[] = [];
  let current = path;
  for (;;) {
    try {
      await physical(current, true);
      break;
    } catch (error) {
      if (!hasCode(error, "ENOENT")) throw error;
      if (missing.length >= 64 || dirname(current) === current)
        throw new Error("Metadata directory ancestry exceeds its bound");
      missing.push(current);
      current = dirname(current);
    }
  }
  for (const directory of missing.reverse()) {
    await mkdir(directory).catch((error: unknown) => {
      if (!hasCode(error, "EEXIST")) throw error;
    });
    await physical(directory, true);
  }
}

async function bytes(
  path: string,
  maximum = ownerBytes,
  immutablePublication = false,
): Promise<{ raw: Uint8Array; info: BigIntStats }> {
  const before = await physical(path, false);
  if (before.size > BigInt(maximum))
    throw new Error("Metadata ownership evidence exceeds its byte bound");
  const file = await open(path, "r");
  try {
    const opened = await file.stat({ bigint: true });
    if (!sameFile(before, opened, immutablePublication))
      throw new Error("Metadata ownership changed before reading");
    const buffer = new Uint8Array(maximum + 1);
    let size = 0;
    while (size < buffer.length) {
      const result = await file.read(buffer, size, buffer.length - size, size);
      if (!result.bytesRead) break;
      size += result.bytesRead;
    }
    if (
      size > maximum ||
      BigInt(size) !== before.size ||
      !sameFile(before, await file.stat({ bigint: true }), immutablePublication) ||
      !sameFile(before, await physical(path, false), immutablePublication)
    )
      throw new Error("Metadata ownership changed during reading");
    return { raw: buffer.slice(0, size), info: before };
  } finally {
    await file.close();
  }
}

async function snapshot(path: string, kind: "directory" | "legacy-file") {
  const info = await physical(path, kind === "directory");
  if (kind === "directory") {
    const entries = await opendir(path);
    const names: string[] = [];
    for await (const entry of entries) {
      names.push(entry.name);
      if (names.length > 1) throw new Error("Metadata lock contains unexpected evidence");
    }
    if (names.length !== 1 || names[0] !== "owner.json")
      throw new Error("Metadata lock owner is still unknown");
  }
  const file = await bytes(kind === "directory" ? join(path, "owner.json") : path);
  const text = new TextDecoder("utf-8", { fatal: true, ignoreBOM: true }).decode(file.raw);
  if (!text.endsWith("\n") || /[\r\0\ufeff]/u.test(text))
    throw new Error("Metadata ownership must be complete UTF-8 LF text");
  const input: unknown = JSON.parse(text);
  const owner = Schema.decodeUnknownSync(Owner, { onExcessProperty: "error" })(input);
  if (!Number.isSafeInteger(owner.pid))
    throw new Error("Metadata owner PID exceeds its safe bound");
  return { owner, raw: file.raw, file: file.info, directory: info, digest: hash(file.raw) };
}
type Snapshot = Awaited<ReturnType<typeof snapshot>>;

export type MetadataLockOptions = {
  readonly waitMs?: number;
  readonly legacyFile?: boolean;
  /** Consumer owner protocols require this field; older Teamagent owners legitimately omit it. */
  readonly requireStartedAt?: boolean;
  /** Every caller of one physical lock must select the same ignored, owned evidence root. */
  readonly evidenceRoot?: string;
  /** Conservative fixture/host veto only; it cannot turn a native live result into absence. */
  readonly isAlive?: (pid: number) => boolean | undefined;
  /** Trusted fixture synchronization only; never read from external configuration. */
  readonly observe?: (
    phase:
      | "acquisition-snapshot"
      | "observed-dead"
      | "before-move"
      | "rename-ready"
      | "move-recheck"
      | "move-collision"
      | "moved"
      | "legacy-claimed"
      | "before-unlink",
  ) => void | Promise<void>;
};

function absent(saved: Snapshot, options: MetadataLockOptions): boolean {
  return (
    (!options.requireStartedAt || saved.owner.startedAt !== undefined) &&
    saved.owner.hostname === hostname() &&
    metadataOwnerAlive(saved.owner.pid) === false &&
    (options.isAlive === undefined || options.isAlive(saved.owner.pid) === false)
  );
}

async function unchanged(
  path: string,
  kind: "directory" | "legacy-file",
  saved: Snapshot,
  options: MetadataLockOptions,
): Promise<boolean> {
  const current = await snapshot(path, kind).catch((error: unknown) => {
    if (hasCode(error, "ENOENT")) return undefined;
    throw error;
  });
  if (!current) return false;
  if (
    current.digest !== saved.digest ||
    !sameFile(current.file, saved.file) ||
    (kind === "directory" &&
      (current.directory.dev !== saved.directory.dev ||
        current.directory.ino !== saved.directory.ino))
  )
    return false;
  return absent(current, options);
}
function withinDeadline(deadline: number): void {
  if (performance.now() >= deadline)
    throw new Error("Metadata locked. Inspect ownership evidence; acquisition deadline expired");
}

/** Finite exclusive reservation slots bound even concurrent or interrupted recovery attempts. */
async function reserveEvidence(root: string, key: string): Promise<string> {
  await ensureDirectory(root);
  // Charge a complete attempt before admitting it; exclusive slots also bound
  // concurrently admitted attempts and abandoned partial reservation files.
  let total = ownerBytes * 8,
    files = 8,
    directories = 2;
  const inspect = async (path: string, depth: number): Promise<void> => {
    if (depth > 2 || ++directories > reservationCount * 2 + 1)
      throw new Error("Metadata recovery directory capacity exceeded");
    const entries = await opendir(path);
    for await (const entry of entries) {
      const target = join(path, entry.name);
      const info = await lstat(target);
      if (info.isSymbolicLink()) throw new Error("Linked recovery evidence is unsupported");
      if (info.isDirectory()) {
        if (
          (depth === 0 && !/^[a-f0-9]{64}$/u.test(entry.name)) ||
          (depth === 1 && entry.name !== "lock") ||
          depth === 2
        )
          throw new Error("Unknown recovery evidence directory");
        await inspect(target, depth + 1);
      } else if (info.isFile()) {
        if (
          (depth === 0 && !/^(?:[0-9]|[12][0-9]|3[01])\.reservation\.json$/u.test(entry.name)) ||
          (depth === 1 &&
            !/^(?:original|intent|recovered)\.json$|^pending-[a-f0-9-]{36}$/u.test(entry.name)) ||
          (depth === 2 && entry.name !== "owner.json")
        )
          throw new Error("Unknown recovery evidence file");
        if (
          ++files > reservationCount * 8 ||
          info.size > ownerBytes ||
          (total += info.size) > evidenceBytes
        )
          throw new Error("Metadata recovery evidence capacity exceeded");
      } else throw new Error("Unsupported recovery evidence entry");
    }
  };
  await inspect(root, 0);
  const reservation =
    JSON.stringify({
      version: 1,
      key,
      pid: process.pid,
      hostname: hostname(),
      token: randomUUID(),
    }) + "\n";
  for (let slot = 0; slot < reservationCount; slot++) {
    const path = join(root, `${slot}.reservation.json`);
    let file: Awaited<ReturnType<typeof open>>;
    try {
      file = await open(path, "wx", 0o600);
    } catch (error) {
      if (hasCode(error, "EEXIST")) continue;
      throw error;
    }
    try {
      await file.writeFile(reservation, "utf8");
      await file.sync();
    } finally {
      await file.close();
    }
    if (new TextDecoder().decode((await bytes(path)).raw) !== reservation)
      throw new Error("Metadata recovery reservation changed");
    return root;
  }
  throw new Error(
    "Metadata recovery evidence capacity reached; preserve and inspect existing records",
  );
}

async function immutable(path: string, content: Uint8Array): Promise<void> {
  if (content.byteLength > ownerBytes)
    throw new Error("Metadata recovery record exceeds its bound");
  await physical(dirname(path), true);
  const pending = join(dirname(path), "pending-" + randomUUID());
  const file = await open(pending, "wx", 0o600);
  try {
    await file.writeFile(content);
    await file.sync();
  } finally {
    await file.close();
  }
  try {
    await link(pending, path).catch((error: unknown) => {
      if (!hasCode(error, "EEXIST")) throw error;
    });
    // A publisher removing its private hardlink changes nlink/ctime, not content.
    // Only this exact-known-content admission permits that publication churn;
    // live owner snapshot readers retain every metadata comparison.
    if (hash((await bytes(path, ownerBytes, true)).raw) !== hash(content))
      throw new Error("Existing recovery evidence differs");
  } finally {
    await unlink(pending);
  }
}
const json = (value: unknown) => new TextEncoder().encode(JSON.stringify(value) + "\n");

async function evidence(
  path: string,
  kind: "directory" | "legacy-file",
  saved: Snapshot,
  options: MetadataLockOptions,
): Promise<string> {
  const address = process.platform === "win32" ? resolve(path).toLowerCase() : resolve(path);
  const key = hash(JSON.stringify([address, kind, saved.digest]));
  const root = await reserveEvidence(
    options.evidenceRoot ?? join(dirname(path), ".lock-recovery"),
    key,
  );
  const directory = join(root, key);
  await mkdir(directory).catch((error: unknown) => {
    if (!hasCode(error, "EEXIST")) throw error;
  });
  await physical(directory, true);
  await immutable(join(directory, "original.json"), saved.raw);
  await immutable(
    join(directory, "intent.json"),
    json({ version: 1, lock: address, kind, originalSha256: saved.digest, ownerAbsent: true }),
  );
  return directory;
}

async function recoverDirectory(
  path: string,
  saved: Snapshot,
  options: MetadataLockOptions,
  deadline: number,
): Promise<boolean> {
  if (!absent(saved, options)) return false;
  await options.observe?.("observed-dead");
  const retained = await evidence(path, "directory", saved, options);
  const target = join(retained, "lock");
  await options.observe?.("before-move");
  if (!(await unchanged(path, "directory", saved, options))) return false;
  await physical(retained, true);
  try {
    await options.observe?.("rename-ready");
    withinDeadline(deadline);
    await rename(path, target);
  } catch (error) {
    if (hasCode(error, "ENOENT")) return false;
    // A Windows collision may be EPERM/EACCES. Confirm the exact retained target,
    // never retry moving the source, which may already belong to a new owner.
    if (["EEXIST", "ENOTEMPTY", "EPERM", "EACCES"].some((code) => hasCode(error, code))) {
      let missingSnapshot = false;
      const moved = await snapshot(target, "directory").catch((failure: unknown) => {
        missingSnapshot = hasCode(failure, "ENOENT");
        return undefined;
      });
      if (
        moved?.digest === saved.digest &&
        moved.directory.dev === saved.directory.dev &&
        moved.directory.ino === saved.directory.ino
      ) {
        await options.observe?.("move-collision");
        return false;
      }
      if (missingSnapshot && (hasCode(error, "EPERM") || hasCode(error, "EACCES"))) {
        const missingTarget = async (): Promise<boolean> => {
          try {
            await lstat(target);
            return false;
          } catch (failure) {
            if (hasCode(failure, "ENOENT")) return true;
            throw failure;
          }
        };
        // A competing reader can temporarily prevent a Windows directory move.
        // Only a proven non-move permits a fresh acquisition observation; never
        // retry this rename or suppress an unknown target/source/owner state.
        const unmoved = await (async () => {
          if (!(await missingTarget())) return false;
          await options.observe?.("move-recheck");
          if (!(await unchanged(path, "directory", saved, options))) return false;
          return await missingTarget();
        })().catch(() => false);
        if (unmoved && performance.now() < deadline) return false;
        if (performance.now() < deadline) {
          // Another recoverer can finish between the absent-target observation
          // and source validation. Observe its exact completed move once; this
          // never authorizes retrying the mutation or replacing a new owner.
          const completed = await snapshot(target, "directory").catch(() => undefined);
          if (
            completed?.digest === saved.digest &&
            completed.directory.dev === saved.directory.dev &&
            completed.directory.ino === saved.directory.ino
          ) {
            await options.observe?.("move-collision");
            return false;
          }
        }
      }
    }
    throw error;
  }
  const moved = await snapshot(target, "directory");
  if (
    moved.digest !== saved.digest ||
    moved.directory.dev !== saved.directory.dev ||
    moved.directory.ino !== saved.directory.ino
  )
    throw new Error("Quarantined metadata lock changed; retain all evidence");
  await immutable(
    join(retained, "recovered.json"),
    json({ version: 1, kind: "directory", originalSha256: saved.digest, originalRetained: true }),
  );
  await options.observe?.("moved");
  return true;
}

async function recoverLegacyFile(
  path: string,
  saved: Snapshot,
  options: MetadataLockOptions,
  deadline: number,
): Promise<boolean> {
  if (!absent(saved, options)) return false;
  await options.observe?.("observed-dead");
  return withMetadataLock(
    path + ".recovery-claim",
    async () => {
      await options.observe?.("legacy-claimed");
      const info = await lstat(path).catch((error: unknown) => {
        if (hasCode(error, "ENOENT")) return undefined;
        throw error;
      });
      if (!info || info.isDirectory()) return false;
      if (!(await unchanged(path, "legacy-file", saved, options))) return false;
      const retained = await evidence(path, "legacy-file", saved, options);
      await options.observe?.("before-unlink");
      if (!(await unchanged(path, "legacy-file", saved, options))) return false;
      withinDeadline(deadline);
      await unlink(path);
      // Do not inspect/delete the original path again: a new directory owner may acquire it immediately.
      await immutable(
        join(retained, "recovered.json"),
        json({
          version: 1,
          kind: "legacy-file",
          originalSha256: saved.digest,
          originalRetained: true,
        }),
      );
      return true;
    },
    {
      ...(options.waitMs === undefined ? {} : { waitMs: options.waitMs }),
      ...(options.isAlive === undefined ? {} : { isAlive: options.isAlive }),
      ...(options.requireStartedAt === undefined
        ? {}
        : { requireStartedAt: options.requireStartedAt }),
      ...(options.evidenceRoot === undefined ? {} : { evidenceRoot: options.evidenceRoot }),
      legacyFile: false,
    },
  );
}

/** New owners always acquire a directory; only the cache adapter admits legacy files. */
export async function withMetadataLock<T>(
  path: string,
  run: () => Promise<T>,
  options: MetadataLockOptions = {},
): Promise<T> {
  path = resolve(path);
  const waitMs = options.waitMs ?? 5000;
  if (!Number.isFinite(waitMs) || waitMs < 0) throw new Error("Invalid metadata lock wait bound");
  const deadline = performance.now() + waitMs;
  await ensureDirectory(dirname(path));
  const own = json({
    token: randomUUID(),
    pid: process.pid,
    hostname: hostname(),
    startedAt: Date.now(),
  });
  let attempted = false;
  for (;;) {
    if (attempted) withinDeadline(deadline);
    attempted = true;
    let acquired = false;
    try {
      await mkdir(path);
      acquired = true;
    } catch (error) {
      if (!hasCode(error, "EEXIST")) throw error;
    }
    if (acquired) {
      const file = await open(join(path, "owner.json"), "wx", 0o600);
      try {
        await file.writeFile(own);
        await file.sync();
      } finally {
        await file.close();
      }
      break;
    }
    const info = await lstat(path).catch((error: unknown) => {
      if (hasCode(error, "ENOENT")) return undefined;
      throw error;
    });
    if (!info) continue;
    if (info.isSymbolicLink() || (!info.isDirectory() && !(options.legacyFile && info.isFile())))
      throw new Error("Metadata lock has an unsupported kind");
    const kind = info.isDirectory() ? "directory" : "legacy-file";
    const saved = await (async () => {
      await options.observe?.("acquisition-snapshot");
      return snapshot(path, kind);
    })().catch(() => {
      // An unreadable, malformed or initializing owner remains unknown. Retry
      // observation only within the existing deadline; it never permits recovery.
      return undefined;
    });
    if (saved && absent(saved, options)) {
      withinDeadline(deadline);
      const recovered =
        kind === "directory"
          ? await recoverDirectory(path, saved, options, deadline)
          : await recoverLegacyFile(
              path,
              saved,
              { ...options, waitMs: Math.max(0, deadline - performance.now()) },
              deadline,
            );
      if (recovered) continue;
    }
    if (performance.now() >= deadline)
      throw new Error(`Metadata locked. Inspect ownership evidence: ${basename(path)}`);
    await new Promise<void>((done) =>
      setTimeout(done, Math.min(25, Math.max(1, deadline - performance.now()))),
    );
  }
  let result:
    | { readonly ok: true; readonly value: T }
    | { readonly ok: false; readonly error: unknown };
  try {
    result = { ok: true, value: await run() };
  } catch (error) {
    result = { ok: false, error };
  }
  try {
    const current = await snapshot(path, "directory");
    if (current.digest !== hash(own))
      throw new Error("Metadata lock ownership changed before release");
    await unlink(join(path, "owner.json"));
    await rmdir(path);
  } catch (error) {
    if (!result.ok)
      throw new AggregateError(
        [result.error, error],
        "Action and metadata lock release both failed",
      );
    throw error;
  }
  if (!result.ok) throw result.error;
  return result.value;
}
