import type {
  Density,
  NativeCardTreatment,
  NativeContentWidth,
  NativeControlStyle,
  NativeCorners,
  NativeCustomization,
  NativeFont,
  NativeLayoutStyle,
  NativeMotionIntensity,
  NativeNavigationTreatment,
  NativePresetId,
  NativeRailTreatment,
  NativeShadow,
  NativeTabTreatment,
  NativeThemeTokens
} from "../../shared/models";
import { contrastRatio } from "./native-theme";

export type PresetCategory = "Light" | "Dark" | "High contrast" | "Expressive" | "Productivity";

export interface NativePresetSnapshot {
  cardTreatment: NativeCardTreatment;
  contentWidth: NativeContentWidth;
  controlStyle: NativeControlStyle;
  corners: NativeCorners;
  density: Density;
  font: NativeFont;
  layoutStyle: NativeLayoutStyle;
  motionIntensity: NativeMotionIntensity;
  navigationTreatment: NativeNavigationTreatment;
  railTreatment: NativeRailTreatment;
  shadow: NativeShadow;
  tabTreatment: NativeTabTreatment;
  tokens: NativeThemeTokens;
}

export interface NativeThemePreset {
  categories: readonly PresetCategory[];
  description: string;
  id: NativePresetId;
  name: string;
  snapshot: Readonly<NativePresetSnapshot>;
}

export interface PresetContrastResult {
  background: keyof NativeThemeTokens;
  foreground: keyof NativeThemeTokens;
  ratio: number;
  state: string;
  threshold: 3 | 4.5;
}

const light = (overrides: Partial<NativeThemeTokens> = {}): NativeThemeTokens => ({
  accent: "#4f46e5",
  activeTab: "#312e81",
  border: "#64748b",
  control: "#ffffff",
  elevatedSurface: "#ffffff",
  focusRing: "#005fcc",
  headerBackground: "#263247",
  headerText: "#ffffff",
  inactiveTab: "#475569",
  leftRail: "#eef2f7",
  link: "#1d4ed8",
  mutedText: "#4b5563",
  pageBackground: "#f4f6fa",
  primarySurface: "#ffffff",
  primaryText: "#172033",
  rightRail: "#ffffff",
  ...overrides
});

const dark = (overrides: Partial<NativeThemeTokens> = {}): NativeThemeTokens => ({
  accent: "#60a5fa",
  activeTab: "#bfdbfe",
  border: "#94a3b8",
  control: "#1e293b",
  elevatedSurface: "#182235",
  focusRing: "#fbbf24",
  headerBackground: "#0b1120",
  headerText: "#f8fafc",
  inactiveTab: "#cbd5e1",
  leftRail: "#111827",
  link: "#93c5fd",
  mutedText: "#cbd5e1",
  pageBackground: "#0f172a",
  primarySurface: "#162033",
  primaryText: "#f8fafc",
  rightRail: "#111827",
  ...overrides
});

function snapshot(
  tokens: NativeThemeTokens,
  style: Partial<Omit<NativePresetSnapshot, "tokens">> = {}
): NativePresetSnapshot {
  return {
    cardTreatment: "elevated",
    contentWidth: "default",
    controlStyle: "soft",
    corners: "soft",
    density: "comfortable",
    font: "system",
    layoutStyle: "soft-elevated",
    motionIntensity: "subtle",
    navigationTreatment: "solid",
    railTreatment: "cards",
    shadow: "subtle",
    tabTreatment: "segmented",
    tokens,
    ...style
  };
}

function preset(
  id: NativePresetId,
  name: string,
  description: string,
  categories: readonly PresetCategory[],
  value: NativePresetSnapshot
): NativeThemePreset {
  Object.freeze(value.tokens);
  Object.freeze(value);
  return Object.freeze({ categories, description, id, name, snapshot: value });
}

