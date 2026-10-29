/** Fingerprint the provisioned JavaScript package graph without executing package code. */
import { createHash } from "node:crypto";
import type { BigIntStats } from "node:fs";
import { lstat, open, readdir, realpath } from "node:fs/promises";
import { createRequire } from "node:module";
import { dirname, relative, resolve } from "node:path";
import { Schema } from "effect";
import { boundedRead, encodedDigest, hasCode } from "./cache-io.ts";

const Versions = Schema.Record(Schema.String, Schema.String);
const Package = Schema.Struct({
  name: Schema.optional(Schema.String),
  version: Schema.String,
  dependencies: Schema.optional(Versions),
  devDependencies: Schema.optional(Versions),
  optionalDependencies: Schema.optional(Versions),
  peerDependencies: Schema.optional(Versions),
});
const parse = Schema.decodeUnknownSync(Schema.fromJsonString(Package));
const limits = {
  packages: 2000,
  files: 100_000,
  bytes: 2 * 1024 ** 3,
  file: 128 * 1024 ** 2,
  depth: 32,
};

/** Trusted fixture observation only; no CLI or configuration supplies this callback. */
export type InstalledReadObserver = (event: {
  readonly path: string;
  readonly kind: "manifest" | "content";
  readonly phase: "before-open" | "after-read" | "closed";
}) => void | Promise<void>;

function sameFile(before: BigIntStats, after: BigIntStats): boolean {
  return (
    before.isFile() &&
    after.isFile() &&
    before.dev === after.dev &&
    before.ino === after.ino &&
    before.size === after.size &&
    before.mode === after.mode &&
    before.mtimeNs === after.mtimeNs &&
    before.ctimeNs === after.ctimeNs
  );
}

