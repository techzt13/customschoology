import { afterEach, describe, expect, it } from "vitest";
import {
  captureCourseSurfaceBaseline,
  clearCourseSurfaceRollbacks,
  rollbackCourseSurfaces,
  validateCourseSurfaces
} from "../src/content/course-surface-safety";

function rendered(element: HTMLElement, width = 600): void {
  element.getBoundingClientRect = () => DOMRect.fromRect({ height: 180, width, x: 20, y: 80 });
  Object.defineProperties(element, {
    clientWidth: { configurable: true, value: width },
    scrollWidth: { configurable: true, value: width }
  });
}

afterEach(() => {
  document.documentElement.innerHTML = "<head></head><body></body>";
});

describe("course authored-surface safety", () => {
  it("detects unreadable authored text and restores the captured paired surface", () => {
    document.body.innerHTML = `
      <main data-sc-region="course-main">
        <article data-sc-region="authored-content" style="background: white; color: rgb(23, 32, 51)">
          <p id="copy" style="color: white">Unreadable copy</p>
          <span data-grade style="color: green">Official grade</span>
        </article>
      </main>
    `;
    const main = document.querySelector<HTMLElement>("main")!;
    const article = document.querySelector<HTMLElement>("article")!;
    const copy = document.querySelector<HTMLElement>("#copy")!;
    rendered(main, 700);
    rendered(article, 650);
    rendered(copy, 500);
    const baseline = captureCourseSurfaceBaseline(document);

    expect(validateCourseSurfaces(baseline, document)).toContain(
      "authored content contains unreadable foreground/background pairs"
    );
    rollbackCourseSurfaces(baseline);
    expect(article.hasAttribute("data-sc-course-surface-rollback")).toBe(true);
    expect(article.style.getPropertyValue("--sc-course-native-bg")).toContain("255");
    expect(article.style.getPropertyValue("--sc-course-native-fg")).toBe("rgb(0, 0, 0)");

    clearCourseSurfaceRollbacks(document);
    expect(article.hasAttribute("data-sc-course-surface-rollback")).toBe(false);
    expect(article.style.getPropertyValue("--sc-course-native-bg")).toBe("");
  });

  it("accepts readable, wrapped content and ignores official grade semantics", () => {
    document.body.innerHTML = `
      <main data-sc-region="course-main">
        <article data-sc-region="authored-content" style="background: white; color: #172033">
          <p id="copy">Readable CJK text 中文</p>
          <span data-grade style="color: white">Official grade</span>
        </article>
      </main>
    `;
    for (const element of document.querySelectorAll<HTMLElement>("main, article, p, span")) {
      rendered(element);
    }
    const baseline = captureCourseSurfaceBaseline(document);

    expect(validateCourseSurfaces(baseline, document)).toEqual([]);
  });

  it("ignores route panels that were already hidden before customization", () => {
    document.body.innerHTML = `
      <main data-sc-region="course-main">
        <article data-sc-region="authored-content" hidden>
          <p style="color: white">Inactive route content</p>
        </article>
      </main>
    `;
    rendered(document.querySelector<HTMLElement>("main")!);
    const baseline = captureCourseSurfaceBaseline(document);

    expect(validateCourseSurfaces(baseline, document)).toEqual([]);
    rollbackCourseSurfaces(baseline);
    expect(document.querySelector("article")?.hasAttribute("data-sc-course-surface-rollback")).toBe(
      false
    );
  });
});
