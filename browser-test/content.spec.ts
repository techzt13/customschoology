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
  const home = await readFile("test/fixtures/browser-schoology.html", "utf8");
  const assessment = await readFile("test/fixtures/browser-assessment.html", "utf8");
  const { context } = await extensionContext(testInfo.outputPath("profile"));
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

    const recentTab = page.locator("#recent-tab");
    await expect(recentTab).toHaveClass(/sc-native-auto-contrast/);
    const rootFontSize = await page
      .locator("html")
      .evaluate((element) => getComputedStyle(element).fontSize);
    expect(rootFontSize).toBe("16px");

    await page.locator("#header").evaluate((header) => {
      const wrapper = document.createElement("div");
      wrapper.style.background = "rgb(250, 250, 250)";
      const tab = document.createElement("a");
      tab.id = "dynamic-tab";
      tab.role = "tab";
      tab.style.color = "white";
      tab.textContent = "New tab";
      wrapper.append(tab);
      header.append(wrapper);
    });
    await expect(page.locator("#dynamic-tab")).toHaveClass(/sc-native-auto-contrast/);

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
