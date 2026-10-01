import {
  DEFAULT_SETTINGS,
  type NativeCustomization,
  type NativeContentWidth,
  type NativeCorners,
  type NativeFont,
  type NativeShadow
} from "../../shared/models";
import {
  NON_STATUS_LINK,
  scopedDescendants,
  scopedSelectors,
  type SelectorGroup
} from "./selectors";

const HEX = /^#[0-9a-f]{6}$/i;
const FONTS: Record<NativeFont, string> = {
  humanist: '"Trebuchet MS", "Segoe UI", system-ui, sans-serif',
  rounded: 'ui-rounded, "SF Pro Rounded", "Segoe UI", system-ui, sans-serif',
  serif: 'Georgia, "Times New Roman", serif',
  system: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif'
};
const WIDTHS: Record<NativeContentWidth, string> = {
  default: "none",
  focused: "76rem",
  wide: "96rem"
};
const RADII: Record<NativeCorners, string> = {
  round: "18px",
  schoology: "4px",
  soft: "10px"
};
const SHADOWS: Record<NativeShadow, string> = {
  none: "none",
  subtle: "0 8px 24px rgb(20 28 45 / 10%)"
};

function choice<T extends string>(value: unknown, choices: readonly T[], fallback: T): T {
  return typeof value === "string" && choices.includes(value as T) ? (value as T) : fallback;
}

export function sanitizeNativeCustomization(value: unknown): NativeCustomization {
  const defaults = DEFAULT_SETTINGS.nativeCustomization;
  if (typeof value !== "object" || value === null) return structuredClone(defaults);
  const input = value as Record<string, unknown>;
  const color = (key: "background" | "border" | "surface" | "text"): string =>
    typeof input[key] === "string" && HEX.test(input[key]) ? input[key] : defaults[key];
  const scale =
    typeof input.fontScale === "number" && Number.isFinite(input.fontScale)
      ? Math.min(1.2, Math.max(0.9, input.fontScale))
      : defaults.fontScale;

  return {
    background: color("background"),
    border: color("border"),
    contentWidth: choice(input.contentWidth, ["default", "focused", "wide"], defaults.contentWidth),
    corners: choice(input.corners, ["schoology", "soft", "round"], defaults.corners),
    enabled: input.enabled !== false,
    font: choice(input.font, ["system", "humanist", "rounded", "serif"], defaults.font),
    fontScale: Math.round(scale * 100) / 100,
    hideFooter: input.hideFooter === true,
    hideLeftRail: input.hideLeftRail === true,
    hideRightRail: input.hideRightRail === true,
    shadow: choice(input.shadow, ["none", "subtle"], defaults.shadow),
    surface: color("surface"),
    text: color("text")
  };
}

export function contrastRatio(foreground: string, background: string): number {
  const luminance = (hex: string): number => {
    const channels = [1, 3, 5].map((index) => {
      const channel = Number.parseInt(hex.slice(index, index + 2), 16) / 255;
      return channel <= 0.04045 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4;
    });
    return 0.2126 * channels[0]! + 0.7152 * channels[1]! + 0.0722 * channels[2]!;
  };
  const lighter = Math.max(luminance(foreground), luminance(background));
  const darker = Math.min(luminance(foreground), luminance(background));
  return (lighter + 0.05) / (darker + 0.05);
}

export function safeTextColor(requested: string, background: string, minimumRatio = 4.5): string {
  if (contrastRatio(requested, background) >= minimumRatio) return requested;
  return contrastRatio("#000000", background) >= contrastRatio("#ffffff", background)
    ? "#000000"
    : "#ffffff";
}

export function resetNativeSetting<K extends keyof NativeCustomization>(
  current: NativeCustomization,
  key: K
): NativeCustomization {
  return { ...current, [key]: DEFAULT_SETTINGS.nativeCustomization[key] };
}

