import { cli } from "cleye";
import { createConsola } from "consola";
import { version } from "../../package.json";
import { verificationCacheStatus } from "./input-cache.ts";
import { root } from "./tools.ts";
import { verifyStagedVerificationReceipts } from "./verification-cache.ts";

const argv = cli({
  name: "verification-cache",
  parameters: ["[operation]", "[id]"],
  strictFlags: true,
  flags: {
    version: { type: Boolean, alias: "V", description: "Show the shared Teamagent version" },
    indexFile: { type: String, description: "Explicit alternate Git index for staged validation" },
    json: { type: Boolean, description: "Emit machine-readable status" },
  },
  help: {
    version,
    description:
      "status [id] inspects Git-history/source equivalence; verify-staged always validates changed staged receipts. Neither operation grants publication authority. Use check --force-fresh to execute rather than reuse.",
  },
});
if (argv.flags.version) {
  process.stdout.write(`${version}\n`);
  process.exit(0);
}
const logger = createConsola({ stdout: process.stderr, stderr: process.stderr });
try {
  if (argv._.operation === "verify-staged" && argv._.id === undefined) {
    await verifyStagedVerificationReceipts(
      root,
      argv.flags.indexFile === undefined ? {} : { indexFile: argv.flags.indexFile },
    );
    logger.success("Changed staged verification receipts match the staged source projection");
  } else if (argv._.operation === "status" && argv.flags.indexFile === undefined) {
    const rows = [];
    for (const id of argv._.id === undefined ? ["format", "types", "lint", "tests"] : [argv._.id])
      rows.push({ id, ...(await verificationCacheStatus(root, id)) });
    if (argv.flags.json)
      process.stdout.write(`${JSON.stringify({ trust: "cooperative-reviewed-evidence", rows })}\n`);
    else
      for (const row of rows)
        logger.info(
          `${row.id}: repository inputs ${row.repositoryInputsMatch ? "match" : "differ or unavailable"}; history ${row.commit ?? "unknown"}; runtime readiness and publication approval are not implied`,
        );
  } else throw new Error("Expected status [id] or verify-staged [--index-file path]");
} catch (error) {
  logger.error(error instanceof Error ? error.message : "Cache inspection failed");
  process.exitCode = 1;
}
