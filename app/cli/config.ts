import { loadConfig } from "c12";
import { Effect, Schema } from "effect";
import { stat } from "node:fs/promises";
import { homedir } from "node:os";
import { dirname, resolve } from "node:path";
import { ConfigSchema, type HarnessConfig } from "@/harness";
import { HarnessError } from "@/tasks";

export interface ConfigOptions {
  readonly config?: string | undefined;
  readonly data?: string | undefined;
  readonly port?: number | undefined;
  readonly cwd?: string | undefined;
}

/** Only an explicitly selected trusted file executes. No ambient discovery or dotenv. */
export const readConfig = Effect.fn("readConfig")(function* (options: ConfigOptions) {
  const cwd = options.cwd ?? process.cwd();
  let fileConfig: unknown = {};
  let base = cwd;
  if (options.config !== undefined) {
    const configFile = resolve(cwd, options.config);
    base = dirname(configFile);
    fileConfig = yield* Effect.tryPromise({
      try: async () => {
        const info = await stat(configFile);
        if (!info.isFile() || info.size > 262144) throw new Error("Invalid configuration file");
        const loaded = await loadConfig<Record<string, unknown>>({
          name: "teamagent",
          cwd: base,
          configFile,
          configFileRequired: true,
          rcFile: false,
          globalRc: false,
          packageJson: false,
          dotenv: false,
          envName: false,
          extend: false,
          giget: false,
          omit$Keys: false,
          merger: (...sources) =>
            sources
              .toReversed()
              .reduce<Record<string, unknown>>((merged, source) => ({ ...merged, ...source }), {}),
        });
        return loaded.config;
      },
      catch: () =>
        new HarnessError({
          code: "invalid",
          message: "Cannot load the explicit trusted configuration file.",
        }),
    });
  }
  const PartialConfig = Schema.Struct({
    port: Schema.optional(ConfigSchema.fields.port),
    data: Schema.optional(ConfigSchema.fields.data),
    pi: ConfigSchema.fields.pi,
  });
  const partial = yield* Schema.decodeUnknownEffect(PartialConfig)(fileConfig, {
    onExcessProperty: "error",
  }).pipe(
    Effect.mapError(
      () =>
        new HarnessError({
          code: "invalid",
          message: "Invalid configuration; only port, data and pi are supported.",
        }),
    ),
  );
  const merged: HarnessConfig = {
    port: options.port ?? partial.port ?? 4318,
    data:
      options.data !== undefined
        ? resolve(cwd, options.data)
        : partial.data !== undefined
          ? resolve(base, partial.data)
          : resolve(homedir(), ".teamagent"),
    ...(partial.pi === undefined ? {} : { pi: partial.pi }),
  };
  return yield* Schema.decodeUnknownEffect(ConfigSchema)(merged).pipe(
    Effect.mapError(
      () => new HarnessError({ code: "invalid", message: "Invalid server configuration." }),
    ),
  );
});
