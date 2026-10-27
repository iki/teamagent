import { randomUUID } from "node:crypto";
import { homedir } from "node:os";
import { resolve } from "node:path";
import { Effect, Schema } from "effect";
import {
  ChannelError,
  ChannelBindingSchema,
  SpeechEventSchema,
  applySpeechEvent,
  initialSpeechState,
  validateChannelEnvelope,
  createChannelService,
} from "@/channels";
import { createMediaHost, loadMediaConfig } from "../media/index.ts";
import { openChannelLedger } from "../channels/ledger.ts";
import { openChannelHost } from "../runtime/channels.ts";
import { withHostInterruption } from "../runtime/interruption.ts";
import { mediaSelection, readCliJson, runCliEffect, type MediaFlags } from "./media.ts";

export interface ChannelFlags extends MediaFlags {
  readonly data?: string | undefined;
  readonly root?: string | undefined;
  readonly kind?: string | undefined;
  readonly channel?: string | undefined;
  readonly account?: string | undefined;
  readonly conversation?: string | undefined;
  readonly sender?: string | undefined;
  readonly messageId?: string | undefined;
  readonly session?: string | undefined;
  readonly python?: string | undefined;
}
export async function runChannelCommand(
  action: string,
  argument: string | undefined,
  flags: ChannelFlags,
  print: (value: unknown) => void,
) {
  if (argument === undefined)
    throw new ChannelError({ code: "invalid", message: "Channel command requires one argument." });
  return withHostInterruption(async (signal) => {
    if (action === "speech") {
      const events = await runCliEffect(
        Schema.decodeUnknownEffect(
          Schema.Array(SpeechEventSchema).check(Schema.isMaxLength(10_000)),
        )(await readCliJson(argument), { onExcessProperty: "error" }).pipe(
          Effect.mapError(
            () =>
              new ChannelError({
                code: "invalid",
                message: "Expected a bounded array of speech events.",
              }),
          ),
        ),
        signal,
      );
      let state = await runCliEffect(
        initialSpeechState(flags.session ?? events[0]?.sessionId),
        signal,
      );
      for (const event of events)
        state = await runCliEffect(applySpeechEvent(state, event), signal);
      print(state);
      return;
    }
    const binding = await runCliEffect(
      Schema.decodeUnknownEffect(ChannelBindingSchema)({
        channel: flags.channel ?? "cli",
        account: flags.account ?? "local",
        conversation: flags.conversation ?? "local",
        principal: flags.sender ?? "local",
        authentication: "local",
      }).pipe(
        Effect.mapError(
          () => new ChannelError({ code: "invalid", message: "Invalid local channel binding." }),
        ),
      ),
      signal,
    );
    if (action === "status") {
      print(
        await runCliEffect(
          Effect.scoped(
            Effect.gen(function* () {
              const store = yield* Effect.acquireRelease(
                openChannelLedger(resolve(flags.data ?? resolve(homedir(), ".teamagent")), binding),
                (value) => value.close().pipe(Effect.orDie),
              );
              const service = yield* createChannelService({
                binding,
                ledger: store.ledger,
                processAttachment: () =>
                  Effect.fail(
                    new ChannelError({ code: "invalid", message: "Status cannot process input." }),
                  ),
              });
              return yield* service.status(argument);
            }),
          ),
          signal,
        ),
      );
      return;
    }
    let input: unknown;
    if (action !== "status") {
      const kind = flags.kind ?? "envelope";
      if (kind === "envelope" && flags.messageId !== undefined)
        throw new ChannelError({
          code: "invalid",
          message:
            "Envelope input already contains its message ID; --message-id is only for convenience kinds.",
        });
      input =
        kind === "envelope"
          ? await readCliJson(argument)
          : {
              version: 1,
              channel: binding.channel,
              account: binding.account,
              conversation: binding.conversation,
              sender: binding.principal,
              messageId: flags.messageId ?? randomUUID(),
              ...(kind === "text" ? { text: argument } : {}),
              attachments: kind === "text" ? [] : [{ id: "attachment-1", kind, locator: argument }],
            };
      const envelope = await runCliEffect(validateChannelEnvelope(input), signal);
      if (
        envelope.channel !== binding.channel ||
        envelope.account !== binding.account ||
        envelope.conversation !== binding.conversation ||
        envelope.sender !== binding.principal
      )
        throw new ChannelError({
          code: "unauthorized",
          message: "Input identity does not match its trusted channel binding.",
        });
      const speechOptions = [
        flags.backend,
        flags.model,
        flags.locality,
        flags.preference,
        flags.language,
        flags.timestamps,
        flags.diarization,
      ];
      if (
        !envelope.attachments.some(
          (attachment) => attachment.kind === "audio" || attachment.kind === "video",
        ) &&
        speechOptions.some((value) => value !== undefined)
      )
        throw new ChannelError({
          code: "invalid",
          message: "Speech options require an audio or video attachment.",
        });
      input = envelope;
    }
    if (action === "inspect") {
      print(input);
      return;
    }
    const resolved = await runCliEffect(loadMediaConfig(flags.config), signal);
    const root = resolve(flags.root ?? resolved.inputRoot);
    const media = await runCliEffect(
      createMediaHost({
        config: { ...resolved.config, inputRoot: root, outputRoot: resolved.outputRoot },
      }),
      signal,
    );
    const program = Effect.gen(function* () {
      const api = yield* openChannelHost({
        binding,
        root,
        data: resolve(flags.data ?? resolve(homedir(), ".teamagent")),
        media,
        ...(flags.python === undefined ? {} : { python: flags.python }),
        mediaOptions: {
          ...mediaSelection(flags),
          ...(flags.language === undefined ? {} : { language: flags.language }),
          ...(flags.timestamps === undefined ? {} : { timestamps: flags.timestamps }),
          ...(flags.diarization === undefined ? {} : { diarization: flags.diarization }),
        },
      });
      return yield* api.ingest(input);
    }).pipe(Effect.scoped);
    print(await runCliEffect(program, signal));
  });
}