export async function installedPackageIdentity(
  root: string,
  observe?: InstalledReadObserver,
): Promise<string> {
  const project = parse(new TextDecoder().decode(await boundedRead(root, "package.json")));
  const visited = new Map<string, string>();
  const manifestIdentities = new Map<string, string>();
  const rows: Array<readonly string[]> = [];
  let fileCount = 0;
  let byteCount = 0;
  // Aube may provision reviewed packages through junctions into its global store.
  // Only manifests reached through declared package resolution authorize these reads.
  async function metadataAt(
    path: string,
  ): Promise<{ metadata: typeof Package.Type; identity: string }> {
    const original = await lstat(path, { bigint: true });
    if (!original.isFile() || original.isSymbolicLink() || original.size > 1024n * 1024n)
      throw new Error("Installed package metadata exceeds bounds or is linked");
    await observe?.({ path, kind: "manifest", phase: "before-open" });
    const handle = await open(path, "r");
    try {
      const before = await handle.stat({ bigint: true });
      if (!sameFile(original, before)) throw new Error("Installed metadata changed before opening");
      const bytes = new Uint8Array(Number(before.size));
      let offset = 0;
      while (offset < bytes.length) {
        const read = await handle.read(bytes, offset, bytes.length - offset, offset);
        if (!read.bytesRead) throw new Error("Installed metadata changed while reading");
        offset += read.bytesRead;
        await observe?.({ path, kind: "manifest", phase: "after-read" });
      }
      const extra = await handle.read(new Uint8Array(1), 0, 1, offset);
      const after = await handle.stat({ bigint: true });
      const current = await lstat(path, { bigint: true });
      if (extra.bytesRead !== 0 || !sameFile(before, after) || !sameFile(before, current))
        throw new Error("Installed metadata changed while reading");
      return {
        metadata: parse(new TextDecoder("utf-8", { fatal: true }).decode(bytes)),
        identity: createHash("sha256")
          .update(`${Number(before.mode & 0o777n)}\0`)
          .update(bytes)
          .digest("hex"),
      };
    } finally {
      await handle.close();
      await observe?.({ path, kind: "manifest", phase: "closed" });
    }
  }
  async function content(path: string): Promise<string> {
    const stat = await lstat(path, { bigint: true });
    if (!stat.isFile() || stat.isSymbolicLink() || stat.size > BigInt(limits.file))
      throw new Error("Unsupported or oversized installed prerequisite file");
    byteCount += Number(stat.size);
    if (++fileCount > limits.files || byteCount > limits.bytes)
      throw new Error("Installed prerequisite fingerprint exceeds its declared bounds");
    await observe?.({ path, kind: "content", phase: "before-open" });
    const handle = await open(path, "r");
    try {
      const before = await handle.stat({ bigint: true });
      if (!sameFile(stat, before)) throw new Error("Installed prerequisite changed before opening");
      const hash = createHash("sha256");
      hash.update(`${Number(before.mode & 0o777n)}\0`);
      const chunk = new Uint8Array(64 * 1024);
      let offset = 0;
      for (;;) {
        const read = await handle.read(chunk, 0, chunk.length, offset);
        if (!read.bytesRead) break;
        offset += read.bytesRead;
        if (offset > limits.file)
          throw new Error("Installed prerequisite grew beyond its byte bound");
        hash.update(chunk.subarray(0, read.bytesRead));
        await observe?.({ path, kind: "content", phase: "after-read" });
      }
      const after = await handle.stat({ bigint: true });
      const current = await lstat(path, { bigint: true });
      if (BigInt(offset) !== before.size || !sameFile(before, after) || !sameFile(before, current))
        throw new Error("Installed prerequisite changed during fingerprinting");
      return hash.digest("hex");
    } finally {
      await handle.close();
      await observe?.({ path, kind: "content", phase: "closed" });
    }
  }
  async function locate(name: string, parent: string): Promise<string | undefined> {
    if (!/^(?:@[a-zA-Z0-9._-]+\/)?[a-zA-Z0-9._-]+$/u.test(name))
      throw new Error("Invalid provisioned package name");
    for (const search of createRequire(parent).resolve.paths(name) ?? []) {
      try {
        const manifest = await realpath(resolve(search, name, "package.json"));
        return manifest;
      } catch (error) {
        if (!hasCode(error, "ENOENT") && !hasCode(error, "ENOTDIR")) throw error;
      }
    }
    return undefined;
  }
  async function visit(manifest: string, expected?: string): Promise<void> {
    const { metadata, identity } = await metadataAt(manifest);
    if (expected !== undefined && metadata.version !== expected)
      throw new Error(
        "Installed direct dependency differs from its exact pin; run explicit frozen setup",
      );
    if (visited.has(manifest)) {
      if (manifestIdentities.get(manifest) !== identity)
        throw new Error("Installed package metadata changed across graph traversal");
      return;
    }
    if (visited.size >= limits.packages)
      throw new Error("Installed prerequisite graph exceeds package bound");
    const label = `${metadata.name ?? "unnamed"}@${metadata.version}`;
    const nodeId = `package-${visited.size}`;
    visited.set(manifest, nodeId);
    manifestIdentities.set(manifest, identity);
    const files: Array<readonly string[]> = [];
    async function walk(directory: string, depth: number): Promise<void> {
      if (depth > limits.depth) throw new Error("Installed prerequisite tree exceeds depth bound");
      const children = await readdir(directory, { withFileTypes: true });
      if (children.length + fileCount > limits.files)
        throw new Error("Installed prerequisite tree exceeds file bound");
      for (const child of children.sort((a, b) => a.name.localeCompare(b.name, "en"))) {
        // Nested dependency links are traversed through their declared package graph.
        if (child.name === "node_modules" || child.name === ".git") continue;
        const path = resolve(directory, child.name);
        if (child.isSymbolicLink())
          throw new Error("Unreviewed links inside an installed package are unsupported");
        if (child.isDirectory()) await walk(path, depth + 1);
        else
          files.push([
            relative(dirname(manifest), path).replaceAll("\\", "/"),
            await content(path),
          ]);
      }
    }
    await walk(dirname(manifest), 0);
    const manifestName = relative(dirname(manifest), manifest).replaceAll("\\", "/");
    if (files.find(([name]) => name === manifestName)?.[1] !== identity)
      throw new Error("Parsed installed metadata differs from its hashed package inventory");
    rows.push([nodeId, label, encodedDigest(files)]);
    const dependencies = new Map<string, boolean>();
    for (const name of Object.keys(metadata.dependencies ?? {})) dependencies.set(name, true);
    for (const name of Object.keys(metadata.optionalDependencies ?? {}))
      dependencies.set(name, false);
    for (const name of Object.keys(metadata.peerDependencies ?? {}))
      if (!dependencies.has(name)) dependencies.set(name, false);
    for (const [name, required] of [...dependencies].sort(([a], [b]) => a.localeCompare(b, "en"))) {
      const target = await locate(name, manifest);
      if (!target) {
        let virtual = false;
        if (process.versions.bun && (name === "node-fetch" || name === "ws")) {
          try {
            virtual = createRequire(manifest).resolve(name) === name;
          } catch (error) {
            if (!hasCode(error, "MODULE_NOT_FOUND")) throw error;
          }
        }
        // Bundled/platform-specific packages can retain unused declarations. Bind
        // absence explicitly: installing the edge invalidates prior checks, and
        // fresh checks still fail if an executed path actually needs that module.
        rows.push([
          nodeId,
          name,
          virtual ? "bun-virtual-module" : required ? "absent-declared" : "absent-optional-or-peer",
        ]);
      } else {
        await visit(target);
        const targetId = visited.get(target);
        if (targetId === undefined) throw new Error("Installed graph lost a declared dependency");
        rows.push([nodeId, name, targetId]);
      }
    }
  }
  for (const [name, expected] of Object.entries({
    ...project.dependencies,
    ...project.devDependencies,
  }).sort(([a], [b]) => a.localeCompare(b, "en"))) {
    const manifest = await locate(name, resolve(root, "package.json"));
    if (!manifest) throw new Error(`Missing provisioned direct dependency: ${name}`);
    await visit(manifest, expected);
    const nodeId = visited.get(manifest);
    if (nodeId === undefined) throw new Error("Installed graph lost a direct dependency");
    rows.push(["project", name, nodeId]);
  }
  return encodedDigest(
    rows.sort((a, b) => JSON.stringify(a).localeCompare(JSON.stringify(b), "en")),
  );
}
