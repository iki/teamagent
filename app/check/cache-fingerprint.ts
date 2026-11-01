/** Stream complete fingerprints within one bounded reader budget per process. */
import { createHash } from "node:crypto";
import type { BigIntStats } from "node:fs";
import { lstat, open } from "node:fs/promises";
import { isAbsolute } from "node:path";

export const fingerprintReadLimit = 4;
export const fingerprintChunkBytes = 64 * 1024;
export const fingerprintQueueLimit = 256;
let activeReaders = 0;
const waitingReaders: Array<() => void> = [];

async function withReadPermit<T>(read: () => Promise<T>): Promise<T> {
  if (activeReaders >= fingerprintReadLimit) {
    if (waitingReaders.length >= fingerprintQueueLimit)
      throw new Error("Fingerprint reader queue exceeds its bound");
    await new Promise<void>((ready) => waitingReaders.push(ready));
  } else activeReaders++;
  try {
    return await read();
  } finally {
    const next = waitingReaders.shift();
    if (next) next();
    else activeReaders--;
  }
}

/** Trusted fixture observation only; never supplied through CLI/configuration. */
export type FingerprintObserver = (event: {
  readonly path: string;
  readonly phase: "before-open" | "opened" | "read" | "closed";
  readonly bytes: number;
}) => void | Promise<void>;

function sameFile(before: BigIntStats, after: BigIntStats): boolean {
  return (
    before.isFile() &&
    after.isFile() &&
    before.dev === after.dev &&
    before.ino === after.ino &&
    before.size === after.size &&
    before.mode === after.mode &&
    before.mtimeNs === after.mtimeNs &&
    before.ctimeNs === after.ctimeNs
  );
}

export async function fileContentDigest(
  path: string,
  expected: BigIntStats,
  options: {
    readonly maximumBytes: number;
    readonly algorithm?: "sha1" | "sha256";
    readonly gitBlob?: boolean;
    readonly validatePath?: () => Promise<void>;
    readonly observe?: FingerprintObserver;
  },
): Promise<string> {
  if (!isAbsolute(path) || !Number.isSafeInteger(options.maximumBytes) || options.maximumBytes < 0)
    throw new Error("Fingerprint requires an absolute path and a bounded byte limit");
  return withReadPermit(async () => {
    if (!expected.isFile() || expected.size > BigInt(options.maximumBytes))
      throw new Error("Fingerprint input is not a bounded regular file");
    await options.validatePath?.();
    await options.observe?.({ path, phase: "before-open", bytes: 0 });
    const file = await open(path, "r");
    try {
      const before = await file.stat({ bigint: true });
      if (!sameFile(expected, before)) throw new Error("Fingerprint input changed before opening");
      await options.observe?.({ path, phase: "opened", bytes: 0 });
      const size = Number(before.size);
      const hash = createHash(options.algorithm ?? "sha256");
      if (options.gitBlob) hash.update(`blob ${size}\0`);
      const chunk = new Uint8Array(fingerprintChunkBytes);
      let offset = 0;
      while (offset < size) {
        const { bytesRead } = await file.read(
          chunk,
          0,
          Math.min(chunk.length, size - offset),
          offset,
        );
        if (!bytesRead) throw new Error("Fingerprint input changed during reading");
        offset += bytesRead;
        hash.update(chunk.subarray(0, bytesRead));
        await options.observe?.({ path, phase: "read", bytes: bytesRead });
      }
      const extra = await file.read(chunk, 0, 1, offset);
      const after = await file.stat({ bigint: true });
      const current = await lstat(path, { bigint: true });
      if (extra.bytesRead || !sameFile(before, after) || !sameFile(before, current))
        throw new Error("Fingerprint input changed during reading");
      await options.validatePath?.();
      return hash.digest("hex");
    } finally {
      try {
        await file.close();
      } finally {
        await options.observe?.({ path, phase: "closed", bytes: 0 });
      }
    }
  });
}

/** Preserve JSON.stringify(rows) identity without retaining the complete encoded array. */
export function inventoryDigest(): {
  readonly record: (row: readonly string[]) => void;
  readonly finish: () => string;
} {
  const hash = createHash("sha256").update("[");
  let first = true;
  let finished = false;
  return {
    record(row) {
      if (finished) throw new Error("Inventory fingerprint is already complete");
      if (!first) hash.update(",");
      hash.update(JSON.stringify(row));
      first = false;
    },
    finish() {
      if (finished) throw new Error("Inventory fingerprint is already complete");
      finished = true;
      return hash.update("]").digest("hex");
    },
  };
}
