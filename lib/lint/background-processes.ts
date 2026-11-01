import type { ESTree } from "@oxlint/plugins";
import { Effect, Option } from "effect";
import { Diagnostic, Rule, RuleContext, Scope, SourceCode, Visitor } from "effect-oxlint";
import { memberName } from "./ast.ts";

type Host = "bun" | "node";
type Launcher = { readonly host: Host; readonly method: string };
type HiddenOption = "absent" | "hidden" | "unsafe";
type DetachedOption = "absent" | "disabled" | "unsafe";
const nodeMethods = ["spawn", "spawnSync", "exec", "execSync", "execFile", "execFileSync", "fork"];
const bunMethods = ["spawn", "spawnSync"];

function staticName(node: ESTree.Node, computed = false): Option.Option<string> {
  if (!computed && node.type === "Identifier") return Option.some(node.name);
  if (node.type === "Literal" && typeof node.value === "string") return Option.some(node.value);
  return Option.none();
}

function moduleHost(source: string): Option.Option<Host> {
  if (source === "bun") return Option.some("bun");
  return ["node:child_process", "child_process"].includes(source)
    ? Option.some("node")
    : Option.none();
}

const namespaceHost = Effect.fnUntraced(function* (
  node: ESTree.Expression,
  depth = 0,
): Effect.fn.Return<Option.Option<Host>, never, RuleContext> {
  if (depth >= 8) return Option.none();
  if (node.type !== "Identifier") return Option.none();
  const scope = yield* SourceCode.getScope(node);
  const binding = Scope.findVariableUp(scope, node.name);
  if (node.name === "Bun" && (Option.isNone(binding) || binding.value.defs.length === 0))
    return Option.some("bun");
  if (Option.isNone(binding)) return Option.none();
  for (const definition of binding.value.defs) {
    if (definition.type === "ImportBinding" && definition.parent?.type === "ImportDeclaration") {
      if (["ImportNamespaceSpecifier", "ImportDefaultSpecifier"].includes(definition.node.type))
        return moduleHost(definition.parent.source.value);
      if (definition.node.type === "ImportSpecifier") {
        const imported = staticName(definition.node.imported);
        if (Option.isSome(imported) && imported.value === "default")
          return moduleHost(definition.parent.source.value);
      }
    }
    if (
      definition.type === "Variable" &&
      definition.parent?.type === "VariableDeclaration" &&
      definition.parent.kind === "const" &&
      definition.node.type === "VariableDeclarator" &&
      definition.node.id.type === "Identifier" &&
      definition.node.init
    )
      return yield* namespaceHost(definition.node.init, depth + 1);
  }
  return Option.none();
});

function launcher(host: Host, method: string): Option.Option<Launcher> {
  return (host === "bun" ? bunMethods : nodeMethods).includes(method)
    ? Option.some({ host, method })
    : Option.none();
}

const launchIdentity = Effect.fnUntraced(function* (
  node: ESTree.Expression,
  depth = 0,
): Effect.fn.Return<Option.Option<Launcher>, never, RuleContext> {
  if (depth >= 8) return Option.none();
  if (node.type === "MemberExpression" && node.object.type !== "Super") {
    const method = memberName(node);
    const host = yield* namespaceHost(node.object);
    return Option.isSome(method) && Option.isSome(host)
      ? launcher(host.value, method.value)
      : Option.none();
  }
  if (node.type !== "Identifier") return Option.none();
  const scope = yield* SourceCode.getScope(node);
  const binding = Scope.findVariableUp(scope, node.name);
  if (Option.isNone(binding)) return Option.none();
  for (const definition of binding.value.defs) {
    if (
      definition.type === "ImportBinding" &&
      definition.parent?.type === "ImportDeclaration" &&
      definition.node.type === "ImportSpecifier"
    ) {
      const host = moduleHost(definition.parent.source.value);
      const method = staticName(definition.node.imported);
      if (Option.isSome(host) && Option.isSome(method)) return launcher(host.value, method.value);
    }
    if (
      definition.type === "Variable" &&
      definition.parent?.type === "VariableDeclaration" &&
      definition.parent.kind === "const" &&
      definition.node.type === "VariableDeclarator" &&
      definition.node.init
    ) {
      const pattern = definition.node.id;
      if (pattern.type === "Identifier")
        return yield* launchIdentity(definition.node.init, depth + 1);
      if (pattern.type !== "ObjectPattern") continue;
      const host = yield* namespaceHost(definition.node.init);
      if (Option.isNone(host)) continue;
      for (const property of pattern.properties) {
        if (
          property.type !== "Property" ||
          property.value.type !== "Identifier" ||
          property.value.name !== node.name
        )
          continue;
        const method = staticName(property.key, property.computed);
        if (Option.isSome(method)) return launcher(host.value, method.value);
      }
    }
  }
  return Option.none();
});

