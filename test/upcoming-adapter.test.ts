import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import { beforeAll, describe, expect, it } from "vitest";
import { extractUpcoming } from "../src/schoology/upcoming-adapter";

let fixture = "";

function testLocation(url: string): Location {
  const parsed = new URL(url);
  return {
    href: parsed.href,
    hostname: parsed.hostname,
    pathname: parsed.pathname
  } as Location;
}

beforeAll(async () => {
  fixture = await readFile(resolve("test/fixtures/home-upcoming.html"), "utf8");
});

describe("extractUpcoming", () => {
  it("normalizes upcoming assignments and official states", () => {
    document.documentElement.innerHTML = fixture;

    const snapshot = extractUpcoming(document, testLocation("https://example.schoology.com/home"));

    expect(snapshot.capabilities).toEqual({
      assignmentCount: 2,
      pageKind: "home",
      supported: true
    });
    expect(snapshot.assignments[0]).toMatchObject({
      courseId: "22",
      courseName: "English 10",
      officialStatus: "submitted",
      title: "Reflection"
    });
    expect(snapshot.assignments[1]).toMatchObject({
      courseId: "33",
      courseName: "Biology",
      officialStatus: "missing",
      title: "Chapter quiz"
    });
  });

  it("fails closed on unrelated pages", () => {
    document.documentElement.innerHTML = "<head></head><body><main>News</main></body>";

    const snapshot = extractUpcoming(document, testLocation("https://example.com/news"));

    expect(snapshot.capabilities.supported).toBe(false);
    expect(snapshot.assignments).toEqual([]);
  });
});
