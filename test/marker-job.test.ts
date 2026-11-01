import { assertTemporaryFixture, mkdtemp } from "./temporary.ts";
import { test, expect } from "bun:test";
import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { mkdir, readFile, realpath } from "node:fs/promises";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { Schema } from "effect";
import { defaultImportPython } from "../app/imports/documents.ts";

import { processEnvironment } from "../app/imports/process.ts";
import { removeExtractorStaging } from "../app/imports/extractors.ts";

test.skipIf(process.platform !== "win32")(
  "extractor cleanup explicitly retries a Windows cwd lock until its owner exits",
  async () => {
    const parent = await realpath(tmpdir());
    const directory = await realpath(await mkdtemp(join(parent, "teamagent-marker-lock-")));
    const locked = join(directory, "owned-staging");
    const ready = join(directory, "ready");
    await mkdir(locked);
    const child = spawn(
      defaultImportPython(),
      [
        "-I",
        "-B",
        "-c",
        "import pathlib,sys,time; pathlib.Path(sys.argv[1]).write_text('ready'); time.sleep(60)",
        ready,
      ],
      {
        cwd: locked,
        windowsHide: true,
        detached: false,
        stdio: "ignore",
        env: processEnvironment(),
      },
    );
    const completion = new Promise<void>((done, reject) => {
      child.on("error", reject);
      child.on("close", () => done());
    });
    let timer: ReturnType<typeof setTimeout> | undefined;
    try {
      let started = false;
      for (let attempt = 0; attempt < 100; attempt++) {
        try {
          started = (await readFile(ready, "utf8")) === "ready";
          if (started) break;
        } catch {
          await Bun.sleep(20);
        }
      }
      assert.ok(started, "Fixture must own its working-directory lock before cleanup");
      const began = performance.now();
      timer = setTimeout(() => child.kill("SIGKILL"), 350);
      await removeExtractorStaging(locked, directory);
      expect(performance.now() - began).toBeGreaterThanOrEqual(300);
      await assert.rejects(realpath(locked));
    } finally {
      if (timer !== undefined) clearTimeout(timer);
      child.kill("SIGKILL");
      await completion;
      await assertTemporaryFixture(directory);
      await removeExtractorStaging(directory, dirname(directory));
    }
  },
);

test.skipIf(process.platform !== "win32")(
  "Marker Windows job terminates detached helpers after success, failure and abrupt launcher cancellation",
  async () => {
    const parent = await realpath(tmpdir());
    const directory = await realpath(await mkdtemp(join(parent, "teamagent-marker-job-")));
    try {
      for (const mode of ["success", "failure", "cancel"]) {
        const pidFile = join(directory, `${mode}.pid`);
        const child = spawn(
          defaultImportPython(),
          [
            "-I",
            "-B",
            join(import.meta.dir, "marker-job-fixture.py"),
            join(import.meta.dir, "../app/imports/marker-windows.py"),
            mode,
            pidFile,
          ],
          {
            cwd: directory,
            windowsHide: true,
            detached: false,
            stdio: "ignore",
            env: processEnvironment(),
          },
        );
        const completion = new Promise<number | null>((resolveExit, reject) => {
          child.on("error", reject);
          child.on("close", resolveExit);
        });
        let pid: number | undefined;
        try {
          for (let attempt = 0; attempt < 100; attempt++) {
            try {
              const dynamic: unknown = Number(await readFile(pidFile, "ascii"));
              pid = Schema.decodeUnknownSync(Schema.Int.check(Schema.isGreaterThan(0)))(dynamic);
              break;
            } catch {
              await Bun.sleep(20);
            }
          }
          assert.ok(pid !== undefined, "Launcher fixture must start its detached helper");
          if (mode === "cancel") child.kill("SIGKILL");
          const exit = await completion;
          if (mode !== "cancel") expect(exit).toBe(mode === "success" ? 0 : 7);
          // Win32 job termination is asynchronous, but every owned PID must exit promptly.
          let alive = true;
          for (let attempt = 0; attempt < 100; attempt++) {
            try {
              process.kill(pid, 0);
              await Bun.sleep(20);
            } catch {
              alive = false;
              break;
            }
          }
          expect(alive).toBe(false);
        } finally {
          child.kill("SIGKILL");
          await completion;
        }
      }
    } finally {
      await assertTemporaryFixture(directory);
      await removeExtractorStaging(directory, dirname(directory));
    }
  },
);
