import { realpath, stat } from "node:fs/promises";
import { basename, isAbsolute, join } from "node:path";
import type { Readable } from "node:stream";
import { fileURLToPath } from "node:url";
import { Predicate, Schema } from "effect";
import { spawnOwned, type OwnedProcess } from "./owned-process.ts";
import {
  borrowTemporaryWorkspace,
  createTemporaryWorkspace,
  temporaryEnvironmentNames,
  type TemporaryWorkspaceParent,
} from "./temporary-workspace.ts";
import { physicalToolPath, type Environment } from "./toolchain.ts";

const maximumBytes = 1024 * 1024;
const helper = fileURLToPath(new URL("./environment-snapshot.ps1", import.meta.url));
const controls = ["MISE_AUTO_INSTALL", "MISE_EXEC_AUTO_INSTALL", "MISE_ENV_CACHE"];
const injected = new Set([...controls, "TEMP", "TMP", "TMPDIR", ...temporaryEnvironmentNames]);
const EnvironmentKey = Schema.NonEmptyString.check(Schema.isPattern(/^[^=\0]+$/u));
const EnvironmentValue = Schema.String.check(Schema.isPattern(/^[^\0]*$/u));
const EnvironmentSchema = Schema.Record(EnvironmentKey, EnvironmentValue);
const SuppliedEnvironment = Schema.Record(EnvironmentKey, Schema.UndefinedOr(EnvironmentValue));
const Snapshot = Schema.Struct({ version: Schema.Literal(1), environment: EnvironmentSchema });
const shimPath = (path: string): boolean => /(?:^|[/\\])\.?shims?(?:[/\\]|$)/iu.test(path);

/** Validation errors never retain environment values or parser causes. */
export function validateProjectEnvironment(input: unknown): Environment {
  try {
    if (!Predicate.isObject(input) || Object.keys(input).length > 4096)
      throw new Error("Environment shape limit");
    const supplied = Schema.decodeUnknownSync(SuppliedEnvironment, { onExcessProperty: "error" })(
      input,
    );
    const environment: Record<string, string> = {};
    const seen = new Set<string>();
    let bytes = 0;
    for (const [key, value] of Object.entries(supplied)) {
      const identity = process.platform === "win32" ? key.toUpperCase() : key;
      if (seen.has(identity)) throw new Error("Duplicate environment key");
      seen.add(identity);
      if (value === undefined) continue;
      bytes += Buffer.byteLength(key) + Buffer.byteLength(value) + 2;
      if (bytes > maximumBytes) throw new Error("Environment byte limit");
      Object.defineProperty(environment, key, {
        value,
        enumerable: true,
        writable: true,
        configurable: true,
      });
    }
    return environment;
  } catch {
    throw new Error("Project environment is invalid");
  }
}

/** Full replacement preserves provider unsets instead of resurrecting removed secrets. */
export function decodeMiseEnvironment(text: string, original: Environment): Environment {
  try {
    if (Buffer.byteLength(text) > maximumBytes) throw new Error("Snapshot byte limit");
    const snapshot = Schema.decodeUnknownSync(Schema.fromJsonString(Snapshot), {
      onExcessProperty: "error",
    })(text);
    const environment = validateProjectEnvironment(snapshot.environment);
    const source = validateProjectEnvironment(original);
    return Object.fromEntries([
      ...Object.entries(environment).filter(([key]) => !injected.has(key.toUpperCase())),
      ...Object.entries(source).filter(([key]) => injected.has(key.toUpperCase())),
    ]);
  } catch {
    throw new Error("Mise environment snapshot is invalid");
  }
}

export function miseEnvironmentArguments(shellPath: string): string[] {
  return [
    "exec",
    "--no-deps",
    "--",
    shellPath,
    "-NoLogo",
    "-NoProfile",
    "-NonInteractive",
    "-File",
    helper,
  ];
}

/** The caller retains its lease when the provider's descendant cleanup is uncertain. */
export class EnvironmentCaptureError extends Error {
  constructor(readonly termination: "closed" | "unconfirmed") {
    super(
      termination === "closed"
        ? "Mise environment capture failed"
        : "Mise environment cleanup is unconfirmed; scratch retained",
    );
  }
}

