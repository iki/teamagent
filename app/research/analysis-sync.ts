#!/usr/bin/env bun
import { createHash, randomUUID } from "node:crypto";
import { execFile } from "node:child_process";
import { lstat, mkdir, readFile, realpath, rename, rm, stat, writeFile } from "node:fs/promises";
import { dirname, isAbsolute, relative, resolve } from "node:path";
import { setTimeout as delay } from "node:timers/promises";
import { cli } from "cleye";
import { createConsola } from "consola";
import type { Schema } from "effect";
import { version } from "../../package.json";
import { withHostInterruption } from "../runtime/interruption.ts";
import { loadResearchSettings } from "./settings.ts";
import {
  AnalysisStateSchema,
  GitStateSchema,
  InventorySchema,
  ReviewRequestsSchema,
  parseAnalysisJson,
  type AnalysisRecord,
  type AnalysisState,
  type ChangePacket,
  type ObservedRepository,
  type ReviewEvent,
  type ReviewRequest,
} from "./analysis-contracts.ts";

const limits = {
  jsonBytes: 16_000_000,
  reportBytes: 1_000_000,
  gitBytes: 2_000_000,
  diffBytes: 8_388_608,
  commits: 32,
  files: 160,
  reviews: 100,
  reviewBytes: 256_000,
};
const shaPattern = /^(?:[a-f0-9]{40}|[a-f0-9]{64})$/u;
const idPattern = /^[a-z0-9][a-z0-9._-]{0,180}$/u;
const digest = (value: string): string => createHash("sha256").update(value).digest("hex");
const legacyReportContent = (value: string): string =>
  value.replace(
    /\n<!-- teamagent-analysis:start -->\n[\s\S]*?<!-- teamagent-analysis:end -->\n?/gu,
    "",
  );
const reportContent = (value: string): string =>
  value.replace(
    /\r?\n<!-- teamagent-analysis:start -->\r?\n[\s\S]*?<!-- teamagent-analysis:end -->(?:\r?\n(?!<!-- teamagent-analysis:start -->))?/gu,
    "",
  );
const reportDigest = (value: string): string => digest(reportContent(value));
function metadataRepairHistory(
  body: string,
  previous: string,
  previousDigest: string,
  currentDigest: string | null,
): string {
  if (
    digest(previous) !== previousDigest ||
    reportDigest(previous) !== currentDigest ||
    reportDigest(body) !== currentDigest
  )
    throw new Error("Report changed during metadata-only normalization; baseline preserved");
  return previous;
}
const slash = (value: string): string => value.replaceAll("\\", "/");
const escapeCell = (value: string): string =>
  value.replaceAll("|", "\\|").replaceAll(/\r?\n/gu, " ");

export function canonicalRemote(value: string): string {
  const normalized = value
    .replace(/^git@([^:]+):/u, "https://$1/")
    .replace(/^ssh:\/\/git@/u, "https://");
  const url = new URL(normalized);
  if (
    !["https:", "http:"].includes(url.protocol) ||
    url.username ||
    url.password ||
    url.search ||
    url.hash
  )
    throw new Error(
      "Repository remote must be an HTTP(S) URL without credentials, query or fragment",
    );
  if (!["github.com", "gist.github.com", "gitlab.com"].includes(url.hostname.toLowerCase()))
    throw new Error("Unsupported source host; register an explicit host policy first");
  const path = url.pathname.replace(/\.git\/?$/u, "").replace(/\/$/u, "");
  if (!/^\/[a-zA-Z0-9_.-]+\/[a-zA-Z0-9_.-]+$/u.test(path))
    throw new Error("Invalid repository remote path");
  const host = url.hostname.toLowerCase();
  const canonicalPath = ["github.com", "gist.github.com"].includes(host)
    ? path.toLowerCase()
    : path;
  return `https://${host}${canonicalPath}`;
}

