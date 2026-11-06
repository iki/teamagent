import { Schema } from "effect";
import { GitObjectId } from "./git.ts";
import { runProcess } from "./process.ts";

const NumberId = Schema.Int.check(Schema.isGreaterThan(0), Schema.isLessThanOrEqualTo(2147483647));
export const PullRequestObservation = Schema.Struct({
  number: NumberId,
  repository: Schema.Literal("github.com/iki/teamagent"),
  headBranch: Schema.String,
  baseBranch: Schema.String,
  head: GitObjectId,
  base: GitObjectId,
  state: Schema.Literals(["OPEN", "CLOSED", "MERGED"]),
  isDraft: Schema.Boolean,
  approved: Schema.Boolean,
  checksPassed: Schema.Boolean,
  mergeable: Schema.Boolean,
});
export type PullRequestObservation = typeof PullRequestObservation.Type;
export type PullRequestHost = {
  inspect(root: string, number: number): Promise<unknown>;
  create(root: string, branch: string, title: string, body: string): Promise<number>;
};
export function validatePullRequest(
  input: unknown,
  expected: { number: number; branch: string; head: string; main: string },
): PullRequestObservation {
  const value = Schema.decodeUnknownSync(PullRequestObservation)(input, {
    onExcessProperty: "error",
  });
  if (
    value.number !== expected.number ||
    value.headBranch !== expected.branch ||
    value.baseBranch !== "main" ||
    value.head !== expected.head ||
    value.base !== expected.main ||
    value.state !== "OPEN" ||
    value.isDraft ||
    !value.approved ||
    !value.checksPassed ||
    !value.mergeable
  )
    throw new Error(
      "Pull request requires current-head approval, successful checks, matching refs and a mergeable open state",
    );
  return value;
}
const Review = Schema.Struct({
  state: Schema.String,
  commit: Schema.NullOr(Schema.Struct({ oid: GitObjectId })),
});
const GraphResponse = Schema.Struct({
  data: Schema.Struct({
    repository: Schema.NullOr(
      Schema.Struct({
        nameWithOwner: Schema.String,
        pullRequest: Schema.NullOr(
          Schema.Struct({
            number: NumberId,
            headRefName: Schema.String,
            baseRefName: Schema.String,
            headRefOid: GitObjectId,
            baseRefOid: GitObjectId,
            state: Schema.Literals(["OPEN", "CLOSED", "MERGED"]),
            isDraft: Schema.Boolean,
            isCrossRepository: Schema.Boolean,
            reviewDecision: Schema.NullOr(Schema.String),
            mergeable: Schema.String,
            mergeStateStatus: Schema.String,
            reviews: Schema.Struct({
              nodes: Schema.Array(Review).check(Schema.isMaxLength(100)),
              pageInfo: Schema.Struct({ hasPreviousPage: Schema.Boolean }),
            }),
            commits: Schema.Struct({
              nodes: Schema.Array(
                Schema.Struct({
                  commit: Schema.Struct({
                    oid: GitObjectId,
                    statusCheckRollup: Schema.NullOr(Schema.Struct({ state: Schema.String })),
                  }),
                }),
              ).check(Schema.isMaxLength(1)),
            }),
          }),
        ),
      }),
    ),
  }),
});
const query = `query($number:Int!){repository(owner:"iki",name:"teamagent"){nameWithOwner pullRequest(number:$number){number headRefName baseRefName headRefOid baseRefOid state isDraft isCrossRepository reviewDecision mergeable mergeStateStatus reviews(last:100,states:[APPROVED,CHANGES_REQUESTED]){nodes{state commit{oid}} pageInfo{hasPreviousPage}} commits(last:1){nodes{commit{oid statusCheckRollup{state}}}}}}}`;
async function gh(root: string, args: readonly string[], input?: string): Promise<string> {
  const result = await runProcess(root, "gh", args, {
    ...(input === undefined ? {} : { input }),
    timeoutMs: 60000,
    maximumBytes: 1024 * 1024,
    env: { ...process.env, GH_PROMPT_DISABLED: "1", GH_HOST: "github.com" },
  });
  if (result.code !== 0 || result.outcome !== "exited")
    throw new Error(
      "GitHub operation failed or is uncertain; inspect the exact pull request before retrying",
    );
  return result.stdout;
}
/** Fixed repository and query; no shell, credential grants, protection changes or platform rebase. */
export const pullRequestHost: PullRequestHost = {
  async inspect(root, number) {
    Schema.decodeUnknownSync(NumberId)(number);
    const raw = await gh(root, [
      "api",
      "graphql",
      "-f",
      "query=" + query,
      "-F",
      "number=" + number,
    ]);
    const parsed = Schema.decodeUnknownSync(Schema.fromJsonString(GraphResponse))(raw, {
      onExcessProperty: "error",
    });
    const repo = parsed.data.repository;
    const pr = repo?.pullRequest;
    if (
      !repo ||
      repo.nameWithOwner !== "iki/teamagent" ||
      !pr ||
      pr.isCrossRepository ||
      pr.reviews.pageInfo.hasPreviousPage
    )
      throw new Error("Pull request identity or complete review coverage is unavailable");
    const commit = pr.commits.nodes[0]?.commit;
    return {
      number: pr.number,
      repository: "github.com/iki/teamagent",
      headBranch: pr.headRefName,
      baseBranch: pr.baseRefName,
      head: pr.headRefOid,
      base: pr.baseRefOid,
      state: pr.state,
      isDraft: pr.isDraft,
      approved:
        pr.reviewDecision === "APPROVED" &&
        pr.reviews.nodes.some(
          (review) => review.state === "APPROVED" && review.commit?.oid === pr.headRefOid,
        ),
      checksPassed: commit?.oid === pr.headRefOid && commit.statusCheckRollup?.state === "SUCCESS",
      mergeable: pr.mergeable === "MERGEABLE" && pr.mergeStateStatus === "CLEAN",
    };
  },
  async create(root, branch, title, body) {
    const output = (
      await gh(
        root,
        [
          "pr",
          "create",
          "--repo",
          "github.com/iki/teamagent",
          "--base",
          "main",
          "--head",
          branch,
          "--title",
          title,
          "--body-file",
          "-",
        ],
        body,
      )
    ).trim();
    const match = /^https:\/\/github\.com\/iki\/teamagent\/pull\/([1-9][0-9]*)$/u.exec(output);
    if (!match?.[1])
      throw new Error("PR creation has no exact confirmed URL; inspect before retrying");
    return Schema.decodeUnknownSync(NumberId)(Number(match[1]));
  },
};
