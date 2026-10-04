import { resolve } from "node:path";
import { Effect } from "effect";
import type { HarnessConfig } from "@/harness";
import { MemoryError } from "@/memory";
import { importDoctor } from "../imports/documents.ts";
import { setupImports } from "../imports/setup.ts";
import { openMemoryHost } from "../runtime/memory.ts";
import { serveMemoryMcp, serializeMemoryRead } from "../mcp/index.ts";

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
  if (action === "doctor") {
    print(
      await Effect.runPromise(
        importDoctor(flags.python === undefined ? {} : { python: resolve(flags.python) }),
      ),
    );
    return;
  }
  if (action === "setup") {
    print(await Effect.runPromise(setupImports()));
    return;
  }
  const memory = await Effect.runPromise(
    openMemoryHost({
      data: config.data,
      root: flags.root,
      workspace: flags.workspace,
      python: flags.python === undefined ? undefined : resolve(flags.python),
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
      print(await Effect.runPromise(memory.list(page)));
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
          ),
        );
        break;
      case "sync":
        print(await Effect.runPromise(memory.sync(argument)));
        break;
      case "show":
        print(await Effect.runPromise(memory.show(argument, page)));
        break;
      case "search":
        print(
          await Effect.runPromise(
            memory.search({
              query: argument,
              ...(flags.limit === undefined ? {} : { limit: flags.limit }),
            }),
          ),
        );
        break;
      case "read": {
        const read = await Effect.runPromise(
          memory.read(argument, flags.path, flags.sourceVersion),
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
          ),
        );
        break;
      case "delete":
        await Effect.runPromise(memory.delete(argument));
        print({ deleted: argument });
        break;
      default:
        throw new MemoryError({ code: "invalid", message: "Unknown memory command." });
    }
  } finally {
    await Effect.runPromise(memory.close());
  }
}
