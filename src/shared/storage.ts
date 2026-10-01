import { DEFAULT_SETTINGS, type CoursePreference, type Settings } from "./models";
import type { RuntimeResponse, SettingsMutation } from "./messages";
import { sanitizeNativeCustomization } from "../schoology/customization/native-theme";

const SETTINGS_KEY = "settings";
const HEX_COLOR = /^#[0-9a-f]{6}$/i;
const DOMAIN_CHARACTERS = /^[a-z0-9.-]+$/i;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function validCoursePreference(value: unknown): value is CoursePreference {
  return (
    isRecord(value) &&
    typeof value.nickname === "string" &&
    value.nickname.length <= 80 &&
    typeof value.accent === "string" &&
    HEX_COLOR.test(value.accent)
  );
}

function parseCoursePreferences(value: unknown): Record<string, CoursePreference> {
  if (!isRecord(value)) return {};
  return Object.fromEntries(
    Object.entries(value).filter((entry): entry is [string, CoursePreference] => {
      const [key, preference] = entry;
      return key.length <= 160 && validCoursePreference(preference);
    })
  );
}

function parseManualCompletions(value: unknown): Record<string, true> {
  if (!isRecord(value)) return {};
  return Object.fromEntries(
    Object.entries(value).filter(
      (entry): entry is [string, true] => entry[0].length <= 500 && entry[1] === true
    )
  );
}

export function normalizeDomain(value: string): string | null {
  const normalized = value
    .trim()
    .toLowerCase()
    .replace(/^https?:\/\//, "")
    .split("/")[0];
  if (!normalized || normalized.length > 253 || !DOMAIN_CHARACTERS.test(normalized)) return null;
  const labels = normalized.split(".");
  const valid =
    labels.length > 1 &&
    labels.every(
      (label) =>
        label.length > 0 && label.length <= 63 && !label.startsWith("-") && !label.endsWith("-")
    );
  return valid ? normalized : null;
}

export function parseSettings(value: unknown): Settings {
  if (!isRecord(value)) return structuredClone(DEFAULT_SETTINGS);

  const theme = ["system", "calm", "contrast", "expressive"].includes(String(value.theme))
    ? (value.theme as Settings["theme"])
    : DEFAULT_SETTINGS.theme;
  const density = value.density === "compact" ? "compact" : "comfortable";
  const normalizedDomains = Array.isArray(value.enabledDomains)
    ? value.enabledDomains
        .filter((item): item is string => typeof item === "string")
        .map(normalizeDomain)
        .filter((item): item is string => item !== null)
    : [];
  const enabledDomains = [...new Set(normalizedDomains)].slice(0, 20);

  return {
    accent:
      typeof value.accent === "string" && HEX_COLOR.test(value.accent)
        ? value.accent
        : DEFAULT_SETTINGS.accent,
    coursePreferences: parseCoursePreferences(value.coursePreferences),
    density,
    enabledDomains,
    manualCompletions: parseManualCompletions(value.manualCompletions),
    nativeCustomization: sanitizeNativeCustomization(value.nativeCustomization),
    panelEnabled: value.panelEnabled !== false,
    schemaVersion: 2,
    theme
  };
}

export async function loadSettings(): Promise<Settings> {
  const result = await chrome.storage.local.get(SETTINGS_KEY);
  return parseSettings(result[SETTINGS_KEY]);
}

export async function saveSettings(settings: Settings): Promise<void> {
  await chrome.storage.local.set({ [SETTINGS_KEY]: parseSettings(settings) });
}

export function applyMutation(current: Settings, mutation: SettingsMutation): Settings {
  switch (mutation.kind) {
    case "PATCH":
      return parseSettings({ ...current, ...mutation.changes });
    case "SET_COMPLETION": {
      const manualCompletions = { ...current.manualCompletions };
      if (mutation.completed) manualCompletions[mutation.id] = true;
      else delete manualCompletions[mutation.id];
      return parseSettings({ ...current, manualCompletions });
    }
    case "ADD_DOMAIN":
      return parseSettings({
        ...current,
        enabledDomains: [...current.enabledDomains, mutation.domain]
      });
    case "REMOVE_DOMAIN":
      return parseSettings({
        ...current,
        enabledDomains: current.enabledDomains.filter((domain) => domain !== mutation.domain)
      });
    case "ADD_COURSES":
      return parseSettings({
        ...current,
        coursePreferences: { ...current.coursePreferences, ...mutation.courses }
      });
    case "SET_COURSE":
      return parseSettings({
        ...current,
        coursePreferences: {
          ...current.coursePreferences,
          [mutation.courseId]: mutation.preference
        }
      });
    case "SET_NATIVE":
      return parseSettings({
        ...current,
        nativeCustomization: mutation.customization
      });
    case "REPLACE":
      return parseSettings(mutation.settings);
  }
}

export async function mutateSettings(mutation: SettingsMutation): Promise<Settings> {
  const response: RuntimeResponse = await chrome.runtime.sendMessage({
    mutation,
    type: "MUTATE_SETTINGS"
  });
  if (!response.ok) throw new Error(response.error);
  if (!response.settings) throw new Error("The settings update returned no data.");
  return response.settings;
}

export async function exportLocalData(): Promise<string> {
  const settings = await loadSettings();
  return JSON.stringify(
    {
      exportedAt: new Date().toISOString(),
      format: "schoology-companion-settings",
      settings,
      version: 2
    },
    null,
    2
  );
}

export function importLocalData(serialized: string): Settings {
  const parsed: unknown = JSON.parse(serialized);
  if (!isRecord(parsed) || parsed.format !== "schoology-companion-settings") {
    throw new Error("This file is not a Schoology Companion settings export.");
  }
  return parseSettings(parsed.settings);
}
