import { posix } from "node:path";
import type { ESTree } from "@oxlint/plugins";
import { Effect, Option } from "effect";
import { Diagnostic, Rule, RuleContext, Scope, SourceCode, Visitor } from "effect-oxlint";
import { memberName } from "./ast.ts";
import { moduleDefinitions } from "./modules.ts";

function exportedName(node: ESTree.ModuleExportName): string {
  return node.type === "Identifier" ? node.name : node.value;
}

function expression(node: ESTree.Expression): ESTree.Expression {
  return node.type === "TSAsExpression" || node.type === "TSSatisfiesExpression"
    ? expression(node.expression)
    : node;
}

function property(node: ESTree.ObjectExpression, key: string): Option.Option<ESTree.Expression> {
  for (const item of node.properties) {
    if (item.type !== "Property" || item.computed || item.kind !== "init" || item.method) continue;
    const name =
      item.key.type === "Identifier"
        ? item.key.name
        : item.key.type === "Literal" && typeof item.key.value === "string"
          ? item.key.value
          : undefined;
    if (name === key) return Option.some(item.value);
  }
  return Option.none();
}

function literalText(node: Option.Option<ESTree.Expression>): Option.Option<string> {
  return Option.flatMap(node, (value) =>
    value.type === "Literal" && typeof value.value === "string" && value.value.trim().length > 0
      ? Option.some(value.value)
      : Option.none(),
  );
}

function exactProperties(node: ESTree.ObjectExpression, expected: readonly string[]): boolean {
  const names = new Set<string>();
  for (const item of node.properties) {
    if (item.type !== "Property" || item.computed || item.kind !== "init" || item.method)
      return false;
    const name = item.key.type === "Identifier" ? item.key.name : undefined;
    if (name === undefined || !expected.includes(name) || names.has(name)) return false;
    names.add(name);
  }
  return expected.every((name) => names.has(name));
}

function validDescriptor(node: ESTree.Expression, module: string): boolean {
  const value = expression(node);
  if (value.type !== "ObjectExpression") return false;
  if (!exactProperties(value, ["name", "description", "commands"])) return false;
  if (!Option.contains(literalText(property(value, "name")), module)) return false;
  if (Option.isNone(literalText(property(value, "description")))) return false;
  const commands = property(value, "commands");
  if (Option.isNone(commands) || commands.value.type !== "ArrayExpression") return false;
  const names = new Set<string>();
  for (const command of commands.value.elements) {
    if (command === null || command.type !== "ObjectExpression") return false;
    if (!exactProperties(command, ["name", "description"])) return false;
    const name = literalText(property(command, "name"));
    if (Option.isNone(name) || !/^[a-z][a-z0-9-]*$/.test(name.value) || names.has(name.value))
      return false;
    if (Option.isNone(literalText(property(command, "description")))) return false;
    names.add(name.value);
  }
  return names.size > 0;
}

