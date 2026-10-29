import { fileURLToPath } from "node:url";
import { Schema } from "effect";
import { completeHook } from "./completion.ts";
import { readInput } from "../conversations/input.ts";
import { runHookCommand } from "./process.ts";

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
  const controller = new AbortController();
  const cancel = (): void => controller.abort();
  process.once("SIGINT", cancel);
  process.once("SIGTERM", cancel);
  const failedReceipts: string[] = [];
  let unavailable = false;
  const run = async (phase: "archive" | "review"): Promise<boolean> => {
    try {
      const observed = await runHookCommand(root, phase, phase === "archive" ? input : undefined, {
        signal: controller.signal,
      });
      if (!observed.passed) failedReceipts.push(observed.receipt);
      return observed.passed;
    } catch {
      unavailable = true;
      return false;
    }
  };
  try {
    const result = await completeHook(
      event.hook_event_name,
      event.stop_hook_active ?? false,
      () => run("archive"),
      () => run("review"),
    );
    const details = [
      result.systemMessage,
      ...(failedReceipts.length ? [`Safe hook diagnostics: ${failedReceipts.join(", ")}.`] : []),
      ...(unavailable
        ? [
            "A hook diagnostic receipt could not be completed; inspect retained pending receipts and cache capacity.",
          ]
        : []),
    ]
      .filter(Boolean)
      .join(" ");
    process.stdout.write(
      `${JSON.stringify(details ? { ...result, systemMessage: details } : result)}\n`,
    );
  } finally {
    process.removeListener("SIGINT", cancel);
    process.removeListener("SIGTERM", cancel);
  }
} catch {
  process.stderr.write(
    "Agent hook failed: check its input, archive availability and installed Bun dependencies.\n",
  );
  process.exitCode = 1;
}
