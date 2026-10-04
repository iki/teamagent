import { spawnSync } from "node:child_process";
import { root } from "./tools.ts";

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
for (const args of steps) {
  const result = spawnSync(process.execPath, args, {
    cwd: root,
    stdio: "inherit",
    shell: false,
    windowsHide: true,
    timeout: 1_800_000,
  });
  if (result.error) throw result.error;
  if (result.status !== 0) {
    process.exitCode = result.status ?? 1;
    break;
  }
}
