/** Native discovery is outside result locks; validation uses captured physical bindings. */
import { lstat, open, opendir, realpath, type FileHandle } from "node:fs/promises";
import type { BigIntStats } from "node:fs";
import { dirname, isAbsolute, join, resolve } from "node:path";
import { Schema } from "effect";
import {
  assertObservedIntegrationWorkspace,
  checkedParallelDirectory,
  parallelName,
  ParallelEntry,
  primaryWorktree,
} from "../workflow/parallel-store.ts";
import { repositoryAndBranch, repositoryDirectories } from "../workflow/git.ts";
import { taskKey } from "../workflow/storage.ts";
import { boundedRead, encodedDigest, gitText, hasCode, safePath } from "./cache-io.ts";

export interface SharedResultOwner {
  readonly primary: string;
  readonly repository: string;
  /** Bounded physical/HEAD/single-registration validation. No Git or registry enumeration. */
  readonly validate: () => Promise<void>;
  /** Full ambiguity/corruption refresh outside result locks; never rediscovers Git via processes. */
  readonly refresh: () => Promise<void>;
}
export class SharedOwnershipRefreshRequired extends Error {}
export type SharedOwnerObserver = (
  phase: "discovery" | "registry-snapshot" | "registration-read",
  attempt: number,
  path?: string,
) => void | Promise<void>;
const permanentPattern = /^[a-f0-9]{64}\.json$/u;
const temporaryPattern = /^[a-f0-9]{64}\.json\.[a-f0-9]{8}(?:-[a-f0-9]{4}){3}-[a-f0-9]{12}\.tmp$/u;
const registrationBytes = 16 * 1024;
const snapshotAttempts = 3;
class ReplacedRegistration extends Error {}
const fingerprint = (stat: BigIntStats): string =>
  encodedDigest([
    String(stat.dev),
    String(stat.ino),
    String(stat.mode),
    String(stat.nlink),
    String(stat.size),
    String(stat.mtimeNs),
    String(stat.ctimeNs),
  ]);

async function physicalDirectory(path: string): Promise<readonly string[]> {
  if (!isAbsolute(path) || path.length > 4096 || /[\r\n\0]/u.test(path))
    throw new Error("Shared verification requires a bounded physical absolute directory");
  const stat = await lstat(path, { bigint: true });
  if (
    !stat.isDirectory() ||
    stat.isSymbolicLink() ||
    resolve(await realpath(path)) !== resolve(path)
  )
    throw new Error("Shared verification directory is redirected");
  return [resolve(path), String(stat.dev), String(stat.ino)];
}
function regular(stat: BigIntStats, maximum: number): void {
  if (!stat.isFile() || stat.isSymbolicLink() || stat.nlink !== 1n || stat.size > BigInt(maximum))
    throw new Error("Shared verification metadata must be a bounded unlinked regular file");
}
async function readRegistration(
  registry: string,
  name: string,
  observe?: () => Promise<void>,
): Promise<{ entry: ParallelEntry; stamp: string }> {
  const path = "entries/" + name,
    target = await safePath(registry, path);
  const before = await lstat(target, { bigint: true });
  regular(before, registrationBytes);
  await observe?.();
  let bytes: Uint8Array;
  try {
    bytes = await boundedRead(registry, path, registrationBytes);
  } catch (error) {
    // Only proven replacement is retried. Missing, linked, oversized or malformed
    // selected metadata is never converted into a successful ownership claim.
    const after = await lstat(await safePath(registry, path), { bigint: true });
    regular(after, registrationBytes);
    if (fingerprint(before) !== fingerprint(after)) throw new ReplacedRegistration();
    throw error;
  }
  const after = await lstat(await safePath(registry, path), { bigint: true });
  regular(after, registrationBytes);
  if (fingerprint(before) !== fingerprint(after)) throw new ReplacedRegistration();
  const text = new TextDecoder("utf-8", { fatal: true }).decode(bytes);
  if (text.includes("\r")) throw new Error("Shared verification registration must use LF");
  const entry = Schema.decodeUnknownSync(Schema.fromJsonString(ParallelEntry), {
    onExcessProperty: "error",
  })(text);
  if (name !== taskKey(entry.sessionId, entry.taskId) + ".json")
    throw new Error("Shared verification registration filename differs from its identity");
  return { entry, stamp: fingerprint(after) };
}
async function registryNames(registry: string): Promise<readonly string[]> {
  const names: string[] = [];
  let temporaries = 0;
  const directory = await opendir(await safePath(registry, "entries"));
  for await (const item of directory) {
    if (permanentPattern.test(item.name)) {
      if (names.length >= 1000)
        throw new Error("Shared verification registration capacity exceeded");
      names.push(item.name);
      continue;
    }
    if (!temporaryPattern.test(item.name) || ++temporaries > 1000)
      throw new Error("Unsupported or excessive transient registration metadata");
    // Atomic writers can write/remove this file. It is counted and bounded,
    // but its bytes are never interpreted as a registration.
    try {
      const path = await safePath(registry, "entries/" + item.name);
      regular(await lstat(path, { bigint: true }), registrationBytes);
      regular(
        await lstat(await safePath(registry, "entries/" + item.name), { bigint: true }),
        registrationBytes,
      );
    } catch (error) {
      if (!hasCode(error, "ENOENT")) throw error;
    }
  }
  return names.sort();
}
async function registrySnapshot(
  registry: string,
  observe?: SharedOwnerObserver,
): Promise<{ entries: readonly ParallelEntry[]; revision: string }> {
  for (let attempt = 0; attempt < snapshotAttempts; attempt++) {
    await observe?.("registry-snapshot", attempt);
    try {
      const directory = await safePath(registry, "entries");
      const before = fingerprint(await lstat(directory, { bigint: true }));
      const names = await registryNames(registry);
      const records: Array<{ name: string; entry: ParallelEntry; stamp: string }> = [];
      for (const name of names) {
        const record = await readRegistration(registry, name, async () => {
          await observe?.("registration-read", attempt, name);
        });
        records.push({ name, ...record });
      }
      if (encodedDigest(names) !== encodedDigest(await registryNames(registry)))
        throw new ReplacedRegistration();
      for (const record of records) {
        const stat = await lstat(await safePath(registry, "entries/" + record.name), {
          bigint: true,
        });
        regular(stat, registrationBytes);
        if (fingerprint(stat) !== record.stamp) throw new ReplacedRegistration();
      }
      const revision = fingerprint(
        await lstat(await safePath(registry, "entries"), { bigint: true }),
      );
      if (revision !== before) throw new ReplacedRegistration();
      return { entries: records.map((record) => record.entry), revision };
    } catch (error) {
      if (!(error instanceof ReplacedRegistration) || attempt + 1 === snapshotAttempts) throw error;
    }
  }
  throw new Error("Shared verification registration snapshot did not stabilize");
}
function claim(entry: ParallelEntry, root: string, primary: string): string {
  const source = resolve(entry.path) === resolve(root);
  const candidate = entry.workspace !== null && resolve(entry.workspace) === resolve(root);
  if ((!source && !candidate) || ["creating", "uncertain", "failed"].includes(entry.state))
    throw new Error("Shared verification requires a confirmed matching registration");
  if (
    resolve(entry.path) !==
    resolve(primary, ".cache/worktrees", parallelName(entry.name, entry.sessionId, entry.taskId))
  )
    throw new Error("Shared verification source escaped its registered location");
  return encodedDigest([
    entry.sessionId,
    entry.taskId,
    entry.name,
    entry.path,
    entry.branch,
    entry.base,
    entry.destination,
    entry.policyHash,
    source ? "source" : "candidate",
    root,
  ]);
}

