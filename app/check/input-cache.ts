/** Adapted from Trigon's cooperative input cache at 454e372c; hashes actual working bytes. */
import { lstat, unlink } from "node:fs/promises";
import { isAbsolute, relative, resolve } from "node:path";
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
import { sharedResultOwner, type SharedResultOwner } from "./shared-result-owner.ts";
import {
  beginSharedResult,
  completeSharedResult,
  failSharedResult,
  inspectSharedResult,
  invalidateSharedResult,
  sharedResultDirectory,
  type SharedAttempt,
  type SharedSnapshot,
} from "./shared-results.ts";

export interface CacheTask {
  readonly id: string;
  readonly kind: "verification" | "build";
  readonly inputs?: readonly string[];
  readonly excludeInputs?: readonly string[];
  readonly outputs?: readonly string[];
  readonly externalInputs?: readonly string[];
  readonly values?: readonly string[];
  readonly portable?: boolean;
  /** Storage selection only; never excludes identity inputs or live prerequisites. */
  readonly shared?: boolean;
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
const GitInspectionText = Schema.String.check(Schema.isMaxLength(16 * 1024 ** 2));
const GitObjectFormat = Schema.Literals(["sha1", "sha256"]);
const GitIndexEntry = Schema.Struct({
  mode: Schema.String.check(Schema.isPattern(/^[0-7]{6}$/u)),
  object: Schema.String.check(Schema.isPattern(/^(?:[a-f0-9]{40}|[a-f0-9]{64})$/u)),
  stage: Schema.Literal("0"),
  path: Schema.NonEmptyString,
});
const decodeInspectionText = Schema.decodeUnknownSync(GitInspectionText);
const decodeObjectFormat = Schema.decodeUnknownSync(GitObjectFormat);
const decodeIndexEntry = Schema.decodeUnknownSync(GitIndexEntry);

function inspectionText(input: unknown): string {
  try {
    const text = decodeInspectionText(input);
    if (Buffer.byteLength(text) > 16 * 1024 ** 2) throw new Error("Oversized Git inspection");
    return text;
  } catch {
    throw new Error("Git inventory inspection requires bounded UTF-8 text");
  }
}

/** One fresh observation; the optional query is a trusted host/test port, never configuration. */
export function workingInventory(
  root: string,
  query: (args: readonly string[]) => unknown = (args) => gitText(root, args),
): {
  readonly format: typeof GitObjectFormat.Type;
  readonly indexed: ReadonlyMap<string, Entry>;
  readonly names: ReadonlySet<string>;
} {
  const metadata = inspectionText(
    query(["rev-parse", "--show-object-format=storage", "--show-toplevel"]),
  );
  const separator = metadata.indexOf("\n");
  if (separator < 0 || !metadata.endsWith("\n"))
    throw new Error("Git repository metadata requires complete LF framing");
  let format: typeof GitObjectFormat.Type;
  try {
    format = decodeObjectFormat(metadata.slice(0, separator));
  } catch {
    throw new Error("Unsupported or malformed Git object format");
  }
  // The root may itself contain LF on POSIX. Only the first and final delimiters are framing.
  const top = metadata.slice(separator + 1, -1);
  if (top.includes("\0") || !isAbsolute(top) || relative(resolve(top), resolve(root)))
    throw new Error("Verification cache requires the actual repository root");
  const text = inspectionText(
    query(["ls-files", "--cached", "--stage", "--others", "--exclude-standard", "-t", "-z"]),
  );
  const indexed = new Map<string, Entry>();
  const names = new Set<string>();
  let offset = 0;
  while (offset < text.length) {
    const end = text.indexOf("\0", offset);
    if (end < 0) throw new Error("Git inventory is not NUL-terminated");
    const row = text.slice(offset, end);
    offset = end + 1;
    let path: string;
    if (row.startsWith("? ")) {
      path = scopePath(row.slice(2));
    } else {
      const match = /^[HS] ([0-7]{6}) ([a-f0-9]+) ([0-3])\t([\s\S]+)$/u.exec(row);
      let entry: typeof GitIndexEntry.Type;
      try {
        entry = decodeIndexEntry({
          mode: match?.[1],
          object: match?.[2],
          stage: match?.[3],
          path: match?.[4],
        });
        if (entry.object.length !== (format === "sha1" ? 40 : 64))
          throw new Error("Git object format mismatch");
      } catch {
        throw new Error("Cannot verify an unmerged or malformed Git index");
      }
      path = scopePath(entry.path);
      indexed.set(path, { mode: entry.mode, object: entry.object });
      if (indexed.size > 100_000) throw new Error("Git index exceeds verification bounds");
    }
    if (names.has(path)) throw new Error("Git inventory contains a duplicate path");
    names.add(path);
    if (names.size > 100_000) throw new Error("Git inventory exceeds verification bounds");
  }
  return { format, indexed, names };
}
const engineInputs = ["app/check", "app/workflow", ".gitattributes", ".gitignore"];
const systemPath = (path: string): boolean =>
  contains(receiptDirectory, path.toLowerCase()) ||
  contains(cacheDirectory, path.toLowerCase()) ||
  contains(sharedResultDirectory, path.toLowerCase());
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
        contains(path.toLowerCase(), cacheDirectory) ||
        contains(path.toLowerCase(), sharedResultDirectory),
    )
  )
    throw new Error("Cache outputs cannot contain receipts or locks");
  if (task.kind === "build" && !outputs.length)
    throw new Error("Build cache requires complete output paths");
  if (task.shared && (task.kind !== "verification" || task.portable === false || outputs.length))
    throw new Error("Shared results require portable verification without output paths");
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
  const { indexed, names, format } = workingInventory(root);
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
  shared?: SharedSnapshot,
): Promise<(ReceiptSnapshot & { readonly path: string }) | undefined> {
  // Submitted or restored receipts are cooperative evidence, not independent CI
  // results. Actions must execute verification even when every input matches.
  if (task.kind === "verification" && process.env.GITHUB_ACTIONS === "true") return undefined;
  try {
    if ((await readRejections(root, task)).includes(identity.key)) return undefined;
  } catch {
    return undefined;
  }
  const current =
    shared ??
    (task.shared
      ? await inspectSharedResult(await sharedResultOwner(root), identity.key)
      : undefined);
  if (current?.blocked) return undefined;
  const candidates: Array<ReceiptSnapshot & { path: string }> = [];
  for (const path of receiptPaths(task)) {
    const snapshot = await readReceipt(root, path);
    if (snapshot) candidates.push({ path, ...snapshot });
  }
  if (current?.bytes)
    candidates.push({
      path: "shared",
      bytes: current.bytes,
      receipt: decodeReceipt(current.bytes),
    });
  for (const snapshot of candidates) {
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
    if (task.kind !== "build") return snapshot;
    try {
      if (receipt.output === (await inventory(root, task.outputs, true))) return snapshot;
    } catch (error) {
      if (hasCode(error, "EACCES") || hasCode(error, "EPERM")) throw error;
    }
  }
  return undefined;
}
/** A host must settle this executed check after its complete live prerequisite barrier. */
export interface PendingCachedTask {
  readonly complete: () => Promise<void>;
  readonly fail: () => Promise<void>;
}
export interface CachedTaskResult {
  readonly hit: boolean;
  readonly key: string;
  readonly sharedUnavailable?: "capacity";
  readonly pending?: PendingCachedTask;
}
export async function runCachedTask(
  root: string,
  definition: CacheTask,
  run: () => Promise<void>,
  options: {
    readonly forceFresh?: boolean;
    readonly validate?: () => Promise<void>;
    readonly receiptWritePolicy?: VerificationWritePolicy;
    readonly sharedUnavailable?: (reason: "capacity") => void;
    /** Shared verification only: retain running evidence until the host's final live barrier. */
    readonly deferReceipt?: boolean;
  } = {},
): Promise<CachedTaskResult> {
  const task = normalize(definition);
  if (options.deferReceipt && !task.shared)
    throw new Error("Deferred receipts require shared portable verification");
  const writePolicy =
    task.kind === "verification" && task.portable !== false
      ? (options.receiptWritePolicy ?? resolveVerificationWritePolicy(process.env))
      : "local";
  const writePath = writePolicy === "tracked" ? receiptPath(task) : localReceiptPath(task);
  return withCacheLock(root, `${task.kind}-${task.id}`, async () => {
    const before = await inputIdentity(root, task);
    const owner = task.shared ? await sharedResultOwner(root) : undefined;
    let attempt: SharedAttempt | undefined;
    let capacityUnavailable = false;
    let terminal = false;
    let rejected = false;
    const rejectResult = async (): Promise<void> => {
      if (rejected) return;
      const failures: unknown[] = [];
      try {
        await updateRejections(root, task, [before.key], true);
      } catch (failure) {
        failures.push(failure);
      }
      if (owner) {
        try {
          await owner.refresh();
          if (attempt && !terminal) {
            await failSharedResult(owner, attempt);
            terminal = true;
          } else await invalidateSharedResult(owner, before.key);
        } catch (failure) {
          failures.push(
            new Error(
              "Shared verification invalidation is unconfirmed; retained evidence requires inspection",
              { cause: failure },
            ),
          );
        }
      }
      if (failures.length)
        throw new AggregateError(failures, "Verification rejection updates were unconfirmed");
      rejected = true;
    };
    const rejectAndThrow = async (error: unknown): Promise<never> => {
      try {
        await rejectResult();
      } catch (failure) {
        throw new AggregateError(
          [error, failure],
          "Verification failed; one or more rejection updates were unconfirmed",
        );
      }
      throw error;
    };
    try {
      const shared = owner ? await inspectSharedResult(owner, before.key) : undefined;
      if (!options.forceFresh && (await matches(root, task, before, shared))) {
        await options.validate?.();
        await owner?.refresh();
        const checked = owner ? await inspectSharedResult(owner, before.key) : undefined;
        const validated = await matches(root, task, before, checked);
        if (!validated || (await inputIdentity(root, task)).key !== before.key)
          throw new Error(`Cache inputs or outputs changed during ${task.id} reuse validation`);
        if (owner && (await inspectSharedResult(owner, before.key)).stamp !== shared?.stamp)
          throw new Error(`Shared verification state changed during ${task.id} reuse validation`);
        if (writePolicy === "tracked" && validated.path !== writePath)
          await atomicReceiptText(root, writePath, validated.bytes);
        if (owner && (await inspectSharedResult(owner, before.key)).stamp !== shared?.stamp)
          throw new Error(`Shared verification state changed during ${task.id} receipt promotion`);
        return { hit: true, key: before.key };
      }
      if (owner) {
        attempt = await beginSharedResult(owner, before.key);
        capacityUnavailable = attempt === undefined;
        if (capacityUnavailable) options.sharedUnavailable?.("capacity");
      }
      await run();
      const output = task.kind === "build" ? await inventory(root, task.outputs, true) : undefined;
      await options.validate?.();
      if (output !== undefined && output !== (await inventory(root, task.outputs, true)))
        throw new Error(`Build output changed during ${task.id} validation`);
      await owner?.refresh();
      if ((await inputIdentity(root, task)).key !== before.key)
        throw new Error(
          `Verification inputs changed during ${task.id}; no new receipt was recorded`,
        );
      const receipt = {
        version: 1,
        id: task.id,
        kind: task.kind,
        inputs: task.inputs,
        excludeInputs: task.excludeInputs,
        ...before,
        passed: true,
        ...(output === undefined ? {} : { output }),
      };
      if (options.deferReceipt) {
        let completed = false;
        const pending: PendingCachedTask = {
          complete: () =>
            withCacheLock(root, `${task.kind}-${task.id}`, async () => {
              if (completed || rejected)
                throw new Error("Deferred verification has already been settled");
              try {
                await options.validate?.();
                await owner?.refresh();
                if ((await inputIdentity(root, task)).key !== before.key)
                  throw new Error(
                    `Verification inputs changed before ${task.id} receipt publication`,
                  );
                // The shared generation also orders local receipt writes. An older pending run
                // must not clear a newer same-checkout rejection after releasing its task lock.
                if (owner && attempt) {
                  const published = await completeSharedResult(
                    owner,
                    attempt,
                    new TextEncoder().encode(`${JSON.stringify(receipt)}\n`),
                  );
                  terminal = true;
                  if (published) {
                    await atomicJson(root, writePath, receipt);
                    await updateRejections(root, task, [before.key], false);
                  }
                }
                // Capacity disables all reuse. Without an attempt epoch, leave local evidence
                // and rejection history unchanged rather than infer an execution ordering.
                completed = true;
              } catch (error) {
                await rejectAndThrow(error);
              }
            }),
          fail: () => withCacheLock(root, `${task.kind}-${task.id}`, rejectResult),
        };
        return {
          hit: false,
          key: before.key,
          pending,
          ...(capacityUnavailable ? { sharedUnavailable: "capacity" as const } : {}),
        };
      }
      await atomicJson(root, writePath, receipt);
      await updateRejections(root, task, [before.key], false);
      if (owner && attempt) {
        await completeSharedResult(
          owner,
          attempt,
          new TextEncoder().encode(`${JSON.stringify(receipt)}\n`),
        );
        terminal = true;
      }
    } catch (error) {
      await rejectAndThrow(error);
    }
    return {
      hit: false,
      key: before.key,
      ...(capacityUnavailable ? { sharedUnavailable: "capacity" as const } : {}),
    };
  });
}

