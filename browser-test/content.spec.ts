import { chromium, expect, test, type BrowserContext } from "@playwright/test";
import { readFile } from "node:fs/promises";
import { resolve } from "node:path";

async function extensionContext(profile: string): Promise<{
  context: BrowserContext;
  extensionId: string;
}> {
  const extensionPath = resolve("dist");
  const context = await chromium.launchPersistentContext(profile, {
    args: [`--disable-extensions-except=${extensionPath}`, `--load-extension=${extensionPath}`],
    channel: "chromium",
    headless: true
  });
  const worker = context.serviceWorkers()[0] ?? (await context.waitForEvent("serviceworker"));
  return { context, extensionId: new URL(worker.url()).host };
}

test("content script preserves native geometry and enhances supported workflows", async ({}, testInfo) => {
  test.setTimeout(90_000);
  const home = await readFile("test/fixtures/browser-schoology.html", "utf8");
  const assessment = await readFile("test/fixtures/browser-assessment.html", "utf8");
  const { context, extensionId } = await extensionContext(testInfo.outputPath("profile"));
  await context.route("https://example.schoology.com/**", async (route) => {
    await route.fulfill({
      body: route.request().url().includes("/assessment/") ? assessment : home,
      contentType: "text/html",
      status: 200
    });
  });

  try {
    const page = await context.newPage();
    await page.goto("https://example.schoology.com/home");
    const companion = page.locator("#schoology-companion-root");
    await expect(companion.getByRole("button", { name: /Open Today panel/ })).toBeVisible();
    await companion.getByRole("button", { name: /Open Today panel/ }).click();
    await expect(companion.getByRole("heading", { name: "Today" })).toBeVisible();
    await expect(companion.getByRole("link", { name: "Reflection" })).toBeVisible();
    await expect(page.getByRole("button", { name: "Plan Reflection in Today" })).toBeVisible();

    await expect(page.locator("#header")).toHaveAttribute("data-sc-region", "institution-header");
    await expect(page.locator(".tabs")).toHaveAttribute("data-sc-region", "dashboard-tabs");
    await expect(page.locator(".course-dashboard")).toHaveAttribute(
      "data-sc-region",
      "dashboard-grid"
    );
    await expect(page.locator(".course-card")).toHaveAttribute("data-sc-region", "course-card");
    await expect(page.locator("#right-column")).toHaveAttribute("data-sc-region", "right-rail");
    await expect(page.locator("#recent-tab")).toHaveAttribute("data-sc-theme-role", "tab-inactive");
    await expect(page.locator("#dashboard-tab")).toHaveAttribute(
      "data-sc-theme-role",
      "tab-active"
    );
    await expect(page.locator("#header")).toHaveCSS("background-color", "rgb(38, 50, 71)");
    await expect(page.locator("body")).toHaveCSS("background-color", "rgb(244, 246, 250)");
    await expect(page.locator("#header img")).not.toHaveAttribute("data-sc-theme-role");
    const rootFontSize = await page
      .locator("html")
      .evaluate((element) => getComputedStyle(element).fontSize);
    expect(rootFontSize).toBe("16px");

    await page.locator(".tabs").evaluate((tabs) => {
      const tab = document.createElement("a");
      tab.id = "dynamic-tab";
      tab.role = "tab";
      tab.setAttribute("aria-selected", "false");
      tab.style.color = "white";
      tab.textContent = "New tab";
      tabs.append(tab);
    });
    await expect(page.locator("#dynamic-tab")).toHaveAttribute(
      "data-sc-theme-role",
      "tab-inactive"
    );
    await expect(page.locator("#dynamic-tab")).toHaveCSS("color", "rgb(71, 85, 105)");

    const worker = context.serviceWorkers()[0]!;
    await worker.evaluate(async () => {
      const stored = await chrome.storage.local.get("settings");
      const settings = stored.settings as {
        coursePreferences: Record<string, unknown>;
      };
      settings.coursePreferences["42"] = {
        accent: "#123456",
        favorite: true,
        hidden: false,
        nickname: "Bio",
        order: 2,
        quickLinks: [
          {
            label: "Lab notes",
            url: "https://example.schoology.com/courses/42/materials"
          }
        ]
      };
      await chrome.storage.local.set({ settings });
    });
    await expect(page.getByRole("link", { name: "Lab notes" })).toBeVisible();
    await expect(page.locator(".course-card")).toHaveCSS("order", "2");

    const compatibility = await worker.evaluate(async () => {
      const stored = await chrome.storage.local.get("themeCompatibility");
      return stored.themeCompatibility as {
        nativePreserved: string[];
        themed: string[];
        unsupported: string[];
      };
    });
    expect(compatibility.themed).toEqual(
      expect.arrayContaining([
        "institution-header",
        "dashboard-tabs",
        "dashboard-grid",
        "course-card",
        "right-rail"
      ])
    );
    expect(compatibility.nativePreserved).toContain("Logos and course images");

    const screenshot = await page.screenshot({
      fullPage: true,
      path: testInfo.outputPath("full-shell-theme.png")
    });
    expect(screenshot.byteLength).toBeGreaterThan(1_000);
    await page.setViewportSize({ height: 900, width: 640 });
    const narrowScreenshot = await page.screenshot({
      fullPage: true,
      path: testInfo.outputPath("full-shell-theme-narrow.png")
    });
    expect(narrowScreenshot.byteLength).toBeGreaterThan(1_000);
    const options = await context.newPage();
    await options.goto(`chrome-extension://${extensionId}/options/index.html`);
    for (const preset of [
      { header: "rgb(38, 50, 71)", name: "Clear Horizon", radius: "10px" },
      { header: "rgb(11, 17, 32)", name: "Midnight Study", radius: "18px" },
      { header: "rgb(0, 0, 0)", name: "Signal Light", radius: "4px" },
      { header: "rgb(134, 25, 143)", name: "Electric Berry", radius: "18px" },
      { header: "rgb(30, 41, 59)", name: "Slate Sprint", radius: "4px" }
    ]) {
      await options.getByRole("radio", { name: new RegExp(preset.name) }).check();
      await options.getByRole("button", { name: "Apply selected preset" }).click();
      await expect(options.getByText(`Applied preset: ${preset.name}`)).toBeVisible();
      await expect(page.locator("#header")).toHaveCSS("background-color", preset.header);
      await expect(page.locator(".course-card")).toHaveCSS("border-radius", preset.radius);
      await page.setViewportSize({ height: 900, width: 1280 });
      const full = await page.screenshot({
        fullPage: true,
        path: testInfo.outputPath(`${preset.name.toLowerCase().replaceAll(" ", "-")}-full.png`)
      });
      expect(full.byteLength).toBeGreaterThan(1_000);
      await page.setViewportSize({ height: 900, width: 640 });
      const narrow = await page.screenshot({
        fullPage: true,
        path: testInfo.outputPath(`${preset.name.toLowerCase().replaceAll(" ", "-")}-narrow.png`)
      });
      expect(narrow.byteLength).toBeGreaterThan(1_000);
    }
    await options.close();

    await worker.evaluate(async () => {
      const stored = await chrome.storage.local.get("settings");
      const settings = stored.settings as {
        nativeCustomization: { contrastMode: string };
      };
      settings.nativeCustomization.contrastMode = "high-contrast";
      await chrome.storage.local.set({ settings });
    });
    await expect(page.locator("#header")).toHaveCSS("background-color", "rgb(0, 0, 0)");

    await worker.evaluate(async () => {
      const stored = await chrome.storage.local.get("settings");
      const settings = stored.settings as {
        nativeCustomization: { enabled: boolean };
      };
      settings.nativeCustomization.enabled = false;
      await chrome.storage.local.set({ settings });
    });
    await expect(page.locator("#header")).not.toHaveAttribute("data-sc-region");
    await expect(page.locator("html")).not.toHaveClass(/sc-native-customized/);
    await expect(page.locator("#schoology-companion-native-theme")).toHaveCount(0);

    await page.goto("https://example.schoology.com/assessment/9");
    await page.locator("#assessment-form").evaluate((form) => {
      form.addEventListener("submit", (event) => {
        if (!event.defaultPrevented) form.setAttribute("data-submitted", "true");
        event.preventDefault();
      });
    });
    await page.getByRole("button", { name: "Submit assessment" }).click();
    const warning = page.locator("#schoology-companion-assessment-warning");
    await expect(warning).toBeVisible();
    await expect(warning).toContainText("2 of 2 detected questions are unanswered");
    await page.getByRole("button", { name: "Submit anyway" }).click();
    await expect(page.locator("#assessment-form")).toHaveAttribute("data-submitted", "true");
  } finally {
    await context.close();
  }
});
