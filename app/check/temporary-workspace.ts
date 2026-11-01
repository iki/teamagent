/** Explicit scratch ownership; persistent records and caches are never recovered here. */
import { randomUUID } from "node:crypto";
import { hostname } from "node:os";
import { basename, dirname, isAbsolute, join, relative, resolve, sep } from "node:path";
import { lstat, mkdir, opendir, realpath, rm, writeFile } from "node:fs/promises";
import { Schema } from "effect";
import { boundedRead, hasCode } from "./cache-io.ts";

const Token = Schema.String.check(
  Schema.isPattern(/^[a-f0-9]{8}-[a-f0-9]{4}-4[a-f0-9]{3}-[89ab][a-f0-9]{3}-[a-f0-9]{12}$/u),
);
const Owner = Schema.Struct({
  version: Schema.Literal(1),
  token: Token,
  host: Schema.NonEmptyString.check(Schema.isMaxLength(255)),
  pid: Schema.Int.check(Schema.isGreaterThan(0), Schema.isLessThanOrEqualTo(2 ** 31 - 1)),
  createdAt: Schema.Int.check(
    Schema.isGreaterThanOrEqualTo(0),
    Schema.isLessThanOrEqualTo(Number.MAX_SAFE_INTEGER),
  ),
});
type Owner = typeof Owner.Type;
const namePattern = /^run-[a-z0-9-]{1,24}-[a-f0-9-]{36}$/u;
export const temporaryEnvironmentNames = [
  "TEAMAGENT_TEMPORARY_ROOT",
  "TEAMAGENT_TEMPORARY_PARENT",
  "TEAMAGENT_TEMPORARY_PARENT_ID",
] as const;
export const temporaryRootPath = ".tmp";
export const temporaryLimits = {
  entries: 4096,
  recovery: 256,
  depth: 48,
  files: 50_000,
  markerBytes: 4096,
};
const RecoveryProof = Schema.Struct({
  path: Schema.NonEmptyString.check(Schema.isMaxLength(8192)),
  originalMarker: Schema.NonEmptyString.check(Schema.isMaxLength(temporaryLimits.markerBytes)),
});
const RecoveryRequest = Schema.Struct({
  ...RecoveryProof.fields,
  descendantsStopped: Schema.Literal(true),
});
const samePath = (left: string, right: string): boolean =>
  process.platform === "win32" ? left.toLowerCase() === right.toLowerCase() : left === right;

async function physicalDirectory(path: string): Promise<string> {
  const full = resolve(path);
  const info = await lstat(full);
  if (!info.isDirectory() || info.isSymbolicLink() || !samePath(await realpath(full), full))
    throw new Error("Temporary workspace path must be a physical directory");
  return full;
}

async function workspaceParent(
  root: string,
  create = true,
): Promise<{ root: string; path: string }> {
  const project = await physicalDirectory(root);
  const path = join(project, temporaryRootPath);
  if (create) {
    try {
      await mkdir(path);
    } catch (error) {
      if (!hasCode(error, "EEXIST")) throw error;
    }
  }
  await physicalDirectory(path);
  return { root: project, path };
}

async function readOwnership(
  parent: string,
  name: string,
): Promise<{ owner: Owner; marker: string }> {
  if (!namePattern.test(name)) throw new Error("Invalid temporary workspace name");
  const path = await physicalDirectory(join(parent, name));
  const marker = join(path, ".owner.json");
  const info = await lstat(marker);
  if (!info.isFile() || info.isSymbolicLink() || info.nlink !== 1)
    throw new Error("Temporary workspace ownership must be a regular private file");
  const text = new TextDecoder("utf-8", { fatal: true, ignoreBOM: true }).decode(
    await boundedRead(path, ".owner.json", temporaryLimits.markerBytes),
  );
  const owner = Schema.decodeUnknownSync(Schema.fromJsonString(Owner), {
    onExcessProperty: "error",
  })(text);
  if (!name.endsWith(`-${owner.token}`))
    throw new Error("Temporary ownership does not match its directory");
  return { owner, marker: text };
}

