import {
  DEFAULT_SETTINGS,
  type NativeContrastMode,
  type NativeCustomization,
  type NativeControlStyle,
  type NativeContentWidth,
  type NativeCorners,
  type NativeFont,
  type NativeLayoutStyle,
  type NativeMotionIntensity,
  type NativeNavigationTreatment,
  type NativePresetId,
  type NativeRailTreatment,
  type NativeShadow,
  type NativeTabTreatment,
  type NativeCardTreatment,
  type NativeThemeRegion,
  type NativeThemeTokens
} from "../../shared/models";

const HEX = /^#[0-9a-f]{6}$/i;
const FONTS: Record<Exclude<NativeFont, "native">, string> = {
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
  crisp: "3px 3px 0 rgb(20 28 45 / 24%)",
  elevated: "0 18px 40px rgb(20 28 45 / 18%)",
  none: "none",
  subtle: "0 8px 24px rgb(20 28 45 / 10%)"
};
const PRESET_IDS: readonly NativePresetId[] = [
  "clear-horizon",
  "porcelain-air",
  "sandstone-notes",
  "arctic-ledger",
  "pressroom",
  "graphite-line",
  "midnight-study",
  "deep-current",
  "forest-night",
  "pure-oled",
  "signal-light",
  "signal-dark",
  "petal-mist",
  "mint-canvas",
  "electric-berry",
  "ocean-atlas",
  "evergreen-desk",
  "solar-ember",
  "lavender-circuit",
  "slate-sprint"
];

export const NATIVE_THEME_TOKEN_LABELS: Record<keyof NativeThemeTokens, string> = {
  accent: "Accent",
  activeTab: "Active tab text",
  border: "Borders",
  control: "Controls",
  elevatedSurface: "Elevated and card surface",
  focusRing: "Focus ring",
  headerBackground: "Header and navigation background",
  headerText: "Header and navigation text",
  inactiveTab: "Inactive tab text",
  leftRail: "Left rail",
  link: "Links",
  mutedText: "Muted text",
  pageBackground: "Page background",
  primarySurface: "Primary surface",
  primaryText: "Primary text",
  rightRail: "Right and To Do rail"
};

export const HIGH_CONTRAST_TOKENS: NativeThemeTokens = {
  accent: "#005fcc",
  activeTab: "#000000",
  border: "#000000",
  control: "#ffffff",
  elevatedSurface: "#ffffff",
  focusRing: "#ff3b00",
  headerBackground: "#000000",
  headerText: "#ffffff",
  inactiveTab: "#303030",
  leftRail: "#ffffff",
  link: "#0047a8",
  mutedText: "#303030",
  pageBackground: "#ffffff",
  primarySurface: "#ffffff",
  primaryText: "#000000",
  rightRail: "#ffffff"
};

export interface ContrastDiagnostic {
  background: string;
  meets: boolean;
  ratio: number;
  requested: string;
  resolved: string;
  threshold: number;
}

function choice<T extends string>(value: unknown, choices: readonly T[], fallback: T): T {
  return typeof value === "string" && choices.includes(value as T) ? (value as T) : fallback;
}

function sanitizeTokens(value: unknown, legacy: Record<string, unknown>): NativeThemeTokens {
  const defaults = DEFAULT_SETTINGS.nativeCustomization.tokens;
  const input =
    typeof value === "object" && value !== null ? (value as Record<string, unknown>) : {};
  const color = (key: keyof NativeThemeTokens, legacyKey?: string): string => {
    const candidate = input[key] ?? (legacyKey ? legacy[legacyKey] : undefined);
    return typeof candidate === "string" && HEX.test(candidate) ? candidate : defaults[key];
  };
  return {
    accent: color("accent"),
    activeTab: color("activeTab"),
    border: color("border", "border"),
    control: color("control"),
    elevatedSurface: color("elevatedSurface", "surface"),
    focusRing: color("focusRing"),
    headerBackground: color("headerBackground"),
    headerText: color("headerText"),
    inactiveTab: color("inactiveTab"),
    leftRail: color("leftRail"),
    link: color("link"),
    mutedText: color("mutedText"),
    pageBackground: color("pageBackground", "background"),
    primarySurface: color("primarySurface", "surface"),
    primaryText: color("primaryText", "text"),
    rightRail: color("rightRail", "surface")
  };
}