export const moduleContract = Rule.define({
  name: "module-contract",
  meta: Rule.meta({
    type: "problem",
    description: "Every module exposes a public API and CLI descriptor",
  }),
  create: function* () {
    const ctx = yield* RuleContext;
    const file = ctx.filename.replaceAll("\\", "/");
    const match = /\/lib\/([^/]+)\/(index|cli)\.ts$/.exec(file);
    const module = match?.[1];
    const entry = match?.[2];
    if (module === undefined || entry === undefined) return {};
    return Visitor.on("Program", (node) => {
      if (entry === "index") {
        const exportsCli = node.body.some(
          (item) =>
            item.type === "ExportNamedDeclaration" &&
            item.exportKind !== "type" &&
            item.source?.value === "./cli.ts" &&
            item.specifiers.some(
              (specifier) =>
                specifier.exportKind !== "type" &&
                exportedName(specifier.local) === "cli" &&
                exportedName(specifier.exported) === "cli",
            ),
        );
        const exportsApi = node.body.some(
          (item) =>
            item.type === "ExportAllDeclaration" ||
            item.type === "ExportDefaultDeclaration" ||
            (item.type === "ExportNamedDeclaration" &&
              (item.declaration !== null ||
                item.specifiers.some((specifier) => exportedName(specifier.exported) !== "cli"))),
        );
        return exportsCli && exportsApi
          ? Effect.void
          : ctx.report(
              Diagnostic.make({
                node,
                message:
                  "Module index.ts must expose its library API and export { cli } from './cli.ts'.",
              }),
            );
      }
      const cliExport = node.body.find(
        (item) =>
          item.type === "ExportNamedDeclaration" &&
          item.declaration?.type === "VariableDeclaration" &&
          item.declaration.kind === "const" &&
          item.declaration.declarations.length === 1 &&
          item.declaration.declarations.some(
            (declaration) => declaration.id.type === "Identifier" && declaration.id.name === "cli",
          ),
      );
      const declaration =
        cliExport?.type === "ExportNamedDeclaration" &&
        cliExport.declaration?.type === "VariableDeclaration"
          ? cliExport.declaration.declarations.find(
              (item) => item.id.type === "Identifier" && item.id.name === "cli",
            )
          : undefined;
      const onlyMetadata = node.body.every(
        (item) =>
          item === cliExport || (item.type === "ImportDeclaration" && item.importKind === "type"),
      );
      return onlyMetadata && declaration?.init && validDescriptor(declaration.init, module)
        ? Effect.void
        : ctx.report(
            Diagnostic.make({
              node,
              message:
                "cli.ts must export a literal cli descriptor with its module name, description, and unique named commands; runtime execution belongs in app/cli.",
            }),
          );
    });
  },
});

function importProblem(file: string, source: string): string | undefined {
  if ((file.includes("/lib/") || file.includes("/app/")) && source.startsWith("teamagent/"))
    return "Repository code uses @/ public module entries and explicit relative host composition; package exports are for external consumers.";
  if (
    (source === "zod" ||
      source.startsWith("zod/") ||
      source.startsWith("@modelcontextprotocol/")) &&
    !file.includes("/app/mcp/") &&
    !file.includes("/test/")
  )
    return "Keep MCP SDK and Zod protocol schemas in app/mcp; inward contracts use Effect Schema.";
  const module = file.split("/lib/")[1]?.split("/")[0];
  const target = source.startsWith("@/") ? source.slice(2) : undefined;
  if (target !== undefined && !moduleDefinitions.some((item) => item.name === target))
    return `Unknown public module ${target}; register its API, CLI, and dependencies.`;
  if (module !== undefined && target !== undefined) {
    const definition = moduleDefinitions.find((item) => item.name === module);
    if (definition === undefined || !definition.dependencies.includes(target))
      return `Module ${module} does not declare dependency ${target}; use local relative imports within a module.`;
  }
  const layer = file.split("/app/")[1]?.split("/")[0];
  if (layer === undefined) return undefined;
  const resolved = source.startsWith(".")
    ? posix.normalize(posix.join(posix.dirname(file), source))
    : source;
  const importedLayer = resolved.split("/app/")[1]?.split("/")[0];
  const mediaOrChannels = layer === "media" || layer === "channels";
  const importsMediaOrChannels = importedLayer === "media" || importedLayer === "channels";
  if (
    importsMediaOrChannels &&
    ["web", "desktop", "storage", "adapters", "memory", "imports", "integrations", "mcp"].includes(
      layer,
    )
  )
    return `The ${layer} adapter cannot import the ${importedLayer} implementation; depend on a public library contract.`;
  if (mediaOrChannels && importedLayer !== undefined && importedLayer !== layer) {
    // Reuse only the existing scoped worker/staging utilities, not the acquisition pipeline.
    const applicationRoot = `${file.split("/app/")[0]}/app`;
    const sharedHostHelper =
      importedLayer === "imports" &&
      ((layer === "media" &&
        ["lifecycle.ts", "extractors.ts", "process.ts"].some(
          (name) => resolved === `${applicationRoot}/imports/${name}`,
        )) ||
        (layer === "channels" && resolved === `${applicationRoot}/imports/lifecycle.ts`));
    if (
      !sharedHostHelper &&
      [
        "web",
        "desktop",
        "server",
        "cli",
        "storage",
        "memory",
        "adapters",
        "imports",
        "integrations",
        "mcp",
        "runtime",
        "media",
        "channels",
      ].includes(importedLayer)
    )
      return `The ${layer} adapter cannot import the ${importedLayer} implementation; depend on a public library contract.`;
  }
  const forbidden =
    layer === "web" || layer === "desktop"
      ? [
          "storage",
          "server",
          "cli",
          "adapters",
          "check",
          "hooks",
          "conversations",
          "memory",
          "imports",
          "integrations",
          "mcp",
          "runtime",
        ]
      : layer === "storage"
        ? ["web", "desktop", "server", "cli", "adapters"]
        : layer === "adapters"
          ? [
              "web",
              "desktop",
              "server",
              "cli",
              "storage",
              "imports",
              "integrations",
              "memory",
              "mcp",
              "runtime",
            ]
          : layer === "memory"
            ? [
                "web",
                "desktop",
                "server",
                "cli",
                "adapters",
                "imports",
                "integrations",
                "mcp",
                "runtime",
              ]
            : layer === "imports" || layer === "integrations"
              ? [
                  "web",
                  "desktop",
                  "server",
                  "cli",
                  "adapters",
                  "storage",
                  "memory",
                  "mcp",
                  "runtime",
                ]
              : layer === "mcp"
                ? [
                    "web",
                    "desktop",
                    "server",
                    "cli",
                    "adapters",
                    "storage",
                    "memory",
                    "imports",
                    "integrations",
                    "runtime",
                  ]
                : [];
  if (importedLayer !== undefined && forbidden.includes(importedLayer))
    return `The ${layer} adapter cannot import the ${importedLayer} implementation; depend on a public library contract.`;
  if ((layer === "web" || layer === "desktop") && target === "lint")
    return "Client applications cannot import host lint tooling.";
  return undefined;
}

