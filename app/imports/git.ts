import { lookup } from "node:dns/promises";
import { lstat, mkdir, mkdtemp, opendir, realpath, rm } from "node:fs/promises";
import { join, resolve } from "node:path";
import { pathToFileURL } from "node:url";
import { MemoryError, type CaptureRequest, type CapturedFile } from "@/memory";
import { authorizeLocal } from "./files.ts";
import { contained, excludedName, importLimits, safeRelative, sourceMediaType } from "./limits.ts";
import { networkUrl, publicAddress } from "./network.ts";
import { processEnvironment, runProcess } from "./process.ts";

const text = (bytes: Uint8Array) => new TextDecoder("utf-8", { fatal: true }).decode(bytes);

/** Validate the complete committed manifest before any eligible blob is opened. */
export function preflightGitEntries(
  tree: string,
  location: string,
  dataDirectory: string,
  initialWarnings: readonly string[],
  signal: AbortSignal,
): {
  entries: { path: string; object: string }[];
  warnings: string[];
} {
  const records = tree.split("\0").filter(Boolean);
  if (records.length > importLimits.entries)
    throw new MemoryError({
      code: "capacity",
      message: `Repository exceeds the ${importLimits.entries}-entry manifest limit.`,
    });
  const entries: { path: string; object: string }[] = [];
  const warnings = [...initialWarnings];
  for (const record of records) {
    signal.throwIfAborted();
    const match = /^(\d{6}) (blob|commit) ([a-f0-9]{40,64})\t(.+)$/.exec(record);
    const mode = match?.[1];
    const type = match?.[2];
    const object = match?.[3];
    const path = match?.[4];
    if (mode === undefined || type === undefined || object === undefined || path === undefined)
      throw new Error("Malformed Git tree entry");
    const privatePath =
      !/^https?:/.test(location) && contained(dataDirectory, join(location, path));
    if (
      !safeRelative(path) ||
      path.split("/").some(excludedName) ||
      mode === "120000" ||
      type !== "blob" ||
      privatePath
    ) {
      if (warnings.length >= 255)
        throw new MemoryError({
          code: "capacity",
          message: "Repository exclusion manifest limit exceeded.",
        });
      warnings.push(`Excluded Git entry: ${path.slice(0, 1000)}`);
      continue;
    }
    if (entries.length >= importLimits.files)
      throw new MemoryError({
        code: "capacity",
        message: `Repository contains more than ${importLimits.files} eligible files; split it into smaller explicit sources.`,
      });
    entries.push({ path, object });
  }
  return { entries, warnings };
}

async function diskBytes(root: string): Promise<number> {
  let size = 0;
  let entries = 0;
  const pending = [root];
  while (pending.length > 0) {
    const current = pending.pop();
    if (current === undefined) break;
    for await (const entry of await opendir(current)) {
      entries += 1;
      if (entries > 4096) throw new Error("Git staging entry limit exceeded");
      const path = join(current, entry.name);
      if (entry.isSymbolicLink()) throw new Error("Unexpected Git staging link");
      if (entry.isDirectory()) pending.push(path);
      else size += (await lstat(path)).size;
      if (size > importLimits.totalBytes) throw new Error("Git download byte limit exceeded");
    }
  }
  return size;
}

