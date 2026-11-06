import { randomUUID } from "node:crypto";
import { lstat, realpath } from "node:fs/promises";
import { isDeepStrictEqual } from "node:util";
import { isAbsolute, relative, resolve, sep } from "node:path";
import { pinnedTool } from "../check/toolchain.ts";
import { catalogSelection } from "./catalog.ts";
import { DateTime, Effect, Schema } from "effect";
import {
  DependencyError,
  PlanSchema,
  Revision,
  dependencyLimits,
  type DependencyBaseline,
  type DependencyPlan,
} from "./model.ts";
import {
  buildDependencyPlan,
  decodeManifest,
  decodeRegistry,
  dependencyCommands,
  patchPolicy,
} from "./plan.ts";
import {
  acquireLease,
  checkedPath,
  diagnostic,
  digest,
  hostOperation,
  json,
  publish,
  publishJson,
  readBounded,
  reserveOutput,
  runCommand,
  utf8,
  type CommandRunner,
  type CommandResult,
} from "./io.ts";

const registryPath = "patches/trigon/registry.json";
const cargoPath = "app/desktop/src-tauri/Cargo.lock";
const JsonObject = Schema.Record(Schema.String, Schema.Unknown);
const timestamp = (): string => DateTime.formatIso(Effect.runSync(DateTime.now));

async function snapshot(root: string) {
  const [manifestBytes, lock, trust, registryBytes, cargo] = await Promise.all([
    readBounded(root, "package.json"),
    readBounded(root, "aube-lock.yaml", dependencyLimits.lockBytes),
    readBounded(root, "aube-workspace.yaml"),
    readBounded(root, registryPath).catch(() => {
      throw new DependencyError({
        code: "blocked",
        message:
          "ASK: the central Patches patch registry is missing or unreadable; restore reviewed provenance before continuing.",
      });
    }),
    readBounded(root, cargoPath, dependencyLimits.lockBytes),
  ]);
  const manifestValue = json(manifestBytes);
  const registryValue = json(registryBytes);
  const manifest = await Effect.runPromise(decodeManifest(manifestValue));
  const registry = await Effect.runPromise(decodeRegistry(registryValue));
  await Effect.runPromise(patchPolicy(manifest, registry));
  const [catalogBytes, migrationBytes] = await Promise.all(
    [registry.metadata.catalog, registry.metadata.migration].map(async (file) => {
      const bytes = await readBounded(root, file.artifactPath);
      if (digest(bytes) !== file.sha256 || bytes.includes(13))
        throw new DependencyError({
          code: "blocked",
          message: "ASK: canonical patch metadata changed or is not LF.",
        });
      return bytes;
    }),
  );
  if (catalogBytes === undefined || migrationBytes === undefined)
    throw new DependencyError({
      code: "invalid",
      message: "Patch metadata coverage is incomplete.",
    });
  await Effect.runPromise(catalogSelection(registry, json(catalogBytes), json(migrationBytes)));
  for (const notice of registry.notices) {
    const bytes = await readBounded(root, notice.artifactPath).catch(() => {
      throw new DependencyError({
        code: "blocked",
        message: "A required patch notice is missing or unreadable.",
      });
    });
    if (digest(bytes) !== notice.sha256 || bytes.includes(13))
      throw new DependencyError({
        code: "blocked",
        message: "A required patch notice does not match its exact LF source bytes.",
      });
  }
  const artifacts = [];
  for (const fix of registry.fixes)
    for (const file of fix.files) {
      const bytes = await readBounded(root, file.artifactPath).catch(() => {
        throw new DependencyError({
          code: "blocked",
          message: "ASK: a supplied Patches dependency artifact is missing or unreadable.",
        });
      });
      if (digest(bytes) !== file.sha256)
        throw new DependencyError({
          code: "blocked",
          message:
            "ASK: a Patches-owned dependency artifact changed or is missing. Restore its reviewed source or request a central Patches fix.",
        });
      if (bytes.includes(13))
        throw new DependencyError({
          code: "blocked",
          message:
            "ASK: supplied dependency text must have reviewed LF source bytes; do not silently rewrite a shared artifact.",
        });
      artifacts.push({ fix: fix.id, path: file.artifactPath, sha256: file.sha256 });
    }
  const baseline: DependencyBaseline = {
    manifest: digest(manifestBytes),
    lock: digest(lock),
    trust: digest(trust),
    registry: digest(registryBytes),
    cargo: digest(cargo),
  };
  return { manifest, registry, manifestValue, registryValue, baseline, artifacts };
}

