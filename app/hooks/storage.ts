import { randomUUID } from "node:crypto";
import { lstat, mkdir, opendir, unlink } from "node:fs/promises";
import { hostname } from "node:os";
import { Schema } from "effect";
import {
  atomicText,
  boundedText,
  containedPath,
  digest,
  exclusiveText,
  withLock,
} from "../workflow/storage.ts";

export const hookDiagnosticRoot = ".cache/hook-diagnostics";
const limits = { bytes: 64 * 1024 * 1024, files: 4096, slots: 1024 };
const controlBytes = 4096;
const controlFiles = 2;
const reservationBytes = 4096;
const receiptBytes = 8192;
const overheadBytes = 32 * 1024;
const overheadFiles = 8;
const Id = Schema.String.check(
  Schema.isPattern(/^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/u),
);
const Reservation = Schema.Struct({
  version: Schema.Literal(1),
  id: Id,
  token: Id,
  phase: Schema.Literals(["archive", "review"]),
  hostPid: Schema.Int.check(Schema.isGreaterThan(0)),
  hostname: Schema.NonEmptyString.check(Schema.isMaxLength(256)),
  startedAt: Schema.String.check(Schema.isMaxLength(64)),
  maximumOutputBytes: Schema.Int.check(
    Schema.isGreaterThan(0),
    Schema.isLessThanOrEqualTo(16 * 1024 * 1024),
  ),
  bytes: Schema.Int,
  files: Schema.Int,
});
export type HookReservation = typeof Reservation.Type;
/** Trusted tests may lower these limits; no hook JSON or environment setting controls them. */
export interface HookDiagnosticBudget {
  readonly bytes?: number;
  readonly files?: number;
}

