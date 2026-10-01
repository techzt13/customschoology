import { afterEach, describe, expect, it, vi } from "vitest";
import { DEFAULT_SETTINGS } from "../src/shared/models";
import {
  applyMutation,
  exportLocalData,
  importLocalData,
  normalizeDomain,
  parseSettings
} from "../src/shared/storage";

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("settings validation", () => {
  it("accepts safe customization and strips malformed values", () => {
    const settings = parseSettings({
      accent: "#2244aa",
      coursePreferences: {
        "course-1": { accent: "#112233", nickname: "Physics" },
        unsafe: { accent: "javascript:red", nickname: "Bad" }
      },
      density: "compact",
      enabledDomains: [" learn.example.edu ", "not a domain", "learn.example.edu"],
      manualCompletions: { valid: true, falseValue: false },
      panelEnabled: false,
      theme: "expressive"
    });

    expect(settings).toMatchObject({
      accent: "#2244aa",
      coursePreferences: {
        "course-1": { accent: "#112233", nickname: "Physics" }
      },
      density: "compact",
      enabledDomains: ["learn.example.edu"],
      manualCompletions: { valid: true },
      panelEnabled: false,
      theme: "expressive"
    });
  });

  it("returns isolated defaults for invalid data", () => {
    const first = parseSettings(null);
    first.enabledDomains.push("mutated.example");

    expect(parseSettings(null)).toEqual(DEFAULT_SETTINGS);
  });
});

describe("normalizeDomain", () => {
  it.each([
    ["https://learn.example.edu/path", "learn.example.edu"],
    ["SCHOOL.EXAMPLE.ORG", "school.example.org"],
    ["localhost", null],
    ["https://bad host.example", null]
  ])("normalizes %s", (input, expected) => {
    expect(normalizeDomain(input)).toBe(expected);
  });

  describe("settings mutations", () => {
    it("preserves independent updates applied in sequence", () => {
      const withCompletion = applyMutation(structuredClone(DEFAULT_SETTINGS), {
        completed: true,
        id: "assignment-1",
        kind: "SET_COMPLETION"
      });
      const withTheme = applyMutation(withCompletion, {
        changes: { theme: "contrast" },
        kind: "PATCH"
      });

      expect(withTheme.manualCompletions).toEqual({ "assignment-1": true });
      expect(withTheme.theme).toBe("contrast");
    });
  });

  describe("settings migrations and imports", () => {
    it("migrates schema version one settings to native customization defaults", () => {
      const migrated = parseSettings({
        accent: "#123456",
        density: "compact",
        schemaVersion: 1,
        theme: "calm"
      });

      expect(migrated.schemaVersion).toBe(5);
      expect(migrated.nativeCustomization).toEqual(DEFAULT_SETTINGS.nativeCustomization);
      expect(migrated.accent).toBe("#123456");
    });

    it("validates native customization during import", () => {
      const imported = importLocalData(
        JSON.stringify({
          format: "schoology-companion-settings",
          settings: {
            nativeCustomization: {
              ...DEFAULT_SETTINGS.nativeCustomization,
              tokens: {
                ...DEFAULT_SETTINGS.nativeCustomization.tokens,
                pageBackground: "not-a-color"
              },
              fontScale: 0
            }
          },
          version: 2
        })
      );

      expect(imported.nativeCustomization.tokens.pageBackground).toBe(
        DEFAULT_SETTINGS.nativeCustomization.tokens.pageBackground
      );
      expect("fontScale" in imported.nativeCustomization).toBe(false);
    });

    it("round-trips contrast modes and semantic tokens while migrating legacy colors", () => {
      const legacy = parseSettings({
        nativeCustomization: {
          background: "#101820",
          border: "#334455",
          surface: "#fefefe",
          text: "#112233"
        },
        schemaVersion: 3
      });
      expect(legacy.nativeCustomization.tokens).toMatchObject({
        border: "#334455",
        elevatedSurface: "#fefefe",
        pageBackground: "#101820",
        primarySurface: "#fefefe",
        primaryText: "#112233"
      });

      const imported = importLocalData(
        JSON.stringify({
          format: "schoology-companion-settings",
          settings: {
            nativeCustomization: {
              ...DEFAULT_SETTINGS.nativeCustomization,
              cardTreatment: "image-forward",
              contrastMode: "manual",
              layoutStyle: "glass",
              presetId: "lavender-circuit",
              tokens: {
                ...DEFAULT_SETTINGS.nativeCustomization.tokens,
                rightRail: "#123456"
              }
            }
          },
          version: 5
        })
      );
      expect(imported.nativeCustomization.contrastMode).toBe("manual");
      expect(imported.nativeCustomization.tokens.rightRail).toBe("#123456");
      expect(imported.nativeCustomization.presetId).toBe("lavender-circuit");
      expect(imported.nativeCustomization.layoutStyle).toBe("glass");
      expect(imported.nativeCustomization.cardTreatment).toBe("image-forward");
    });

    it("exports the migrated schema and native customization", async () => {
      vi.stubGlobal("chrome", {
        storage: {
          local: {
            get: vi.fn().mockResolvedValue({
              settings: {
                accent: "#123456",
                schemaVersion: 1
              }
            })
          }
        }
      });

      const exported = JSON.parse(await exportLocalData()) as {
        settings: typeof DEFAULT_SETTINGS;
        version: number;
      };
      expect(exported.version).toBe(5);
      expect(exported.settings.schemaVersion).toBe(5);
      expect(exported.settings.nativeCustomization).toEqual(DEFAULT_SETTINGS.nativeCustomization);
    });

    it("validates course workspace, focus plan, and grade scenario data", () => {
      const parsed = parseSettings({
        coursePreferences: {
          "42": {
            accent: "#123456",
            favorite: true,
            hidden: false,
            nickname: "Biology",
            order: 2,
            quickLinks: [
              { label: "Lab", url: "https://example.schoology.com/courses/42/materials" },
              { label: "Unsafe", url: "javascript:alert(1)" }
            ]
          }
        },
        focusPlan: {
          assignment: { effortMinutes: 30, priority: 1 },
          invalid: { effortMinutes: 999, priority: 7 }
        },
        gradeScenarios: [
          {
            currentEarned: 80,
            currentPossible: 100,
            hypotheticalEarned: 15,
            hypotheticalPossible: 20,
            id: "one",
            name: "Plan",
            rule: "points",
            targetPercent: 90
          }
        ]
      });

      expect(parsed.coursePreferences["42"]?.quickLinks).toHaveLength(1);
      expect(parsed.focusPlan).toEqual({
        assignment: { assignmentId: "assignment", effortMinutes: 30, priority: 1 }
      });
      expect(parsed.gradeScenarios).toHaveLength(1);
    });
  });
});
