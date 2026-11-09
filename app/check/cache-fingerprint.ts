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

export class UnconfirmedArtifactCopy extends AggregateError {}

/** Exclusive derived-artifact copy, sharing the fingerprint reader/queue budget. */
export async function copyFileContent(
  source: string,
  expected: BigIntStats,
  target: string,
  options: {
    readonly maximumBytes: number;
    readonly validatePaths: () => Promise<void>;
    readonly observe?: FingerprintObserver;
  },
): Promise<string> {
  if (
    !isAbsolute(source) ||
    !isAbsolute(target) ||
    source === target ||
    !Number.isSafeInteger(options.maximumBytes) ||
    options.maximumBytes < 0
  )
    throw new Error("Artifact copy requires distinct absolute paths and a bounded byte limit");
  return withReadPermit(async () => {
    if (
      !expected.isFile() ||
      expected.isSymbolicLink() ||
      expected.nlink !== 1n ||
      expected.size > BigInt(options.maximumBytes)
    )
      throw new Error("Artifact copy source is not a bounded private regular file");
    await options.validatePaths();
    await options.observe?.({ path: source, phase: "before-open", bytes: 0 });
    const input = await open(source, "r");
    let output: Awaited<ReturnType<typeof open>> | undefined;
    let failure: { readonly error: unknown } | undefined;
    let copied: string | undefined;
    try {
      const before = await input.stat({ bigint: true });
      if (!sameFile(expected, before) || before.nlink !== 1n)
        throw new Error("Artifact copy source changed before opening");
      output = await open(target, "wx", 0o600);
      await options.observe?.({ path: source, phase: "opened", bytes: 0 });
      const chunk = new Uint8Array(fingerprintChunkBytes),
        hash = createHash("sha256");
      const size = Number(before.size);
      let offset = 0;
      while (offset < size) {
        const part = await input.read(chunk, 0, Math.min(chunk.length, size - offset), offset);
        if (!part.bytesRead) throw new Error("Artifact copy source changed during reading");
        hash.update(chunk.subarray(0, part.bytesRead));
        let written = 0;
        while (written < part.bytesRead) {
          const result = await output.write(
            chunk,
            written,
            part.bytesRead - written,
            offset + written,
          );
          if (!result.bytesWritten) throw new Error("Artifact copy made no write progress");
          written += result.bytesWritten;
        }
        offset += part.bytesRead;
        await options.observe?.({ path: source, phase: "read", bytes: part.bytesRead });
      }
      const extra = await input.read(chunk, 0, 1, offset);
      const after = await input.stat({ bigint: true }),
        current = await lstat(source, { bigint: true });
      const produced = await output.stat({ bigint: true }),
        targetNow = await lstat(target, { bigint: true });
      if (
        extra.bytesRead ||
        !sameFile(before, after) ||
        !sameFile(before, current) ||
        after.nlink !== 1n ||
        current.nlink !== 1n ||
        produced.nlink !== 1n ||
        targetNow.nlink !== 1n ||
        produced.size !== before.size ||
        !sameFile(produced, targetNow)
      )
        throw new Error("Artifact copy inputs or output changed during copying");
      await options.validatePaths();
      copied = hash.digest("hex");
    } catch (error) {
      failure = { error };
    }
    const failures: unknown[] = [];
    try {
      await output?.close();
    } catch (error) {
      failures.push(error);
    }
    try {
      await input.close();
    } catch (error) {
      failures.push(error);
    }
    if (failures.length)
      throw new UnconfirmedArtifactCopy(
        failure ? [failure.error, ...failures] : failures,
        "Artifact copy descriptor closure is unconfirmed; staging must be retained",
      );
    try {
      await options.observe?.({ path: source, phase: "closed", bytes: 0 });
    } catch (error) {
      if (failure)
        throw new AggregateError(
          [failure.error, error],
          "Artifact copy and its closure observer failed",
        );
      throw error;
    }
    if (failure) throw failure.error;
    if (copied === undefined) throw new Error("Artifact copy produced no confirmed digest");
    return copied;
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
