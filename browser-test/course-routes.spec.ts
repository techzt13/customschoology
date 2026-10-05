import AxeBuilder from "@axe-core/playwright";
import { chromium, expect, test, type BrowserContext, type Page } from "@playwright/test";
import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import { DEFAULT_SETTINGS, type NativePresetId } from "../src/shared/models";
import { NATIVE_THEME_PRESETS } from "../src/schoology/customization/presets";

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

async function applyPreset(context: BrowserContext, id: NativePresetId): Promise<void> {
  const preset = NATIVE_THEME_PRESETS.find((candidate) => candidate.id === id);
  if (!preset) throw new Error(`Unknown preset ${id}`);
  const customization = {
    ...DEFAULT_SETTINGS.nativeCustomization,
    ...structuredClone(preset.snapshot),
    presetId: preset.id
  };
  await context.serviceWorkers()[0]!.evaluate(
    async ({ defaults, nextCustomization }) => {
      const stored = await chrome.storage.local.get("settings");
      const settings = (stored.settings ?? defaults) as Record<string, unknown>;
      settings.nativeCustomization = nextCustomization;
      await chrome.storage.local.set({ settings });
    },
    { defaults: DEFAULT_SETTINGS, nextCustomization: customization }
  );
  await expect
    .poll(() =>
      context.serviceWorkers()[0]!.evaluate(async () => {
        const stored = await chrome.storage.local.get("settings");
        return (stored.settings as { nativeCustomization?: { presetId?: string } } | undefined)
          ?.nativeCustomization?.presetId;
      })
    )
    .toBe(id);
}

interface ContrastEntry {
  autoForeground: string;
  background: string;
  color: string;
  ratio: number;
  region: string;
  text: string;
}

async function contrastReport(page: Page, selector: string): Promise<ContrastEntry[]> {
  return page.locator(selector).evaluateAll((elements) => {
    type Rgba = [number, number, number, number];
    const parse = (value: string): Rgba | null => {
      const parts = value.match(/[\d.]+/g)?.map(Number) ?? [];
      return parts.length >= 3
        ? [parts[0]!, parts[1]!, parts[2]!, Math.min(1, Math.max(0, parts[3] ?? 1))]
        : null;
    };
    const composite = (foreground: Rgba, background: Rgba): Rgba => {
      const alpha = foreground[3] + background[3] * (1 - foreground[3]);
      if (alpha === 0) return [0, 0, 0, 0];
      return [
        (foreground[0] * foreground[3] + background[0] * background[3] * (1 - foreground[3])) /
          alpha,
        (foreground[1] * foreground[3] + background[1] * background[3] * (1 - foreground[3])) /
          alpha,
        (foreground[2] * foreground[3] + background[2] * background[3] * (1 - foreground[3])) /
          alpha,
        alpha
      ];
    };
    const backgroundFor = (element: Element): Rgba => {
      let result: Rgba = [0, 0, 0, 0];
      let current: Element | null = element;
      while (current) {
        const layer = parse(getComputedStyle(current).backgroundColor);
        if (layer) result = composite(result, layer);
        if (result[3] >= 0.999) break;
        current = current.parentElement;
      }
      return result[3] >= 0.999 ? result : composite(result, [255, 255, 255, 1]);
    };
    const luminance = (color: Rgba): number => {
      const channels = color.slice(0, 3).map((channel) => {
        const normalized = channel / 255;
        return normalized <= 0.04045 ? normalized / 12.92 : ((normalized + 0.055) / 1.055) ** 2.4;
      });
      return 0.2126 * channels[0]! + 0.7152 * channels[1]! + 0.0722 * channels[2]!;
    };
    return elements
      .filter((element) => element.textContent?.trim())
      .flatMap((element) => {
        const foreground = parse(getComputedStyle(element).color);
        if (!foreground) return [];
        const background = backgroundFor(element);
        const values = [luminance(foreground), luminance(background)].sort(
          (left, right) => right - left
        );
        return [
          {
            autoForeground: getComputedStyle(element).getPropertyValue("--sc-native-auto-fg"),
            background: getComputedStyle(element).backgroundColor,
            color: getComputedStyle(element).color,
            ratio: (values[0]! + 0.05) / (values[1]! + 0.05),
            region:
              element.closest<HTMLElement>("[data-sc-region]")?.dataset.scRegion ?? "unscoped",
            text: element.textContent?.trim().slice(0, 80) ?? ""
          }
        ];
      });
  });
}

