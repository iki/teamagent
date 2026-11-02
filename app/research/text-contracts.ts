import { createHash } from "node:crypto";
import { Schema } from "effect";
import { MemoryIdSchema, Sha256Schema } from "@/memory";
import { PublicationDateSchema, PublicationEvidenceSchema } from "./text-dates.ts";

export const textLimits = {
  configurationBytes: 262144,
  stateBytes: 4194304,
  entries: 256,
  urlsPerEntry: 16,
  sourceMs: 120000,
} as const;

const NameSchema = Schema.String.check(
  Schema.isMaxLength(180),
  Schema.isPattern(/^[a-zA-Z0-9][a-zA-Z0-9._-]*\.(?:md|pdf)$/),
);
const TextSourceSchema = Schema.Struct({
  url: Schema.String.check(Schema.isMaxLength(8192)),
  refresh: Schema.Boolean,
  publishedAt: Schema.NullOr(PublicationDateSchema),
});
export const TextEntrySchema = Schema.Struct({
  name: NameSchema,
  sources: Schema.Array(TextSourceSchema).check(
    Schema.isMinLength(1),
    Schema.isMaxLength(textLimits.urlsPerEntry),
  ),
});
export type TextEntry = typeof TextEntrySchema.Type;
const legacyRecordFields = {
  key: Sha256Schema,
  order: Schema.Int.check(Schema.isGreaterThanOrEqualTo(0), Schema.isLessThanOrEqualTo(4095)),
  name: NameSchema,
  source: Schema.String.check(Schema.isMaxLength(8192)),
  sourceId: Schema.NullOr(MemoryIdSchema),
  versionId: Schema.NullOr(MemoryIdSchema),
  contentHash: Schema.NullOr(Sha256Schema),
  checkedAt: Schema.String.check(Schema.isMaxLength(64)),
  status: Schema.Literals(["created", "updated", "unchanged", "failed"]),
  validation: Schema.Literals(["usable-text", "partial", "blocked", "unsupported", "failed"]),
  originalBytes: Schema.Int.check(Schema.isGreaterThanOrEqualTo(0)),
  markdownCharacters: Schema.Int.check(Schema.isGreaterThanOrEqualTo(0)),
  images: Schema.Int.check(Schema.isGreaterThanOrEqualTo(0)),
  warnings: Schema.Array(Schema.String.check(Schema.isMaxLength(2000))).check(
    Schema.isMaxLength(256),
  ),
  headings: Schema.Array(Schema.String.check(Schema.isMaxLength(240))).check(
    Schema.isMaxLength(20),
  ),
  exportDirectory: Schema.NullOr(Schema.String.check(Schema.isMaxLength(2048))),
};
export const LegacyTextStateSchema = Schema.Struct({
  format: Schema.Literal("teamagent-text-sync-v1"),
  checkedAt: Schema.String,
  records: Schema.Array(Schema.Struct(legacyRecordFields)).check(Schema.isMaxLength(4096)),
});
export const TextRecordSchema = Schema.Struct({
  ...legacyRecordFields,
  status: Schema.Literals(["created", "updated", "unchanged", "pinned", "failed"]),
  mode: Schema.Literals(["static", "refresh"]),
  firstCapturedAt: Schema.NullOr(PublicationDateSchema),
  sourcePublishedAt: Schema.NullOr(PublicationDateSchema),
  publicationEvidence: PublicationEvidenceSchema,
  publicationField: Schema.NullOr(Schema.String.check(Schema.isMaxLength(128))),
  sourceRevision: Schema.NullOr(Schema.String.check(Schema.isMaxLength(3200))),
  validatedAt: Schema.NullOr(PublicationDateSchema),
});
export type TextRecord = typeof TextRecordSchema.Type;
export const TextStateSchema = Schema.Struct({
  format: Schema.Literal("teamagent-text-sync-v2"),
  checkedAt: Schema.String,
  records: Schema.Array(TextRecordSchema).check(Schema.isMaxLength(4096)),
});
export type TextState = typeof TextStateSchema.Type;

