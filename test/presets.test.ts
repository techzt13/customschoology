import { describe, expect, it } from "vitest";
import { DEFAULT_SETTINGS } from "../src/shared/models";
import {
  applyNativePreset,
  nativeCustomizationMatchesPreset,
  NATIVE_THEME_PRESETS,
  presetContrastMatrix,
  presetPassesContrast
} from "../src/schoology/customization/presets";
import { generateNativeThemeCss } from "../src/schoology/customization/native-theme";

describe("native visual presets", () => {
  it("ships exactly 20 named immutable complete snapshots", () => {
    expect(NATIVE_THEME_PRESETS).toHaveLength(20);
    expect(new Set(NATIVE_THEME_PRESETS.map(({ id }) => id)).size).toBe(20);
    expect(new Set(NATIVE_THEME_PRESETS.map(({ name }) => name)).size).toBe(20);

    for (const preset of NATIVE_THEME_PRESETS) {
      expect(Object.isFrozen(preset)).toBe(true);
      expect(Object.isFrozen(preset.snapshot)).toBe(true);
      expect(Object.isFrozen(preset.snapshot.tokens)).toBe(true);
      expect(Object.keys(preset.snapshot.tokens)).toHaveLength(16);
      for (const value of [
        preset.snapshot.cardTreatment,
        preset.snapshot.contentWidth,
        preset.snapshot.controlStyle,
        preset.snapshot.corners,
        preset.snapshot.density,
        preset.snapshot.font,
        preset.snapshot.layoutStyle,
        preset.snapshot.motionIntensity,
        preset.snapshot.navigationTreatment,
        preset.snapshot.railTreatment,
        preset.snapshot.shadow,
        preset.snapshot.tabTreatment
      ]) {
        expect(value.length).toBeGreaterThan(0);
      }
    }
  });

  it("passes every required WCAG pair and supported visual state without substitution", () => {
    for (const preset of NATIVE_THEME_PRESETS) {
      const failures = presetContrastMatrix(preset).filter(
        ({ ratio, threshold }) => ratio < threshold
      );
      expect(failures, `${preset.name}: ${JSON.stringify(failures)}`).toEqual([]);
      expect(presetPassesContrast(preset)).toBe(true);
    }
  });

  it("generates scoped component treatments for every preset", () => {
    const regions = new Set([
      "institution-header",
      "dashboard-tabs",
      "page-canvas",
      "dashboard-grid",
      "course-card",
      "course-card-content",
      "left-rail",
      "right-rail",
      "surface",
      "modal",
      "popover",
      "footer"
    ] as const);
    for (const preset of NATIVE_THEME_PRESETS) {
      const css = generateNativeThemeCss(
        applyNativePreset(DEFAULT_SETTINGS.nativeCustomization, preset.id),
        regions
      );
      expect(css).toContain('[data-sc-region="institution-header"]');
      expect(css).toContain('[data-sc-region="course-card"]:hover');
      expect(css).toContain('[data-sc-theme-role="control"]:disabled');
      expect(css).toContain('[data-sc-region="modal"]');
      expect(css).toContain("@media (prefers-reduced-motion: reduce)");
      expect(css).not.toMatch(/font-size\s*:/i);
      expect(css).not.toMatch(
        /\[data-sc-region="(?:left-rail|right-rail|footer|dashboard-grid|dashboard-tabs)"\]\s*\{\s*display:\s*none/i
      );
    }
  });

  it("applies a complete snapshot and detects later customization", () => {
    const applied = applyNativePreset(
      {
        ...DEFAULT_SETTINGS.nativeCustomization,
        hideFooter: true,
        hideLeftRail: true,
        hideRightRail: true
      },
      "midnight-study"
    );
    expect(applied.presetId).toBe("midnight-study");
    expect(applied.layoutStyle).toBe("soft-elevated");
    expect(applied.tokens.pageBackground).toBe("#0f172a");
    expect(applied).toMatchObject({
      hideFooter: false,
      hideLeftRail: false,
      hideRightRail: false
    });
    expect(nativeCustomizationMatchesPreset(applied)).toBe(true);
    expect(
      nativeCustomizationMatchesPreset({
        ...applied,
        tokens: { ...applied.tokens, accent: "#123456" }
      })
    ).toBe(false);
  });
});
