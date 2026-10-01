import { afterEach, describe, expect, it, vi } from "vitest";
import { DEFAULT_SETTINGS } from "../src/shared/models";
import { discoverThemeRegions } from "../src/schoology/customization/selectors";
import {
  effectiveBackground,
  NativeContrastAnnotator,
  parseCssColor,
  renderedContrast
} from "../src/content/native-contrast";

afterEach(() => {
  vi.useRealTimers();
  document.documentElement.innerHTML = "<head></head><body></body>";
});

function correctedContrast(element: HTMLElement): number {
  const foreground = parseCssColor(element.style.getPropertyValue("--sc-native-auto-fg"));
  expect(foreground).not.toBeNull();
  return renderedContrast(foreground!, effectiveBackground(element));
}

describe("semantic native contrast annotation", () => {
  it("corrects identified tab text against transparent ancestry", () => {
    document.documentElement.innerHTML = `
      <body>
        <div role="tablist" style="background: rgb(250, 250, 250)">
          <div style="background: transparent">
            <a id="tab" role="tab" aria-selected="true" style="color: white">Course Dashboard</a>
          </div>
        </div>
      </body>`;
    discoverThemeRegions(document);
    const annotator = new NativeContrastAnnotator();
    annotator.update(DEFAULT_SETTINGS.nativeCustomization);
    annotator.annotateNow();

    const tab = document.querySelector<HTMLElement>("#tab")!;
    expect(tab.classList.contains("sc-native-auto-contrast")).toBe(true);
    expect(correctedContrast(tab)).toBeGreaterThanOrEqual(3);
    annotator.disable();
  });

  it("chooses only semantic colors or black/white fallbacks", () => {
    document.documentElement.innerHTML = `
      <body><aside aria-label="To Do" style="background: rgb(250, 250, 250)">
        <a id="link" href="/assignment/1" style="color: rgb(248, 248, 248)">Essay</a>
      </aside></body>`;
    discoverThemeRegions(document);
    const annotator = new NativeContrastAnnotator();
    annotator.update(DEFAULT_SETTINGS.nativeCustomization);
    annotator.annotateNow();

    const correction = document
      .querySelector<HTMLElement>("#link")!
      .style.getPropertyValue("--sc-native-auto-fg");
    const semanticColors = Object.values(DEFAULT_SETTINGS.nativeCustomization.tokens) as string[];
    expect([...semanticColors, "#000000", "#ffffff"]).toContain(correction);
    annotator.disable();
  });

  it("does not touch unidentified content or official status descendants", () => {
    document.documentElement.innerHTML = `
      <body>
        <main><p id="unknown" style="color: white">Authored text</p></main>
        <aside aria-label="To Do" style="background: white">
          <div data-status="submitted"><a id="status" href="/" style="color: white">Submitted</a></div>
        </aside>
      </body>`;
    discoverThemeRegions(document);
    const annotator = new NativeContrastAnnotator();
    annotator.update(DEFAULT_SETTINGS.nativeCustomization);
    annotator.annotateNow();

    expect(document.querySelector("#unknown")?.classList.contains("sc-native-auto-contrast")).toBe(
      false
    );
    expect(document.querySelector("#status")?.classList.contains("sc-native-auto-contrast")).toBe(
      false
    );
    annotator.disable();
  });

  it("preserves chosen colors without runtime substitution outside automatic mode", () => {
    document.documentElement.innerHTML = `
      <body><aside aria-label="To Do" style="background: white">
        <a id="link" href="/" style="color: white">Essay</a>
      </aside></body>`;
    discoverThemeRegions(document);
    const annotator = new NativeContrastAnnotator();
    annotator.update({
      ...DEFAULT_SETTINGS.nativeCustomization,
      contrastMode: "preserve"
    });
    annotator.annotateNow();

    expect(document.querySelector("#link")?.classList.contains("sc-native-auto-contrast")).toBe(
      false
    );
  });

  it("handles dynamic identified targets and removes all corrections on disable", async () => {
    vi.useFakeTimers();
    document.documentElement.innerHTML =
      '<body><aside aria-label="To Do" style="background: white"></aside></body>';
    discoverThemeRegions(document);
    const annotator = new NativeContrastAnnotator();
    annotator.update(DEFAULT_SETTINGS.nativeCustomization);
    document
      .querySelector("aside")!
      .insertAdjacentHTML(
        "beforeend",
        '<a id="dynamic" data-sc-theme-role="link" href="/" style="color: white">New work</a>'
      );
    await Promise.resolve();
    vi.advanceTimersByTime(100);

    const dynamic = document.querySelector<HTMLElement>("#dynamic")!;
    expect(dynamic.classList.contains("sc-native-auto-contrast")).toBe(true);
    expect(correctedContrast(dynamic)).toBeGreaterThanOrEqual(4.5);
    annotator.disable();
    expect(dynamic.classList.contains("sc-native-auto-contrast")).toBe(false);
    expect(dynamic.style.getPropertyValue("--sc-native-auto-fg")).toBe("");
  });
});
