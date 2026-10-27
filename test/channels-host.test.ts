import { strict as assert } from "node:assert";
import { mkdtemp, mkdir, writeFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { test } from "node:test";
import { Effect } from "effect";
import { MediaError, type MediaApi } from "@/media";
import { openChannelHost } from "../app/runtime/channels.ts";
import { openChannelLedger } from "../app/channels/ledger.ts";
import { fingerprintAttachment } from "../app/channels/attachments.ts";

const binding = {
  channel: "cli",
  account: "local",
  conversation: "local",
  principal: "local",
  authentication: "local",
} as const;
const envelope = {
  version: 1,
  channel: "cli",
  account: "local",
  conversation: "local",
  sender: "local",
  messageId: "delivery-1",
  text: "hello",
  attachments: [],
} as const;
const unavailable = () =>
  Effect.fail(new MediaError({ code: "unavailable", message: "Fixture has no speech provider." }));
const media: MediaApi = {
  listBackends: () => Effect.succeed([]),
  plan: unavailable,
  run: unavailable,
  explain: unavailable,
  voice: unavailable,
  diagnose: unavailable,
  recovery: unavailable,
};

await test("channel receipt survives reopening, rejects changed content, and isolates principals", async () => {
  const directory = await mkdtemp(join(tmpdir(), "teamagent-channel-"));
  const root = join(directory, "input");
  const data = join(directory, "state");
  await mkdir(root);
  const run = (value: unknown) =>
    Effect.runPromise(
      Effect.scoped(
        Effect.gen(function* () {
          const api = yield* openChannelHost({ binding, root, data, media });
          return yield* api.ingest(value);
        }),
      ),
    );
  try {
    assert.equal((await run(envelope)).duplicate, false);
    assert.equal((await run({ ...envelope })).duplicate, true);
    assert.equal(
      (await run(Object.fromEntries(Object.entries(envelope).toReversed()))).duplicate,
      true,
    );
    await assert.rejects(run({ ...envelope, text: "changed" }), /different content/);
    await assert.rejects(run({ ...envelope, sender: "someone-else" }), /trusted channel binding/);
    const receipt = await Effect.runPromise(
      Effect.scoped(
        Effect.gen(function* () {
          const api = yield* openChannelHost({ binding, root, data, media });
          return yield* api.status(envelope.messageId);
        }),
      ),
    );
    assert.equal(receipt?.status, "complete");
    assert.equal(receipt?.result?.text, "hello");
  } finally {
    await rm(directory, { recursive: true, force: true });
  }
});

await test("channel Markdown ingestion preserves immutable memory evidence and detects changed file replay", async () => {
  const directory = await mkdtemp(join(tmpdir(), "teamagent-channel-doc-"));
  const root = join(directory, "input");
  const data = join(directory, "state");
  await mkdir(root);
  await writeFile(join(root, "note.md"), "# Source\nEvidence from a fixture.\n");
  const input = {
    ...envelope,
    attachments: [{ id: "note", kind: "document", locator: "note.md" }],
  };
  const run = () =>
    Effect.runPromise(
      Effect.scoped(
        Effect.gen(function* () {
          const api = yield* openChannelHost({ binding, root, data, media });
          return yield* api.ingest(input);
        }),
      ),
    );
  try {
    const first = await run();
    assert.ok(first.turn.text.includes("Evidence from a fixture"));
    assert.equal(first.turn.attachments[0]?.backend, "source-memory");
    assert.ok(first.turn.attachments[0]?.sourceId);
    assert.ok(first.turn.attachments[0]?.versionId);
    assert.equal((await run()).duplicate, true);
    await writeFile(join(root, "note.md"), "Changed evidence");
    await assert.rejects(run(), /different content/);
  } finally {
    await rm(directory, { recursive: true, force: true });
  }
});

await test("channel speech failure records a terminal receipt instead of silently retrying", async () => {
  const directory = await mkdtemp(join(tmpdir(), "teamagent-channel-speech-"));
  const root = join(directory, "input");
  const data = join(directory, "state");
  await mkdir(root);
  await writeFile(join(root, "voice.wav"), "fixture audio");
  try {
    await Effect.runPromise(
      Effect.scoped(
        Effect.gen(function* () {
          const api = yield* openChannelHost({ binding, root, data, media });
          const input = {
            ...envelope,
            attachments: [{ id: "audio", kind: "audio", locator: "voice.wav" }],
          };
          const failure = yield* Effect.result(api.ingest(input));
          assert.equal(failure._tag, "Failure");
          assert.equal((yield* api.status(envelope.messageId))?.status, "failed");
          const retry = yield* Effect.result(api.ingest(input));
          assert.equal(retry._tag, "Failure");
        }),
      ),
    );
  } finally {
    await rm(directory, { recursive: true, force: true });
  }
});

await test("channel attachments reject private paths and digest mismatches; ledger reservations are atomic", async () => {
  const directory = await mkdtemp(join(tmpdir(), "teamagent-channel-boundary-"));
  const data = join(directory, "private");
  await mkdir(data);
  await writeFile(join(data, "secret.txt"), "private fixture");
  await writeFile(join(directory, "input.txt"), "public fixture");
  try {
    await assert.rejects(
      Effect.runPromise(
        fingerprintAttachment(directory, data, {
          id: "a",
          kind: "document",
          locator: "private/secret.txt",
        }),
      ),
      /outside private data/,
    );
    await assert.rejects(
      Effect.runPromise(
        fingerprintAttachment(directory, data, {
          id: "a",
          kind: "document",
          locator: "input.txt",
          sha256: "0".repeat(64),
        }),
      ),
      /unchanged regular file/,
    );
    await assert.rejects(
      Effect.runPromise(
        fingerprintAttachment(
          directory,
          data,
          { id: "a", kind: "document", locator: "input.txt" },
          Number.NaN,
        ),
      ),
      /byte limit/,
    );
    await assert.rejects(
      Effect.runPromise(
        Effect.scoped(
          openChannelHost({ binding, root: join(directory, "input.txt"), data, media }),
        ),
      ),
      /existing directory/,
    );
    const store = await Effect.runPromise(openChannelLedger(data, binding));
    try {
      const claim = await Effect.runPromise(store.ledger.claim(envelope));
      assert.equal(claim.status, "reserved");
      await assert.rejects(Effect.runPromise(store.ledger.claim(envelope)), /processing/);
    } finally {
      await Effect.runPromise(store.close());
    }
  } finally {
    await rm(directory, { recursive: true, force: true });
  }
});
