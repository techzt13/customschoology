import type { Settings } from "../shared/models";
import {
  clearThemeRegions,
  detectedThemeRegions,
  discoverThemeRegions,
  SELECTOR_CONTRACT_VERSION
} from "../schoology/customization/selectors";
import { generateNativeThemeCss } from "../schoology/customization/native-theme";
import { NativeContrastAnnotator } from "./native-contrast";

const STYLE_ID = "schoology-companion-native-theme";
const contrastAnnotator = new NativeContrastAnnotator();

export function applyNativeCustomization(settings: Settings): void {
  if (!settings.nativeCustomization.enabled) {
    removeNativeCustomization();
    return;
  }
  const report = discoverThemeRegions(document);
  document.documentElement.classList.toggle(
    "sc-native-customized",
    settings.nativeCustomization.enabled
  );
  document.documentElement.dataset.scSelectorContract = String(SELECTOR_CONTRACT_VERSION);

  let style = document.querySelector<HTMLStyleElement>(`#${STYLE_ID}`);
  if (!style) {
    style = document.createElement("style");
    style.id = STYLE_ID;
    document.documentElement.append(style);
  }
  style.textContent = generateNativeThemeCss(
    settings.nativeCustomization,
    detectedThemeRegions(document)
  );
  contrastAnnotator.update(settings.nativeCustomization);
  void chrome.storage.local
    .set({ themeCompatibility: report })
    .catch((error: unknown) => console.error("Could not save theme compatibility report.", error));
}

export function removeNativeCustomization(): void {
  contrastAnnotator.disable();
  clearThemeRegions(document);
  document.documentElement.classList.remove("sc-native-customized");
  document.documentElement.removeAttribute("data-sc-selector-contract");
  document.querySelector(`#${STYLE_ID}`)?.remove();
}
