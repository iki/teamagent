import { spawnSync } from "node:child_process";
import {
  closeSync,
  fstatSync,
  lstatSync,
  openSync,
  readSync,
  realpathSync,
  statSync,
} from "node:fs";
import { delimiter, dirname, basename, isAbsolute, join } from "node:path";
import { Schema } from "effect";

export type Tool = "bun" | "aube";
export type Environment = Record<string, string | undefined>;
const Version = Schema.String.check(Schema.isPattern(/^\d+\.\d+\.\d+(?:-[\w.-]+)?$/));
const AubeVersionOutput = Schema.String.check(
  Schema.isPattern(
    /^\d+\.\d+\.\d+(?:-[\w.-]+)?(?: [a-z0-9]+-[a-z0-9]+(?: \(\d{4}-\d{2}-\d{2}\))?)?$/,
  ),
);
const Package = Schema.Struct({
  engines: Schema.Struct({ bun: Version }),
  packageManager: Schema.String.check(Schema.isPattern(/^aube@\d+\.\d+\.\d+(?:-[\w.-]+)?$/)),
});

export function toolchainPins(root: string): Readonly<Record<Tool, string>> {
  const metadata = Schema.decodeUnknownSync(Schema.fromJsonString(Package))(
    pinText(join(root, "package.json")),
  );
  const bun = Schema.decodeUnknownSync(Version)(pinText(join(root, ".bun-version")).trim());
  if (bun !== metadata.engines.bun) throw new Error("Bun version pins disagree");
  return { bun, aube: metadata.packageManager.slice("aube@".length) };
}

/** Read a fixed, bounded metadata snapshot before decoding its public version pins. */
function pinText(path: string): string {
  const named = lstatSync(path);
  if (!named.isFile() || named.isSymbolicLink() || named.size > 1024 * 1024)
    throw new Error("Toolchain metadata must be a bounded regular file");
  const file = openSync(path, "r");
  try {
    const before = fstatSync(file);
    if (
      !before.isFile() ||
      before.size !== named.size ||
      before.ino !== named.ino ||
      before.dev !== named.dev
    )
      throw new Error("Toolchain metadata changed while opening");
    const bytes = Buffer.alloc(before.size + 1);
    let offset = 0;
    for (;;) {
      const read = readSync(file, bytes, offset, bytes.length - offset, offset);
      if (read === 0) break;
      offset += read;
      if (offset > before.size) throw new Error("Toolchain metadata grew while reading");
    }
    const after = fstatSync(file);
    const final = lstatSync(path);
    if (
      offset !== before.size ||
      after.size !== before.size ||
      after.mtimeMs !== before.mtimeMs ||
      after.ctimeMs !== before.ctimeMs ||
      final.ino !== before.ino ||
      final.dev !== before.dev ||
      !final.isFile() ||
      final.isSymbolicLink()
    )
      throw new Error("Toolchain metadata changed while reading");
    return new TextDecoder("utf-8", { fatal: true }).decode(bytes.subarray(0, offset));
  } finally {
    closeSync(file);
  }
}

export function toolVersionOutput(tool: Tool, output: string): string {
  const text = Schema.decodeUnknownSync(tool === "aube" ? AubeVersionOutput : Version)(
    output.trim(),
  );
  return Schema.decodeUnknownSync(Version)(text.split(" ")[0]);
}

/** Never execute a shim to discover the executable behind it. */
export function physicalToolPath(path: string, tool: Tool | "mise"): string {
  if (!isAbsolute(path)) throw new Error(`The ${tool} executable must be an absolute path`);
  if (/(?:^|[/\\])\.?shims?(?:[/\\]|$)/i.test(path))
    throw new Error(`Refusing a ${tool} shim; select the physical pinned executable`);
  const physical = realpathSync.native(path);
  if (
    /(?:^|[/\\])\.?shims?(?:[/\\]|$)/i.test(physical) ||
    ![tool, `${tool}.exe`].includes(basename(physical).toLowerCase()) ||
    !statSync(physical).isFile()
  )
    throw new Error(`Expected a physical ${tool} executable`);
  return physical;
}

export function prependToolPath(env: Environment, directories: readonly string[]): Environment {
  const result = { ...env };
  const paths: string[] = [];
  for (const [key, value] of Object.entries(result)) {
    if (key.toLowerCase() !== "path") continue;
    if (value) paths.push(...value.split(delimiter));
    delete result[key];
  }
  const seen = new Set<string>();
  result.PATH = [...directories, ...paths]
    .filter((part) => {
      const identity = process.platform === "win32" ? part.toLowerCase() : part;
      if (!part || seen.has(identity)) return false;
      seen.add(identity);
      return true;
    })
    .join(delimiter);
  return result;
}

function probeEnvironment(
  env: Environment,
  controls: Readonly<Record<string, string>>,
  removedKey?: string,
): Environment {
  const clean = Object.fromEntries(
    Object.entries(env).filter(([key]) => {
      const upper = key.toUpperCase();
      return upper !== removedKey && !Object.hasOwn(controls, upper);
    }),
  );
  return { ...clean, ...controls };
}

