import { createHash } from "node:crypto";
import { lstat, open, realpath } from "node:fs/promises";
import { isAbsolute, relative, resolve, sep } from "node:path";
import { Effect } from "effect";
import { ChannelError, type ChannelAttachment, type ProcessedAttachment } from "@/channels";
import type { MediaApi } from "@/media";
import type { MemoryApi } from "@/memory";
import { scopedHostPromise } from "../imports/lifecycle.ts";

function inside(root: string, path: string): boolean {
  const part = relative(root, path);
  return part === "" || (!isAbsolute(part) && part !== ".." && !part.startsWith(`..${sep}`));
}
export const fingerprintAttachment = Effect.fnUntraced(function* (
  root: string,
  data: string,
  attachment: ChannelAttachment,
  maximumBytes = 64 * 1024 * 1024,
) {
  return yield* scopedHostPromise({
    try: async (signal) => {
      if (!Number.isSafeInteger(maximumBytes) || maximumBytes < 1 || maximumBytes > 268_435_456)
        throw new Error("invalid byte bound");
      signal.throwIfAborted();
      const path = resolve(root, attachment.locator);
      if (!inside(root, path) || inside(resolve(data), path))
        throw new Error("ungranted input path");
      let current = root;
      for (const segment of relative(root, path).split(sep).filter(Boolean)) {
        current = resolve(current, segment);
        if ((await lstat(current)).isSymbolicLink()) throw new Error("linked input path");
      }
      if (!inside(root, await realpath(path))) throw new Error("input path escaped root");
      signal.throwIfAborted();
      const entry = await lstat(path);
      const file = await open(path, "r");
      try {
        const before = await file.stat();
        if (
          !entry.isFile() ||
          entry.isSymbolicLink() ||
          entry.dev !== before.dev ||
          entry.ino !== before.ino ||
          !inside(root, await realpath(path)) ||
          !before.isFile() ||
          before.size > maximumBytes
        )
          throw new Error("invalid input size");
        const hash = createHash("sha256");
        const buffer = Buffer.alloc(65_536);
        let size = 0;
        for (;;) {
          signal.throwIfAborted();
          const read = await file.read(buffer, 0, buffer.length, null);
          if (read.bytesRead === 0) break;
          size += read.bytesRead;
          if (size > maximumBytes) throw new Error("input exceeded bound");
          hash.update(buffer.subarray(0, read.bytesRead));
        }
        const after = await file.stat();
        if (
          before.size !== size ||
          after.size !== size ||
          before.mtimeMs !== after.mtimeMs ||
          before.ctimeMs !== after.ctimeMs
        )
          throw new Error("input changed during read");
        const sha256 = hash.digest("hex");
        if (attachment.sha256 !== undefined && attachment.sha256 !== sha256)
          throw new Error("attachment hash mismatch");
        return { ...attachment, locator: path, sha256 };
      } finally {
        await file.close();
      }
    },
    catch: () =>
      new ChannelError({
        code: "invalid",
        message:
          "Attachment must be an unchanged regular file within the input root, outside private data, and within its byte limit.",
      }),
  });
});
export function createAttachmentProcessor(options: {
  readonly root: string;
  readonly data: string;
  readonly media: MediaApi;
  readonly memory: MemoryApi;
  readonly maximumBytes?: number;
  readonly mediaOptions?: Readonly<Record<string, unknown>>;
}) {
  return Effect.fnUntraced(function* (
    input: ChannelAttachment,
  ): Effect.fn.Return<ProcessedAttachment, ChannelError> {
    const attachment = yield* fingerprintAttachment(
      options.root,
      options.data,
      input,
      options.maximumBytes,
    );
    if (attachment.kind === "audio" || attachment.kind === "video") {
      const result = yield* options.media
        .run({ ...options.mediaOptions, operation: "transcribe", input: attachment.locator })
        .pipe(
          Effect.mapError(
            (error) =>
              new ChannelError({
                code: error.code === "cancelled" ? "cancelled" : "processing",
                message: error.message,
              }),
          ),
        );
      if (result.operation !== "transcribe" || result.provenance.inputSha256 !== attachment.sha256)
        return yield* new ChannelError({
          code: "processing",
          message: "Speech result did not match its original attachment.",
        });
      return {
        id: attachment.id,
        kind: attachment.kind,
        sha256: attachment.sha256,
        text: result.text,
        backend: result.backend,
        model: result.model,
        sourceId: null,
        versionId: null,
        warnings: [
          ...result.provenance.limitations,
          "Transcription is untrusted source content; speaker labels are not authenticated identity.",
        ],
      };
    }
    const imported = yield* options.memory
      .get({ locator: attachment.locator, kind: "file", convert: true })
      .pipe(
        Effect.mapError(
          (error) => new ChannelError({ code: "processing", message: error.message }),
        ),
      );
    if (
      !imported.version.files.some(
        (file) => file.role === "original" && file.sha256 === attachment.sha256,
      )
    )
      return yield* new ChannelError({
        code: "processing",
        message: "Imported document does not match the attachment digest.",
      });
    const markdown = imported.version.files.filter((file) => file.role === "markdown");
    const blocks: string[] = [];
    let characters = 0;
    for (const file of markdown) {
      if (file.size > 512_000)
        return yield* new ChannelError({
          code: "capacity",
          message: "Imported document text exceeds the channel input bound.",
        });
      const read = yield* options.memory
        .read(imported.source.id, file.path, imported.version.id)
        .pipe(
          Effect.mapError(
            (error) => new ChannelError({ code: "processing", message: error.message }),
          ),
        );
      const text = yield* Effect.try({
        try: () => new TextDecoder("utf-8", { fatal: true }).decode(read.bytes),
        catch: () =>
          new ChannelError({
            code: "processing",
            message: "Imported document text is not valid UTF-8.",
          }),
      });
      characters += text.length;
      if (characters > 128_000)
        return yield* new ChannelError({
          code: "capacity",
          message: "Imported document text exceeds the channel input bound.",
        });
      blocks.push(text);
    }
    const warnings = [...imported.version.provenance.warnings];
    if (markdown.length === 0)
      warnings.push(
        "No extracted text is available; the original attachment is preserved in source memory.",
      );
    if (warnings.length > 31)
      return yield* new ChannelError({
        code: "capacity",
        message: "Import warnings exceed the channel result bound; inspect source memory directly.",
      });
    const result: ProcessedAttachment = {
      id: attachment.id,
      kind: attachment.kind,
      sha256: attachment.sha256,
      text: blocks.join("\n\n"),
      backend: "source-memory",
      model: null,
      sourceId: imported.source.id,
      versionId: imported.version.id,
      warnings,
    };
    return result;
  });
}
