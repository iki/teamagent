/** Adapted from Trigon's cooperative input cache at 454e372c; hashes actual working bytes. */
import { lstat, unlink } from "node:fs/promises";
import { relative, resolve } from "node:path";
import { Schema } from "effect";
import { fileContentDigest, inventoryDigest } from "./cache-fingerprint.ts";
import {
  atomicJson,
  atomicReceiptText,
  boundedRead,
  cacheDirectory,
  cacheLimits,
  contains,
  encodedDigest,
  gitBytes,
  gitText,
  hasCode,
  inventory,
  receiptDirectory,
  safePath,
  scopePath,
  withCacheLock,
} from "./cache-io.ts";
import {
  resolveVerificationWritePolicy,
  type VerificationWritePolicy,
} from "./verification-policy.ts";

export interface CacheTask {
  readonly id: string;
  readonly kind: "verification" | "build";
  readonly inputs?: readonly string[];
  readonly excludeInputs?: readonly string[];
  readonly outputs?: readonly string[];
  readonly externalInputs?: readonly string[];
  readonly values?: readonly string[];
  readonly portable?: boolean;
}
const Digest = Schema.String.check(Schema.isPattern(/^[a-f0-9]{64}$/u));
const Strings = Schema.Array(Schema.String).check(Schema.isMaxLength(256));
const Receipt = Schema.Struct({
  version: Schema.Literal(1),
  id: Schema.String,
  kind: Schema.Literals(["verification", "build"]),
  inputs: Strings,
  excludeInputs: Strings,
  definition: Digest,
  projection: Digest,
  external: Digest,
  key: Digest,
  runtime: Schema.Array(Schema.String).check(Schema.isMinLength(3), Schema.isMaxLength(3)),
  passed: Schema.Literal(true),
  output: Schema.optional(Digest),
});
type Receipt = typeof Receipt.Type;
type Entry = { readonly mode: string; readonly object: string };
const engineInputs = ["app/check", ".gitattributes", ".gitignore"];
const systemPath = (path: string): boolean =>
  contains(receiptDirectory, path.toLowerCase()) || contains(cacheDirectory, path.toLowerCase());
const keyFor = (definition: string, projection: string, external: string): string =>
  encodedDigest([1, definition, projection, external]);
