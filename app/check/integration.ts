import { root } from "./tools.ts";
import { spawnOwned } from "./owned-process.ts";
import { createTemporaryWorkspace, temporaryParent } from "./temporary-workspace.ts";

const mode = process.argv[2];
if (process.argv.length !== 3 || (mode !== "web" && mode !== "desktop"))
  throw new Error("Use integration.ts web|desktop");
const steps =
  mode === "web"
    ? [["app/web/build.ts"], ["test/web-browser.ts"]]
    : [
        ["app/desktop/build.ts", "test"],
        ["app/desktop/build.ts", "debug"],
        ["test/desktop-browser.ts"],
      ];
const controller = new AbortController();
const interrupt = (): void => controller.abort();
process.once("SIGINT", interrupt);
process.once("SIGTERM", interrupt);
const parent = await temporaryParent(process.env, root);
const workspace = await createTemporaryWorkspace(root, `integration-${mode}`, parent);
let safeToDispose = true;
try {
  for (const args of steps) {
    const owned = await spawnOwned(process.execPath, args, {
      cwd: root,
      stdio: "inherit",
      env: workspace.environment(process.env),
      signal: controller.signal,
      timeoutMs: 1_800_000,
    });
    safeToDispose = false;
    const result = await owned.closed;
    safeToDispose = result.termination === "closed";
    if (!safeToDispose) throw new Error("Integration descendant shutdown could not be confirmed");
    if (result.error) throw result.error;
    if (result.code !== 0) {
      process.exitCode = result.code ?? 1;
      break;
    }
  }
} finally {
  process.removeListener("SIGINT", interrupt);
  process.removeListener("SIGTERM", interrupt);
  if (safeToDispose) await workspace.dispose();
}
