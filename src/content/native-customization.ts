import type { Settings } from "../shared/models";
import {
  detectSelectorSupport,
  SELECTOR_CONTRACT_VERSION
} from "../schoology/customization/selectors";
import { generateNativeThemeCss } from "../schoology/customization/native-theme";

const STYLE_ID = "schoology-companion-native-theme";

export function applyNativeCustomization(settings: Settings): void {
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
    settings.accent,
    settings.density,
    detectSelectorSupport(document)
  );
}

export function removeNativeCustomization(): void {
  document.documentElement.classList.remove("sc-native-customized");
  document.documentElement.removeAttribute("data-sc-selector-contract");
  document.querySelector(`#${STYLE_ID}`)?.remove();
}
