import { spawnSync } from "node:child_process";
import { mkdirSync } from "node:fs";
import { createRequire } from "node:module";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "../..");
const desktop = join(root, "app/desktop");
const require = createRequire(import.meta.url);
const arguments_ = process.argv.slice(2);
const mode = arguments_[0] ?? "build";
if (arguments_.length > 1 || !["build", "debug", "test"].includes(mode))
  throw new Error("Use build.ts [build|debug|test].");

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
mkdirSync(binaries, { recursive: true });
run(process.execPath, [
  join(dirname(require.resolve("vite/package.json")), "bin/vite.js"),
  "build",
  "--config",
  "app/web/vite.config.ts",
]);
run(process.execPath, [
  "build",
  "--compile",
  "--minify",
  "app/cli/index.ts",
  "--outfile",
  join(binaries, `teamagent-daemon-${target}${extension}`),
]);
if (mode === "test") {
  run("cargo", ["test", "--locked", "--manifest-path", "app/desktop/src-tauri/Cargo.toml"]);
} else {
  run(
    process.execPath,
    [
      join(dirname(require.resolve("@tauri-apps/cli/package.json")), "tauri.js"),
      "build",
      "--no-bundle",
      ...(mode === "debug" ? ["--debug"] : []),
      "--",
      "--locked",
    ],
    desktop,
  );
}
