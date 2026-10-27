import { describe, expect, test } from "bun:test";
import { Effect } from "effect";
import { importSrtSpeech } from "@/media";

function importFailure(input: unknown) {
  return Effect.runPromise(
    importSrtSpeech(input).pipe(
      Effect.match({
        onSuccess: () => ({ code: "unexpected-success" }),
        onFailure: (error) => ({ code: error.code }),
      }),
    ),
  );
}

describe("SRT speech import", () => {
  test("preserves synthetic Czech and English wording, punctuation, spaces and logical lines", async () => {
    const czech = "„Příliš žluťoučký kůň,“ řekla.\nDruhý řádek — beze změn.";
    const english = "She said: “Keep commas, pauses… and hyphens.”\n  Final line!  ";
    const source = `\uFEFF1\r\n00:00:01,125 --> 00:00:04,250\r\n${czech.replace(/\n/g, "\r\n")}\r\n\r\n2\r\n00:00:05,000 --> 00:00:10,750\r\n${english.replace(/\n/g, "\r\n")}\r\n`;
    const result = await Effect.runPromise(importSrtSpeech(source));
    expect(result.text).toBe(`${czech}\n\n${english}`);
    expect(result.sourceFormat).toBe("srt");
    expect(result.wordCount).toBe(18);
    expect(result.nonNewlineCharacters).toBe(czech.length + english.length - 2);
    expect(result.warnings).toEqual([]);
    expect(result.cues).toEqual([
      {
        index: 1,
        startSeconds: 1.125,
        endSeconds: 4.25,
        lines: czech.split("\n"),
        textStart: 0,
        textEnd: czech.length,
      },
      {
        index: 2,
        startSeconds: 5,
        endSeconds: 10.75,
        lines: english.split("\n"),
        textStart: czech.length + 2,
        textEnd: czech.length + 2 + english.length,
      },
    ]);
    for (const cue of result.cues)
      expect(result.text.slice(cue.textStart, cue.textEnd)).toBe(cue.lines.join("\n"));
  });

  test("preserves numbered gaps and reports overlap without rewriting subtitle timing", async () => {
    const result = await Effect.runPromise(
      importSrtSpeech(
        "1\n00:00:01,000 --> 00:00:03,000\nFirst.\n\n3\n00:00:02,000 --> 00:00:04,000\nSecond.",
      ),
    );
    expect(result.text).toBe("First.\n\nSecond.");
    expect(result.cues.map((cue) => [cue.index, cue.startSeconds, cue.endSeconds])).toEqual([
      [1, 1, 3],
      [3, 2, 4],
    ]);
    expect(result.warnings).toEqual([
      "Cue 3 overlaps the previous cue; subtitle timing is not a measured speech alignment.",
    ]);
  });

  test("rejects malformed timing, numbering, empty wording and controls", async () => {
    for (const source of [
      "1\n00:00:01.000 --> 00:00:02,000\nWords.",
      "1\n24:00:01,000 --> 24:00:02,000\nWords.",
      "1\n00:60:01,000 --> 00:60:02,000\nWords.",
      "1\n00:00:01,000 --> 00:00:01,000\nWords.",
      "1\n00:00:02,000 --> 00:00:01,000\nWords.",
      "1\n00:00:01,000 --> 00:00:02,000 align:start\nWords.",
      "0\n00:00:01,000 --> 00:00:02,000\nWords.",
      "1\n00:00:01,000 --> 00:00:02,000\nFirst.\n\n1\n00:00:03,000 --> 00:00:04,000\nDuplicate.",
      "00:00:01,000 --> 00:00:02,000\nMissing number.",
      "1\n00:00:01,000 --> 00:00:02,000\n   ",
      "1\n00:00:01,000 --> 00:00:02,000\nNUL\u0000text.",
    ])
      expect(await importFailure(source)).toEqual({ code: "invalid" });
    expect(await importFailure({ text: "not a string" })).toEqual({ code: "invalid" });
  });

  test("rejects styling instead of silently changing approved text", async () => {
    for (const text of ["<i>Approved words.</i>", "{\\an8}Approved words."]) {
      expect(await importFailure(`1\n00:00:01,000 --> 00:00:02,000\n${text}`)).toEqual({
        code: "unsupported",
      });
    }
  });

  test("bounds lines and total text without truncating", async () => {
    expect(await importFailure(`1\n00:00:01,000 --> 00:00:02,000\n${"x".repeat(16001)}`)).toEqual({
      code: "invalid",
    });
    expect(
      await importFailure(
        `1\n00:00:01,000 --> 00:00:02,000\n${Array.from({ length: 101 }, () => "word").join("\n")}`,
      ),
    ).toEqual({ code: "invalid" });
    const blocks = Array.from(
      { length: 7 },
      (_, index) =>
        `${index + 1}\n00:00:${String(index * 2).padStart(2, "0")},000 --> 00:00:${String(index * 2 + 1).padStart(2, "0")},000\n${"x".repeat(15000)}`,
    );
    expect(await importFailure(blocks.join("\n\n"))).toEqual({ code: "invalid" });
  });
});
