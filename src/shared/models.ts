export type ThemePreset = "system" | "calm" | "contrast" | "expressive";
export type Density = "comfortable" | "compact";

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
  panelEnabled: boolean;
  schemaVersion: 1;
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
  panelEnabled: true,
  schemaVersion: 1,
  theme: "system"
};
