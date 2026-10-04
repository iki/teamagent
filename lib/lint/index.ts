import { Plugin } from "effect-oxlint";
import { boundaries } from "./boundaries.ts";
import {
  adapterAuthority,
  clientState,
  moduleContract,
  moduleDependencies,
  safeRendering,
} from "./modularity.ts";
import { noExecutableInput, noUnsafeCasts, runtimeLaunchers } from "./reliability.ts";

export { boundaries, noExecutableInput, noUnsafeCasts, runtimeLaunchers };
export { cli } from "./cli.ts";
export { adapterAuthority, clientState, moduleContract, moduleDependencies, safeRendering };
export { inspectModuleLayout, moduleDefinitions, validateModuleGraph } from "./modules.ts";
export type { ModuleDefinition } from "./modules.ts";

export default Plugin.define({
  name: "teamagent",
  specifier: "./lib/lint/index.ts",
  rules: {
    boundaries,
    "no-unsafe-casts": noUnsafeCasts,
    "no-executable-input": noExecutableInput,
    "runtime-launchers": runtimeLaunchers,
    "module-contract": moduleContract,
    "module-dependencies": moduleDependencies,
    "safe-rendering": safeRendering,
    "client-state": clientState,
    "adapter-authority": adapterAuthority,
  },
});
