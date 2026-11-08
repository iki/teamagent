/** Explicit Git callers may use a reviewed payload; general process launch stays unchanged. */
import { spawnSync } from "node:child_process";
import { createHash } from "node:crypto";
import { constants } from "node:fs";
import { access, lstat, realpath } from "node:fs/promises";
import { basename, dirname, isAbsolute, resolve, win32 } from "node:path";
import { which } from "bun";
import { Predicate, Schema } from "effect";
import { fileContentDigest } from "./cache-fingerprint.ts";

// The release PKGBUILD pins this source digest and compiles cmd/git.exe with MSYSTEM=UCRT64.
// https://github.com/git-for-windows/MINGW-packages/tree/20a412e3b61c853fb3a290f02e78f59611d20342/mingw-w64-git
export const gitPayloadProfile = {
  sourceRevision: "20a412e3b61c853fb3a290f02e78f59611d20342",
  sourceSha256: "c24bab1178721707c848b370aabfc3714a570d0ff34b664d318104a86098d58c",
  launcherSha256: "20d0dde30a65afb6e5810a883700a94dcd77fbf3b44b32868d45bf7c9b30137c",
  payloadSha256: "9c75f3f41eb5686bacde4b7c4fdfcd7970e8b699ee05c8d7a0cc9c8a7ddaffe8",
} as const;

export type WindowsGitInstallation = {
  readonly root: string;
  readonly runtime: "ucrt64" | "mingw64" | "mingw32";
  readonly core: string;
  readonly launcher: string;
  readonly payload: string;
};
type Environment = Record<string, string | undefined>;
type GitFacts = {
  readonly launcherSha256: string;
  readonly payloadSha256: string;
  readonly runtimePayloadSha256: string;
  readonly wrapperConfigPresent: boolean;
  readonly wrapperConfigSha256?: string;
};
export type GitExecution = {
  readonly executable: string;
  readonly env: Environment;
  readonly mode: "payload" | "canonical" | "posix";
  readonly reason: string | null;
  /** Exact per-dispatch environment identity; never use this PATH-sensitive value as a review key. */
  readonly identity: string;
  readonly prerequisiteIdentity: string;
  readonly launcher: string;
  readonly payload: string | null;
};
const EnvironmentKey = Schema.NonEmptyString.check(Schema.isPattern(/^[^=\0]+$/u));
const EnvironmentValue = Schema.String.check(Schema.isPattern(/^[^\0]*$/u));
const EnvironmentSchema = Schema.Record(EnvironmentKey, Schema.UndefinedOr(EnvironmentValue));
const ExecutionPath = Schema.NonEmptyString.check(Schema.isPattern(/^[^\r\n\0]+$/u));
const samePath = (left: string, right: string): boolean =>
  win32.normalize(left).toLowerCase() === win32.normalize(right).toLowerCase();
function digest(value: object): string {
  const text = JSON.stringify(value);
  if (text === undefined) throw new Error("Git execution identity is unavailable");
  return createHash("sha256").update(text).digest("hex");
}

function environmentCopy(input: unknown, windows: boolean): Environment {
  try {
    if (!Predicate.isObject(input) || Object.keys(input).length > 4096)
      throw new Error("Environment shape limit");
    const supplied = Schema.decodeUnknownSync(EnvironmentSchema, { onExcessProperty: "error" })(
      input,
    );
    const entries: [string, string | undefined][] = [];
    const names = new Set<string>();
    let bytes = 0;
    for (const [name, value] of Object.entries(supplied)) {
      const key = windows ? name.toUpperCase() : name;
      if (names.has(key)) throw new Error("Conflicting environment key");
      names.add(key);
      bytes += Buffer.byteLength(name) + (value === undefined ? 0 : Buffer.byteLength(value)) + 2;
      if (bytes > 1024 * 1024) throw new Error("Environment byte limit");
      entries.push([name, value]);
    }
    return Object.fromEntries(entries);
  } catch {
    throw new Error("Git execution environment is invalid");
  }
}
const valueOf = (environment: Environment, name: string): string | undefined =>
  Object.entries(environment).find(([key]) => key.toUpperCase() === name)?.[1];
