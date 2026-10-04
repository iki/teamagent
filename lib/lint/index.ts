import { Plugin } from "effect-oxlint";
import { boundaries } from "./boundaries.ts";
import { noExecutableInput, noUnsafeCasts, runtimeLaunchers } from "./reliability.ts";

export { boundaries, noExecutableInput, noUnsafeCasts, runtimeLaunchers };

export default Plugin.define({
  name: "teamagent",
  specifier: "./lib/lint/index.ts",
  rules: {
    boundaries,
    "no-unsafe-casts": noUnsafeCasts,
    "no-executable-input": noExecutableInput,
    "runtime-launchers": runtimeLaunchers,
  },
});
