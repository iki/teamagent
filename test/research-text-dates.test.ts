import { describe, expect, test } from "bun:test";
import { inspectPublication } from "../app/research/text-dates.ts";

const html = (text: string) => [{ path: "original/page.html", mediaType: "text/html", text }];
describe("source publication metadata", () => {
  test("reads publisher metadata without confusing modified dates, comments or filename dates", () => {
    const result = inspectPublication(
      html(
        '<html><head><!-- <meta property="article:published_time" content="2001-01-01"> --><meta property="article:modified_time" content="2026-10-27"><meta content="2026-01-02T03:04:05Z" property="article:published_time"></head></html>',
      ),
      "https://example.com/260101-post",
      "fixture@1",
    );
    expect(result.sourcePublishedAt).toBe("2026-01-02T03:04:05Z");
    expect(result.publicationEvidence).toBe("publisher-html-meta");
    expect(
      inspectPublication(
        html("<p>No publication metadata.</p>"),
        "https://example.com/2026-01-01",
        "fixture@1",
      ).sourcePublishedAt,
    ).toBeNull();
  });
  test("reads Article JSON-LD but leaves conflicting, malformed and non-article metadata unknown", () => {
    const article = inspectPublication(
      html(
        '<script type="application/ld+json">{"@graph":[{"@type":"BlogPosting","datePublished":"2026-02-03"}]}</script>',
      ),
      "https://example.com/post",
      "fixture@1",
    );
    expect(article.sourcePublishedAt).toBe("2026-02-03");
    expect(article.publicationEvidence).toBe("publisher-jsonld");
    for (const value of [
      '<meta property="article:published_time" content="2026-01-01"><meta property="article:published_time" content="2026-01-02">',
      '<meta property="article:published_time" content="2026-02-30">',
      '<script type="application/ld+json">{"@type":"WebSite","datePublished":"2026-01-01"}</script>',
      '<script type="application/ld+json">{bad}</script>',
    ])
      expect(
        inspectPublication(html(value), "https://example.com/post", "fixture@1").sourcePublishedAt,
      ).toBeNull();
  });
  test("records authenticated API response metadata for the exact requested X post without following other versions", () => {
    const documents = [
      {
        path: "originals/x-api.json",
        mediaType: "application/json",
        text: JSON.stringify({
          data: {
            id: "123",
            created_at: "2026-01-01T01:02:03.000Z",
            edit_history_tweet_ids: ["123", "124"],
          },
        }),
      },
    ];
    const result = inspectPublication(
      documents,
      "https://x.com/person/status/123",
      "teamagent-x-api@1",
    );
    expect(result.sourcePublishedAt).toBe("2026-01-01T01:02:03.000Z");
    expect(result.publicationEvidence).toBe("x-api-created_at");
    expect(result.sourceRevision).toBe("x-post:123; edit-history:123,124");
    expect(result.warnings.join(" ")).toContain("not fetched or substituted");
    expect(
      inspectPublication(documents, "https://x.com/person/status/999", "teamagent-x-api@1")
        .sourcePublishedAt,
    ).toBeNull();
    expect(
      inspectPublication(documents, "https://x.com/person/status/123", "arbitrary-json")
        .sourcePublishedAt,
    ).toBeNull();
  });
});
