import { boundedText } from "./storage.ts";
import { validateMessage } from "./model.ts";

if (import.meta.main) {
  const path = process.argv[2];
  if (!path || process.argv.length !== 3) throw new Error("Expected one commit message file");
  const message = await boundedText(path, 16384);
  const trailer = /\nTeamagent-Task: [a-f0-9]{64}\n?$/u;
  validateMessage(message.replace(trailer, "").trimEnd());
}
