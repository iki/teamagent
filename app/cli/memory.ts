import { resolve } from "node:path";
import { Effect } from "effect";
import type { HarnessConfig } from "@/harness";
import { MemoryError } from "@/memory";
import { importDoctor } from "../imports/documents.ts";
import { setupImports } from "../imports/setup.ts";
import { openMemoryHost, resolveMemoryExtractor } from "../runtime/memory.ts";
import { loadExtractorConfig, inspectExtractorProfile } from "../imports/extractors.ts";
import { serveMemoryMcp, serializeMemoryRead } from "../mcp/index.ts";
import { withHostInterruption } from "../runtime/interruption.ts";

interface MemoryFlags {
  readonly root?: string | undefined;
  readonly workspace?: string | undefined;
  readonly kind?: string | undefined;
  readonly convert?: boolean | undefined;
  readonly sourceVersion?: string | undefined;
  readonly path?: string | undefined;
  readonly limit?: number | undefined;
  readonly offset?: number | undefined;
  readonly length?: number | undefined;
  readonly output?: string | undefined;
  readonly python?: string | undefined;
  readonly extractorsConfig?: string | undefined;
  readonly extractor?: string | undefined;
  readonly allowRoot?: readonly string[] | undefined;
  readonly allowPrivateNetwork?: boolean | undefined;
}

export async function runMemoryCommand(
  action: string,
  argument: string | undefined,
  config: HarnessConfig,
  flags: MemoryFlags,
  print: (value: unknown) => void,
) {
  if (action === "mcp") return dispatchMemoryCommand(action, argument, config, flags, print);
  return withHostInterruption(async (signal) => {
    try {
      return await dispatchMemoryCommand(action, argument, config, flags, print, signal);
    } catch (error: unknown) {
      if (signal.aborted)
        throw new MemoryError({ code: "cancelled", message: "Memory operation was interrupted." });
      throw error;
    }
  });
}

async function dispatchMemoryCommand(
  action: string,
  argument: string | undefined,
  config: HarnessConfig,
  flags: MemoryFlags,
  print: (value: unknown) => void,
  signal?: AbortSignal,
) {
  const runOptions = signal === undefined ? {} : { signal };
  if (action === "extractors") {
    if (flags.extractorsConfig === undefined)
      throw new MemoryError({
        code: "invalid",
        message: "Listing profiles requires --extractors-config naming an explicit trusted file.",
      });
    const configuration = await Effect.runPromise(
      loadExtractorConfig(resolve(flags.extractorsConfig)),
      runOptions,
    );
    print({
      defaultProfile: configuration.defaultProfile,
      profiles: configuration.profiles.map((profile) => ({
        id: profile.id,
        engine: profile.engine,
        ...(profile.engine === "builtin"
          ? {}
          : { version: profile.version, timeoutMs: profile.timeoutMs }),
      })),
    });
    return;
  }
  if (action === "doctor") {
    const extractor = await Effect.runPromise(resolveMemoryExtractor(flags), runOptions);
    if (extractor !== undefined && extractor.engine !== "builtin") {
      print(await Effect.runPromise(inspectExtractorProfile(extractor), runOptions));
      return;
    }
    print(
      await Effect.runPromise(
        importDoctor(flags.python === undefined ? {} : { python: resolve(flags.python) }),
        runOptions,
      ),
    );
    return;
  }
  if (action === "setup") {
    print(await Effect.runPromise(setupImports(), runOptions));
    return;
  }
  // Finish acquiring the store before observing interruption so its close remains owned.
  const memory = await Effect.runPromise(
    openMemoryHost({
      data: config.data,
      root: flags.root,
      workspace: flags.workspace,
      python: flags.python === undefined ? undefined : resolve(flags.python),
      extractorsConfig: flags.extractorsConfig,
      extractor: flags.extractor,
      allowRoot: flags.allowRoot,
      allowPrivateNetwork: flags.allowPrivateNetwork,
      mcp: action === "mcp",
    }),
  );
  if (action === "mcp") {
    serveMemoryMcp(memory);
    return;
  }
  try {
    const page = {
      ...(flags.offset === undefined ? {} : { offset: flags.offset }),
      ...(flags.limit === undefined ? {} : { limit: flags.limit }),
    };
    if (action === "list") {
      print(await Effect.runPromise(memory.list(page), runOptions));
      return;
    }
    if (argument === undefined)
      throw new MemoryError({ code: "invalid", message: "A source, query or ID is required." });
    switch (action) {
      case "get":
        print(
          await Effect.runPromise(
            memory.get({
              locator: argument,
              ...(flags.kind === undefined ? {} : { kind: flags.kind }),
              ...(flags.convert === undefined ? {} : { convert: flags.convert }),
            }),
            runOptions,
          ),
        );
        break;
      case "sync":
        print(await Effect.runPromise(memory.sync(argument), runOptions));
        break;
      case "show":
        print(await Effect.runPromise(memory.show(argument, page), runOptions));
        break;
      case "search":
        print(
          await Effect.runPromise(
            memory.search({
              query: argument,
              ...(flags.limit === undefined ? {} : { limit: flags.limit }),
            }),
            runOptions,
          ),
        );
        break;
      case "read": {
        const read = await Effect.runPromise(
          memory.read(argument, flags.path, flags.sourceVersion),
          runOptions,
        );
        print(serializeMemoryRead(read, flags.offset, flags.length));
        break;
      }
      case "export":
        if (flags.output === undefined)
          throw new MemoryError({
            code: "invalid",
            message: "Export requires --output naming a new directory.",
          });
        print(
          await Effect.runPromise(
            memory.export(argument, resolve(flags.output), flags.sourceVersion),
            runOptions,
          ),
        );
        break;
      case "delete":
        await Effect.runPromise(memory.delete(argument), runOptions);
        print({ deleted: argument });
        break;
      default:
        throw new MemoryError({ code: "invalid", message: "Unknown memory command." });
    }
  } finally {
    await Effect.runPromise(memory.close());
  }
}
