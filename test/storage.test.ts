import { describe, expect, it } from "vitest";
import { DEFAULT_SETTINGS } from "../src/shared/models";
import { applyMutation, normalizeDomain, parseSettings } from "../src/shared/storage";

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
});
