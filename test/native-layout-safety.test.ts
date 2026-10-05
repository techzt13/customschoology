import { beforeEach, describe, expect, it } from "vitest";
import { DEFAULT_SETTINGS } from "../src/shared/models";
import {
  captureNativeLayoutBaseline,
  validateNativeLayout
} from "../src/content/native-layout-safety";

function setRect(element: HTMLElement, initial: DOMRectInit): (next: DOMRectInit) => void {
  let value = DOMRect.fromRect(initial);
  element.getBoundingClientRect = () => value;
  return (next) => {
    value = DOMRect.fromRect(next);
  };
}

describe("native layout safety", () => {
  let center: HTMLElement;
  let rail: HTMLElement;
  let navigation: HTMLAnchorElement;
  let setCenterRect: (next: DOMRectInit) => void;
  let setRailRect: (next: DOMRectInit) => void;

  beforeEach(() => {
    document.body.innerHTML = `
      <header data-sc-region="institution-header"><a href="/home">Home</a></header>
      <div data-sc-region="center-column"></div>
      <aside data-sc-region="right-rail"></aside>
    `;
    center = document.querySelector('[data-sc-region="center-column"]') as HTMLElement;
    rail = document.querySelector('[data-sc-region="right-rail"]') as HTMLElement;
    navigation = document.querySelector("a") as HTMLAnchorElement;
    setRect(document.querySelector("header") as HTMLElement, {
      height: 64,
      width: 1200,
      x: 0,
      y: 0
    });
    setRect(navigation, { height: 40, width: 80, x: 20, y: 12 });
    setCenterRect = setRect(center, { height: 700, width: 850, x: 20, y: 80 });
    setRailRect = setRect(rail, { height: 700, width: 280, x: 890, y: 80 });
  });

  it("accepts an unchanged center and right-rail layout", () => {
    const baseline = captureNativeLayoutBaseline(document);
    expect(validateNativeLayout(baseline, DEFAULT_SETTINGS.nativeCustomization)).toEqual([]);
  });

  it("detects hidden, collapsed, separated, and offscreen critical regions", () => {
    const baseline = captureNativeLayoutBaseline(document);
    rail.style.display = "none";
    expect(validateNativeLayout(baseline, DEFAULT_SETTINGS.nativeCustomization)).toContain(
      "right-rail was hidden or collapsed"
    );

    rail.style.display = "";
    setCenterRect({ height: 700, width: 60, x: 20, y: 80 });
    setRailRect({ height: 700, width: 280, x: 1500, y: 80 });
    const issues = validateNativeLayout(baseline, DEFAULT_SETTINGS.nativeCustomization);
    expect(issues).toEqual(
      expect.arrayContaining([
        "center-column became unusably small",
        "right-rail moved outside the viewport"
      ])
    );
  });

  it("allows a right rail hidden by an explicit current-version visibility choice", () => {
    const baseline = captureNativeLayoutBaseline(document);
    rail.style.display = "none";
    expect(
      validateNativeLayout(baseline, {
        ...DEFAULT_SETTINGS.nativeCustomization,
        hideRightRail: true,
        visibilityControlsVersion: 1
      })
    ).not.toContain("right-rail was hidden or collapsed");
  });

  it("accepts native narrow-layout stacking instead of treating it as overlap", () => {
    const baseline = captureNativeLayoutBaseline(document);
    setCenterRect({ height: 500, width: 600, x: 12, y: 80 });
    setRailRect({ height: 300, width: 600, x: 12, y: 600 });
    expect(validateNativeLayout(baseline, DEFAULT_SETTINGS.nativeCustomization)).not.toContain(
      "the dashboard center column overlaps the right rail"
    );
  });

  it("detects native navigation items hidden by layout styling", () => {
    const baseline = captureNativeLayoutBaseline(document);
    navigation.style.display = "none";
    expect(validateNativeLayout(baseline, DEFAULT_SETTINGS.nativeCustomization)).toContain(
      "a native header navigation item became hidden"
    );
  });
});
