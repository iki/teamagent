import { expect, test } from "bun:test";
import { rejects } from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { mkdtemp, mkdir, readFile, rename, rm, symlink, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import {
  GitInspectionError,
  analysisErrorMessage,
  buildChangePacket,
  canonicalRemote,
  gitReader,
  matchRepository,
  migrateAnalysis,
  readReviewRequests,
  replaceEvidenceFile,
  syncAnalyses,
} from "../app/research/analysis-sync.ts";
import {
  AnalysisStateSchema,
  parseAnalysisJson,
  type AnalysisRecord,
  type ObservedRepository,
} from "../app/research/analysis-contracts.ts";

const timestamp = "2026-10-24T10:00:00.000Z";
const source = "https://github.com/example/original";
function git(path: string, args: readonly string[]): string {
  return execFileSync(
    "git",
    [
      "-c",
      `safe.directory=${path.replaceAll("\\", "/")}`,
      "-c",
      "user.name=Fixture",
      "-c",
      "user.email=fixture@example.invalid",
      "-C",
      path,
      ...args,
    ],
    { encoding: "utf8", windowsHide: true },
  ).trim();
}
async function fixture(): Promise<{
  root: string;
  repo: string;
  first: string;
  second: string;
  observed: ObservedRepository;
}> {
  const root = await mkdtemp(join(tmpdir(), "teamagent-analysis-"));
  const repo = join(root, "cache", "repository");
  await mkdir(repo, { recursive: true });
  git(repo, ["init", "--quiet"]);
  await writeFile(join(repo, "entry.ts"), "export const value = 1;\n");
  git(repo, ["add", "."]);
  git(repo, ["commit", "--quiet", "-m", "Initial fixture"]);
  const first = git(repo, ["rev-parse", "HEAD"]);
  await writeFile(join(repo, "entry.ts"), "export const value = 2;\n");
  git(repo, ["add", "."]);
  git(repo, ["commit", "--quiet", "-m", "Change fixture behavior"]);
  const second = git(repo, ["rev-parse", "HEAD"]);
  await mkdir(join(root, "spec/data"), { recursive: true });
  await mkdir(join(root, "spec/projects"), { recursive: true });
  await writeFile(
    join(root, "spec/projects/ai-agents--original.md"),
    `# Original\nSource: ${source}\nReviewed revision: ${first}. Review date: 2026-10-04.\n`,
  );
  await writeFile(
    join(root, "spec/data/coverage.json"),
    JSON.stringify([
      {
        id: "ai-agents--original",
        category: "ai-agents",
        name: "original",
        github: source,
        revision: first,
        report: "projects/ai-agents--original.md",
        depth: "source-reviewed",
        topics: ["agents"],
        commit_date: "2026-10-03T10:00:00Z",
      },
    ]),
  );
  const observed: ObservedRepository = {
    id: "ai-agents--original",
    category: "ai-agents",
    url: source,
    path: "cache/repository",
    head: second,
    shallow: false,
    dirty: false,
    status: "ready",
    lifecycle: "active",
    availability: "available",
  };
  await writeFile(
    join(root, "git-state.json"),
    JSON.stringify({
      schemaVersion: 1,
      generatedAt: timestamp,
      discoveryComplete: true,
      repositories: [observed],
    }),
  );
  return { root, repo, first, second, observed };
}
async function state(root: string) {
  return parseAnalysisJson(
    AnalysisStateSchema,
    await readFile(join(root, "spec/analyses/state.json"), "utf8"),
  );
}
const options = (root: string) => ({
  root,
  cache: join(root, "cache"),
  gitStatePath: join(root, "git-state.json"),
  now: timestamp,
  signal: new AbortController().signal,
  write: true,
});

test("remote normalization preserves known hosts and rejects credentials and path injection", () => {
  expect(canonicalRemote("git@github.com:Example/Original.git")).toBe(source);
  expect(canonicalRemote("https://GITHUB.com/Example/Original/")).toBe(source);
  expect(canonicalRemote("https://gitlab.com/Group/Repository")).toBe(
    "https://gitlab.com/group/repository",
  );
  expect(() => canonicalRemote("https://token@github.com/Example/Original")).toThrow();
  expect(() => canonicalRemote("https://github.com/Example/Original?token=private")).toThrow();
  expect(() => canonicalRemote("https://unknown.invalid/Example/Original")).toThrow();
});

test("migration and fetch preserve reviewed SHA/date/body and create bounded change evidence", async () => {
  const { root, first, second } = await fixture();
  try {
    const initial = await migrateAnalysis(root, timestamp);
    expect(initial.records[0]?.analyzedSha).toBe(first);
    expect(initial.records[0]?.analyzedAt).toBe("2026-10-04");
    const result = await syncAnalyses(options(root));
    expect(result.statuses.changed).toBe(1);
    const recorded = await state(root);
    expect(recorded.records[0]?.analyzedSha).toBe(first);
    const index = await readFile(join(root, "spec/analyses/repositories.md"), "utf8");
    expect(index).toContain(first.slice(0, 12));
    expect(index).toContain(second.slice(0, 12));
    expect(index.split("\n").filter((line) => line.startsWith("- ["))).toHaveLength(1);
    const packet = await readFile(join(root, "spec/analyses/repos/ai-agents--original.md"), "utf8");
    expect(packet).toContain("entry.ts");
    expect(packet).toContain("Change fixture behavior");
    await syncAnalyses(options(root));
    expect((await state(root)).events).toHaveLength(1);
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});

test("review promotion refuses unchanged reports and preserves previous review evidence", async () => {
  const { root, first, second } = await fixture();
  try {
    await syncAnalyses(options(root));
    await rejects(
      syncAnalyses({
        ...options(root),
        review: { id: "ai-agents--original", sha: second, reason: "Read changed implementation" },
      }),
      /Updated report/,
    );
    expect((await state(root)).records[0]?.analyzedSha).toBe(first);
    await writeFile(
      join(root, "spec/projects/ai-agents--original.md"),
      `# Original\nSource: ${source}\nReviewed ${second}; value now 2.\n`,
    );
    await syncAnalyses({
      ...options(root),
      review: { id: "ai-agents--original", sha: second, reason: "Read changed implementation" },
    });
    const updated = await state(root);
    expect(updated.records[0]?.analyzedSha).toBe(second);
    expect(updated.events.at(-1)?.previousSha).toBe(first);
    expect(
      await readFile(
        join(root, `spec/analyses/history/ai-agents--original/${first}--${second}.json`),
        "utf8",
      ),
    ).toContain(first);
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});

test("identity ambiguity is refused and a renamed checkout needs full analyzed ancestry", async () => {
  const { root, first, observed } = await fixture();
  try {
    const baseline = (await migrateAnalysis(root, timestamp)).records[0];
    if (baseline === undefined) throw new Error("Missing fixture baseline");
    const renamed = { ...observed, id: "ai-agents--renamed" };
    expect(matchRepository(baseline, [renamed]).repository?.id).toBe(renamed.id);
    expect(
      matchRepository(baseline, [renamed, { ...renamed, id: "ai-agents--duplicate" }]).problem,
    ).toContain("Ambiguous");
    expect(matchRepository(baseline, [observed, renamed]).repository?.id).toBe(observed.id);
    const changedRemote = { ...renamed, url: "https://github.com/example/renamed" };
    expect(matchRepository(baseline, [changedRemote]).repository).toBeNull();
    await writeFile(
      join(root, "git-state.json"),
      JSON.stringify({
        schemaVersion: 1,
        generatedAt: timestamp,
        discoveryComplete: true,
        repositories: [changedRemote],
      }),
    );
    await syncAnalyses({ ...options(root), rename: new Map([[baseline.id, renamed.id]]) });
    const updated = await state(root);
    expect(updated.records[0]?.id).toBe(baseline.id);
    expect(updated.records[0]?.analyzedSha).toBe(first);
    expect(updated.records[0]?.url).toBe(changedRemote.url);
    expect(updated.records[0]?.aliases).toContain(renamed.id);
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});

test("missing shallow baseline is explicit, never substituted with checkout HEAD", async () => {
  const { root, observed } = await fixture();
  try {
    const baseline = (await migrateAnalysis(root, timestamp)).records[0];
    if (baseline === undefined) throw new Error("Missing fixture baseline");
    const record: AnalysisRecord = { ...baseline, analyzedSha: "a".repeat(40) };
    const packet = await buildChangePacket(
      record,
      { ...observed, shallow: true },
      {
        now: timestamp,
        observedAt: timestamp,
        root,
        cache: join(root, "cache"),
        git: gitReader(new AbortController().signal),
      },
    );
    expect(packet.status).toBe("shallow-baseline-missing");
    expect(packet.analyzedSha).toBe(record.analyzedSha);
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});

test("missing discovery does not archive sources and lock refuses concurrent writer", async () => {
  const { root } = await fixture();
  try {
    await rm(join(root, "git-state.json"));
    await syncAnalyses(options(root));
    expect((await state(root)).records[0]?.lifecycle).toBe("active");
    await writeFile(join(root, "spec/analyses/.sync.lock"), "fixture owner\n");
    await rejects(syncAnalyses(options(root)));
    expect(await readFile(join(root, "spec/analyses/.sync.lock"), "utf8")).toBe("fixture owner\n");
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});

test("path escape and unrelated ancestry cannot become renamed analysis", async () => {
  const { root, observed } = await fixture();
  try {
    const baseline = (await migrateAnalysis(root, timestamp)).records[0];
    if (baseline === undefined) throw new Error("Missing fixture baseline");
    await rejects(
      buildChangePacket(
        baseline,
        { ...observed, path: "spec" },
        {
          now: timestamp,
          observedAt: timestamp,
          root,
          cache: join(root, "cache"),
          git: gitReader(new AbortController().signal),
        },
      ),
      /escapes/,
    );
    const missing = { ...baseline, analyzedSha: "b".repeat(40) };
    await mkdir(join(root, "spec/analyses"), { recursive: true });
    const migration = await migrateAnalysis(root, timestamp);
    await writeFile(
      join(root, "spec/analyses/state.json"),
      JSON.stringify({ ...migration, records: [missing] }),
    );
    await rejects(
      syncAnalyses({ ...options(root), rename: new Map([[missing.id, observed.id]]) }),
      /ancestry/,
    );
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});

test("evidence output refuses a junction outside the project and duplicate rename targets", async () => {
  const { root } = await fixture();
  const external = await mkdtemp(join(tmpdir(), "teamagent-analysis-external-"));
  try {
    await symlink(
      external,
      join(root, "spec/analyses"),
      process.platform === "win32" ? "junction" : "dir",
    );
    await rejects(syncAnalyses(options(root)), /symlinks or junctions/);
    await rm(join(root, "spec/analyses"));
    await rejects(
      syncAnalyses({
        ...options(root),
        rename: new Map([
          ["first", "same"],
          ["second", "same"],
        ]),
      }),
      /one-to-one/,
    );
  } finally {
    await rm(root, { recursive: true, force: true });
    await rm(external, { recursive: true, force: true });
  }
});

test("bounded Git process failure produces a source-specific pending packet without baseline advancement", async () => {
  const { root, observed, first } = await fixture();
  try {
    const baseline = (await migrateAnalysis(root, timestamp)).records[0];
    if (baseline === undefined) throw new Error("Missing fixture baseline");
    const packet = await buildChangePacket(baseline, observed, {
      now: timestamp,
      observedAt: timestamp,
      root,
      cache: join(root, "cache"),
      git: async () => {
        throw new GitInspectionError("diff");
      },
    });
    expect(packet.status).toBe("inspection-failed");
    expect(packet.analyzedSha).toBe(first);
    expect(packet.notes[0]).toContain("ai-agents--original: Git diff");
    expect(packet.commits).toHaveLength(0);
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});

test("review batch validates bounded JSON, containment and duplicate identities", async () => {
  const { root, second } = await fixture();
  try {
    const request = { id: "ai-agents--original", sha: second, reason: "Read implementation" };
    await writeFile(join(root, "reviews.json"), JSON.stringify([request]));
    expect(await readReviewRequests(root, "reviews.json")).toEqual([request]);
    await rejects(readReviewRequests(root, "../reviews.json"), /escapes/);
    for (const invalid of [
      [],
      [request, request],
      [{ ...request, sha: "short" }],
      [{ ...request, reason: " " }],
      [{ ...request, reason: "x".repeat(2_001) }],
      [{ ...request, sha: 42 }],
      Array.from({ length: 101 }, (_, index) => ({ ...request, id: `entry-${index}` })),
    ]) {
      await writeFile(join(root, "reviews.json"), JSON.stringify(invalid));
      await rejects(readReviewRequests(root, "reviews.json"));
    }
    await writeFile(join(root, "reviews.json"), " ".repeat(256_001));
    await rejects(readReviewRequests(root, "reviews.json"), /byte limit/);
    await rejects(
      syncAnalyses({ ...options(root), review: request, reviews: [request] }),
      /mutually exclusive/,
    );
    await rejects(
      syncAnalyses({
        ...options(root),
        reviews: [request],
        archive: { id: request.id, reason: "archive" },
      }),
      /cannot be combined/,
    );
    await rejects(
      syncAnalyses({ ...options(root), reviews: [{ ...request, id: "unknown" }] }),
      /Unknown analysis ID/,
    );
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});

test("batch reviews preserve the ledger if any report is invalid, then promote two reports together", async () => {
  const { root, repo, first, second, observed } = await fixture();
  try {
    const secondId = "ai-agents--additional";
    const secondUrl = "https://github.com/example/additional";
    const secondRepo = join(root, "cache/additional");
    git(root, ["clone", "--quiet", "--no-hardlinks", repo, secondRepo]);
    await writeFile(
      join(root, "git-state.json"),
      JSON.stringify({
        schemaVersion: 1,
        generatedAt: timestamp,
        discoveryComplete: true,
        repositories: [
          observed,
          { ...observed, id: secondId, url: secondUrl, path: "cache/additional" },
        ],
      }),
    );
    await writeFile(join(root, "spec/agents.md"), "# Agents\n\nCurated evidence stays intact.\n");
    await syncAnalyses(options(root));
    expect(await readFile(join(root, "spec/agents.md"), "utf8")).toContain(
      "analysis-additions:start",
    );
    const before = await readFile(join(root, "spec/analyses/state.json"), "utf8");
    const firstRequest = {
      id: observed.id,
      sha: second,
      reason: "Reviewed the changed exported value",
    };
    const secondRequest = {
      id: secondId,
      sha: second,
      reason: "Reviewed the additional implementation",
    };
    await writeFile(
      join(root, "spec/projects/ai-agents--original.md"),
      `# Original\nSource ${source}. Reviewed ${second}: value is 2.\n`,
    );
    await rejects(
      syncAnalyses({ ...options(root), reviews: [firstRequest, secondRequest] }),
      /Updated report/,
    );
    expect(await readFile(join(root, "spec/analyses/state.json"), "utf8")).toBe(before);
    expect(
      (await state(root)).records.find((record) => record.id === observed.id)?.analyzedSha,
    ).toBe(first);
    await writeFile(
      join(root, `spec/analyses/unreviewed/${secondId}.md`),
      `# Additional\nSource ${secondUrl}. Reviewed ${second}: exported value is 2.\n`,
    );
    const result = await syncAnalyses({ ...options(root), reviews: [firstRequest, secondRequest] });
    expect(result.statuses.current).toBe(2);
    const updated = await state(root);
    expect(updated.records.map((record) => record.analyzedSha)).toEqual([second, second]);
    expect(updated.records.find((record) => record.id === secondId)?.depth).toBe("reviewed");
    expect(updated.events.filter((event) => event.action === "reviewed")).toHaveLength(2);
    const topic = await readFile(join(root, "spec/agents.md"), "utf8");
    expect(topic).toContain("Curated evidence stays intact.");
    expect(topic).not.toContain("analysis-additions:start");
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});

test("unchanged commit is validated without a redundant ancestry process", async () => {
  const { root, observed, first } = await fixture();
  try {
    const baseline = (await migrateAnalysis(root, timestamp)).records[0];
    if (baseline === undefined) throw new Error("Missing fixture baseline");
    const operations: string[] = [];
    const packet = await buildChangePacket(
      baseline,
      { ...observed, head: first },
      {
        now: timestamp,
        observedAt: timestamp,
        root,
        cache: join(root, "cache"),
        git: async (_path, args) => {
          const operation = args[0];
          if (operation === undefined) throw new Error("Missing Git command");
          operations.push(operation);
          return { code: 0, text: operation === "rev-parse" ? first : "" };
        },
      },
    );
    expect(packet.status).toBe("current");
    expect(operations).toEqual(["rev-parse", "cat-file"]);
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});
test("atomic evidence replacement retries bounded sharing errors and never deletes an existing target", async () => {
  const root = await mkdtemp(join(tmpdir(), "teamagent-analysis-atomic-"));
  try {
    const target = join(root, "report.md");
    const temporary = join(root, "report.tmp");
    await writeFile(target, "original");
    await writeFile(temporary, "updated");
    let attempts = 0;
    const waits: number[] = [];
    await replaceEvidenceFile(root, temporary, target, {
      rename: async (from, to) => {
        attempts++;
        if (attempts < 3) throw Object.assign(new Error("sharing failure"), { code: "EPERM" });
        await rename(from, to);
      },
      delay: async (milliseconds) => {
        waits.push(milliseconds);
      },
    });
    expect(attempts).toBe(3);
    expect(waits).toEqual([100, 200]);
    expect(await readFile(target, "utf8")).toBe("updated");
    await writeFile(temporary, "next update");
    attempts = 0;
    waits.length = 0;
    await rejects(
      replaceEvidenceFile(root, temporary, target, {
        rename: async () => {
          attempts++;
          throw Object.assign(new Error("persistent sharing failure"), { code: "EBUSY" });
        },
        delay: async (milliseconds) => {
          waits.push(milliseconds);
        },
      }),
      /report\.md \(EBUSY\)/,
    );
    expect(attempts).toBe(5);
    expect(waits).toEqual([100, 200, 300, 400]);
    expect(await readFile(target, "utf8")).toBe("updated");
    expect(await readFile(temporary, "utf8")).toBe("next update");
    attempts = 0;
    await rejects(
      replaceEvidenceFile(root, temporary, target, {
        rename: async () => {
          attempts++;
          throw Object.assign(new Error("invalid operation"), { code: "EINVAL" });
        },
        delay: async () => {
          throw new Error("Unexpected retry");
        },
      }),
      /EINVAL/,
    );
    expect(attempts).toBe(1);
    expect(
      analysisErrorMessage(
        Object.assign(new Error("EPERM C:\\private\\report.md"), { code: "EPERM" }),
      ),
    ).not.toContain("private");
    expect(analysisErrorMessage(new Error("Cannot read /private/report.md"))).not.toContain(
      "/private",
    );
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});
