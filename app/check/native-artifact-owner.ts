/** Physical repository topology selects immutable artifacts, never task authority. */
import type { BigIntStats } from "node:fs";
import { lstat, open, realpath } from "node:fs/promises";
import { basename, dirname, isAbsolute, join, resolve } from "node:path";
import { Schema } from "effect";

const Pointer = Schema.String.check(Schema.isMaxLength(4096), Schema.isPattern(/^[^\p{Cc}]+\n$/u));
const Marker = Schema.String.check(
  Schema.isMaxLength(4096),
  Schema.isPattern(/^gitdir: [^\p{Cc}]+\n$/u),
);
const Head = Schema.String.check(
  Schema.isMaxLength(1024),
  Schema.isPattern(/^(?:ref: refs\/heads\/[^\p{Cc}]+|[a-f0-9]{40}|[a-f0-9]{64})\n$/u),
);
const samePath = (left: string, right: string): boolean =>
  process.platform === "win32"
    ? resolve(left).toLowerCase() === resolve(right).toLowerCase()
    : resolve(left) === resolve(right);
const missing = (error: unknown): boolean =>
  error instanceof Error && "code" in error && error.code === "ENOENT";
const stamp = (stat: BigIntStats): string =>
  JSON.stringify([
    String(stat.dev),
    String(stat.ino),
    String(stat.mode),
    String(stat.nlink),
    String(stat.size),
    String(stat.mtimeNs),
    String(stat.ctimeNs),
  ]);
async function directory(path: string): Promise<readonly string[]> {
  if (!isAbsolute(path) || path.length > 4096 || /[\p{Cc}]/u.test(path))
    throw new Error("Native artifact owner requires a bounded absolute path");
  const stat = await lstat(path, { bigint: true });
  if (!stat.isDirectory() || stat.isSymbolicLink() || !samePath(await realpath(path), path))
    throw new Error("Native artifact owner directory is redirected");
  return [resolve(path), String(stat.dev), String(stat.ino)];
}
async function metadata(path: string, maximum: number): Promise<string> {
  const before = await lstat(path, { bigint: true });
  const regular = (stat: BigIntStats): boolean =>
    stat.isFile() && !stat.isSymbolicLink() && stat.nlink === 1n && stat.size <= BigInt(maximum);
  if (!regular(before) || !samePath(await realpath(path), path))
    throw new Error("Native artifact Git metadata is redirected or exceeds bounds");
  const file = await open(path, "r");
  try {
    if (stamp(await file.stat({ bigint: true })) !== stamp(before))
      throw new Error("Native artifact Git metadata changed before reading");
    const bytes = new Uint8Array(Number(before.size) + 1);
    let length = 0;
    while (length < bytes.length) {
      const part = await file.read(bytes, length, bytes.length - length, length);
      if (!part.bytesRead) break;
      length += part.bytesRead;
    }
    const after = await lstat(path, { bigint: true });
    if (
      !regular(after) ||
      length !== Number(before.size) ||
      stamp(before) !== stamp(after) ||
      stamp(before) !== stamp(await file.stat({ bigint: true })) ||
      !samePath(await realpath(path), path)
    )
      throw new Error("Native artifact Git metadata changed during reading");
    return new TextDecoder("utf-8", { fatal: true }).decode(bytes.subarray(0, length));
  } finally {
    await file.close();
  }
}
async function absent(path: string): Promise<boolean> {
  try {
    await lstat(path);
    return false;
  } catch (error) {
    if (missing(error)) return true;
    throw error;
  }
}
type Topology = {
  readonly primary: string;
  readonly common: string;
  readonly identity: string;
};
/** Only the fixed independent reads in one observation share a bounded batch. */
async function observationBatch<T>(reads: readonly (() => Promise<T>)[]): Promise<readonly T[]> {
  if (reads.length > 5) throw new Error("Native artifact observation exceeds its read bound");
  const values: T[] = [],
    failures: unknown[] = [];
  for (let index = 0; index < reads.length; index += 4) {
    const results = await Promise.allSettled(reads.slice(index, index + 4).map((read) => read()));
    for (const result of results) {
      if (result.status === "fulfilled") values.push(result.value);
      else {
        const reason: unknown = result.reason;
        failures.push(reason);
      }
    }
  }
  if (failures.length === 1) throw failures[0];
  if (failures.length)
    throw new AggregateError(failures, "Native artifact ownership observations failed");
  return values;
}
async function topology(
  root: string,
  rootIdentity: readonly string[],
): Promise<Topology | undefined> {
  const marker = join(root, ".git");
  // Absence is a positive exact-root classification, not ancestor discovery.
  if (await absent(marker)) return undefined;
  const mark = await lstat(marker, { bigint: true });
  if (mark.isSymbolicLink()) throw new Error("Native artifact Git marker is linked");
  let admin: string, common: string, pointers: readonly string[];
  if (mark.isDirectory()) {
    admin = marker;
    common = marker;
    pointers = [];
    if (!(await absent(join(common, "commondir"))))
      throw new Error("Native artifact primary cannot redirect its common directory");
  } else if (mark.isFile()) {
    const forward = Schema.decodeUnknownSync(Marker)(await metadata(marker, 4096));
    admin = resolve(root, forward.slice(8, -1));
    await directory(admin);
    const shared = Schema.decodeUnknownSync(Pointer)(
      await metadata(join(admin, "commondir"), 4096),
    );
    common = resolve(admin, shared.slice(0, -1));
    if (
      !samePath(dirname(admin), join(common, "worktrees")) ||
      !/^[^\p{Cc}\\/:]+$/u.test(basename(admin)) ||
      [".", ".."].includes(basename(admin))
    )
      throw new Error("Native artifact administrative directory is outside its common repository");
    const backward = Schema.decodeUnknownSync(Pointer)(await metadata(join(admin, "gitdir"), 4096));
    if (!samePath(resolve(admin, backward.slice(0, -1)), marker))
      throw new Error("Native artifact Git back-pointer does not match its exact project");
    pointers = [resolve(admin), resolve(common), resolve(marker)];
  } else throw new Error("Native artifact Git marker is not a regular file or directory");
  if (basename(common).toLowerCase() !== ".git")
    throw new Error("Native artifact sharing requires a physical primary .git directory");
  const primary = dirname(common);
  const paths = [primary, common, admin, join(common, "objects"), join(common, "refs")];
  // The table belongs only to this observation. The administrative guard before
  // reading pointers remains separate from these final physical checks.
  const directories = new Map<string, readonly string[]>([[resolve(root), rootIdentity]]);
  const unique = [...new Set(paths.map((path) => resolve(path)))].filter(
    (path) => !directories.has(path),
  );
  const observations = await observationBatch(
    unique.map((path) => async () => ({ path, identity: await directory(path) })),
  );
  for (const observation of observations) directories.set(observation.path, observation.identity);
  const physical = paths.map((path) => {
    const identity = directories.get(resolve(path));
    if (!identity) throw new Error("Native artifact directory observation is missing");
    return identity;
  });
  if (!(await absent(join(common, "commondir"))))
    throw new Error("Native artifact common directory cannot redirect again");
  await observationBatch(
    [...new Set([join(common, "HEAD"), join(admin, "HEAD")])].map(
      (path) => async () => Schema.decodeUnknownSync(Head)(await metadata(path, 1024)),
    ),
  );
  return { primary, common, identity: JSON.stringify([rootIdentity, physical, pointers]) };
}

