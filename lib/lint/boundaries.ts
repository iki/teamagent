import { isBuiltin } from "node:module";
import type { ESTree } from "@oxlint/plugins";
import { Effect } from "effect";
import { Diagnostic, Rule, RuleContext, Visitor } from "effect-oxlint";

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

function memberName(node: ESTree.MemberExpression): string | undefined {
  if (!node.computed && node.property.type === "Identifier") return node.property.name;
  if (node.computed && node.property.type === "Literal" && typeof node.property.value === "string")
    return node.property.value;
  return undefined;
}

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
    // The linter is a trusted host adapter; new exceptions require an explicit architectural decision.
    const domain = library !== undefined && library !== "lint";
    const effectNames = new Set(["Effect"]);
    const runtimeNames = new Set<string>();
    const loggerNames = new Set<string>();

    function invalidImport(source: string): boolean {
      return (
        (source.startsWith("@/") && !/^@\/[^/]+$/.test(source)) ||
        (library !== undefined && (source === ".." || source.startsWith("../"))) ||
        (domain &&
          (isBuiltin(source) ||
            source === "bun" ||
            source.startsWith("bun:") ||
            source === "@/lint" ||
            source === "consola" ||
            source === "c12" ||
            source.startsWith("@effect/platform") ||
            source === "effect/BunRuntime" ||
            source === "effect/NodeRuntime"))
      );
    }

    return Visitor.merge(
      Visitor.on("ImportDeclaration", (node) => {
        const source = node.source.value;
        for (const specifier of node.specifiers) {
          if (specifier.type === "ImportNamespaceSpecifier" && source === "effect/Effect")
            effectNames.add(specifier.local.name);
          if (specifier.type === "ImportNamespaceSpecifier" && source === "@logtape/logtape")
            loggerNames.add(specifier.local.name);
          if (specifier.type === "ImportSpecifier" && specifier.imported.type === "Identifier") {
            if (source === "effect" && specifier.imported.name === "Effect")
              effectNames.add(specifier.local.name);
            if (source === "effect/Effect" && runtimeMethods.includes(specifier.imported.name))
              runtimeNames.add(specifier.local.name);
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
        return invalidImport(source) || configuresLogger
          ? ctx.report(Diagnostic.make({ node, message }))
          : Effect.void;
      }),
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
      Visitor.on("MemberExpression", (node) => {
        const property = memberName(node);
        const object = node.object.type === "Identifier" ? node.object.name : undefined;
        const hostAccess =
          domain &&
          object !== undefined &&
          (hostGlobals.includes(object) ||
            (object === "globalThis" &&
              property !== undefined &&
              (hostGlobals.includes(property) || hiddenCalls.includes(property))) ||
            (loggerNames.has(object) &&
              property !== undefined &&
              loggerConfiguration.includes(property)) ||
            (effectNames.has(object) &&
              property !== undefined &&
              runtimeMethods.includes(property)));
        return hostAccess ? ctx.report(Diagnostic.make({ node, message })) : Effect.void;
      }),
      Visitor.on("CallExpression", (node) => {
        const callee = node.callee;
        const bare = callee.type === "Identifier" ? callee.name : undefined;
        const object =
          callee.type === "MemberExpression" && callee.object.type === "Identifier"
            ? callee.object.name
            : undefined;
        const property = callee.type === "MemberExpression" ? memberName(callee) : undefined;
        const invalid =
          object === "console" ||
          (domain &&
            ((bare !== undefined && (hiddenCalls.includes(bare) || runtimeNames.has(bare))) ||
              (object === "JSON" && property === "parse") ||
              (object === "Date" && property === "now") ||
              (object === "Math" && property === "random") ||
              (object === "performance" && property === "now") ||
              (object === "crypto" &&
                property !== undefined &&
                ["randomUUID", "getRandomValues"].includes(property))));
        return invalid ? ctx.report(Diagnostic.make({ node, message })) : Effect.void;
      }),
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
