import { after } from "node:test";
import { createHash } from "node:crypto";
import {
  closeSync,
  fstatSync,
  lstatSync,
  mkdtempSync as createDirectorySync,
  openSync,
  readSync,
  realpathSync,
  type BigIntStats,
} from "node:fs";
import { lstat, mkdtemp as createDirectory, rm } from "node:fs/promises";
import { basename, dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import {
  borrowTemporaryWorkspace,
  createTemporaryWorkspace,
  inspectTemporaryRemoval,
  temporaryParent,
  temporaryRootPath,
} from "../app/check/temporary-workspace.ts";

const projectRoot = realpathSync(fileURLToPath(new URL("../", import.meta.url)));
const inherited = await temporaryParent(process.env, projectRoot);
let dispose: (() => Promise<void>) | undefined;
const owner = inherited
  ? await borrowTemporaryWorkspace(inherited.root, inherited.path, inherited.token)
  : await (async () => {
      const workspace = await createTemporaryWorkspace(projectRoot, "tests");
      dispose = workspace.dispose;
      return workspace;
    })();
const fixtures = new Map<string, string>();
const maximumFixtures = 4096;
let allocations = 0;
let closing = false;
const samePath = (left: string, right: string): boolean =>
  process.platform === "win32" ? left.toLowerCase() === right.toLowerCase() : left === right;
const key = (path: string): string =>
  process.platform === "win32" ? resolve(path).toLowerCase() : resolve(path);

function physicalDirectory(path: string): void {
  const info = lstatSync(path);
  if (!info.isDirectory() || info.isSymbolicLink() || !samePath(realpathSync(path), path))
    throw new Error("Temporary fixture path must be a physical directory");
}

function sameFile(left: BigIntStats, right: BigIntStats): boolean {
  return (
    left.isFile() &&
    right.isFile() &&
    left.dev === right.dev &&
    left.ino === right.ino &&
    left.mode === right.mode &&
    left.nlink === right.nlink &&
    left.size === right.size &&
    left.mtimeNs === right.mtimeNs &&
    left.ctimeNs === right.ctimeNs
  );
}

/** Compare already Schema-validated ownership bytes, including synchronous fixture users. */
function markerIdentity(): string {
  for (const path of [owner.root, join(owner.root, temporaryRootPath), owner.path])
    physicalDirectory(path);
  const marker = join(owner.path, ".owner.json");
  const original = lstatSync(marker, { bigint: true });
  if (
    !original.isFile() ||
    original.isSymbolicLink() ||
    original.nlink !== 1n ||
    original.size > 4096n
  )
    throw new Error("Temporary fixture ownership marker is invalid");
  const handle = openSync(marker, "r");
  try {
    const before = fstatSync(handle, { bigint: true });
    if (!sameFile(original, before))
      throw new Error("Temporary fixture ownership changed before reading");
    const bytes = new Uint8Array(Number(before.size));
    let offset = 0;
    while (offset < bytes.length) {
      const count = readSync(handle, bytes, offset, bytes.length - offset, offset);
      if (!count) throw new Error("Temporary fixture ownership changed during reading");
      offset += count;
    }
    if (
      readSync(handle, new Uint8Array(1), 0, 1, offset) ||
      !sameFile(before, fstatSync(handle, { bigint: true })) ||
      !sameFile(before, lstatSync(marker, { bigint: true }))
    )
      throw new Error("Temporary fixture ownership changed during reading");
    return createHash("sha256").update(bytes).digest("hex");
  } finally {
    closeSync(handle);
  }
}

const marker = markerIdentity();
await borrowTemporaryWorkspace(owner.root, owner.path, owner.token);
function validateOwner(): void {
  if (markerIdentity() !== marker) throw new Error("Temporary fixture ownership changed");
}

function allocationPrefix(prefix: string): string {
  if (closing) throw new Error("Temporary fixture cleanup has already started");
  const label =
    basename(prefix)
      .replace(/[^a-zA-Z0-9._-]/gu, "_")
      .slice(0, 48) || "fixture-";
  if (label === "." || label === "..") throw new Error("Invalid temporary fixture prefix");
  if (allocations >= maximumFixtures) throw new Error("Temporary fixture count exceeds its bound");
  validateOwner();
  allocations++;
  return join(owner.path, label);
}

/** A fixture is a direct child of this worker's validated lease, regardless of old prefixes. */
export async function mkdtemp(prefix: string): Promise<string> {
  const path = await createDirectory(allocationPrefix(prefix));
  fixtures.set(key(path), path);
  return path;
}

export function mkdtempSync(prefix: string): string {
  const path = createDirectorySync(allocationPrefix(prefix));
  fixtures.set(key(path), path);
  return path;
}

export function assertTemporaryFixtureSync(path: string): void {
  const target = resolve(path);
  if (!fixtures.has(key(target)) || !samePath(dirname(target), owner.path))
    throw new Error("Fixture is outside its owned temporary workspace");
  validateOwner();
  physicalDirectory(target);
}

export async function assertTemporaryFixture(path: string): Promise<void> {
  assertTemporaryFixtureSync(path);
  await borrowTemporaryWorkspace(owner.root, owner.path, owner.token);
}

after(
  async () => {
    closing = true;
    const failures: unknown[] = [];
    for (const path of fixtures.values()) {
      try {
        try {
          await lstat(path);
        } catch (error) {
          if (error instanceof Error && "code" in error && error.code === "ENOENT") continue;
          throw error;
        }
        await assertTemporaryFixture(path);
        await inspectTemporaryRemoval(path);
        await assertTemporaryFixture(path);
        await rm(path, { recursive: true, force: false, maxRetries: 3, retryDelay: 50 });
      } catch (error) {
        failures.push(error);
      }
    }
    // A failed fixture boundary must not be bypassed by disposing the whole owned lease.
    if (!failures.length) {
      try {
        await dispose?.();
      } catch (error) {
        failures.push(error);
      }
    }
    if (failures.length) throw new AggregateError(failures, "Temporary fixture cleanup failed");
  },
  { timeout: 60_000 },
);
