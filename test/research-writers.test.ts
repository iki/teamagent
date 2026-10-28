import { test } from "bun:test";
import assert from "node:assert/strict";
import { resolve } from "node:path";

test("Research Python writers publish UTF-8/LF files and streams", () => {
  const python =
    process.env.TEAMAGENT_TEST_PYTHON ??
    resolve(
      process.platform === "win32"
        ? ".cache/import-python/Scripts/python.exe"
        : ".cache/import-python/bin/python",
    );
  const result = Bun.spawnSync([python, "-B", resolve("test/research-writers-fixtures.py")], {
    cwd: resolve("."),
    stdout: "pipe",
    stderr: "pipe",
    timeout: 30_000,
  });
  assert.equal(
    result.exitCode,
    0,
    new TextDecoder().decode(result.stdout) + new TextDecoder().decode(result.stderr),
  );
  assert.equal(result.stdout.includes(13), false);
  assert.equal(result.stderr.includes(13), false);
}, 35_000);
