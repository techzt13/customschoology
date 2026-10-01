import {
  DEFAULT_SETTINGS,
  type NativeContrastMode,
  type NativeCustomization,
  type NativeContentWidth,
  type NativeCorners,
  type NativeFont,
  type NativeShadow,
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
  none: "none",
  subtle: "0 8px 24px rgb(20 28 45 / 10%)"
};

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
  return {
    contentWidth: choice(input.contentWidth, ["default", "focused", "wide"], defaults.contentWidth),
    contrastMode: choice<NativeContrastMode>(
      input.contrastMode,
      ["automatic", "preserve", "high-contrast", "manual"],
      defaults.contrastMode
    ),
    corners: choice(input.corners, ["schoology", "soft", "round"], defaults.corners),
    enabled: input.enabled !== false,
    font: choice(input.font, ["native", "system", "humanist", "rounded", "serif"], defaults.font),
    hideFooter: input.hideFooter === true,
    hideLeftRail: input.hideLeftRail === true,
    hideRightRail: input.hideRightRail === true,
    shadow: choice(input.shadow, ["none", "subtle"], defaults.shadow),
    tokens: sanitizeTokens(input.tokens, input)
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
  density: "comfortable" | "compact",
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
  const spacing = density === "compact" ? "0.72" : "1";
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
    `html.sc-native-customized { --sc-native-border: ${tokens.border}; --sc-native-accent: ${tokens.accent}; --sc-native-focus: ${tokens.focusRing}; --sc-native-control: ${tokens.control}; --sc-native-control-text: ${controlText}; --sc-native-radius: ${radius}; --sc-native-shadow: ${shadow}; --sc-native-space: ${spacing}; }`
  ];

  const add = (region: NativeThemeRegion, rule: string): void => {
    if (supported.has(region)) rules.push(rule);
  };
  add(
    "page-canvas",
    regionRule("page-canvas", tokens.pageBackground, pageText, pageLink, "", false)
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
    'html.sc-native-customized [data-sc-theme-role="link"]:hover, html.sc-native-customized [data-sc-theme-role^="tab-"]:hover { text-decoration: underline !important; text-decoration-thickness: 0.12em !important; }',
    'html.sc-native-customized [data-sc-theme-role="control"]:hover { filter: brightness(0.96); }',
    'html.sc-native-customized [data-sc-theme-role="control"]:active { filter: brightness(0.9); }',
    'html.sc-native-customized [data-sc-theme-role="control"]:disabled, html.sc-native-customized [data-sc-theme-role="control"][aria-disabled="true"] { cursor: not-allowed !important; opacity: 0.58 !important; }',
    "html.sc-native-customized [data-sc-theme-role]:focus-visible { outline: 3px solid var(--sc-native-focus) !important; outline-offset: 2px !important; }",
    "html.sc-native-customized .sc-native-auto-contrast { color: var(--sc-native-auto-fg) !important; }"
  );
  if (customization.font !== "native") {
    rules.push(
      `html.sc-native-customized [data-sc-region] { font-family: ${FONTS[customization.font]} !important; }`
    );
  }
  const width = WIDTHS[customization.contentWidth];
  if (width !== "none" && supported.has("page-canvas")) {
    rules.push(
      `html.sc-native-customized main[data-sc-region="page-canvas"], html.sc-native-customized #main[data-sc-region="page-canvas"], html.sc-native-customized #main-content[data-sc-region="page-canvas"] { width: min(100%, ${width}); max-width: ${width}; margin-inline: auto !important; }`
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
    '@media (max-width: 44rem) { html.sc-native-customized main[data-sc-region="page-canvas"], html.sc-native-customized #main[data-sc-region="page-canvas"], html.sc-native-customized #main-content[data-sc-region="page-canvas"] { width: 100%; max-width: 100%; } html.sc-native-customized [data-sc-region="right-rail"], html.sc-native-customized [data-sc-region="left-rail"] { max-width: 100%; } }',
    "@media (prefers-reduced-motion: reduce) { html.sc-native-customized [data-sc-region], html.sc-native-customized [data-sc-region] * { transition-duration: 0.01ms !important; animation-duration: 0.01ms !important; animation-iteration-count: 1 !important; } }"
  );
  return rules.join("\n");
}