export async function invalidateCachedTask(
  root: string,
  definition: CacheTask,
  capturedKey?: string,
): Promise<void> {
  const task = normalize(definition);
  const captured =
    capturedKey === undefined ? undefined : Schema.decodeUnknownSync(Digest)(capturedKey);
  await withCacheLock(root, `${task.kind}-${task.id}`, async () => {
    const keys = new Set<string>(captured === undefined ? [] : [captured]);
    for (const path of receiptPaths(task)) {
      const receipt = (await readReceipt(root, path))?.receipt;
      if (
        receipt?.id === task.id &&
        receipt.kind === task.kind &&
        receipt.key === keyFor(receipt.definition, receipt.projection, receipt.external)
      )
        keys.add(receipt.key);
    }
    let hashingFailure: unknown;
    try {
      keys.add((await inputIdentity(root, task)).key);
    } catch (error) {
      hashingFailure = error;
    }
    const failures: unknown[] = hashingFailure === undefined ? [] : [hashingFailure];
    try {
      if (keys.size) await updateRejections(root, task, [...keys], true);
    } catch (error) {
      failures.push(error);
    }
    if (task.shared) {
      let owner: SharedResultOwner | undefined;
      try {
        owner = await sharedResultOwner(root);
      } catch (error) {
        failures.push(error);
      }
      if (owner)
        for (const key of keys) {
          try {
            await invalidateSharedResult(owner, key);
          } catch (error) {
            failures.push(error);
          }
        }
    }
    if (failures.length)
      throw new AggregateError(failures, "Verification invalidation was not fully confirmed");
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
