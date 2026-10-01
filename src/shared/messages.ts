import type { CoursePreference, PageSnapshot, Settings } from "./models";

export type SettingsMutation =
  | {
      changes: Partial<Pick<Settings, "accent" | "density" | "panelEnabled" | "theme">>;
      kind: "PATCH";
    }
  | { completed: boolean; id: string; kind: "SET_COMPLETION" }
  | { domain: string; kind: "ADD_DOMAIN" }
  | { domain: string; kind: "REMOVE_DOMAIN" }
  | { courses: Record<string, CoursePreference>; kind: "ADD_COURSES" }
  | { courseId: string; kind: "SET_COURSE"; preference: CoursePreference }
  | { kind: "REPLACE"; settings: Settings };

export type RuntimeMessage =
  | { type: "GET_PAGE_SNAPSHOT" }
  | { type: "OPEN_TODAY_PANEL" }
  | { type: "REFRESH_DYNAMIC_SCRIPTS" }
  | { mutation: SettingsMutation; type: "MUTATE_SETTINGS" };

export type RuntimeResponse =
  { ok: true; settings?: Settings; snapshot?: PageSnapshot } | { error: string; ok: false };

export function isRuntimeMessage(value: unknown): value is RuntimeMessage {
  if (typeof value !== "object" || value === null || !("type" in value)) return false;
  const type = String(value.type);
  if (["GET_PAGE_SNAPSHOT", "OPEN_TODAY_PANEL", "REFRESH_DYNAMIC_SCRIPTS"].includes(type)) {
    return true;
  }
  return type === "MUTATE_SETTINGS" && "mutation" in value && isSettingsMutation(value.mutation);
}

function isSettingsMutation(value: unknown): value is SettingsMutation {
  if (typeof value !== "object" || value === null || !("kind" in value)) return false;
  switch (value.kind) {
    case "PATCH":
      return "changes" in value && typeof value.changes === "object" && value.changes !== null;
    case "SET_COMPLETION":
      return (
        "completed" in value &&
        typeof value.completed === "boolean" &&
        "id" in value &&
        typeof value.id === "string"
      );
    case "ADD_DOMAIN":
    case "REMOVE_DOMAIN":
      return "domain" in value && typeof value.domain === "string";
    case "ADD_COURSES":
      return "courses" in value && typeof value.courses === "object" && value.courses !== null;
    case "SET_COURSE":
      return (
        "courseId" in value &&
        typeof value.courseId === "string" &&
        "preference" in value &&
        typeof value.preference === "object" &&
        value.preference !== null
      );
    case "REPLACE":
      return "settings" in value && typeof value.settings === "object" && value.settings !== null;
    default:
      return false;
  }
}
