import { isBuiltin } from "node:module";
import { posix } from "node:path";
import type { ESTree } from "@oxlint/plugins";
import { Effect, Option, Ref } from "effect";
import { Diagnostic, Rule, RuleContext, Visitor } from "effect-oxlint";
import { memberName } from "./ast.ts";

const message =
  "Use public @/library entries; keep I/O, runtime execution, and configuration in application adapters.";
const runtimeMethods = [
  "runSync",
  "runSyncExit",
  "runPromise",
  "runPromiseExit",
  "runFork",
  "runCallback",
];
const hostGlobals = [
  "Bun",
  "process",
  "window",
  "document",
  "localStorage",
  "sessionStorage",
  "navigator",
];
const hiddenCalls = ["fetch", "require", "setTimeout", "setInterval", "requestAnimationFrame"];
const loggerConfiguration = ["configure", "configureSync", "reset", "resetSync"];

export const boundaries = Rule.define({
  name: "boundaries",
  meta: Rule.meta({
    type: "problem",
    description: "Keep libraries portable and dependencies public",
  }),
  create: function* () {
    const ctx = yield* RuleContext;
    const file = ctx.filename.replaceAll("\\", "/");
    const library = file.split("/lib/")[1]?.split("/")[0];
    const libraryRoot =
      library === undefined ? undefined : `${file.split("/lib/")[0]}/lib/${library}`;
    // The linter is a trusted host adapter; new exceptions require an explicit architectural decision.
    const domain = library !== undefined && library !== "lint";
    const effectNames = yield* Ref.make<readonly string[]>(["Effect"]);
    const runtimeNames = yield* Ref.make<readonly string[]>([]);
    const loggerNames = yield* Ref.make<readonly string[]>([]);

    function invalidImport(source: string): boolean {
      return (
        (source.startsWith("@/") && !/^@\/[^/]+$/.test(source)) ||
        (libraryRoot !== undefined &&
          source.startsWith(".") &&
          !`${posix.normalize(posix.join(posix.dirname(file), source))}/`.startsWith(
            `${libraryRoot}/`,
          )) ||
        (domain &&
          (isBuiltin(source) ||
            source === "bun" ||
            source.startsWith("bun:") ||
            source === "@/lint" ||
            source === "consola" ||
            source === "c12" ||
            source === "cleye" ||
            source === "react" ||
            source.startsWith("react/") ||
            source === "react-dom" ||
            source.startsWith("react-dom/") ||
            source.startsWith("@tauri-apps/") ||
            source.startsWith("@effect/platform") ||
            source === "effect/BunRuntime" ||
            source === "effect/NodeRuntime")) ||
        (libraryRoot === undefined &&
          source.startsWith(".") &&
          posix.normalize(posix.join(posix.dirname(file), source)).includes("/lib/"))
      );
    }

    return Visitor.merge(
      Visitor.on(
        "ImportDeclaration",
        Effect.fnUntraced(function* (node: ESTree.ImportDeclaration) {
          const source = node.source.value;
          for (const specifier of node.specifiers) {
            if (specifier.type === "ImportNamespaceSpecifier" && source === "effect/Effect")
              yield* Ref.update(effectNames, (names) => [...names, specifier.local.name]);
            if (specifier.type === "ImportNamespaceSpecifier" && source === "@logtape/logtape")
              yield* Ref.update(loggerNames, (names) => [...names, specifier.local.name]);
            if (specifier.type === "ImportSpecifier" && specifier.imported.type === "Identifier") {
              if (source === "effect" && specifier.imported.name === "Effect")
                yield* Ref.update(effectNames, (names) => [...names, specifier.local.name]);
              if (source === "effect/Effect" && runtimeMethods.includes(specifier.imported.name))
                yield* Ref.update(runtimeNames, (names) => [...names, specifier.local.name]);
            }
          }
          const configuresLogger =
            domain &&
            source === "@logtape/logtape" &&
            node.specifiers.some(
              (specifier) =>
                specifier.type === "ImportSpecifier" &&
                specifier.imported.type === "Identifier" &&
                loggerConfiguration.includes(specifier.imported.name),
            );
          if (invalidImport(source) || configuresLogger)
            yield* ctx.report(Diagnostic.make({ node, message }));
        }),
      ),
      Visitor.on("ExportNamedDeclaration", (node) =>
        node.source && invalidImport(node.source.value)
          ? ctx.report(Diagnostic.make({ node, message }))
          : Effect.void,
      ),
      Visitor.on("ExportAllDeclaration", (node) =>
        invalidImport(node.source.value)
          ? ctx.report(Diagnostic.make({ node, message }))
          : Effect.void,
      ),
      Visitor.on("ImportExpression", (node) =>
        domain ||
        (node.source.type === "Literal" &&
          typeof node.source.value === "string" &&
          invalidImport(node.source.value))
          ? ctx.report(Diagnostic.make({ node, message }))
          : Effect.void,
      ),
      Visitor.on(
        "MemberExpression",
        Effect.fnUntraced(function* (node: ESTree.MemberExpression) {
          const property = memberName(node);
          const object = node.object.type === "Identifier" ? node.object.name : undefined;
          const effectAliases = yield* Ref.get(effectNames);
          const loggerAliases = yield* Ref.get(loggerNames);
          const hostAccess =
            domain &&
            object !== undefined &&
            (hostGlobals.includes(object) ||
              (object === "globalThis" &&
                Option.exists(
                  property,
                  (name) => hostGlobals.includes(name) || hiddenCalls.includes(name),
                )) ||
              (loggerAliases.includes(object) &&
                Option.exists(property, (name) => loggerConfiguration.includes(name))) ||
              (effectAliases.includes(object) &&
                Option.exists(property, (name) => runtimeMethods.includes(name))));
          if (hostAccess) yield* ctx.report(Diagnostic.make({ node, message }));
        }),
      ),
      Visitor.on(
        "CallExpression",
        Effect.fnUntraced(function* (node: ESTree.CallExpression) {
          const callee = node.callee;
          const bare = callee.type === "Identifier" ? callee.name : undefined;
          const object =
            callee.type === "MemberExpression" && callee.object.type === "Identifier"
              ? callee.object.name
              : undefined;
          const property = callee.type === "MemberExpression" ? memberName(callee) : Option.none();
          const runtimeAliases = yield* Ref.get(runtimeNames);
          const invalid =
            object === "console" ||
            (domain &&
              ((bare !== undefined &&
                (hiddenCalls.includes(bare) || runtimeAliases.includes(bare))) ||
                (object === "JSON" && Option.contains(property, "parse")) ||
                (object === "Date" && Option.contains(property, "now")) ||
                (object === "Math" && Option.contains(property, "random")) ||
                (object === "performance" && Option.contains(property, "now")) ||
                (object === "crypto" &&
                  Option.exists(property, (name) =>
                    ["randomUUID", "getRandomValues"].includes(name),
                  ))));
          if (invalid) yield* ctx.report(Diagnostic.make({ node, message }));
        }),
      ),
      Visitor.on("NewExpression", (node) =>
        domain &&
        node.callee.type === "Identifier" &&
        node.callee.name === "Date" &&
        node.arguments.length === 0
          ? ctx.report(Diagnostic.make({ node, message }))
          : Effect.void,
      ),
    );
  },
});
