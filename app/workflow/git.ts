import { lstat, mkdir, mkdtemp, readFile, rm } from "node:fs/promises";
import { isAbsolute, join, resolve } from "node:path";
import { homedir } from "node:os";
import { createHash } from "node:crypto";
import { Schema } from "effect";
import { Path, Policy, type Snapshot, type Task } from "./model.ts";
import { atomicText, boundedText, containedPath, digest, workflowCapacity } from "./storage.ts";
import { diagnostic, runProcess, type ProcessResult } from "./process.ts";
import { currentBunEnvironment } from "../check/toolchain.ts";
import { gitPlatformArguments } from "../check/git-platform.ts";
import { resolveGitExecution } from "../check/git-execution.ts";

export type Git = (args: readonly string[], input?: string, index?: string) => Promise<string>;
export const GitObjectId = Schema.String.check(
  Schema.isPattern(/^[a-f0-9]{40}(?:[a-f0-9]{24})?$/u),
);
const SigningValue = Schema.String.check(Schema.isMaxLength(16384));
const SigningConfiguration = Schema.Struct({
  "commit.gpgsign": SigningValue,
  "gpg.format": SigningValue,
  "user.signingkey": SigningValue,
  "gpg.ssh.allowedsignersfile": SigningValue,
});
const ConfigurationEntry = Schema.Tuple([
  Schema.NonEmptyString.check(Schema.isMaxLength(4096)),
  SigningValue,
]);

function configurationValues(input: unknown, keys: readonly string[]): Record<string, string> {
  const text = Schema.decodeUnknownSync(Schema.String.check(Schema.isMaxLength(65536)))(input);
  if (Buffer.byteLength(text) > 65536 || !text.endsWith("\0"))
    throw new Error("Invalid configuration framing");
  const rows = text.slice(0, -1).split("\0");
  if (rows.length > 256) throw new Error("Configuration entry bound exceeded");
  const values: Record<string, string> = {};
  for (const row of rows) {
    const separator = row.indexOf("\n");
    if (separator < 1) throw new Error("Invalid configuration entry");
    const [key, value] = Schema.decodeUnknownSync(ConfigurationEntry)([
      row.slice(0, separator),
      row.slice(separator + 1),
    ]);
    if (!keys.includes(key)) throw new Error("Unexpected configuration key");
    // Git emits all matching values in precedence order; --get uses the last.
    values[key] = value.trim();
  }
  if (keys.some((key) => values[key] === undefined)) throw new Error("Missing configuration key");
  return values;
}

function signingConfiguration(input: unknown): typeof SigningConfiguration.Type {
  try {
    const values = configurationValues(input, Object.keys(SigningConfiguration.fields));
    return Schema.decodeUnknownSync(SigningConfiguration)(values, { onExcessProperty: "error" });
  } catch {
    throw new Error("Signing configuration response is malformed or exceeds bounds");
  }
}
export class GitFailure extends Error {
  constructor(readonly result: ProcessResult) {
    super(
      `Git failed (${result.outcome}; exit ${result.code ?? "unknown"}; termination ${result.termination ?? "unknown"}); inspect the retained diagnostic`,
    );
  }
}
export function gitEnvironment(index?: string): Record<string, string | undefined> {
  const env = {
    ...currentBunEnvironment(process.env),
    GIT_TERMINAL_PROMPT: "0",
    GCM_INTERACTIVE: "never",
    GIT_OPTIONAL_LOCKS: "0",
  };
  for (const name of Object.keys(env))
    if (
      /^GIT_(?:DIR|WORK_TREE|INDEX_FILE|COMMON_DIR|OBJECT_DIRECTORY|ALTERNATE_OBJECT_DIRECTORIES|NAMESPACE|PREFIX|CONFIG(?:_.*)?|QUARANTINE_PATH|INTERNAL_SUPER_PREFIX|IMPLICIT_WORK_TREE|SHALLOW_FILE|GRAFT_FILE|REPLACE_REF_BASE)$/u.test(
        name,
      )
    )
      Reflect.deleteProperty(env, name);
  return { ...env, ...(index ? { GIT_INDEX_FILE: index } : {}) };
}
export function gitAt(root: string): Git {
  let diagnostics = Promise.resolve();
  return async (args, input, index) => {
    const execution = await resolveGitExecution(root, gitEnvironment(index));
    const result = await runProcess(
      root,
      execution.executable,
      gitPlatformArguments(["-c", "core.fsmonitor=false", ...args]),
      {
        ...(input === undefined ? {} : { input }),
        timeoutMs: args.includes("commit") ? 600_000 : 60_000,
        env: execution.env,
      },
    );
    if (result.code !== 0 || result.outcome !== "exited") {
      // Read pairs may finish together; keep shared failure inventory/publication sequential.
      const recorded = diagnostics.then(async () => {
        await workflowCapacity(root, 8192);
        await atomicText(
          join(root, ".cache/workflow/last-git-error.txt"),
          diagnostic(result.stderr).slice(-6000) + "\n",
        );
      });
      diagnostics = recorded.then(
        () => {},
        () => {},
      );
      await recorded;
      throw new GitFailure({ ...result, stdout: "", stderr: "" });
    }
    return result.stdout;
  };
}
export const paths = (text: string): string[] => text.split("\0").filter(Boolean);
/** Only independent reads share a pair; every started process settles before returning. */
async function readPair(
  git: Git,
  first: readonly string[],
  second: readonly string[],
): Promise<readonly [string, string]> {
  const [left, right] = await Promise.allSettled([
    Promise.resolve().then(() => git(first)),
    Promise.resolve().then(() => git(second)),
  ]);
  if (left.status === "rejected" && right.status === "rejected")
    throw new AggregateError([left.reason, right.reason], "Both Git read operations failed");
  if (left.status === "rejected") throw left.reason;
  if (right.status === "rejected") throw right.reason;
  return [left.value, right.value];
}

