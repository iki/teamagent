/** Stop hooks request one repair pass, then report failure without an infinite continuation loop. */
export function checkDecision(passed: boolean, alreadyContinued: boolean) {
  if (passed) return {};
  if (alreadyContinued) {
    return {
      systemMessage:
        "Repository verification still fails. Report the failing checks and limitation; do not claim completion.",
    };
  }
  return {
    decision: "block",
    reason:
      "Repository verification failed. Fix the reported failures and run aube run --no-install review:check before completing the response.",
  };
}
