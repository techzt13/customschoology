import { readFile } from "node:fs/promises";
import { describe, expect, it } from "vitest";

describe("extension manifest", () => {
  it("uses Manifest V3 and avoids broad persistent host access", async () => {
    const manifest = JSON.parse(await readFile("public/manifest.json", "utf8")) as {
      host_permissions?: string[];
      manifest_version: number;
      optional_host_permissions: string[];
      permissions: string[];
    };

    expect(manifest.manifest_version).toBe(3);
    expect(manifest.host_permissions).toBeUndefined();
    expect(manifest.optional_host_permissions).toContain("https://*/*");
    expect(manifest.permissions).not.toContain("tabs");
    expect(manifest.permissions).not.toContain("downloads");
  });
});