/** One observation boundary owns at most two active and eight admitted Git reads. */
function observationGit(git: Git): Git {
  let active = 0;
  const waiting: Array<() => void> = [];
  return async (args, input, index) => {
    if (input !== undefined || index !== undefined || active + waiting.length >= 8)
      throw new Error("Git observation admission exceeded its read-only bound");
    await new Promise<void>((start) => {
      if (active < 2) {
        active++;
        start();
      } else waiting.push(start);
    });
    try {
      return await git(args);
    } finally {
      const next = waiting.shift();
      if (next) next();
      else active--;
    }
  };
}

function requireJoinedReads(results: readonly PromiseSettledResult<unknown>[]): void {
  const failures: unknown[] = [];
  for (const result of results) {
    if (result.status === "rejected") {
      const reason: unknown = result.reason;
      failures.push(reason);
    }
  }
  if (failures.length === 1) throw failures[0];
  if (failures.length) throw new AggregateError(failures, "Git observation operations failed");
}

function observedValue<T>(result: PromiseSettledResult<T>): T {
  if (result.status === "rejected") throw result.reason;
  return result.value;
}
export async function changedPaths(git: Git): Promise<string[]> {
  const [tracked, untracked] = await readPair(
    git,
    ["diff", "HEAD", "--name-only", "--no-renames", "-z"],
    ["ls-files", "--others", "--exclude-standard", "-z"],
  );
  return [...new Set([...paths(tracked), ...paths(untracked)])].sort();
}
export function publicPath(path: string): void {
  Schema.decodeUnknownSync(Path)(path);
  if (
    /^(?:\.git|\.cache|node_modules)(?:\/|$)/iu.test(path) ||
    (/(?:^|\/)\.env(?:\..*)?$/iu.test(path) && !path.endsWith(".env.example") && path !== ".env") ||
    /(?:^|\/)(?:fnox\.local\.[^/]+|[^/]*\.pem|[^/]*\.key)$/iu.test(path)
  )
    throw new Error("Private settings or generated state cannot enter publication scope");
}
/** Keep deletions already removed from the index while staging the remaining literal scope. */
export async function stageScope(root: string, git: Git, files: readonly string[]): Promise<void> {
  if (!files.length || files.length > 10000 || new Set(files).size !== files.length)
    throw new Error("Invalid publication scope count or duplicate path");
  for (const path of files) publicPath(path);
  // Full path rows are NUL-framed and can form one overlong process-output line.
  // Numeric LF records retain the global conflict/count check without printing paths.
  const stages = await git(["ls-files", "--format=%(stage)"]);
  if (stages.length > 200000) throw new Error("Git index exceeds publication bounds");
  if (stages && !stages.endsWith("\n"))
    throw new Error("Cannot stage an unmerged or malformed Git index");
  const rows = stages ? stages.slice(0, -1).split("\n") : [];
  if (rows.length > 100000) throw new Error("Git index exceeds publication bounds");
  if (rows.some((stage) => stage !== "0"))
    throw new Error("Cannot stage an unmerged or malformed Git index");
  const selected = new Set<string>();
  const absent: string[] = [];
  for (const path of files) {
    let present = false;
    try {
      const info = await lstat(await containedPath(root, path));
      if (!info.isFile()) throw new Error("Publication scope must contain regular files");
      present = true;
    } catch (error) {
      if (!(error instanceof Error && "code" in error && error.code === "ENOENT")) throw error;
    }
    if (present) selected.add(path);
    else absent.push(path);
  }
  // Only absent scope members need index membership, and a literal pathspec can
  // still select a directory prefix. Reject every row outside the exact batch.
  let batch: string[] = [];
  let argumentBytes = 0;
  const inspectAbsent = async (): Promise<void> => {
    if (!batch.length) return;
    const text = await git(["--literal-pathspecs", "ls-files", "--stage", "-z", "--", ...batch]);
    if (Buffer.byteLength(text) > 65536 || (text && !text.endsWith("\0")))
      throw new Error("Malformed or oversized scoped Git index response");
    const members = new Set(batch);
    const found = new Set<string>();
    const records = text ? text.slice(0, -1).split("\0") : [];
    if (records.length > batch.length) throw new Error("Unexpected scoped Git index membership");
    for (const row of records) {
      const match = /^[0-7]{6} [a-f0-9]{40}(?:[a-f0-9]{24})? 0\t([\s\S]+)$/u.exec(row);
      const path = match?.[1];
      if (!path || !members.has(path) || found.has(path))
        throw new Error("Unmerged, malformed or unexpected scoped Git index membership");
      found.add(path);
      selected.add(path);
    }
    batch = [];
    argumentBytes = 0;
  };
  for (const path of absent) {
    const bytes = Buffer.byteLength(path) + 1;
    if (bytes > 16384) throw new Error("Publication scope argument exceeds its bound");
    if (batch.length >= 64 || argumentBytes + bytes > 16384) await inspectAbsent();
    batch.push(path);
    argumentBytes += bytes;
  }
  await inspectAbsent();
  if (selected.size)
    await git(
      ["--literal-pathspecs", "add", "--pathspec-from-file=-", "--pathspec-file-nul"],
      files.filter((path) => selected.has(path)).join("\0") + "\0",
    );
}
export async function fileHash(root: string, path: string): Promise<string> {
  publicPath(path);
  const target = await containedPath(root, path);
  try {
    const info = await lstat(target);
    if (!info.isFile() || info.size > 64 * 1024 * 1024)
      throw new Error("Invalid or oversized scope file");
    return digest(await readFile(target));
  } catch (error) {
    if (error instanceof Error && "code" in error && error.code === "ENOENT") return "deleted";
    throw error;
  }
}
export async function readPolicy(root: string): Promise<{ policy: Policy; hash: string }> {
  const raw = await boundedText(await containedPath(root, ".workflow.json"), 4096);
  const policy = Schema.decodeUnknownSync(Schema.fromJsonString(Policy))(raw, {
    onExcessProperty: "error",
  });
  return { policy, hash: digest(raw) };
}
export async function destination(
  git: Git,
  policy: Policy,
): Promise<Omit<Snapshot, "head" | "changes">> {
  const branch = (await git(["symbolic-ref", "--short", "HEAD"])).trim();
  return await destinationForBranch(git, policy, branch);
}
function revisionPair(input: unknown): readonly [string, string] {
  const text = Schema.decodeUnknownSync(Schema.String.check(Schema.isMaxLength(8192)))(input);
  if (Buffer.byteLength(text) > 8192 || !text.endsWith("\n") || /[\r\0]/u.test(text))
    throw new Error("Invalid revision observation framing");
  return Schema.decodeUnknownSync(
    Schema.Tuple([
      Schema.NonEmptyString.check(Schema.isMaxLength(4096)),
      Schema.NonEmptyString.check(Schema.isMaxLength(1024)),
    ]),
  )(text.slice(0, -1).split("\n"), { onExcessProperty: "error" });
}
function symbolicBranch(ref: string): string | null {
  if (ref === "HEAD") return null;
  if (!/^refs\/heads\/[^ \p{Cc}]+$/u.test(ref)) throw new Error("Invalid symbolic HEAD");
  return ref.slice("refs/heads/".length);
}
/** Fresh HEAD identity and branch share one Git invocation, never a cached observation. */
export async function headAndBranch(git: Git): Promise<{ head: string; branch: string | null }> {
  const response = await git(["rev-parse", "HEAD", "--symbolic-full-name", "HEAD"]);
  try {
    const [head, ref] = revisionPair(response);
    return { head: Schema.decodeUnknownSync(GitObjectId)(head), branch: symbolicBranch(ref) };
  } catch {
    throw new Error("HEAD observation is malformed or exceeds bounds");
  }
}
/** Physical common-directory validation remains the caller's responsibility. */
export async function commonDirectoryAndBranch(
  git: Git,
): Promise<{ directory: string; branch: string | null }> {
  const response = await git([
    "rev-parse",
    "--path-format=absolute",
    "--git-common-dir",
    "--symbolic-full-name",
    "HEAD",
  ]);
  try {
    const [directory, ref] = revisionPair(response);
    if (!isAbsolute(directory)) throw new Error("Common Git directory must be absolute");
    return { directory, branch: symbolicBranch(ref) };
  } catch {
    throw new Error("Repository binding observation is malformed or exceeds bounds");
  }
}