function checkUnchanged(before: DependencyBaseline, after: DependencyBaseline): void {
  if (!isDeepStrictEqual(before, after))
    throw new DependencyError({
      code: "conflict",
      message: "Dependency inputs changed after planning; create and review a fresh plan.",
    });
}

function ensureResult(result: CommandResult, allowed: readonly number[]): void {
  if (result.uncertain || result.status === null)
    throw new DependencyError({
      code: "uncertain",
      message:
        "The subprocess outcome is uncertain. Reconcile processes and retained receipts before another attempt; automatic retry is disabled.",
    });
  if (!allowed.includes(result.status))
    throw new DependencyError({
      code: "failed",
      message:
        "The dependency command rejected the operation. Review its retained status and safe error codes; no repair, trust change or retry was attempted.",
    });
}

function rootFields(value: unknown): Record<string, unknown> {
  const object = Schema.decodeUnknownSync(JsonObject)(value);
  return Object.fromEntries(
    Object.entries(object).filter(([key]) => key !== "dependencies" && key !== "devDependencies"),
  );
}

export interface DependencyRuntimeOptions {
  readonly root: string;
  readonly command?: CommandRunner;
  /** Trusted host capability for fixtures; executable names never come from command JSON. */
  readonly resolveAube?: (root: string) => string;
}