function setValue(environment: Environment, name: string, value: string): void {
  for (const key of Object.keys(environment))
    if (key.toUpperCase() === name) Reflect.deleteProperty(environment, key);
  environment[name] = value;
}

/** Pure selection from inspected facts. Unsupported wrapper branches remain explicit canonical execution. */
export function selectGitEnvironment(
  installation: WindowsGitInstallation,
  input: unknown,
  facts: GitFacts,
): GitExecution {
  const environment = environmentCopy(input, true);
  const home = valueOf(environment, "HOME");
  const executionPath = valueOf(environment, "GIT_EXEC_PATH");
  const matchingPath =
    executionPath === undefined ||
    (win32.isAbsolute(executionPath) && samePath(executionPath, installation.core));
  let reason: string | null = null;
  if (
    installation.runtime !== "ucrt64" ||
    facts.launcherSha256 !== gitPayloadProfile.launcherSha256 ||
    facts.payloadSha256 !== gitPayloadProfile.payloadSha256 ||
    facts.runtimePayloadSha256 !== gitPayloadProfile.payloadSha256
  )
    reason = "unsupported-profile";
  else if (facts.wrapperConfigPresent) reason = "wrapper-config-present";
  else if (!home) reason = "missing-home";
  else if (home.length + 7 >= 4096) reason = "home-path-bound";
  else if (!matchingPath) reason = "foreign-exec-path";
  if (reason === null && home !== undefined) {
    setValue(environment, "MSYSTEM", "UCRT64");
    // Preserve an explicitly empty value; the wrapper defaults only a missing variable.
    setValue(environment, "PLINK_PROTOCOL", valueOf(environment, "PLINK_PROTOCOL") ?? "ssh");
    const homeBin = `${home}${home.endsWith("\\") ? "" : "\\"}bin`;
    setValue(
      environment,
      "PATH",
      [
        win32.join(installation.root, installation.runtime, "bin"),
        win32.join(installation.root, "usr", "bin"),
        homeBin,
        valueOf(environment, "PATH") ?? "",
      ].join(";"),
    );
  }
  const mode = reason === null ? "payload" : "canonical";
  const executable = mode === "payload" ? installation.payload : installation.launcher;
  const prerequisiteIdentity = digest({
    version: 1,
    profile: gitPayloadProfile,
    mode,
    reason,
    facts,
    installation,
    effective: {
      home: valueOf(environment, "HOME") ?? null,
      plink: valueOf(environment, "PLINK_PROTOCOL") ?? null,
      msystem: valueOf(environment, "MSYSTEM") ?? null,
      msys: valueOf(environment, "MSYS") ?? null,
      executionPath: matchingPath ? installation.core : executionPath,
      homeFallback: home
        ? null
        : ["HOMEDRIVE", "HOMEPATH", "USERPROFILE"].map(
            (name) => valueOf(environment, name) ?? null,
          ),
    },
  });
  return {
    executable,
    env: environment,
    mode,
    reason,
    prerequisiteIdentity,
    identity: digest({
      prerequisiteIdentity,
      environment: Object.entries(environment).sort(([a], [b]) => a.localeCompare(b, "en")),
    }),
    launcher: installation.launcher,
    payload: installation.payload,
  };
}

function checkedExecutionPath(input: unknown, message: string): string {
  try {
    const path = Schema.decodeUnknownSync(ExecutionPath)(input);
    if (!isAbsolute(path) || Buffer.byteLength(path) > 16384) throw new Error(message);
    return path;
  } catch {
    throw new Error(message);
  }
}
export function gitExecutionPath(command: string, root: string, env?: Environment): string {
  const result = spawnSync(command, ["--exec-path"], {
    cwd: root,
    encoding: "utf8",
    shell: false,
    timeout: 15_000,
    maxBuffer: 16384,
    ...(env === undefined ? {} : { env }),
    windowsHide: true,
  });
  if (result.error || result.status !== 0)
    throw new Error("Git execution payload could not be located");
  return checkedExecutionPath(result.stdout.trim(), "Git execution payload could not be located");
}