export const validTaskId = (id: string): string => {
  if (!/^[a-zA-Z0-9][a-zA-Z0-9._-]{0,119}$/u.test(id))
    throw new Error("Invalid verification task id");
  return id;
};
function normalize(task: CacheTask) {
  validTaskId(task.id);
  const paths = (items: readonly string[]): string[] => [...new Set(items.map(scopePath))].sort();
  const inputs = paths(task.inputs ?? ["."]);
  const excludeInputs = paths(task.excludeInputs ?? []);
  const outputs = paths(task.outputs ?? []);
  const externalInputs = paths(task.externalInputs ?? []);
  if (
    [inputs, excludeInputs, outputs, externalInputs, task.values ?? []].some(
      (items) => items.length > 256,
    )
  )
    throw new Error("Cache task definition exceeds bounds");
  if (
    outputs.some(
      (path) =>
        systemPath(path) ||
        contains(path.toLowerCase(), receiptDirectory) ||
        contains(path.toLowerCase(), cacheDirectory),
    )
  )
    throw new Error("Cache outputs cannot contain receipts or locks");
  if (task.kind === "build" && !outputs.length)
    throw new Error("Build cache requires complete output paths");
  return { ...task, inputs, excludeInputs, outputs, externalInputs };
}
type Task = ReturnType<typeof normalize>;
function selected(path: string, task: Pick<Task, "inputs" | "excludeInputs">): boolean {
  return (
    !systemPath(path) &&
    (engineInputs.some((scope) => contains(scope, path)) ||
      (task.inputs.some((scope) => contains(scope, path)) &&
        !task.excludeInputs.some((scope) => contains(scope, path))))
  );
}
function indexEntries(root: string, indexFile?: string): Map<string, Entry> {
  if (relative(resolve(gitText(root, ["rev-parse", "--show-toplevel"]).trim()), resolve(root)))
    throw new Error("Verification cache requires the actual repository root");
  const result = new Map<string, Entry>();
  for (const row of gitText(
    root,
    ["ls-files", "--stage", "-z"],
    indexFile === undefined ? {} : { indexFile },
  )
    .split("\0")
    .filter(Boolean)) {
    const match = /^([0-7]{6}) ([a-f0-9]{40,64}) ([0-3])\t([\s\S]+)$/u.exec(row);
    if (!match?.[1] || !match[2] || match[3] !== "0" || !match[4])
      throw new Error("Cannot verify an unmerged or malformed Git index");
    result.set(scopePath(match[4]), { mode: match[1], object: match[2] });
    if (result.size > 100_000) throw new Error("Git index exceeds verification bounds");
  }
  return result;
}
function projection(
  entries: ReadonlyMap<string, Entry>,
  task: Pick<Task, "inputs" | "excludeInputs">,
): string {
  const digest = inventoryDigest();
  for (const [path, entry] of [...entries]
    .filter(([path]) => selected(path, task))
    .sort(([left], [right]) => left.localeCompare(right, "en")))
    digest.record([path, entry.mode, entry.object]);
  return digest.finish();
}
async function workingProjection(root: string, task: Task): Promise<string> {
  const indexed = indexEntries(root);
  const names = new Set(indexed.keys());
  for (const path of gitText(root, ["ls-files", "--others", "--exclude-standard", "-z"])
    .split("\0")
    .filter(Boolean))
    names.add(scopePath(path));
  const format = gitText(root, ["rev-parse", "--show-object-format"]).trim();
  if (format !== "sha1" && format !== "sha256") throw new Error("Unsupported Git object format");
  const entries = new Map<string, Entry>();
  let totalBytes = 0;
  for (const path of [...names].sort()) {
    if (!selected(path, task)) continue;
    if (entries.size >= cacheLimits.files)
      throw new Error("Verification source inventory exceeds file bounds");
    const old = indexed.get(path);
    if (old && old.mode !== "100644" && old.mode !== "100755")
      throw new Error(`Linked/submodule verification inputs are unsupported: ${path}`);
    try {
      const target = await safePath(root, path);
      const stat = await lstat(target, { bigint: true });
      if (!stat.isFile()) throw new Error(`Unsupported verification input: ${path}`);
      if (stat.size > BigInt(cacheLimits.fileBytes))
        throw new Error(`Verification input exceeds byte bounds: ${path}`);
      totalBytes += Number(stat.size);
      if (totalBytes > cacheLimits.totalBytes)
        throw new Error("Verification source inventory exceeds byte bounds");
      const object = await fileContentDigest(target, stat, {
        maximumBytes: cacheLimits.fileBytes,
        algorithm: format,
        gitBlob: true,
        validatePath: async () => {
          await safePath(root, path);
        },
      });
      const mode =
        process.platform === "win32"
          ? (old?.mode ?? "100644")
          : stat.mode & 0o111n
            ? "100755"
            : "100644";
      entries.set(path, { mode, object });
    } catch (error) {
      if (!hasCode(error, "ENOENT")) throw error;
    }
  }
  return projection(entries, task);
}
export async function inputIdentity(
  root: string,
  definition: CacheTask,
): Promise<{
  definition: string;
  projection: string;
  external: string;
  key: string;
  runtime: readonly string[];
}> {
  const task = normalize(definition);
  const runtime = [process.versions.bun ?? process.version, process.platform, process.arch];
  const definitionHash = encodedDigest({
    id: task.id,
    kind: task.kind,
    inputs: task.inputs,
    excludeInputs: task.excludeInputs,
    outputs: task.outputs,
    externalInputs: task.externalInputs,
    values: task.values ?? [],
    portable: task.portable !== false,
    runtime,
    runtimeArguments: encodedDigest(process.execArgv),
  });
  const source = await workingProjection(root, task);
  const external = await inventory(root, task.externalInputs);
  return {
    definition: definitionHash,
    projection: source,
    external,
    runtime,
    key: keyFor(definitionHash, source, external),
  };
}
const receiptPath = (task: Task): string =>
  `${task.kind === "verification" && task.portable !== false ? receiptDirectory : cacheDirectory}/${task.kind}-${task.id}.json`;
const localReceiptPath = (task: Task): string => `${cacheDirectory}/${task.kind}-${task.id}.json`;
const receiptPaths = (task: Task): readonly string[] =>
  task.kind === "verification" && task.portable !== false
    ? [receiptPath(task), localReceiptPath(task)]
    : [localReceiptPath(task)];
const decodeReceipt = (bytes: Uint8Array): Receipt =>
  Schema.decodeUnknownSync(Schema.fromJsonString(Receipt), { onExcessProperty: "error" })(
    new TextDecoder("utf-8", { fatal: true }).decode(bytes),
  );
const rejectionLimit = 256;
const Rejection = Schema.Union([
  Schema.Struct({ key: Digest }),
  Schema.Struct({
    version: Schema.Literal(2),
    keys: Schema.Array(Digest).check(Schema.isMinLength(1), Schema.isMaxLength(rejectionLimit)),
  }),
  Schema.Struct({ version: Schema.Literal(2), blocked: Schema.Literal(true) }),
]);
const rejectionPath = (task: Task): string =>
  `${cacheDirectory}/rejected-${task.kind}-${task.id}.json`;
