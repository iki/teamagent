import { realpath, stat } from "node:fs/promises";
import { resolve } from "node:path";
import { Effect, Layer, Schema } from "effect";
import {
  ChannelBindingSchema,
  ChannelError,
  ChannelService,
  createChannelService,
  type ChannelApi,
} from "@/channels";
import type { MediaApi } from "@/media";
import { openChannelLedger } from "../channels/ledger.ts";
import { createAttachmentProcessor, fingerprintAttachment } from "../channels/attachments.ts";
import { openMemoryHost } from "./memory.ts";

export interface ChannelHostOptions {
  readonly binding: unknown;
  readonly root: string;
  readonly data: string;
  readonly media: MediaApi;
  readonly maximumBytes?: number;
  readonly python?: string;
  readonly mediaOptions?: Readonly<Record<string, unknown>>;
}
export const openChannelHost = Effect.fnUntraced(function* (options: ChannelHostOptions) {
  if (
    options.maximumBytes !== undefined &&
    (!Number.isSafeInteger(options.maximumBytes) ||
      options.maximumBytes < 1 ||
      options.maximumBytes > 268_435_456)
  )
    return yield* new ChannelError({
      code: "invalid",
      message: "Channel attachment byte limit must be an integer from 1 to 268435456.",
    });
  const binding = yield* Schema.decodeUnknownEffect(ChannelBindingSchema)(options.binding, {
    onExcessProperty: "error",
  }).pipe(
    Effect.mapError(
      () => new ChannelError({ code: "invalid", message: "Invalid channel binding." }),
    ),
  );
  const root = yield* Effect.tryPromise({
    try: async () => {
      const path = await realpath(resolve(options.root));
      if (!(await stat(path)).isDirectory()) throw new Error("invalid root");
      return path;
    },
    catch: () =>
      new ChannelError({
        code: "invalid",
        message: "Channel input root must be an existing directory.",
      }),
  });
  const store = yield* Effect.acquireRelease(openChannelLedger(options.data, binding), (value) =>
    value.close().pipe(Effect.orDie),
  );
  const memory = yield* Effect.acquireRelease(
    openMemoryHost({
      data: options.data,
      root,
      ...(options.python === undefined ? {} : { python: options.python }),
    }).pipe(
      Effect.mapError((error) => new ChannelError({ code: "storage", message: error.message })),
    ),
    (value) => value.close().pipe(Effect.orDie),
  );
  const service = yield* createChannelService({
    binding,
    ledger: store.ledger,
    processAttachment: createAttachmentProcessor({
      root,
      data: options.data,
      media: options.media,
      memory,
      ...(options.maximumBytes === undefined ? {} : { maximumBytes: options.maximumBytes }),
      ...(options.mediaOptions === undefined ? {} : { mediaOptions: options.mediaOptions }),
    }),
  });
  const ingest = Effect.fnUntraced(function* (input: unknown) {
    const envelope = yield* service.inspect(input);
    const attachments = [];
    for (const attachment of envelope.attachments)
      attachments.push(
        yield* fingerprintAttachment(root, options.data, attachment, options.maximumBytes),
      );
    return yield* service.ingest({ ...envelope, attachments });
  });
  const api: ChannelApi = { ...service, ingest };
  return api;
});
export const channelHostLayer = (options: ChannelHostOptions) =>
  Layer.effect(ChannelService, openChannelHost(options));
