import { describe, expect, it } from "vitest";
import { DEFAULT_SETTINGS } from "../src/shared/models";
import { generateSchoologyPlusCourseCss } from "../src/schoology/compatibility/schoology-plus-course";
import {
  generateSchoologyPlusCompatibilityCss,
  normalizeSchoologyHeaderIcons,
  restoreSchoologyHeaderIcons
} from "../src/schoology/compatibility/schoology-plus-shell";

describe("pinned SchoologyPlus shell compatibility", () => {
  it("emits nothing when native customization is disabled", () => {
    const { layoutCss, paintCss } = generateSchoologyPlusCompatibilityCss(
      { ...DEFAULT_SETTINGS.nativeCustomization, enabled: false },
      "/home"
    );

    expect(layoutCss).toBe("");
    expect(paintCss).toBe("");
  });

  describe("pinned SchoologyPlus course compatibility", () => {
    it("themes only verified course structures without structural width or root typography rules", () => {
      const { layoutCss, paintCss } = generateSchoologyPlusCourseCss(
        DEFAULT_SETTINGS.nativeCustomization,
        "/course/42/materials"
      );

      for (const selector of [
        "#main-content-wrapper",
        "#center-top",
        "#sidebar-left",
        "#course-profile-materials",
        "#right-column",
        ".materials-top",
        "div.summary-course",
        ".gradebook-course.hierarchical-grading-report"
      ]) {
        expect(`${paintCss}\n${layoutCss}`).toContain(selector);
      }
      expect(paintCss).not.toContain("AUTHORED_READING_SURFACE");
      expect(paintCss).toContain("#ffffff");
      expect(paintCss).toContain(".material-content a");
      expect(paintCss).toContain(":not(");
      expect(`${paintCss}\n${layoutCss}`).not.toMatch(/font-size\s*:/i);
      expect(layoutCss).not.toMatch(
        /#main-content-wrapper[^{]*\{[^}]*(?:^|[;\s])(?:width|max-width)\s*:/im
      );
      expect(layoutCss).not.toMatch(/display\s*:\s*none/i);
    });

    it("emits no course shell CSS on unrelated or disabled routes", () => {
      expect(generateSchoologyPlusCourseCss(DEFAULT_SETTINGS.nativeCustomization, "/home")).toEqual(
        { layoutCss: "", paintCss: "" }
      );
      expect(
        generateSchoologyPlusCourseCss(
          { ...DEFAULT_SETTINGS.nativeCustomization, enabled: false },
          "/course/42"
        )
      ).toEqual({ layoutCss: "", paintCss: "" });
    });
  });

  it("pairs proven header controls and menus without replacing native geometry", () => {
    const { layoutCss, paintCss } = generateSchoologyPlusCompatibilityCss(
      DEFAULT_SETTINGS.nativeCustomization,
      "/home"
    );

    expect(paintCss).toContain("#header > header nav li button._1Z0RM");
    expect(paintCss).toContain('[class*="Header-header-button-"]');
    expect(paintCss).toContain('[role="menu"]');
    expect(paintCss).toContain("background:");
    expect(paintCss).toContain("color:");
    expect(paintCss).not.toMatch(/(?:min-|max-)?(?:width|height)\s*:/i);
    expect(paintCss).not.toMatch(/padding\s*:/i);
    expect(`${paintCss}\n${layoutCss}`).not.toMatch(/font-size\s*:/i);
    expect(layoutCss).not.toContain("#header");
  });

  it("gates direct home-shell, rail, and dashboard rules to proven home routes", () => {
    const home = generateSchoologyPlusCompatibilityCss(
      DEFAULT_SETTINGS.nativeCustomization,
      "/home/course-dashboard"
    );
    const course = generateSchoologyPlusCompatibilityCss(
      DEFAULT_SETTINGS.nativeCustomization,
      "/course/42"
    );

    for (const selector of [
      "#main-content-wrapper",
      "#center-top",
      "#right-column",
      "#right-column-inner",
      ".course-dashboard",
      ".sgy-card"
    ]) {
      expect(`${home.paintCss}\n${home.layoutCss}`).toContain(selector);
      expect(`${course.paintCss}\n${course.layoutCss}`).not.toContain(selector);
    }
    expect(home.layoutCss).not.toMatch(
      /#main-content-wrapper[^{]*\{[^}]*(?:^|[;\s])(?:width|max-width)\s*:/im
    );
  });

  it("normalizes only the proven dark header SVG fill and restores it exactly", () => {
    document.body.innerHTML = `
      <div id="header">
        <header>
          <nav><ul><li><svg><use href="#icon"></use></svg></li></ul></nav>
        </header>
      </div>
      <svg>
        <symbol id="icon"><path id="dark" fill="#333"></path><path id="brand" fill="#123456"></path></symbol>
        <symbol id="outside-icon"><path id="outside-dark" fill="#333"></path></symbol>
        <use href="#outside-icon"></use>
      </svg>
    `;

    normalizeSchoologyHeaderIcons(document);
    expect(document.querySelector("#dark")?.getAttribute("fill")).toBe("currentColor");
    expect(document.querySelector("#brand")?.getAttribute("fill")).toBe("#123456");
    expect(document.querySelector("#outside-dark")?.getAttribute("fill")).toBe("#333");
    expect(document.querySelector("#dark")?.getAttribute("data-sc-original-header-icon-fill")).toBe(
      "#333"
    );

    restoreSchoologyHeaderIcons(document);
    expect(document.querySelector("#dark")?.getAttribute("fill")).toBe("#333");
    expect(document.querySelector("[data-sc-original-header-icon-fill]")).toBeNull();
  });
});
