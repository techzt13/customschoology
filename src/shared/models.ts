export type ThemePreset = "system" | "calm" | "contrast" | "expressive";
export type Density = "comfortable" | "compact";
export type NativeFont = "native" | "system" | "humanist" | "rounded" | "serif";
export type NativeContentWidth = "default" | "focused" | "wide";
export type NativeCorners = "schoology" | "soft" | "round";
export type NativeShadow = "none" | "subtle";
export type NativeContrastMode = "automatic" | "preserve" | "high-contrast" | "manual";

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
  contentWidth: NativeContentWidth;
  contrastMode: NativeContrastMode;
  corners: NativeCorners;
  enabled: boolean;
  font: NativeFont;
  hideFooter: boolean;
  hideLeftRail: boolean;
  hideRightRail: boolean;
  shadow: NativeShadow;
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
  schemaVersion: 4;
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
    contentWidth: "default",
    contrastMode: "automatic",
    corners: "soft",
    enabled: true,
    font: "native",
    hideFooter: false,
    hideLeftRail: false,
    hideRightRail: false,
    shadow: "subtle",
    tokens: {
      accent: "#5b4ee4",
      activeTab: "#3327b8",
      border: "#d8dce6",
      control: "#ffffff",
      elevatedSurface: "#ffffff",
      focusRing: "#0b6bcb",
      headerBackground: "#283142",
      headerText: "#ffffff",
      inactiveTab: "#5f687a",
      leftRail: "#f0f2f7",
      link: "#4338ca",
      mutedText: "#5f687a",
      pageBackground: "#f6f7fb",
      primarySurface: "#ffffff",
      primaryText: "#1c2230",
      rightRail: "#ffffff"
    }
  },
  panelEnabled: true,
  schemaVersion: 4,
  theme: "system"
};