async function readOwner(parent: string, name: string): Promise<Owner> {
  return (await readOwnership(parent, name)).owner;
}

function sameOwner(left: Owner, right: Owner): boolean {
  return (
    left.token === right.token &&
    left.host === right.host &&
    left.pid === right.pid &&
    left.createdAt === right.createdAt
  );
}

/** Validate cleanup bounds only; callers must separately establish removal authority. */
export async function inspectTemporaryRemoval(path: string): Promise<void> {
  let count = 0;
  async function visit(directory: string, depth: number): Promise<void> {
    if (depth > temporaryLimits.depth) throw new Error("Temporary cleanup exceeds directory depth");
    await physicalDirectory(directory);
    const entries = await opendir(directory);
    for await (const entry of entries) {
      if (++count > temporaryLimits.files)
        throw new Error("Temporary cleanup exceeds entry bounds");
      const child = join(directory, entry.name);
      const info = await lstat(child);
      // Recursive rm removes links themselves; never enumerate their targets.
      if (info.isSymbolicLink()) continue;
      if (info.isDirectory()) await visit(child, depth + 1);
      else if (!info.isFile()) throw new Error("Temporary cleanup found an unsupported entry");
    }
  }
  await visit(path, 0);
}

async function removeOwned(
  parent: string,
  name: string,
  expected: Owner,
  verifyAuthority?: () => Promise<void>,
): Promise<void> {
  await physicalDirectory(parent);
  const path = join(parent, name);
  const child = relative(parent, resolve(path));
  if (!child || child === ".." || child.startsWith(`..${sep}`) || isAbsolute(child))
    throw new Error("Temporary cleanup escaped its owner");
  if (!sameOwner(await readOwner(parent, name), expected))
    throw new Error("Temporary workspace owner changed");
  await verifyAuthority?.();
  await inspectTemporaryRemoval(path);
  await physicalDirectory(parent);
  if (!sameOwner(await readOwner(parent, name), expected))
    throw new Error("Temporary workspace owner changed before removal");
  await verifyAuthority?.();
  await rm(path, { recursive: true, force: false, maxRetries: 3, retryDelay: 50 });
}

export type TemporaryWorkspaceParent = {
  readonly root: string;
  readonly path: string;
  readonly token: string;
};
export type TemporaryWorkspace = TemporaryWorkspaceParent & {
  /** Save at creation; borrowing never supplies recovery authority. */
  readonly recovery: typeof RecoveryProof.Type;
  readonly environment: (base?: NodeJS.ProcessEnv) => NodeJS.ProcessEnv;
  readonly dispose: () => Promise<void>;
};

function environment(
  path: string,
  owner: TemporaryWorkspaceParent,
  base: NodeJS.ProcessEnv = process.env,
): NodeJS.ProcessEnv {
  const ignored: ReadonlySet<string> = new Set([
    "TEMP",
    "TMP",
    "TMPDIR",
    ...temporaryEnvironmentNames,
  ]);
  const copied = Object.fromEntries(
    Object.entries(base).filter(([name]) => !ignored.has(name.toUpperCase())),
  );
  return {
    ...copied,
    TEMP: path,
    TMP: path,
    TMPDIR: path,
    TEAMAGENT_TEMPORARY_ROOT: owner.root,
    TEAMAGENT_TEMPORARY_PARENT: owner.path,
    TEAMAGENT_TEMPORARY_PARENT_ID: owner.token,
  };
}

/** Borrowing grants use, never disposal of the parent's lease. */
export async function borrowTemporaryWorkspace(
  root: string,
  path: string,
  token: string,
): Promise<
  TemporaryWorkspaceParent & {
    readonly environment: (base?: NodeJS.ProcessEnv) => NodeJS.ProcessEnv;
  }
> {
  const parent = await workspaceParent(root, false);
  if (
    !isAbsolute(path) ||
    !samePath(dirname(resolve(path)), parent.path) ||
    !samePath(resolve(path), path)
  )
    throw new Error("Borrowed temporary workspace is outside its project");
  const owner = await readOwner(parent.path, basename(path));
  if (owner.token !== token || owner.host !== hostname())
    throw new Error("Borrowed temporary ownership does not match");
  if (processAlive(owner.pid) !== true)
    throw new Error("Borrowed temporary owner is not affirmatively alive");
  const borrowed = { root: parent.root, path, token };
  return { ...borrowed, environment: (base) => environment(path, borrowed, base) };
}

