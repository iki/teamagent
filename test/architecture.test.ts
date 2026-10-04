import { strict as assert } from "node:assert";
import { test } from "node:test";
import {
  callExpr,
  callOfMember,
  expectNoDiagnostics,
  id,
  importDecl,
  importDeclWithSpecifiers,
  importSpecifier,
  memberExpr,
  runRule,
  runRuleMulti,
  strLiteral,
} from "effect-oxlint/testing";
import { boundaries, noExecutableInput, noUnsafeCasts } from "@/lint";

const domain = { filename: "/repo/lib/domain/index.ts" };

await test("library imports reject private paths and host dependencies", () => {
  for (const source of [
    "../other/index.ts",
    "@/other/internal",
    "@/",
    "node:fs/promises",
    "fs/promises",
    "child_process",
    "bun",
    "bun:sqlite",
    "@/lint",
    "consola",
    "c12",
  ]) {
    assert.equal(
      runRule(boundaries, "ImportDeclaration", importDecl(source), domain).length,
      1,
      source,
    );
  }
  for (const source of ["effect", "effect/Schema", "@/other", "./model.ts", "@logtape/logtape"])
    expectNoDiagnostics(runRule(boundaries, "ImportDeclaration", importDecl(source), domain));

  for (const filename of ["/repo/lib/lint/index.ts", "/repo/app/check/index.ts"])
    expectNoDiagnostics(
      runRule(boundaries, "ImportDeclaration", importDecl("node:fs"), { filename }),
    );
  assert.equal(
    runRule(boundaries, "ImportDeclaration", importDecl("node:fs"), {
      filename: "C:\\repo\\lib\\domain\\index.ts",
    }).length,
    1,
  );
});

await test("relative imports stay inside their own library on POSIX and Windows", () => {
  for (const filename of [
    "/repo/lib/domain/nested/model.ts",
    "C:\\repo\\lib\\domain\\nested\\model.ts",
  ]) {
    for (const source of ["../schema.ts", "..", "./deep/../../schema.ts"])
      expectNoDiagnostics(
        runRule(boundaries, "ImportDeclaration", importDecl(source), { filename }),
      );
    for (const source of ["../../other/index.ts", "./../../other/index.ts", "../../../app/tool.ts"])
      assert.equal(
        runRule(boundaries, "ImportDeclaration", importDecl(source), { filename }).length,
        1,
        source,
      );
  }
});

await test("re-exports and dynamic imports preserve module boundaries", () => {
  assert.equal(
    runRule(boundaries, "ExportAllDeclaration", { source: strLiteral("@/other/private") }, domain)
      .length,
    1,
  );
  assert.equal(
    runRule(boundaries, "ExportNamedDeclaration", { source: strLiteral("node:fs") }, domain).length,
    1,
  );
  assert.equal(
    runRule(boundaries, "ImportExpression", { source: strLiteral("./plugin.ts") }, domain).length,
    1,
  );
  expectNoDiagnostics(runRule(boundaries, "ExportNamedDeclaration", { source: null }, domain));
  expectNoDiagnostics(
    runRule(boundaries, "ExportAllDeclaration", { source: strLiteral("@/other") }, domain),
  );
});

await test("domain code cannot hide host I/O, clocks, or runtime execution", () => {
  for (const name of ["Bun", "process", "window", "document", "localStorage", "sessionStorage"])
    assert.equal(
      runRule(boundaries, "MemberExpression", memberExpr(name, "value"), domain).length,
      1,
      name,
    );
  assert.equal(
    runRule(boundaries, "MemberExpression", memberExpr("globalThis", "Bun"), domain).length,
    1,
  );
  assert.equal(
    runRule(boundaries, "MemberExpression", memberExpr("globalThis", "fetch"), domain).length,
    1,
  );
  for (const name of ["fetch", "require", "setTimeout", "setInterval"])
    assert.equal(runRule(boundaries, "CallExpression", callExpr(name), domain).length, 1, name);
  for (const [object, method] of [
    ["Date", "now"],
    ["Math", "random"],
    ["JSON", "parse"],
    ["performance", "now"],
    ["crypto", "randomUUID"],
  ] as const)
    assert.equal(
      runRule(boundaries, "CallExpression", callOfMember(object, method), domain).length,
      1,
    );
  assert.equal(
    runRule(boundaries, "NewExpression", { callee: id("Date"), arguments: [] }, domain).length,
    1,
  );
  assert.equal(
    runRule(boundaries, "MemberExpression", memberExpr("Effect", "runPromise"), domain).length,
    1,
  );
  expectNoDiagnostics(runRule(boundaries, "CallExpression", callOfMember("Effect", "gen"), domain));
  expectNoDiagnostics(
    runRule(boundaries, "MemberExpression", memberExpr("model", "value"), domain),
  );
  expectNoDiagnostics(
    runRule(boundaries, "CallExpression", callExpr("fetch"), {
      filename: "/repo/app/web/worker.ts",
    }),
  );
});

