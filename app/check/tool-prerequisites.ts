import { createHash } from "node:crypto";
import { access, open, realpath } from "node:fs/promises";
import { constants } from "node:fs";
import { delimiter, dirname, resolve } from "node:path";
import { encodedDigest } from "./cache-io.ts";
import { verificationLocaleEnvironment } from "./verification-policy.ts";
import {
  gitExecutionPath,
  resolveGitExecution,
  resolveWindowsGitLauncher,
} from "./git-execution.ts";
export { resolveWindowsGitLauncher } from "./git-execution.ts";

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
  const environment = verificationLocaleEnvironment(process.env);
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
  if (process.platform === "win32") {
    rows.push(["git-core", await hashExecutable(resolve(executionPath, "git.exe"))]);
    rows.push(["git-runtime", await hashExecutable(resolve(executionPath, "../../bin/git.exe"))]);
    rows.push(["git-execution", (await resolveGitExecution(root)).prerequisiteIdentity]);
  }
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