export function hookDiagnosticPaths(reservation: HookReservation) {
  const directory = `${hookDiagnosticRoot}/${reservation.id}-${reservation.phase}`;
  return {
    directory,
    reservation: `${directory}/reservation.json`,
    receipt: `${directory}/receipt.json`,
    log: `${directory}/diagnostic.log`,
  };
}
function budget(request: HookDiagnosticBudget): { bytes: number; files: number } {
  const bytes = request.bytes ?? limits.bytes,
    files = request.files ?? limits.files;
  if (
    !Number.isSafeInteger(bytes) ||
    bytes < 1 ||
    bytes > limits.bytes ||
    !Number.isSafeInteger(files) ||
    files < 1 ||
    files > limits.files
  )
    throw new Error("Invalid hook diagnostic budget");
  return { bytes, files };
}
async function readReservation(root: string, path: string): Promise<HookReservation> {
  const value = Schema.decodeUnknownSync(Schema.fromJsonString(Reservation))(
    await boundedText(await containedPath(root, path), reservationBytes),
    { onExcessProperty: "error" },
  );
  if (
    value.bytes !== value.maximumOutputBytes + overheadBytes ||
    value.files !== overheadFiles ||
    hookDiagnosticPaths(value).reservation !== path
  )
    throw new Error("Hook diagnostic reservation identity or quota is invalid");
  return value;
}
/** Only this adapter writes this separate budget root; workflow writers use their existing root. */
async function inspect(root: string): Promise<{ bytes: number; files: number; slots: number }> {
  let bytes = controlBytes,
    files = controlFiles,
    slots = 0;
  const entries = await opendir(await containedPath(root, hookDiagnosticRoot));
  for await (const entry of entries) {
    if (entry.name === ".lock") continue;
    if (!/^[a-f0-9-]{36}-(?:archive|review)$/u.test(entry.name) || ++slots > limits.slots)
      throw new Error("Unexpected hook diagnostic entry or slot limit");
    const relative = `${hookDiagnosticRoot}/${entry.name}`;
    const info = await lstat(await containedPath(root, relative));
    if (!info.isDirectory() || info.isSymbolicLink())
      throw new Error("Linked or invalid hook diagnostic slot");
    let actualBytes = 0,
      actualFiles = 0,
      reserved = false;
    const contents = await opendir(await containedPath(root, relative));
    for await (const file of contents) {
      if (
        !/^(?:reservation\.json|receipt\.json|diagnostic\.log)(?:\.[a-f0-9-]{36}\.tmp)?$/u.test(
          file.name,
        )
      )
        throw new Error("Unexpected hook diagnostic file");
      const stat = await lstat(await containedPath(root, `${relative}/${file.name}`));
      if (!stat.isFile() || stat.isSymbolicLink() || stat.size > 16 * 1024 * 1024)
        throw new Error("Invalid hook diagnostic file");
      actualBytes += stat.size;
      actualFiles++;
      if (actualFiles > overheadFiles) throw new Error("Hook diagnostic slot file limit exceeded");
      if (file.name === "reservation.json") reserved = true;
    }
    if (!actualFiles) throw new Error("Incomplete hook diagnostic slot requires explicit recovery");
    if (reserved) {
      const reservation = await readReservation(root, `${relative}/reservation.json`);
      if (actualBytes > reservation.bytes || actualFiles > reservation.files)
        throw new Error("Hook diagnostic slot exceeds its reservation");
      bytes += reservation.bytes;
      files += reservation.files;
    } else {
      if (actualFiles !== 2)
        throw new Error("Incomplete hook diagnostics require explicit recovery");
      await boundedText(await containedPath(root, `${relative}/receipt.json`), receiptBytes);
      await lstat(await containedPath(root, `${relative}/diagnostic.log`));
      bytes += actualBytes;
      files += actualFiles;
    }
    if (bytes > limits.bytes || files > limits.files)
      throw new Error("Hook diagnostic capacity exceeded");
  }
  return { bytes, files, slots };
}
async function owned(root: string, reservation: HookReservation): Promise<void> {
  const current = await readReservation(root, hookDiagnosticPaths(reservation).reservation);
  if (JSON.stringify(current) !== JSON.stringify(reservation))
    throw new Error("Hook diagnostic reservation ownership changed");
}
export async function reserveHookDiagnostics(
  root: string,
  phase: "archive" | "review",
  maximumOutputBytes: number,
  requested: HookDiagnosticBudget = {},
): Promise<HookReservation> {
  const allowed = budget(requested);
  const reservation = Schema.decodeUnknownSync(Reservation)({
    version: 1,
    id: randomUUID(),
    token: randomUUID(),
    phase,
    hostPid: process.pid,
    hostname: hostname(),
    startedAt: new Date().toISOString(),
    maximumOutputBytes,
    bytes: maximumOutputBytes + overheadBytes,
    files: overheadFiles,
  });
  return await withLock(await containedPath(root, `${hookDiagnosticRoot}/.lock`), async () => {
    const current = await inspect(root);
    if (
      current.bytes + reservation.bytes > allowed.bytes ||
      current.files + reservation.files > allowed.files ||
      current.slots >= limits.slots
    )
      throw new Error(
        "Hook diagnostic capacity reserved; preserve and reconcile existing evidence before retrying",
      );
    const paths = hookDiagnosticPaths(reservation);
    await mkdir(await containedPath(root, paths.directory));
    const text = JSON.stringify(reservation, null, 2) + "\n";
    if (Buffer.byteLength(text) > reservationBytes)
      throw new Error("Hook reservation exceeds byte limit");
    await exclusiveText(await containedPath(root, paths.reservation), text);
    return reservation;
  });
}
export async function writeHookDiagnostic(
  root: string,
  reservation: HookReservation,
  kind: "receipt" | "log",
  text: string,
): Promise<void> {
  await owned(root, reservation);
  if (
    text.includes("\r") ||
    Buffer.byteLength(text) > (kind === "receipt" ? receiptBytes : reservation.maximumOutputBytes)
  )
    throw new Error("Hook diagnostic output exceeds its LF or byte boundary");
  await atomicText(await containedPath(root, hookDiagnosticPaths(reservation)[kind]), text);
}
export async function finalizeHookDiagnostics(
  root: string,
  reservation: HookReservation,
  expected: { receiptHash: string; logHash: string },
): Promise<void> {
  await withLock(await containedPath(root, `${hookDiagnosticRoot}/.lock`), async () => {
    await owned(root, reservation);
    const paths = hookDiagnosticPaths(reservation);
    const receipt = await boundedText(await containedPath(root, paths.receipt), receiptBytes);
    const log = await boundedText(
      await containedPath(root, paths.log),
      reservation.maximumOutputBytes,
    );
    if (digest(receipt) !== expected.receiptHash || digest(log) !== expected.logHash)
      throw new Error("Hook diagnostic publication changed before finalization");
    await inspect(root);
    // Failed/interrupted finalization retains the reservation; no age or PID-based reclamation.
    await unlink(await containedPath(root, paths.reservation));
  });
}