/** Select only complete validated ownership plumbing; absence creates no authority. */
export async function temporaryParent(
  base: NodeJS.ProcessEnv,
  fallbackRoot: string,
): Promise<TemporaryWorkspaceParent | undefined> {
  const fields: Record<string, string> = {};
  for (const [name, value] of Object.entries(base)) {
    if (!temporaryEnvironmentNames.some((key) => key === name.toUpperCase()) || value === undefined)
      continue;
    const previous = fields[name.toUpperCase()];
    if (previous !== undefined && previous !== value)
      throw new Error("Conflicting temporary ownership environment");
    fields[name.toUpperCase()] = value;
  }
  if (!Object.keys(fields).length) {
    await physicalDirectory(fallbackRoot);
    return undefined;
  }
  const decoded = Schema.decodeUnknownSync(
    Schema.Struct({
      TEAMAGENT_TEMPORARY_ROOT: Schema.NonEmptyString,
      TEAMAGENT_TEMPORARY_PARENT: Schema.NonEmptyString,
      TEAMAGENT_TEMPORARY_PARENT_ID: Token,
    }),
    { onExcessProperty: "error" },
  )(fields);
  if (!isAbsolute(decoded.TEAMAGENT_TEMPORARY_ROOT))
    throw new Error("Temporary project root must be absolute");
  if (
    !samePath(
      await physicalDirectory(decoded.TEAMAGENT_TEMPORARY_ROOT),
      await physicalDirectory(fallbackRoot),
    )
  )
    throw new Error("Temporary ownership belongs to another project");
  return borrowTemporaryWorkspace(
    decoded.TEAMAGENT_TEMPORARY_ROOT,
    decoded.TEAMAGENT_TEMPORARY_PARENT,
    decoded.TEAMAGENT_TEMPORARY_PARENT_ID,
  );
}

export async function createTemporaryWorkspace(
  root: string,
  label: string,
  container?: TemporaryWorkspaceParent,
): Promise<TemporaryWorkspace> {
  if (!/^[a-z0-9-]{1,24}$/u.test(label)) throw new Error("Invalid temporary workspace label");
  const project = await physicalDirectory(root);
  const enclosing = container
    ? await borrowTemporaryWorkspace(container.root, container.path, container.token)
    : undefined;
  if (enclosing && !samePath(enclosing.root, project))
    throw new Error("Temporary container belongs to another project");
  const parent = enclosing?.path ?? (await workspaceParent(project)).path;
  const token = randomUUID();
  const name = `run-${label}-${token}`;
  const path = join(parent, name);
  await mkdir(path);
  const owner: Owner = {
    version: 1,
    token,
    host: hostname(),
    pid: process.pid,
    createdAt: Date.now(),
  };
  // A failure leaves an unmarked fresh directory for explicit inspection, never broad cleanup.
  const originalMarker = `${JSON.stringify(owner)}\n`;
  await writeFile(join(path, ".owner.json"), originalMarker, {
    flag: "wx",
    mode: 0o600,
  });
  let disposal: Promise<void> | undefined;
  const owned = { root: project, path, token };
  return {
    ...owned,
    recovery: Object.freeze({ path, originalMarker }),
    environment: (base) => environment(path, enclosing ?? owned, base),
    dispose() {
      disposal ??= (async () => {
        try {
          await lstat(path);
        } catch (error) {
          if (hasCode(error, "ENOENT")) return;
          throw error;
        }
        if (enclosing)
          await borrowTemporaryWorkspace(enclosing.root, enclosing.path, enclosing.token);
        await removeOwned(parent, name, owner);
      })().catch((error: unknown) => {
        disposal = undefined;
        throw error;
      });
      return disposal;
    },
  };
}

