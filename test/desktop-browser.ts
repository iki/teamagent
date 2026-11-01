import { chromium, expect, type Browser } from "@playwright/test";
import { Database } from "bun:sqlite";
import { Schema } from "effect";
import { mkdir, writeFile } from "node:fs/promises";
import { createServer } from "node:net";
import { join, resolve } from "node:path";
import { spawnOwned, type OwnedProcess } from "../app/check/owned-process.ts";
import { createTemporaryWorkspace, temporaryParent } from "../app/check/temporary-workspace.ts";

function daemonOwner(directory: string): unknown {
  const database = new Database(join(directory, "daemon.sqlite"), { readonly: true, strict: true });
  try {
    const row: unknown = database.query("SELECT pid,nonce FROM owner WHERE singleton = 1").get();
    return row;
  } finally {
    database.close();
  }
}

async function withTimeout<A>(work: Promise<A>, milliseconds: number): Promise<A> {
  let timer: ReturnType<typeof setTimeout> | undefined;
  try {
    return await Promise.race([
      work,
      new Promise<never>((_, reject) => {
        timer = setTimeout(
          () => reject(new Error("Native shutdown exceeded its time limit.")),
          milliseconds,
        );
      }),
    ]);
  } finally {
    clearTimeout(timer);
  }
}

if (process.platform !== "win32")
  throw new Error("This smoke runner targets the Windows WebView2 integration.");
