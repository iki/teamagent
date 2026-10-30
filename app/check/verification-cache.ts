/** Live prerequisite checks precede cooperative source-result reuse. */
import { spawnSync } from "node:child_process";
import { resolve } from "node:path";
import { Schema } from "effect";
import { digest, encodedDigest, gitText } from "./cache-io.ts";
import {
  checkStagedVerificationCache,
  inputIdentity,
  runCachedTask,
  type CacheTask,
} from "./input-cache.ts";
import { installedPackageIdentity } from "./installed-inputs.ts";
import { hashExecutable, nativeToolIdentity } from "./tool-prerequisites.ts";
import { formatPaths, sourcePaths } from "./tools.ts";
import {
  verificationEnvironmentIdentity,
  verificationLocaleEnvironment,
} from "./verification-policy.ts";

const configurationInputs = [
  ".editorconfig",
  ".gitattributes",
  ".gitignore",
  "package.json",
  "aube-lock.yaml",
  "aube-workspace.yaml",
  ".bun-version",
  "bunfig.toml",
  "tsconfig.json",
  "tsconfig.lib.json",
  "tsconfig.tools.json",
  ".oxfmtrc.json",
  "oxlint.config.ts",
  "extractors.config.ts",
  ".workflow.json",
  ".githooks",
  "patches",
];
export const verificationInputs = [
  ...new Set([...formatPaths, ...sourcePaths, ...configurationInputs, "spec/tools"]),
];
export const webBuildEnvironmentFiles = [
  "app/web/.env",
  "app/web/.env.local",
  "app/web/.env.production",
  "app/web/.env.production.local",
];
export const verificationEnvironmentFiles = [
  ".env",
  ".env.local",
  ".env.test",
  ".env.test.local",
  ".env.production",
  ".env.production.local",
  ...webBuildEnvironmentFiles,
];
export function assertTrackedVerificationInputs(root: string): void {
  const ignored = gitText(root, [
    "ls-files",
    "--others",
    "--ignored",
    "--exclude-standard",
    "-z",
    "--",
    ...verificationInputs,
    ":(exclude)app/desktop/src-tauri/target",
    ":(exclude)app/desktop/src-tauri/gen",
  ])
    .split("\0")
    .filter(Boolean);
  for (const path of ignored) {
    if (verificationEnvironmentFiles.includes(path)) continue;
    // Isolated Python ignores environment prefixes and may read adjacent source bytecode.
    // Untracked source caches must not bypass the consumed-input boundary.
    if (
      /^app\/desktop\/src-tauri\/binaries\/teamagent-daemon-[a-zA-Z0-9_-]+(?:\.exe)?$/u.test(path)
    )
      continue;
    throw new Error(
      `Ignored file inside a consumed verification scope must be tracked or explicitly reviewed: ${path}`,
    );
  }
}
export type VerificationTask = "format" | "types" | "lint" | "tests";
function boundedProbe(
  executable: string,
  args: readonly string[],
  root: string,
  timeout = 15_000,
  pythonResult = false,
): string {
  const env: NodeJS.ProcessEnv = {
    ...verificationLocaleEnvironment(process.env),
    PYTHONDONTWRITEBYTECODE: "1",
    GIT_OPTIONAL_LOCKS: "0",
  };
  // This probe hashes provisioned .pyc bytes as inputs; never consume a foreign prefix.
  if (pythonResult) Reflect.deleteProperty(env, "PYTHONPYCACHEPREFIX");
  const result = spawnSync(executable, [...args], {
    cwd: root,
    shell: false,
    windowsHide: true,
    encoding: "utf8",
    timeout,
    maxBuffer: 1024 * 1024,
    env,
  });
  if (result.error || result.status !== 0)
    throw new Error("A live verification prerequisite probe failed; cached success is unavailable");
  if (pythonResult) {
    const schema = Schema.Struct({
      version: Schema.Literal(1),
      sha256: Schema.String.check(Schema.isPattern(/^[a-f0-9]{64}$/u)),
      files: Schema.Int.check(
        Schema.isGreaterThanOrEqualTo(1),
        Schema.isLessThanOrEqualTo(100_000),
      ),
      bytes: Schema.Int.check(
        Schema.isGreaterThanOrEqualTo(1),
        Schema.isLessThanOrEqualTo(4 * 1024 ** 3),
      ),
    });
    return encodedDigest(Schema.decodeUnknownSync(Schema.fromJsonString(schema))(result.stdout));
  }
  return digest(result.stdout.replaceAll("\r\n", "\n").replaceAll("\r", "\n"));
}
export async function verificationPrerequisites(
  root: string,
  includeTests = true,
): Promise<readonly string[]> {
  if (!process.versions.bun) throw new Error("Verification requires Bun");
  assertTrackedVerificationInputs(root);
  const values = [
    await installedPackageIdentity(root),
    await hashExecutable(process.execPath),
    verificationEnvironmentIdentity(process.env),
  ];
  if (includeTests) {
    const tools = await nativeToolIdentity(root);
    values.push(tools.identity);
    values.push(boundedProbe(tools.git, ["--version"], root));
    values.push(
      boundedProbe(
        tools.powershell,
        [
          "-NoLogo",
          "-NoProfile",
          "-NonInteractive",
          "-Command",
          "$PSVersionTable.PSVersion.ToString()",
        ],
        root,
      ),
    );
    const python =
      process.env.TEAMAGENT_TEST_PYTHON ??
      resolve(
        root,
        ".cache/import-python",
        process.platform === "win32" ? "Scripts/python.exe" : "bin/python",
      );
    values.push(boundedProbe(python, ["app/check/python-prerequisites.py"], root, 60_000, true));
  }
  return values;
}
export function verificationTask(
  id: VerificationTask,
  prerequisites: readonly string[],
): CacheTask {
  return {
    id,
    kind: "verification",
    inputs:
      id === "format"
        ? [...formatPaths, ...configurationInputs]
        : id === "tests"
          ? verificationInputs
          : [...sourcePaths, ...configurationInputs],
    externalInputs: verificationEnvironmentFiles,
    values: ["provisioned-package-bytes-v1", ...prerequisites],
  };
}
export async function cachedVerification(
  root: string,
  id: VerificationTask,
  prerequisites: readonly string[],
  run: () => Promise<void>,
  forceFresh = false,
): Promise<{ hit: boolean; key: string }> {
  assertTrackedVerificationInputs(root);
  return runCachedTask(root, verificationTask(id, prerequisites), run, {
    forceFresh,
    validate: async () => {
      assertTrackedVerificationInputs(root);
    },
  });
}
export async function reviewInputIdentity(root: string): Promise<{ key: string }> {
  return reviewSourceIdentity(root, await verificationPrerequisites(root));
}
export async function reviewSourceIdentity(
  root: string,
  prerequisites: readonly string[],
): Promise<{ key: string }> {
  assertTrackedVerificationInputs(root);
  const result = await inputIdentity(root, {
    id: "review",
    kind: "verification",
    inputs: verificationInputs,
    externalInputs: verificationEnvironmentFiles,
    values: prerequisites,
  });
  return { key: result.key };
}
export const verifyStagedVerificationReceipts = checkStagedVerificationCache;
