import { readFile } from "node:fs/promises";
import { beforeAll, describe, expect, it } from "vitest";
import { DEFAULT_SETTINGS } from "../src/shared/models";
import {
  clearThemeRegions,
  detectedThemeRegions,
  discoverThemeRegions,
  REGION_ATTRIBUTE,
  SCHOOLOGY_SELECTORS,
  THEME_ROLE_ATTRIBUTE
} from "../src/schoology/customization/selectors";
import {
  contrastRatio,
  effectiveNativeTokens,
  generateNativeThemeCss,
  HIGH_CONTRAST_TOKENS,
  resetNativeSetting,
  resetNativeToken,
  resolveForeground,
  sanitizeNativeCustomization,
  tokenContrastDiagnostic
} from "../src/schoology/customization/native-theme";

let fixture = "";

beforeAll(async () => {
  fixture = await readFile("test/fixtures/full-shell.html", "utf8");
});

describe("native Schoology semantic discovery", () => {
  it("discovers and annotates the complete recognizable shell", () => {
    document.documentElement.innerHTML = fixture;
    const report = discoverThemeRegions(document);

    expect(report.themed).toEqual(
      expect.arrayContaining([
        "institution-header",
        "dashboard-tabs",
        "page-canvas",
        "home-shell",
        "center-column",
        "content-wrapper",
        "center-top",
        "home-feed",
        "dashboard-grid",
        "course-card",
        "course-card-content",
        "left-rail",
        "right-rail",
        "right-rail-inner",
        "surface",
        "modal",
        "popover",
        "footer"
      ])
    );
    expect(document.querySelector('header[data-sc-region="institution-header"]')).not.toBeNull();
    expect(
      document.querySelector('[aria-label="To Do"][data-sc-region="right-rail"]')
    ).not.toBeNull();
    expect(
      document.querySelector('#main-content-wrapper[data-sc-region="home-shell"]')
    ).not.toBeNull();
    expect(document.querySelector('#center[data-sc-region="center-column"]')).not.toBeNull();
    expect(
      document.querySelector('#right-column-inner[data-sc-region="right-rail-inner"]')
    ).not.toBeNull();
    expect(document.querySelector('[role="tab"][data-sc-theme-role="tab-active"]')).not.toBeNull();
    expect(document.querySelector('[data-sc-theme-role="empty"]')).not.toBeNull();
    expect(document.querySelector("iframe")?.hasAttribute(THEME_ROLE_ATTRIBUTE)).toBe(false);
    expect(document.querySelector("[data-status]")?.hasAttribute(THEME_ROLE_ATTRIBUTE)).toBe(false);
    const unknown = document.createElement("a");
    unknown.href = "/unknown";
    unknown.textContent = "Unknown institution widget";
    document.querySelector("main")?.append(unknown);
    discoverThemeRegions(document);
    expect(unknown.hasAttribute(THEME_ROLE_ATTRIBUTE)).toBe(false);
  });

  it("removes every extension-owned region and role annotation", () => {
    document.documentElement.innerHTML = fixture;
    discoverThemeRegions(document);
    clearThemeRegions(document);

    expect(document.querySelector(`[${REGION_ATTRIBUTE}]`)).toBeNull();
    expect(document.querySelector(`[${THEME_ROLE_ATTRIBUTE}]`)).toBeNull();
  });
});

