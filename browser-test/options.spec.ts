import AxeBuilder from "@axe-core/playwright";
import { chromium, expect, test } from "@playwright/test";
import { resolve } from "node:path";

test("options loads accessibly and supports local grade scenarios", async ({}, testInfo) => {
  const extensionPath = resolve("dist");
  const context = await chromium.launchPersistentContext(testInfo.outputPath("profile"), {
    args: [`--disable-extensions-except=${extensionPath}`, `--load-extension=${extensionPath}`],
    channel: "chromium",
    headless: true
  });

  try {
    const worker = context.serviceWorkers()[0] ?? (await context.waitForEvent("serviceworker"));
    const extensionId = new URL(worker.url()).host;
    const page = await context.newPage();
    await page.emulateMedia({ colorScheme: "light", reducedMotion: "reduce" });
    await page.goto(`chrome-extension://${extensionId}/options/index.html`);

    await expect(page.getByRole("heading", { level: 1 })).toHaveText(
      "A workspace that feels like yours"
    );
    await expect(page.getByLabel("System font family")).toHaveValue("native");
    await expect(page.getByLabel("Typography scale")).toHaveCount(0);

    await page.getByLabel("Scenario name").fill("Final project");
    await page.getByLabel("Current points earned").fill("80");
    await page.getByLabel("Current points possible").fill("100");
    await page.getByLabel("Hypothetical score").fill("20");
    await page.getByLabel("Hypothetical points possible").fill("20");
    await page.getByLabel("Target percentage").fill("85");
    await page.getByRole("button", { name: "Add scenario" }).click();
    await expect(page.getByRole("heading", { name: "Final project" })).toBeVisible();
    await expect(page.getByText(/Projected 83\.33%/)).toBeVisible();

    const results = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa"]).analyze();
    expect(results.violations).toEqual([]);
  } finally {
    await context.close();
  }
});