export function generateNativeThemeCss(
  customization: NativeCustomization,
  accent: string,
  density: "comfortable" | "compact",
  supported: ReadonlySet<SelectorGroup>
): string {
  if (!customization.enabled) return "";
  const surfaceText = safeTextColor(customization.text, customization.surface);
  const bodyText = safeTextColor(customization.text, customization.background);
  const surfaceLinkText = safeTextColor(accent, customization.surface);
  const bodyLinkText = safeTextColor(accent, customization.background);
  const headerText = safeTextColor("#ffffff", accent);
  const radius = RADII[customization.corners];
  const shadow = SHADOWS[customization.shadow];
  const spacing = density === "compact" ? "0.72" : "1";
  const rules: string[] = [
    `html.sc-native-customized { --sc-native-bg: ${customization.background}; --sc-native-surface: ${customization.surface}; --sc-native-body-text: ${bodyText}; --sc-native-surface-text: ${surfaceText}; --sc-native-border: ${customization.border}; --sc-native-accent: ${accent}; --sc-native-body-link: ${bodyLinkText}; --sc-native-surface-link: ${surfaceLinkText}; --sc-native-radius: ${radius}; --sc-native-shadow: ${shadow}; --sc-native-space: ${spacing}; font-size: ${customization.fontScale * 100}%; }`,
    `html.sc-native-customized body { background: var(--sc-native-bg) !important; color: var(--sc-native-body-text) !important; font-family: ${FONTS[customization.font]} !important; }`
  ];

  if (supported.has("header")) {
    rules.push(
      `${scopedSelectors("header")} { background: var(--sc-native-accent) !important; color: ${headerText} !important; }`,
      `${scopedDescendants("header", NON_STATUS_LINK)},\n${scopedDescendants("header", "button")} { color: ${headerText} !important; }`
    );
  }
  if (supported.has("content")) {
    const width = WIDTHS[customization.contentWidth];
    rules.push(`${scopedSelectors("content")} { color: var(--sc-native-body-text) !important; }`);
    if (width !== "none") {
      rules.push(
        `${scopedSelectors("content")} { width: min(calc(100% - 2rem), ${width}); max-width: ${width}; margin-inline: auto !important; }`
      );
    }
  }
  for (const group of ["surfaces", "courseCards", "leftRail", "rightRail"] as const) {
    if (!supported.has(group)) continue;
    rules.push(
      `${scopedSelectors(group)} { background: var(--sc-native-surface) !important; color: var(--sc-native-surface-text) !important; border-color: var(--sc-native-border) !important; border-radius: var(--sc-native-radius) !important; box-shadow: var(--sc-native-shadow) !important; }`,
      `${scopedDescendants(group, NON_STATUS_LINK)} { color: var(--sc-native-surface-link) !important; }`
    );
  }
  if (supported.has("courseCards")) {
    rules.push(
      `${scopedSelectors("courseCards")} { padding: calc(1rem * var(--sc-native-space)) !important; }`
    );
  }
  if (supported.has("buttons")) {
    rules.push(
      `${scopedSelectors("buttons")} { border-radius: var(--sc-native-radius) !important; border-color: var(--sc-native-border) !important; }`
    );
  }
  if (supported.has("links")) {
    rules.push(`${scopedSelectors("links")} { color: var(--sc-native-body-link) !important; }`);
  }
  if (customization.hideLeftRail && supported.has("leftRail")) {
    rules.push(`${scopedSelectors("leftRail")} { display: none !important; }`);
  }
  if (customization.hideRightRail && supported.has("rightRail")) {
    rules.push(`${scopedSelectors("rightRail")} { display: none !important; }`);
  }
  if (customization.hideFooter && supported.has("footer")) {
    rules.push(`${scopedSelectors("footer")} { display: none !important; }`);
  }
  rules.push(
    "@media (prefers-reduced-motion: reduce) { html.sc-native-customized *, html.sc-native-customized *::before, html.sc-native-customized *::after { transition-duration: 0.01ms !important; animation-duration: 0.01ms !important; animation-iteration-count: 1 !important; } }"
  );
  return rules.join("\n");
}
