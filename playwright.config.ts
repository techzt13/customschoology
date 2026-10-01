import { defineConfig } from "@playwright/test";

export default defineConfig({
  fullyParallel: false,
  reporter: "line",
  testDir: "browser-test",
  timeout: 30_000,
  workers: 1
});
