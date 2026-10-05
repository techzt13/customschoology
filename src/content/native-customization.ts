import type { Settings, ThemeCompatibilityReport } from "../shared/models";
import { generateSchoologyPlusCourseCss } from "../schoology/compatibility/schoology-plus-course";
import {
  generateSchoologyPlusCompatibilityCss,
  normalizeSchoologyHeaderIcons,
  restoreSchoologyHeaderIcons
} from "../schoology/compatibility/schoology-plus-shell";
import { generateNativeThemeCss } from "../schoology/customization/native-theme";
import {
  clearThemeRegions,
  detectedThemeRegions,
  discoverThemeRegions,
  SELECTOR_CONTRACT_VERSION
} from "../schoology/customization/selectors";
import { schoologyRoute } from "../schoology/routes";
import {
  captureCourseSurfaceBaseline,
  clearCourseSurfaceRollbacks,
  rollbackCourseSurfaces,
  validateCourseSurfaces
} from "./course-surface-safety";
import { NativeContrastAnnotator } from "./native-contrast";
import { captureNativeLayoutBaseline, validateNativeLayout } from "./native-layout-safety";

const STYLE_ID = "schoology-companion-native-theme";
const LAYOUT_STYLE_ID = "schoology-companion-native-layout";
const LAYOUT_MARKER = "/* sc-layout-start */";
const contrastAnnotator = new NativeContrastAnnotator();
let layoutSafetyRun = 0;
let rolledBackLayoutKey: string | null = null;
let rolledBackLayoutWarning: string | null = null;

function ensureStyle(id: string): HTMLStyleElement {
  let style = document.querySelector<HTMLStyleElement>(`#${id}`);
  if (!style) {
    style = document.createElement("style");
    style.id = id;
    document.documentElement.append(style);
  }
  return style;
}

function splitThemeCss(css: string): [string, string] {
  const marker = css.indexOf(LAYOUT_MARKER);
  return marker < 0 ? [css, ""] : [css.slice(0, marker), css.slice(marker + LAYOUT_MARKER.length)];
}

function settingsLayoutKey(settings: Settings): string {
  return `${location.pathname}:${JSON.stringify(settings.nativeCustomization)}`;
}

function saveCompatibility(report: ThemeCompatibilityReport): void {
  void chrome.storage.local
    .set({ themeCompatibility: report })
    .catch((error: unknown) => console.error("Could not save theme compatibility report.", error));
}

export function applyNativeCustomization(settings: Settings): void {
  if (!settings.nativeCustomization.enabled) {
    removeNativeCustomization();
    return;
  }
  clearCourseSurfaceRollbacks(document);
  const report = discoverThemeRegions(document);
  const courseSurfaceBaseline = captureCourseSurfaceBaseline(document);
  const baseline = captureNativeLayoutBaseline(document);
  const [nativePaintCss, nativeLayoutCss] = splitThemeCss(
    generateNativeThemeCss(settings.nativeCustomization, detectedThemeRegions(document))
  );
  const compatibilityCss = generateSchoologyPlusCompatibilityCss(
    settings.nativeCustomization,
    location.pathname
  );
  const courseCss = generateSchoologyPlusCourseCss(settings.nativeCustomization, location.pathname);
  const safeCss = `${nativePaintCss}\n${compatibilityCss.paintCss}\n${courseCss.paintCss}`;
  const layoutCss = `${nativeLayoutCss}\n${compatibilityCss.layoutCss}\n${courseCss.layoutCss}`;
  document.documentElement.classList.add("sc-native-customized");
  document.documentElement.dataset.scSelectorContract = String(SELECTOR_CONTRACT_VERSION);
  document.body.dataset.scRoute = schoologyRoute(location.pathname);
  ensureStyle(STYLE_ID).textContent = safeCss;

  const key = settingsLayoutKey(settings);
  const run = ++layoutSafetyRun;
  let layoutStyle: HTMLStyleElement | null = null;
  if (rolledBackLayoutKey === key) {
    document.querySelector(`#${LAYOUT_STYLE_ID}`)?.remove();
  } else {
    layoutStyle = ensureStyle(LAYOUT_STYLE_ID);
    layoutStyle.textContent = layoutCss;
  }
  normalizeSchoologyHeaderIcons(document);
  contrastAnnotator.update(settings.nativeCustomization);
  contrastAnnotator.annotateNow();
  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      if (run !== layoutSafetyRun) return;
      const finalReport: ThemeCompatibilityReport = { ...report };
      if (rolledBackLayoutKey === key) {
        finalReport.layoutWarning =
          rolledBackLayoutWarning ?? "Layout styling remains rolled back on this page.";
      } else {
        const issues = validateNativeLayout(baseline, settings.nativeCustomization);
        if (issues.length > 0) {
          layoutStyle?.remove();
          rolledBackLayoutKey = key;
          rolledBackLayoutWarning = `Layout styling was rolled back: ${issues.join("; ")}.`;
          finalReport.layoutWarning = rolledBackLayoutWarning;
        }
      }
      contrastAnnotator.annotateNow();
      const surfaceIssues = validateCourseSurfaces(courseSurfaceBaseline, document);
      if (surfaceIssues.length > 0) {
        rollbackCourseSurfaces(courseSurfaceBaseline);
        contrastAnnotator.annotateNow();
        finalReport.surfaceWarning = `Course content styling was safely restored: ${surfaceIssues.join("; ")}.`;
      }
      saveCompatibility(finalReport);
    });
  });
}

export function removeNativeCustomization(): void {
  layoutSafetyRun += 1;
  contrastAnnotator.disable();
  clearCourseSurfaceRollbacks(document);
  restoreSchoologyHeaderIcons(document);
  clearThemeRegions(document);
  document.documentElement.classList.remove("sc-native-customized");
  document.documentElement.removeAttribute("data-sc-selector-contract");
  document.body.removeAttribute("data-sc-route");
  document.querySelector(`#${STYLE_ID}`)?.remove();
  document.querySelector(`#${LAYOUT_STYLE_ID}`)?.remove();
  rolledBackLayoutKey = null;
  rolledBackLayoutWarning = null;
  void chrome.storage.local
    .remove("themeCompatibility")
    .catch((error: unknown) => console.error("Could not clear theme compatibility report.", error));
}
