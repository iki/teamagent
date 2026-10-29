import { test } from "node:test";
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { mkdir, mkdtemp, writeFile, rm } from "node:fs/promises";
import { delimiter, dirname, resolve, relative, sep } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const root = dirname(fileURLToPath(new URL("../package.json", import.meta.url)));
const launcher = resolve(root, "app/dependencies/trigon/tauri-cli.ts");

await test("supplied Tauri adapter completes 160 independent native callbacks and preserves CLI rejection", () => {
  const env: NodeJS.ProcessEnv = { ...process.env, NO_COLOR: "1" };
  for (const key of Object.keys(env)) if (key.toLowerCase() === "path") delete env[key];
  env.PATH = [
    dirname(process.execPath),
    ...(process.env.SystemRoot ? [resolve(process.env.SystemRoot, "System32")] : []),
  ].join(delimiter);
  const began = Date.now();
  for (let attempt = 0; attempt < 160; attempt++) {
    assert.ok(Date.now() - began < 110000, "Native regression exceeded its overall deadline");
    const child = spawnSync(process.execPath, [launcher, "--version"], {
      cwd: root,
      env,
      encoding: "utf8",
      timeout: 10000,
      windowsHide: true,
    });
    assert.equal(child.status, 0, `Invocation ${attempt + 1}: ${child.stderr}`);
    assert.match(child.stdout, /^tauri-cli \d+\.\d+\.\d+/);
  }
  const failed = spawnSync(process.execPath, [launcher, "--not-a-tauri-option"], {
    cwd: root,
    env,
    encoding: "utf8",
    timeout: 10000,
    windowsHide: true,
  });
  assert.notEqual(failed.status, 0);
  assert.match(failed.stderr, /unexpected argument/);
});

await test("supplied native lifetime waits for unreferenced callback success/rejection and releases its timer", async () => {
  const base = resolve(root, ".cache/dependencies/tests");
  await mkdir(base, { recursive: true });
  const directory = await mkdtemp(resolve(base, "native-"));
  const entry = resolve(directory, "fixture.ts");
  const imported = pathToFileURL(resolve(root, "app/dependencies/trigon/native-lifetime.ts")).href;
  await writeFile(
    entry,
    `import { withNativeLifetime } from ${JSON.stringify(imported)};\ntry {\n  await withNativeLifetime(() => new Promise<void>((resolve, reject) => {\n    setTimeout(() => process.argv[2] === "fail" ? reject(new Error("native rejection")) : resolve(), 40).unref();\n  }));\n  console.log("callback completed");\n} catch { console.error("native rejection"); process.exitCode = 1; }\n`,
  );
  try {
    for (const outcome of ["pass", "fail"]) {
      const child = spawnSync(process.execPath, [entry, outcome], {
        encoding: "utf8",
        timeout: 5000,
        windowsHide: true,
      });
      assert.equal(child.error, undefined, "Keep-alive timer must be released");
      assert.equal(child.status, outcome === "pass" ? 0 : 1);
      assert.match(
        outcome === "pass" ? child.stdout : child.stderr,
        /callback completed|native rejection/,
      );
    }
  } finally {
    const contained = relative(base, directory);
    assert.ok(contained !== ".." && !contained.startsWith(`..${sep}`));
    await rm(directory, { recursive: true, force: true });
  }
});