/** A config-free local Mise lookup is the last PATH candidate. It never runs a tool shim. */
function* pathCandidates(
  root: string,
  tool: Tool,
  version: string,
  env: Environment,
): Generator<string> {
  const paths = Object.entries(env)
    .filter(([key]) => key.toLowerCase() === "path")
    .flatMap(([, value]) => value?.split(delimiter) ?? [])
    .filter(isAbsolute);
  const suffix = process.platform === "win32" ? ".exe" : "";
  if (tool === "bun" && process.versions.bun === version) yield process.execPath;
  for (const directory of paths) yield join(directory, tool + suffix);

  for (const directory of paths) {
    let mise: string;
    try {
      mise = physicalToolPath(join(directory, "mise" + suffix), "mise");
    } catch {
      continue;
    }
    const controls = { MISE_OFFLINE: "true", MISE_AUTO_INSTALL: "false" };
    const lookup = spawnSync(mise, ["--no-config", "which", tool, "--tool", tool + "@" + version], {
      cwd: root,
      shell: false,
      windowsHide: true,
      encoding: "utf8",
      timeout: 10000,
      maxBuffer: 65536,
      env: probeEnvironment(env, controls),
    });
    const output = lookup.stdout?.replace(/\r?\n$/u, "");
    if (lookup.error || lookup.status !== 0 || !output || /[\r\n\0]/u.test(output))
      throw new Error(`Mise could not locate the installed ${tool} ${version}`);
    yield physicalToolPath(output, tool);
    return;
  }
}

export function pinnedTool(
  root: string,
  tool: Tool,
  env: Environment = process.env,
  options: { readonly path?: string; readonly inheritOverride?: boolean } = {},
): string {
  const version = toolchainPins(root)[tool];
  const override =
    options.path ??
    (options.inheritOverride === false
      ? undefined
      : env[tool === "bun" ? "TEAMAGENT_BUN_PATH" : "TEAMAGENT_AUBE_PATH"]);
  let candidates: Iterable<string>;
  if (override !== undefined) candidates = [override];
  else if (env.MISE_INSTALLS_DIR) {
    if (!isAbsolute(env.MISE_INSTALLS_DIR)) throw new Error("MISE_INSTALLS_DIR must be absolute");
    const installs = realpathSync.native(env.MISE_INSTALLS_DIR);
    const executable = process.platform === "win32" ? `${tool}.exe` : tool;
    candidates =
      tool === "bun"
        ? [join(installs, tool, version, "bin", executable)]
        : [
            join(installs, tool, version, ".mise-bins", executable),
            join(installs, tool, version, executable),
            join(installs, tool, version, "bin", executable),
          ];
  } else {
    candidates = pathCandidates(root, tool, version, env);
  }
  for (const candidate of candidates) {
    let executable: string;
    try {
      executable = physicalToolPath(candidate, tool);
    } catch {
      if (override !== undefined) throw new Error(`Invalid physical ${tool} override`);
      continue;
    }
    const probeEnv = prependToolPath(env, [dirname(executable)]);
    const probe = spawnSync(executable, ["--version"], {
      cwd: root,
      shell: false,
      windowsHide: true,
      encoding: "utf8",
      timeout: 10000,
      maxBuffer: 65536,
      env:
        tool === "aube"
          ? probeEnvironment(
              probeEnv,
              { AUBE_MANAGE_PACKAGE_MANAGER_VERSIONS: "false", AUBE_NO_UPDATE_CHECK: "1" },
              "NPM_CONFIG_MANAGE_PACKAGE_MANAGER_VERSIONS",
            )
          : probeEnv,
    });
    if (!probe.error && probe.status === 0 && toolVersionOutput(tool, probe.stdout) === version)
      return executable;
    // A selected physical installation with the wrong identity must not fall back to another version.
    throw new Error(
      `Expected ${tool} ${version}; the selected physical executable failed its version check`,
    );
  }
  const selectionGuidance =
    options.inheritOverride === false
      ? "supply an explicit per-call runtime path"
      : `set TEAMAGENT_${tool.toUpperCase()}_PATH`;
  throw new Error(
    `Missing physical ${tool} ${version}; install the pinned tool or ${selectionGuidance}`,
  );
}

export function toolchainEnvironment(root: string, env: Environment = process.env): Environment {
  const bun = pinnedTool(root, "bun", env);
  const aube = pinnedTool(root, "aube", env);
  return prependToolPath(env, [dirname(bun), dirname(aube)]);
}

/** Git fixtures need only the current Bun; don't require a package manifest for unrelated Git reads. */
export function currentBunEnvironment(env: Environment = process.env): Environment {
  const bun = physicalToolPath(process.execPath, "bun");
  return prependToolPath(env, [dirname(bun)]);
}
