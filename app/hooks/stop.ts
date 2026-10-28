import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { Schema } from "effect";
import { completeHook } from "./completion.ts";
import { readInput } from "../conversations/input.ts";

const root = fileURLToPath(new URL("../../", import.meta.url));
const HookEvent = Schema.Struct({
  hook_event_name: Schema.Literals(["Stop", "SubagentStop"]),
  stop_hook_active: Schema.optional(Schema.Boolean),
});

try {
  if (!process.versions.bun) throw new Error("Hooks require Bun");
  if (process.argv.length > 2) throw new Error("This adapter accepts JSON stdin only");
  const input = await readInput(process.stdin);
  const event = Schema.decodeUnknownSync(Schema.fromJsonString(HookEvent))(input);
  const result = completeHook(
    event.hook_event_name,
    event.stop_hook_active ?? false,
    () => {
      const archive = spawnSync(process.execPath, ["app/conversations/record.ts"], {
        cwd: root,
        input,
        encoding: "utf8",
        shell: false,
        windowsHide: true,
        timeout: 60_000,
        maxBuffer: 2_000_000,
      });
      return !archive.error && archive.status === 0;
    },
    () => {
      const check = spawnSync(process.execPath, ["app/check/index.ts"], {
        cwd: root,
        stdio: ["ignore", 2, 2],
        shell: false,
        windowsHide: true,
        timeout: 300_000,
      });
      return !check.error && check.status === 0;
    },
  );
  process.stdout.write(`${JSON.stringify(result)}\n`);
} catch {
  process.stderr.write(
    "Agent hook failed: check its input, archive availability and installed Bun dependencies.\n",
  );
  process.exitCode = 1;
}
