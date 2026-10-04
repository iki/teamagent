import type { ESTree } from "@oxlint/plugins";
import { Effect } from "effect";
import { Diagnostic, Rule, RuleContext, Visitor } from "effect-oxlint";

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

function executableName(node: ESTree.Expression): string | undefined {
  if (node.type === "Identifier") return node.name;
  if (
    node.type === "MemberExpression" &&
    node.object.type === "Identifier" &&
    ["globalThis", "window", "global"].includes(node.object.name)
  ) {
    if (!node.computed && node.property.type === "Identifier") return node.property.name;
    if (
      node.computed &&
      node.property.type === "Literal" &&
      typeof node.property.value === "string"
    )
      return node.property.value;
  }
  return undefined;
}

export const noExecutableInput = Rule.define({
  name: "no-executable-input",
  meta: Rule.meta({ type: "problem", description: "Prohibit dynamic code execution" }),
  create: function* () {
    const ctx = yield* RuleContext;
    const message = "Executable input is prohibited; parse validated data instead.";
    return Visitor.merge(
      Visitor.on("CallExpression", (node) => {
        const name = node.callee.type === "Super" ? undefined : executableName(node.callee);
        return name === "eval" || name === "Function"
          ? ctx.report(Diagnostic.make({ node, message }))
          : Effect.void;
      }),
      Visitor.on("NewExpression", (node) =>
        executableName(node.callee) === "Function"
          ? ctx.report(Diagnostic.make({ node, message }))
          : Effect.void,
      ),
    );
  },
});

export const runtimeLaunchers = Rule.define({
  name: "runtime-launchers",
  meta: Rule.meta({
    type: "problem",
    description: "Keep JavaScript launchers on the current Bun runtime",
  }),
  create: function* () {
    const ctx = yield* RuleContext;
    return Visitor.on("CallExpression", (node) => {
      if (
        node.callee.type !== "Identifier" ||
        !["spawn", "spawnSync", "execFile", "execFileSync"].includes(node.callee.name)
      )
        return Effect.void;
      const executable = node.arguments[0];
      return executable?.type === "Literal" &&
        typeof executable.value === "string" &&
        /(?:^|[\\/])(?:node|bun|npm|npx|pnpm|yarn|tauri|oxfmt|oxlint|tsgo)(?:\.exe|\.cmd)?$/i.test(
          executable.value,
        )
        ? ctx.report(
            Diagnostic.make({
              node,
              message:
                "Launch JavaScript tool entries with process.execPath; avoid PATH and package-manager shims.",
            }),
          )
        : Effect.void;
    });
  },
});