export async function captureGit(
  request: CaptureRequest,
  options: {
    signal: AbortSignal;
    allowedRoots?: readonly string[];
    allowPrivateNetwork?: boolean;
  },
): Promise<{ locator: string; files: CapturedFile[]; commit: string; warnings: string[] }> {
  await mkdir(request.temporaryDirectory, { recursive: true });
  const stagingRoot = await realpath(request.temporaryDirectory);
  const staging = await mkdtemp(join(stagingRoot, "git-"));
  if (!contained(stagingRoot, staging) || staging === stagingRoot)
    throw new Error("Invalid Git staging directory");
  const cleanConfig = join(staging, "empty-config");
  const hooks = join(staging, "hooks");
  await mkdir(hooks);
  const env = {
    ...processEnvironment(),
    GIT_CONFIG_NOSYSTEM: "1",
    GIT_CONFIG_GLOBAL: cleanConfig,
    GIT_TERMINAL_PROMPT: "0",
    GIT_ASKPASS: "",
    SSH_ASKPASS: "",
    GIT_NO_LAZY_FETCH: "1",
    GIT_LFS_SKIP_SMUDGE: "1",
    GIT_CONFIG_SYSTEM: cleanConfig,
    GIT_OPTIONAL_LOCKS: "0",
  };
  const safety = [
    "-c",
    `core.hooksPath=${hooks}`,
    "-c",
    "core.fsmonitor=false",
    "-c",
    "submodule.recurse=false",
    "-c",
    "credential.helper=",
    "-c",
    "protocol.allow=never",
    "-c",
    "protocol.https.allow=always",
    "-c",
    "protocol.http.allow=always",
    "-c",
    "http.proxy=",
    "-c",
    "http.followRedirects=false",
    "-c",
    "core.attributesFile=",
    "-c",
    "fetch.recurseSubmodules=false",
  ];
  let location: string;
  let gitPrefix: string[];
  const warnings: string[] = [];
  try {
    if (/^https?:\/\//i.test(request.locator)) {
      const url = networkUrl(request.locator);
      if (url.search || url.hash)
        throw new Error("Git repository URLs cannot contain query credentials or fragments");
      const host = url.hostname.replace(/^\[|\]$/g, "");
      const addresses = await lookup(host, { all: true });
      if (
        addresses.length === 0 ||
        (!options.allowPrivateNetwork && addresses.some((entry) => !publicAddress(entry.address)))
      )
        throw new Error("Git remote is outside the public network");
      const selected = addresses[0];
      if (selected === undefined) throw new Error("Git remote has no address");
      const address = selected.family === 6 ? `[${selected.address}]` : selected.address;
      safety.push(
        "-c",
        `http.curloptResolve=${host}:${url.port || (url.protocol === "https:" ? "443" : "80")}:${address}`,
      );
      const bare = join(staging, "repository.git");
      await runProcess("git", [...safety, "init", "--bare", "--template=", bare], {
        signal: options.signal,
        env,
        bytes: 1_048_576,
      });
      gitPrefix = [...safety, "--git-dir", bare];
      const limiter = new AbortController();
      let monitoring: Promise<void> | undefined;
      const interval = setInterval(() => {
        if (monitoring !== undefined) return;
        monitoring = diskBytes(staging)
          .then(
            () => {},
            () => limiter.abort(),
          )
          .finally(() => {
            monitoring = undefined;
          });
      }, 100);
      try {
        await runProcess(
          "git",
          [
            ...gitPrefix,
            "fetch",
            "--depth=1",
            "--no-tags",
            "--no-recurse-submodules",
            "--filter=blob:limit=16777216",
            "--",
            url.href,
            "HEAD",
          ],
          { signal: AbortSignal.any([options.signal, limiter.signal]), env, bytes: 1_048_576 },
        );
        await diskBytes(staging);
      } finally {
        clearInterval(interval);
        if (monitoring !== undefined) await monitoring;
      }
      location = url.href;
    } else {
      if (/^[a-z]+:[/][/]/i.test(request.locator) && !request.locator.startsWith("file:"))
        throw new Error("Git imports support HTTP(S) remotes and local repositories");
      const local = await authorizeLocal(request.locator, request, options.allowedRoots);
      gitPrefix = [...safety, "-C", local];
      location = local;
      warnings.push(
        "Git import captures committed HEAD; uncommitted working-tree files are excluded",
      );
    }
    const revision = /^https?:\/\//i.test(request.locator) ? "FETCH_HEAD" : "HEAD";
    const commit = text(
      await runProcess("git", [...gitPrefix, "rev-parse", "--verify", `${revision}^{commit}`], {
        signal: options.signal,
        env,
        bytes: 256,
      }),
    ).trim();
    if (!/^[a-f0-9]{40,64}$/.test(commit)) throw new Error("Invalid repository commit");
    const tree = text(
      await runProcess("git", [...gitPrefix, "ls-tree", "-rz", "--full-tree", commit], {
        signal: options.signal,
        env,
        bytes: 2_097_152,
      }),
    );
    const preflight = preflightGitEntries(
      tree,
      location,
      request.dataDirectory,
      warnings,
      options.signal,
    );
    const files: CapturedFile[] = [];
    let bytes = 0;
    for (const { path, object } of preflight.entries) {
      options.signal.throwIfAborted();
      const length = Number(
        text(
          await runProcess("git", [...gitPrefix, "cat-file", "-s", object], {
            signal: options.signal,
            env,
            bytes: 32,
          }),
        ).trim(),
      );
      if (
        !Number.isSafeInteger(length) ||
        length < 0 ||
        length > importLimits.fileBytes ||
        bytes + length > importLimits.totalBytes
      )
        throw new Error("Repository blob byte limit exceeded");
      const content = await runProcess("git", [...gitPrefix, "cat-file", "blob", object], {
        signal: options.signal,
        env,
        bytes: importLimits.fileBytes,
      });
      if (content.byteLength !== length) throw new Error("Repository blob size changed");
      bytes += length;
      files.push({
        path: `original/${path}`,
        role: "original",
        bytes: content,
        mediaType: sourceMediaType(path, content),
        origin: `${/^https?:/.test(location) ? location : pathToFileURL(resolve(location)).href}#${commit}/${encodeURI(path)}`,
      });
    }
    return { locator: location, files, commit, warnings: preflight.warnings };
  } finally {
    await rm(staging, { recursive: true, force: true });
  }
}