export type RepositoryDirectories = {
  readonly root: string;
  readonly directory: string;
  readonly gitDirectory: string;
};
export type RepositoryObservation = RepositoryDirectories & { readonly branch: string | null };
const repositoryPath = Schema.NonEmptyString.check(
  Schema.isMaxLength(4096),
  Schema.isPattern(/^[^\p{Cc}]+$/u),
);
const repositoryDirectoryArguments = [
  "rev-parse",
  "--path-format=absolute",
  "--show-toplevel",
  "--git-common-dir",
  "--absolute-git-dir",
] as const;
function repositoryRows(input: unknown): string[] {
  const text = Schema.decodeUnknownSync(Schema.String.check(Schema.isMaxLength(16 * 1024)))(input);
  if (Buffer.byteLength(text) > 16 * 1024 || !text.endsWith("\n") || /[\r\0]/u.test(text))
    throw new Error("Invalid repository observation framing");
  return text.slice(0, -1).split("\n");
}
function repositoryDirectoriesOf(
  root: string,
  directory: string,
  gitDirectory: string,
): RepositoryDirectories {
  if (![root, directory, gitDirectory].every(isAbsolute))
    throw new Error("Repository observation requires absolute native paths");
  return { root, directory, gitDirectory };
}
/** One fresh native observation; primary discovery does not require a born HEAD. */
export async function repositoryDirectories(git: Git): Promise<RepositoryDirectories> {
  const response = await git(repositoryDirectoryArguments);
  try {
    const [root, directory, gitDirectory] = Schema.decodeUnknownSync(
      Schema.Tuple([repositoryPath, repositoryPath, repositoryPath]),
    )(repositoryRows(response), { onExcessProperty: "error" });
    return repositoryDirectoriesOf(root, directory, gitDirectory);
  } catch {
    throw new Error("Repository directory observation is malformed or exceeds bounds");
  }
}
/** Linked ownership also binds the native branch in that same fresh invocation. */
export async function repositoryAndBranch(git: Git): Promise<RepositoryObservation> {
  const response = await git([...repositoryDirectoryArguments, "--symbolic-full-name", "HEAD"]);
  try {
    const [root, directory, gitDirectory, ref] = Schema.decodeUnknownSync(
      Schema.Tuple([
        repositoryPath,
        repositoryPath,
        repositoryPath,
        Schema.NonEmptyString.check(Schema.isMaxLength(1024)),
      ]),
    )(repositoryRows(response), { onExcessProperty: "error" });
    return {
      ...repositoryDirectoriesOf(root, directory, gitDirectory),
      branch: symbolicBranch(ref),
    };
  } catch {
    throw new Error("Repository branch observation is malformed or exceeds bounds");
  }
}
export async function destinationObservation(
  git: Git,
  policy: Policy,
): Promise<{ head: string; target: Omit<Snapshot, "head" | "changes"> }> {
  const observed = await headAndBranch(git);
  if (observed.branch === null)
    throw new Error("Branch/upstream is outside the approved publication policy");
  return { head: observed.head, target: await destinationForBranch(git, policy, observed.branch) };
}
async function destinationForBranch(
  git: Git,
  policy: Policy,
  branch: string,
): Promise<Omit<Snapshot, "head" | "changes">> {
  const targetRef =
    policy.version === 2 && /^codex\/[a-z0-9][a-z0-9-]{0,95}$/u.test(branch)
      ? `refs/heads/${branch}`
      : policy.ref;
  if (targetRef !== `refs/heads/${branch}`)
    throw new Error("Branch/upstream is outside the approved publication policy");
  const escaped = branch.replace(/[.*+?^${}()|[\]\\]/gu, "\\$&");
  const response = await git([
    "config",
    "--null",
    "--get-regexp",
    `^branch\\.${escaped}\\.(remote|merge)$`,
  ]);
  let remote: string;
  let ref: string;
  try {
    const values = configurationValues(response, [
      `branch.${branch}.remote`,
      `branch.${branch}.merge`,
    ]);
    const configured = Schema.decodeUnknownSync(
      Schema.Struct({ remote: SigningValue, ref: SigningValue }),
    )({
      remote: values[`branch.${branch}.remote`],
      ref: values[`branch.${branch}.merge`],
    });
    remote = configured.remote;
    ref = configured.ref;
  } catch {
    throw new Error("Upstream configuration response is malformed or exceeds bounds");
  }
  if (remote !== policy.remote || ref !== targetRef || ref !== `refs/heads/${branch}`)
    throw new Error("Branch/upstream is outside the approved publication policy");
  const [fetchText, pushText] = await readPair(
    git,
    ["remote", "get-url", "--all", remote],
    ["remote", "get-url", "--push", "--all", remote],
  );
  const fetch = fetchText.trim();
  const push = pushText.trim();
  if (
    fetch !== push ||
    !/^(?:https:\/\/github\.com\/iki\/teamagent|git@github\.com:iki\/teamagent|ssh:\/\/git@github\.com\/iki\/teamagent)(?:\.git)?$/u.test(
      fetch,
    )
  )
    throw new Error("Remote destination is outside the approved Teamagent repository");
  return { branch, remote, ref, destination: digest(fetch + "\n" + push) };
}
export async function snapshot(root: string, git: Git, policy: Policy): Promise<Snapshot> {
  const read = observationGit(git);
  const observations = await Promise.allSettled([
    changedPaths(read),
    destinationObservation(read, policy),
  ]);
  requireJoinedReads(observations);
  const [changed, identity] = observations;
  const changes: Record<string, string> = {};
  for (const path of observedValue(changed)) changes[path] = await fileHash(root, path);
  return {
    head: observedValue(identity).head,
    ...observedValue(identity).target,
    changes,
  };
}
export async function remoteHeadOrAbsent(
  git: Git,
  remote: string,
  ref: string,
): Promise<string | null> {
  const text = (await git(["ls-remote", "--refs", remote, ref])).trim();
  if (!text) return null;
  const rows = text.split("\n");
  const [sha, name] = (rows[0] ?? "").split(/\s+/u);
  if (rows.length !== 1 || name !== ref || !sha || !/^[a-f0-9]{40,64}$/u.test(sha))
    throw new Error("Cannot verify exact remote branch");
  return sha;
}
export async function remoteHead(git: Git, remote: string, ref: string): Promise<string> {
  const head = await remoteHeadOrAbsent(git, remote, ref);
  if (!head) throw new Error("Cannot verify exact remote branch");
  return head;
}
/** Explicit absence is useful only before task-ref creation; all returned refs remain exact. */
export async function remoteMainAndTaskOrAbsent(
  git: Git,
  branch: string,
): Promise<{ main: string | null; source: string | null }> {
  if (!/^codex\/[a-z0-9][a-z0-9-]{0,95}$/u.test(branch))
    throw new Error("Invalid parallel task branch");
  const mainRef = "refs/heads/main";
  const taskRef = "refs/heads/" + branch;
  const response = await git(["ls-remote", "--refs", "origin", mainRef, taskRef]);
  try {
    const text = Schema.decodeUnknownSync(Schema.String.check(Schema.isMaxLength(2048)))(response);
    if (Buffer.byteLength(text) > 2048 || (text !== "" && !text.endsWith("\n")))
      throw new Error("Invalid remote advertisement framing");
    const rows = text === "" ? [] : text.slice(0, -1).split("\n");
    if (rows.length > 2) throw new Error("Expected at most two remote refs");
    const heads = new Map<string, string>();
    for (const row of rows) {
      const [sha, ref] = Schema.decodeUnknownSync(
        Schema.Tuple([GitObjectId, Schema.String.check(Schema.isMaxLength(256))]),
      )(row.split("\t"), { onExcessProperty: "error" });
      if ((ref !== mainRef && ref !== taskRef) || heads.has(ref))
        throw new Error("Unexpected or duplicate remote ref");
      heads.set(ref, sha);
    }
    return { main: heads.get(mainRef) ?? null, source: heads.get(taskRef) ?? null };
  } catch {
    throw new Error("Remote ref observation is malformed, incomplete or exceeds bounds");
  }
}
/** Integration requires both refs in the same fresh advertisement; neither may be omitted. */
export async function remoteMainAndTask(
  git: Git,
  branch: string,
): Promise<{ main: string; source: string }> {
  const observed = await remoteMainAndTaskOrAbsent(git, branch);
  if (!observed.main || !observed.source)
    throw new Error("Remote ref observation is malformed, incomplete or exceeds bounds");
  return { main: observed.main, source: observed.source };
}
/** Resolve HEAD once, binding the observed commit, tree and sole parent to one immutable object. */
export async function headCommit(
  git: Git,
): Promise<{ commit: string; tree: string; parent: string }> {
  const response = await git(["show", "-s", "--no-notes", "--format=%H%x00%T%x00%P", "HEAD"]);
  try {
    const text = Schema.decodeUnknownSync(Schema.String.check(Schema.isMaxLength(1024)))(response);
    if (Buffer.byteLength(text) > 1024 || !text.endsWith("\n"))
      throw new Error("Invalid commit framing");
    const [commit, tree, parent] = Schema.decodeUnknownSync(
      Schema.Tuple([GitObjectId, GitObjectId, GitObjectId]),
    )(text.slice(0, -1).split("\0"), { onExcessProperty: "error" });
    return { commit, tree, parent };
  } catch {
    throw new Error("Commit observation is malformed or does not have exactly one parent");
  }
}
export async function checkedScope(
  root: string,
  git: Git,
  task: Task,
  checkHead = true,
): Promise<void> {
  const configured = await readPolicy(root);
  if (configured.hash !== task.policyHash)
    throw new Error("Publication policy changed after task start");
  const read = observationGit(git);
  const observations = await Promise.allSettled([
    checkHead
      ? destinationObservation(read, configured.policy)
      : destination(read, configured.policy).then((target) => ({ head: undefined, target })),
    read(["diff", "--cached", "--name-only", "--no-renames", "-z"]),
    changedPaths(read),
  ]);
  requireJoinedReads(observations);
  const [identity, staged, changed] = observations;
  const observed = observedValue(identity);
  const current = observed.target;
  if (Object.entries(current).some(([key, value]) => Reflect.get(task.snapshot, key) !== value))
    throw new Error("Branch or destination changed after task start");
  if (checkHead && observed.head !== task.snapshot.head)
    throw new Error("HEAD changed after task start");
  const scope = task.checkpoint;
  if (!scope) throw new Error("Task has no checkpoint");
  for (const path of paths(observedValue(staged)))
    if (!scope.files.includes(path)) throw new Error("Unrelated staged change");
  for (const path of new Set([...observedValue(changed), ...Object.keys(task.snapshot.changes)])) {
    if (!scope.files.includes(path) && (await fileHash(root, path)) !== task.snapshot.changes[path])
      throw new Error("Unreviewed change outside task scope");
  }
  for (const [path, hash] of Object.entries(scope.hashes))
    if ((await fileHash(root, path)) !== hash) throw new Error("Checkpoint file changed");
  if ((await fileHash(root, scope.archive)) !== scope.archiveHash)
    throw new Error("Frozen archive changed");
}
export async function worktreeTree(root: string, git: Git, stagedTree?: string): Promise<string> {
  const source = Schema.decodeUnknownSync(GitObjectId)(
    stagedTree ?? (await git(["write-tree"])).trim(),
  );
  const parent = await containedPath(root, ".cache/workflow/indexes");
  await mkdir(parent, { recursive: true });
  const temporary = await mkdtemp(join(parent, "index-"));
  const index = join(temporary, "index");
  try {
    await git(["read-tree", source], undefined, index);
    await git(["add", "-A"], undefined, index);
    return (await git(["write-tree"], undefined, index)).trim();
  } finally {
    await rm(temporary, { recursive: true });
  }
}
export async function signingReady(
  root: string,
  git: Git,
): Promise<{ identity: string; fingerprint: string }> {
  const configured = signingConfiguration(
    await git([
      "config",
      "--null",
      "--get-regexp",
      "^(commit\\.gpgsign|gpg\\.format|user\\.signingkey|gpg\\.ssh\\.allowedsignersfile)$",
    ]),
  );
  if (configured["commit.gpgsign"] !== "true" || configured["gpg.format"] !== "ssh")
    throw new Error("Signed SSH commits must remain enabled");
  const key = configured["user.signingkey"];
  const signers = configured["gpg.ssh.allowedsignersfile"];
  if (!key || !signers)
    throw new Error("Configured signing and verification identities are required");
  const localPath = (path: string) =>
    path.startsWith("~/") ? join(homedir(), path.slice(2)) : resolve(root, path);
  // Public material only. Never open the configured private signing key.
  const publicKey = key.startsWith("key::")
    ? key.slice(5)
    : await boundedText(localPath(key.endsWith(".pub") ? key : key + ".pub"), 16384);
  const allowed = await boundedText(localPath(signers), 4 * 1024 * 1024);
  const [algorithm, encoded] = publicKey.trim().split(/\s+/u);
  if (
    !algorithm ||
    !encoded ||
    !/^(?:ssh-|ecdsa-sha2-|sk-)[a-z0-9@.-]+$/u.test(algorithm) ||
    !/^[A-Za-z0-9+/]+={0,2}$/u.test(encoded)
  )
    throw new Error("Invalid configured public signing key");
  const bytes = Buffer.from(encoded, "base64");
  if (
    bytes.length < 16 ||
    bytes.toString("base64").replace(/=+$/u, "") !== encoded.replace(/=+$/u, "")
  )
    throw new Error("Invalid public key encoding");
  const fingerprint =
    "SHA256:" + createHash("sha256").update(bytes).digest("base64").replace(/=+$/u, "");
  return {
    identity: digest(JSON.stringify([key, signers, digest(allowed), fingerprint])),
    fingerprint,
  };
}

/** Verify cryptography separately, then observe both signature fields for the same commit. */
export async function verifyCommitSignature(
  git: Git,
  commit: string,
  expectedFingerprint: string,
): Promise<void> {
  Schema.decodeUnknownSync(GitObjectId)(commit);
  await git(["verify-commit", commit]);
  const response = await git(["show", "-s", "--format=%G?%x00%GF", commit]);
  let signature: readonly [string, string];
  try {
    const text = Schema.decodeUnknownSync(Schema.String.check(Schema.isMaxLength(1024)))(response);
    if (Buffer.byteLength(text) > 1024 || !text.endsWith("\n"))
      throw new Error("Invalid signature framing");
    signature = Schema.decodeUnknownSync(
      Schema.Tuple([
        Schema.String.check(Schema.isPattern(/^[GBUXYREN]$/u)),
        Schema.String.check(Schema.isMaxLength(256)),
      ]),
    )(text.slice(0, -1).split("\0"), { onExcessProperty: "error" });
  } catch {
    throw new Error("Commit signature response is malformed or exceeds bounds");
  }
  if (signature[0] !== "G") throw new Error("Commit signature is not verified");
  if (signature[1] !== expectedFingerprint)
    throw new Error("Commit signer differs from the prepared identity");
}
