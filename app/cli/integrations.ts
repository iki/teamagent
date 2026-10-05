import { homedir } from "node:os";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { Effect } from "effect";
import type { HarnessConfig } from "@/harness";
import { IntegrationError } from "@/integrations";
import { createIntegrationService } from "../integrations/index.ts";
import { resolveMemoryExtractor } from "../runtime/memory.ts";

interface IntegrationFlags {
  readonly root?: string | undefined;
  readonly scope?: string | undefined;
  readonly components?: string | undefined;
  readonly python?: string | undefined;
  readonly extractorsConfig?: string | undefined;
  readonly extractor?: string | undefined;
}

export async function runIntegrationCommand(
  action: string,
  agent: string | undefined,
  config: HarnessConfig,
  flags: IntegrationFlags,
  print: (value: unknown) => void,
) {
  if (flags.extractorsConfig !== undefined || flags.extractor !== undefined)
    await Effect.runPromise(resolveMemoryExtractor(flags));
  const integrations = createIntegrationService({
    home: homedir(),
    projectRoot: resolve(flags.root ?? process.cwd()),
    repositoryRoot: fileURLToPath(new URL("../../", import.meta.url)),
    bunPath: process.execPath,
    dataDirectory: config.data,
    environment: process.env,
    searchPath: process.env.PATH ?? "",
    ...(flags.python === undefined ? {} : { python: resolve(flags.python) }),
    ...(flags.extractorsConfig === undefined
      ? {}
      : { extractorsConfig: resolve(flags.extractorsConfig) }),
    ...(flags.extractor === undefined ? {} : { extractor: flags.extractor }),
  });
  if (action === "list") {
    print(await Effect.runPromise(integrations.list()));
    return;
  }
  if (agent === undefined)
    throw new IntegrationError({ code: "invalid", message: "An agent ID is required." });
  const input = { agent, scope: flags.scope ?? "project", components: flags.components ?? "both" };
  if (action === "plan") print(await Effect.runPromise(integrations.plan(input)));
  else if (action === "install") print(await Effect.runPromise(integrations.install(input)));
  else throw new IntegrationError({ code: "invalid", message: "Unknown integration command." });
}
