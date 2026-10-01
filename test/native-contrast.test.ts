import { readFile } from "node:fs/promises";
import { afterEach, beforeAll, describe, expect, it, vi } from "vitest";
import {
  effectiveBackground,
  NativeContrastAnnotator,
  parseCssColor,
  renderedContrast
} from "../src/content/native-contrast";

let fixture = "";

beforeAll(async () => {
  fixture = await readFile("test/fixtures/native-layout.html", "utf8");
});

afterEach(() => {
  vi.useRealTimers();
  document.documentElement.innerHTML = "<head></head><body></body>";
});

function correctedContrast(element: HTMLElement): number {
  const foreground = parseCssColor(element.style.getPropertyValue("--sc-native-auto-fg"));
  expect(foreground).not.toBeNull();
  return renderedContrast(foreground!, effectiveBackground(element));
}

describe("native contrast annotation", () => {
  it("corrects light tab text against a transparent light ancestor", () => {
    document.documentElement.innerHTML = fixture;
    document.querySelectorAll<HTMLElement>("[role='tab']").forEach((tab) => {
      tab.style.color = "rgb(255, 255, 255)";
    });
    const annotator = new NativeContrastAnnotator();
    annotator.update();
    annotator.annotateNow();

    const tab = document.querySelector<HTMLElement>("#recent-activity-tab")!;
    expect(tab.classList.contains("sc-native-auto-contrast")).toBe(true);
    expect(correctedContrast(tab)).toBeGreaterThanOrEqual(3);
    annotator.disable();
  });

  it("uses 4.5:1 for normal text across mixed light and dark surfaces", () => {
    document.documentElement.innerHTML = `
      <body><main id="main">
        <section class="content-box" style="background: rgb(250, 250, 250)">
          <p id="light" style="color: rgb(245, 245, 245); font-size: 16px">Light surface</p>
        </section>
        <section class="feed" style="background: rgb(20, 24, 32)">
          <p id="dark" style="color: rgb(10, 10, 10); font-size: 16px">Dark surface</p>
        </section>
      </main></body>`;
    const annotator = new NativeContrastAnnotator();
    annotator.update();
    annotator.annotateNow();

    for (const id of ["light", "dark"]) {
      const element = document.querySelector<HTMLElement>(`#${id}`)!;
      expect(correctedContrast(element)).toBeGreaterThanOrEqual(4.5);
    }
    annotator.disable();
  });

  it("leaves official status and grade descendants unchanged", () => {
    document.documentElement.innerHTML = `
      <body><main id="main" style="background: rgb(255, 255, 255)">
        <div class="submission-status"><span id="status" style="color: white">Submitted</span></div>
        <div class="grade-item"><span id="grade" style="color: white">A</span></div>
      </main></body>`;
    const annotator = new NativeContrastAnnotator();
    annotator.update();
    annotator.annotateNow();

    expect(document.querySelector("#status")?.classList.contains("sc-native-auto-contrast")).toBe(
      false
    );
    expect(document.querySelector("#grade")?.classList.contains("sc-native-auto-contrast")).toBe(
      false
    );
    annotator.disable();
  });

  it("annotates dynamically inserted touched content and removes corrections on disable", async () => {
    vi.useFakeTimers();
    document.documentElement.innerHTML =
      '<body><main id="main" style="background: white"></main></body>';
    const annotator = new NativeContrastAnnotator();
    annotator.update();
    const main = document.querySelector("#main")!;
    main.insertAdjacentHTML(
      "beforeend",
      '<p id="dynamic" style="color: white; font-size: 16px">New activity</p>'
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
