import { checkDecision } from "./decision.ts";

/** Logging and code verification are independent obligations; either can fail. */
export async function completeHook(
  event: "Stop" | "SubagentStop",
  alreadyContinued: boolean,
  archive: () => boolean | Promise<boolean>,
  verify: () => boolean | Promise<boolean>,
) {
  async function attempt(action: () => boolean | Promise<boolean>): Promise<boolean> {
    try {
      return await action();
    } catch {
      return false;
    }
  }
  const archived = await attempt(archive);
  // Concurrent subagents share a checkout; only the main Stop checks assembled work.
  const decision = event === "Stop" ? checkDecision(await attempt(verify), alreadyContinued) : {};
  if (archived) return decision;
  return {
    ...decision,
    systemMessage: [
      decision.systemMessage,
      "Conversation archive failed. Run conversations:record with validated public input; this reply has not been saved.",
    ]
      .filter(Boolean)
      .join(" "),
  };
}