/** The optional probe is the existing trusted fixture seam, never executable configuration. */
export async function resolveWindowsGitInstallation(
  root: string,
  candidate: string,
  probe: (command: string, root: string) => string = gitExecutionPath,
): Promise<WindowsGitInstallation> {
  const reported = checkedExecutionPath(
    probe(candidate, root),
    "Git execution payload must be one absolute path",
  );
  const core = await realpath(reported);
  const libexec = dirname(core),
    runtimeDirectory = dirname(libexec);
  const runtime = basename(runtimeDirectory).toLowerCase();
  if (
    basename(core).toLowerCase() !== "git-core" ||
    basename(libexec).toLowerCase() !== "libexec" ||
    (runtime !== "ucrt64" && runtime !== "mingw64" && runtime !== "mingw32")
  )
    throw new Error("Unsupported Git-for-Windows installation layout");
  const installation = dirname(runtimeDirectory);
  const launcherPath = resolve(installation, "cmd/git.exe"),
    payloadPath = resolve(core, "git.exe");
  await access(launcherPath, constants.X_OK);
  await access(payloadPath, constants.X_OK);
  const launcher = await realpath(launcherPath),
    payload = await realpath(payloadPath);
  if (!samePath(launcher, launcherPath) || !samePath(payload, payloadPath))
    throw new Error("Linked Git-for-Windows executable layout is unsupported");
  const canonicalReported = checkedExecutionPath(
    probe(launcher, root),
    "Canonical Git launcher reported an invalid execution payload",
  );
  if (!samePath(await realpath(canonicalReported), core))
    throw new Error("Git launcher and execution payload do not match");
  return { root: installation, runtime, core, launcher, payload };
}
export async function resolveWindowsGitLauncher(
  root: string,
  candidate: string,
  probe: (command: string, root: string) => string = gitExecutionPath,
): Promise<string> {
  return (await resolveWindowsGitInstallation(root, candidate, probe)).launcher;
}

type Fingerprint = { readonly sha256: string; readonly mode: number };
async function fingerprint(path: string, maximum = 256 * 1024 ** 2): Promise<Fingerprint> {
  const physical = async (): Promise<void> => {
    const actual = await realpath(path);
    if (process.platform === "win32" ? !samePath(actual, path) : actual !== path)
      throw new Error("Linked Git execution input is unsupported");
  };
  await physical();
  const before = await lstat(path, { bigint: true });
  return {
    sha256: await fileContentDigest(path, before, {
      maximumBytes: maximum,
      validatePath: physical,
    }),
    mode: Number(before.mode & 0o777n),
  };
}
/** The wrapper's runtime/bin executable must match the separately inspected libexec payload. */
export async function inspectGitRuntimePayload(
  installation: WindowsGitInstallation,
): Promise<Fingerprint> {
  return fingerprint(resolve(installation.root, installation.runtime, "bin/git.exe"));
}
async function installationFingerprints(installation: WindowsGitInstallation, candidate: string) {
  const runtimePayload = resolve(installation.root, installation.runtime, "bin/git.exe");
  const paths = [
    ...new Set([candidate, installation.launcher, installation.payload, runtimePayload]),
  ];
  const settled = await Promise.allSettled(
    paths.map(
      async (path) =>
        [
          path,
          await (path === runtimePayload
            ? inspectGitRuntimePayload(installation)
            : fingerprint(path)),
        ] as const,
    ),
  );
  const values = new Map<string, Fingerprint>();
  for (const result of settled) {
    if (result.status === "rejected") throw new Error("Git executable inspection failed");
    values.set(...result.value);
  }
  const get = (path: string): Fingerprint => {
    const value = values.get(path);
    if (!value) throw new Error("Git executable inspection is incomplete");
    return value;
  };
  return {
    candidate: get(candidate),
    launcher: get(installation.launcher),
    payload: get(installation.payload),
    runtimePayload: get(runtimePayload),
  };
}
type Discovery = {
  readonly installation: WindowsGitInstallation;
  readonly fingerprints: Awaited<ReturnType<typeof installationFingerprints>>;
};
// Only the reviewed byte-identical wrapper's deterministic layout relation is retained, never file digests as live evidence.
const discoveries = new Map<string, Promise<Discovery>>();
async function discover(
  root: string,
  candidate: string,
  environment: Environment,
): Promise<Discovery> {
  const before = await fingerprint(candidate);
  const probeEnvironment = { ...environment };
  for (const name of Object.keys(probeEnvironment))
    if (name.toUpperCase() === "GIT_EXEC_PATH") Reflect.deleteProperty(probeEnvironment, name);
  const installation = await resolveWindowsGitInstallation(root, candidate, (command, cwd) =>
    gitExecutionPath(command, cwd, probeEnvironment),
  );
  const fingerprints = await installationFingerprints(installation, candidate);
  if (digest(before) !== digest(fingerprints.candidate))
    throw new Error("Git changed during discovery");
  return { installation, fingerprints };
}

