import { relative } from "node:path";
import type { ESTree } from "@oxlint/plugins";
import { Effect, Option } from "effect";
import { Diagnostic, Rule, RuleContext, Scope, SourceCode, Visitor } from "effect-oxlint";
import { memberName } from "./ast.ts";

const filesystemModules = ["node:fs", "node:fs/promises", "fs", "fs/promises"];
const allocationNames = ["mkdtemp", "mkdtempSync"];
const name = (node: Extract<ESTree.Node, { readonly type: "Identifier" | "Literal" }>): string =>
  node.type === "Identifier" ? node.name : String(node.value);

function filesystemNamespace(
  node: ESTree.Expression,
  depth = 0,
): Effect.Effect<boolean, never, RuleContext> {
  return Effect.gen(function* () {
    if (depth >= 8) return false;
    if (
      node.type === "MemberExpression" &&
      Option.contains(memberName(node), "promises") &&
      node.object.type !== "Super"
    )
      return yield* filesystemNamespace(node.object, depth + 1);
    if (node.type === "AwaitExpression")
      return yield* filesystemNamespace(node.argument, depth + 1);
    if (node.type === "ImportExpression")
      return (
        node.source.type === "Literal" &&
        typeof node.source.value === "string" &&
        filesystemModules.includes(node.source.value)
      );
    if (
      node.type === "CallExpression" &&
      node.callee.type === "Identifier" &&
      node.callee.name === "require"
    ) {
      const argument = node.arguments[0];
      const scope = yield* SourceCode.getScope(node);
      const binding = Scope.findVariableUp(scope, "require");
      return (
        (Option.isNone(binding) || binding.value.defs.length === 0) &&
        argument?.type === "Literal" &&
        typeof argument.value === "string" &&
        filesystemModules.includes(argument.value)
      );
    }
    if (node.type !== "Identifier") return false;
    const scope = yield* SourceCode.getScope(node);
    const variable = Scope.findVariableUp(scope, node.name);
    if (Option.isNone(variable)) return false;
    for (const definition of variable.value.defs) {
      if (
        definition.type === "ImportBinding" &&
        definition.parent?.type === "ImportDeclaration" &&
        filesystemModules.includes(definition.parent.source.value)
      ) {
        const imported = definition.node;
        if (
          imported.type === "ImportNamespaceSpecifier" ||
          imported.type === "ImportDefaultSpecifier" ||
          (imported.type === "ImportSpecifier" && name(imported.imported) === "promises")
        )
          return true;
      }
      if (
        definition.type === "Variable" &&
        definition.parent?.type === "VariableDeclaration" &&
        definition.parent.kind === "const" &&
        definition.node.type === "VariableDeclarator" &&
        definition.node.init
      ) {
        const pattern = definition.node.id;
        const namespaceAlias =
          pattern.type === "Identifier" ||
          (pattern.type === "ObjectPattern" &&
            pattern.properties.some(
              (property) =>
                property.type === "Property" &&
                (property.key.type === "Identifier" || property.key.type === "Literal") &&
                (!property.computed || property.key.type === "Literal") &&
                name(property.key) === "promises" &&
                property.value.type === "Identifier" &&
                property.value.name === node.name,
            ));
        if (namespaceAlias && (yield* filesystemNamespace(definition.node.init, depth + 1)))
          return true;
      }
    }
    return false;
  });
}

/** Native allocation is reserved for the managed helper and its independent ownership regression. */
export const temporaryFixtures = Rule.define({
  name: "temporary-fixtures",
  meta: Rule.meta({
    type: "problem",
    description: "Keep test fixtures inside validated managed workspaces",
  }),
  create: function* () {
    const ctx = yield* RuleContext;
    const file = ctx.filename.replaceAll("\\", "/");
    const local = relative(ctx.cwd, ctx.filename).replaceAll("\\", "/");
    if (
      !file.includes("/test/") ||
      ["test/temporary.ts", "test/temporary-workspace.test.ts"].includes(local)
    )
      return {};
    const report = (node: ESTree.Node) =>
      ctx.report(
        Diagnostic.make({
          node,
          message:
            "Allocate test fixtures through test/temporary.ts so worker cleanup owns each exact directory.",
        }),
      );
    return Visitor.merge(
      Visitor.on(
        "ImportDeclaration",
        Effect.fnUntraced(function* (node: ESTree.ImportDeclaration) {
          if (!filesystemModules.includes(node.source.value)) return;
          for (const specifier of node.specifiers)
            if (
              specifier.type === "ImportSpecifier" &&
              allocationNames.includes(name(specifier.imported))
            )
              yield* report(specifier);
        }),
      ),
      Visitor.on(
        "ExportNamedDeclaration",
        Effect.fnUntraced(function* (node: ESTree.ExportNamedDeclaration) {
          if (!node.source || !filesystemModules.includes(node.source.value)) return;
          for (const specifier of node.specifiers)
            if (allocationNames.includes(name(specifier.local))) yield* report(specifier);
        }),
      ),
      Visitor.on(
        "MemberExpression",
        Effect.fnUntraced(function* (node: ESTree.MemberExpression) {
          if (
            node.object.type !== "Super" &&
            Option.exists(memberName(node), (value) => allocationNames.includes(value)) &&
            (yield* filesystemNamespace(node.object))
          )
            yield* report(node);
        }),
      ),
      Visitor.on(
        "VariableDeclarator",
        Effect.fnUntraced(function* (node: ESTree.VariableDeclarator) {
          if (
            node.id.type !== "ObjectPattern" ||
            !node.init ||
            !(yield* filesystemNamespace(node.init))
          )
            return;
          for (const property of node.id.properties)
            if (
              property.type === "Property" &&
              (property.key.type === "Identifier" || property.key.type === "Literal") &&
              (!property.computed || property.key.type === "Literal") &&
              allocationNames.includes(name(property.key))
            )
              yield* report(property);
        }),
      ),
    );
  },
});