export const NATIVE_THEME_PRESETS: readonly NativeThemePreset[] = Object.freeze([
  preset(
    "clear-horizon",
    "Clear Horizon",
    "Balanced cool-white surfaces with soft elevation and a focused indigo navigation system.",
    ["Light"],
    snapshot(light())
  ),
  preset(
    "porcelain-air",
    "Porcelain Air",
    "Bright minimal surfaces, restrained blue accents, and flat navigation for an open workspace.",
    ["Light"],
    snapshot(
      light({
        accent: "#075985",
        activeTab: "#075985",
        elevatedSurface: "#f8fafc",
        headerBackground: "#f8fafc",
        headerText: "#172033",
        leftRail: "#f8fafc",
        link: "#075985",
        pageBackground: "#eef3f7",
        rightRail: "#f8fafc"
      }),
      {
        cardTreatment: "flat",
        controlStyle: "outlined",
        corners: "schoology",
        layoutStyle: "minimal-flat",
        navigationTreatment: "minimal",
        railTreatment: "flat",
        shadow: "none",
        tabTreatment: "underline"
      }
    )
  ),
  preset(
    "sandstone-notes",
    "Sandstone Notes",
    "Warm paper tones, editorial typography, and outlined cards for a calm reading-first layout.",
    ["Light", "Productivity"],
    snapshot(
      light({
        accent: "#9a3412",
        activeTab: "#7c2d12",
        border: "#766554",
        control: "#fffaf0",
        elevatedSurface: "#fffdf7",
        focusRing: "#9a3412",
        headerBackground: "#3d2b20",
        inactiveTab: "#624b3a",
        leftRail: "#f4eadc",
        link: "#8a2f12",
        mutedText: "#624b3a",
        pageBackground: "#f7f0e5",
        primarySurface: "#fffaf0",
        primaryText: "#2e2118",
        rightRail: "#fffaf0"
      }),
      {
        cardTreatment: "outlined",
        contentWidth: "focused",
        controlStyle: "outlined",
        corners: "schoology",
        font: "serif",
        layoutStyle: "editorial",
        navigationTreatment: "minimal",
        railTreatment: "outlined",
        shadow: "none",
        tabTreatment: "underline"
      }
    )
  ),
  preset(
    "arctic-ledger",
    "Arctic Ledger",
    "Crisp blue-gray surfaces with precise outlines and wide information-dense organization.",
    ["Light", "Productivity"],
    snapshot(
      light({
        accent: "#0369a1",
        activeTab: "#075985",
        border: "#64748b",
        elevatedSurface: "#f8fbff",
        focusRing: "#0369a1",
        headerBackground: "#164e63",
        leftRail: "#e7f1f6",
        link: "#075985",
        pageBackground: "#edf4f8",
        primarySurface: "#f8fbff",
        rightRail: "#eef6fa"
      }),
      {
        cardTreatment: "outlined",
        contentWidth: "wide",
        controlStyle: "compact",
        density: "compact",
        layoutStyle: "outlined",
        railTreatment: "outlined",
        shadow: "crisp",
        tabTreatment: "segmented"
      }
    )
  ),
  preset(
    "pressroom",
    "Pressroom",
    "Ink-on-paper contrast, serif hierarchy, and editorial spacing inspired by a modern journal.",
    ["Light", "Productivity"],
    snapshot(
      light({
        accent: "#7c2d12",
        activeTab: "#111111",
        border: "#606060",
        control: "#fffef8",
        elevatedSurface: "#fffef8",
        focusRing: "#9a3412",
        headerBackground: "#1f1f1f",
        inactiveTab: "#4b4b4b",
        leftRail: "#f2efe6",
        link: "#7c2d12",
        mutedText: "#4b4b4b",
        pageBackground: "#f4f1e8",
        primarySurface: "#fffef8",
        primaryText: "#171717",
        rightRail: "#fffef8"
      }),
      {
        cardTreatment: "flat",
        contentWidth: "focused",
        controlStyle: "outlined",
        corners: "schoology",
        font: "serif",
        layoutStyle: "editorial",
        motionIntensity: "none",
        navigationTreatment: "solid",
        railTreatment: "flat",
        shadow: "none",
        tabTreatment: "underline"
      }
    )
  ),
  preset(
    "graphite-line",
    "Graphite Line",
    "Monochrome geometry with crisp borders, minimal motion, and understated professional density.",
    ["Light", "Productivity"],
    snapshot(
      light({
        accent: "#303030",
        activeTab: "#111111",
        border: "#666666",
        focusRing: "#111111",
        headerBackground: "#262626",
        inactiveTab: "#505050",
        leftRail: "#eeeeee",
        link: "#303030",
        mutedText: "#505050",
        pageBackground: "#f3f3f3",
        primaryText: "#171717",
        rightRail: "#f7f7f7"
      }),
      {
        cardTreatment: "outlined",
        controlStyle: "compact",
        corners: "schoology",
        density: "compact",
        layoutStyle: "outlined",
        motionIntensity: "none",
        navigationTreatment: "minimal",
        railTreatment: "outlined",
        shadow: "crisp",
        tabTreatment: "underline"
      }
    )
  ),
  preset(
    "midnight-study",
    "Midnight Study",
    "Deep navy surfaces, luminous blue links, and soft raised cards for late-night study.",
    ["Dark"],
    snapshot(dark(), {
      cardTreatment: "elevated",
      corners: "round",
      navigationTreatment: "floating",
      shadow: "elevated",
      tabTreatment: "pills"
    })
  ),
  preset(
    "deep-current",
    "Deep Current",
    "Layered ocean-dark surfaces with cyan focus cues and streamlined segmented navigation.",
    ["Dark", "Expressive"],
    snapshot(
      dark({
        accent: "#22d3ee",
        activeTab: "#a5f3fc",
        border: "#7dd3fc",
        elevatedSurface: "#12324a",
        focusRing: "#facc15",
        headerBackground: "#06283d",
        leftRail: "#082f49",
        link: "#67e8f9",
        pageBackground: "#071f2f",
        primarySurface: "#0c2a3d",
        rightRail: "#082f49"
      }),
      {
        cardTreatment: "elevated",
        corners: "round",
        layoutStyle: "soft-elevated",
        motionIntensity: "expressive",
        navigationTreatment: "floating",
        shadow: "elevated",
        tabTreatment: "segmented"
      }
    )
  ),
  preset(
    "forest-night",
    "Forest Night",
    "Evergreen dark layers, mint interaction cues, and quiet elevated work surfaces.",
    ["Dark"],
    snapshot(
      dark({
        accent: "#6ee7b7",
        activeTab: "#a7f3d0",
        border: "#86b89f",
        elevatedSurface: "#17372d",
        focusRing: "#fbbf24",
        headerBackground: "#09251c",
        leftRail: "#102d24",
        link: "#6ee7b7",
        pageBackground: "#0b211a",
        primarySurface: "#123026",
        rightRail: "#102d24"
      }),
      {
        cardTreatment: "outlined",
        controlStyle: "soft",
        layoutStyle: "outlined",
        railTreatment: "outlined",
        tabTreatment: "pills"
      }
    )
  ),
  preset(
    "pure-oled",
    "Pure OLED",
    "True-black canvas with sharply separated surfaces and minimal glow-free elevation.",
    ["Dark", "High contrast"],
    snapshot(
      dark({
        accent: "#7dd3fc",
        activeTab: "#ffffff",
        border: "#a3a3a3",
        control: "#111111",
        elevatedSurface: "#101010",
        focusRing: "#facc15",
        headerBackground: "#000000",
        inactiveTab: "#d4d4d4",
        leftRail: "#080808",
        link: "#7dd3fc",
        mutedText: "#d4d4d4",
        pageBackground: "#000000",
        primarySurface: "#080808",
        rightRail: "#080808"
      }),
      {
        cardTreatment: "outlined",
        controlStyle: "outlined",
        corners: "schoology",
        layoutStyle: "minimal-flat",
        motionIntensity: "none",
        railTreatment: "outlined",
        shadow: "none",
        tabTreatment: "underline"
      }
    )
  ),
  preset(
    "signal-light",
    "Signal Light",
    "Maximum legibility on white with strong boundaries and unmistakable orange focus indicators.",
    ["Light", "High contrast"],
    snapshot(
      light({
        accent: "#0047a8",
        activeTab: "#000000",
        border: "#000000",
        focusRing: "#c2410c",
        headerBackground: "#000000",
        inactiveTab: "#303030",
        leftRail: "#ffffff",
        link: "#0047a8",
        mutedText: "#303030",
        pageBackground: "#ffffff",
        primaryText: "#000000"
      }),
      {
        cardTreatment: "outlined",
        controlStyle: "outlined",
        corners: "schoology",
        layoutStyle: "outlined",
        motionIntensity: "none",
        railTreatment: "outlined",
        shadow: "crisp",
        tabTreatment: "underline"
      }
    )
  ),
  preset(
    "signal-dark",
    "Signal Dark",
    "Near-black high contrast with white typography, cyan links, and a bright amber focus system.",
    ["Dark", "High contrast"],
    snapshot(
      dark({
        accent: "#67e8f9",
        activeTab: "#ffffff",
        border: "#ffffff",
        control: "#000000",
        elevatedSurface: "#111111",
        focusRing: "#facc15",
        headerBackground: "#000000",
        inactiveTab: "#e5e5e5",
        leftRail: "#080808",
        link: "#67e8f9",
        mutedText: "#e5e5e5",
        pageBackground: "#000000",
        primarySurface: "#080808",
        rightRail: "#080808"
      }),
      {
        cardTreatment: "outlined",
        controlStyle: "outlined",
        corners: "schoology",
        layoutStyle: "outlined",
        motionIntensity: "none",
        railTreatment: "outlined",
        shadow: "crisp",
        tabTreatment: "segmented"
      }
    )
  ),
  preset(
    "petal-mist",
    "Petal Mist",
    "Soft rose and lilac surfaces grounded by plum text and deliberately restrained elevation.",
    ["Light", "Expressive"],
    snapshot(
      light({
        accent: "#7e22ce",
        activeTab: "#6b21a8",
        border: "#77647f",
        control: "#fff7fc",
        elevatedSurface: "#fff8fd",
        focusRing: "#7e22ce",
        headerBackground: "#581c4f",
        inactiveTab: "#60435f",
        leftRail: "#f7eaf4",
        link: "#6b21a8",
        mutedText: "#60435f",
        pageBackground: "#faeff7",
        primarySurface: "#fff7fc",
        primaryText: "#32142f",
        rightRail: "#fff4fb"
      }),
      {
        cardTreatment: "elevated",
        corners: "round",
        layoutStyle: "soft-elevated",
        navigationTreatment: "floating",
        shadow: "subtle",
        tabTreatment: "pills"
      }
    )
  ),
  preset(
    "mint-canvas",
    "Mint Canvas",
    "Fresh mint-tinted surfaces with deep teal text and a clean low-distraction card system.",
    ["Light", "Expressive"],
    snapshot(
      light({
        accent: "#047857",
        activeTab: "#065f46",
        border: "#5f766e",
        control: "#f5fffb",
        elevatedSurface: "#fbfffd",
        focusRing: "#047857",
        headerBackground: "#134e4a",
        inactiveTab: "#405f57",
        leftRail: "#e5f5ee",
        link: "#047857",
        mutedText: "#405f57",
        pageBackground: "#edf9f3",
        primarySurface: "#f7fffb",
        primaryText: "#17352d",
        rightRail: "#f2fbf7"
      }),
      {
        cardTreatment: "flat",
        corners: "round",
        layoutStyle: "minimal-flat",
        navigationTreatment: "minimal",
        railTreatment: "flat",
        shadow: "none",
        tabTreatment: "segmented"
      }
    )
  ),
  preset(
    "electric-berry",
    "Electric Berry",
    "Bold magenta navigation and violet accents balanced by clean neutral work surfaces.",
    ["Light", "Expressive"],
    snapshot(
      light({
        accent: "#7c3aed",
        activeTab: "#5b21b6",
        border: "#685b78",
        focusRing: "#6d28d9",
        headerBackground: "#86198f",
        inactiveTab: "#55485f",
        leftRail: "#f3e8ff",
        link: "#6d28d9",
        mutedText: "#55485f",
        pageBackground: "#f7f2ff",
        primaryText: "#25133b",
        rightRail: "#fff7fe"
      }),
      {
        cardTreatment: "image-forward",
        corners: "round",
        layoutStyle: "soft-elevated",
        motionIntensity: "expressive",
        navigationTreatment: "floating",
        shadow: "elevated",
        tabTreatment: "pills"
      }
    )
  ),
  preset(
    "ocean-atlas",
    "Ocean Atlas",
    "Maritime blues, crisp cyan focus, and image-forward cards organized on a wide canvas.",
    ["Light", "Expressive"],
    snapshot(
      light({
        accent: "#0369a1",
        activeTab: "#075985",
        border: "#587486",
        elevatedSurface: "#f7fcff",
        focusRing: "#0369a1",
        headerBackground: "#0c4a6e",
        inactiveTab: "#425f70",
        leftRail: "#e5f3f9",
        link: "#075985",
        mutedText: "#425f70",
        pageBackground: "#eaf6fb",
        primarySurface: "#f8fcfe",
        primaryText: "#102f43",
        rightRail: "#f2f9fc"
      }),
      {
        cardTreatment: "image-forward",
        contentWidth: "wide",
        corners: "round",
        layoutStyle: "soft-elevated",
        motionIntensity: "expressive",
        navigationTreatment: "solid",
        shadow: "elevated",
        tabTreatment: "segmented"
      }
    )
  ),
  preset(
    "evergreen-desk",
    "Evergreen Desk",
    "Natural green structure, warm-white cards, and outlined rails for a grounded workspace.",
    ["Light", "Productivity"],
    snapshot(
      light({
        accent: "#166534",
        activeTab: "#14532d",
        border: "#637064",
        control: "#fffef7",
        elevatedSurface: "#fffef9",
        focusRing: "#166534",
        headerBackground: "#234b35",
        inactiveTab: "#4b5f50",
        leftRail: "#e9f0e7",
        link: "#166534",
        mutedText: "#4b5f50",
        pageBackground: "#f0f4ec",
        primarySurface: "#fbfdf7",
        primaryText: "#1d3123",
        rightRail: "#f7faf3"
      }),
      {
        cardTreatment: "outlined",
        controlStyle: "outlined",
        layoutStyle: "outlined",
        railTreatment: "outlined",
        shadow: "crisp",
        tabTreatment: "underline"
      }
    )
  ),
  preset(
    "solar-ember",
    "Solar Ember",
    "Sunset orange structure, aubergine depth, and expressive image-led course cards.",
    ["Light", "Expressive"],
    snapshot(
      light({
        accent: "#c2410c",
        activeTab: "#9a3412",
        border: "#786054",
        control: "#fffaf5",
        elevatedSurface: "#fffaf5",
        focusRing: "#c2410c",
        headerBackground: "#5b214e",
        inactiveTab: "#604b52",
        leftRail: "#f8e9df",
        link: "#9a3412",
        mutedText: "#604b52",
        pageBackground: "#fff1e8",
        primarySurface: "#fffaf5",
        primaryText: "#351c22",
        rightRail: "#fff6ef"
      }),
      {
        cardTreatment: "image-forward",
        corners: "round",
        layoutStyle: "soft-elevated",
        motionIntensity: "expressive",
        navigationTreatment: "floating",
        shadow: "elevated",
        tabTreatment: "pills"
      }
    )
  ),
  preset(
    "lavender-circuit",
    "Lavender Circuit",
    "Cool lavender layers with indigo structure and glass-like panels without fragile blur.",
    ["Light", "Expressive"],
    snapshot(
      light({
        accent: "#5b21b6",
        activeTab: "#4c1d95",
        border: "#6c6482",
        control: "#faf8ff",
        elevatedSurface: "#fbfaff",
        focusRing: "#5b21b6",
        headerBackground: "#35275f",
        inactiveTab: "#554f69",
        leftRail: "#eeebf8",
        link: "#5b21b6",
        mutedText: "#554f69",
        pageBackground: "#f2effb",
        primarySurface: "#faf8ff",
        primaryText: "#261c3b",
        rightRail: "#f7f4ff"
      }),
      {
        cardTreatment: "elevated",
        corners: "round",
        layoutStyle: "glass",
        navigationTreatment: "floating",
        shadow: "subtle",
        tabTreatment: "segmented"
      }
    )
  ),
  preset(
    "slate-sprint",
    "Slate Sprint",
    "Compact professional slate with crisp hierarchy, dense controls, and zero decorative motion.",
    ["Light", "Productivity"],
    snapshot(
      light({
        accent: "#334155",
        activeTab: "#1e293b",
        border: "#64748b",
        control: "#f8fafc",
        elevatedSurface: "#ffffff",
        focusRing: "#005fcc",
        headerBackground: "#1e293b",
        inactiveTab: "#475569",
        leftRail: "#e8edf3",
        link: "#1d4ed8",
        mutedText: "#475569",
        pageBackground: "#eef1f5",
        primarySurface: "#f8fafc",
        primaryText: "#172033",
        rightRail: "#f8fafc"
      }),
      {
        cardTreatment: "outlined",
        contentWidth: "wide",
        controlStyle: "compact",
        corners: "schoology",
        density: "compact",
        layoutStyle: "dense-productivity",
        motionIntensity: "none",
        navigationTreatment: "minimal",
        railTreatment: "outlined",
        shadow: "crisp",
        tabTreatment: "segmented"
      }
    )
  )
]);