/** Per-call facts are live; discovery reuse is bounded and guarded by complete executable hashes. */
export async function resolveGitExecution(
  root: string,
  input: unknown = process.env,
): Promise<GitExecution> {
  const environment = environmentCopy(input, process.platform === "win32");
  const candidate = which("git", {
    PATH:
      process.platform === "win32"
        ? (valueOf(environment, "PATH") ?? "")
        : (environment.PATH ?? ""),
    cwd: root,
  });
  if (!candidate) throw new Error("Missing Git execution prerequisite");
  if (process.platform !== "win32") {
    const executable = await realpath(candidate);
    const prerequisiteIdentity = digest({
      mode: "posix",
      executable,
      fingerprint: await fingerprint(executable),
    });
    return {
      executable,
      env: environment,
      mode: "posix",
      reason: null,
      launcher: executable,
      payload: null,
      prerequisiteIdentity,
      identity: digest({
        prerequisiteIdentity,
        environment: Object.entries(environment).sort(([a], [b]) => a.localeCompare(b, "en")),
      }),
    };
  }
  const key = resolve(candidate).toLowerCase();
  let pending = discoveries.get(key);
  if (!pending) {
    if (discoveries.size >= 16) throw new Error("Git discovery capacity exceeded");
    pending = discover(root, candidate, environment);
    discoveries.set(key, pending);
  }
  let discovered: Discovery;
  try {
    discovered = await pending;
  } catch {
    if (discoveries.get(key) === pending) discoveries.delete(key);
    throw new Error("Git installation discovery failed");
  }
  const { installation } = discovered;
  const current = await installationFingerprints(installation, candidate);
  if (digest(current) !== digest(discovered.fingerprints))
    throw new Error("Git installation changed after discovery");
  if (
    current.launcher.sha256 !== gitPayloadProfile.launcherSha256 ||
    current.payload.sha256 !== gitPayloadProfile.payloadSha256 ||
    current.runtimePayload.sha256 !== gitPayloadProfile.payloadSha256
  )
    if (discoveries.get(key) === pending) discoveries.delete(key);
  let configPresent = true;
  const configPath = resolve(installation.root, "etc/git-bash.config");
  try {
    await lstat(configPath);
  } catch (error) {
    if (!(error instanceof Error && "code" in error && error.code === "ENOENT")) throw error;
    configPresent = false;
  }
  const configSha256 = configPresent
    ? (await fingerprint(configPath, 1024 * 1024)).sha256
    : undefined;
  const selection = selectGitEnvironment(installation, environment, {
    launcherSha256: current.launcher.sha256,
    payloadSha256: current.payload.sha256,
    runtimePayloadSha256: current.runtimePayload.sha256,
    wrapperConfigPresent: configSha256 !== undefined,
    ...(configSha256 === undefined ? {} : { wrapperConfigSha256: configSha256 }),
  });
  if (selection.mode === "payload")
    for (const directory of [
      resolve(installation.root, installation.runtime, "bin"),
      resolve(installation.root, "usr/bin"),
    ])
      if (
        !(await lstat(directory)).isDirectory() ||
        !samePath(await realpath(directory), directory)
      )
        throw new Error("Git runtime directories must be physical");
  return selection;
}
