import { checkDecision } from "./decision.ts";

/** Logging and code verification are independent obligations; either can fail. */
export function completeHook(
  event: "Stop" | "SubagentStop",
  alreadyContinued: boolean,
  archive: () => boolean,
  verify: () => boolean,
) {
  function attempt(action: () => boolean): boolean {
    try {
      return action();
    } catch {
      return false;
    }
  }
  const archived = attempt(archive);
  // Concurrent subagents share a checkout; only the main Stop checks assembled work.
  const decision = event === "Stop" ? checkDecision(attempt(verify), alreadyContinued) : {};
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
