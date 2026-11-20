import { expect, test } from "bun:test";
import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { toolchainPins } from "../app/check/toolchain.ts";

test("Mise provisions the project runtime pins through explicit installation", async () => {
  const root = new URL("../", import.meta.url);
  const configuration: unknown = Bun.TOML.parse(await readFile(new URL("mise.toml", root), "utf8"));
  expect(configuration).toMatchObject({
    tools: toolchainPins(fileURLToPath(root)),
    settings: { auto_install: false },
  });
});