export const NATIVE_THEME_PRESET_IDS = NATIVE_THEME_PRESETS.map(({ id }) => id);

const CONTRAST_PAIRS: ReadonlyArray<
  readonly [string, keyof NativeThemeTokens, keyof NativeThemeTokens, 3 | 4.5]
> = [
  ["page canvas text", "primaryText", "pageBackground", 4.5],
  ["surface text", "primaryText", "primarySurface", 4.5],
  ["card/modal/popover text", "primaryText", "elevatedSurface", 4.5],
  ["left rail text", "primaryText", "leftRail", 4.5],
  ["right rail text", "primaryText", "rightRail", 4.5],
  ["button/control default", "primaryText", "control", 4.5],
  ["button/control hover", "primaryText", "control", 4.5],
  ["button/control active", "primaryText", "control", 4.5],
  ["button/control disabled", "mutedText", "control", 4.5],
  ["surface muted text", "mutedText", "primarySurface", 4.5],
  ["card muted text", "mutedText", "elevatedSurface", 4.5],
  ["left rail muted text", "mutedText", "leftRail", 4.5],
  ["right rail muted text", "mutedText", "rightRail", 4.5],
  ["canvas link", "link", "pageBackground", 4.5],
  ["link default", "link", "primarySurface", 4.5],
  ["link hover", "link", "primarySurface", 4.5],
  ["link active", "link", "primarySurface", 4.5],
  ["card link", "link", "elevatedSurface", 4.5],
  ["left rail link", "link", "leftRail", 4.5],
  ["right rail link", "link", "rightRail", 4.5],
  ["navigation default", "headerText", "headerBackground", 4.5],
  ["navigation hover", "headerText", "headerBackground", 4.5],
  ["navigation selected", "headerText", "headerBackground", 4.5],
  ["tab selected", "activeTab", "primarySurface", 4.5],
  ["tab default", "inactiveTab", "primarySurface", 4.5],
  ["tab hover", "inactiveTab", "primarySurface", 4.5],
  ["surface boundary", "border", "primarySurface", 3],
  ["card/control boundary", "border", "elevatedSurface", 3],
  ["control boundary", "border", "control", 3],
  ["left rail boundary", "border", "leftRail", 3],
  ["right rail boundary", "border", "rightRail", 3],
  ["selected indicator", "accent", "primarySurface", 3],
  ["focus inner ring on surface", "focusRing", "primarySurface", 3],
  ["focus inner ring on control", "focusRing", "control", 3],
  ["focus outer ring on canvas", "primaryText", "pageBackground", 3],
  ["focus outer ring on card/modal/popover", "primaryText", "elevatedSurface", 3],
  ["focus outer ring on navigation", "headerText", "headerBackground", 3],
  ["focus outer ring on left rail", "primaryText", "leftRail", 3],
  ["focus outer ring on right rail", "primaryText", "rightRail", 3]
];

