import { test } from "bun:test";
import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { join } from "node:path";
import { defaultImportPython } from "../app/imports/documents.ts";
import { processEnvironment } from "../app/imports/process.ts";
import { assertTemporaryFixtureSync, mkdtempSync } from "./temporary.ts";

test("external citation pins verify offline and reject changed origins, missing commits and path escapes", () => {
  // Every Python case receives its own directly owned base. A second temporary
  // layer would push the exact 64-character bare-cache identity past native Git startup.
  // Python compares this inventory with unittest discovery before running any case.
  const fixtures = Array.from({ length: 6 }, () => mkdtempSync("cite-"));
  for (const fixture of fixtures) assertTemporaryFixtureSync(fixture);
  const temporary = fixtures[0];
  assert.ok(temporary);
  execFileSync(
    defaultImportPython(),
    ["-I", "-B", join(import.meta.dir, "citation-sources-fixture.py"), JSON.stringify(fixtures)],
    {
      env: { ...processEnvironment(), TEMP: temporary, TMP: temporary, TMPDIR: temporary },
      timeout: 30_000,
      maxBuffer: 65_536,
      windowsHide: true,
    },
  );
});
