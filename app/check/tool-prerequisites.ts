import { createHash } from "node:crypto";
import { access, open, realpath } from "node:fs/promises";
import { constants } from "node:fs";
import { basename, delimiter, dirname, isAbsolute, resolve } from "node:path";
import { spawnSync } from "node:child_process";
import { encodedDigest } from "./cache-io.ts";

export async function hashExecutable(path: string): Promise<string> {
  const handle = await open(await realpath(path), "r");
  try {
    const before = await handle.stat();
    if (!before.isFile() || before.size > 256 * 1024 ** 2)
      throw new Error("Tool prerequisite exceeds byte bound");
    const hash = createHash("sha256");
    hash.update(`${before.mode & 0o777}\0`);
    const chunk = new Uint8Array(64 * 1024);
    let size = 0;
    for (;;) {
      const result = await handle.read(chunk, 0, chunk.length, size);
      if (!result.bytesRead) break;
      size += result.bytesRead;
      if (size > 256 * 1024 ** 2) throw new Error("Tool prerequisite grew beyond bound");
      hash.update(chunk.subarray(0, result.bytesRead));
    }
    const after = await handle.stat();
    if (
      size !== before.size ||
      before.size !== after.size ||
      before.mode !== after.mode ||
      before.mtimeMs !== after.mtimeMs ||
      before.ctimeMs !== after.ctimeMs
    )
      throw new Error("Tool prerequisite changed during inspection");
    return hash.digest("hex");
  } finally {
    await handle.close();
  }
}

function gitExecutionPath(command: string, root: string): string {
  const result = spawnSync(command, ["--exec-path"], {
    cwd: root,
    encoding: "utf8",
    shell: false,
    windowsHide: true,
    timeout: 15_000,
    maxBuffer: 16384,
  });
  const output = result.stdout?.trim();
  if (
    result.error ||
    result.status !== 0 ||
    !output ||
    !isAbsolute(output) ||
    /[\r\n\0]/u.test(output)
  )
    throw new Error("Git execution payload could not be located");
  return output;
}

/** The optional probe is a trusted fixture seam, never executable configuration. */
export async function resolveWindowsGitLauncher(
  root: string,
  candidate: string,
  probe: (command: string, root: string) => string = gitExecutionPath,
): Promise<string> {
  const reported = probe(candidate, root);
  if (!isAbsolute(reported) || /[\r\n\0]/u.test(reported))
    throw new Error("Git execution payload must be one absolute path");
  const core = await realpath(reported);
  const libexec = dirname(core);
  const runtime = dirname(libexec);
  if (
    basename(core).toLowerCase() !== "git-core" ||
    basename(libexec).toLowerCase() !== "libexec" ||
    !["ucrt64", "mingw64", "mingw32"].includes(basename(runtime).toLowerCase())
  )
    throw new Error("Unsupported Git-for-Windows installation layout");
  const installation = dirname(runtime);
  const launcherPath = resolve(installation, "cmd/git.exe");
  const payloadPath = resolve(core, "git.exe");
  await access(launcherPath, constants.X_OK);
  await access(payloadPath, constants.X_OK);
  const launcher = await realpath(launcherPath);
  const payload = await realpath(payloadPath);
  if (
    launcher.toLowerCase() !== launcherPath.toLowerCase() ||
    payload.toLowerCase() !== payloadPath.toLowerCase()
  )
    throw new Error("Linked Git-for-Windows executable layout is unsupported");
  const canonicalReported = probe(launcher, root);
  if (!isAbsolute(canonicalReported) || /[\r\n\0]/u.test(canonicalReported))
    throw new Error("Canonical Git launcher reported an invalid execution payload");
  if ((await realpath(canonicalReported)).toLowerCase() !== core.toLowerCase())
    throw new Error("Git launcher and execution payload do not match");
  return launcher;
}

/** System OS libraries remain a trusted host prerequisite, not portable cached evidence. */
export async function resolveVerificationTool(name: string, root: string): Promise<string> {
  if (!/^[a-zA-Z0-9_-]+$/u.test(name)) throw new Error("Invalid verification executable name");
  for (const entry of (process.env.PATH ?? process.env.Path ?? "").split(delimiter)) {
    const directory = process.platform === "win32" ? entry.replace(/^"(.*)"$/u, "$1") : entry;
    const path = resolve(directory || root, `${name}${process.platform === "win32" ? ".exe" : ""}`);
    let executable: string;
    try {
      await access(path, constants.X_OK);
      executable = await realpath(path);
    } catch (error) {
      if (
        !(
          error instanceof Error &&
          "code" in error &&
          ["ENOENT", "ENOTDIR", "EACCES"].includes(String(error.code))
        )
      )
        throw error;
      continue;
    }
    return process.platform === "win32" && name === "git"
      ? await resolveWindowsGitLauncher(root, executable)
      : executable;
  }
  throw new Error(`Missing verification executable: ${name}`);
}

/** Run verification through the same Windows launcher even when Git prepends its core path. */
export async function verificationEnvironment(
  root: string,
): Promise<Record<string, string | undefined>> {
  const environment = { ...process.env };
  if (process.platform !== "win32") return environment;
  const git = await resolveVerificationTool("git", root);
  const directory = dirname(git);
  const path = process.env.PATH ?? process.env.Path ?? "";
  for (const name of Object.keys(environment))
    if (name.toLowerCase() === "path") Reflect.deleteProperty(environment, name);
  environment.PATH = [
    directory,
    ...path
      .split(delimiter)
      .filter(
        (entry) =>
          resolve(entry.replace(/^"(.*)"$/u, "$1") || root).toLowerCase() !==
          directory.toLowerCase(),
      ),
  ].join(delimiter);
  return environment;
}
export async function nativeToolIdentity(
  root: string,
): Promise<{ identity: string; git: string; powershell: string }> {
  const git = await resolveVerificationTool("git", root),
    powershell = await resolveVerificationTool("pwsh", root);
  const rows = [
    ["bun", await hashExecutable(process.execPath)],
    ["git-launcher", await hashExecutable(git)],
    ["powershell-launcher", await hashExecutable(powershell)],
  ];
  const executionPath = gitExecutionPath(git, root);
  if (process.platform === "win32")
    rows.push(["git-core", await hashExecutable(resolve(executionPath, "git.exe"))]);
  const home = dirname(await realpath(powershell));
  for (const file of [
    "pwsh.dll",
    "System.Management.Automation.dll",
    "Microsoft.PowerShell.Commands.Management.dll",
    "Microsoft.PowerShell.Commands.Utility.dll",
    "Microsoft.PowerShell.Security.dll",
  ])
    rows.push([file, await hashExecutable(resolve(home, file))]);
  return { identity: encodedDigest(rows), git, powershell };
}
