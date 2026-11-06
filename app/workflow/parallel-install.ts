import { lstat, realpath } from "node:fs/promises";
import { join, resolve } from "node:path";
import { Schema } from "effect";
import { boundedText, containedPath } from "./storage.ts";
import { launchProject } from "../check/project-launcher.ts";
import { GitObjectId, type Git } from "./git.ts";

/** Installation cannot adopt staged source changes into an already reviewed replay. */
export async function installPreparedCandidate(
  root: string,
  git: Git,
  install: (root: string) => Promise<void> = installParallelDependencies,
): Promise<string> {
  const tree = Schema.decodeUnknownSync(GitObjectId)((await git(["write-tree"])).trim());
  await install(root);
  const installedTree = Schema.decodeUnknownSync(GitObjectId)((await git(["write-tree"])).trim());
  if (
    installedTree !== tree ||
    (await git(["diff", "--name-only", "-z"])).length ||
    (await git(["ls-files", "--others", "--exclude-standard", "-z"])).length
  )
    throw new Error("Frozen installation changed the source candidate");
  return tree;
}

/** Frozen installation owns target-local scratch and drains bounded private output. */
export async function installParallelDependencies(root: string): Promise<void> {
  const cancellation = new AbortController();
  const owned = await launchProject({
    projectRoot: root,
    tool: "aube",
    args: ["install", "--frozen-lockfile"],
    stdio: "pipe",
    timeoutMs: 300000,
    signal: cancellation.signal,
  });
  const { stdin, stdout, stderr } = owned.child;
  if (!stdin || !stdout || !stderr) {
    await owned.stop("Missing installation streams");
    await owned.closed;
    throw new Error("Installation streams are unavailable");
  }
  let bytes = 0,
    malformed = false;
  const receive = (chunk: unknown): void => {
    if (!(chunk instanceof Uint8Array)) malformed = true;
    else bytes += chunk.byteLength;
    if (malformed || bytes > 16 * 1024 * 1024) cancellation.abort();
  };
  stdout.on("data", receive);
  stderr.on("data", receive);
  stdin.on("error", () => cancellation.abort());
  stdin.end();
  const result = await owned.closed;
  if (
    result.error ||
    result.code !== 0 ||
    result.termination !== "closed" ||
    malformed ||
    bytes > 16 * 1024 * 1024
  )
    throw new Error(
      "Frozen worktree installation failed; preserve the checkout and inspect before recovery",
    );
}

/** Nested worktrees must never borrow the primary checkout's mutable dependency tree. */
export async function assertWorktreeDependencies(root: string): Promise<void> {
  const modules = await containedPath(root, "node_modules");
  const info = await lstat(modules);
  if (
    !info.isDirectory() ||
    info.isSymbolicLink() ||
    resolve(await realpath(modules)) !== resolve(modules)
  )
    throw new Error(
      "A physical worktree-local node_modules is required; run its frozen Aube installation",
    );
  const Name = Schema.String.check(
    Schema.isPattern(/^(?:@[a-z0-9][a-z0-9._-]*\/)?[a-z0-9][a-z0-9._-]*$/u),
  );
  const manifest = Schema.decodeUnknownSync(
    Schema.fromJsonString(
      Schema.Struct({
        dependencies: Schema.optional(Schema.Record(Name, Schema.String)),
        devDependencies: Schema.optional(Schema.Record(Name, Schema.String)),
      }),
    ),
  )(await boundedText(await containedPath(root, "package.json"), 1024 * 1024));
  const names = [
    ...new Set([
      ...Object.keys(manifest.dependencies ?? {}),
      ...Object.keys(manifest.devDependencies ?? {}),
    ]),
  ];
  if (names.length > 512) throw new Error("Dependency inventory exceeds workflow bounds");
  for (const name of names) {
    if (name.startsWith("@")) {
      const scope = name.split("/")[0];
      if (!scope) throw new Error("Invalid scoped dependency");
      await containedPath(root, "node_modules/" + scope);
    }
    const binding = await lstat(join(modules, name));
    if (!binding.isDirectory() && !binding.isSymbolicLink())
      throw new Error(
        "Declared dependency has no worktree-local binding; frozen installation is required",
      );
    // Aube may link this owned binding to its reviewed content store. The existing
    // installed-package identity checks validate that store; never use upward lookup.
  }
}
