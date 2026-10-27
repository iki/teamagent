import { describe, expect, test } from "bun:test";
import { rejects } from "node:assert/strict";
import { Effect } from "effect";
import { MemoryError, type CaptureRequest, type SourceCapture } from "@/memory";
import { officialXCapture, xPostId, type XRequest } from "../app/research/x-source.ts";

const source = (locator: string): CaptureRequest => ({
  locator,
  kind: "url",
  convert: true,
  workspaceRoot: ".",
  temporaryDirectory: ".",
  dataDirectory: ".",
});
const fallback: SourceCapture = () =>
  Effect.fail(new MemoryError({ code: "unsupported", message: "fixture fallback" }));
function json(value: unknown) {
  return { bytes: new TextEncoder().encode(JSON.stringify(value)), mediaType: "application/json" };
}

describe("explicit official X source capture", () => {
  test("decodes note text and selected media while retaining raw evidence and credentials only at the API boundary", async () => {
    const calls: { host: string; token: string | undefined }[] = [];
    const network: XRequest = async (url, token) => {
      calls.push({ host: url.hostname, token });
      if (url.hostname === "pbs.twimg.com")
        return { bytes: new Uint8Array([255, 216, 255, 217]), mediaType: "image/jpeg" };
      expect(url.pathname).toBe("/2/tweets/123");
      expect(url.searchParams.get("tweet.fields")).toContain("note_tweet");
      return json({
        data: {
          id: "123",
          text: "Short preview",
          note_tweet: { text: "Complete note text from the selected post." },
          conversation_id: "100",
          attachments: { media_keys: ["photo"] },
        },
        includes: {
          media: [
            { media_key: "photo", type: "photo", url: "https://pbs.twimg.com/media/photo.jpg" },
          ],
        },
      });
    };
    const result = await Effect.runPromise(
      officialXCapture(
        "fixture-secret",
        fallback,
        network,
      )(source("https://x.com/person/status/123")),
    );
    if (result.status !== "captured") throw new Error("Expected capture.");
    expect(result.provenance.parserVersion).toBe("teamagent-x-api@1");
    expect(result.files.filter((file) => file.role === "image")).toHaveLength(1);
    const markdown = new TextDecoder().decode(
      result.files.find((file) => file.role === "markdown")?.bytes,
    );
    expect(markdown).toContain("Complete note text");
    expect(markdown).not.toContain("Short preview");
    expect(result.provenance.warnings.join(" ")).toContain("does not prove complete thread");
    expect(calls).toEqual([
      { host: "api.x.com", token: "fixture-secret" },
      { host: "pbs.twimg.com", token: undefined },
    ]);
    expect(JSON.stringify(result)).not.toContain("fixture-secret");
  });

  test("preserves unknown article objects, partial API errors and image omissions without pretending full article extraction", async () => {
    const network: XRequest = async () =>
      json({
        data: {
          id: "123",
          text: "Article preview",
          article: { undocumented_body: { blocks: ["Evidence"] } },
          attachments: { media_keys: ["outside", "missing"] },
        },
        includes: {
          media: [
            { media_key: "outside", type: "photo", url: "https://private.example/image.png" },
          ],
        },
        errors: [{ detail: "Private provider detail" }],
      });
    const result = await Effect.runPromise(
      officialXCapture(
        "fixture",
        fallback,
        network,
      )(source("https://twitter.com/person/status/123")),
    );
    if (result.status !== "captured") throw new Error("Expected capture.");
    const original = new TextDecoder().decode(
      result.files.find((file) => file.role === "original")?.bytes,
    );
    expect(original).toContain("undocumented_body");
    const warnings = result.provenance.warnings.join(" ");
    expect(warnings).toContain("unsupported by this adapter");
    expect(warnings).toContain("partial errors");
    expect(warnings).toContain("could not be captured");
    expect(warnings).not.toContain("Private provider detail");
    expect(result.files.filter((file) => file.role === "image")).toHaveLength(0);
  });

  test("rejects mismatched IDs and unsupported article URLs rather than substituting a source", async () => {
    expect(xPostId("https://x.com/i/web/status/123")).toBe("123");
    expect(xPostId("https://x.com/i/article/123")).toBeUndefined();
    const network: XRequest = async () => json({ data: { id: "999", text: "Wrong post" } });
    await rejects(
      Effect.runPromise(
        officialXCapture("fixture", fallback, network)(source("https://x.com/person/status/123")),
      ),
    );
    await rejects(
      Effect.runPromise(
        officialXCapture("fixture", fallback, network)(source("https://x.com/i/article/123")),
      ),
    );
    expect(() => officialXCapture(undefined, fallback, network)).toThrow();
  });
});
