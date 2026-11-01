import { assertTemporaryFixture, mkdtemp } from "./temporary.ts";
import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { appendFile, lstat, mkdir, open, readFile, rename, rm, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { test } from "node:test";
import {
  fileContentDigest,
  fingerprintChunkBytes,
  fingerprintQueueLimit,
  fingerprintReadLimit,
  inventoryDigest,
} from "../app/check/cache-fingerprint.ts";
import { boundedRead, cacheLimits, inventory } from "../app/check/cache-io.ts";

async function fixture() {
  const root = await mkdtemp("fingerprint-tests-");
  return {
    root,
    async close() {
      await assertTemporaryFixture(root);
      await rm(root, { recursive: true, force: false });
    },
  };
}

await test("streamed content and Git blob fingerprints retain exact legacy byte identities", async () => {
  const f = await fixture();
  try {
    for (const size of [0, fingerprintChunkBytes * 2 + 37]) {
      const path = join(f.root, "input.bin");
      const bytes = new Uint8Array(size).map((_, index) => index % 251);
      await writeFile(path, bytes);
      const expected = await lstat(path, { bigint: true });
      for (const algorithm of ["sha1", "sha256"] as const) {
        for (const gitBlob of [false, true]) {
          let readBytes = 0;
          let closed = false;
          const actual = await fileContentDigest(path, expected, {
            maximumBytes: size,
            algorithm,
            gitBlob,
            observe(event) {
              assert.ok(event.bytes <= fingerprintChunkBytes);
              if (event.phase === "read") readBytes += event.bytes;
              if (event.phase === "closed") closed = true;
            },
          });
          const legacy = createHash(algorithm);
          if (gitBlob) legacy.update(`blob ${size}\0`);
          assert.equal(actual, legacy.update(bytes).digest("hex"));
          assert.equal(readBytes, size);
          assert.equal(closed, true);
        }
      }
    }
  } finally {
    await f.close();
  }
});

for (const mutation of ["grow", "truncate", "replace", "replace-before-open"] as const) {
  await test(`streamed fingerprints reject ${mutation} races and close their handles`, async () => {
    const f = await fixture();
    try {
      const path = join(f.root, "input.txt");
      const bytes = "x".repeat(fingerprintChunkBytes * 2) + "\n";
      await writeFile(path, bytes, "utf8");
      const original = await lstat(path, { bigint: true });
      let mutated = false;
      let closed = false;
      await assert.rejects(
        fileContentDigest(path, original, {
          maximumBytes: bytes.length + 1,
          async observe(event) {
            if (event.phase === "closed") closed = true;
            const phase = mutation === "replace-before-open" ? "before-open" : "read";
            if (mutated || event.phase !== phase) return;
            mutated = true;
            if (mutation === "grow") await appendFile(path, "\n", "utf8");
            else if (mutation === "truncate") {
              const handle = await open(path, "r+");
              try {
                await handle.truncate(0);
              } finally {
                await handle.close();
              }
            } else {
              await rename(path, `${path}.original`);
              await writeFile(path, bytes, "utf8");
            }
          },
        }),
        /changed/u,
      );
      assert.equal(mutated, true);
      assert.equal(closed, true);
    } finally {
      await f.close();
    }
  });
}

await test("fingerprint readers bound concurrent handles, queued work and per-read memory", async () => {
  const f = await fixture();
  const release = Promise.withResolvers<void>();
  const occupied = Promise.withResolvers<void>();
  const work: Promise<string>[] = [];
  try {
    const path = join(f.root, "input.txt");
    await writeFile(path, "bounded\n", "utf8");
    const expected = await lstat(path, { bigint: true });
    let active = 0;
    let maximum = 0;
    const run = () =>
      fileContentDigest(path, expected, {
        maximumBytes: 8,
        async observe(event) {
          if (event.phase === "opened") {
            maximum = Math.max(maximum, ++active);
            if (active === fingerprintReadLimit) occupied.resolve();
            await release.promise;
          } else if (event.phase === "closed") active--;
          assert.ok(event.bytes <= fingerprintChunkBytes);
        },
      });
    for (let index = 0; index < fingerprintReadLimit + fingerprintQueueLimit; index++)
      work.push(run());
    await occupied.promise;
    assert.equal(active, fingerprintReadLimit);
    await assert.rejects(run(), /queue exceeds/u);
    release.resolve();
    const results = await Promise.all(work);
    assert.equal(results.length, fingerprintReadLimit + fingerprintQueueLimit);
    assert.equal(new Set(results).size, 1);
    assert.equal(active, 0);
    assert.equal(maximum, fingerprintReadLimit);
  } finally {
    release.resolve();
    await Promise.allSettled(work);
    await f.close();
  }
});

await test("reader errors release capacity and path revalidation precedes fingerprint publication", async () => {
  const f = await fixture();
  try {
    const path = join(f.root, "input.txt");
    await writeFile(path, "bounded\n", "utf8");
    const expected = await lstat(path, { bigint: true });
    await assert.rejects(fileContentDigest(path, expected, { maximumBytes: 7 }), /bounded/u);
    const errors = await Promise.allSettled(
      Array.from({ length: 8 }, () =>
        fileContentDigest(path, expected, {
          maximumBytes: 8,
          observe(event) {
            if (event.phase === "opened") throw new Error("fixture read failure");
          },
        }),
      ),
    );
    assert.ok(errors.every((result) => result.status === "rejected"));
    let validations = 0;
    await assert.rejects(
      fileContentDigest(path, expected, {
        maximumBytes: 8,
        async validatePath() {
          if (++validations === 2) throw new Error("fixture path was redirected");
        },
      }),
      /redirected/u,
    );
    assert.equal(validations, 2);
    assert.equal(
      await fileContentDigest(path, expected, { maximumBytes: 8 }),
      createHash("sha256").update("bounded\n").digest("hex"),
    );
  } finally {
    await f.close();
  }
});

await test("streamed inventory encoding preserves empty, escaped and complete directory identities", async () => {
  const rows = [
    ["plain", "", ""],
    ['quote"\\\n', "café", "😀"],
  ];
  for (const values of [[], rows]) {
    const digest = inventoryDigest();
    for (const row of values) digest.record(row);
    assert.equal(
      digest.finish(),
      createHash("sha256").update(JSON.stringify(values)).digest("hex"),
    );
    assert.throws(() => digest.record([]), /already complete/u);
    assert.throws(() => digest.finish(), /already complete/u);
  }
  const f = await fixture();
  try {
    await mkdir(join(f.root, "output/sub"), { recursive: true });
    await writeFile(join(f.root, "output/a.txt"), "first\n", "utf8");
    await writeFile(join(f.root, "output/sub/b.txt"), "second\n", "utf8");
    const legacy: string[][] = [
      ["missing", "missing", ""],
      ["output", "directory", ""],
    ];
    for (const name of ["output/a.txt", "output/sub", "output/sub/b.txt"]) {
      const stat = await lstat(join(f.root, name));
      legacy.push(
        stat.isDirectory()
          ? [name, "directory", ""]
          : [
              name,
              process.platform === "win32" ? "file" : String(stat.mode & 0o777),
              createHash("sha256")
                .update(await readFile(join(f.root, name)))
                .digest("hex"),
            ],
      );
    }
    assert.equal(
      await inventory(f.root, ["output", "missing"]),
      createHash("sha256").update(JSON.stringify(legacy)).digest("hex"),
    );
    await assert.rejects(inventory(f.root, ["missing"], true), /missing/u);
  } finally {
    await f.close();
  }
});

await test("bounded metadata reads preserve exact bytes and reject changed opened paths", async () => {
  const f = await fixture();
  try {
    const path = join(f.root, "marker.json");
    const original = new Uint8Array(64 * 1024 + 1).fill(97);
    await writeFile(path, original);
    assert.deepEqual(await boundedRead(f.root, "marker.json", original.length), original);
    for (const maximum of [-1, Infinity, Number.NaN, cacheLimits.outputFileBytes + 1])
      await assert.rejects(boundedRead(f.root, "marker.json", maximum), /read limit/u);
    await assert.rejects(boundedRead(f.root, "marker.json", original.length - 1), /file bounds/u);
    for (const phase of ["before-open", "opened", "read"] as const) {
      await writeFile(path, original);
      let changed = false;
      await assert.rejects(
        boundedRead(f.root, "marker.json", original.length, {
          async observe(event) {
            if (changed || event !== phase) return;
            changed = true;
            await rename(path, join(f.root, `old-${phase}.json`));
            await writeFile(path, original);
          },
        }),
        /changed/u,
      );
      assert.equal(changed, true);
    }
    for (const change of ["grow", "truncate"] as const) {
      await writeFile(path, original);
      let changed = false;
      await assert.rejects(
        boundedRead(f.root, "marker.json", original.length, {
          async observe(event) {
            if (changed || event !== "read") return;
            changed = true;
            if (change === "grow") await appendFile(path, "x");
            else await writeFile(path, "short\n");
          },
        }),
        /changed/u,
      );
    }
    await writeFile(path, "", "utf8");
    assert.deepEqual(await boundedRead(f.root, "marker.json", 0), new Uint8Array());
  } finally {
    await f.close();
  }
});

await test("directory inventory rejects excess queued names before retaining an unbounded listing", async () => {
  const f = await fixture();
  const originalLimit = cacheLimits.files;
  try {
    await mkdir(join(f.root, "output/sub"), { recursive: true });
    for (const file of ["a", "b", "c", "sub/a", "sub/b"])
      await writeFile(join(f.root, "output", file), "bounded\n", "utf8");
    // A small trusted limit exercises the same admission boundary without creating 25,000 files.
    cacheLimits.files = 6;
    await assert.rejects(inventory(f.root, ["output"]), /path bounds/u);
    cacheLimits.files = 7;
    assert.match(await inventory(f.root, ["output"]), /^[a-f0-9]{64}$/u);
  } finally {
    cacheLimits.files = originalLimit;
    await f.close();
  }
});
