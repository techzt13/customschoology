import { describe, expect, it } from "vitest";
import { classifyPage, originPattern } from "../src/schoology/url";
import { schoologyRoute } from "../src/schoology/routes";

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

  it.each([
    ["/", "home"],
    ["/home/recent-activity", "home"],
    ["/home/course-dashboard", "home"],
    ["/course/42/materials", "materials"],
    ["/course/42/materials/7", "material"],
    ["/assignment/7", "assignment"],
    ["/course/42/student_grades", "grades"],
    ["/assignment/7/assessment", "assessment"],
    ["/course/42", "course"],
    ["/courses", "courses"],
    ["/page/example", "page"],
    ["/user/7", "user"]
  ] as const)("matches the pinned compatibility route %s", (path, expected) => {
    expect(schoologyRoute(path)).toBe(expected);
  });
});
