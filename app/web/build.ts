import { cli } from "cleye";
import { createConsola } from "consola";
import { fileURLToPath } from "node:url";
import { resolve } from "node:path";
import {
  runBuildStage,
  validateBuildOutputPath,
  prepareWebBuildEnvironment,
  webBuildEnvironmentIdentity,
  webBuildEnvironmentFiles,
} from "../check/build-cache.ts";
import { version } from "../../package.json";

const argv = cli({
  name: "build-web",
  strictFlags: true,
  flags: {
    version: { type: Boolean, alias: "V", description: "Show the shared Teamagent version" },
    cache: {
      type: Boolean,
      description:
        "Opt in to local preparation reuse with complete input/output validation; current small builds may be faster uncached",
    },
    forceFreshCache: {
      type: Boolean,
      description:
        "Enable the cache but rebuild and validate instead of accepting a matching output",
    },
  },
  help: {
    version,
    description:
      "Build web assets. Cache reuse is opt-in and never replaces browser/native acceptance. DEBUG must be unset to prevent Vite environment-value logging.",
  },
});
if (argv.flags.version) {
  process.stdout.write(`${version}\n`);
  process.exit(0);
}
const root = fileURLToPath(new URL("../../", import.meta.url));
await validateBuildOutputPath(root, "data/web", true);
const environmentIdentity = await prepareWebBuildEnvironment(root);
const result = await runBuildStage(
  root,
  {
    id: "web",
    inputs: ["app/web", "lib", "tsconfig.json", "tsconfig.lib.json", "tsconfig.tools.json"],
    outputs: ["data/web"],
    externalInputs: webBuildEnvironmentFiles,
    values: ["vite", "app/web/vite.config.ts", "es2024", environmentIdentity],
  },
  async () => {
    const { build } = await import("vite");
    await build({ configFile: resolve(root, "app/web/vite.config.ts") });
  },
  {
    enabled: Boolean(argv.flags.cache || argv.flags.forceFreshCache),
    forceFresh: argv.flags.forceFreshCache ?? false,
    validate: async () => {
      if ((await webBuildEnvironmentIdentity(root)) !== environmentIdentity)
        throw new Error("Resolved Vite environment changed during preparation");
    },
  },
);
if (argv.flags.cache || argv.flags.forceFreshCache)
  createConsola({ stdout: process.stderr, stderr: process.stderr }).info(
    `Web preparation ${result.hit ? "reused after full output validation" : "executed and validated"}`,
  );
