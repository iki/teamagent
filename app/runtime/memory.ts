import { createHash } from "node:crypto";
import { realpath, stat } from "node:fs/promises";
import { dirname, isAbsolute, join, relative, resolve } from "node:path";
import { Effect, Layer } from "effect";
import { MemoryError, MemoryService, type MemoryApi } from "@/memory";
import { openStore } from "../storage/index.ts";
import { openMemory } from "../memory/index.ts";
import { createSourceCapture } from "../imports/index.ts";
import { loadExtractorConfig, resolveExtractorProfile } from "../imports/extractors.ts";

export interface MemoryHostOptions {
  readonly data: string;
  readonly root?: string | undefined;
  readonly workspace?: string | undefined;
  readonly python?: string | undefined;
  readonly extractorsConfig?: string | undefined;
  readonly extractor?: string | undefined;
  readonly allowRoot?: readonly string[] | undefined;
  readonly allowPrivateNetwork?: boolean | undefined;
  readonly mcp?: boolean | undefined;
}

/** Extractor commands come only from explicitly chosen trusted host configuration. */
export const resolveMemoryExtractor = Effect.fnUntraced(function* (
  options: Pick<MemoryHostOptions, "extractorsConfig" | "extractor">,
) {
  if (options.extractorsConfig === undefined) {
    if (options.extractor !== undefined)
      return yield* new MemoryError({
        code: "invalid",
        message: "Selecting an extractor requires an explicit extractors configuration file.",
      });
    return undefined;
  }
  const config = yield* loadExtractorConfig(resolve(options.extractorsConfig));
  return yield* resolveExtractorProfile(config, options.extractor);
});

export async function resolveMemoryScope(options: MemoryHostOptions) {
  if (options.root !== undefined && options.workspace !== undefined)
    throw new MemoryError({ code: "invalid", message: "Select either --root or --workspace." });
  if (options.mcp && options.root === undefined && options.workspace === undefined)
    throw new MemoryError({
      code: "invalid",
      message: "MCP requires an explicit --root or registered --workspace.",
    });
  if (options.workspace !== undefined) {
    const store = await Effect.runPromise(
      openStore({
        databasePath: join(options.data, "state.sqlite"),
        blobDirectory: join(options.data, "blobs"),
      }),
    );
    try {
      const workspace = await Effect.runPromise(store.getWorkspace(options.workspace));
      return { workspaceId: workspace.id, workspaceRoot: await realpath(workspace.path) };
    } finally {
      await Effect.runPromise(store.close());
    }
  }
  const root = await realpath(resolve(options.root ?? process.cwd()));
  if (!(await stat(root)).isDirectory())
    throw new MemoryError({
      code: "invalid",
      message: "The memory root must be an existing directory.",
    });
  const key = process.platform === "win32" ? root.toLowerCase() : root;
  return {
    workspaceId: `root-${createHash("sha256").update(key).digest("hex")}`,
    workspaceRoot: root,
  };
}

function inside(root: string, target: string): boolean {
  const path = relative(root, target);
  return (
    path === "" ||
    (!isAbsolute(path) &&
      path !== ".." &&
      !path.startsWith(`..${process.platform === "win32" ? "\\" : "/"}`))
  );
}

async function createMemoryHost(options: MemoryHostOptions): Promise<MemoryApi> {
  const scope = await resolveMemoryScope(options);
  const extractor = await Effect.runPromise(resolveMemoryExtractor(options));
  const allowedRoots = options.mcp
    ? await Promise.all(
        [scope.workspaceRoot, ...(options.allowRoot ?? [])].map((root) => realpath(resolve(root))),
      )
    : undefined;
  const memory = await Effect.runPromise(
    openMemory({
      dataDirectory: options.data,
      ...scope,
      capture: createSourceCapture({
        ...(allowedRoots === undefined ? {} : { allowedRoots }),
        ...(options.python === undefined ? {} : { python: options.python }),
        ...(extractor === undefined ? {} : { extractor }),
        ...(options.allowPrivateNetwork === undefined
          ? {}
          : { allowPrivateNetwork: options.allowPrivateNetwork }),
      }),
    }),
  );
  if (!options.mcp) return memory;
  return {
    ...memory,
    export: (sourceId, directory, versionId) =>
      Effect.tryPromise({
        try: async () => {
          const target = resolve(scope.workspaceRoot, directory);
          const parent = await realpath(dirname(target));
          if (
            !inside(scope.workspaceRoot, parent) ||
            !inside(scope.workspaceRoot, target) ||
            target === scope.workspaceRoot
          )
            throw new MemoryError({
              code: "invalid",
              message: "MCP exports must use a new directory inside its configured workspace.",
            });
          return target;
        },
        catch: (error) =>
          error instanceof MemoryError
            ? error
            : new MemoryError({
                code: "invalid",
                message: "Export parent must be an existing directory in the configured workspace.",
              }),
      }).pipe(Effect.flatMap((target) => memory.export(sourceId, target, versionId))),
  };
}

export const openMemoryHost = (options: MemoryHostOptions): Effect.Effect<MemoryApi, MemoryError> =>
  Effect.tryPromise({
    try: () => createMemoryHost(options),
    catch: (error) =>
      error instanceof MemoryError
        ? error
        : new MemoryError({
            code: "invalid",
            message:
              "Could not open memory. Check the data directory and explicit workspace root or registered workspace ID.",
          }),
  });

export const memoryHostLayer = (options: MemoryHostOptions) =>
  Layer.effect(
    MemoryService,
    Effect.acquireRelease(openMemoryHost(options), (memory) => memory.close().pipe(Effect.orDie)),
  );