async function readRejections(root: string, task: Task): Promise<readonly string[]> {
  try {
    const rejection = Schema.decodeUnknownSync(Schema.fromJsonString(Rejection), {
      onExcessProperty: "error",
    })(
      new TextDecoder("utf-8", { fatal: true }).decode(
        await boundedRead(root, rejectionPath(task), 32 * 1024),
      ),
    );
    if ("blocked" in rejection)
      throw new Error("Verification rejection history is blocked; inspect retained receipts");
    return "keys" in rejection ? rejection.keys : [rejection.key];
  } catch (error) {
    if (hasCode(error, "ENOENT")) return [];
    throw error;
  }
}
async function updateRejections(
  root: string,
  task: Task,
  changedKeys: readonly string[],
  rejected: boolean,
): Promise<void> {
  const keys = new Set(await readRejections(root, task));
  for (const key of changedKeys) {
    if (rejected) keys.add(key);
    else keys.delete(key);
  }
  if (keys.size > rejectionLimit) {
    await atomicJson(root, rejectionPath(task), { version: 2, blocked: true });
    throw new Error("Verification rejection history exceeds bounds; inspect retained receipts");
  }
  if (keys.size) {
    await atomicJson(root, rejectionPath(task), { version: 2, keys: [...keys].sort() });
  } else {
    await unlink(await safePath(root, rejectionPath(task), true)).catch((error: unknown) => {
      if (!hasCode(error, "ENOENT")) throw error;
    });
  }
}
type ReceiptSnapshot = { readonly receipt: Receipt; readonly bytes: Uint8Array };
async function readReceipt(root: string, path: string): Promise<ReceiptSnapshot | undefined> {
  try {
    const bytes = await boundedRead(root, path, cacheLimits.receiptBytes);
    return { receipt: decodeReceipt(bytes), bytes };
  } catch (error) {
    if (hasCode(error, "EACCES") || hasCode(error, "EPERM")) throw error;
    return undefined;
  }
}
async function matches(
  root: string,
  task: Task,
  identity: Awaited<ReturnType<typeof inputIdentity>>,
): Promise<(ReceiptSnapshot & { readonly path: string }) | undefined> {
  try {
    if ((await readRejections(root, task)).includes(identity.key)) return undefined;
  } catch {
    return undefined;
  }
  for (const path of receiptPaths(task)) {
    const snapshot = await readReceipt(root, path);
    if (!snapshot) continue;
    const { receipt } = snapshot;
    if (
      receipt.id !== task.id ||
      receipt.kind !== task.kind ||
      receipt.definition !== identity.definition ||
      receipt.projection !== identity.projection ||
      receipt.external !== identity.external ||
      receipt.key !== identity.key ||
      JSON.stringify(receipt.runtime) !== JSON.stringify(identity.runtime) ||
      JSON.stringify(receipt.inputs) !== JSON.stringify(task.inputs) ||
      JSON.stringify(receipt.excludeInputs) !== JSON.stringify(task.excludeInputs)
    )
      continue;
    if (task.kind !== "build") return { path, ...snapshot };
    try {
      if (receipt.output === (await inventory(root, task.outputs, true)))
        return { path, ...snapshot };
    } catch (error) {
      if (hasCode(error, "EACCES") || hasCode(error, "EPERM")) throw error;
    }
  }
  return undefined;
}
export async function runCachedTask(
  root: string,
  definition: CacheTask,
  run: () => Promise<void>,
  options: {
    readonly forceFresh?: boolean;
    readonly validate?: () => Promise<void>;
    readonly receiptWritePolicy?: VerificationWritePolicy;
  } = {},
): Promise<{ hit: boolean; key: string }> {
  const task = normalize(definition);
  const writePolicy =
    task.kind === "verification" && task.portable !== false
      ? (options.receiptWritePolicy ?? resolveVerificationWritePolicy(process.env))
      : "local";
  const writePath = writePolicy === "tracked" ? receiptPath(task) : localReceiptPath(task);
  return withCacheLock(root, `${task.kind}-${task.id}`, async () => {
    const before = await inputIdentity(root, task);
    try {
      if (!options.forceFresh && (await matches(root, task, before))) {
        await options.validate?.();
        const validated = await matches(root, task, before);
        if (!validated || (await inputIdentity(root, task)).key !== before.key)
          throw new Error(`Cache inputs or outputs changed during ${task.id} reuse validation`);
        if (writePolicy === "tracked" && validated.path !== writePath)
          await atomicReceiptText(root, writePath, validated.bytes);
        return { hit: true, key: before.key };
      }
      await run();
      const output = task.kind === "build" ? await inventory(root, task.outputs, true) : undefined;
      await options.validate?.();
      if (output !== undefined && output !== (await inventory(root, task.outputs, true)))
        throw new Error(`Build output changed during ${task.id} validation`);
      if ((await inputIdentity(root, task)).key !== before.key)
        throw new Error(
          `Verification inputs changed during ${task.id}; no new receipt was recorded`,
        );
      await atomicJson(root, writePath, {
        version: 1,
        id: task.id,
        kind: task.kind,
        inputs: task.inputs,
        excludeInputs: task.excludeInputs,
        ...before,
        passed: true,
        ...(output === undefined ? {} : { output }),
      });
      await updateRejections(root, task, [before.key], false);
    } catch (error) {
      await updateRejections(root, task, [before.key], true);
      throw error;
    }
    return { hit: false, key: before.key };
  });
}