function processAlive(pid: number): boolean | undefined {
  try {
    process.kill(pid, 0);
    return true;
  } catch (error) {
    return hasCode(error, "ESRCH") ? false : undefined;
  }
}

/**
 * Recover one exact creator-owned lease after its owner has exited.
 * descendantsStopped is a trusted caller assertion after joining/verifying the
 * descendants, not OS-authenticated proof. Missing original authority is never
 * reconstructed by scanning. Ordinary bulk recovery retains its age guard.
 */
export async function recoverTemporaryWorkspace(
  root: string,
  input: unknown,
  options: {
    /** Additional conservative probe for a host/test; never waives native liveness. */
    readonly isAlive?: (pid: number) => boolean | undefined;
  } = {},
): Promise<void> {
  const request = Schema.decodeUnknownSync(RecoveryRequest, { onExcessProperty: "error" })(input);
  if (
    Buffer.byteLength(request.originalMarker) > temporaryLimits.markerBytes ||
    request.originalMarker.includes("\r") ||
    !request.originalMarker.endsWith("\n")
  )
    throw new Error("Original temporary ownership must be bounded LF text");
  const expected = Schema.decodeUnknownSync(Schema.fromJsonString(Owner), {
    onExcessProperty: "error",
  })(request.originalMarker);
  const parent = await workspaceParent(root, false);
  if (
    !isAbsolute(request.path) ||
    !samePath(resolve(request.path), request.path) ||
    !samePath(dirname(request.path), parent.path)
  )
    throw new Error("Explicit temporary recovery must target one direct owned child");
  if (expected.host !== hostname())
    throw new Error("Explicit temporary recovery requires the original host");
  const name = basename(request.path);
  const verifyAuthority = async (): Promise<void> => {
    if (options.isAlive && options.isAlive(expected.pid) !== false)
      throw new Error("Original temporary owner is not definitively absent");
    const currentParent = await workspaceParent(root, false);
    if (!samePath(currentParent.path, parent.path))
      throw new Error("Explicit temporary recovery parent changed");
    const current = await readOwnership(parent.path, name);
    if (current.marker !== request.originalMarker || !sameOwner(current.owner, expected))
      throw new Error("Original temporary ownership marker changed");
    if (processAlive(expected.pid) !== false)
      throw new Error("Original temporary owner is not definitively absent");
  };
  await removeOwned(parent.path, name, expected, verifyAuthority);
}

/** Explicit recovery of old marked scratch only. Unknown state and all evidence are preserved. */
export async function pruneTemporaryWorkspaces(
  root: string,
  options: {
    readonly now?: number;
    readonly isAlive?: (pid: number) => boolean | undefined;
    readonly after?: string;
  } = {},
): Promise<{ removed: string[]; preserved: number; nextCursor: string | null }> {
  const parent = await workspaceParent(root, false);
  const now = options.now ?? Date.now();
  if (
    !Number.isSafeInteger(now) ||
    now < 0 ||
    (options.after !== undefined && !namePattern.test(options.after))
  )
    throw new Error("Invalid temporary recovery options");
  const names: string[] = [];
  const directory = await opendir(parent.path);
  for await (const entry of directory) {
    if (names.length >= temporaryLimits.entries)
      throw new Error("Temporary recovery exceeds root inventory bounds");
    names.push(entry.name);
  }
  const candidates = names.filter((name) => namePattern.test(name)).sort();
  const selected = candidates
    .filter((name) => options.after === undefined || name > options.after)
    .slice(0, temporaryLimits.recovery);
  const removed: string[] = [];
  let preserved = names.length - selected.length;
  for (const name of selected) {
    try {
      const owner = await readOwner(parent.path, name);
      if (
        owner.host !== hostname() ||
        now - owner.createdAt < 86_400_000 ||
        (options.isAlive ?? processAlive)(owner.pid) !== false
      ) {
        preserved++;
        continue;
      }
      await removeOwned(parent.path, name, owner);
      removed.push(join(parent.path, name));
    } catch {
      preserved++;
    }
  }
  return { removed, preserved, nextCursor: selected.at(-1) ?? null };
}
