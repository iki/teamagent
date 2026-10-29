import { randomUUID } from "node:crypto";
import { lstat, realpath } from "node:fs/promises";
import { isDeepStrictEqual } from "node:util";
import { relative, resolve, sep } from "node:path";
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
          "ASK: the central Trigon patch registry is missing or unreadable; restore reviewed provenance before continuing.",
      });
    }),
    readBounded(root, cargoPath, dependencyLimits.lockBytes),
  ]);
  const manifestValue = json(manifestBytes);
  const registryValue = json(registryBytes);
  const manifest = await Effect.runPromise(decodeManifest(manifestValue));
  const registry = await Effect.runPromise(decodeRegistry(registryValue));
  await Effect.runPromise(patchPolicy(manifest, registry));
  const license = await readBounded(root, registry.license.artifactPath).catch(() => {
    throw new DependencyError({
      code: "blocked",
      message: "The supplied Trigon license/notice is missing or unreadable.",
    });
  });
  if (digest(license) !== registry.license.sha256)
    throw new DependencyError({
      code: "blocked",
      message: "The supplied Trigon license/notice does not match its recorded source bytes.",
    });
  const artifacts = [];
  for (const fix of registry.fixes)
    for (const file of fix.files) {
      const bytes = await readBounded(root, file.artifactPath).catch(() => {
        throw new DependencyError({
          code: "blocked",
          message: "ASK: a supplied Trigon dependency artifact is missing or unreadable.",
        });
      });
      if (digest(bytes) !== file.sha256)
        throw new DependencyError({
          code: "blocked",
          message:
            "ASK: a Trigon-owned dependency artifact changed or is missing. Restore its reviewed source or request a central Trigon fix.",
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
}

/** Host operations are explicit; ordinary check/plan never launch Aube or Git. */
export function createDependencyRuntime(options: DependencyRuntimeOptions) {
  const root = resolve(options.root);
  const command = options.command ?? runCommand;
  const aube = (
    args: readonly string[],
    signal: AbortSignal,
    timeoutMs: number = dependencyLimits.processMs,
  ) =>
    command({
      executable: "aube",
      arguments: args,
      cwd: root,
      timeoutMs,
      bytes: dependencyLimits.processBytes,
      signal,
    });
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
              "ASK: this plan requires an absent or incompatible Trigon fix or stack review. No dependency change was attempted.",
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
              "Inspect the retained attempt, processes and repository state. A required dependency workaround absent from Trigon must be proposed to the user before authoring or applying it.",
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
            message: "The explicit source origin is not the central Trigon repository.",
          });
        await git(["cat-file", "-e", `${revision}^{commit}`], 64);
        const sourceBlob = async (path: string): Promise<Uint8Array> => {
          const tree = utf8(await git(["ls-tree", "-z", revision, "--", path], 8192));
          const match = /^(100644|100755) blob ([a-f0-9]{40})\t([^\0]+)\0$/.exec(tree);
          if (match?.[2] === undefined || match[3] !== path)
            throw new DependencyError({
              code: "invalid",
              message: "A supplied Trigon path must be one regular file in the exact commit tree.",
            });
          const bytes = await git(["cat-file", "blob", match[2]]);
          utf8(bytes);
          if (bytes.includes(13))
            throw new DependencyError({
              code: "blocked",
              message:
                "ASK: Trigon candidate text needs reviewed LF source bytes; the shared source was not rewritten.",
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
        const artifacts = [];
        for (const fix of current.registry.fixes)
          for (const file of fix.files) {
            const bytes = await sourceBlob(file.sourcePath);
            const path = `${output}/${file.artifactPath}`;
            await publish(root, path, bytes);
            artifacts.push({
              fix: fix.id,
              sourcePath: file.sourcePath,
              artifactPath: file.artifactPath,
              sha256: digest(bytes),
              changed: digest(bytes) !== file.sha256,
            });
          }
        const license = await sourceBlob(current.registry.license.sourcePath);
        await publish(root, `${output}/${current.registry.license.artifactPath}`, license);
        checkUnchanged(current.baseline, (await snapshot(root)).baseline);
        const candidate = {
          format: "teamagent-trigon-source-candidate-v1",
          sourceRepository: current.registry.sourceRepository,
          sourceRevision: revision,
          previousRevision: current.registry.sourceRevision,
          artifacts,
          license: { ...current.registry.license, sha256: digest(license) },
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