/** Git pointer names require a separate reader: general cache paths exclude .git. */
async function gitMetadata(path: string, maximum: number): Promise<string> {
  const before = await lstat(path, { bigint: true });
  regular(before, maximum);
  let handle: FileHandle | undefined;
  try {
    handle = await open(path, "r");
    if (fingerprint(await handle.stat({ bigint: true })) !== fingerprint(before))
      throw new Error("Git metadata changed before reading");
    const bytes = new Uint8Array(Number(before.size) + 1);
    let length = 0;
    while (length < bytes.length) {
      const part = await handle.read(bytes, length, bytes.length - length, null);
      if (!part.bytesRead) break;
      length += part.bytesRead;
    }
    const after = await lstat(path, { bigint: true });
    regular(after, maximum);
    if (
      length !== Number(before.size) ||
      fingerprint(after) !== fingerprint(before) ||
      fingerprint(await handle.stat({ bigint: true })) !== fingerprint(before)
    )
      throw new Error("Git metadata changed while reading");
    return new TextDecoder("utf-8", { fatal: true }).decode(bytes.subarray(0, length));
  } finally {
    await handle?.close();
  }
}

/** Observer is a trusted fixture port and runs only during discovery, outside metadata locks. */
export async function sharedResultOwner(
  root: string,
  observe?: SharedOwnerObserver,
): Promise<SharedResultOwner> {
  await observe?.("discovery", 0);
  await physicalDirectory(root);
  const query = async (args: readonly string[]): Promise<string> => gitText(root, args);
  const primary = resolve(await primaryWorktree(query));
  // Keep Git's config/environment interpretation authoritative. These values
  // belong only to this constructor; later operations make a new observation.
  const linkedObservation =
    resolve(root) === primary ? undefined : await repositoryAndBranch(query);
  const observed = linkedObservation ?? (await repositoryDirectories(query));
  if (resolve(observed.root) !== resolve(root))
    throw new Error("Shared verification requires the repository root");
  const registry = await checkedParallelDirectory(observed.directory),
    common = dirname(registry);
  const gitDirectory = observed.gitDirectory;
  const paths = [
    ...new Set(
      [
        root,
        primary,
        common,
        gitDirectory,
        ...(resolve(root) === primary ? [] : [registry, join(registry, "entries")]),
      ].map((path) => resolve(path)),
    ),
  ];
  const physical = await Promise.all(paths.map(physicalDirectory));
  const repository = encodedDigest([
    "teamagent-shared-verification-v1",
    await physicalDirectory(primary),
    await physicalDirectory(common),
  ]);
  let selected: { name: string; identity: string; branch: string | null } | undefined;
  let registeredRevision: string | undefined;
  if (resolve(root) !== primary) {
    const snapshot = await registrySnapshot(registry, observe);
    const entries = snapshot.entries.filter(
      (entry) =>
        resolve(entry.path) === resolve(root) ||
        (entry.workspace !== null && resolve(entry.workspace) === resolve(root)),
    );
    const entry = entries[0];
    if (entries.length !== 1 || entry === undefined)
      throw new Error("Shared verification requires one exact worktree registration");
    const source = resolve(entry.path) === resolve(root);
    if (linkedObservation === undefined)
      throw new Error("Shared verification linked repository branch was not observed");
    await assertObservedIntegrationWorkspace(query, entry, root, linkedObservation, source, {
      primary,
      registry,
    });
    selected = {
      name: taskKey(entry.sessionId, entry.taskId) + ".json",
      identity: claim(entry, root, primary),
      branch: source ? entry.branch : null,
    };
    registeredRevision = snapshot.revision;
  }
  const initialHead = await gitMetadata(join(gitDirectory, "HEAD"), 1024);
  const validate = async (): Promise<void> => {
    for (let index = 0; index < paths.length; index++) {
      const path = paths[index];
      if (
        path === undefined ||
        encodedDigest(await physicalDirectory(path)) !== encodedDigest(physical[index])
      )
        throw new Error("Shared verification physical repository binding changed");
    }
    if (resolve(root) === primary) {
      if (
        resolve(gitDirectory) !== resolve(common) ||
        resolve(await realpath(join(root, ".git"))) !== resolve(common)
      )
        throw new Error("Shared verification primary Git binding changed");
      try {
        await lstat(join(gitDirectory, "commondir"));
        throw new Error("Shared verification primary acquired a foreign common-directory pointer");
      } catch (error) {
        if (!hasCode(error, "ENOENT")) throw error;
      }
    } else {
      const marker = await gitMetadata(join(root, ".git"), 4096);
      const pointer = /^gitdir: ([^\r\n\0]+)\n$/u.exec(marker)?.[1];
      if (pointer === undefined || resolve(root, pointer) !== resolve(gitDirectory))
        throw new Error("Shared verification Git pointer changed");
      const pointerToCommon = (await gitMetadata(join(gitDirectory, "commondir"), 4096)).trim();
      if (
        !pointerToCommon ||
        /[\r\n\0]/u.test(pointerToCommon) ||
        resolve(gitDirectory, pointerToCommon) !== resolve(common)
      )
        throw new Error("Shared verification common Git pointer changed");
    }
    const head = await gitMetadata(join(gitDirectory, "HEAD"), 1024);
    if (selected === undefined) {
      if (
        head !== initialHead ||
        !/^(?:ref: refs\/heads\/[^\r\n\0]+|[a-f0-9]{40}|[a-f0-9]{64})\n$/u.test(head)
      )
        throw new Error("Invalid or changed primary Git HEAD");
    } else {
      if (
        selected.branch === null
          ? !/^(?:[a-f0-9]{40}|[a-f0-9]{64})\n$/u.test(head)
          : head !== "ref: refs/heads/" + selected.branch + "\n"
      )
        throw new Error("Shared verification task branch or detached candidate changed");
      for (let attempt = 0; ; attempt++) {
        try {
          if (
            claim((await readRegistration(registry, selected.name)).entry, root, primary) !==
            selected.identity
          )
            throw new Error("Shared verification registration ownership changed");
          break;
        } catch (error) {
          if (!(error instanceof ReplacedRegistration) || attempt + 1 >= snapshotAttempts)
            throw error;
        }
      }
      if (
        fingerprint(await lstat(await safePath(registry, "entries"), { bigint: true })) !==
        registeredRevision
      )
        throw new SharedOwnershipRefreshRequired("Shared verification registry inventory changed");
    }
  };
  const refresh = async (): Promise<void> => {
    if (selected === undefined) {
      await validate();
      return;
    }
    for (let retry = 0; retry < snapshotAttempts; retry++) {
      const snapshot = await registrySnapshot(registry, observe);
      const matching = snapshot.entries.filter(
        (entry) =>
          resolve(entry.path) === resolve(root) ||
          (entry.workspace !== null && resolve(entry.workspace) === resolve(root)),
      );
      const entry = matching[0];
      if (
        matching.length !== 1 ||
        entry === undefined ||
        claim(entry, root, primary) !== selected.identity
      )
        throw new Error("Shared verification registration became missing, ambiguous or changed");
      registeredRevision = snapshot.revision;
      try {
        await validate();
        return;
      } catch (error) {
        if (!(error instanceof SharedOwnershipRefreshRequired) || retry + 1 >= snapshotAttempts)
          throw error;
      }
    }
  };
  try {
    await validate();
  } catch (error) {
    if (!(error instanceof SharedOwnershipRefreshRequired)) throw error;
    await refresh();
  }
  return { primary, repository, validate, refresh };
}
