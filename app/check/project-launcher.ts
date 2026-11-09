import { realpathSync, statSync } from "node:fs";
import { delimiter, dirname, isAbsolute, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { Schema } from "effect";
import { encodedDigest, fileDigest } from "./cache-io.ts";
import {
  pinnedTool,
  prependToolPath,
  toolchainPins,
  type Tool,
  type Environment,
} from "./toolchain.ts";
import { spawnOwned, type OwnedProcess } from "./owned-process.ts";
import { createTemporaryWorkspace, type TemporaryWorkspace } from "./temporary-workspace.ts";
import {
  EnvironmentCaptureError,
  resolveMiseEnvironment,
  validateProjectEnvironment,
} from "./project-environment.ts";

export type ProjectOptions = {
  readonly projectRoot: string;
  readonly tool: Tool;
  /** Complete caller environment; values are never logged or persisted. */
  readonly env?: Environment;
  readonly runtimes?: Readonly<Partial<Record<Tool, string>>>;
  /** Explicit replacement for inherited PATH, before selected runtime directories. */
  readonly pathDirectories?: readonly string[];
  /** Opt in to trusted native Windows Mise configuration evaluation. */
  readonly misePath?: string;
  readonly signal?: AbortSignal;
};

export function physicalProjectRoot(value: string): string {
  if (!isAbsolute(value)) throw new Error("Project root must be absolute");
  const root = resolve(value);
  const physical = realpathSync.native(root);
  const same =
    process.platform === "win32"
      ? physical.toLowerCase() === root.toLowerCase()
      : physical === root;
  if (!same || !statSync(physical).isDirectory())
    throw new Error("Select the actual physical project root");
  return physical;
}

/** Resolve per invocation: no other project's runtime selection or environment is cached. */
async function selectProject(options: ProjectOptions, temporary?: TemporaryWorkspace) {
  const projectRoot = physicalProjectRoot(options.projectRoot);
  let tool: Tool;
  try {
    tool = Schema.decodeUnknownSync(Schema.Literals(["bun", "aube"]))(options.tool);
  } catch {
    throw new Error("Project tool must be bun or aube");
  }
  const before = toolchainPins(projectRoot);
  let environment = validateProjectEnvironment(
    options.env === undefined ? process.env : options.env,
  );
  const select = (name: Tool): string =>
    pinnedTool(projectRoot, name, environment, {
      ...(options.runtimes?.[name] === undefined ? {} : { path: options.runtimes[name] }),
      inheritOverride: false,
    });
  const bun = select("bun");
  if (options.misePath !== undefined) {
    if (!temporary) throw new Error("Mise evaluation requires an owned launch scope");
    environment = await resolveMiseEnvironment(
      projectRoot,
      options.misePath,
      bun,
      temporary.environment(environment),
      options.signal,
      temporary,
    );
  }
  physicalProjectRoot(projectRoot);
  const after = toolchainPins(projectRoot);
  if (before.bun !== after.bun || before.aube !== after.aube)
    throw new Error("Project runtime pins changed during environment resolution");
  if (options.misePath !== undefined)
    pinnedTool(projectRoot, "bun", environment, { path: bun, inheritOverride: false });
  const aube = tool === "aube" ? select("aube") : undefined;
  if (options.pathDirectories !== undefined) {
    if (
      options.pathDirectories.length > 4096 ||
      options.pathDirectories.some(
        (path) => !isAbsolute(path) || path.includes("\0") || path.includes(delimiter),
      )
    )
      throw new Error("Selected PATH directories must be bounded absolute entries");
    environment = Object.fromEntries(
      Object.entries(environment).filter(([key]) => key.toLowerCase() !== "path"),
    );
  }
  environment = prependToolPath(environment, [
    dirname(bun),
    ...(aube ? [dirname(aube)] : []),
    ...(options.pathDirectories ?? []),
  ]);
  // Selection is carried by physical argv/PATH, not a foreign project's override or cache controls.
  for (const key of Object.keys(environment))
    if (["TEAMAGENT_BUN_PATH", "TEAMAGENT_AUBE_PATH"].includes(key.toUpperCase()))
      delete environment[key];
  return {
    projectRoot,
    executable: aube ?? bun,
    environment: validateProjectEnvironment(environment),
  };
}

/** Schema diagnostics may contain metadata or tool output; never expose those inputs. */
async function resolveSelectedProject(options: ProjectOptions, temporary?: TemporaryWorkspace) {
  try {
    return await selectProject(options, temporary);
  } catch (error) {
    if (Schema.isSchemaError(error))
      throw new Error("Project runtime metadata or tool version output is invalid");
    throw error;
  }
}

/** Selection inspection never evaluates Mise or creates a temporary command lifetime. */
export async function resolveProject(options: ProjectOptions) {
  if (options.misePath !== undefined) throw new Error("Mise evaluation requires launchProject");
  return resolveSelectedProject(options);
}

export type ProjectLaunchOptions = ProjectOptions & {
  readonly args: readonly string[];
  readonly stdio: "inherit" | "pipe";
  readonly timeoutMs?: number;
};
export type ProjectProcess = OwnedProcess & {
  readonly projectRoot: string;
  readonly temporaryPath: string;
};

/** Pipe callers drain both outputs. closed includes confirmed descendant and scratch cleanup. */
export async function launchProject(options: ProjectLaunchOptions): Promise<ProjectProcess> {
  if (options.signal?.aborted) throw new Error("Project launch aborted");
  const projectRoot = physicalProjectRoot(options.projectRoot);
  const temporary = await createTemporaryWorkspace(projectRoot, "project-launch");
  let owned: OwnedProcess;
  try {
    const selected = await resolveSelectedProject(options, temporary);
    owned = await spawnOwned(selected.executable, options.args, {
      projectRoot,
      cwd: projectRoot,
      env: temporary.environment(selected.environment),
      stdio: options.stdio,
      ...(options.signal ? { signal: options.signal } : {}),
      ...(options.timeoutMs === undefined ? {} : { timeoutMs: options.timeoutMs }),
    });
  } catch (error) {
    if (!(error instanceof EnvironmentCaptureError && error.termination === "unconfirmed")) {
      try {
        await temporary.dispose();
      } catch {
        throw new Error("Project launch failed and scratch cleanup failed");
      }
    }
    throw error;
  }
  const closed = owned.closed.then(async (outcome) => {
    if (outcome.termination !== "closed") return outcome;
    try {
      await temporary.dispose();
      return outcome;
    } catch {
      return { ...outcome, error: new Error("Project scratch cleanup failed") };
    }
  });
  return {
    child: owned.child,
    closed,
    projectRoot,
    temporaryPath: temporary.path,
    async stop(reason) {
      await owned.stop(reason);
      await closed;
    },
  };
}

/** Complete local implementation closure; target inputs/environment remain separate consumer inputs. */
export const projectLauncherInputs = [
  "app/check/project-launcher.ts",
  "app/check/project-launch.ts",
  "app/check/project-environment.ts",
  "app/check/environment-snapshot.ps1",
  "app/check/toolchain.ts",
  "app/check/owned-process.ts",
  "app/check/native-artifact-owner.ts",
  "app/check/owned-process-windows.cs",
  "app/check/temporary-workspace.ts",
  "app/check/cache-io.ts",
  "app/check/metadata-lock.ts",
  "app/check/cache-fingerprint.ts",
  "app/check/git-platform.ts",
  "app/check/git-execution.ts",
  "app/toolchain.ps1",
  "package.json",
  "aube-lock.yaml",
  ".bun-version",
  "bunfig.toml",
  "tsconfig.json",
] as const;

/** Streaming source identity only; no process launch, cache writes or environment values. */
export async function projectLauncherIdentity(): Promise<string> {
  const root = fileURLToPath(new URL("../../", import.meta.url));
  const inputs: Array<{ path: string; hash: string }> = [];
  for (const path of projectLauncherInputs)
    inputs.push({ path, hash: await fileDigest(root, path, 64 * 1024 * 1024) });
  return encodedDigest(inputs);
}
