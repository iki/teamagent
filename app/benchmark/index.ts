import { join, resolve } from "node:path";
import { cli } from "cleye";
import { CorpusSchema } from "./contracts.ts";
import { cache, readJson, writeJson } from "./io.ts";
import { prepare } from "./prepare.ts";
import { runTeamagent } from "./teamagent.ts";
import { report } from "./report.ts";

const parsed = cli({
  name: "memory-benchmark",
  parameters: ["<command>", "[inputs...]"],
  flags: {
    label: { type: String, description: "Unique immutable Teamagent result label" },
    split: {
      type: String,
      default: "dev",
      description: "dev, holdout or all; keep holdout sealed during tuning",
    },
    output: { type: String, description: "New result file path (never overwritten)" },
    corpus: { type: String, description: "Frozen common corpus JSON path" },
  },
});
const { command, inputs } = parsed._;
switch (command) {
  case "prepare":
    await prepare(parsed.flags.output);
    break;
  case "teamagent":
    if (parsed.flags.label === undefined) throw new Error("--label is required");
    await runTeamagent(parsed.flags.label, parsed.flags.corpus);
    break;
  case "competitor-input": {
    const corpus = await readJson(
      resolve(parsed.flags.corpus ?? join(cache, "corpus.json")),
      CorpusSchema,
    );
    const output = resolve(parsed.flags.output ?? join(cache, "competitor-input.json"));
    await writeJson(output, {
      passages: corpus.passages,
      queries: corpus.cases.map(({ id, query }) => ({ id, query })),
      outputDirectory: join(cache, parsed.flags.label ?? "competitors"),
      repeat: 3,
    });
    process.stdout.write(`${output}\n`);
    break;
  }
  case "report": {
    const split = parsed.flags.split;
    if (split !== "dev" && split !== "holdout" && split !== "all")
      throw new Error("Invalid --split");
    if (parsed.flags.output === undefined) throw new Error("--output is required");
    await report(inputs ?? [], split, resolve(parsed.flags.output), parsed.flags.corpus);
    break;
  }
  default:
    throw new Error("Commands: prepare, teamagent, competitor-input, report");
}
