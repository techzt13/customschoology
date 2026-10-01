import type { Settings, ThemeCompatibilityReport } from "../shared/models";
import { generateNativeThemeCss } from "../schoology/customization/native-theme";
import {
  clearThemeRegions,
  detectedThemeRegions,
  discoverThemeRegions,
  SELECTOR_CONTRACT_VERSION
} from "../schoology/customization/selectors";
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
  const report = discoverThemeRegions(document);
  const baseline = captureNativeLayoutBaseline(document);
  const [safeCss, layoutCss] = splitThemeCss(
    generateNativeThemeCss(settings.nativeCustomization, detectedThemeRegions(document))
  );
  document.documentElement.classList.add("sc-native-customized");
  document.documentElement.dataset.scSelectorContract = String(SELECTOR_CONTRACT_VERSION);
  ensureStyle(STYLE_ID).textContent = safeCss;

  const key = settingsLayoutKey(settings);
  const run = ++layoutSafetyRun;
  if (rolledBackLayoutKey === key) {
    document.querySelector(`#${LAYOUT_STYLE_ID}`)?.remove();
    saveCompatibility({
      ...report,
      layoutWarning: rolledBackLayoutWarning ?? "Layout styling remains rolled back on this page."
    });
  } else {
    const layoutStyle = ensureStyle(LAYOUT_STYLE_ID);
    layoutStyle.textContent = layoutCss;
    saveCompatibility(report);
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        if (run !== layoutSafetyRun || !layoutStyle.isConnected) return;
        const issues = validateNativeLayout(baseline, settings.nativeCustomization);
        if (issues.length === 0) {
          saveCompatibility(report);
          return;
        }
        layoutStyle.remove();
        rolledBackLayoutKey = key;
        rolledBackLayoutWarning = `Layout styling was rolled back: ${issues.join("; ")}.`;
        saveCompatibility({ ...report, layoutWarning: rolledBackLayoutWarning });
      });
    });
  }
  contrastAnnotator.update(settings.nativeCustomization);
}

export function removeNativeCustomization(): void {
  layoutSafetyRun += 1;
  contrastAnnotator.disable();
  clearThemeRegions(document);
  document.documentElement.classList.remove("sc-native-customized");
  document.documentElement.removeAttribute("data-sc-selector-contract");
  document.querySelector(`#${STYLE_ID}`)?.remove();
  document.querySelector(`#${LAYOUT_STYLE_ID}`)?.remove();
  rolledBackLayoutKey = null;
  rolledBackLayoutWarning = null;
  void chrome.storage.local
    .remove("themeCompatibility")
    .catch((error: unknown) => console.error("Could not clear theme compatibility report.", error));
}
