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
  nickname: string;
}

export interface Settings {
  accent: string;
  coursePreferences: Record<string, CoursePreference>;
  density: Density;
  enabledDomains: string[];
  manualCompletions: Record<string, true>;
  nativeCustomization: NativeCustomization;
  panelEnabled: boolean;
  schemaVersion: 2;
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
  schemaVersion: 2,
  theme: "system"
};