describe("native semantic theme model", () => {
  it("migrates legacy colors and sanitizes invalid semantic tokens", () => {
    const sanitized = sanitizeNativeCustomization({
      background: "#102030",
      border: "#112233",
      contrastMode: "unsafe",
      surface: "#ffffff",
      text: "#eeeeee",
      tokens: { link: "url(javascript:alert(1))" }
    });

    expect(sanitized.tokens.pageBackground).toBe("#102030");
    expect(sanitized.tokens.border).toBe("#112233");
    expect(sanitized.tokens.primarySurface).toBe("#ffffff");
    expect(sanitized.tokens.primaryText).toBe("#eeeeee");
    expect(sanitized.tokens.link).toBe(DEFAULT_SETTINGS.nativeCustomization.tokens.link);
    expect(sanitized.contrastMode).toBe("automatic");
    expect(sanitized.hideRightRail).toBe(false);
    expect(sanitized.visibilityControlsVersion).toBe(1);
  });

  it("resolves automatic contrast but preserves requested manual colors with warnings", () => {
    const automatic = resolveForeground("#eeeeee", "#ffffff", "automatic");
    const manual = resolveForeground("#eeeeee", "#ffffff", "manual");

    expect(automatic.resolved).toBe("#000000");
    expect(automatic.ratio).toBeGreaterThanOrEqual(4.5);
    expect(manual.resolved).toBe("#eeeeee");
    expect(manual.meets).toBe(false);
  });

  it("uses a coherent complete high-contrast token preset", () => {
    const tokens = effectiveNativeTokens({
      ...DEFAULT_SETTINGS.nativeCustomization,
      contrastMode: "high-contrast"
    });

    expect(tokens).toEqual(HIGH_CONTRAST_TOKENS);
    expect(contrastRatio(tokens.primaryText, tokens.primarySurface)).toBeGreaterThanOrEqual(7);
    expect(contrastRatio(tokens.headerText, tokens.headerBackground)).toBeGreaterThanOrEqual(7);
    expect(contrastRatio(tokens.link, tokens.primarySurface)).toBeGreaterThanOrEqual(4.5);
  });

  it("reports requested, resolved, ratio, and threshold for every token", () => {
    for (const key of Object.keys(DEFAULT_SETTINGS.nativeCustomization.tokens) as Array<
      keyof typeof DEFAULT_SETTINGS.nativeCustomization.tokens
    >) {
      const diagnostic = tokenContrastDiagnostic(DEFAULT_SETTINGS.nativeCustomization, key);
      expect(diagnostic.requested).toMatch(/^#[0-9a-f]{6}$/i);
      expect(diagnostic.resolved).toMatch(/^#[0-9a-f]{6}$/i);
      expect(diagnostic.ratio).toBeGreaterThan(0);
      expect([3, 4.5]).toContain(diagnostic.threshold);
    }
  });

  it("resets one token or one layout setting without changing neighbors", () => {
    const customized = {
      ...DEFAULT_SETTINGS.nativeCustomization,
      hideRightRail: true,
      tokens: { ...DEFAULT_SETTINGS.nativeCustomization.tokens, link: "#123456" }
    };
    const tokenReset = resetNativeToken(customized, "link");
    const layoutReset = resetNativeSetting(customized, "hideRightRail");

    expect(tokenReset.tokens.link).toBe(DEFAULT_SETTINGS.nativeCustomization.tokens.link);
    expect(tokenReset.hideRightRail).toBe(true);
    expect(layoutReset.hideRightRail).toBe(false);
    expect(layoutReset.tokens.link).toBe("#123456");
  });
});

describe("annotation-scoped theme generation", () => {
  it("targets only positively annotated regions and roles", () => {
    document.documentElement.innerHTML = fixture;
    discoverThemeRegions(document);
    const css = generateNativeThemeCss(
      DEFAULT_SETTINGS.nativeCustomization,
      detectedThemeRegions(document)
    );

    expect(css).toContain('[data-sc-region="institution-header"]');
    expect(css).toContain('[data-sc-region="right-rail"]');
    expect(css).toContain('[data-sc-theme-role="link"]');
    expect(css).not.toContain("#header");
    expect(css).not.toContain("#main");
    expect(css).not.toContain(".course-card {");
    expect(css).not.toMatch(/(^|[,{]\s*)(body|header|main|aside|a|button)\b/m);
  });

  it("never constrains a generic body, main, or home-shell parent", () => {
    const css = generateNativeThemeCss(
      { ...DEFAULT_SETTINGS.nativeCustomization, contentWidth: "focused" },
      new Set(["page-canvas", "home-shell", "center-column", "content-wrapper"])
    );

    expect(SCHOOLOGY_SELECTORS["page-canvas"]).not.toEqual(
      expect.arrayContaining(["body", "main", "#main"])
    );
    expect(css).toContain(
      '[data-sc-region="content-wrapper"]:not(:has(#right-column)):not(:has(.course-dashboard))'
    );
    expect(css).not.toMatch(/(?:body|main|#main)\[data-sc-region="page-canvas"\]/);
    expect(css).not.toMatch(/\[data-sc-region="home-shell"\][^{]*\{[^}]*max-width/);
  });

  it("does not emit a foreground rule for an unknown native region", () => {
    const css = generateNativeThemeCss(
      DEFAULT_SETTINGS.nativeCustomization,
      new Set(["institution-header"])
    );

    expect(css).toContain('[data-sc-region="institution-header"]');
    expect(css).not.toMatch(/\[data-sc-region="right-rail"\]\s*\{[^}]*background-color/);
    expect(css).not.toMatch(/\[data-sc-region="surface"\]\s*\{[^}]*background-color/);
  });

  it("never changes root font-size and scopes the preset font to discovered regions", () => {
    const css = generateNativeThemeCss(
      DEFAULT_SETTINGS.nativeCustomization,
      new Set(["page-canvas"])
    );

    expect(css).not.toMatch(/font-size\s*:/i);
    expect(css).toContain("html.sc-native-customized [data-sc-region] { font-family:");
  });

  it("applies interaction, focus, disabled, responsive, and reduced-motion states", () => {
    const css = generateNativeThemeCss(
      DEFAULT_SETTINGS.nativeCustomization,
      new Set(["page-canvas", "right-rail"])
    );

    expect(css).toContain(":hover");
    expect(css).toContain(":active");
    expect(css).toContain(":focus-visible");
    expect(css).toContain(":disabled");
    expect(css).toContain("@media (max-width: 44rem)");
    expect(css).toContain("@media (prefers-reduced-motion: reduce)");
  });

  it("emits no CSS when native customization is disabled", () => {
    expect(
      generateNativeThemeCss(
        { ...DEFAULT_SETTINGS.nativeCustomization, enabled: false },
        new Set(["page-canvas"])
      )
    ).toBe("");
  });
});
