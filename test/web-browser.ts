import { chromium, expect, type Browser, type BrowserContext } from "@playwright/test";
import { Effect } from "effect";
import { mkdir, writeFile } from "node:fs/promises";
import { join, resolve } from "node:path";
import { startDaemon } from "../app/server/index.ts";
import { executeTask } from "../app/adapters/index.ts";
import { createTemporaryWorkspace, temporaryParent } from "../app/check/temporary-workspace.ts";

const root = resolve(import.meta.dir, "..");
const temporary = await createTemporaryWorkspace(
  root,
  "web-browser",
  await temporaryParent(process.env, root),
);
const workspace = join(temporary.path, "workspace");
const evidence = join(root, ".cache/web-evidence");
let daemon: Awaited<ReturnType<typeof startDaemon>> | undefined;
let browser: Browser | undefined;
let context: BrowserContext | undefined;
let startingResource = false;
let operationFailed = false;
let operationFailure: unknown;
const cleanupFailures: unknown[] = [];
try {
  await mkdir(workspace);
  await mkdir(evidence, { recursive: true });
  await writeFile(
    join(workspace, "README.md"),
    "# Browser test workspace\nA deterministic inspection fixture.\n",
  );
  const token = "a".repeat(64);
  startingResource = true;
  daemon = await startDaemon({
    config: { data: join(temporary.path, "service"), port: 0 },
    token,
    webDirectory: join(root, "data/web"),
    execute: (context, signal) =>
      context.claim.task.objective === "Wait for cancellation"
        ? Effect.promise(
            () =>
              new Promise<void>((done, reject) => {
                const timer = setTimeout(done, 60000);
                signal.addEventListener(
                  "abort",
                  () => {
                    clearTimeout(timer);
                    reject(new Error("Cancelled fixture"));
                  },
                  { once: true },
                );
              }),
          )
        : executeTask(context, signal),
  });
  browser = await chromium.launch({ headless: true, env: temporary.environment() });
  startingResource = false;
  context = await browser.newContext({
    viewport: { width: 1440, height: 960 },
    reducedMotion: "reduce",
  });
  const errors: string[] = [];
  const page = await context.newPage();
  page.on("pageerror", (error) => errors.push(error.message));
  await context.tracing.start({ screenshots: true, snapshots: true, sources: false });
  await page.goto(daemon.url, { waitUntil: "networkidle" });
  await expect(page.getByRole("heading", { name: "Your work, under control." })).toBeVisible();
  await page.getByLabel("Access token").fill("wrong-token-0000000000000000000000000000");
  await page.getByRole("button", { name: "Connect to workspace" }).click();
  await expect(page.getByRole("alert")).toContainText("Connection was refused");
  await page.getByLabel("Access token").fill(token);
  await page.getByRole("button", { name: "Connect to workspace" }).click();
  await expect(page.getByRole("heading", { name: "All tasks" })).toBeVisible();
  await expect(page.getByText("A clear place to start.")).toBeVisible();
  await page.getByRole("button", { name: "Add a workspace", exact: true }).click();
  await page.getByLabel("Name", { exact: true }).fill("Browser workspace");
  await page.getByLabel("Absolute folder path").fill(workspace);
  await page
    .getByRole("dialog")
    .getByRole("button", { name: "Add workspace", exact: true })
    .click();
  await expect(page.getByRole("dialog")).toBeHidden();
  await page.getByRole("button", { name: "+ New task" }).click();
  await page
    .getByLabel("What should the agent do?")
    .fill("Inspect this workspace <script>alert('escaped')</script>");
  await page.getByLabel("Agent", { exact: true }).selectOption("inspect");
  await expect(page.getByLabel("Allow changes inside this workspace")).not.toBeChecked();
  await page.getByRole("button", { name: "Start task" }).click();
  await expect(page.getByRole("region", { name: "Task details" })).toBeVisible();
  await expect(
    page.getByRole("region", { name: "Task details" }).getByText("Completed", { exact: true }),
  ).toBeVisible({ timeout: 15000 });
  await expect(page.locator(".artifact-button")).toHaveCount(1);
  await expect(page.locator(".event-list li")).not.toHaveCount(0);
  await page.locator(".artifact-button").click();
  await expect(page.locator(".artifact-preview")).toContainText("README.md");
  await page.getByRole("button", { name: "Close dialog" }).click();
  await page.screenshot({ path: join(evidence, "desktop.png"), fullPage: true });
  await writeFile(join(evidence, "accessibility.yml"), await page.locator("body").ariaSnapshot());
  await page.setViewportSize({ width: 390, height: 844 });
  await page.screenshot({ path: join(evidence, "narrow.png"), fullPage: true });
  const body = await page.locator("body").boundingBox();
  expect(body?.width).toBeLessThanOrEqual(390);
  await expect(page.getByRole("button", { name: "+ New task" })).toBeVisible();
  await page.setViewportSize({ width: 1440, height: 960 });
  await page.getByRole("button", { name: "+ New task" }).click();
  await page.getByLabel("What should the agent do?").fill("Wait for cancellation");
  await page.getByLabel("Agent", { exact: true }).selectOption("inspect");
  await page.getByRole("button", { name: "Start task" }).click();
  await expect(
    page.getByRole("region", { name: "Task details" }).getByText("Running", { exact: true }),
  ).toBeVisible({ timeout: 15000 });
  await page.getByRole("button", { name: "Cancel task", exact: true }).click();
  await expect(
    page.getByRole("region", { name: "Task details" }).getByText("Cancelled", { exact: true }),
  ).toBeVisible({ timeout: 15000 });
  await page.getByRole("button", { name: "Agents", exact: false }).click();
  await expect(page.getByRole("heading", { name: "Your agents" })).toBeVisible();
  await expect(page.getByText("Tool control").first()).toBeVisible();
  await page.getByRole("button", { name: "Disconnect", exact: true }).click();
  await expect(page.getByLabel("Access token")).toHaveValue("");
  await page.reload();
  await expect(page.getByLabel("Access token")).toHaveValue("");
  await page.getByLabel("Access token").fill(token);
  await page.getByRole("button", { name: "Connect to workspace" }).click();
  await expect(page.locator(".task-row")).toHaveCount(2);
  expect(errors).toEqual([]);
  await context.tracing.stop({ path: join(evidence, "trace.zip") });
  process.stdout.write(
    `Browser workflow passed with ${browser.version()}. Evidence: .cache/web-evidence\n`,
  );
} catch (error) {
  operationFailed = true;
  operationFailure = error;
} finally {
  // Closing later owners must still run if an earlier close fails.
  for (const close of [() => context?.close(), () => browser?.close(), () => daemon?.close()]) {
    try {
      await close();
    } catch (error) {
      cleanupFailures.push(error);
    }
  }
  if (startingResource)
    cleanupFailures.push(
      new Error("Browser setup did not establish resource shutdown; scratch was retained."),
    );
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
    "Browser resource cleanup failed; scratch was retained.",
  );
if (operationFailed) throw operationFailure;
