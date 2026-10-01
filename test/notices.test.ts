import { readFile } from "node:fs/promises";
import { describe, expect, it } from "vitest";

describe("third-party notices", () => {
  it("preserves the pinned SchoologyPlus MIT notice and packages it", async () => {
    const [notice, buildScript, sourceMap] = await Promise.all([
      readFile("THIRD_PARTY_NOTICES.md", "utf8"),
      readFile("scripts/build.mjs", "utf8"),
      readFile("docs/upstream-source-map.md", "utf8")
    ]);

    expect(notice).toContain("85e2e869678570179fba6ba554d5ca0b469ff3ec");
    expect(notice).toContain("Copyright (c) 2017-2024 Aaron Opell and Glen Husman");
    expect(notice).toContain("Permission is hereby granted, free of charge");
    expect(notice).toContain('THE SOFTWARE IS PROVIDED "AS IS"');
    expect(buildScript).toContain('"THIRD_PARTY_NOTICES.md"');
    expect(buildScript).toContain('"docs/upstream-source-map.md"');
    expect(sourceMap).toContain("src/styles/all.scss:1-112");
    expect(sourceMap).toContain("src/scripts/pages/all.ts:526-540");
    expect(sourceMap).toContain("No upstream file was copied wholesale");
    expect(sourceMap).toContain("Analytics, telemetry, API-key behavior");
  });

  it("attributes substantially adapted source files without legacy upstream dependencies", async () => {
    const [compatibility, routes, selectors, packageJson] = await Promise.all([
      readFile("src/schoology/compatibility/schoology-plus-shell.ts", "utf8"),
      readFile("src/schoology/routes.ts", "utf8"),
      readFile("src/schoology/customization/selectors.ts", "utf8"),
      readFile("package.json", "utf8").then(
        (source) => JSON.parse(source) as Record<string, unknown>
      )
    ]);

    for (const source of [compatibility, routes, selectors]) {
      expect(source).toContain("Copyright (c) 2017-2024 Aaron Opell and Glen Husman");
      expect(source).toContain("SPDX-License-Identifier: MIT");
    }
    expect(packageJson).not.toHaveProperty("dependencies");
    expect(JSON.stringify(packageJson)).not.toContain("jquery");
    expect(JSON.stringify(packageJson)).not.toContain("materialize");
  });
});
