import { strict as assert } from "node:assert";
import { spawnSync } from "node:child_process";
import { mkdtempSync, mkdirSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { test } from "node:test";
import { fileURLToPath } from "node:url";

await test("Oxlint loads the registered rules and checks parsed TypeScript", () => {
  const root = fileURLToPath(new URL("../", import.meta.url));
  const fixture = mkdtempSync(join(tmpdir(), "teamagent-architecture-"));
  const library = join(fixture, "lib", "domain");
  mkdirSync(library, { recursive: true });
  const file = join(library, "index.ts");
  const args = [
    join(root, "node_modules", "oxlint", "bin", "oxlint"),
    "--config",
    join(root, "oxlint.config.ts"),
    "--deny-warnings",
    file,
  ];

  try {
    writeFileSync(
      file,
      'import { Effect } from "effect";\nexport const value = { count: 1 } as const;\nexport const task = Effect.succeed(value);\n',
    );
    const valid = spawnSync(process.execPath, args, {
      cwd: root,
      encoding: "utf8",
      windowsHide: true,
    });
    assert.ifError(valid.error);
    assert.equal(valid.status, 0, valid.stdout + valid.stderr);

    writeFileSync(
      file,
      [
        'import { Effect } from "effect";',
        "export const value = {} as { readonly trusted: string };",
        "export const task = Effect.runSync(Effect.succeed(1));",
        'export const generated = Function("return 1")();',
      ].join("\n"),
    );
    const invalid = spawnSync(process.execPath, args, {
      cwd: root,
      encoding: "utf8",
      windowsHide: true,
    });
    assert.ifError(invalid.error);
    assert.equal(invalid.status, 1, invalid.stdout + invalid.stderr);
    for (const rule of ["no-unsafe-casts", "boundaries", "no-executable-input"])
      assert.ok(
        (invalid.stdout + invalid.stderr).includes(rule),
        `Expected parsed diagnostic for ${rule}`,
      );
  } finally {
    rmSync(fixture, { recursive: true, force: true });
  }
});
