import { access, mkdir, mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { Schema } from "effect";
import { MemoryError } from "@/memory";
import requirements from "./requirements.lock" with { type: "text" };
import { contained } from "./limits.ts";
import { runProcess } from "./process.ts";
import { scopedHostPromise } from "./lifecycle.ts";

export const setupImports = (options: { directory?: string; python?: string } = {}) =>
  scopedHostPromise({
    try: async (signal) => {
      const directory = resolve(
        options.directory ?? join(import.meta.dir, "../../.cache/import-python"),
      );
      const python = join(
        directory,
        process.platform === "win32" ? "Scripts/python.exe" : "bin/python",
      );
      await mkdir(directory, { recursive: true });
      try {
        await access(python);
      } catch {
        await runProcess(options.python ?? "python", ["-m", "venv", directory], {
          signal,
          timeoutMs: 120_000,
        });
      }
      await access(join(directory, "pyvenv.cfg"));
      const identityOutput = await runProcess(
        python,
        [
          "-I",
          "-c",
          "import json,sys; print(json.dumps({'prefix':sys.prefix,'base':sys.base_prefix,'major':sys.version_info.major,'minor':sys.version_info.minor}))",
        ],
        { signal, bytes: 4096 },
      );
      const identityUnknown: unknown = JSON.parse(
        new TextDecoder("utf-8", { fatal: true }).decode(identityOutput),
      );
      const identity = Schema.decodeUnknownSync(
        Schema.Struct({
          prefix: Schema.String,
          base: Schema.String,
          major: Schema.Int,
          minor: Schema.Int,
        }),
      )(identityUnknown);
      if (
        resolve(identity.prefix) !== directory ||
        identity.prefix === identity.base ||
        identity.major !== 3 ||
        identity.minor !== 12
      )
        throw new Error("Setup requires a dedicated Python 3.12 virtual environment");
      const stagingRoot = resolve(tmpdir());
      const staging = await mkdtemp(join(stagingRoot, "teamagent-import-setup-"));
      if (!contained(stagingRoot, staging) || staging === stagingRoot)
        throw new Error("Invalid setup staging directory");
      try {
        const lock = join(staging, "requirements.lock");
        await writeFile(lock, requirements, { flag: "wx" });
        await runProcess(
          python,
          [
            "-I",
            "-m",
            "pip",
            "--isolated",
            "install",
            "--disable-pip-version-check",
            "--only-binary=:all:",
            "--no-deps",
            "--requirement",
            lock,
          ],
          { signal, bytes: 4_194_304, timeoutMs: 300_000 },
        );
        return { python, directory, installed: true };
      } finally {
        await rm(staging, { recursive: true, force: true });
      }
    },
    catch: () =>
      new MemoryError({
        code: "unsupported",
        message:
          "Document worker setup failed. Use Python 3.12 and the pinned requirements; no global packages were modified.",
      }),
  });