const root = resolve(import.meta.dir, "..");
const temporary = await createTemporaryWorkspace(
  root,
  "desktop-browser",
  await temporaryParent(process.env, root),
);
const data = join(temporary.path, "service");
const workspace = join(temporary.path, "workspace");
const socket = createServer();
let owned: OwnedProcess | undefined;
let browser: Browser | undefined;
let operationFailed = false;
let operationFailure: unknown;
const cleanupFailures: unknown[] = [];
try {
  await mkdir(workspace);
  const evidence = join(root, ".cache/web-evidence");
  await mkdir(evidence, { recursive: true });
  const configuration = join(temporary.path, "teamagent.config.ts");
  await writeFile(
    configuration,
    'export default { pi: { provider: "openai", model: "gpt-4.1" } } satisfies Record<string, unknown>;\n',
  );
  await new Promise<void>((done, reject) => {
    socket.once("error", reject);
    socket.listen(0, "127.0.0.1", done);
  });
  const address = socket.address();
  if (!address || typeof address === "string") throw new Error("Could not reserve a debug port.");
  const port = address.port;
  await new Promise<void>((done, reject) =>
    socket.close((error) => (error ? reject(error) : done())),
  );
  owned = await spawnOwned(
    join(root, "app/desktop/src-tauri/target/debug/teamagent-desktop.exe"),
    [],
    {
      cwd: root,
      stdio: "pipe",
      env: temporary.environment({
        ...process.env,
        TEAMAGENT_DESKTOP_SMOKE_DATA: data,
        TEAMAGENT_CONFIG: configuration,
        OPENAI_API_KEY: "native-catalog-test-key-no-network-calls",
        WEBVIEW2_ADDITIONAL_BROWSER_ARGUMENTS: `--remote-debugging-port=${port}`,
      }),
    },
  );
  const child = owned.child;
  if (!child.stdin || !child.stdout || !child.stderr)
    throw new Error("Native process streams are unavailable.");
  child.stdout.resume();
  let streamFailure: Error | undefined;
  child.stdin.on("error", (error) => {
    streamFailure = error;
  });
  let diagnostic = "";
  child.stderr.on("data", (chunk: unknown) => {
    if (Buffer.isBuffer(chunk)) diagnostic = `${diagnostic}${chunk.toString()}`.slice(-4096);
  });
  const exited = owned.closed;
  let serviceUrl = "";
  for (let attempt = 0; attempt < 100; attempt++) {
    if (child.exitCode !== null)
      throw new Error(`Desktop exited before its WebView became available: ${diagnostic}`);
    try {
      browser = await chromium.connectOverCDP(`http://127.0.0.1:${port}`, { timeout: 1000 });
      break;
    } catch {
      await new Promise<void>((done) => setTimeout(done, 200));
    }
  }
  if (!browser) throw new Error(`Desktop WebView2 did not become available: ${diagnostic}`);
  const context = browser.contexts()[0];
  if (!context) throw new Error("Desktop browser context is unavailable.");
  let page = context.pages()[0];
  if (!page) page = await context.waitForEvent("page", { timeout: 15000 });
  page.on("request", (request) => {
    if (request.url().includes("/api/tasks")) serviceUrl = new URL(request.url()).origin;
  });
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await expect(page.getByRole("heading", { name: "All tasks" })).toBeVisible({ timeout: 20000 });
  await expect(page.getByText("Service connected")).toBeVisible();
  Schema.decodeUnknownSync(
    Schema.Struct({
      pid: Schema.Int.check(Schema.isGreaterThan(0)),
      nonce: Schema.String.check(Schema.isPattern(/^[a-f0-9]{32}$/u)),
    }),
  )(daemonOwner(data));
  await page.getByRole("button", { name: "Agents", exact: false }).click();
  await expect(
    page
      .locator(".agent-card")
      .filter({ has: page.getByRole("heading", { name: "Pi agent", exact: true }) })
      .getByText("Available", { exact: true }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Tasks", exact: false }).click();
  await page.getByRole("button", { name: "Add a workspace", exact: true }).click();
  await page.getByLabel("Name", { exact: true }).fill("Native workspace");
  await page.getByLabel("Absolute folder path").fill(workspace);
  await page
    .getByRole("dialog")
    .getByRole("button", { name: "Add workspace", exact: true })
    .click();
  await expect(page.getByRole("heading", { name: "Native workspace" })).toBeVisible();
  await page.getByRole("button", { name: "+ New task" }).click();
  await page.getByLabel("What should the agent do?").fill("Inspect the native test workspace");
  await page.getByLabel("Agent", { exact: true }).selectOption("inspect");
  await page.getByRole("button", { name: "Start task" }).click();
  await expect(
    page.getByRole("region", { name: "Task details" }).getByText("Completed", { exact: true }),
  ).toBeVisible({ timeout: 15000 });
  await page.screenshot({ path: join(evidence, "native-webview2.png") });
  await page.getByRole("button", { name: "Disconnect", exact: true }).click();
  await page.getByRole("button", { name: "Reconnect local service", exact: true }).click();
  await expect(page.getByRole("heading", { name: "All tasks" })).toBeVisible();
  await expect(page.locator(".task-row")).toHaveCount(1);
  expect(errors).toEqual([]);
  const version = browser.version();
  await browser.close();
  browser = undefined;
  child.stdin.end("shutdown\n");
  const result = await withTimeout(exited, 10000);
  if (streamFailure) throw streamFailure;
  if (result.error) throw result.error;
  expect(result.code).toBe(0);
  expect(result.termination).toBe("closed");
  // Only daemon.close() releases this row; forced Job Object cleanup cannot fake it.
  Schema.decodeUnknownSync(Schema.Null)(daemonOwner(data));
  expect(serviceUrl).not.toBe("");
  await expect(
    fetch(`${serviceUrl}/api/health`, { signal: AbortSignal.timeout(1000) }),
  ).rejects.toThrow();
  process.stdout.write(`Native WebView2 workflow and managed shutdown passed with ${version}.\n`);
} catch (error) {
  operationFailed = true;
  operationFailure = error;
} finally {
  if (browser) {
    try {
      await browser.close();
    } catch (error) {
      cleanupFailures.push(error);
    }
  }
  if (owned) {
    const child = owned.child;
    if (child.exitCode === null) {
      try {
        if (child.stdin && !child.stdin.writableEnded && !child.stdin.destroyed)
          child.stdin.end("shutdown\n");
        await withTimeout(owned.closed, 5000);
      } catch {
        try {
          await owned.stop("Native smoke shutdown exceeded its grace period");
        } catch (error) {
          cleanupFailures.push(error);
        }
      }
    }
    const result = await owned.closed;
    if (result.termination !== "closed")
      cleanupFailures.push(new Error("Native descendant shutdown could not be confirmed."));
  }
  if (socket.listening) {
    try {
      await new Promise<void>((done, reject) =>
        socket.close((error) => (error ? reject(error) : done())),
      );
    } catch (error) {
      cleanupFailures.push(error);
    }
  }
  if (!cleanupFailures.length) {
    try {
      await temporary.dispose();
    } catch (error) {
      cleanupFailures.push(error);
    }
  }
}
if (cleanupFailures.length)
  throw new AggregateError(
    operationFailed ? [operationFailure, ...cleanupFailures] : cleanupFailures,
    "Native resource cleanup failed; scratch was retained.",
  );
if (operationFailed) throw operationFailure;