export function presetContrastMatrix(preset: NativeThemePreset): PresetContrastResult[] {
  return CONTRAST_PAIRS.map(([state, foreground, background, threshold]) => ({
    background,
    foreground,
    ratio: contrastRatio(preset.snapshot.tokens[foreground], preset.snapshot.tokens[background]),
    state,
    threshold
  }));
}

export function presetPassesContrast(preset: NativeThemePreset): boolean {
  return presetContrastMatrix(preset).every(({ ratio, threshold }) => ratio >= threshold);
}

export function findNativePreset(id: NativePresetId): NativeThemePreset {
  const preset = NATIVE_THEME_PRESETS.find((candidate) => candidate.id === id);
  if (!preset) throw new Error(`Unknown native theme preset: ${id}`);
  return preset;
}

export function applyNativePreset(
  current: NativeCustomization,
  id: NativePresetId
): NativeCustomization {
  const value = findNativePreset(id).snapshot;
  return {
    ...current,
    ...structuredClone(value),
    contrastMode: "automatic",
    presetId: id
  };
}

export function nativeCustomizationMatchesPreset(customization: NativeCustomization): boolean {
  const preset = findNativePreset(customization.presetId).snapshot;
  return (Object.keys(preset) as Array<keyof NativePresetSnapshot>).every((key) => {
    if (key === "tokens") {
      return (Object.keys(preset.tokens) as Array<keyof NativeThemeTokens>).every(
        (token) => preset.tokens[token] === customization.tokens[token]
      );
    }
    return preset[key] === customization[key];
  });
}
