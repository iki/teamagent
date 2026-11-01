import { test } from "bun:test";
import { execFileSync } from "node:child_process";
import { join } from "node:path";
import { defaultImportPython } from "../app/imports/documents.ts";
import { processEnvironment } from "../app/imports/process.ts";
import { mkdtempSync } from "./temporary.ts";

test("external citation pins verify offline and reject changed origins, missing commits and path escapes", () => {
  // Allocate beside other fixtures in the validated owner, not below nested command scratch.
  const temporary = mkdtempSync("cite-");
  execFileSync(
    defaultImportPython(),
    ["-I", "-B", join(import.meta.dir, "citation-sources-fixture.py")],
    {
      env: { ...processEnvironment(), TEMP: temporary, TMP: temporary, TMPDIR: temporary },
      timeout: 30_000,
      maxBuffer: 65_536,
      windowsHide: true,
    },
  );
});
