import type { ESTree } from "@oxlint/plugins";
import { Effect, Option } from "effect";
import { Diagnostic, Rule, RuleContext, Scope, SourceCode, Visitor } from "effect-oxlint";
import { memberName } from "./ast.ts";

export const noUnsafeCasts = Rule.define({
  name: "no-unsafe-casts",
  meta: Rule.meta({
    type: "problem",
    description: "Validate unknown data instead of asserting types",
  }),
  create: function* () {
    const ctx = yield* RuleContext;
    const message =
      "Use Schema, narrowing, or satisfies instead of type assertions; only as const is allowed.";
    return Visitor.merge(
      Visitor.on("TSAsExpression", (node) =>
        node.typeAnnotation.type === "TSTypeReference" &&
        node.typeAnnotation.typeName.type === "Identifier" &&
        node.typeAnnotation.typeName.name === "const"
          ? Effect.void
          : ctx.report(Diagnostic.make({ node, message })),
      ),
      Visitor.on("TSTypeAssertion", (node) => ctx.report(Diagnostic.make({ node, message }))),
    );
  },
});

function executableName(node: ESTree.Expression): Option.Option<string> {
  if (node.type === "Identifier") return Option.some(node.name);
  if (
    node.type === "MemberExpression" &&
    node.object.type === "Identifier" &&
    ["globalThis", "window", "global"].includes(node.object.name)
  ) {
    return memberName(node);
  }
  return Option.none();
}

export const noExecutableInput = Rule.define({
  name: "no-executable-input",
  meta: Rule.meta({ type: "problem", description: "Prohibit dynamic code execution" }),
  create: function* () {
    const ctx = yield* RuleContext;
    const message = "Executable input is prohibited; parse validated data instead.";
    return Visitor.merge(
      Visitor.on("CallExpression", (node) => {
        const name = node.callee.type === "Super" ? Option.none() : executableName(node.callee);
        return Option.exists(name, (value) => value === "eval" || value === "Function")
          ? ctx.report(Diagnostic.make({ node, message }))
          : Effect.void;
      }),
      Visitor.on("NewExpression", (node) =>
        Option.contains(executableName(node.callee), "Function")
          ? ctx.report(Diagnostic.make({ node, message }))
          : Effect.void,
      ),
    );
  },
});

const launchMethods = ["spawn", "spawnSync", "execFile", "execFileSync"];

export const runtimeLaunchers = Rule.define({
  name: "runtime-launchers",
  meta: Rule.meta({
    type: "problem",
    description: "Keep JavaScript launchers on the current Bun runtime",
  }),
  create: function* () {
    const ctx = yield* RuleContext;
    return Visitor.on(
      "CallExpression",
      Effect.fnUntraced(function* (node: ESTree.CallExpression) {
        const executable = node.arguments[0];
        if (
          executable?.type !== "Literal" ||
          typeof executable.value !== "string" ||
          !/(?:^|[\\/])(?:node|bun|npm|npx|pnpm|yarn|tauri|oxfmt|oxlint|tsgo)(?:\.exe|\.cmd)?$/i.test(
            executable.value,
          )
        )
          return;
        const callee = node.callee;
        const identifier =
          callee.type === "Identifier"
            ? Option.some(callee)
            : callee.type === "MemberExpression" && callee.object.type === "Identifier"
              ? Option.some(callee.object)
              : Option.none();
        if (Option.isNone(identifier)) return;
        const scope = yield* SourceCode.getScope(node);
        const variable = Scope.findVariableUp(scope, identifier.value.name);
        const launches = Option.exists(variable, (binding) =>
          binding.defs.some((definition) => {
            if (
              definition.type !== "ImportBinding" ||
              definition.parent?.type !== "ImportDeclaration" ||
              !["node:child_process", "child_process"].includes(definition.parent.source.value)
            )
              return false;
            const specifier = definition.node;
            if (callee.type === "Identifier")
              return (
                specifier.type === "ImportSpecifier" &&
                specifier.imported.type === "Identifier" &&
                launchMethods.includes(specifier.imported.name)
              );
            return (
              callee.type === "MemberExpression" &&
              (specifier.type === "ImportNamespaceSpecifier" ||
                specifier.type === "ImportDefaultSpecifier") &&
              Option.exists(memberName(callee), (name) => launchMethods.includes(name))
            );
          }),
        );
        if (launches)
          yield* ctx.report(
            Diagnostic.make({
              node,
              message:
                "Launch JavaScript tool entries with process.execPath; avoid PATH and package-manager shims.",
            }),
          );
      }),
    );
  },
});