export type NativeArtifactOwner = {
  readonly project: string;
  readonly canonical: string;
  readonly shared: boolean;
  readonly validate: () => Promise<void>;
};

/** Trusted host roots only; no CLI/environment selector and no process/bootstrap recursion. */
export async function nativeArtifactOwner(
  implementation: string,
  project: string,
): Promise<NativeArtifactOwner> {
  const selected = resolve(project),
    source = resolve(implementation);
  const sourcePhysical = await directory(source);
  const projectPhysical = samePath(source, selected) ? sourcePhysical : await directory(selected);
  const sourceTopology = await topology(source, sourcePhysical);
  const projectTopology = samePath(source, selected)
    ? sourceTopology
    : await topology(selected, projectPhysical);
  const shared =
    sourceTopology !== undefined &&
    projectTopology !== undefined &&
    samePath(sourceTopology.common, projectTopology.common);
  const canonical = shared && projectTopology !== undefined ? projectTopology.primary : selected;
  const validate = async (): Promise<void> => {
    const currentSource = await directory(source);
    const currentProject = samePath(source, selected) ? currentSource : await directory(selected);
    const sourceNow = await topology(source, currentSource);
    const projectNow = samePath(source, selected)
      ? sourceNow
      : await topology(selected, currentProject);
    if (
      JSON.stringify(currentSource) !== JSON.stringify(sourcePhysical) ||
      JSON.stringify(currentProject) !== JSON.stringify(projectPhysical) ||
      sourceNow?.identity !== sourceTopology?.identity ||
      projectNow?.identity !== projectTopology?.identity
    )
      throw new Error("Native artifact repository ownership changed during preparation");
  };
  await validate();
  return { project: selected, canonical, shared, validate };
}
