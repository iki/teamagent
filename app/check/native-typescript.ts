/** Resolve the provisioned compiler without its JavaScript subprocess launcher. */
import { constants } from "node:fs";
import { access, lstat, realpath } from "node:fs/promises";
import { createRequire } from "node:module";
import { basename, dirname, resolve } from "node:path";
import { Schema } from "effect";
import { boundedRead, safePath } from "./cache-io.ts";

const packageName = "@typescript/native-preview";
const versions = Schema.Record(Schema.String, Schema.String);
const Project = Schema.Struct({
  dependencies: Schema.optional(versions),
  devDependencies: Schema.optional(versions),
});
const Package = Schema.Struct({
  name: Schema.String,
  version: Schema.String,
  bin: Schema.optional(versions),
  optionalDependencies: Schema.optional(versions),
});
const parseProject = Schema.decodeUnknownSync(Schema.fromJsonString(Project));
const parsePackage = Schema.decodeUnknownSync(Schema.fromJsonString(Package));
const decode = new TextDecoder("utf-8", { fatal: true });

async function packageMetadata(path: string) {
  // Aube's declared package junctions are allowed; links inside the package are not.
  const original = await lstat(path);
  if (basename(path) !== "package.json" || !original.isFile() || original.isSymbolicLink())
    throw new Error("Installed TypeScript metadata must be a regular package.json leaf");
  const physical = await realpath(path);
  const root = dirname(physical);
  const metadata = parsePackage(
    decode.decode(await boundedRead(root, "package.json", 1024 * 1024)),
  );
  return { root, path: physical, metadata };
}

/** Platform overrides are a trusted fixture seam, not a CLI or environment override. */
export async function resolveNativeTypeScript(
  root: string,
  platform: string = process.platform,
  architecture: string = process.arch,
): Promise<string> {
  if (!/^[a-z0-9]+$/u.test(platform) || !/^[a-z0-9]+$/u.test(architecture))
    throw new Error("Invalid native TypeScript platform");
  const project = parseProject(decode.decode(await boundedRead(root, "package.json", 1024 * 1024)));
  const runtimePin = project.dependencies?.[packageName];
  const developmentPin = project.devDependencies?.[packageName];
  const pin = developmentPin ?? runtimePin;
  if (
    !pin ||
    !/^\d+\.\d+\.\d+(?:-[0-9A-Za-z.-]+)?(?:\+[0-9A-Za-z.-]+)?$/u.test(pin) ||
    (runtimePin !== undefined && developmentPin !== undefined && runtimePin !== developmentPin)
  )
    throw new Error("Native TypeScript requires one exact project version");

  const launcher = await packageMetadata(
    createRequire(resolve(root, "package.json")).resolve(`${packageName}/package.json`),
  );
  if (launcher.metadata.name !== packageName || launcher.metadata.version !== pin)
    throw new Error("Installed TypeScript launcher differs from its project pin");
  if (
    Object.keys(launcher.metadata.bin ?? {}).length !== 1 ||
    launcher.metadata.bin?.tsgo !== "./bin/tsgo"
  )
    throw new Error("Unsupported installed TypeScript launcher layout");

  // Mirrors the installed getExePath.js package mapping; no PATH or source-build fallback.
  const nativeName = `${packageName}-${platform}-${architecture}`;
  if (launcher.metadata.optionalDependencies?.[nativeName] !== pin)
    throw new Error("Native TypeScript platform package is not declared at the exact pin");
  const native = await packageMetadata(
    createRequire(launcher.path).resolve(`${nativeName}/package.json`),
  );
  if (native.metadata.name !== nativeName || native.metadata.version !== pin)
    throw new Error("Installed native TypeScript package differs from its declared identity");
  const executable = await safePath(native.root, `lib/tsgo${platform === "win32" ? ".exe" : ""}`);
  const info = await lstat(executable);
  if (!info.isFile() || info.size <= 0 || info.size > 256 * 1024 * 1024)
    throw new Error("Native TypeScript executable must be a bounded regular file");
  await access(executable, constants.X_OK);
  // Return a physical path so the owned-process boundary cannot follow a package junction.
  return await realpath(executable);
}
