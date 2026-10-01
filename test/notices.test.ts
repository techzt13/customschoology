import { readFile } from "node:fs/promises";
import { describe, expect, it } from "vitest";

describe("third-party notices", () => {
  it("preserves the pinned SchoologyPlus MIT notice and packages it", async () => {
    const [notice, buildScript] = await Promise.all([
      readFile("THIRD_PARTY_NOTICES.md", "utf8"),
      readFile("scripts/build.mjs", "utf8")
    ]);

    expect(notice).toContain("85e2e869678570179fba6ba554d5ca0b469ff3ec");
    expect(notice).toContain("Copyright (c) 2017-2024 Aaron Opell and Glen Husman");
    expect(notice).toContain("Permission is hereby granted, free of charge");
    expect(notice).toContain('THE SOFTWARE IS PROVIDED "AS IS"');
    expect(buildScript).toContain('"THIRD_PARTY_NOTICES.md"');
  });
});
