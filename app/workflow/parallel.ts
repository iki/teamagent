import { lstat, mkdir, mkdtemp, realpath } from "node:fs/promises";
import { join, resolve } from "node:path";
import { Schema } from "effect";
import { Identity } from "./model.ts";
import {
  gitAt,
  headCommit,
  readPolicy,
  remoteHead,
  remoteMainAndTask,
  remoteHeadOrAbsent,
  signingReady,
  verifyCommitSignature,
  type Git,
} from "./git.ts";
import { containedPath, taskKey, withLock } from "./storage.ts";
import { diagnostic } from "./process.ts";
import { requireHooks, verificationHost, type VerificationHost } from "./workflow.ts";
import {
  ParallelEntry,
  ParallelName,
  assertIntegrationWorkspace,
  loadParallelEntry,
  parallelDestination,
  parallelDirectory,
  parallelName,
  primaryWorktree,
  saveParallelEntry,
} from "./parallel-store.ts";
import {
  PullRequestObservation,
  pullRequestHost,
  validatePullRequest,
  type PullRequestHost,
} from "./parallel-pr.ts";

import { installParallelDependencies, installPreparedCandidate } from "./parallel-install.ts";
import { clean, exactPolicy, sourceTask, sourceCommits } from "./parallel-source.ts";

