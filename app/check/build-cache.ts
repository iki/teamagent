/** Opt-in preparation cache. Native compilation/acceptance remains separately required. */
import { runCachedTask, type CacheTask } from "./input-cache.ts";
import { resolve } from "node:path";
import { boundedRead, hasCode, encodedDigest } from "./cache-io.ts";
import { verificationPrerequisites, webBuildEnvironmentFiles } from "./verification-cache.ts";
export { safePath as validateBuildOutputPath } from "./cache-io.ts";
export { webBuildEnvironmentFiles } from "./verification-cache.ts";

/** Resolve only the current app/web production dotenv inputs; never expose their values. */
export async function webBuildEnvironmentIdentity(root: string): Promise<string> {
  if (process.env.DEBUG)
    throw new Error(
      "Web preparation requires DEBUG to be unset to prevent Vite environment-value logging",
    );
  for (const path of webBuildEnvironmentFiles) {
    try {
      new TextDecoder("utf-8", { fatal: true }).decode(await boundedRead(root, path, 1024 * 1024));
    } catch (error) {
      if (!hasCode(error, "ENOENT")) throw error;
    }
  }
  const { loadEnv } = await import("vite");
  const values = loadEnv("production", resolve(root, "app/web"));
  return encodedDigest({
    nodeEnvironment: process.env.NODE_ENV ?? null,
    values: Object.entries(values).sort(([left], [right]) => left.localeCompare(right, "en")),
  });
}
/** Apply pinned Vite's documented implicit defaults before establishing a build key. */
export async function prepareWebBuildEnvironment(root: string): Promise<string> {
  const explicitNodeEnvironment = Boolean(process.env.NODE_ENV);
  if (!explicitNodeEnvironment) process.env.NODE_ENV = "production";
  const identity = await webBuildEnvironmentIdentity(root);
  if (!explicitNodeEnvironment && process.env.VITE_USER_NODE_ENV === "development") {
    process.env.NODE_ENV = "development";
    return webBuildEnvironmentIdentity(root);
  }
  return identity;
}

export interface BuildStage {
  readonly id: string;
  readonly inputs: readonly string[];
  readonly outputs: readonly string[];
  readonly externalInputs?: readonly string[];
  readonly values?: readonly string[];
}
export async function runBuildStage(
  root: string,
  stage: BuildStage,
  run: () => Promise<void>,
  options: {
    readonly enabled: boolean;
    readonly forceFresh?: boolean;
    readonly validate?: () => Promise<void>;
  },
): Promise<{ hit: boolean; key: string | null }> {
  if (!options.enabled && !options.forceFresh) {
    await run();
    return { hit: false, key: null };
  }
  const prerequisites = await verificationPrerequisites(root, false);
  const task: CacheTask = {
    ...stage,
    kind: "build",
    portable: false,
    externalInputs: [
      ".env",
      ".env.local",
      ".env.production",
      ".env.production.local",
      ...(stage.externalInputs ?? []),
    ],
    inputs: [
      ...stage.inputs,
      "app/check",
      "package.json",
      "aube-lock.yaml",
      "aube-workspace.yaml",
      ".bun-version",
      "bunfig.toml",
      "patches",
      "app/dependencies",
    ],
    values: [root, ...(stage.values ?? []), ...prerequisites],
  };
  return runCachedTask(root, task, run, {
    ...options,
    validate: async () => {
      if (
        JSON.stringify(await verificationPrerequisites(root, false)) !==
        JSON.stringify(prerequisites)
      )
        throw new Error("Build prerequisites changed during preparation");
      await options.validate?.();
    },
  });
}
