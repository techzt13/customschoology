export type ThemePreset = "system" | "calm" | "contrast" | "expressive";
export type Density = "comfortable" | "compact";
export type NativeFont = "native" | "system" | "humanist" | "rounded" | "serif";
export type NativeContentWidth = "default" | "focused" | "wide";
export type NativeCorners = "schoology" | "soft" | "round";
export type NativeShadow = "none" | "subtle" | "elevated" | "crisp";
export type NativeContrastMode = "automatic" | "preserve" | "high-contrast" | "manual";
export type NativeControlStyle = "solid" | "soft" | "outlined" | "compact";
export type NativeNavigationTreatment = "solid" | "floating" | "minimal";
export type NativeTabTreatment = "underline" | "segmented" | "pills";
export type NativeRailTreatment = "flat" | "cards" | "outlined";
export type NativeCardTreatment = "flat" | "elevated" | "outlined" | "image-forward";
export type NativeMotionIntensity = "none" | "subtle" | "expressive";
export type NativeLayoutStyle =
  "minimal-flat" | "soft-elevated" | "outlined" | "glass" | "editorial" | "dense-productivity";
export type NativePresetId =
  | "clear-horizon"
  | "porcelain-air"
  | "sandstone-notes"
  | "arctic-ledger"
  | "pressroom"
  | "graphite-line"
  | "midnight-study"
  | "deep-current"
  | "forest-night"
  | "pure-oled"
  | "signal-light"
  | "signal-dark"
  | "petal-mist"
  | "mint-canvas"
  | "electric-berry"
  | "ocean-atlas"
  | "evergreen-desk"
  | "solar-ember"
  | "lavender-circuit"
  | "slate-sprint";

export interface NativeThemeTokens {
  accent: string;
  activeTab: string;
  border: string;
  control: string;
  elevatedSurface: string;
  focusRing: string;
  headerBackground: string;
  headerText: string;
  inactiveTab: string;
  leftRail: string;
  link: string;
  mutedText: string;
  pageBackground: string;
  primarySurface: string;
  primaryText: string;
  rightRail: string;
}

export interface NativeCustomization {
  cardTreatment: NativeCardTreatment;
  contentWidth: NativeContentWidth;
  contrastMode: NativeContrastMode;
  controlStyle: NativeControlStyle;
  corners: NativeCorners;
  density: Density;
  enabled: boolean;
  font: NativeFont;
  hideFooter: boolean;
  hideLeftRail: boolean;
  hideRightRail: boolean;
  layoutStyle: NativeLayoutStyle;
  motionIntensity: NativeMotionIntensity;
  navigationTreatment: NativeNavigationTreatment;
  presetId: NativePresetId;
  railTreatment: NativeRailTreatment;
  shadow: NativeShadow;
  tabTreatment: NativeTabTreatment;
  tokens: NativeThemeTokens;
}

export type NativeThemeRegion =
  | "institution-header"
  | "dashboard-tabs"
  | "page-canvas"
  | "dashboard-grid"
  | "course-card"
  | "course-card-content"
  | "left-rail"
  | "right-rail"
  | "surface"
  | "modal"
  | "popover"
  | "footer";

export interface ThemeCompatibilityReport {
  detected: Partial<Record<NativeThemeRegion, number>>;
  nativePreserved: string[];
  themed: NativeThemeRegion[];
  unsupported: string[];
  updatedAt: string;
}

export interface CoursePreference {
  accent: string;
  favorite: boolean;
  hidden: boolean;
  nickname: string;
  order: number;
  quickLinks: Array<{ label: string; url: string }>;
}

export interface FocusPlanEntry {
  assignmentId: string;
  effortMinutes: 15 | 30 | 60 | 90;
  priority: 1 | 2 | 3;
}

export interface GradeScenario {
  currentEarned: number;
  currentPossible: number;
  hypotheticalEarned: number;
  hypotheticalPossible: number;
  id: string;
  name: string;
  rule: "points" | "weighted" | "dropped" | "extra-credit";
  targetPercent: number;
}

export interface Settings {
  accent: string;
  coursePreferences: Record<string, CoursePreference>;
  density: Density;
  enabledDomains: string[];
  focusPlan: Record<string, FocusPlanEntry>;
  gradeScenarios: GradeScenario[];
  manualCompletions: Record<string, true>;
  nativeCustomization: NativeCustomization;
  panelEnabled: boolean;
  schemaVersion: 5;
  theme: ThemePreset;
}

export interface Assignment {
  courseId?: string;
  courseName: string;
  dueAt?: string;
  id: string;
  officialStatus: "submitted" | "late" | "missing" | "unknown";
  title: string;
  url: string;
}

export interface PageCapabilities {
  assignmentCount: number;
  pageKind: "home" | "course" | "grades" | "materials" | "unknown";
  supported: boolean;
}

export interface PageSnapshot {
  assignments: Assignment[];
  capabilities: PageCapabilities;
  domain: string;
  url: string;
}

export const DEFAULT_SETTINGS: Settings = {
  accent: "#5b4ee4",
  coursePreferences: {},
  density: "comfortable",
  enabledDomains: [],
  focusPlan: {},
  gradeScenarios: [],
  manualCompletions: {},
  nativeCustomization: {
    cardTreatment: "elevated",
    contentWidth: "default",
    contrastMode: "automatic",
    controlStyle: "soft",
    corners: "soft",
    density: "comfortable",
    enabled: true,
    font: "system",
    hideFooter: false,
    hideLeftRail: false,
    hideRightRail: false,
    layoutStyle: "soft-elevated",
    motionIntensity: "subtle",
    navigationTreatment: "solid",
    presetId: "clear-horizon",
    railTreatment: "cards",
    shadow: "subtle",
    tabTreatment: "segmented",
    tokens: {
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
      rightRail: "#ffffff"
    }
  },
  panelEnabled: true,
  schemaVersion: 5,
  theme: "system"
};