export { ParallelEntry, parallelDirectory, loadParallelEntry } from "./parallel-store.ts";
export { validatePullRequest, type PullRequestHost } from "./parallel-pr.ts";
export const ParallelRequest = Schema.Union([
  Schema.Struct({
    operation: Schema.Literal("start"),
    ...Identity,
    name: ParallelName,
    install: Schema.optional(Schema.Boolean),
  }),
  Schema.Struct({
    operation: Schema.Literals(["status", "install", "submit", "prepare"]),
    ...Identity,
  }),
  Schema.Struct({
    operation: Schema.Literals(["integrate", "reconcile"]),
    ...Identity,
    prNumber: Schema.optional(
      Schema.Int.check(Schema.isGreaterThan(0), Schema.isLessThanOrEqualTo(2147483647)),
    ),
  }),
]);
export type ParallelHost = {
  git?: (root: string) => Git;
  verification?: VerificationHost;
  install?: (root: string) => Promise<void>;
  pullRequest?: PullRequestHost;
};
export async function parallelWorkflow(
  root: string,
  input: unknown,
  host: ParallelHost = {},
): Promise<{ ok: true; entry: ParallelEntry; localMainUpdated: false }> {
  const request = Schema.decodeUnknownSync(ParallelRequest)(input, { onExcessProperty: "error" });
  if (resolve(await realpath(root)) !== resolve(root))
    throw new Error("Use the actual physical saved checkout");
  const makeGit = host.git ?? gitAt;
  const git = makeGit(root);
  const directory = await parallelDirectory(git);
  const result = (entry: ParallelEntry) => ({
    ok: true as const,
    entry,
    localMainUpdated: false as const,
  });
  if (request.operation === "status") {
    const entry = await loadParallelEntry(git, request.sessionId, request.taskId, {
      registry: directory,
    });
    if (!entry) throw new Error("Parallel task is not registered");
    return result(entry);
  }
  const locations = { registry: directory, primary: await primaryWorktree(git) };
  return await withLock(
    join(directory, ".task-" + taskKey(request.sessionId, request.taskId) + ".lock"),
    async () => {
      let entry = await loadParallelEntry(git, request.sessionId, request.taskId, locations);
      const save = async (value: ParallelEntry): Promise<ParallelEntry> => {
        await saveParallelEntry(git, value, locations);
        entry = value;
        return value;
      };
      const identity = await parallelDestination(git);
      if (request.operation === "start") {
        if (entry) {
          if (entry.name !== request.name || entry.destination !== identity)
            throw new Error("Task already has another worktree identity");
          return result(entry);
        }
        const policy = await readPolicy(root);
        if (policy.policy.version !== 2)
          throw new Error("Parallel work requires adopted policy version 2");
        const base = await remoteHead(git, "origin", "refs/heads/main");
        await git(["fetch", "--no-tags", "origin", "refs/heads/main"]);
        if ((await remoteHead(git, "origin", "refs/heads/main")) !== base)
          throw new Error("Main advanced during worktree preparation");
        await exactPolicy(git, base, policy.hash);
        const primary = locations.primary;
        const name = parallelName(request.name, request.sessionId, request.taskId);
        const path = await containedPath(primary, ".cache/worktrees/" + name);
        const branch = "codex/" + name;
        if ((await remoteHeadOrAbsent(git, "origin", "refs/heads/" + branch)) !== null)
          throw new Error("Task branch already exists remotely");
        await mkdir(await containedPath(primary, ".cache/worktrees"), { recursive: true });
        const created: ParallelEntry = {
          version: 1,
          sessionId: request.sessionId,
          taskId: request.taskId,
          name: request.name,
          path,
          branch,
          base,
          destination: identity,
          policyHash: policy.hash,
          state: "creating",
          source: null,
          main: null,
          result: null,
          workspace: null,
          prNumber: null,
          tree: null,
          reviewKey: null,
          signingIdentity: null,
          fingerprint: null,
          failure: null,
        };
        await save(created);
        try {
          if (
            (await parallelDirectory(git)) !== locations.registry ||
            resolve(await realpath(locations.primary)) !== resolve(locations.primary)
          )
            throw new Error("Repository binding changed before worktree creation");
          await git(["worktree", "add", "-b", branch, path, base]);
          const target = makeGit(path);
          await target(["config", "branch." + branch + ".remote", "origin"]);
          await target(["config", "branch." + branch + ".merge", "refs/heads/" + branch]);
          if (request.install) await (host.install ?? installParallelDependencies)(path);
          await clean(target);
          return result(await save({ ...created, state: "open" }));
        } catch {
          await save({
            ...created,
            state: "failed",
            failure: "Worktree preparation failed; retain and inspect the registered checkout",
          });
          throw new Error("Worktree preparation failed; no automatic retry or cleanup");
        }
      }
      if (!entry || entry.destination !== identity)
        throw new Error("Unknown task or changed destination");
      const expectedPath = await containedPath(
        locations.primary,
        ".cache/worktrees/" + parallelName(entry.name, entry.sessionId, entry.taskId),
      );
      if (
        resolve(entry.path) !== resolve(expectedPath) ||
        (await lstat(entry.path)).isSymbolicLink() ||
        resolve(await realpath(entry.path)) !== resolve(entry.path)
      )
        throw new Error("Registered task worktree location changed");
      const sourceGit = makeGit(entry.path);
      if ((await parallelDirectory(sourceGit)) !== directory)
        throw new Error("Task belongs to a different Git repository");
      if (request.operation === "install") {
        if (entry.state !== "open") throw new Error("Installation requires an open task");
        await clean(sourceGit);
        await (host.install ?? installParallelDependencies)(entry.path);
        await clean(sourceGit);
        return result(entry);
      }
      if (request.operation === "reconcile") {
        if (entry.state === "integrated") {
          if (!entry.result || !entry.source)
            throw new Error("Integrated state lacks its confirmed source or result");
          const observed = await remoteMainAndTask(git, entry.branch);
          if (observed.main !== entry.result || observed.source !== entry.source)
            throw new Error(
              "Remote main differs from the recorded integration; inspect without retrying",
            );
          return result(entry);
        }
        if (
          entry.state === "uncertain" &&
          entry.result &&
          entry.tree &&
          entry.reviewKey &&
          entry.fingerprint &&
          entry.workspace
        ) {
          const observed = await remoteMainAndTask(git, entry.branch);
          if (observed.main !== entry.result || !entry.source || observed.source !== entry.source)
            throw new Error("Integration publication remains unconfirmed; no retry");
          const prepared = makeGit(entry.workspace);
          await assertIntegrationWorkspace(
            git,
            entry,
            entry.workspace,
            prepared,
            entry.base === entry.main && entry.result === entry.source,
            locations,
          );
          await verifyCommitSignature(prepared, entry.result, entry.fingerprint);
          if (
            (await prepared(["rev-parse", "HEAD"])).trim() !== entry.result ||
            (await prepared(["write-tree"])).trim() !== entry.tree ||
            (await signingReady(entry.workspace, prepared)).identity !== entry.signingIdentity
          )
            throw new Error("Prepared integration tree changed");
          await clean(prepared);
          return result(await save({ ...entry, state: "integrated", failure: null }));
        }
        if (entry.state === "uncertain" && entry.source && request.prNumber) {
          const observed = Schema.decodeUnknownSync(PullRequestObservation)(
            await (host.pullRequest ?? pullRequestHost).inspect(entry.path, request.prNumber),
            { onExcessProperty: "error" },
          );
          if (
            observed.number !== request.prNumber ||
            observed.headBranch !== entry.branch ||
            observed.head !== entry.source ||
            observed.baseBranch !== "main" ||
            observed.state !== "OPEN"
          )
            throw new Error("PR creation reconciliation does not match the published task");
          return result(
            await save({ ...entry, state: "open", prNumber: request.prNumber, failure: null }),
          );
        }
        throw new Error(
          "No uncertain publication can be confirmed; retain the attempt for inspection",
        );
      }
      if (entry.state !== "open" && entry.state !== "prepared")
        throw new Error("Previous attempt requires inspection; automatic retries are prohibited");
      const registered = entry;
      const execute = async (): Promise<{
        ok: true;
        entry: ParallelEntry;
        localMainUpdated: false;
      }> => {
        // Reject an invalid prepared checkout before expensive source/trust observations.
        if (
          request.operation === "integrate" &&
          registered.state === "prepared" &&
          registered.workspace &&
          registered.workspace !== registered.path
        )
          await assertIntegrationWorkspace(
            git,
            registered,
            registered.workspace,
            makeGit(registered.workspace),
            false,
            locations,
          );
        const task = await sourceTask(registered, sourceGit, locations);
        const main = await remoteHead(git, "origin", "refs/heads/main");
        const preparedPair =
          registered.state === "prepared" &&
          registered.main === main &&
          registered.source === task.commit;
        // At the exact baseline, both objects are already local and ancestry is reflexive.
        // A matching prepared candidate already owns both objects; refs are still observed live.
        // Fresh advanced main still requires a fetch, and every advanced path checks ancestry.
        if (main !== registered.base && !preparedPair)
          await git([
            "fetch",
            "--no-tags",
            "origin",
            "refs/heads/main",
            "refs/heads/" + registered.branch,
          ]);
        if (
          (await parallelDestination(git)) !== registered.destination ||
          (await remoteHead(git, "origin", "refs/heads/main")) !== main
        )
          throw new Error("Destination or main changed during preparation");
        const policy = await exactPolicy(git, main, registered.policyHash);
        if (main !== registered.base)
          await git(["merge-base", "--is-ancestor", registered.base, main]);
        const signer = await signingReady(registered.path, sourceGit);
        if (signer.identity !== task.signingIdentity)
          throw new Error("Signing trust differs from published task");
        const commits = await sourceCommits(sourceGit, registered, task, signer.fingerprint);
        const source = commits[0];
        if (!source) throw new Error("Missing published task commit");
        const pr = host.pullRequest ?? pullRequestHost;
        if (request.operation === "submit") {
          if (policy.mode !== "pr" || registered.prNumber !== null || registered.state !== "open")
            throw new Error("Explicit PR mode and an unsubmitted open task are required");
          const pending = await save({
            ...registered,
            state: "submitting",
            source: task.commit,
            main,
          });
          try {
            const number = await pr.create(
              registered.path,
              registered.branch,
              task.checkpoint?.message.split("\n")[0] ?? "chore: Integrate task",
              "Reviewed task " +
                taskKey(registered.sessionId, registered.taskId) +
                "\n\nPublic implementation record: " +
                task.checkpoint?.archive +
                "\n\nIntegration preserves signed task commits and verifies the combined main tree.\n",
            );
            return result(await save({ ...pending, state: "open", prNumber: number }));
          } catch {
            await save({
              ...pending,
              state: "uncertain",
              failure: "PR creation uncertain; reconcile its exact number before retrying",
            });
            throw new Error("PR creation uncertain; no automatic retry");
          }
        }
        const prNumber =
          request.operation === "integrate"
            ? (request.prNumber ?? registered.prNumber)
            : registered.prNumber;
        if (request.operation === "prepare") {
          if (
            registered.state === "prepared" &&
            registered.main === main &&
            registered.source === task.commit
          )
            return result(registered);
          if (registered.base === main)
            return result(
              await save({
                ...registered,
                state: "prepared",
                source,
                main,
                result: source,
                workspace: registered.path,
                tree: (await sourceGit(["rev-parse", "HEAD^{tree}"])).trim(),
                reviewKey: null,
                signingIdentity: signer.identity,
                fingerprint: signer.fingerprint,
                failure: null,
              }),
            );
          const primary = locations.primary;
          const parent = await containedPath(primary, ".cache/worktrees");
          await mkdir(parent, { recursive: true });
          const workspace = await mkdtemp(
            join(
              parent,
              ".integration-" + taskKey(registered.sessionId, registered.taskId).slice(0, 16) + "-",
            ),
          );
          let pending = await save({
            ...registered,
            state: "integrating",
            source,
            main,
            workspace,
            result: null,
            tree: null,
            reviewKey: null,
            signingIdentity: signer.identity,
            fingerprint: signer.fingerprint,
            failure: null,
          });
          try {
            if ((await parallelDirectory(git)) !== locations.registry)
              throw new Error("Repository binding changed before candidate creation");
            await git(["worktree", "add", "--detach", workspace, main]);
            const integration = makeGit(workspace);
            await assertIntegrationWorkspace(
              git,
              registered,
              workspace,
              integration,
              false,
              locations,
            );
            const delta = await sourceGit([
              "diff",
              "--binary",
              "--full-index",
              registered.base,
              source,
              "--",
              ".",
            ]);
            if (delta) await integration(["apply", "--3way", "--index"], delta);
            const tree = await installPreparedCandidate(
              workspace,
              integration,
              host.install ?? installParallelDependencies,
            );
            pending = await save({ ...pending, state: "prepared", tree });
            return result(pending);
          } catch (error) {
            await save({
              ...pending,
              state: "failed",
              failure: diagnostic(
                error instanceof Error ? error.message : "Preparation failed",
              ).slice(0, 1000),
            });
            throw new Error(
              "Integration preparation stopped; retained checkout requires inspection",
            );
          }
        }
        if (policy.mode === "pr") {
          if (!prNumber)
            throw new Error("PR mode requires an explicitly submitted or selected pull request");
          validatePullRequest(await pr.inspect(registered.path, prNumber), {
            number: prNumber,
            branch: registered.branch,
            head: source,
            main,
          });
        } else if (request.operation === "integrate" && request.prNumber !== undefined)
          throw new Error("PR selection is not enabled by the published policy");
        const fast = registered.base === main;
        if (
          !fast &&
          (registered.state !== "prepared" ||
            registered.main !== main ||
            registered.source !== source ||
            !registered.workspace ||
            !registered.tree)
        )
          throw new Error(
            "Main advanced: prepare an isolated integration candidate and warm its checks before integrating",
          );
        const workspace = fast ? registered.path : registered.workspace;
        if (!workspace) throw new Error("No prepared integration workspace");
        const integration = makeGit(workspace);
        await assertIntegrationWorkspace(git, registered, workspace, integration, fast, locations);
        const expectedTree = fast
          ? (await sourceGit(["rev-parse", "HEAD^{tree}"])).trim()
          : registered.tree;
        if (
          (await integration(["rev-parse", "HEAD"])).trim() !== (fast ? source : main) ||
          (await integration(["write-tree"])).trim() !== expectedTree ||
          (await integration(["diff", "--name-only", "-z"])).length ||
          (await integration(["ls-files", "--others", "--exclude-standard", "-z"])).length
        )
          throw new Error("Prepared integration candidate changed; inspect before recovery");
        let attempt = await save({
          ...registered,
          state: "integrating",
          source,
          main,
          workspace,
          result: fast ? source : null,
          tree: expectedTree,
          reviewKey: null,
          prNumber,
          signingIdentity: signer.identity,
          fingerprint: signer.fingerprint,
          failure: null,
        });
        try {
          const verify = host.verification ?? verificationHost;
          await requireHooks(workspace, integration);
          const before = await verify.identity(workspace);
          await verify.run(workspace, "final", { receiptWritePolicy: "local" });
          await verify.live(workspace);
          await verify.staged(workspace);
          if (
            (await verify.identity(workspace)).key !== before.key ||
            (await integration(["write-tree"])).trim() !== expectedTree ||
            (await integration(["diff", "--name-only", "-z"])).length ||
            (await integration(["ls-files", "--others", "--exclude-standard", "-z"])).length
          )
            throw new Error("Combined verification changed the prepared inputs");
          if ((await signingReady(workspace, integration)).identity !== signer.identity)
            throw new Error("Signing identity changed during integration");
          await assertIntegrationWorkspace(
            git,
            registered,
            workspace,
            integration,
            fast,
            locations,
          );
          if (!fast)
            await integration([
              "commit",
              "--gpg-sign",
              "--allow-empty",
              "--reuse-message=" + source,
            ]);
          const committed = await headCommit(integration);
          const rewritten = committed.commit;
          if (committed.tree !== expectedTree || committed.parent !== main)
            throw new Error("Replayed commit tree or parent changed during hooks");
          await verifyCommitSignature(integration, rewritten, signer.fingerprint);
          await clean(integration);
          attempt = await save({
            ...attempt,
            result: rewritten,
            tree: expectedTree,
            reviewKey: before.key,
          });
          await verify.live(workspace);
          if (
            (await verify.identity(workspace)).key !== attempt.reviewKey ||
            (await signingReady(workspace, integration)).identity !== signer.identity
          )
            throw new Error("Combined verification or signing identity changed before publication");
          if (
            (await parallelDirectory(git)) !== locations.registry ||
            (await parallelDestination(git)) !== registered.destination ||
            (await parallelDestination(integration)) !== registered.destination
          )
            throw new Error("Destination or reviewed refs changed before integration publication");
          const beforePush = await remoteMainAndTask(git, registered.branch);
          if (beforePush.main !== main || beforePush.source !== source)
            throw new Error("Destination or reviewed refs changed before integration publication");
          await assertIntegrationWorkspace(
            git,
            registered,
            workspace,
            integration,
            fast,
            locations,
          );
          if (policy.mode === "pr" && prNumber)
            validatePullRequest(await pr.inspect(registered.path, prNumber), {
              number: prNumber,
              branch: registered.branch,
              head: source,
              main,
            });
          attempt = await save({ ...attempt, state: "uncertain" });
          await integration([
            "-c",
            "push.followTags=false",
            "-c",
            "push.recurseSubmodules=no",
            "push",
            "--porcelain",
            "origin",
            rewritten + ":refs/heads/main",
          ]);
          if ((await parallelDestination(git)) !== registered.destination)
            throw new Error("Exact integration publication is unconfirmed");
          const published = await remoteMainAndTask(git, registered.branch);
          if (published.main !== rewritten || published.source !== source)
            throw new Error("Exact integration publication is unconfirmed");
          return result(await save({ ...attempt, state: "integrated" }));
        } catch (error) {
          await save({
            ...attempt,
            state: attempt.state === "uncertain" ? "uncertain" : "failed",
            failure: diagnostic(
              error instanceof Error ? error.message : "Integration failed",
            ).slice(0, 1000),
          });
          throw new Error(
            "Integration stopped; inspect retained state and checkout before recovery. No automatic retry",
          );
        }
      };
      return request.operation === "integrate"
        ? await withLock(join(directory, ".integration-lock"), execute)
        : await execute();
    },
  );
}
