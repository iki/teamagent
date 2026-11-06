---
name: typed-modules
description: Apply modular TypeScript architecture with Effect and Oxc in projects that selected that stack. Use for module/API/CLI boundaries, schema validation, or architecture lint rules; not to select frameworks merely because this skill is installed.
---

# Typed module boundaries

Read the project's adopted architecture, module manifest, compiler/lint settings, and actual package pins. Keep planned applications distinct from implemented behavior. Preserve its chosen CLI, configuration, logging, and UI frameworks; this skill does not select or install them.

Give each module a public API and its declared CLI descriptor/entry point using the project's layout. Cross-module imports go through public entry points; relative private imports stay within their module. Register dependency edges in the acyclic manifest. Implement advertised commands, including passive help and version paths that do not load configuration or start work.

Keep portable domain logic free of filesystem/process/runtime APIs, DOM, UI, application adapters, generated tooling, and ambient clocks. Put I/O and platform capabilities behind explicit services/adapters. Configure logging and execute Effects at composition roots. Public fallible domain operations return typed Effects; pure computations remain pure. Own cancellation, retries, and resource scopes instead of launching detached work.

Before writing Effect code, read the installed package's complete agent guide, relevant linked guides, and the exact version's source/types. Preserve the project's selected CLI/configuration libraries even when upstream examples use different ones. Preview compiler or Effect APIs must not be inferred from another major version's examples.

External configuration, JSON, files, messages, and dynamic third-party values enter as `unknown`, pass the selected Effect Schema API, then semantic checks. Validate containment, bounds, hashes, versions, and expected coverage. Do not use `any`, assertions, unchecked decoding, or broad suppressions to evade a boundary. A narrow third-party adapter needs source evidence and a meaningful regression.

Keep strict compiler options and separate host/browser/worker type environments. Add focused Oxc rules for recurring structural failures: public imports, API/CLI export coverage, manifest edges, host APIs, hidden execution, unchecked decoding, and logging configuration where appropriate. Test accepted and rejected fixtures against real parsed code, including aliases/namespaces when relevant. Static rules supplement behavior tests; they do not prove cancellation, native behavior, or task correctness. Run the project's implementation/review gates and the real affected platform checks without weakening coverage to obtain a pass.
