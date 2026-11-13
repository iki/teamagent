/** Live prerequisite checks precede cooperative source-result reuse. */
import {
  spawnSync,
  type SpawnSyncOptionsWithStringEncoding,
  type SpawnSyncReturns,
} from "node:child_process";
import { resolve } from "node:path";
import { Schema } from "effect";
import { consola } from "consola";
import { digest, encodedDigest, gitText } from "./cache-io.ts";
import {
  checkStagedVerificationCache,
  inputIdentity,
  invalidateCachedTask,
  runCachedTask,
  type CachedTaskResult,
  type CacheTask,
} from "./input-cache.ts";
import { installedPackageIdentity } from "./installed-inputs.ts";
import { hashExecutable, nativeToolIdentity } from "./tool-prerequisites.ts";
import { formatPaths, sourcePaths, root as resourceRoot } from "./tools.ts";
import { temporaryParent } from "./temporary-workspace.ts";
import { ownedProcessIdentity } from "./owned-process.ts";
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
type VerificationProbeId = "git-version" | "powershell-version" | "python-prerequisites";
/** A trusted host test seam; executable selection and options are not external configuration. */
export type VerificationProbeRunner = (
  executable: string,
  args: readonly string[],
  options: SpawnSyncOptionsWithStringEncoding,
) => SpawnSyncReturns<string>;
const probeErrorCodes = new Set([
  "ETIMEDOUT",
  "ENOBUFS",
  "ERR_CHILD_PROCESS_STDIO_MAXBUFFER",
  "ENOENT",
  "EACCES",
  "EPERM",
  "EINVAL",
  "E2BIG",
  "ENOEXEC",
  "EMFILE",
  "ENFILE",
  "ENOMEM",
  "ENOSYS",
]);
const probeSignals = new Set([
  "SIGTERM",
  "SIGKILL",
  "SIGABRT",
  "SIGSEGV",
  "SIGINT",
  "SIGHUP",
  "SIGQUIT",
  "SIGPIPE",
  "SIGBUS",
  "SIGFPE",
  "SIGILL",
  "SIGXCPU",
  "SIGXFSZ",
  "SIGSYS",
  "SIGTRAP",
  "SIGBREAK",
]);
function probeErrorCode(error: unknown): string {
  if (typeof error !== "object" || error === null || !("code" in error)) return "unclassified";
  return typeof error.code === "string" && probeErrorCodes.has(error.code)
    ? error.code
    : "unclassified";
}
function pythonProbeReason(stderr: unknown): string {
  if (typeof stderr !== "string") return "unclassified";
  const normalized = stderr.replaceAll("\r\n", "\n");
  for (const bound of ["file-count", "total-bytes", "file-bytes", "elapsed"] as const) {
    if (
      normalized ===
      `Python prerequisite integrity could not be established: Python prerequisite inventory ${bound} bound exceeded. No cached success is valid.\n`
    )
      return `inventory-${bound}`;
  }
  return "unclassified";
}
export function verificationProbe(
  id: VerificationProbeId,
  executable: string,
  args: readonly string[],
  root: string,
  run: VerificationProbeRunner = spawnSync,
): string {
  const pythonResult = id === "python-prerequisites";
  const timeout = pythonResult ? 120_000 : 15_000;
  const maxBuffer = 1024 * 1024;
  const env: NodeJS.ProcessEnv = {
    ...verificationLocaleEnvironment(process.env),
    PYTHONDONTWRITEBYTECODE: "1",
    GIT_OPTIONAL_LOCKS: "0",
  };
  // This probe hashes provisioned .pyc bytes as inputs; never consume a foreign prefix.
  if (pythonResult) Reflect.deleteProperty(env, "PYTHONPYCACHEPREFIX");
  const started = performance.now();
  const failure = (
    outcome:
      | "timeout"
      | "output-limit"
      | "spawn-error"
      | "nonzero-exit"
      | "signal"
      | "missing-status"
      | "invalid-output",
    result?: SpawnSyncReturns<string>,
    error?: unknown,
  ): Error => {
    const status = result?.status;
    const signal = result?.signal;
    // Only fixed labels and bounded numeric metadata cross this diagnostic boundary.
    // Never attach the native error or schema cause: they can include private output.
    return new Error(
      `A live verification prerequisite probe failed: probe=${id} outcome=${outcome} elapsedMs=${Math.max(0, Math.round(performance.now() - started))} timeoutMs=${timeout} maxBufferBytes=${maxBuffer} status=${typeof status === "number" && Number.isSafeInteger(status) ? status : "none"} signal=${typeof signal === "string" && probeSignals.has(signal) ? signal : "none"} errorCode=${probeErrorCode(error)} reason=${pythonResult && result?.status !== 0 && result ? pythonProbeReason(result.stderr) : "unclassified"}; cached success is unavailable`,
    );
  };
  let result: SpawnSyncReturns<string>;
  try {
    result = run(executable, [...args], {
      cwd: root,
      shell: false,
      windowsHide: true,
      encoding: "utf8",
      timeout,
      maxBuffer,
      env,
    });
  } catch (error) {
    throw failure("spawn-error", undefined, error);
  }
  if (result.error) {
    const code = probeErrorCode(result.error);
    throw failure(
      code === "ETIMEDOUT"
        ? "timeout"
        : code === "ENOBUFS" || code === "ERR_CHILD_PROCESS_STDIO_MAXBUFFER"
          ? "output-limit"
          : "spawn-error",
      result,
      result.error,
    );
  }
  if (result.status !== 0)
    throw failure(
      result.signal ? "signal" : result.status === null ? "missing-status" : "nonzero-exit",
      result,
    );
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
    try {
      return encodedDigest(Schema.decodeUnknownSync(Schema.fromJsonString(schema))(result.stdout));
    } catch {
      throw failure("invalid-output", result);
    }
  }
  return digest(result.stdout.replaceAll("\r\n", "\n").replaceAll("\r", "\n"));
}
export async function verificationPrerequisites(
  root: string,
  includeTests = true,
): Promise<readonly string[]> {
  if (!process.versions.bun) throw new Error("Verification requires Bun");
  // Even a cache-only gate must reject incomplete, stale or foreign scratch routing.
  await temporaryParent(process.env, resourceRoot);
  assertTrackedVerificationInputs(root);
  const values = [
    await ownedProcessIdentity(),
    await installedPackageIdentity(root),
    await hashExecutable(process.execPath),
    verificationEnvironmentIdentity(process.env),
  ];
  if (includeTests) {
    const tools = await nativeToolIdentity(root);
    values.push(tools.identity);
    values.push(verificationProbe("git-version", tools.git, ["--version"], root));
    values.push(
      verificationProbe(
        "powershell-version",
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
    values.push(
      verificationProbe(
        "python-prerequisites",
        python,
        ["app/check/python-prerequisites.py"],
        root,
      ),
    );
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
    shared: true,
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
): Promise<CachedTaskResult> {
  assertTrackedVerificationInputs(root);
  return runCachedTask(root, verificationTask(id, prerequisites), run, {
    forceFresh,
    deferReceipt: true,
    sharedUnavailable: () => {
      consola.warn(
        "Shared verification cache capacity is full. Checks are running fresh; explicit cache maintenance is required to restore reuse.",
      );
    },
    validate: async () => {
      assertTrackedVerificationInputs(root);
    },
  });
}
/** The callback includes the final prerequisite, raw LF/export and whole-source checks. */
export async function withVerificationResults(
  root: string,
  prerequisites: readonly string[],
  run: (retain: (id: VerificationTask, result: CachedTaskResult) => void) => Promise<void>,
): Promise<void> {
  const retained = new Map<VerificationTask, CachedTaskResult>();
  try {
    await run((id, result) => {
      if (retained.size >= 4 || retained.has(id))
        throw new Error("Verification completion scope requires at most four distinct groups");
      retained.set(id, result);
    });
    for (const result of retained.values()) await result.pending?.complete();
  } catch (error) {
    const failures: unknown[] = [error];
    // Settle every executed attempt, even if another completion failed after publication.
    // Then reject the captured identities of reused groups as well as freshly run ones.
    // These operations share the admission account. Settle the bounded scope in
    // order so this gate does not exhaust another group's snapshot retries.
    for (const result of retained.values()) {
      try {
        await result.pending?.fail();
      } catch (failure) {
        failures.push(failure);
      }
    }
    for (const id of ["format", "types", "lint", "tests"] as const) {
      try {
        await invalidateCachedTask(
          root,
          verificationTask(id, prerequisites),
          retained.get(id)?.key,
        );
      } catch (failure) {
        failures.push(failure);
      }
    }
    if (failures.length > 1)
      throw new AggregateError(
        failures,
        "Verification failed; one or more receipt invalidations also failed",
      );
    throw error;
  }
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