function contained(root: string, path: string): string {
  if (isAbsolute(path)) throw new Error("Expected a project-relative path");
  const target = resolve(root, path);
  const part = slash(relative(root, target));
  if (part === ".." || part.startsWith("../") || isAbsolute(part))
    throw new Error("Path escapes its allowed root");
  return target;
}
async function safeProjectPath(root: string, path: string): Promise<string> {
  const target = contained(root, path);
  const actualRoot = await realpath(root);
  let current = resolve(root);
  for (const part of slash(relative(root, target)).split("/").filter(Boolean)) {
    current = resolve(current, part);
    try {
      if ((await lstat(current)).isSymbolicLink())
        throw new Error("Project evidence paths must not traverse symlinks or junctions");
      const actual = slash(relative(actualRoot, await realpath(current)));
      if (actual === ".." || actual.startsWith("../") || isAbsolute(actual))
        throw new Error("Evidence path escapes project root");
    } catch (error) {
      if (error instanceof Error && "code" in error && error.code === "ENOENT") break;
      throw error;
    }
  }
  return target;
}
async function boundedText(path: string, bytes: number): Promise<string> {
  if ((await stat(path)).size > bytes) throw new Error("Input exceeds the documented byte limit");
  return readFile(path, "utf8");
}
async function jsonFile<A>(path: string, schema: Schema.Codec<A>): Promise<A> {
  return parseAnalysisJson(schema, await boundedText(path, limits.jsonBytes));
}
async function exists(path: string): Promise<boolean> {
  try {
    await stat(path);
    return true;
  } catch (error) {
    if (error instanceof Error && "code" in error && error.code === "ENOENT") return false;
    throw error;
  }
}
function errorCode(error: unknown): string | undefined {
  if (
    error instanceof Error &&
    "code" in error &&
    typeof error.code === "string" &&
    /^E[A-Z0-9_]{1,30}$/u.test(error.code)
  )
    return error.code;
  return undefined;
}
export function analysisErrorMessage(error: unknown): string {
  const code = errorCode(error);
  if (code !== undefined)
    return `Analysis filesystem/process operation failed (${code}); outputs may be partially published. Inspect the pending operation and rerun.`;
  if (!(error instanceof Error)) return "Analysis synchronization failed";
  if (/[A-Za-z]:[\\/]|\\\\|(?:^|[\s'"])\/(?!\/)[^\s]/u.test(error.message))
    return "Analysis operation failed; an absolute local path was omitted from this diagnostic";
  return error.message;
}
export async function replaceEvidenceFile(
  root: string,
  temporary: string,
  target: string,
  operations: {
    readonly rename: (from: string, to: string) => Promise<void>;
    readonly delay: (milliseconds: number) => Promise<void>;
  } = { rename, delay },
): Promise<void> {
  await safeProjectPath(root, slash(relative(root, temporary)));
  await safeProjectPath(root, slash(relative(root, target)));
  for (let attempt = 0; attempt < 5; attempt++) {
    try {
      await operations.rename(temporary, target);
      return;
    } catch (error: unknown) {
      const code = errorCode(error);
      if (attempt === 4 || code === undefined || !["EBUSY", "EPERM", "EACCES"].includes(code))
        throw new Error(
          `Cannot atomically replace ${slash(relative(root, target))} (${code ?? "unknown error"}); the existing target was preserved`,
        );
      await operations.delay(100 * (attempt + 1));
    }
  }
}
async function atomicWrite(root: string, path: string, value: string): Promise<void> {
  await safeProjectPath(root, slash(relative(root, path)));
  await mkdir(dirname(path), { recursive: true });
  const temporary = `${path}.${randomUUID()}.tmp`;
  try {
    await writeFile(temporary, value, { flag: "wx" });
    await replaceEvidenceFile(root, temporary, path);
  } finally {
    await rm(temporary, { force: true });
  }
}
async function immutableWrite(root: string, path: string, value: string): Promise<void> {
  await safeProjectPath(root, slash(relative(root, path)));
  await mkdir(dirname(path), { recursive: true });
  if (!(await exists(path))) await writeFile(path, value, { flag: "wx" });
}

export class GitInspectionError extends Error {
  constructor(readonly operation: string) {
    super(`Git ${operation} failed, was cancelled, or exceeded its time/output bound`);
  }
}
export interface GitResult {
  readonly code: number;
  readonly text: string;
}
export type GitReader = (path: string, args: readonly string[]) => Promise<GitResult>;
export function gitReader(signal: AbortSignal): GitReader {
  return (path, args) =>
    new Promise((resolveResult, reject) => {
      signal.throwIfAborted();
      execFile(
        "git",
        [
          "--no-optional-locks",
          "--no-replace-objects",
          "-c",
          `safe.directory=${slash(path)}`,
          "-c",
          "core.quotepath=false",
          "-c",
          "core.fsmonitor=false",
          "-c",
          "core.commitGraph=false",
          "-c",
          `core.hooksPath=${process.platform === "win32" ? "NUL" : "/dev/null"}`,
          "-c",
          "advice.graftFileDeprecated=false",
          "-c",
          "submodule.recurse=false",
          "-c",
          "credential.interactive=false",
          "-c",
          "protocol.allow=never",
          "-C",
          path,
          ...args,
        ],
        {
          encoding: "utf8",
          windowsHide: true,
          timeout: 30_000,
          maxBuffer: args[0] === "diff" ? limits.diffBytes : limits.gitBytes,
          signal,
          // Inspection uses existing immutable objects; missing evidence cannot start a fetch.
          env: {
            ...process.env,
            GIT_OPTIONAL_LOCKS: "0",
            GIT_NO_REPLACE_OBJECTS: "1",
            GIT_GRAFT_FILE: process.platform === "win32" ? "NUL" : "/dev/null",
            GIT_NO_LAZY_FETCH: "1",
            GIT_ALLOW_PROTOCOL: "",
            GIT_PROTOCOL_FROM_USER: "0",
            GIT_TERMINAL_PROMPT: "0",
            GCM_INTERACTIVE: "Never",
          },
        },
        (error, stdout) => {
          if (error === null) resolveResult({ code: 0, text: stdout });
          else if (typeof error.code === "number" && !error.killed)
            resolveResult({ code: error.code, text: "" });
          else reject(new GitInspectionError(args[0] ?? "unknown"));
        },
      );
    });
}
function validateRecord(record: AnalysisRecord): void {
  if (!idPattern.test(record.id) || !idPattern.test(record.category))
    throw new Error("Invalid analysis identifier");
  canonicalRemote(record.url);
  if (record.analyzedSha !== null && !shaPattern.test(record.analyzedSha))
    throw new Error("Analysis baseline requires a full SHA");
  if (record.reportSha256 !== null && !/^[a-f0-9]{64}$/u.test(record.reportSha256))
    throw new Error("Invalid report digest");
  if (!record.report.startsWith("spec/") || !record.report.endsWith(".md"))
    throw new Error("Invalid analysis report path");
  if (record.topics.some((topic) => !idPattern.test(topic)))
    throw new Error("Invalid topic identifier");
}
export async function migrateAnalysis(root: string, now: string): Promise<AnalysisState> {
  const contents = await boundedText(resolve(root, "spec/data/coverage.json"), limits.jsonBytes);
  const inventory = parseAnalysisJson(InventorySchema, contents);
  const records: AnalysisRecord[] = [];
  for (const row of inventory) {
    const report = `spec/${row.report}`;
    const body = await boundedText(await safeProjectPath(root, report), limits.reportBytes);
    const reviewDate =
      /(?:Review date:|Reviewed(?: on)?:)\s*\*{0,2}(\d{4}-\d{2}-\d{2})/iu.exec(body)?.[1] ?? null;
    const record: AnalysisRecord = {
      id: row.id,
      category: row.category,
      name: row.name,
      url: row.github,
      aliases: [],
      report,
      topics: [...row.topics],
      depth: row.depth ?? "screened",
      analyzedSha: row.revision,
      analyzedAt: reviewDate,
      analyzedCommitDate: row.commit_date ?? null,
      reportSha256: reportDigest(body),
      lifecycle: "active",
    };
    validateRecord(record);
    records.push(record);
  }
  if (new Set(records.map((row) => row.id)).size !== records.length)
    throw new Error("Duplicate baseline IDs");
  return {
    schemaVersion: 1,
    migratedAt: now,
    inventorySha256: digest(contents),
    records,
    events: [
      {
        at: now,
        id: "inventory",
        action: "migrated",
        previousSha: null,
        sha: null,
        reason:
          "Preserved coverage snapshot SHAs and exact report hashes; missing review dates remain unknown.",
      },
    ],
  };
}
export interface MatchResult {
  readonly repository: ObservedRepository | null;
  readonly problem: string | null;
}
export function matchRepository(
  record: AnalysisRecord,
  repositories: readonly ObservedRepository[],
  mappedId?: string,
): MatchResult {
  if (mappedId !== undefined) {
    const mapped = repositories.filter((row) => row.id === mappedId);
    return mapped.length === 1
      ? { repository: mapped[0] ?? null, problem: null }
      : { repository: null, problem: "Explicit rename mapping is absent or ambiguous" };
  }
  const identity = canonicalRemote(record.url);
  const candidates = repositories.filter((row) => canonicalRemote(row.url) === identity);
  const exact = candidates.filter((row) => row.id === record.id);
  if (exact.length === 1) return { repository: exact[0] ?? null, problem: null };
  if (candidates.length === 1) return { repository: candidates[0] ?? null, problem: null };
  return {
    repository: null,
    problem:
      candidates.length > 1
        ? "Ambiguous canonical remote identity"
        : "No matching canonical remote; missing or renamed source requires review",
  };
}
async function repositoryPath(
  root: string,
  cache: string,
  repository: ObservedRepository,
): Promise<string> {
  if (
    !idPattern.test(repository.id) ||
    (repository.head !== null && !shaPattern.test(repository.head))
  )
    throw new Error("Invalid observed repository identifier or full HEAD SHA");
  const target = await realpath(resolve(root, repository.path));
  const actualCache = await realpath(cache);
  const part = slash(relative(actualCache, target));
  if (part === ".." || part.startsWith("../") || isAbsolute(part))
    throw new Error("Observed repository escapes configured Git cache");
  return target;
}
async function readChangePacket(
  record: AnalysisRecord,
  repository: ObservedRepository | null,
  options: {
    now: string;
    observedAt: string | null;
    root: string;
    cache: string;
    git: GitReader;
    problem?: string;
    checkoutSha?: string;
  },
): Promise<ChangePacket> {
  const reportPath = await safeProjectPath(options.root, record.report);
  const reportHash = (await exists(reportPath))
    ? reportDigest(await boundedText(reportPath, limits.reportBytes))
    : null;
  const packet: ChangePacket = {
    id: record.id,
    generatedAt: options.now,
    observedAt: options.observedAt,
    source: record.url,
    report: record.report,
    analyzedSha: record.analyzedSha,
    analyzedAt: record.analyzedAt,
    analyzedCommitDate: record.analyzedCommitDate,
    observedSha: repository?.head ?? null,
    status: record.lifecycle === "archived" ? "archived" : "unavailable",
    shallow: repository?.shallow ?? null,
    dirty: repository?.dirty ?? null,
    reportModified: reportHash !== record.reportSha256,
    commits: [],
    files: [],
    commitsTruncated: false,
    filesTruncated: false,
    notes: [],
  };
  const notes: string[] = [];
  if (options.problem !== undefined) notes.push(options.problem);
  if (repository !== null)
    notes.push(
      `Git discovery: ${repository.status}; source lifecycle: ${repository.lifecycle}; upstream availability: ${repository.availability}.`,
    );
  if (repository === null || repository.head === null) return { ...packet, notes };
  const path = await repositoryPath(options.root, options.cache, repository);
  const current = await options.git(path, ["rev-parse", "HEAD"]);
  const expectedHead = options.checkoutSha ?? repository.head;
  if (current.code !== 0 || !shaPattern.test(expectedHead) || current.text.trim() !== expectedHead)
    return {
      ...packet,
      status: "observation-stale",
      notes: [...notes, "Checkout HEAD differs from discovery manifest; rerun discovery."],
    };
  if (expectedHead !== repository.head) {
    const descendant = await options.git(path, [
      "merge-base",
      "--is-ancestor",
      repository.head,
      expectedHead,
    ]);
    if (canonicalRemote(record.url) !== canonicalRemote(repository.url) || descendant.code !== 0)
      return {
        ...packet,
        status: "observation-stale",
        notes: [...notes, "Explicit checkout acknowledgment lacks same-source snapshot ancestry."],
      };
    notes.push(
      `Explicit review of discovery snapshot ${repository.head}; checkout ${expectedHead} is a verified descendant whose later changes remain unreviewed.`,
    );
  }
  if (repository.dirty)
    notes.push("Working-tree modifications are excluded from committed change evidence.");
  if (record.analyzedSha === null) return { ...packet, status: "unreviewed", notes };
  const available = await options.git(path, ["cat-file", "-e", `${record.analyzedSha}^{commit}`]);
  if (available.code !== 0)
    return {
      ...packet,
      status: repository.shallow ? "shallow-baseline-missing" : "baseline-missing",
      notes: [
        ...notes,
        "Analyzed commit is unavailable. Deepen/fetch history explicitly; baseline is preserved.",
      ],
    };
  if (record.analyzedSha === repository.head)
    return { ...packet, status: record.lifecycle === "archived" ? "archived" : "current", notes };
  const ancestor = await options.git(path, [
    "merge-base",
    "--is-ancestor",
    record.analyzedSha,
    repository.head,
  ]);
  if (ancestor.code === 1 && canonicalRemote(record.url) === canonicalRemote(repository.url)) {
    const [before, after] = await Promise.all([
      options.git(path, ["rev-parse", `${record.analyzedSha}^{tree}`]),
      options.git(path, ["rev-parse", `${repository.head}^{tree}`]),
    ]);
    const tree = before.text.trim();
    if (
      before.code === 0 &&
      after.code === 0 &&
      shaPattern.test(tree) &&
      tree === after.text.trim()
    )
      return {
        ...packet,
        status: record.lifecycle === "archived" ? "archived-changed" : "changed",
        notes: [
          ...notes,
          `History diverged, but the same canonical source has identical complete Git trees (${tree}). This proves committed-tree equivalence, not ancestry; explicit report review is still required.`,
        ],
      };
  }
  if (ancestor.code !== 0)
    return {
      ...packet,
      status: ancestor.code === 1 ? "history-diverged" : "evidence-unavailable",
      notes: [
        ...notes,
        ancestor.code === 1
          ? "Analyzed SHA is not an ancestor of observed HEAD; inspect rewritten or unrelated history."
          : "Git ancestry inspection failed; divergence was not established.",
      ],
    };

  const commits = await options.git(path, [
    "log",
    `--max-count=${limits.commits + 1}`,
    "--format=%H%x09%cI%x09%s",
    `${record.analyzedSha}..${repository.head}`,
    "--",
  ]);
  const changed = await options.git(path, [
    "diff",
    "--name-status",
    "-z",
    "--find-renames=50%",
    "-l1000",
    "--no-ext-diff",
    "--no-textconv",
    record.analyzedSha,
    repository.head,
    "--",
  ]);
  if (commits.code !== 0 || changed.code !== 0)
    return {
      ...packet,
      status: "evidence-unavailable",
      notes: [...notes, "Git log or diff failed; no partial result is treated as complete."],
    };
  const rows = commits.text.trim().split("\n").filter(Boolean);
  const commitRows = rows.slice(0, limits.commits).map((line) => {
    const [sha, date, ...subject] = line.split("\t");
    if (sha === undefined || !shaPattern.test(sha) || date === undefined)
      throw new Error("Invalid Git log output");
    return { sha, date, subject: subject.join(" ").slice(0, 300) };
  });
  const pieces = changed.text.split("\0");
  const files: { status: string; path: string; previousPath: string | null }[] = [];
  for (let index = 0; index < pieces.length - 1;) {
    const status = pieces[index++];
    const first = pieces[index++];
    if (status === undefined || first === undefined || !/^[ACDMRTUXB][0-9]*$/u.test(status))
      throw new Error("Invalid Git diff output");
    const renamed = status.startsWith("R") || status.startsWith("C");
    const path = renamed ? pieces[index++] : first;
    if (path === undefined) throw new Error("Truncated Git diff output");
    files.push({ status, path, previousPath: renamed ? first : null });
  }
  return {
    ...packet,
    status: record.lifecycle === "archived" ? "archived-changed" : "changed",
    notes: [
      ...notes,
      "Exhaustive file-rename detection is limited to 1,000 candidates; excess unmatched paths remain additions/deletions.",
    ],
    commits: commitRows,
    files: files.slice(0, limits.files),
    commitsTruncated: rows.length > limits.commits,
    filesTruncated: files.length > limits.files,
  };
}
export async function buildChangePacket(
  record: AnalysisRecord,
  repository: ObservedRepository | null,
  options: {
    now: string;
    observedAt: string | null;
    root: string;
    cache: string;
    git: GitReader;
    problem?: string;
    checkoutSha?: string;
  },
): Promise<ChangePacket> {
  try {
    return await readChangePacket(record, repository, options);
  } catch (error) {
    if (!(error instanceof GitInspectionError)) throw error;
    const report = await safeProjectPath(options.root, record.report);
    const hash = (await exists(report))
      ? reportDigest(await boundedText(report, limits.reportBytes))
      : null;
    return {
      id: record.id,
      generatedAt: options.now,
      observedAt: options.observedAt,
      source: record.url,
      report: record.report,
      analyzedSha: record.analyzedSha,
      analyzedAt: record.analyzedAt,
      analyzedCommitDate: record.analyzedCommitDate,
      observedSha: repository?.head ?? null,
      status: "inspection-failed",
      shallow: repository?.shallow ?? null,
      dirty: repository?.dirty ?? null,
      reportModified: hash !== record.reportSha256,
      commits: [],
      files: [],
      commitsTruncated: false,
      filesTruncated: false,
      notes: [
        `${record.id}: ${error.message}. No analysis baseline was advanced; retry this source with a narrower evidence scope.`,
      ],
    };
  }
}
const categoryTopics: Readonly<Record<string, readonly string[]>> = {
  "ai-agents": ["agents", "models", "channels"],
  "ai-agents-mem": ["memory", "import-generation", "evolution"],
  "ai-agents-proxy": ["models", "channels", "security"],
  "ai-agents-sandbox": ["agents", "security"],
  "ai-agents-skills": ["skills", "agents", "evolution"],
  "ai-agents-swarm": ["agents", "decisions", "evolution"],
  "ai-agents-tokens": ["models", "decisions", "evaluation"],
  "ai-eval": ["evaluation", "evolution", "decisions"],
  "ai-gen": ["generation", "import-generation", "models"],
  "ai-info": ["decisions", "evolution", "memory"],
  "ai-media": ["generation", "import-generation", "models"],
  "ai-model-edit": ["models", "evolution"],
  "ai-model-run": ["models", "agents"],
  "ai-operate": ["channels", "agents"],
  "ai-prompts": ["skills", "evolution", "decisions"],
  "ai-query": ["memory", "import-generation"],
  "ai-security": ["security", "agents", "skills"],
  "ai-skills": ["skills", "evolution", "agents"],
  "ai-spec": ["agents", "skills", "evolution"],
};
function sourceLink(record: AnalysisRecord): string {
  return `[${escapeCell(record.name)}](${record.url})`;
}
function topicLinks(record: AnalysisRecord, prefix: string): string {
  return (
    record.topics.map((topic) => `[${topic}](${prefix}${topic}.md)`).join(", ") || "unclassified"
  );
}
function relativeReport(record: AnalysisRecord, from: string): string {
  return slash(relative(from, record.report));
}
function renderPacket(record: AnalysisRecord, packet: ChangePacket): string {
  const compare =
    record.analyzedSha && packet.observedSha
      ? `[Source comparison](${record.url}/compare/${record.analyzedSha}...${packet.observedSha})`
      : "No comparable review baseline";
  return (
    `# ${record.name}: change evidence\n\nSource: ${sourceLink(record)} · [Analysis](${relativeReport(record, "spec/analyses/repos")}) · ${topicLinks(record, "../../")}\n\n` +
    `Generated: ${packet.generatedAt}. Status: **${packet.status}**. Reviewed SHA: \`${packet.analyzedSha ?? "none"}\`; commit date: ${packet.analyzedCommitDate ?? "unknown"}; review date: ${packet.analyzedAt ?? "unknown"}; observed SHA: \`${packet.observedSha ?? "unavailable"}\`.\n\n` +
    `This generated packet is a bounded change locator, not a source review or a quality measurement. ${compare}. Working-tree changes: ${packet.dirty ?? "unknown"}; shallow history: ${packet.shallow ?? "unknown"}; report changed since recorded review: ${packet.reportModified}.\n\n` +
    packet.notes.map((note) => `- ${note}\n`).join("") +
    `\n## Recent commits${packet.commitsTruncated ? " (truncated)" : ""}\n\n` +
    (packet.commits
      .map(
        (commit) =>
          `- [${commit.sha.slice(0, 12)}](${record.url}/commit/${commit.sha}) ${commit.date}: ${escapeCell(commit.subject)}\n`,
      )
      .join("") || "No commit evidence available or no changes.\n") +
    `\n## Changed paths${packet.filesTruncated ? " (truncated)" : ""}\n\n` +
    (packet.files
      .map(
        (file) =>
          `- ${file.status}: \`${escapeCell(file.path).replaceAll("`", "'")}\`${file.previousPath === null ? "" : ` (from \`${escapeCell(file.previousPath).replaceAll("`", "'")}\`)`}\n`,
      )
      .join("") || "No path evidence available or no changes.\n")
  );
}
function validateReviews(reviews: readonly ReviewRequest[]): void {
  if (reviews.length === 0 || reviews.length > limits.reviews)
    throw new Error(`Review batch must contain 1-${limits.reviews} entries`);
  const ids = new Set<string>();
  for (const review of reviews) {
    if (!idPattern.test(review.id) || !shaPattern.test(review.sha))
      throw new Error("Review requires a valid analysis ID and full SHA");
    if (review.checkoutSha !== undefined && !shaPattern.test(review.checkoutSha))
      throw new Error("Checkout acknowledgment requires a full SHA");
    if (review.reconcileFrom !== undefined && !shaPattern.test(review.reconcileFrom))
      throw new Error("Divergent-history acknowledgment requires a full baseline SHA");
    if (review.reason.trim().length === 0 || review.reason.length > 2_000)
      throw new Error("Review reason must contain 1-2000 characters");
    if (ids.has(review.id)) throw new Error("Duplicate review ID");
    ids.add(review.id);
  }
}
export async function readReviewRequests(
  root: string,
  path: string,
): Promise<readonly ReviewRequest[]> {
  const reviews = parseAnalysisJson(
    ReviewRequestsSchema,
    await boundedText(await safeProjectPath(root, path), limits.reviewBytes),
  );
  validateReviews(reviews);
  return reviews;
}
export async function verifyReviewPublication(
  root: string,
  cache: string,
  record: AnalysisRecord,
  repository: ObservedRepository,
  expectedHead: string,
  git: GitReader,
): Promise<string> {
  const body = await boundedText(await safeProjectPath(root, record.report), limits.reportBytes);
  if (record.reportSha256 === null || reportDigest(body) !== record.reportSha256)
    throw new Error(`Reviewed report changed before publication (${record.id})`);
  const current = await git(await repositoryPath(root, cache, repository), ["rev-parse", "HEAD"]);
  if (!shaPattern.test(expectedHead) || current.code !== 0 || current.text.trim() !== expectedHead)
    throw new Error(`Reviewed checkout changed before publication (${record.id})`);
  return body;
}
export interface SyncOptions {
  readonly root: string;
  readonly cache: string;
  readonly gitStatePath: string;
  readonly signal: AbortSignal;
  readonly now?: string;
  readonly write?: boolean;
  readonly rename?: ReadonlyMap<string, string>;
  readonly review?: ReviewRequest;
  readonly reviews?: readonly ReviewRequest[];
  readonly archive?: { readonly id: string; readonly reason: string };
}
export async function syncAnalyses(
  options: SyncOptions,
): Promise<{ records: number; statuses: Readonly<Record<string, number>> }> {
  if (!options.write) return syncUnlocked(options);
  const directory = await safeProjectPath(options.root, "spec/analyses");
  await mkdir(directory, { recursive: true });
  const lock = resolve(directory, ".sync.lock");
  await writeFile(lock, `${process.pid}\n`, { flag: "wx" });
  try {
    return await syncUnlocked(options);
  } finally {
    await rm(lock, { force: true });
  }
}
async function syncUnlocked(
  options: SyncOptions,
): Promise<{ records: number; statuses: Readonly<Record<string, number>> }> {
  if (options.rename !== undefined && new Set(options.rename.values()).size !== options.rename.size)
    throw new Error("Rename targets must be one-to-one");
  if (options.review !== undefined && options.reviews !== undefined)
    throw new Error("Singular and batch reviews are mutually exclusive");
  const requestedReviews =
    options.reviews ?? (options.review === undefined ? undefined : [options.review]);
  if (requestedReviews !== undefined) {
    if (!options.write || options.archive !== undefined)
      throw new Error("Review requires write mode and cannot be combined with archive");
    validateReviews(requestedReviews);
  }
  const reviews = new Map((requestedReviews ?? []).map((review) => [review.id, review]));
  const now = options.now ?? new Date().toISOString();
  const directory = await safeProjectPath(options.root, "spec/analyses");
  const statePath = resolve(directory, "state.json");
  const state = (await exists(statePath))
    ? await jsonFile(statePath, AnalysisStateSchema)
    : await migrateAnalysis(options.root, now);
  if (new Set(state.records.map((row) => row.id)).size !== state.records.length)
    throw new Error("Duplicate analysis IDs");
  state.records.forEach(validateRecord);
  for (const id of reviews.keys())
    if (!state.records.some((record) => record.id === id)) throw new Error("Unknown analysis ID");
  const discovery = (await exists(options.gitStatePath))
    ? await jsonFile(options.gitStatePath, GitStateSchema)
    : null;
  const observed = discovery?.repositories ?? [];
  if (new Set(observed.map((row) => row.id)).size !== observed.length)
    throw new Error("Duplicate observed repository IDs");
  const git = gitReader(options.signal);
  const records: AnalysisRecord[] = [];
  const packets: ChangePacket[] = [];
  const reviewHistory: ChangePacket[] = [];
  const publicationChecks = new Map<
    string,
    { repository: ObservedRepository; expectedHead: string }
  >();
  const events: ReviewEvent[] = [...state.events];
  const metadataRepairs = new Map<string, { previousDigest: string; previous: string }>();
  const used = new Set<string>();
  for (const baseline of state.records) {
    options.signal.throwIfAborted();
    let record = baseline;
    if (record.reportSha256 !== null) {
      const path = await safeProjectPath(options.root, record.report);
      if (await exists(path)) {
        const body = await boundedText(path, limits.reportBytes);
        const normalized = reportDigest(body);
        let previous = legacyReportContent(body);
        if (normalized !== record.reportSha256 && digest(previous) !== record.reportSha256) {
          const historyPath = await safeProjectPath(
            options.root,
            `spec/analyses/history/${record.id}/${record.reportSha256}.txt`,
          );
          if (await exists(historyPath)) {
            previous = await boundedText(historyPath, limits.reportBytes);
            if (digest(previous) !== record.reportSha256)
              throw new Error("Preserved report history failed digest verification");
          }
        }
        if (
          normalized !== record.reportSha256 &&
          digest(previous) === record.reportSha256 &&
          reportDigest(previous) === normalized
        ) {
          const previousDigest = record.reportSha256;
          metadataRepairs.set(record.id, { previousDigest, previous });
          record = { ...record, reportSha256: normalized };
          events.push({
            at: now,
            id: record.id,
            action: "metadata-normalized",
            previousSha: record.analyzedSha,
            sha: record.analyzedSha,
            reason: `Excluded CRLF managed metadata from the report digest (${previousDigest} → ${normalized}); preserved source SHA, commit/review dates and the original hash-addressed snapshot. No source review was inferred.`,
          });
        }
      }
    }
    const review = reviews.get(record.id);
    const mapping = options.rename?.get(record.id);
    let match = matchRepository(record, observed, mapping);
    if (
      mapping === undefined &&
      match.repository !== null &&
      match.repository.id !== record.id &&
      state.records.filter((row) => canonicalRemote(row.url) === canonicalRemote(record.url))
        .length > 1
    )
      match = {
        repository: null,
        problem: "Ambiguous prior canonical identity; explicit mapping required",
      };
    const repository = match.repository;
    let packet = await buildChangePacket(record, repository, {
      now,
      observedAt: discovery?.generatedAt ?? null,
      root: options.root,
      cache: options.cache,
      git,
      ...(match.problem === null ? {} : { problem: match.problem }),
      ...(review?.checkoutSha === undefined ? {} : { checkoutSha: review.checkoutSha }),
    });
    if (mapping !== undefined) {
      if (
        repository === null ||
        !["current", "changed", "archived", "archived-changed"].includes(packet.status)
      )
        throw new Error(
          `Rename ${record.id} cannot establish full baseline ancestry or same-source tree equivalence`,
        );
      if (
        state.records.some(
          (other) =>
            other.id !== record.id &&
            canonicalRemote(other.url) === canonicalRemote(repository.url),
        )
      )
        throw new Error(`Rename ${record.id} is ambiguous with an existing canonical identity`);
    }
    if (repository !== null) {
      used.add(repository.id);
      if (
        repository.id !== record.id ||
        canonicalRemote(repository.url) !== canonicalRemote(record.url)
      ) {
        const knownAlias =
          record.aliases.includes(repository.id) &&
          canonicalRemote(repository.url) === canonicalRemote(record.url);
        if (
          !knownAlias &&
          !["current", "changed", "archived", "archived-changed"].includes(packet.status)
        )
          packet = {
            ...packet,
            status: "rename-unverified",
            notes: [
              ...packet.notes,
              "Rename requires available analyzed SHA and ancestry or same-source identical-tree proof.",
            ],
          };
        else if (!knownAlias) {
          record = {
            ...record,
            url: repository.url,
            name: repository.id.replace(`${repository.category}--`, ""),
            aliases: [...new Set([...record.aliases, record.url, repository.id])],
          };
          events.push({
            at: now,
            id: record.id,
            action: "renamed",
            previousSha: record.analyzedSha,
            sha: record.analyzedSha,
            reason:
              "Source identity and baseline continuity verified; retained change evidence distinguishes ancestry from same-source identical trees. Stable report ID retained.",
          });
          packet = { ...packet, source: record.url };
        }
      }
    }
    if (review !== undefined) {
      const reconcile = review.reconcileFrom !== undefined;
      if (
        reconcile &&
        (repository === null ||
          packet.status !== "history-diverged" ||
          review.reconcileFrom !== record.analyzedSha ||
          canonicalRemote(record.url) !== canonicalRemote(repository.url))
      )
        throw new Error(
          "Divergent-history acknowledgment requires the exact preserved baseline and same canonical source",
        );
      if (
        repository === null ||
        !shaPattern.test(review.sha) ||
        review.sha !== repository.head ||
        (!reconcile && !["current", "changed", "unreviewed"].includes(packet.status))
      )
        throw new Error(
          `Review promotion requires an available full observed HEAD with compatible ancestry (${record.id}: ${packet.status})`,
        );
      const body = await boundedText(
        await safeProjectPath(options.root, record.report),
        limits.reportBytes,
      );
      if (!body.includes(review.sha) || !body.includes(record.url))
        throw new Error("Updated report must cite the reviewed SHA and source URL");
      if (record.analyzedSha !== review.sha && reportDigest(body) === record.reportSha256)
        throw new Error("Changed source review requires an updated report");
      let reason = review.reason;
      if (review.reconcileFrom !== undefined) {
        if (!body.includes(review.reconcileFrom))
          throw new Error("Reconciled report must preserve the prior analyzed SHA");
        const path = await repositoryPath(options.root, options.cache, repository);
        const [before, after] = await Promise.all([
          git(path, ["rev-parse", `${review.reconcileFrom}^{tree}`]),
          git(path, ["rev-parse", `${review.sha}^{tree}`]),
        ]);
        const oldTree = before.text.trim();
        const newTree = after.text.trim();
        if (
          before.code !== 0 ||
          after.code !== 0 ||
          !shaPattern.test(oldTree) ||
          !shaPattern.test(newTree) ||
          oldTree === newTree
        )
          throw new Error(
            "Divergent-history reconciliation requires two available different complete trees",
          );
        const evidence = `Explicit same-source history reconciliation from ${review.reconcileFrom} (tree ${oldTree}) to ${review.sha} (tree ${newTree}); ancestry is not established. Original baseline and review scope remain in history.`;
        packet = { ...packet, notes: [...packet.notes, evidence] };
        reason = `${evidence} ${reason}`;
      }
      events.push({
        at: now,
        id: record.id,
        action: "reviewed",
        previousSha: record.analyzedSha,
        sha: review.sha,
        reason:
          review.checkoutSha === undefined || review.checkoutSha === review.sha
            ? reason
            : `${reason} Reviewed discovery snapshot only; acknowledged descendant checkout ${review.checkoutSha} remains pending.`,
      });
      const commit = await git(await repositoryPath(options.root, options.cache, repository), [
        "show",
        "-s",
        "--format=%cI",
        review.sha,
        "--",
      ]);
      if (commit.code !== 0 || !Number.isFinite(Date.parse(commit.text.trim())))
        throw new Error("Reviewed commit date is unavailable");
      record = {
        ...record,
        depth: record.depth === "unreviewed" ? "reviewed" : record.depth,
        analyzedSha: review.sha,
        analyzedAt: now,
        analyzedCommitDate: commit.text.trim(),
        reportSha256: reportDigest(body),
      };
      publicationChecks.set(record.id, {
        repository,
        expectedHead: review.checkoutSha ?? review.sha,
      });
      reviewHistory.push(packet);

      packet = await buildChangePacket(record, repository, {
        now,
        observedAt: discovery?.generatedAt ?? null,
        root: options.root,
        cache: options.cache,
        git,
      });
      if (review.checkoutSha !== undefined) {
        const current = await git(await repositoryPath(options.root, options.cache, repository), [
          "rev-parse",
          "HEAD",
        ]);
        if (current.code !== 0 || current.text.trim() !== review.checkoutSha)
          throw new Error(
            "Checkout changed while recording the pinned review; refresh its acknowledgment",
          );
        if (review.checkoutSha !== review.sha)
          packet = {
            ...packet,
            notes: [
              ...packet.notes,
              `Reviewed snapshot ${review.sha}; newer checkout ${review.checkoutSha} still requires discovery and review.`,
            ],
          };
      }
    }
    const acknowledgedSnapshot =
      review?.checkoutSha !== undefined &&
      review.checkoutSha !== review.sha &&
      packet.status === "observation-stale";
    if (
      review !== undefined &&
      ((!acknowledgedSnapshot && packet.status !== "current") || packet.reportModified)
    )
      throw new Error(
        "Reviewed source or report changed while preparing the review; retry with fresh evidence",
      );
    if (options.archive?.id === record.id) {
      record = { ...record, lifecycle: "archived" };
      packet = { ...packet, status: "archived" };
      events.push({
        at: now,
        id: record.id,
        action: "archived",
        previousSha: record.analyzedSha,
        sha: record.analyzedSha,
        reason: options.archive.reason,
      });
    }
    records.push(record);
    packets.push(packet);
  }
  for (const action of [options.archive])
    if (action !== undefined && !records.some((row) => row.id === action.id))
      throw new Error("Unknown analysis ID");
  for (const oldId of options.rename?.keys() ?? [])
    if (!records.some((row) => row.id === oldId)) throw new Error("Unknown rename source ID");
  for (const repository of observed) {
    if (used.has(repository.id) || records.some((row) => row.id === repository.id)) continue;
    const record: AnalysisRecord = {
      id: repository.id,
      category: repository.category,
      name: repository.id.replace(`${repository.category}--`, ""),
      url: repository.url,
      aliases: [],
      report: `spec/analyses/unreviewed/${repository.id}.md`,
      topics: [...(categoryTopics[repository.category] ?? [])],
      depth: "unreviewed",
      analyzedSha: null,
      analyzedAt: null,
      analyzedCommitDate: null,
      reportSha256: null,
      lifecycle: "active",
    };
    validateRecord(record);
    records.push(record);
    packets.push(
      await buildChangePacket(record, repository, {
        now,
        observedAt: discovery?.generatedAt ?? null,
        root: options.root,
        cache: options.cache,
        git,
      }),
    );
    events.push({
      at: now,
      id: record.id,
      action: "added",
      previousSha: null,
      sha: null,
      reason: "Discovered source; no analysis baseline assigned.",
    });
  }
  const statuses: Record<string, number> = {};
  for (const packet of packets) statuses[packet.status] = (statuses[packet.status] ?? 0) + 1;
  if (options.write) {
    const next: AnalysisState = { ...state, records, events };
    for (const record of records) {
      const check = publicationChecks.get(record.id);
      if (check !== undefined)
        await verifyReviewPublication(
          options.root,
          options.cache,
          record,
          check.repository,
          check.expectedHead,
          git,
        );
      const repair = metadataRepairs.get(record.id);
      if (repair !== undefined)
        metadataRepairHistory(
          await boundedText(await safeProjectPath(options.root, record.report), limits.reportBytes),
          repair.previous,
          repair.previousDigest,
          record.reportSha256,
        );
    }
    for (const record of records) {
      const repair = metadataRepairs.get(record.id);
      if (repair !== undefined) {
        const body = await boundedText(
          await safeProjectPath(options.root, record.report),
          limits.reportBytes,
        );
        await immutableWrite(
          options.root,
          resolve(directory, `history/${record.id}/${repair.previousDigest}.txt`),
          metadataRepairHistory(body, repair.previous, repair.previousDigest, record.reportSha256),
        );
      }
    }
    for (const packet of reviewHistory)
      await immutableWrite(
        options.root,
        resolve(
          directory,
          `history/${packet.id}/${packet.analyzedSha ?? "none"}--${packet.observedSha ?? "none"}.json`,
        ),
        JSON.stringify(packet, null, 2) + "\n",
      );
    const lines = [
      "# Repository analyses",
      "",
      "One list item per preserved report identity. Fetching never advances the analyzed SHA. Unknown dates were not invented. [Workflow](README.md) · [Pending work](pending.md) · [Changelog](CHANGELOG.md).",
      "",
    ];
    for (const record of records) {
      const packet = packets.find((row) => row.id === record.id);
      if (packet === undefined) throw new Error("Missing change packet");
      lines.push(
        `- ${sourceLink(record)} · [report](${relativeReport(record, "spec/analyses")}) · [changes](repos/${record.id}.md) · ${topicLinks(record, "../")} · analyzed ${record.analyzedSha === null ? "none" : `[${record.analyzedSha.slice(0, 12)}](${record.url}/commit/${record.analyzedSha})`} (commit ${record.analyzedCommitDate ?? "unknown"}; review ${record.analyzedAt?.slice(0, 10) ?? "unknown"}; ${record.depth}) · observed ${packet.observedSha?.slice(0, 12) ?? "unavailable"}: ${packet.status}${packet.reportModified ? "; report modified" : ""}.`,
      );
      await atomicWrite(
        options.root,
        resolve(directory, `repos/${record.id}.json`),
        JSON.stringify({ metadata: record, changes: packet }, null, 2) + "\n",
      );
      await atomicWrite(
        options.root,
        resolve(directory, `repos/${record.id}.md`),
        renderPacket(record, packet),
      );
      if (record.depth === "unreviewed" && !(await exists(contained(options.root, record.report))))
        await atomicWrite(
          options.root,
          contained(options.root, record.report),
          `# ${record.name}\n\nSource: ${sourceLink(record)} · ${topicLinks(record, "../../")}.\n\nDepth: **unreviewed**. Discovered ${now}; no source code or capabilities reviewed. [Change evidence](../repos/${record.id}.md).\n`,
        );
      const reportPath = await safeProjectPath(options.root, record.report);
      if (await exists(reportPath)) {
        const check = publicationChecks.get(record.id);
        const body =
          check === undefined
            ? await boundedText(reportPath, limits.reportBytes)
            : await verifyReviewPublication(
                options.root,
                options.cache,
                record,
                check.repository,
                check.expectedHead,
                git,
              );
        const repair = metadataRepairs.get(record.id);
        if (repair !== undefined)
          metadataRepairHistory(body, repair.previous, repair.previousDigest, record.reportSha256);
        if (record.reportSha256 !== null && reportDigest(body) === record.reportSha256)
          await immutableWrite(
            options.root,
            resolve(directory, `history/${record.id}/${record.reportSha256}.txt`),
            reportContent(body),
          );
        const metadata = `\n<!-- teamagent-analysis:start -->\nAnalysis metadata: source [${record.name}](${record.url}); analyzed commit \`${record.analyzedSha ?? "none"}\`; commit date ${record.analyzedCommitDate ?? "unknown"}; review date ${record.analyzedAt ?? "unknown"}; depth ${record.depth}. [Maintenance record](${slash(relative(dirname(record.report), `spec/analyses/repos/${record.id}.md`))}).\n<!-- teamagent-analysis:end -->\n`;
        if (body !== reportContent(body) + metadata)
          await atomicWrite(options.root, reportPath, reportContent(body) + metadata);
      }
      if (packet.status === "changed")
        await immutableWrite(
          options.root,
          resolve(
            directory,
            `history/${record.id}/${packet.analyzedSha}--${packet.observedSha}.json`,
          ),
          JSON.stringify(packet, null, 2) + "\n",
        );
    }
    await atomicWrite(options.root, resolve(directory, "repositories.md"), lines.join("\n") + "\n");
    const pending = packets.filter(
      (packet) => !["current", "archived"].includes(packet.status) || packet.reportModified,
    );
    await atomicWrite(
      options.root,
      resolve(directory, "pending.md"),
      `# Pending analysis work\n\nGenerated ${now}. Discovery complete: ${discovery?.discoveryComplete ?? false}. No missing repository was automatically archived.\n\n` +
        pending
          .map(
            (packet) =>
              `- [${packet.id}](repos/${packet.id}.md): ${packet.status}${packet.reportModified ? "; report changed since recorded review" : ""}.\n`,
          )
          .join(""),
    );
    await atomicWrite(
      options.root,
      resolve(directory, "changes.json"),
      JSON.stringify({ schemaVersion: 1, generatedAt: now, statuses, packets }, null, 2) + "\n",
    );
    await atomicWrite(
      options.root,
      resolve(directory, "CHANGELOG.md"),
      "# Analysis changelog\n\nThe review ledger records intentional baseline and lifecycle changes. Fetch-only evidence is in [pending work](pending.md).\n\n" +
        events
          .toReversed()
          .map(
            (event) =>
              `- ${event.at} · ${event.action} · ${event.id === "inventory" ? "inventory" : `[${event.id}](repos/${event.id}.md)`}: ${escapeCell(event.reason)}${event.sha === null ? "" : ` (\`${event.previousSha ?? "none"}\` → \`${event.sha}\`)`}\n`,
          )
          .join(""),
    );
    for (const topic of new Set(records.flatMap((record) => record.topics))) {
      const topicPath = await safeProjectPath(options.root, `spec/${topic}.md`);
      if (!(await exists(topicPath))) continue;
      const body = await boundedText(topicPath, limits.reportBytes);
      const original = body.replace(
        /\n<!-- analysis-additions:start -->\n[\s\S]*?<!-- analysis-additions:end -->\n?/gu,
        "",
      );
      const additions = records.filter(
        (record) => record.depth === "unreviewed" && record.topics.includes(topic),
      );
      const section =
        additions.length === 0
          ? ""
          : `\n<!-- analysis-additions:start -->\n## Newly catalogued sources\n\nThese category-based links are discovery records, not reviewed capability or adoption claims. See [analysis maintenance](analyses/README.md).\n\n` +
            additions
              .map(
                (record) =>
                  `- [${record.name}](${record.report.slice(5)}) ([source](${record.url})).\n`,
              )
              .join("") +
            "<!-- analysis-additions:end -->\n";
      if (body !== original + section)
        await atomicWrite(options.root, topicPath, original + section);
    }
    await atomicWrite(options.root, statePath, JSON.stringify(next, null, 2) + "\n");
  }
  return { records: records.length, statuses };
}
if (import.meta.main) {
  const log = createConsola({ stdout: process.stderr, stderr: process.stderr }).withTag(
    "analysis-sync",
  );
  const args = cli({
    name: "analysis-sync",
    strictFlags: true,
    flags: {
      version: { type: Boolean, alias: "V" },
      root: { type: String, default: resolve(import.meta.dir, "../..") },
      write: Boolean,
      rename: [String],
      review: String,
      reviews: {
        type: String,
        description: "Project-relative JSON array of up to 100 {id, sha, reason} reviews",
      },
      sha: String,
      checkoutSha: {
        type: String,
        description:
          "Exact newer checkout SHA acknowledging an older discovery-snapshot review; later changes stay pending",
      },
      reconcileFrom: {
        type: String,
        description:
          "Exact prior analyzed SHA explicitly acknowledging reviewed divergent history of the same source",
      },
      reason: String,
      archive: String,
    },
    help: {
      description: "Preserve analysis baselines and prepare bounded Git change evidence",
      version,
    },
  });
  if (args.flags.version) process.stdout.write(`${version}\n`);
  else {
    try {
      if (args._.length > 0 || args._["--"].length > 0)
        throw new Error("Unexpected positional arguments");
      if (
        args.flags.reviews &&
        (args.flags.review ||
          args.flags.archive ||
          args.flags.sha ||
          args.flags.reason ||
          args.flags.checkoutSha ||
          args.flags.reconcileFrom)
      )
        throw new Error("--reviews cannot be mixed with singular review/archive flags");
      if (args.flags.reviews && !args.flags.write) throw new Error("--reviews requires --write");
      if (args.flags.review && args.flags.archive)
        throw new Error("Review and archive actions are mutually exclusive");
      if ((args.flags.review || args.flags.archive) && (!args.flags.reason || !args.flags.write))
        throw new Error("Review/archive requires --write and --reason");
      if (args.flags.review && !args.flags.sha) throw new Error("Review requires --sha");
      if (args.flags.sha && !args.flags.review) throw new Error("--sha requires --review");
      if (args.flags.checkoutSha && !args.flags.review)
        throw new Error("--checkout-sha requires --review");
      if (args.flags.reconcileFrom && !args.flags.review)
        throw new Error("--reconcile-from requires --review");
      const mappings = new Map<string, string>();
      for (const mapping of args.flags.rename) {
        const [from, to, extra] = mapping.split("=");
        if (!from || !to || extra !== undefined || mappings.has(from))
          throw new Error("Rename must be unique old-id=new-id");
        mappings.set(from, to);
      }
      const settings = await loadResearchSettings(args.flags.root);
      const reviews =
        args.flags.reviews === undefined
          ? undefined
          : await readReviewRequests(settings.root, args.flags.reviews);
      const result = await withHostInterruption((signal) =>
        syncAnalyses({
          root: settings.root,
          cache: settings.gitCache,
          gitStatePath: resolve(settings.root, ".cache/research/git-state.json"),
          signal,
          write: args.flags.write ?? false,
          rename: mappings,
          ...(reviews === undefined ? {} : { reviews }),
          ...(args.flags.review && args.flags.sha && args.flags.reason
            ? {
                review: {
                  id: args.flags.review,
                  sha: args.flags.sha,
                  reason: args.flags.reason,
                  ...(args.flags.checkoutSha === undefined
                    ? {}
                    : { checkoutSha: args.flags.checkoutSha }),
                  ...(args.flags.reconcileFrom === undefined
                    ? {}
                    : { reconcileFrom: args.flags.reconcileFrom }),
                },
              }
            : {}),
          ...(args.flags.archive && args.flags.reason
            ? { archive: { id: args.flags.archive, reason: args.flags.reason } }
            : {}),
        }),
      );
      process.stdout.write(`${JSON.stringify(result)}\n`);
    } catch (error) {
      log.error(analysisErrorMessage(error));
      process.exitCode = 1;
    }
  }
}