/** A deliberately small, non-executable alias + URL list format. */
export function parseTextSources(input: unknown): readonly TextEntry[] {
  const text = Schema.decodeUnknownSync(Schema.String)(input);
  if (Buffer.byteLength(text) > textLimits.configurationBytes)
    throw new Error("Text source configuration exceeds its byte limit.");
  const entries: TextEntry[] = [];
  const names = new Set<string>();
  for (const [index, line] of text
    .replace(/^\uFEFF/, "")
    .split(/\r?\n/)
    .entries()) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const tokens: string[] = [];
    let end = 0;
    for (const match of trimmed.matchAll(/"([^"\r\n]*)"|'([^'\r\n]*)'|(\S+)/g)) {
      if (trimmed.slice(end, match.index).trim())
        throw new Error(`Invalid source syntax on line ${index + 1}.`);
      const token = match[1] ?? match[2] ?? match[3];
      if (token === undefined || /["']/.test(token))
        throw new Error(`Invalid quoting on line ${index + 1}.`);
      tokens.push(token);
      end = match.index + match[0].length;
      if (end < trimmed.length && !/\s/.test(trimmed[end] ?? ""))
        throw new Error(`Missing separator on line ${index + 1}.`);
    }
    const sources: { url: string; refresh: boolean; publishedAt: string | null }[] = [];
    let refreshSeen = false;
    let publishedSeen = false;
    for (const token of tokens.slice(1)) {
      if (token.startsWith("refresh=") || token.startsWith("published=")) {
        const source = sources.at(-1);
        if (!source)
          throw new Error(`Source options require a preceding URL on line ${index + 1}.`);
        if (token.startsWith("refresh=")) {
          if (refreshSeen || !["refresh=true", "refresh=false"].includes(token))
            throw new Error(`Invalid or duplicate refresh option on line ${index + 1}.`);
          source.refresh = token === "refresh=true";
          refreshSeen = true;
        } else {
          if (publishedSeen) throw new Error(`Duplicate publication date on line ${index + 1}.`);
          source.publishedAt = Schema.decodeUnknownSync(PublicationDateSchema)(
            token.slice("published=".length),
          );
          publishedSeen = true;
        }
      } else {
        sources.push({ url: token, refresh: false, publishedAt: null });
        refreshSeen = false;
        publishedSeen = false;
      }
    }
    let entry: TextEntry;
    try {
      entry = Schema.decodeUnknownSync(TextEntrySchema)({ name: tokens[0], sources });
    } catch {
      throw new Error(`Invalid source entry on line ${index + 1}.`);
    }
    if (entry.name.includes("..") || /^(?:con|prn|aux|nul|com[0-9]|lpt[0-9])\./i.test(entry.name))
      throw new Error(`Unsafe source alias on line ${index + 1}.`);
    if (names.has(entry.name.toLowerCase()))
      throw new Error(`Duplicate source alias on line ${index + 1}.`);
    names.add(entry.name.toLowerCase());
    const normalized = entry.sources.map((source) => {
      const locator = source.url;
      let url: URL;
      try {
        url = new URL(locator);
      } catch {
        throw new Error(`Invalid source URL on line ${index + 1}.`);
      }
      if (
        !["http:", "https:"].includes(url.protocol) ||
        url.username ||
        url.password ||
        /\p{Cc}/u.test(locator)
      )
        throw new Error(`Unsupported source URL on line ${index + 1}.`);
      url.hash = "";
      return { ...source, url: url.href };
    });
    if (new Set(normalized.map((source) => source.url)).size !== normalized.length)
      throw new Error(`Repeated URL on line ${index + 1}.`);
    entries.push({ name: entry.name, sources: normalized });
    if (entries.length > textLimits.entries) throw new Error("Too many text source entries.");
  }
  return entries;
}

export function sourceKey(name: string, locator: string): string {
  return createHash("sha256")
    .update(JSON.stringify([name, locator]))
    .digest("hex");
}
/** Public reports omit query values, including signed resource tokens. */
export function displaySource(locator: string): string {
  const url = new URL(locator);
  return `${url.origin}${url.pathname}`;
}
export function socialSource(locator: string): boolean {
  return /^(?:www\.|mobile\.)?(?:x|twitter)\.com$/.test(new URL(locator).hostname);
}
export function redactSourceUrls(value: string): string {
  return value.replace(/https?:\/\/[^\s)]+/gi, (url) => {
    try {
      return displaySource(url);
    } catch {
      return "[source URL]";
    }
  });
}
export function textQuality(input: {
  readonly name: string;
  readonly locator: string;
  readonly markdown: string;
  readonly images: number;
  readonly warnings: readonly string[];
  readonly hasPdf: boolean;
  readonly socialApi?: boolean;
}): Pick<TextRecord, "validation" | "warnings" | "headings"> {
  const clean = input.markdown.trim();
  const warnings = input.warnings.map((warning) => redactSourceUrls(warning).slice(0, 2000));
  const minimumCharacters = input.socialApi ? 1 : 100;
  let validation: TextRecord["validation"] =
    clean.length >= minimumCharacters
      ? warnings.length
        ? "partial"
        : "usable-text"
      : "unsupported";
  if (input.name.endsWith(".pdf") && !input.hasPdf) {
    validation = "blocked";
    warnings.push(
      "Requested PDF was not captured as a PDF document; an HTML wrapper is not a substitute.",
    );
  }
  if (clean.length < minimumCharacters)
    warnings.push("Too little extracted text to validate substantive source content.");
  if (
    clean.length < 6000 &&
    /(?:enable javascript|javascript is (?:not available|disabled)|verify you are human|just a moment|access denied|something went wrong.*try reloading|sign in to (?:x|twitter)|please log in)/is.test(
      clean,
    )
  ) {
    validation = "blocked";
    warnings.push(
      "Extracted content resembles an access challenge, login page, or JavaScript shell.",
    );
  }
  if (socialSource(input.locator)) {
    if (validation === "usable-text") validation = "partial";
    warnings.push(
      input.socialApi
        ? "Official X API representation of the chosen post; complete thread, article-body and media coverage remain separately unverified."
        : "Public social-page HTML only: authenticated post, article and thread completeness are unverified. No alternate mirror was substituted.",
    );
  }
  if (!input.images)
    warnings.push(
      "No images were captured; whether the source contains missing images is unverified.",
    );
  else warnings.push("Image count is measured; visual fidelity and completeness are unverified.");
  const headings = [...clean.matchAll(/^#{1,6}\s+(.+)$/gm)]
    .slice(0, 20)
    .map((match) => redactSourceUrls(match[1] ?? "").slice(0, 240));
  if (warnings.length > 256)
    return {
      validation: "partial",
      warnings: [
        ...warnings.slice(0, 255),
        "Additional extraction warnings omitted from this report; retained in the version provenance.",
      ],
      headings,
    };
  return { validation, warnings, headings };
}