export async function invalidateCachedTask(root: string, definition: CacheTask): Promise<void> {
  const task = normalize(definition);
  await withCacheLock(root, `${task.kind}-${task.id}`, async () => {
    const keys = new Set<string>();
    for (const path of receiptPaths(task)) {
      const receipt = (await readReceipt(root, path))?.receipt;
      if (
        receipt?.id === task.id &&
        receipt.kind === task.kind &&
        receipt.key === keyFor(receipt.definition, receipt.projection, receipt.external)
      )
        keys.add(receipt.key);
    }
    try {
      keys.add((await inputIdentity(root, task)).key);
    } catch (error) {
      if (keys.size) await updateRejections(root, task, [...keys], true);
      throw error;
    }
    await updateRejections(root, task, [...keys], true);
  });
}

/** Always validate changed staged receipt bytes against the actual staged index. */
export async function checkStagedVerificationCache(
  root: string,
  options: { readonly indexFile?: string } = {},
): Promise<void> {
  const paths = gitText(
    root,
    [
      "diff",
      "--cached",
      "--name-only",
      "--no-renames",
      "--diff-filter=ACMRT",
      "-z",
      "--",
      receiptDirectory,
    ],
    options,
  )
    .split("\0")
    .filter(Boolean);
  if (!paths.length) return;
  const entries = indexEntries(root, options.indexFile);
  for (const path of paths) {
    if (!/^\.verification\/verification-[a-zA-Z0-9][a-zA-Z0-9._-]{0,119}\.json$/u.test(path))
      throw new Error(`Unsupported staged verification receipt: ${path}`);
    const bytes = gitBytes(root, ["show", `:${path}`], options);
    if (bytes.length > cacheLimits.receiptBytes)
      throw new Error("Staged verification receipt exceeds byte bound");
    const saved = decodeReceipt(bytes);
    const task = normalize({
      id: saved.id,
      kind: saved.kind,
      inputs: saved.inputs,
      excludeInputs: saved.excludeInputs,
    });
    const current = projection(entries, task);
    if (
      saved.kind !== "verification" ||
      path !== receiptPath(task) ||
      current !== saved.projection ||
      saved.key !== keyFor(saved.definition, current, saved.external)
    )
      throw new Error(`Staged receipt does not describe staged inputs: ${path}`);
  }
}

/** Repository/history equivalence is cooperative evidence, not execution attestation. */
export async function verificationCacheStatus(
  root: string,
  id: string,
): Promise<{ commit: string | null; repositoryInputsMatch: boolean }> {
  const task = normalize({ id, kind: "verification" });
  const path = receiptPath(task);
  const candidate = gitText(root, ["log", "-1", "--format=%H", "--", path]).trim();
  if (!candidate) return { commit: null, repositoryInputsMatch: false };
  let commit: string | null = candidate;
  if (
    gitText(root, ["rev-parse", "--is-shallow-repository"]).trim() === "true" &&
    !gitText(root, ["rev-list", "--parents", "-n", "1", candidate]).trim().includes(" ")
  )
    commit = null;
  try {
    const bytes = gitBytes(root, ["show", `${candidate}:${path}`]);
    if (bytes.length > cacheLimits.receiptBytes)
      throw new Error("Historical receipt exceeds byte bound");
    const saved = decodeReceipt(bytes);
    const definition = normalize({
      id: saved.id,
      kind: saved.kind,
      inputs: saved.inputs,
      excludeInputs: saved.excludeInputs,
    });
    return {
      commit,
      repositoryInputsMatch:
        saved.id === id &&
        saved.kind === "verification" &&
        saved.projection === (await workingProjection(root, definition)) &&
        saved.key === keyFor(saved.definition, saved.projection, saved.external),
    };
  } catch {
    return { commit, repositoryInputsMatch: false };
  }
}
