import { readFile } from "node:fs/promises";
import { beforeAll, describe, expect, it } from "vitest";
import { DEFAULT_SETTINGS } from "../src/shared/models";
import {
  detectSelectorSupport,
  SCHOOLOGY_SELECTORS,
  scopedSelectors
} from "../src/schoology/customization/selectors";
import {
  contrastRatio,
  generateNativeThemeCss,
  resetNativeSetting,
  safeTextColor,
  sanitizeNativeCustomization
} from "../src/schoology/customization/native-theme";

let fixture = "";

beforeAll(async () => {
  fixture = await readFile("test/fixtures/native-layout.html", "utf8");
});

describe("native Schoology selector contract", () => {
  it("detects supported surfaces independently", () => {
    document.documentElement.innerHTML = fixture;
    const supported = detectSelectorSupport(document);

    expect(supported).toEqual(
      new Set([
        "buttons",
        "content",
        "courseCards",
        "footer",
        "header",
        "leftRail",
        "links",
        "rightRail"
      ])
    );
    expect(supported.has("surfaces")).toBe(false);
  });

  it("scopes every selector to the extension-owned root class", () => {
    for (const group of Object.keys(SCHOOLOGY_SELECTORS) as Array<
      keyof typeof SCHOOLOGY_SELECTORS
    >) {
      for (const selector of scopedSelectors(group).split(",\n")) {
        expect(selector).toMatch(/^html\.sc-native-customized /);
      }
    }
  });
});

describe("native theme generation", () => {
  it("sanitizes invalid values and clamps scale", () => {
    const sanitized = sanitizeNativeCustomization({
      background: "url(javascript:alert(1))",
      border: "#112233",
      contentWidth: "infinite",
      corners: "round",
      enabled: true,
      font: "downloaded-font",
      hideFooter: true,
      shadow: "subtle",
      surface: "#ffffff",
      text: "#eeeeee"
    });

    expect(sanitized.background).toBe(DEFAULT_SETTINGS.nativeCustomization.background);
    expect(sanitized.border).toBe("#112233");
    expect(sanitized.contentWidth).toBe("default");
    expect(sanitized.font).toBe("native");
    expect("fontScale" in sanitized).toBe(false);
    expect(sanitized.hideFooter).toBe(true);
  });

  it("generates only scoped rules for detected feature groups", () => {
    const css = generateNativeThemeCss(
      DEFAULT_SETTINGS.nativeCustomization,
      "#5b4ee4",
      "comfortable",
      new Set(["header", "courseCards", "buttons"])
    );

    expect(css).toContain("html.sc-native-customized #header");
    expect(css).toContain("html.sc-native-customized .course-card");
    expect(css).not.toContain("html.sc-native-customized #right-column");
    expect(css).not.toMatch(/(^|[,{]\s*)(#header|\.course-card)\b/m);
  });

  it("does not override width when Schoology default is selected", () => {
    const css = generateNativeThemeCss(
      DEFAULT_SETTINGS.nativeCustomization,
      "#5b4ee4",
      "comfortable",
      new Set(["content"])
    );

    expect(css).not.toContain("max-width:");
    expect(css).not.toContain("margin-inline:");
  });

  it("never changes Schoology root font size with default settings", () => {
    const css = generateNativeThemeCss(
      DEFAULT_SETTINGS.nativeCustomization,
      "#5b4ee4",
      "comfortable",
      new Set(["header", "content", "courseCards"])
    );

    expect(css).not.toMatch(/font-size\s*:/i);
    expect(css).not.toMatch(/html\.sc-native-customized\s*\{[^}]*font-family/);
    expect(css).not.toContain("font-family:");
  });

  it("applies an optional font family to body without changing root geometry", () => {
    const css = generateNativeThemeCss(
      { ...DEFAULT_SETTINGS.nativeCustomization, font: "humanist" },
      "#5b4ee4",
      "comfortable",
      new Set(["content"])
    );

    expect(css).toContain("html.sc-native-customized body { font-family:");
    expect(css).not.toMatch(/font-size\s*:/i);
    expect(css).not.toMatch(/html\.sc-native-customized\s*\{[^}]*font-family/);
  });

  it("excludes links nested in status and grade regions", () => {
    document.documentElement.innerHTML = `
      <body><main>
        <div class="submission-status"><a id="status-link">Submitted</a></div>
        <div class="grade-item"><a id="grade-link">A</a></div>
        <div class="course-card"><a id="course-link">Biology</a></div>
      </main></body>`;

    const selector = SCHOOLOGY_SELECTORS.links[0];
    expect(document.querySelectorAll(selector)).toHaveLength(1);
    expect(document.querySelector(selector)?.id).toBe("course-link");
  });

  it("substitutes a readable text color when requested colors fail contrast", () => {
    const safe = safeTextColor("#eeeeee", "#ffffff");
    expect(safe).toBe("#000000");
    expect(contrastRatio(safe, "#ffffff")).toBeGreaterThanOrEqual(4.5);
  });

  it("resets one setting without changing the others", () => {
    const customized = {
      ...DEFAULT_SETTINGS.nativeCustomization,
      hideRightRail: true,
      surface: "#112233"
    };
    const reset = resetNativeSetting(customized, "surface");

    expect(reset.surface).toBe(DEFAULT_SETTINGS.nativeCustomization.surface);
    expect(reset.hideRightRail).toBe(true);
  });
});
