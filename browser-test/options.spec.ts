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
    await worker.evaluate(async () => {
      await chrome.storage.local.set({
        themeCompatibility: {
          detected: { "institution-header": 1, "right-rail": 1 },
          nativePreserved: ["Logos and course images"],
          themed: ["institution-header", "right-rail"],
          unsupported: ["Dashboard grid"],
          updatedAt: new Date().toISOString()
        }
      });
    });
    const page = await context.newPage();
    await page.emulateMedia({ colorScheme: "light", reducedMotion: "reduce" });
    await page.goto(`chrome-extension://${extensionId}/options/index.html`);

    await expect(page.getByRole("heading", { level: 1 })).toHaveText(
      "A workspace that feels like yours"
    );
    await expect(page.getByLabel("System font family")).toHaveValue("native");
    await expect(page.getByLabel("Typography scale")).toHaveCount(0);
    await expect(page.getByLabel("Contrast mode")).toHaveValue("automatic");
    await expect(page.getByText("Institution header and primary navigation (1)")).toBeVisible();
    await expect(page.getByText("Logos and course images")).toBeVisible();

    await page.locator("#native-token-link").fill("#ffffff");
    const linkToken = page.locator(".sc-native-token").filter({ hasText: "Links" });
    await expect(linkToken.locator(".sc-token-diagnostic")).toContainText("→");
    await expect(page.getByText(/visibly resolved to meet WCAG AA/)).toBeVisible();

    await page.getByLabel("Contrast mode").selectOption("preserve");
    await expect(page.getByText(/strong contrast warning/)).toBeVisible();
    await expect(linkToken.locator(".sc-token-diagnostic")).not.toContainText("→");

    await page.getByLabel("Contrast mode").selectOption("high-contrast");
    await expect(page.locator(".sc-native-preview-header")).toHaveCSS(
      "background-color",
      "rgb(0, 0, 0)"
    );
    await expect(page.getByText(/complete high-contrast preset is active/)).toBeVisible();

    await page.getByLabel("Contrast mode").selectOption("manual");
    await linkToken.getByRole("button", { name: "Reset Links" }).click();
    await expect(page.locator("#native-token-link")).toHaveValue("#4338ca");
    await expect(page.getByRole("button", { name: "Reset semantic colors" })).toBeVisible();
    await expect(page.getByRole("button", { name: "Reset layout and visibility" })).toBeVisible();

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