/** Last-write semantics for inline options; unknown later keys/spreads cannot certify hiding. */
function hiddenOption(node: ESTree.Node, depth = 0): HiddenOption {
  if (depth >= 8 || node.type !== "ObjectExpression") return "unsafe";
  let result: HiddenOption = "absent";
  for (const property of node.properties) {
    if (property.type === "SpreadElement") {
      const spread = hiddenOption(property.argument, depth + 1);
      if (spread !== "absent") result = spread;
      continue;
    }
    const key = staticName(property.key, property.computed);
    if (Option.isNone(key)) result = "unsafe";
    else if (key.value === "windowsHide")
      result =
        property.kind === "init" &&
        !property.method &&
        property.value.type === "Literal" &&
        property.value.value === true
          ? "hidden"
          : "unsafe";
  }
  return result;
}

const processPlatform = Effect.fnUntraced(function* (
  node: ESTree.Node,
): Effect.fn.Return<boolean, never, RuleContext> {
  if (node.type !== "MemberExpression" || node.object.type !== "Identifier") return false;
  const property = memberName(node);
  if (Option.isNone(property) || property.value !== "platform") return false;
  const scope = yield* SourceCode.getScope(node.object);
  const binding = Scope.findVariableUp(scope, node.object.name);
  if (Option.isNone(binding) || binding.value.defs.length === 0)
    return node.object.name === "process";
  return binding.value.defs.some((definition) => {
    if (
      definition.type !== "ImportBinding" ||
      definition.parent?.type !== "ImportDeclaration" ||
      !["node:process", "process"].includes(definition.parent.source.value)
    )
      return false;
    if (["ImportNamespaceSpecifier", "ImportDefaultSpecifier"].includes(definition.node.type))
      return true;
    if (definition.node.type !== "ImportSpecifier") return false;
    const imported = staticName(definition.node.imported);
    return Option.isSome(imported) && imported.value === "default";
  });
});

const disabledOnWindows = Effect.fnUntraced(function* (
  node: ESTree.Node,
): Effect.fn.Return<boolean, never, RuleContext> {
  if (node.type === "Literal") return node.value === false;
  if (node.type !== "BinaryExpression" || node.operator !== "!==") return false;
  if (node.right.type === "Literal" && node.right.value === "win32")
    return yield* processPlatform(node.left);
  if (node.left.type === "Literal" && node.left.value === "win32")
    return yield* processPlatform(node.right);
  return false;
});

/** Unknown spreads may introduce detachment; a final explicit safe value wins. */
const detachedOption = Effect.fnUntraced(function* (
  node: ESTree.Node,
  initial: DetachedOption = "absent",
  depth = 0,
): Effect.fn.Return<DetachedOption, never, RuleContext> {
  if (depth >= 8) return "unsafe";
  if (node.type === "ConditionalExpression") {
    const consequent = yield* detachedOption(node.consequent, initial, depth + 1);
    const alternate = yield* detachedOption(node.alternate, initial, depth + 1);
    return consequent === alternate ? consequent : "unsafe";
  }
  if (node.type !== "ObjectExpression") return "unsafe";
  let result = initial;
  for (const property of node.properties) {
    if (property.type === "SpreadElement") {
      result = yield* detachedOption(property.argument, result, depth + 1);
      continue;
    }
    const key = staticName(property.key, property.computed);
    if (Option.isNone(key)) result = "unsafe";
    else if (key.value === "detached")
      result =
        property.kind === "init" && !property.method && (yield* disabledOnWindows(property.value))
          ? "disabled"
          : "unsafe";
  }
  return result;
});

function callOptions(node: ESTree.CallExpression, identity: Launcher): Option.Option<ESTree.Node> {
  if (node.arguments.some((argument) => argument.type === "SpreadElement")) return Option.none();
  const first = node.arguments[0];
  const second = node.arguments[1];
  const third = node.arguments[2];
  if (identity.host === "bun")
    return Option.fromNullishOr(second ?? (first?.type === "ObjectExpression" ? first : undefined));
  if (identity.method === "exec" || identity.method === "execSync")
    return Option.fromNullishOr(second);
  // Node supports both (command, options) and (command, args, options), with an optional callback.
  return Option.fromNullishOr(second?.type === "ObjectExpression" ? second : third);
}

/** This syntax guard covers static imports and bounded const aliases, not arbitrary data flow. */
export const backgroundProcesses = Rule.define({
  name: "background-processes",
  meta: Rule.meta({
    type: "problem",
    description: "Explicitly hide background subprocess windows at each maintained launch site",
  }),
  create: function* () {
    const ctx = yield* RuleContext;
    const file = ctx.filename.replaceAll("\\", "/");
    if (!file.includes("/app/") && !file.includes("/test/")) return {};
    return Visitor.on(
      "CallExpression",
      Effect.fnUntraced(function* (node: ESTree.CallExpression) {
        if (node.callee.type === "Super") return;
        const identity = yield* launchIdentity(node.callee);
        if (Option.isNone(identity)) return;
        const options = callOptions(node, identity.value);
        if (Option.isSome(options) && hiddenOption(options.value) === "hidden") {
          if ((yield* detachedOption(options.value)) === "unsafe")
            yield* ctx.report(
              Diagnostic.make({
                node,
                message:
                  'Background subprocesses must disable detachment on Windows; use detached: false or process.platform !== "win32" after unknown spreads.',
              }),
            );
          return;
        }
        yield* ctx.report(
          Diagnostic.make({
            node,
            message:
              "Background subprocess options require effective explicit windowsHide: true; later unknown spreads or keys can override it.",
          }),
        );
      }),
    );
  },
});