export function sanitizeNativeCustomization(value: unknown): NativeCustomization {
  const defaults = DEFAULT_SETTINGS.nativeCustomization;
  if (typeof value !== "object" || value === null) return structuredClone(defaults);
  const input = value as Record<string, unknown>;
  const explicitVisibility = input.visibilityControlsVersion === 1;
  return {
    cardTreatment: choice<NativeCardTreatment>(
      input.cardTreatment,
      ["flat", "elevated", "outlined", "image-forward"],
      defaults.cardTreatment
    ),
    contentWidth: choice(input.contentWidth, ["default", "focused", "wide"], defaults.contentWidth),
    contrastMode: choice<NativeContrastMode>(
      input.contrastMode,
      ["automatic", "preserve", "high-contrast", "manual"],
      defaults.contrastMode
    ),
    controlStyle: choice<NativeControlStyle>(
      input.controlStyle,
      ["solid", "soft", "outlined", "compact"],
      defaults.controlStyle
    ),
    corners: choice(input.corners, ["schoology", "soft", "round"], defaults.corners),
    density: choice(input.density, ["comfortable", "compact"], defaults.density),
    enabled: input.enabled !== false,
    font: choice(input.font, ["native", "system", "humanist", "rounded", "serif"], defaults.font),
    hideFooter: explicitVisibility && input.hideFooter === true,
    hideLeftRail: explicitVisibility && input.hideLeftRail === true,
    hideRightRail: explicitVisibility && input.hideRightRail === true,
    layoutStyle: choice<NativeLayoutStyle>(
      input.layoutStyle,
      ["minimal-flat", "soft-elevated", "outlined", "glass", "editorial", "dense-productivity"],
      defaults.layoutStyle
    ),
    motionIntensity: choice<NativeMotionIntensity>(
      input.motionIntensity,
      ["none", "subtle", "expressive"],
      defaults.motionIntensity
    ),
    navigationTreatment: choice<NativeNavigationTreatment>(
      input.navigationTreatment,
      ["solid", "floating", "minimal"],
      defaults.navigationTreatment
    ),
    presetId: choice(input.presetId, PRESET_IDS, defaults.presetId),
    railTreatment: choice<NativeRailTreatment>(
      input.railTreatment,
      ["flat", "cards", "outlined"],
      defaults.railTreatment
    ),
    shadow: choice(input.shadow, ["none", "subtle", "elevated", "crisp"], defaults.shadow),
    tabTreatment: choice<NativeTabTreatment>(
      input.tabTreatment,
      ["underline", "segmented", "pills"],
      defaults.tabTreatment
    ),
    tokens: sanitizeTokens(input.tokens, input),
    visibilityControlsVersion: 1
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

export function resolveForeground(
  requested: string,
  background: string,
  mode: NativeContrastMode,
  alternatives: readonly string[] = [],
  threshold = 4.5
): ContrastDiagnostic {
  const requestedRatio = contrastRatio(requested, background);
  if (mode !== "automatic" || requestedRatio >= threshold) {
    return {
      background,
      meets: requestedRatio >= threshold,
      ratio: requestedRatio,
      requested,
      resolved: requested,
      threshold
    };
  }
  const candidates = [...new Set([...alternatives, "#000000", "#ffffff"])]
    .filter((candidate) => HEX.test(candidate))
    .map((candidate) => ({ candidate, ratio: contrastRatio(candidate, background) }))
    .sort((left, right) => right.ratio - left.ratio);
  const selected = candidates.find(({ ratio }) => ratio >= threshold) ?? candidates[0]!;
  return {
    background,
    meets: selected.ratio >= threshold,
    ratio: selected.ratio,
    requested,
    resolved: selected.candidate,
    threshold
  };
}

export function safeTextColor(requested: string, background: string, minimumRatio = 4.5): string {
  return resolveForeground(requested, background, "automatic", [], minimumRatio).resolved;
}

export function effectiveNativeTokens(customization: NativeCustomization): NativeThemeTokens {
  return customization.contrastMode === "high-contrast"
    ? structuredClone(HIGH_CONTRAST_TOKENS)
    : structuredClone(customization.tokens);
}

const TOKEN_BACKGROUNDS: Record<keyof NativeThemeTokens, keyof NativeThemeTokens> = {
  accent: "primarySurface",
  activeTab: "primarySurface",
  border: "primarySurface",
  control: "primarySurface",
  elevatedSurface: "primaryText",
  focusRing: "primarySurface",
  headerBackground: "headerText",
  headerText: "headerBackground",
  inactiveTab: "primarySurface",
  leftRail: "primaryText",
  link: "primarySurface",
  mutedText: "primarySurface",
  pageBackground: "primaryText",
  primarySurface: "primaryText",
  primaryText: "primarySurface",
  rightRail: "primaryText"
};

export function tokenContrastDiagnostic(
  customization: NativeCustomization,
  key: keyof NativeThemeTokens
): ContrastDiagnostic {
  const tokens = effectiveNativeTokens(customization);
  const backgroundKey = TOKEN_BACKGROUNDS[key];
  const foregroundKeys: ReadonlySet<keyof NativeThemeTokens> = new Set([
    "accent",
    "activeTab",
    "border",
    "focusRing",
    "headerText",
    "inactiveTab",
    "link",
    "mutedText",
    "primaryText"
  ]);
  const threshold = key === "border" || key === "focusRing" ? 3 : 4.5;
  if (foregroundKeys.has(key)) {
    return resolveForeground(
      tokens[key],
      tokens[backgroundKey],
      customization.contrastMode,
      [tokens.primaryText, tokens.mutedText, tokens.link, tokens.headerText],
      threshold
    );
  }
  const pairedText = key === "headerBackground" ? tokens.headerText : tokens.primaryText;
  const paired = resolveForeground(
    pairedText,
    tokens[key],
    customization.contrastMode,
    [tokens.mutedText, tokens.link, tokens.headerText],
    4.5
  );
  return {
    ...paired,
    requested: tokens[key],
    resolved: tokens[key]
  };
}

export function resetNativeSetting<K extends keyof NativeCustomization>(
  current: NativeCustomization,
  key: K
): NativeCustomization {
  return { ...current, [key]: structuredClone(DEFAULT_SETTINGS.nativeCustomization[key]) };
}

export function resetNativeToken(
  current: NativeCustomization,
  key: keyof NativeThemeTokens
): NativeCustomization {
  return {
    ...current,
    tokens: { ...current.tokens, [key]: DEFAULT_SETTINGS.nativeCustomization.tokens[key] }
  };
}

function regionRule(
  region: NativeThemeRegion,
  background: string,
  text: string,
  link: string,
  extra = "",
  paintText = true
): string {
  return `html.sc-native-customized [data-sc-region="${region}"] { --sc-region-bg: ${background}; --sc-region-text: ${text}; --sc-region-link: ${link}; background-color: var(--sc-region-bg) !important; ${paintText ? "color: var(--sc-region-text) !important;" : ""} ${extra} }`;
}

export function generateNativeThemeCss(
  customization: NativeCustomization,
  supported: ReadonlySet<NativeThemeRegion>
): string {
  if (!customization.enabled) return "";
  const tokens = effectiveNativeTokens(customization);
  const mode = customization.contrastMode;
  const readable = (requested: string, background: string, threshold = 4.5): string =>
    resolveForeground(
      requested,
      background,
      mode,
      [tokens.primaryText, tokens.mutedText, tokens.link, tokens.headerText],
      threshold
    ).resolved;
  const radius = RADII[customization.corners];
  const shadow = SHADOWS[customization.shadow];
  const spacing = customization.density === "compact" ? "0.72" : "1";
  const motionDuration =
    customization.motionIntensity === "none"
      ? "0ms"
      : customization.motionIntensity === "expressive"
        ? "220ms"
        : "140ms";
  const lift =
    customization.motionIntensity === "none"
      ? "none"
      : customization.motionIntensity === "expressive"
        ? "translateY(-4px)"
        : "translateY(-2px)";
  const surfaceText = readable(tokens.primaryText, tokens.primarySurface);
  const surfaceLink = readable(tokens.link, tokens.primarySurface);
  const elevatedText = readable(tokens.primaryText, tokens.elevatedSurface);
  const elevatedLink = readable(tokens.link, tokens.elevatedSurface);
  const pageText = readable(tokens.primaryText, tokens.pageBackground);
  const pageLink = readable(tokens.link, tokens.pageBackground);
  const leftText = readable(tokens.primaryText, tokens.leftRail);
  const leftLink = readable(tokens.link, tokens.leftRail);
  const rightText = readable(tokens.primaryText, tokens.rightRail);
  const rightLink = readable(tokens.link, tokens.rightRail);
  const headerText = readable(tokens.headerText, tokens.headerBackground);
  const controlText = readable(tokens.primaryText, tokens.control);
  const rules: string[] = [
    `html.sc-native-customized { --sc-native-border: ${tokens.border}; --sc-native-accent: ${tokens.accent}; --sc-native-focus: ${tokens.focusRing}; --sc-native-control: ${tokens.control}; --sc-native-control-text: ${controlText}; --sc-native-muted: ${readable(tokens.mutedText, tokens.primarySurface)}; --sc-native-radius: ${radius}; --sc-native-shadow: ${shadow}; --sc-native-space: ${spacing}; --sc-native-motion: ${motionDuration}; --sc-native-lift: ${lift}; }`
  ];

  const add = (region: NativeThemeRegion, rule: string): void => {
    if (supported.has(region)) rules.push(rule);
  };
  add(
    "page-canvas",
    regionRule("page-canvas", tokens.pageBackground, pageText, pageLink, "", false)
  );
  add("home-shell", regionRule("home-shell", tokens.pageBackground, pageText, pageLink, "", false));
  add(
    "center-column",
    regionRule("center-column", tokens.pageBackground, pageText, pageLink, "", false)
  );
  add(
    "content-wrapper",
    regionRule("content-wrapper", tokens.primarySurface, surfaceText, surfaceLink, "", false)
  );
  add("center-top", regionRule("center-top", tokens.primarySurface, surfaceText, surfaceLink));
  add(
    "home-feed",
    regionRule("home-feed", tokens.primarySurface, surfaceText, surfaceLink, "", false)
  );
  add(
    "institution-header",
    regionRule("institution-header", tokens.headerBackground, headerText, headerText)
  );
  add(
    "dashboard-tabs",
    regionRule(
      "dashboard-tabs",
      tokens.primarySurface,
      surfaceText,
      surfaceLink,
      "border-color: var(--sc-native-border) !important;"
    )
  );
  add(
    "dashboard-grid",
    regionRule("dashboard-grid", tokens.pageBackground, pageText, pageLink, "", false)
  );
  add(
    "course-card",
    regionRule(
      "course-card",
      tokens.elevatedSurface,
      elevatedText,
      elevatedLink,
      "border-color: var(--sc-native-border) !important; border-radius: var(--sc-native-radius) !important; box-shadow: var(--sc-native-shadow) !important;"
    )
  );
  add(
    "course-card-content",
    regionRule("course-card-content", tokens.primarySurface, surfaceText, surfaceLink)
  );
  add("left-rail", regionRule("left-rail", tokens.leftRail, leftText, leftLink));
  add("right-rail", regionRule("right-rail", tokens.rightRail, rightText, rightLink));
  add("right-rail-inner", regionRule("right-rail-inner", tokens.rightRail, rightText, rightLink));
  add(
    "surface",
    regionRule(
      "surface",
      tokens.primarySurface,
      surfaceText,
      surfaceLink,
      "border-color: var(--sc-native-border) !important; border-radius: var(--sc-native-radius) !important;"
    )
  );
  add(
    "modal",
    regionRule(
      "modal",
      tokens.elevatedSurface,
      elevatedText,
      elevatedLink,
      "border-color: var(--sc-native-border) !important; border-radius: var(--sc-native-radius) !important; box-shadow: var(--sc-native-shadow) !important;"
    )
  );
  add(
    "popover",
    regionRule(
      "popover",
      tokens.elevatedSurface,
      elevatedText,
      elevatedLink,
      "border-color: var(--sc-native-border) !important; border-radius: var(--sc-native-radius) !important; box-shadow: var(--sc-native-shadow) !important;"
    )
  );
  add("footer", regionRule("footer", tokens.primarySurface, surfaceText, surfaceLink));

  rules.push(
    'html.sc-native-customized [data-sc-theme-role="text"] { color: var(--sc-region-text) !important; }',
    'html.sc-native-customized [data-sc-theme-role="muted"] { color: color-mix(in srgb, var(--sc-region-text) 72%, var(--sc-region-bg)) !important; }',
    'html.sc-native-customized [data-sc-theme-role="link"] { color: var(--sc-region-link) !important; }',
    `html.sc-native-customized [data-sc-theme-role="tab-active"] { color: ${readable(tokens.activeTab, tokens.primarySurface)} !important; border-color: ${tokens.accent} !important; }`,
    `html.sc-native-customized [data-sc-theme-role="tab-inactive"] { color: ${readable(tokens.inactiveTab, tokens.primarySurface)} !important; }`,
    'html.sc-native-customized [data-sc-theme-role="control"] { background-color: var(--sc-native-control) !important; color: var(--sc-native-control-text) !important; border-color: var(--sc-native-border) !important; border-radius: var(--sc-native-radius) !important; }',
    'html.sc-native-customized [data-sc-theme-role="icon-control"] { color: currentColor !important; border-color: transparent !important; }',
    'html.sc-native-customized [data-sc-theme-role="link"]:hover { text-decoration: underline !important; text-decoration-thickness: 0.12em !important; }',
    'html.sc-native-customized [data-sc-theme-role="control"]:hover { box-shadow: 0 0 0 2px var(--sc-native-border) !important; }',
    'html.sc-native-customized [data-sc-theme-role="control"]:active { transform: translateY(1px); }',
    'html.sc-native-customized [data-sc-theme-role="control"]:disabled, html.sc-native-customized [data-sc-theme-role="control"][aria-disabled="true"] { cursor: not-allowed !important; color: var(--sc-native-muted) !important; border-style: dashed !important; }',
    "html.sc-native-customized [data-sc-theme-role]:focus-visible { outline: 3px solid var(--sc-native-focus) !important; outline-offset: 2px !important; box-shadow: 0 0 0 5px var(--sc-region-text) !important; }",
    "html.sc-native-customized .sc-native-auto-contrast { color: var(--sc-native-auto-fg) !important; }"
  );

  rules.push("/* sc-layout-start */");
  const componentRules = [
    'html.sc-native-customized [data-sc-region="institution-header"] { min-height: 3.75rem; padding: calc(0.65rem * var(--sc-native-space)) clamp(0.9rem, 3vw, 2rem) !important; border-bottom: 1px solid var(--sc-native-border) !important; }',
    'html.sc-native-customized [data-sc-region="institution-header"] nav { display: flex; align-items: center; flex-wrap: wrap; gap: calc(0.4rem * var(--sc-native-space)); }',
    'html.sc-native-customized [data-sc-region="institution-header"] [data-sc-theme-role="link"], html.sc-native-customized [data-sc-region="institution-header"] [data-sc-theme-role="icon-control"] { display: inline-flex; min-height: 2.5rem; align-items: center; border-radius: var(--sc-native-radius); padding: 0.5rem 0.75rem !important; text-decoration: none !important; transition: outline-color var(--sc-native-motion), transform var(--sc-native-motion), box-shadow var(--sc-native-motion); }',
    'html.sc-native-customized [data-sc-region="institution-header"] [aria-current="page"], html.sc-native-customized [data-sc-region="institution-header"] [aria-selected="true"] { box-shadow: inset 0 -3px 0 var(--sc-native-accent) !important; font-weight: 750 !important; }',
    'html.sc-native-customized [data-sc-region="dashboard-tabs"] { display: flex; align-items: center; gap: calc(0.4rem * var(--sc-native-space)); margin-block: calc(0.75rem * var(--sc-native-space)); padding: calc(0.4rem * var(--sc-native-space)) !important; }',
    'html.sc-native-customized [data-sc-region="dashboard-tabs"] [role="tablist"] { display: flex; flex-wrap: wrap; gap: calc(0.35rem * var(--sc-native-space)); }',
    'html.sc-native-customized [data-sc-theme-role^="tab-"] { display: inline-flex; min-height: 2.65rem; align-items: center; border: 1px solid transparent !important; border-radius: var(--sc-native-radius); padding: 0.55rem 0.85rem !important; text-decoration: none !important; transition: transform var(--sc-native-motion), box-shadow var(--sc-native-motion); }',
    'html.sc-native-customized [data-sc-theme-role="tab-active"] { border-color: var(--sc-native-accent) !important; box-shadow: inset 0 -3px 0 var(--sc-native-accent) !important; font-weight: 800 !important; }',
    'html.sc-native-customized [data-sc-region="home-shell"], html.sc-native-customized [data-sc-region="center-column"], html.sc-native-customized [data-sc-region="content-wrapper"] { min-width: 0 !important; }',
    'html.sc-native-customized [data-sc-region="center-column"] { overflow-x: clip; }',
    'html.sc-native-customized [data-sc-region="right-rail"] { flex-shrink: 0; }',
    'html.sc-native-customized [data-sc-region="content-wrapper"] { padding: clamp(0.75rem, 2vw, 1.5rem) !important; }',
    'html.sc-native-customized [data-sc-region="dashboard-grid"] { gap: clamp(0.75rem, 2vw, 1.35rem) !important; padding-block: calc(0.5rem * var(--sc-native-space)) !important; }',
    'html.sc-native-customized [data-sc-region="course-card"] { overflow: hidden; min-width: 0; transition: transform var(--sc-native-motion), box-shadow var(--sc-native-motion), outline-color var(--sc-native-motion); }',
    'html.sc-native-customized [data-sc-region="course-card"]:hover { transform: var(--sc-native-lift); box-shadow: var(--sc-native-shadow) !important; }',
    'html.sc-native-customized [data-sc-region="course-card"]:focus-within { outline: 3px solid var(--sc-native-focus) !important; outline-offset: 2px !important; }',
    'html.sc-native-customized [data-sc-region="course-card"] > img, html.sc-native-customized [data-sc-region="course-card"] picture img { display: block; width: 100%; aspect-ratio: 16 / 9; object-fit: cover; }',
    'html.sc-native-customized [data-sc-region="course-card-content"] { min-width: 0; padding: calc(0.9rem * var(--sc-native-space)) !important; }',
    'html.sc-native-customized [data-sc-region="course-card-content"] [data-sc-theme-role="link"] { font-weight: 800 !important; line-height: 1.25 !important; }',
    'html.sc-native-customized [data-sc-region="left-rail"], html.sc-native-customized [data-sc-region="right-rail-inner"] { padding: calc(0.8rem * var(--sc-native-space)) !important; }',
    'html.sc-native-customized [data-sc-region="right-rail-inner"] > section, html.sc-native-customized [data-sc-region="right-rail-inner"] > div:not(:empty), html.sc-native-customized [data-sc-region="left-rail"] > section { margin-block: calc(0.55rem * var(--sc-native-space)); border: 1px solid var(--sc-native-border); border-radius: var(--sc-native-radius); padding: calc(0.8rem * var(--sc-native-space)); }',
    'html.sc-native-customized [data-sc-theme-role="control"] { min-height: 2.65rem; padding: 0.55rem 0.8rem !important; transition: transform var(--sc-native-motion), box-shadow var(--sc-native-motion); }',
    'html.sc-native-customized [data-sc-region="modal"] { max-width: min(42rem, calc(100vw - 2rem)); padding: calc(1.25rem * var(--sc-native-space)) !important; }',
    'html.sc-native-customized [data-sc-region="popover"] { padding: calc(0.55rem * var(--sc-native-space)) !important; }',
    'html.sc-native-customized [data-sc-theme-role="empty"] { display: grid; min-height: 8rem; place-items: center; border: 1px dashed var(--sc-native-border); border-radius: var(--sc-native-radius); color: var(--sc-region-text) !important; padding: 1.5rem !important; text-align: center; }'
  ];
  rules.push(...componentRules);

  if (customization.navigationTreatment === "floating") {
    rules.push(
      'html.sc-native-customized [data-sc-region="institution-header"] { width: min(96rem, calc(100% - 1rem)); margin: 0.5rem auto !important; border: 1px solid var(--sc-native-border) !important; border-radius: var(--sc-native-radius) !important; box-shadow: var(--sc-native-shadow) !important; }'
    );
  } else if (customization.navigationTreatment === "minimal") {
    rules.push(
      'html.sc-native-customized [data-sc-region="institution-header"] { box-shadow: none !important; }'
    );
  }
  if (customization.tabTreatment === "underline") {
    rules.push(
      'html.sc-native-customized [data-sc-theme-role^="tab-"] { border-width: 0 0 3px !important; border-radius: 0 !important; box-shadow: none !important; }'
    );
  } else if (customization.tabTreatment === "pills") {
    rules.push(
      'html.sc-native-customized [data-sc-region="dashboard-tabs"] { border-radius: calc(var(--sc-native-radius) * 1.5) !important; }',
      'html.sc-native-customized [data-sc-theme-role="tab-active"] { box-shadow: 0 0 0 2px var(--sc-native-accent) !important; }'
    );
  }
  if (customization.railTreatment === "flat") {
    rules.push(
      'html.sc-native-customized [data-sc-region="left-rail"], html.sc-native-customized [data-sc-region="right-rail-inner"], html.sc-native-customized [data-sc-region="right-rail-inner"] > section, html.sc-native-customized [data-sc-region="right-rail-inner"] > div:not(:empty), html.sc-native-customized [data-sc-region="left-rail"] > section { border-color: transparent !important; box-shadow: none !important; }'
    );
  } else if (customization.railTreatment === "outlined") {
    rules.push(
      'html.sc-native-customized [data-sc-region="left-rail"], html.sc-native-customized [data-sc-region="right-rail-inner"] { border: 1px solid var(--sc-native-border) !important; border-radius: var(--sc-native-radius) !important; box-shadow: none !important; }'
    );
  }
  if (customization.cardTreatment === "flat") {
    rules.push(
      'html.sc-native-customized [data-sc-region="course-card"] { border-color: transparent !important; box-shadow: none !important; }'
    );
  } else if (customization.cardTreatment === "outlined") {
    rules.push(
      'html.sc-native-customized [data-sc-region="course-card"] { border: 1px solid var(--sc-native-border) !important; box-shadow: none !important; }'
    );
  } else if (customization.cardTreatment === "image-forward") {
    rules.push(
      'html.sc-native-customized [data-sc-region="course-card"] > img, html.sc-native-customized [data-sc-region="course-card"] picture img { aspect-ratio: 3 / 2; }'
    );
  }
  if (customization.controlStyle === "outlined") {
    rules.push(
      'html.sc-native-customized [data-sc-theme-role="control"] { border-width: 2px !important; box-shadow: none !important; }'
    );
  } else if (customization.controlStyle === "compact") {
    rules.push(
      'html.sc-native-customized [data-sc-theme-role="control"] { min-height: 2.2rem; padding: 0.35rem 0.6rem !important; }'
    );
  } else if (customization.controlStyle === "solid") {
    rules.push(
      'html.sc-native-customized button[data-sc-theme-role="control"], html.sc-native-customized [role="button"][data-sc-theme-role="control"] { border-color: var(--sc-native-accent) !important; }'
    );
  }
  if (customization.layoutStyle === "glass") {
    rules.push(
      'html.sc-native-customized [data-sc-region="course-card"], html.sc-native-customized [data-sc-region="modal"], html.sc-native-customized [data-sc-region="popover"] { background-color: color-mix(in srgb, var(--sc-region-bg) 92%, transparent) !important; border: 1px solid var(--sc-native-border) !important; }'
    );
  } else if (customization.layoutStyle === "dense-productivity") {
    rules.push(
      'html.sc-native-customized [data-sc-region="dashboard-grid"] { gap: 0.55rem !important; }',
      'html.sc-native-customized [data-sc-region="course-card-content"], html.sc-native-customized [data-sc-region="left-rail"], html.sc-native-customized [data-sc-region="right-rail-inner"] { padding: 0.55rem !important; }'
    );
  } else if (customization.layoutStyle === "editorial") {
    rules.push(
      'html.sc-native-customized [data-sc-region="course-card-content"] [data-sc-theme-role="link"], html.sc-native-customized [data-sc-region="surface"] h1, html.sc-native-customized [data-sc-region="surface"] h2 { letter-spacing: -0.015em; line-height: 1.15 !important; }'
    );
  }
  if (customization.font !== "native") {
    rules.push(
      `html.sc-native-customized [data-sc-region] { font-family: ${FONTS[customization.font]} !important; }`
    );
  }
  const width = WIDTHS[customization.contentWidth];
  if (width !== "none" && supported.has("content-wrapper")) {
    rules.push(
      `html.sc-native-customized [data-sc-region="content-wrapper"]:not(:has(#right-column)):not(:has(.course-dashboard)):not(:has([data-sc-region="dashboard-grid"])) { width: min(100%, ${width}); max-width: ${width}; margin-inline: auto !important; }`
    );
  }
  if (customization.hideLeftRail && supported.has("left-rail")) {
    rules.push(
      'html.sc-native-customized [data-sc-region="left-rail"] { display: none !important; }'
    );
  }
  if (customization.hideRightRail && supported.has("right-rail")) {
    rules.push(
      'html.sc-native-customized [data-sc-region="right-rail"] { display: none !important; }'
    );
  }
  if (customization.hideFooter && supported.has("footer")) {
    rules.push('html.sc-native-customized [data-sc-region="footer"] { display: none !important; }');
  }
  rules.push(
    '@media (max-width: 44rem) { html.sc-native-customized [data-sc-region="content-wrapper"] { width: 100%; max-width: 100%; } html.sc-native-customized [data-sc-region="right-rail"], html.sc-native-customized [data-sc-region="left-rail"] { max-width: 100%; } }',
    '@media (prefers-reduced-motion: reduce) { html.sc-native-customized [data-sc-region], html.sc-native-customized [data-sc-region] * { transition-duration: 0.01ms !important; animation-duration: 0.01ms !important; animation-iteration-count: 1 !important; } html.sc-native-customized [data-sc-region="course-card"]:hover, html.sc-native-customized [data-sc-theme-role="control"]:active { transform: none !important; } }'
  );
  return rules.join("\n");
}
