import { Effect, Schema } from "effect";
import { MediaError } from "./contracts.ts";

export const SpeechCueSchema = Schema.Struct({
  index: Schema.Int.check(Schema.isGreaterThan(0)),
  startSeconds: Schema.Number.check(
    Schema.isFinite(),
    Schema.isBetween({ minimum: 0, maximum: 86400 }),
  ),
  endSeconds: Schema.Number.check(
    Schema.isFinite(),
    Schema.isBetween({ minimum: 0, maximum: 86400 }),
  ),
  lines: Schema.Array(Schema.String.check(Schema.isMaxLength(16000))).check(
    Schema.isMinLength(1),
    Schema.isMaxLength(100),
  ),
  textStart: Schema.Int.check(Schema.isGreaterThanOrEqualTo(0)),
  textEnd: Schema.Int.check(Schema.isGreaterThan(0)),
});
export const SpeechTextImportSchema = Schema.Struct({
  sourceFormat: Schema.Literal("srt"),
  text: Schema.String.check(Schema.isMinLength(1), Schema.isMaxLength(100000)),
  cues: Schema.Array(SpeechCueSchema).check(Schema.isMinLength(1), Schema.isMaxLength(20000)),
  wordCount: Schema.Int.check(Schema.isGreaterThan(0)),
  nonNewlineCharacters: Schema.Int.check(Schema.isGreaterThan(0)),
  warnings: Schema.Array(Schema.String.check(Schema.isMaxLength(256))).check(
    Schema.isMaxLength(100),
  ),
});
export type SpeechTextImport = typeof SpeechTextImportSchema.Type;
function timestamp(value: string): number {
  const parts = /^(\d{2}):(\d{2}):(\d{2}),(\d{3})$/.exec(value);
  if (parts === null) throw new MediaError({ code: "invalid", message: "Invalid SRT timestamp." });
  const hours = Number(parts[1]),
    minutes = Number(parts[2]),
    seconds = Number(parts[3]),
    millis = Number(parts[4]);
  if (hours > 23 || minutes > 59 || seconds > 59)
    throw new MediaError({
      code: "invalid",
      message: "SRT timestamp is outside the supported range.",
    });
  return hours * 3600 + minutes * 60 + seconds + millis / 1000;
}
/** Removes only SRT structure. Approved cue text and logical line breaks are retained verbatim. */
export const importSrtSpeech = Effect.fnUntraced(function* (input: unknown) {
  const source = yield* Schema.decodeUnknownEffect(
    Schema.String.check(Schema.isMinLength(1), Schema.isMaxLength(1048576)),
  )(input).pipe(
    Effect.mapError(
      () => new MediaError({ code: "invalid", message: "SRT source must be bounded text." }),
    ),
  );
  return yield* Effect.try({
    try: () => {
      const normalized = source.replace(/^\uFEFF/, "").replace(/\r\n/g, "\n");
      if (
        Array.from(normalized).some(
          (character) => /\p{Cc}/u.test(character) && character !== "\n" && character !== "\t",
        )
      )
        throw new MediaError({
          code: "invalid",
          message: "SRT contains unsupported control characters.",
        });
      const blocks = normalized.replace(/\n+$/, "").split(/\n[ \t]*\n/);
      if (blocks.length > 20000)
        throw new MediaError({ code: "limit", message: "SRT cue limit exceeded." });
      const cues: (typeof SpeechCueSchema.Type)[] = [];
      const warnings: string[] = [];
      let text = "";
      let lastIndex = 0;
      let lastEnd = 0;
      for (const block of blocks) {
        const lines = block.split("\n");
        const number = lines[0],
          timing = lines[1];
        if (number === undefined || !/^\d+$/.test(number) || timing === undefined)
          throw new MediaError({
            code: "invalid",
            message: "SRT requires numbered cues and timestamp lines.",
          });
        const index = Number(number);
        const match = /^(\d{2}:\d{2}:\d{2},\d{3})[ \t]+-->[ \t]+(\d{2}:\d{2}:\d{2},\d{3})$/.exec(
          timing,
        );
        if (
          !Number.isSafeInteger(index) ||
          index <= lastIndex ||
          match?.[1] === undefined ||
          match[2] === undefined
        )
          throw new MediaError({
            code: "invalid",
            message: "SRT cue numbers/order or timing syntax is invalid.",
          });
        const startSeconds = timestamp(match[1]),
          endSeconds = timestamp(match[2]);
        const wording = lines.slice(2);
        const cueText = wording.join("\n");
        if (
          endSeconds <= startSeconds ||
          wording.length === 0 ||
          !cueText.trim() ||
          cueText.includes("-->")
        )
          throw new MediaError({
            code: "invalid",
            message: "SRT cue duration or wording is invalid.",
          });
        if (/<[^>]+>|\{\\[^}]+\}/.test(cueText))
          throw new MediaError({
            code: "unsupported",
            message:
              "Styled SRT requires an explicitly approved plain-text version; markup is not silently removed.",
          });
        if (startSeconds < lastEnd) {
          if (warnings.length >= 100)
            throw new MediaError({ code: "limit", message: "Too many overlapping SRT cues." });
          warnings.push(
            `Cue ${index} overlaps the previous cue; subtitle timing is not a measured speech alignment.`,
          );
        }
        if (cues.length > 0) text += "\n\n";
        const textStart = text.length;
        text += cueText;
        cues.push({
          index,
          startSeconds,
          endSeconds,
          lines: wording,
          textStart,
          textEnd: text.length,
        });
        lastIndex = index;
        lastEnd = endSeconds;
      }
      return Schema.decodeUnknownSync(SpeechTextImportSchema)({
        sourceFormat: "srt",
        text,
        cues,
        wordCount: text.trim().split(/\s+/u).length,
        nonNewlineCharacters: text.replace(/\n/g, "").length,
        warnings,
      });
    },
    catch: (error: unknown) =>
      error instanceof MediaError
        ? error
        : new MediaError({ code: "invalid", message: "SRT speech import failed validation." }),
  });
});
