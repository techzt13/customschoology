import { describe, expect, it } from "vitest";
import { classifyPage, originPattern } from "../src/schoology/url";

describe("Schoology URL classification", () => {
  it.each([
    ["/home", "home"],
    ["/courses/123", "course"],
    ["/courses/123/materials", "materials"],
    ["/courses/123/grades", "grades"],
    ["/messages", "unknown"]
  ] as const)("classifies %s", (path, expected) => {
    expect(classifyPage(path)).toBe(expected);
  });

  it("creates an exact HTTPS origin pattern", () => {
    expect(originPattern("learn.example.edu")).toBe("https://learn.example.edu/*");
  });
});