export const moduleDependencies = Rule.define({
  name: "module-dependencies",
  meta: Rule.meta({
    type: "problem",
    description: "Use the declared module graph and keep host surfaces independent",
  }),
  create: function* () {
    const ctx = yield* RuleContext;
    const file = ctx.filename.replaceAll("\\", "/");
    const inspect = (node: ESTree.Node, source: string) => {
      const message = importProblem(file, source);
      return message === undefined ? Effect.void : ctx.report(Diagnostic.make({ node, message }));
    };
    return Visitor.merge(
      Visitor.on("ImportDeclaration", (node) => inspect(node, node.source.value)),
      Visitor.on("ExportNamedDeclaration", (node) =>
        node.source ? inspect(node, node.source.value) : Effect.void,
      ),
      Visitor.on("ExportAllDeclaration", (node) => inspect(node, node.source.value)),
      Visitor.on("ImportExpression", (node) =>
        node.source.type === "Literal" && typeof node.source.value === "string"
          ? inspect(node, node.source.value)
          : Effect.void,
      ),
    );
  },
});

export const safeRendering = Rule.define({
  name: "safe-rendering",
  meta: Rule.meta({
    type: "problem",
    description: "Render agent content as data, never as raw markup or executable documents",
  }),
  create: function* () {
    const ctx = yield* RuleContext;
    const file = ctx.filename.replaceAll("\\", "/");
    if (!/\/app\/(web|desktop)\//.test(file)) return {};
    const message =
      "Render untrusted agent content as text or sanitized structured nodes; raw HTML and executable document injection are forbidden.";
    return Visitor.merge(
      Visitor.on("JSXAttribute", (node) =>
        node.name.type === "JSXIdentifier" &&
        ["dangerouslySetInnerHTML", "srcDoc"].includes(node.name.name)
          ? ctx.report(Diagnostic.make({ node, message }))
          : Effect.void,
      ),
      Visitor.on("MemberExpression", (node) =>
        Option.exists(memberName(node), (name) =>
          ["innerHTML", "outerHTML", "insertAdjacentHTML"].includes(name),
        )
          ? ctx.report(Diagnostic.make({ node, message }))
          : Effect.void,
      ),
    );
  },
});

export const clientState = Rule.define({
  name: "client-state",
  meta: Rule.meta({
    type: "problem",
    description:
      "Keep durable task state in the service and connection credentials out of browser storage",
  }),
  create: function* () {
    const ctx = yield* RuleContext;
    const file = ctx.filename.replaceAll("\\", "/");
    if (!/\/app\/(web|desktop)\//.test(file)) return {};
    const message =
      "Keep task state in the durable service and credentials in memory or the native host; browser storage requires a separately reviewed adapter.";
    const storage = ["localStorage", "sessionStorage", "indexedDB"];
    return Visitor.on(
      "MemberExpression",
      Effect.fnUntraced(function* (node: ESTree.MemberExpression) {
        if (node.object.type !== "Identifier") return;
        const name = node.object.name;
        const direct = storage.includes(name);
        const global =
          ["window", "globalThis"].includes(name) &&
          Option.exists(memberName(node), (property) => storage.includes(property));
        if (!direct && !global) return;
        const scope = yield* SourceCode.getScope(node);
        const variable = Scope.findVariableUp(scope, name);
        if (Option.exists(variable, (binding) => binding.defs.length > 0)) return;
        yield* ctx.report(Diagnostic.make({ node, message }));
      }),
    );
  },
});

export const adapterAuthority = Rule.define({
  name: "adapter-authority",
  meta: Rule.meta({
    type: "problem",
    description: "Keep process execution outside the current file-tool and model adapters",
  }),
  create: function* () {
    const ctx = yield* RuleContext;
    const file = ctx.filename.replaceAll("\\", "/");
    if (!file.includes("/app/adapters/")) return {};
    const message =
      "Process execution is outside the current adapter grant; introduce a reviewed process adapter contract before exposing subprocess tools.";
    const forbidden = (source: string) =>
      ["node:child_process", "child_process", "bun"].includes(source);
    return Visitor.merge(
      Visitor.on("ImportDeclaration", (node) =>
        forbidden(node.source.value) ? ctx.report(Diagnostic.make({ node, message })) : Effect.void,
      ),
      Visitor.on("ExportAllDeclaration", (node) =>
        forbidden(node.source.value) ? ctx.report(Diagnostic.make({ node, message })) : Effect.void,
      ),
      Visitor.on("ExportNamedDeclaration", (node) =>
        node.source && forbidden(node.source.value)
          ? ctx.report(Diagnostic.make({ node, message }))
          : Effect.void,
      ),
      Visitor.on("ImportExpression", (node) =>
        node.source.type === "Literal" &&
        typeof node.source.value === "string" &&
        forbidden(node.source.value)
          ? ctx.report(Diagnostic.make({ node, message }))
          : Effect.void,
      ),
      Visitor.on(
        "MemberExpression",
        Effect.fnUntraced(function* (node: ESTree.MemberExpression) {
          const direct =
            node.object.type === "Identifier" &&
            node.object.name === "Bun" &&
            Option.exists(memberName(node), (name) => ["spawn", "spawnSync", "$"].includes(name));
          const global =
            node.object.type === "Identifier" &&
            node.object.name === "globalThis" &&
            Option.contains(memberName(node), "Bun");
          if (!direct && !global) return;
          const scope = yield* SourceCode.getScope(node);
          const variable = Scope.findVariableUp(scope, direct ? "Bun" : "globalThis");
          if (Option.exists(variable, (binding) => binding.defs.length > 0)) return;
          yield* ctx.report(Diagnostic.make({ node, message }));
        }),
      ),
    );
  },
});