await test("renamed Effect imports and logger configuration remain boundaries", () => {
  const events = [
    ["ImportDeclaration", importDeclWithSpecifiers("effect", [importSpecifier("Effect", "E")])],
    ["MemberExpression", memberExpr("E", "runSync")],
  ] as const;
  assert.equal(runRuleMulti(boundaries, events, domain).length, 1);
  assert.equal(
    runRuleMulti(
      boundaries,
      [
        [
          "ImportDeclaration",
          {
            source: strLiteral("@logtape/logtape"),
            specifiers: [{ type: "ImportNamespaceSpecifier", local: id("logs") }],
          },
        ],
        ["MemberExpression", memberExpr("logs", "configure")],
      ],
      domain,
    ).length,
    1,
  );
  assert.equal(
    runRuleMulti(
      boundaries,
      [
        [
          "ImportDeclaration",
          importDeclWithSpecifiers("effect/Effect", [importSpecifier("runPromise", "execute")]),
        ],
        ["CallExpression", callExpr("execute")],
      ],
      domain,
    ).length,
    1,
  );
  for (const name of ["configure", "configureSync", "reset", "resetSync"])
    assert.equal(
      runRule(
        boundaries,
        "ImportDeclaration",
        importDeclWithSpecifiers("@logtape/logtape", [importSpecifier(name)]),
        domain,
      ).length,
      1,
    );
  expectNoDiagnostics(
    runRule(
      boundaries,
      "ImportDeclaration",
      importDeclWithSpecifiers("@logtape/logtape", [importSpecifier("getLogger")]),
      domain,
    ),
  );
});

await test("assertions cannot replace decoding, while const assertions remain legal", () => {
  for (const typeAnnotation of [
    { type: "TSAnyKeyword" },
    { type: "TSUnknownKeyword" },
    { type: "TSTypeReference", typeName: id("Model") },
  ])
    assert.equal(runRule(noUnsafeCasts, "TSAsExpression", { typeAnnotation }).length, 1);
  assert.equal(
    runRule(noUnsafeCasts, "TSTypeAssertion", { typeAnnotation: { type: "TSAnyKeyword" } }).length,
    1,
  );
  expectNoDiagnostics(
    runRule(noUnsafeCasts, "TSAsExpression", {
      typeAnnotation: { type: "TSTypeReference", typeName: id("const") },
    }),
  );
  expectNoDiagnostics(
    runRule(noUnsafeCasts, "TSSatisfiesExpression", {
      typeAnnotation: { type: "TSTypeReference", typeName: id("Model") },
    }),
  );
});

await test("dynamic executable input is rejected for calls and constructors", () => {
  for (const name of ["eval", "Function"])
    assert.equal(runRule(noExecutableInput, "CallExpression", callExpr(name)).length, 1);
  assert.equal(
    runRule(noExecutableInput, "CallExpression", callOfMember("globalThis", "eval")).length,
    1,
  );
  assert.equal(runRule(noExecutableInput, "NewExpression", { callee: id("Function") }).length, 1);
  expectNoDiagnostics(runRule(noExecutableInput, "CallExpression", callExpr("parseData")));
  expectNoDiagnostics(runRule(noExecutableInput, "NewExpression", { callee: id("URL") }));
});

await test("per-file Effect and logger alias state does not leak into another file", () => {
  runRuleMulti(
    boundaries,
    [
      [
        "ImportDeclaration",
        importDeclWithSpecifiers("effect", [importSpecifier("Effect", "Task")]),
      ],
      ["MemberExpression", memberExpr("Task", "runSync")],
    ],
    domain,
  );
  expectNoDiagnostics(
    runRule(boundaries, "MemberExpression", memberExpr("Task", "runSync"), domain),
  );
});
