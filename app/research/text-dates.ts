import { DateTime, Option, Schema } from "effect";

/** Calendar dates retain day precision; offsets normalize only when an instant was supplied. */
export const PublicationDateSchema = Schema.String.check(
  Schema.isMaxLength(40),
  Schema.isPattern(/^\d{4}-\d{2}-\d{2}(?:T\d{2}:\d{2}:\d{2}(?:\.\d{1,3})?(?:Z|[+-]\d{2}:\d{2}))?$/),
  Schema.makeFilter((value: string) => {
    const day = Option.getOrUndefined(DateTime.make(`${value.slice(0, 10)}T00:00:00Z`));
    const instant = Option.getOrUndefined(DateTime.make(value));
    return day !== undefined &&
      instant !== undefined &&
      DateTime.formatIsoDateUtc(day) === value.slice(0, 10)
      ? undefined
      : "Publication date must be a valid ISO calendar date or offset timestamp";
  }),
);
export const PublicationEvidenceSchema = Schema.Literals([
  "unknown",
  "configured",
  "publisher-html-meta",
  "publisher-jsonld",
  "x-api-created_at",
]);
export interface PublicationMetadata {
  readonly sourcePublishedAt: string | null;
  readonly publicationEvidence: typeof PublicationEvidenceSchema.Type;
  readonly publicationField: string | null;
  readonly sourceRevision: string | null;
  readonly warnings: readonly string[];
}
export interface MetadataDocument {
  readonly path: string;
  readonly mediaType: string;
  readonly text: string;
}
const Identifier = Schema.String.check(Schema.isPattern(/^[0-9]{1,30}$/));
const XMetadataSchema = Schema.Struct({
  data: Schema.Struct({
    id: Identifier,
    created_at: Schema.optional(PublicationDateSchema),
    edit_history_tweet_ids: Schema.optional(
      Schema.Array(Identifier).check(Schema.isMaxLength(100)),
    ),
  }),
});
const JsonLdSchema = Schema.Struct({
  "@type": Schema.optional(
    Schema.Union([Schema.String, Schema.Array(Schema.String).check(Schema.isMaxLength(16))]),
  ),
  datePublished: Schema.optional(PublicationDateSchema),
  "@graph": Schema.optional(Schema.Array(Schema.Unknown).check(Schema.isMaxLength(64))),
});

/** Publisher assertions are provenance, not independently authenticated creation dates. */
export function inspectPublication(
  documents: readonly MetadataDocument[],
  locator: string,
  parserVersion: string,
): PublicationMetadata {
  const candidates: {
    value: string;
    evidence: typeof PublicationEvidenceSchema.Type;
    field: string;
  }[] = [];
  const warnings: string[] = [];
  let sourceRevision: string | null = null;
  function candidate(
    value: unknown,
    evidence: typeof PublicationEvidenceSchema.Type,
    field: string,
  ) {
    if (candidates.length >= 64) throw new Error("Publication metadata candidate limit exceeded.");
    candidates.push({
      value: Schema.decodeUnknownSync(PublicationDateSchema)(value),
      evidence,
      field,
    });
  }
  function jsonLd(value: unknown, depth = 0): void {
    if (depth > 3) throw new Error("Publication metadata graph depth exceeded.");
    if (Array.isArray(value)) {
      for (const entry of Schema.decodeUnknownSync(
        Schema.Array(Schema.Unknown).check(Schema.isMaxLength(64)),
      )(value))
        jsonLd(entry, depth + 1);
      return;
    }
    const entry = Schema.decodeUnknownSync(JsonLdSchema)(value);
    const kinds = typeof entry["@type"] === "string" ? [entry["@type"]] : (entry["@type"] ?? []);
    if (
      entry.datePublished &&
      kinds.some((kind) =>
        /^(?:https?:\/\/schema\.org\/)?(?:Article|NewsArticle|BlogPosting|TechArticle)$/.test(kind),
      )
    )
      candidate(entry.datePublished, "publisher-jsonld", "Article.datePublished");
    for (const child of entry["@graph"] ?? []) jsonLd(child, depth + 1);
  }
  try {
    for (const document of documents) {
      if (document.mediaType.split(";")[0]?.trim() === "text/html") {
        let script = "";
        let scripts = 0;
        new HTMLRewriter()
          .on("meta", {
            element(element) {
              const field = element.getAttribute("property") ?? element.getAttribute("itemprop");
              if (field === "article:published_time" || field === "datePublished")
                candidate(element.getAttribute("content"), "publisher-html-meta", field);
            },
          })
          .on('script[type="application/ld+json"]', {
            element(element) {
              scripts += 1;
              if (scripts > 32) throw new Error("Publication metadata script count exceeded.");
              script = "";
              element.onEndTag(() =>
                jsonLd(Schema.decodeUnknownSync(Schema.fromJsonString(Schema.Unknown))(script)),
              );
            },
            text(chunk) {
              script += chunk.text;
              if (script.length > 262144)
                throw new Error("Publication metadata JSON exceeds its limit.");
            },
          })
          .transform(document.text);
      } else if (
        parserVersion === "teamagent-x-api@1" &&
        document.path === "originals/x-api.json"
      ) {
        const metadata = Schema.decodeUnknownSync(Schema.fromJsonString(XMetadataSchema))(
          document.text,
        );
        const match = /^\/(?:[^/]+\/status|i\/web\/status)\/([0-9]{1,30})(?:\/.*)?$/.exec(
          new URL(locator).pathname,
        );
        if (metadata.data.id !== match?.[1])
          throw new Error("Publication metadata post identity differs.");
        if (metadata.data.created_at)
          candidate(metadata.data.created_at, "x-api-created_at", "data.created_at");
        if (metadata.data.edit_history_tweet_ids)
          sourceRevision = `x-post:${metadata.data.id}; edit-history:${metadata.data.edit_history_tweet_ids.join(",")}`;
      }
    }
  } catch {
    return {
      sourcePublishedAt: null,
      publicationEvidence: "unknown",
      publicationField: null,
      sourceRevision,
      warnings: [
        "Publication metadata was malformed, ambiguous or exceeded its bounds; no source date was inferred.",
      ],
    };
  }
  if (new Set(candidates.map((item) => item.value)).size > 1)
    return {
      sourcePublishedAt: null,
      publicationEvidence: "unknown",
      publicationField: null,
      sourceRevision,
      warnings: [
        "Conflicting publication metadata was retained in source evidence; the source creation date remains unknown.",
      ],
    };
  const selected = candidates[0];
  if (sourceRevision && sourceRevision.split(",").length > 1)
    warnings.push(
      "X edit-history identifiers are recorded for the requested post; another version was not fetched or substituted automatically.",
    );
  return {
    sourcePublishedAt: selected?.value ?? null,
    publicationEvidence: selected?.evidence ?? "unknown",
    publicationField: selected?.field ?? null,
    sourceRevision,
    warnings,
  };
}