test("course routes keep authored content readable and modernize the complete shell", async ({}, testInfo) => {
  test.setTimeout(180_000);
  const fixture = await readFile("test/fixtures/browser-course-routes.html", "utf8");
  const { context } = await extensionContext(testInfo.outputPath("profile"));
  await context.route("https://example.schoology.com/**", (route) =>
    route.fulfill({ body: fixture, contentType: "text/html; charset=utf-8", status: 200 })
  );

  const routes = [
    { name: "course", path: "/course/42" },
    { name: "materials", path: "/course/42/materials" },
    { name: "material", path: "/course/42/materials/7" },
    { name: "assignment", path: "/assignment/101" },
    { name: "page", path: "/page/7" },
    { name: "grades-overview", path: "/grades/grades" },
    { name: "student-grades", path: "/course/42/student_grades" },
    { name: "assessment", path: "/assignment/9/assessment" }
  ] as const;

  try {
    const page = await context.newPage();
    await page.setViewportSize({ height: 900, width: 1440 });
    await page.goto("https://example.schoology.com/course/42/materials");
    await expect(page.locator("html")).toHaveClass(/sc-native-customized/);
    await applyPreset(context, "midnight-study");

    for (const route of routes) {
      await page.setViewportSize({ height: 900, width: 1440 });
      await page.goto(`https://example.schoology.com${route.path}`);
      await expect(page.locator("html")).toHaveClass(/sc-native-customized/);
      await expect(page.locator("body")).toHaveCSS("background-color", "rgb(15, 23, 42)");
      await expect(page.locator("body")).toHaveAttribute("data-sc-route");
      await expect(page.locator("#main-content-wrapper")).toHaveAttribute(
        "data-sc-region",
        "course-shell"
      );
      await expect(page.locator("#sidebar-left")).toHaveAttribute(
        "data-sc-region",
        "course-sidebar"
      );
      await expect(page.locator("#left-nav")).toHaveAttribute(
        "data-sc-region",
        "course-navigation"
      );
      await expect(page.locator("#center-top .content-top-upper")).toHaveAttribute(
        "data-sc-region",
        "course-header"
      );
      await expect(page.locator("#main-inner")).toHaveAttribute("data-sc-region", "course-main");
      await expect(page.locator("#right-column")).toBeVisible();
      await expect(page.locator("#right-column-inner")).toBeVisible();
      await expect(page.locator(".page-title")).toBeVisible();
      await expect(page.getByRole("button", { name: "Course actions" })).toBeVisible();
      const headerGeometry = await page
        .locator("#header .native-header-control")
        .evaluateAll((elements) =>
          elements.map((element) => ({
            height: element.getBoundingClientRect().height,
            text: element.textContent?.trim() ?? "",
            width: element.getBoundingClientRect().width
          }))
        );
      expect(headerGeometry).toHaveLength(4);
      expect(
        headerGeometry.every(({ height, text, width }) => height <= 64 && width > 0 && text)
      ).toBe(true);

      const shell = await page.evaluate(() => {
        const body = getComputedStyle(document.body).backgroundColor;
        const wrapper = getComputedStyle(document.querySelector("#wrapper")!).backgroundColor;
        const canvas = getComputedStyle(document.querySelector("#body")!).backgroundColor;
        const outer = document.elementFromPoint(innerWidth - 2, 200);
        const rail = document.querySelector("#right-column")!.getBoundingClientRect();
        const main = document.querySelector("#main-content-wrapper")!.getBoundingClientRect();
        return {
          body,
          canvas,
          mainRightGap: innerWidth - main.right,
          outer: outer ? getComputedStyle(outer).backgroundColor : "",
          railRightGap: innerWidth - rail.right,
          wrapper
        };
      });
      expect(shell.body).not.toBe("rgb(255, 255, 255)");
      expect(shell.wrapper).toBe(shell.body);
      expect(shell.canvas).toBe(shell.body);
      expect(shell.outer).not.toBe("rgb(255, 255, 255)");
      expect(shell.mainRightGap).toBeLessThanOrEqual(1);
      expect(shell.railRightGap).toBeLessThanOrEqual(24);

      const interfaceRatios = await contrastReport(
        page,
        "#sidebar-left a, #center-top .page-title, #right-column h3, #right-column a"
      );
      expect(interfaceRatios.length).toBeGreaterThan(4);
      for (const entry of interfaceRatios) {
        expect(entry.ratio, JSON.stringify(entry)).toBeGreaterThanOrEqual(4.5);
      }

      const authored = page.locator('[data-sc-region="authored-content"]');
      if ((await authored.count()) > 0) {
        await expect(authored.first()).toHaveCSS("background-color", "rgb(255, 255, 255)");
        expect(
          await authored.evaluateAll((elements) =>
            elements.some((element) => element.hasAttribute("data-sc-course-surface-rollback"))
          )
        ).toBe(false);
        if (route.name === "material") {
          await expect(page.locator("#failing-author-color")).toHaveClass(
            /sc-native-auto-contrast/
          );
        }
        const authoredRatios = await contrastReport(
          page,
          '[data-sc-region="authored-content"], [data-sc-region="authored-content"] :is(h1,h2,h3,p,li,a,span,div)'
        );
        for (const entry of authoredRatios) {
          expect(entry.ratio, JSON.stringify(entry)).toBeGreaterThanOrEqual(4.5);
        }
        const overflow = await authored.evaluateAll((elements) =>
          elements.some((element) => element.scrollWidth > element.clientWidth + 1)
        );
        expect(overflow).toBe(false);
      }

      await page.locator("#left-nav a").first().focus();
      await page.keyboard.press("Tab");
      await expect(page.locator("#left-nav a").nth(1)).toBeFocused();
      await expect(page.locator("#left-nav a").nth(1)).toHaveCSS("outline-style", "solid");
      await page.evaluate(() => (document.activeElement as HTMLElement | null)?.blur());

      await expect
        .poll(() =>
          context.serviceWorkers()[0]!.evaluate(async () => {
            const stored = await chrome.storage.local.get("themeCompatibility");
            return (stored.themeCompatibility as { routeStatus?: string } | undefined)?.routeStatus;
          })
        )
        .toBe("Available");
      await expect
        .poll(() =>
          context.serviceWorkers()[0]!.evaluate(async () => {
            const stored = await chrome.storage.local.get("themeCompatibility");
            return (stored.themeCompatibility as { surfaceWarning?: string } | undefined)
              ?.surfaceWarning;
          })
        )
        .toBeUndefined();

      if (route.name === "assessment") {
        await expect(page.getByRole("button", { name: "Submit assessment" })).toHaveCSS(
          "min-height",
          "40px"
        );
      }

      const accessibility = await new AxeBuilder({ page })
        .withTags(["wcag2a", "wcag2aa"])
        .analyze();
      expect(accessibility.violations).toEqual([]);

      const full = await page.screenshot({
        fullPage: true,
        path: testInfo.outputPath(`${route.name}-full.png`)
      });
      expect(full.byteLength).toBeGreaterThan(1_000);

      await page.setViewportSize({ height: 900, width: 640 });
      await expect(page.locator("#sidebar-left")).toBeVisible();
      await expect(page.locator("#right-column")).toBeVisible();
      const narrowGeometry = await page.evaluate(() => {
        const sidebar = document.querySelector("#sidebar-left")!.getBoundingClientRect();
        const center = document.querySelector("#center")!.getBoundingClientRect();
        const rail = document.querySelector("#right-column")!.getBoundingClientRect();
        return { centerWidth: center.width, railWidth: rail.width, sidebarWidth: sidebar.width };
      });
      expect(narrowGeometry.sidebarWidth).toBeGreaterThanOrEqual(580);
      expect(narrowGeometry.centerWidth).toBeGreaterThanOrEqual(580);
      expect(narrowGeometry.railWidth).toBeGreaterThanOrEqual(580);
      const narrow = await page.screenshot({
        fullPage: true,
        path: testInfo.outputPath(`${route.name}-narrow.png`)
      });
      expect(narrow.byteLength).toBeGreaterThan(1_000);

      await page.setViewportSize({ height: 450, width: 720 });
      await expect(page.locator("#right-column")).toBeVisible();
      const zoom = await page.screenshot({
        fullPage: true,
        path: testInfo.outputPath(`${route.name}-200-percent-zoom-equivalent.png`)
      });
      expect(zoom.byteLength).toBeGreaterThan(1_000);
    }

    for (const preset of [
      "clear-horizon",
      "midnight-study",
      "signal-light",
      "electric-berry",
      "slate-sprint"
    ] as const) {
      await applyPreset(context, preset);
      await page.setViewportSize({ height: 900, width: 1280 });
      await page.goto("https://example.schoology.com/course/42/materials");
      const full = await page.screenshot({
        fullPage: true,
        path: testInfo.outputPath(`course-${preset}-full.png`)
      });
      expect(full.byteLength).toBeGreaterThan(1_000);
      await page.setViewportSize({ height: 900, width: 640 });
      const narrow = await page.screenshot({
        fullPage: true,
        path: testInfo.outputPath(`course-${preset}-narrow.png`)
      });
      expect(narrow.byteLength).toBeGreaterThan(1_000);
    }

    await context.serviceWorkers()[0]!.evaluate(async () => {
      const stored = await chrome.storage.local.get("settings");
      const settings = stored.settings as {
        nativeCustomization: { enabled: boolean };
      };
      settings.nativeCustomization.enabled = false;
      await chrome.storage.local.set({ settings });
    });
    await expect(page.locator("html")).not.toHaveClass(/sc-native-customized/);
    await expect(page.locator("[data-sc-region]")).toHaveCount(0);
    await expect(page.locator("#main")).toHaveCSS("background-color", "rgb(23, 32, 51)");
    await expect(page.locator("#sidebar-left")).toHaveCSS("background-color", "rgb(245, 245, 245)");
    await expect(page.locator("#schoology-companion-native-theme")).toHaveCount(0);
    await expect(page.locator("#schoology-companion-native-layout")).toHaveCount(0);
  } finally {
    await context.close();
  }
});
