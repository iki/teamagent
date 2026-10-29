import { spawnSync } from "node:child_process";
import { mkdirSync } from "node:fs";
import { createRequire } from "node:module";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { cli } from "cleye";
import { createConsola } from "consola";
import { Effect } from "effect";
import { version } from "../../package.json";
import {
  runBuildStage,
  validateBuildOutputPath,
  webBuildEnvironmentFiles,
} from "../check/build-cache.ts";
import { createDependencyRuntime } from "../dependencies/runtime.ts";

const argv = cli({
  name: "build-desktop",
  parameters: ["[mode]"],
  strictFlags: true,
  flags: {
    version: { type: Boolean, alias: "V", description: "Show the shared Teamagent version" },
    cache: {
      type: Boolean,
      description:
        "Opt in to validated local daemon preparation reuse; native build/test still runs",
    },
    forceFreshCache: {
      type: Boolean,
      description: "Enable preparation caching but rebuild and validate the daemon",
    },
  },
  help: {
    version,
    description:
      "Build, debug or test the desktop. Only daemon compilation can be reused; Vite preparation and locked Cargo/Tauri work remain live. The default build does not use preparation caching.",
  },
});
if (argv.flags.version) {
  process.stdout.write(`${version}\n`);
  process.exit(0);
}
const mode = argv._.mode ?? "build";
if (argv._.length > 1 || argv._["--"].length !== 0 || !["build", "debug", "test"].includes(mode))
  throw new Error("Use build-desktop [build|debug|test] [--cache|--force-fresh-cache].");
const root = resolve(dirname(fileURLToPath(import.meta.url)), "../..");
const desktop = join(root, "app/desktop");
const require = createRequire(import.meta.url);

await Effect.runPromise(createDependencyRuntime({ root }).check());

function run(executable: string, args: readonly string[], cwd = root): void {
  const child = spawnSync(executable, args, {
    cwd,
    stdio: "inherit",
    timeout: 900_000,
    windowsHide: true,
  });
  if (child.error) throw child.error;
  if (child.status !== 0)
    throw new Error(`Build tool failed with exit code ${child.status ?? "unknown"}.`);
}

const rust = spawnSync("rustc", ["--print", "host-tuple"], {
  encoding: "utf8",
  windowsHide: true,
  timeout: 10000,
});
if (rust.status !== 0 || !/^[a-z0-9_-]+\s*$/.test(rust.stdout))
  throw new Error(
    "A working Rust toolchain is required on PATH. Install the Tauri native prerequisites first.",
  );
const target = rust.stdout.trim();
const extension = process.platform === "win32" ? ".exe" : "";
const binaries = join(desktop, "src-tauri/binaries");
const binaryPath = `app/desktop/src-tauri/binaries/teamagent-daemon-${target}${extension}`;
await validateBuildOutputPath(root, binaryPath, true);
mkdirSync(binaries, { recursive: true });
run(process.execPath, [
  join(dirname(require.resolve("vite/package.json")), "bin/vite.js"),
  "build",
  "--config",
  "app/web/vite.config.ts",
]);
const compileArguments = [
  "build",
  "--compile",
  "--minify",
  "app/cli/index.ts",
  "--outfile",
  join(root, binaryPath),
];
const preparation = await runBuildStage(
  root,
  {
    id: "desktop-daemon",
    inputs: ["app", "lib", "tsconfig.json", "tsconfig.lib.json", "tsconfig.tools.json"],
    outputs: [binaryPath],
    externalInputs: webBuildEnvironmentFiles,
    values: [
      "bun-compile",
      target,
      "build",
      "--compile",
      "--minify",
      "app/cli/index.ts",
      "--outfile",
      binaryPath,
    ],
  },
  async () => {
    run(process.execPath, compileArguments);
  },
  {
    enabled: Boolean(argv.flags.cache || argv.flags.forceFreshCache),
    forceFresh: argv.flags.forceFreshCache ?? false,
  },
);
if (argv.flags.cache || argv.flags.forceFreshCache)
  createConsola({ stdout: process.stderr, stderr: process.stderr }).info(
    `Desktop daemon preparation ${preparation.hit ? "reused after full output validation" : "executed and validated"}; native work remains live`,
  );
if (mode === "test") {
  run("cargo", ["test", "--locked", "--manifest-path", "app/desktop/src-tauri/Cargo.toml"]);
} else {
  run(
    process.execPath,
    [
      join(root, "app/dependencies/trigon/tauri-cli.ts"),
      "build",
      "--no-bundle",
      ...(mode === "debug" ? ["--debug"] : []),
      "--",
      "--locked",
    ],
    desktop,
  );
}
