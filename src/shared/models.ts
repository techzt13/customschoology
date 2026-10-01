export type ThemePreset = "system" | "calm" | "contrast" | "expressive";
export type Density = "comfortable" | "compact";
export type NativeFont = "native" | "system" | "humanist" | "rounded" | "serif";
export type NativeContentWidth = "default" | "focused" | "wide";
export type NativeCorners = "schoology" | "soft" | "round";
export type NativeShadow = "none" | "subtle";

export interface NativeCustomization {
  background: string;
  border: string;
  contentWidth: NativeContentWidth;
  corners: NativeCorners;
  enabled: boolean;
  font: NativeFont;
  hideFooter: boolean;
  hideLeftRail: boolean;
  hideRightRail: boolean;
  shadow: NativeShadow;
  surface: string;
  text: string;
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
  schemaVersion: 3;
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
    background: "#f6f7fb",
    border: "#d8dce6",
    contentWidth: "default",
    corners: "soft",
    enabled: true,
    font: "native",
    hideFooter: false,
    hideLeftRail: false,
    hideRightRail: false,
    shadow: "subtle",
    surface: "#ffffff",
    text: "#1c2230"
  },
  panelEnabled: true,
  schemaVersion: 3,
  theme: "system"
};