/** Host operations are explicit; ordinary check/plan never launch Aube or Git. */
export function createDependencyRuntime(options: DependencyRuntimeOptions) {
  const root = resolve(options.root);
  const command = options.command ?? runCommand;
  const aube = (
    args: readonly string[],
    signal: AbortSignal,
    timeoutMs: number = dependencyLimits.processMs,
  ) => {
    const executable = (options.resolveAube ?? ((directory) => pinnedTool(directory, "aube")))(
      root,
    );
    if (!isAbsolute(executable))
      throw new DependencyError({
        code: "blocked",
        message: "Aube must resolve to an absolute physical executable.",
      });
    return command({
      executable: "aube",
      physicalExecutable: executable,
      arguments: args,
      cwd: root,
      timeoutMs,
      bytes: dependencyLimits.processBytes,
      signal,
    });
  };
  const checkAube = async (signal: AbortSignal): Promise<void> => {
    const version = await aube(["--version"], signal);
    ensureResult(version, [0]);
    if (!/^(?:aube\s+)?2\.5\.1(?:\s|$)/.test(utf8(version.stdout).trim()))
      throw new DependencyError({
        code: "blocked",
        message: "The executable does not report the pinned Aube 2.5.1 version.",
      });
  };
  const savedPlan = async (path: string): Promise<DependencyPlan> => {
    const value = json(await readBounded(root, path));
    return Effect.runPromise(
      Schema.decodeUnknownEffect(PlanSchema)(value, { onExcessProperty: "error" }).pipe(
        Effect.mapError(
          () => new DependencyError({ code: "invalid", message: "Invalid dependency plan." }),
        ),
      ),
    );
  };

  return {
    check: () =>
      hostOperation(async () => {
        const current = await snapshot(root);
        return {
          status: "verified",
          sourceRepository: current.registry.sourceRepository,
          sourceRevision: current.registry.sourceRevision,
          baseline: current.baseline,
          artifacts: current.artifacts,
          network: false,
          automaticRepair: false,
        };
      }),
    plan: (reportPath?: string, output?: string) =>
      hostOperation(async () => {
        if (output !== undefined) await reserveOutput(root, output);
        const current = await snapshot(root);
        const report: unknown =
          reportPath === undefined ? {} : json(await readBounded(root, reportPath));
        const plan = await Effect.runPromise(
          buildDependencyPlan({
            manifest: current.manifestValue,
            registry: current.registryValue,
            report,
            status: 0,
            baseline: current.baseline,
          }),
        );
        if (output !== undefined) await publishJson(root, output, plan);
        return plan;
      }),
    discover: (output: string) =>
      hostOperation(async (signal) => {
        await reserveOutput(root, output);
        const current = await snapshot(root);
        await checkAube(signal);
        const result = await aube(
          ["outdated", "--json", "--fetch-retries", "0", "--fetch-timeout", "15000"],
          signal,
        );
        ensureResult(result, [0, 1]);
        const plan = await Effect.runPromise(
          buildDependencyPlan({
            manifest: current.manifestValue,
            registry: current.registryValue,
            report: json(result.stdout),
            status: result.status ?? -1,
            baseline: current.baseline,
          }),
        );
        checkUnchanged(current.baseline, (await snapshot(root)).baseline);
        await publishJson(root, output, plan);
        return {
          status: "planned",
          plan: relative(root, checkedPath(root, output)).split(sep).join("/"),
          upgrades: plan.upgrades.length,
          blocked: plan.blocked,
          diagnostic: diagnostic(result),
          automaticRepair: false,
        };
      }),
    apply: (planPath: string) =>
      hostOperation(async (signal) => {
        const plan = await savedPlan(planPath);
        const current = await snapshot(root);
        checkUnchanged(plan.baseline, current.baseline);
        const rebuilt = await Effect.runPromise(
          buildDependencyPlan({
            manifest: current.manifestValue,
            registry: current.registryValue,
            report: plan.report,
            status: plan.reportStatus,
            baseline: current.baseline,
          }),
        );
        if (!isDeepStrictEqual(rebuilt, plan))
          throw new DependencyError({
            code: "conflict",
            message: "Plan derivation changed or was edited; create and review a fresh plan.",
          });
        if (plan.blocked.length !== 0)
          throw new DependencyError({
            code: "blocked",
            message:
              "ASK: this plan requires an absent or incompatible Patches fix or stack review. No dependency change was attempted.",
          });
        const id = randomUUID();
        const receipt = `.cache/dependencies/runs/${id}`;
        const release = await acquireLease(root, `${receipt}/intent.json`);
        let completed = false;
        const expectedRuntime = { ...current.manifest.dependencies };
        const expectedDevelopment = { ...current.manifest.devDependencies };
        try {
          await publishJson(root, `${receipt}/intent.json`, {
            format: "teamagent-dependency-attempt-v1",
            state: "prepared",
            createdAt: timestamp(),
            plan,
            automaticRepair: false,
          });
          checkUnchanged(current.baseline, (await snapshot(root)).baseline);
          const commands = dependencyCommands(plan);
          if (commands.length > 0) await checkAube(signal);
          checkUnchanged(current.baseline, (await snapshot(root)).baseline);
          for (const [index, args] of commands.entries()) {
            await publishJson(root, `${receipt}/stage-${index}-intent.json`, {
              state: "started",
              arguments: args,
              startedAt: timestamp(),
            });
            const result = await aube(
              [...args, "--fetch-retries", "0", "--fetch-timeout", "15000"],
              signal,
              dependencyLimits.applyMs,
            );
            await publishJson(root, `${receipt}/stage-${index}-result.json`, {
              state: result.status === 0 ? "command-completed" : "reconciliation-required",
              ...diagnostic(result),
            });
            ensureResult(result, [0]);
            const development = args.includes("--save-dev");
            for (const item of plan.upgrades)
              if ((item.group === "devDependencies") === development)
                (development ? expectedDevelopment : expectedRuntime)[item.name] = item.target;
            const updated = await snapshot(root);
            if (
              updated.baseline.trust !== current.baseline.trust ||
              updated.baseline.registry !== current.baseline.registry ||
              updated.baseline.cargo !== current.baseline.cargo ||
              !isDeepStrictEqual(
                rootFields(current.manifestValue),
                rootFields(updated.manifestValue),
              ) ||
              !isDeepStrictEqual(expectedRuntime, updated.manifest.dependencies) ||
              !isDeepStrictEqual(expectedDevelopment, updated.manifest.devDependencies)
            )
              throw new DependencyError({
                code: "conflict",
                message:
                  "A dependency command changed unexpected pins, manifest fields, trust, patch ownership or Cargo state. Preserve the changes and reconcile the receipt.",
              });
          }
          if (commands.length > 0) {
            await publishJson(root, `${receipt}/verification-intent.json`, {
              state: "started",
              arguments: ["run", "--no-install", "review:check"],
            });
            const result = await aube(
              ["run", "--no-install", "review:check"],
              signal,
              dependencyLimits.applyMs,
            );
            await publishJson(root, `${receipt}/verification-result.json`, diagnostic(result));
            ensureResult(result, [0]);
          }
          const updated = await snapshot(root);
          if (
            updated.baseline.trust !== current.baseline.trust ||
            updated.baseline.registry !== current.baseline.registry ||
            updated.baseline.cargo !== current.baseline.cargo ||
            !isDeepStrictEqual(
              rootFields(current.manifestValue),
              rootFields(updated.manifestValue),
            ) ||
            !isDeepStrictEqual(expectedRuntime, updated.manifest.dependencies) ||
            !isDeepStrictEqual(expectedDevelopment, updated.manifest.devDependencies)
          )
            throw new DependencyError({
              code: "conflict",
              message:
                "Verification changed dependency policy or unexpected manifest/native inputs. Reconcile the retained attempt.",
            });
          await publishJson(root, `${receipt}/result.json`, {
            state: "complete",
            completedAt: timestamp(),
            baseline: updated.baseline,
            upgrades: plan.upgrades,
            automaticRepair: false,
          });
          completed = true;
          return {
            status: "complete",
            receipt: `${receipt}/result.json`,
            upgrades: plan.upgrades,
            automaticRepair: false,
          };
        } catch (error) {
          await publishJson(root, `${receipt}/reconcile.json`, {
            state: "reconciliation-required",
            action:
              "Inspect the retained attempt, processes and repository state. A required dependency workaround absent from Patches must be proposed to the user before authoring or applying it.",
            automaticRepair: false,
          });
          throw error;
        } finally {
          if (completed) await release();
        }
      }),
    sourceRefresh: (sourcePath: string, revision: string, output: string) =>
      hostOperation(async (signal) => {
        if (!Schema.is(Revision)(revision))
          throw new DependencyError({
            code: "invalid",
            message: "Source refresh requires a full immutable Git commit SHA.",
          });
        await reserveOutput(root, `${output}/candidate.json`);
        await reserveOutput(root, `${output}/intent.json`);
        const current = await snapshot(root);
        const source = resolve(sourcePath);
        const info = await lstat(source);
        if (
          !info.isDirectory() ||
          info.isSymbolicLink() ||
          resolve(await realpath(source)) !== source
        )
          throw new DependencyError({
            code: "invalid",
            message: "The explicit source must be a canonical regular Git directory.",
          });
        const git = async (
          args: readonly string[],
          bytes: number = dependencyLimits.inputBytes,
        ): Promise<Uint8Array> => {
          const result = await command({
            executable: "git",
            arguments: [
              "--no-replace-objects",
              "-c",
              `safe.directory=${source}`,
              "-c",
              `core.hooksPath=${process.platform === "win32" ? "NUL" : "/dev/null"}`,
              "-c",
              "core.fsmonitor=false",
              "-c",
              "gc.auto=0",
              "-c",
              "protocol.allow=never",
              "-C",
              source,
              ...args,
            ],
            cwd: root,
            timeoutMs: 30_000,
            bytes,
            signal,
            isolatedGit: true,
          });
          ensureResult(result, [0]);
          return result.stdout;
        };
        const origin = utf8(
          await git(["config", "--local", "--no-includes", "--get", "remote.origin.url"], 512),
        ).trim();
        if (origin.toLowerCase().replace(/\.git$/, "") !== current.registry.sourceRepository)
          throw new DependencyError({
            code: "invalid",
            message: "The explicit source origin is not the central Patches repository.",
          });
        await git(["cat-file", "-e", `${revision}^{commit}`], 64);
        const sourceBlob = async (path: string): Promise<Uint8Array> => {
          const tree = utf8(await git(["ls-tree", "-z", revision, "--", path], 8192));
          const match = /^(100644|100755) blob ([a-f0-9]{40})\t([^\0]+)\0$/.exec(tree);
          if (match?.[2] === undefined || match[3] !== path)
            throw new DependencyError({
              code: "invalid",
              message: "A supplied Patches path must be one regular file in the exact commit tree.",
            });
          const bytes = await git(["cat-file", "blob", match[2]]);
          utf8(bytes);
          if (bytes.includes(13))
            throw new DependencyError({
              code: "blocked",
              message:
                "ASK: Patches candidate text needs reviewed LF source bytes; the shared source was not rewritten.",
            });
          return bytes;
        };
        await publishJson(root, `${output}/intent.json`, {
          state: "candidate-refresh-started",
          sourceRepository: current.registry.sourceRepository,
          sourceRevision: revision,
          previousRevision: current.registry.sourceRevision,
          approvalRequired: true,
          promoted: false,
        });
        const catalogBytes = await sourceBlob(current.registry.metadata.catalog.sourcePath);
        const migrationBytes = await sourceBlob(current.registry.metadata.migration.sourcePath);
        const selection = await Effect.runPromise(
          catalogSelection(
            {
              ...current.registry,
              sourceRevision: revision,
              metadata: {
                catalog: { ...current.registry.metadata.catalog, sha256: digest(catalogBytes) },
                migration: {
                  ...current.registry.metadata.migration,
                  sha256: digest(migrationBytes),
                },
              },
            },
            json(catalogBytes),
            json(migrationBytes),
            true,
          ),
        );
        await Effect.runPromise(patchPolicy(current.manifest, selection));
        await publish(root, `${output}/${selection.metadata.catalog.artifactPath}`, catalogBytes);
        await publish(
          root,
          `${output}/${selection.metadata.migration.artifactPath}`,
          migrationBytes,
        );
        const stage = async (file: {
          readonly sourcePath: string;
          readonly artifactPath: string;
          readonly sha256: string;
        }) => {
          const bytes = await sourceBlob(file.sourcePath);
          if (digest(bytes) !== file.sha256)
            throw new DependencyError({
              code: "blocked",
              message: "ASK: Patches candidate bytes do not match its catalog migration.",
            });
          await publish(root, `${output}/${file.artifactPath}`, bytes);
        };
        const artifacts = [];
        for (const fix of selection.fixes)
          for (const file of fix.files) {
            await stage(file);
            const previous = current.registry.fixes
              .find((item) => item.id === fix.id)
              ?.files.find((item) => item.artifactPath === file.artifactPath);
            artifacts.push({
              fix: fix.id,
              sourcePath: file.sourcePath,
              artifactPath: file.artifactPath,
              sha256: file.sha256,
              changed: file.sha256 !== previous?.sha256,
            });
          }
        for (const notice of selection.notices) await stage(notice);
        checkUnchanged(current.baseline, (await snapshot(root)).baseline);
        const candidate = {
          format: "teamagent-patches-source-candidate-v1",
          sourceRepository: selection.sourceRepository,
          sourceRevision: revision,
          previousRevision: current.registry.sourceRevision,
          artifacts,
          selection,
          approvalRequired: true,
          promoted: false,
          publicReachabilityVerified: false,
        };
        await publishJson(root, `${output}/candidate.json`, candidate);
        return {
          status: "candidate-staged",
          candidate: relative(root, checkedPath(root, `${output}/candidate.json`))
            .split(sep)
            .join("/"),
          approvalRequired: true,
          promoted: false,
        };
      }),
  };
}
