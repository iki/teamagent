import { encodedDigest } from "./cache-io.ts";

export const verificationWriteVariable = "TEAMAGENT_VERIFICATION_CACHE_WRITE";
// Owned scratch routing changes per child; callers validate the complete lease before use.
const temporaryRoutingVariables = new Set([
  "TEAMAGENT_TEMPORARY_ROOT",
  "TEAMAGENT_TEMPORARY_PARENT",
  "TEAMAGENT_TEMPORARY_PARENT_ID",
]);
export type VerificationWritePolicy = "tracked" | "local";

/** Storage routing is not verification evidence or permission to publish. */
export function resolveVerificationWritePolicy(
  environment: NodeJS.ProcessEnv = process.env,
): VerificationWritePolicy {
  const value = environment[verificationWriteVariable] ?? "tracked";
  if (value !== "tracked" && value !== "local")
    throw new Error(`${verificationWriteVariable} must be tracked or local`);
  return value;
}

/** Copy the exact locale used by verification children without changing the caller. */
export function verificationLocaleEnvironment(environment: NodeJS.ProcessEnv): NodeJS.ProcessEnv {
  return { ...environment, LANG: "C.UTF-8", LC_ALL: "C.UTF-8" };
}

export function verificationEnvironmentIdentity(
  environment: NodeJS.ProcessEnv,
  runtime: Pick<
    Intl.ResolvedDateTimeFormatOptions,
    "locale" | "timeZone"
  > = Intl.DateTimeFormat().resolvedOptions(),
): string {
  return encodedDigest({
    environment: Object.entries(verificationLocaleEnvironment(environment))
      .filter(
        ([name]) =>
          name !== verificationWriteVariable &&
          !temporaryRoutingVariables.has(name) &&
          /^(?:CI|NODE_ENV|NODE_OPTIONS|NODE_PATH|TZ|LANG|LC_ALL|TEAMAGENT_[A-Z0-9_]+|PLAYWRIGHT_[A-Z0-9_]+|BUN_[A-Z0-9_]+|VITE_[A-Z0-9_]+|PYTHON[A-Z0-9_]+)$/u.test(
            name,
          ),
      )
      .sort(([a], [b]) => a.localeCompare(b, "en")),
    // Updating process.env does not change a runtime's already selected Intl defaults.
    locale: runtime.locale,
    timeZone: runtime.timeZone,
  });
}