/** Sensitive output stays in bounded private pipes; stderr is counted and discarded. */
export async function captureEnvironmentSnapshot(
  projectRoot: string,
  executable: string,
  args: readonly string[],
  env: Environment,
  signal?: AbortSignal,
  timeoutMs = 30_000,
  container?: TemporaryWorkspaceParent,
): Promise<string> {
  let temporary:
    | Awaited<ReturnType<typeof createTemporaryWorkspace>>
    | Awaited<ReturnType<typeof borrowTemporaryWorkspace>>
    | undefined;
  let owned: OwnedProcess | undefined;
  const captured = Buffer.alloc(maximumBytes);
  let capturedBytes = 0;
  let failed = false;
  let termination: "closed" | "unconfirmed" = "closed";
  let output: string | undefined;
  try {
    if (signal?.aborted) throw new Error("Capture aborted");
    if (!Number.isSafeInteger(timeoutMs) || timeoutMs <= 0 || timeoutMs > 30_000)
      throw new Error("Capture deadline is invalid");
    const environment = validateProjectEnvironment(env);
    if (container && (await realpath(container.root)) !== (await realpath(projectRoot)))
      throw new Error("Capture container belongs to another project");
    temporary = container
      ? await borrowTemporaryWorkspace(projectRoot, container.path, container.token)
      : await createTemporaryWorkspace(projectRoot, "environment");
    owned = await spawnOwned(executable, args, {
      projectRoot,
      cwd: projectRoot,
      env: temporary.environment(environment),
      stdio: "pipe",
      timeoutMs,
      ...(signal ? { signal } : {}),
    });
    const running = owned;
    const { child } = running;
    if (!child.stdin || !child.stdout || !child.stderr) throw new Error("Missing capture pipes");
    let stopping: Promise<void> | undefined;
    const requestStop = (): void => {
      failed = true;
      stopping ??= running.stop("Environment capture failed").catch(() => {
        failed = true;
      });
    };
    child.stdin.on("error", requestStop);
    child.stdin.end();
    const capture = async (stream: Readable, retain: boolean): Promise<void> => {
      let bytes = 0;
      const values: AsyncIterable<unknown> = stream;
      try {
        for await (const chunk of values) {
          if (!(chunk instanceof Uint8Array)) {
            requestStop();
            continue;
          }
          bytes += chunk.byteLength;
          // Keep draining after requesting cancellation. Throwing here closes the
          // pipe before native cleanup and can turn a bounded failure into a
          // broken supervisor transport with uncertain descendant shutdown.
          if (bytes > maximumBytes) {
            requestStop();
            continue;
          }
          if (retain) {
            captured.set(chunk, capturedBytes);
            capturedBytes += chunk.byteLength;
          }
        }
      } catch {
        requestStop();
      }
    };
    await Promise.all([capture(child.stdout, true), capture(child.stderr, false)]);
    await stopping;
    const result = await running.closed;
    termination = result.termination;
    if (
      failed ||
      result.error ||
      result.code !== 0 ||
      result.signal !== null ||
      termination !== "closed"
    )
      throw new Error("Capture process failed");
    output = new TextDecoder("utf-8", { fatal: true }).decode(captured.subarray(0, capturedBytes));
  } catch {
    failed = true;
  }
  if (owned) {
    try {
      await owned.stop("Environment capture finalized");
      termination = (await owned.closed).termination;
    } catch {
      failed = true;
      termination = "unconfirmed";
    }
  }
  captured.fill(0);
  if (temporary && "dispose" in temporary && termination === "closed") {
    try {
      await temporary.dispose();
    } catch {
      failed = true;
    }
  }
  if (failed || output === undefined || termination !== "closed")
    throw new EnvironmentCaptureError(termination);
  return output;
}

async function physicalMise(path: string): Promise<string> {
  try {
    if (!isAbsolute(path) || shimPath(path)) throw new Error("Invalid Mise path");
    const physical = await realpath(path);
    if (
      shimPath(physical) ||
      basename(physical).toLowerCase() !== (process.platform === "win32" ? "mise.exe" : "mise") ||
      !(await stat(physical)).isFile()
    )
      throw new Error("Invalid Mise executable");
    return physical;
  } catch {
    throw new Error("An absolute physical Mise executable is required");
  }
}

/** Explicit trusted configuration evaluation; never downloads tools or caches secrets. */
export async function resolveMiseEnvironment(
  projectRoot: string,
  misePath: string,
  bunPath: string,
  env: Environment,
  signal?: AbortSignal,
  container?: TemporaryWorkspaceParent,
): Promise<Environment> {
  if (process.platform !== "win32")
    throw new Error("The Mise environment provider requires Windows");
  const mise = await physicalMise(misePath);
  if (!container) throw new Error("Mise evaluation requires the command's temporary lease");
  if (!isAbsolute(projectRoot)) throw new Error("The environment project root must be absolute");
  const root = await realpath(projectRoot);
  const bun = physicalToolPath(bunPath, "bun");
  const systemRoot = process.env.SystemRoot ?? process.env.SYSTEMROOT;
  if (!systemRoot || !isAbsolute(systemRoot)) throw new Error("Windows SystemRoot is unavailable");
  const shell = await realpath(join(systemRoot, "System32/WindowsPowerShell/v1.0/powershell.exe"));
  const environment = validateProjectEnvironment(env);
  const providerEnvironment = Object.fromEntries(
    Object.entries(environment).filter(([name]) => !controls.includes(name.toUpperCase())),
  );
  for (const name of controls) providerEnvironment[name] = "false";
  const snapshot = await captureEnvironmentSnapshot(
    root,
    mise,
    miseEnvironmentArguments(shell),
    providerEnvironment,
    signal,
    30_000,
    container,
  );
  if (physicalToolPath(bunPath, "bun") !== bun)
    throw new Error("Selected Bun changed during environment resolution");
  return decodeMiseEnvironment(snapshot, environment);
}
