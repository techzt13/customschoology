import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    exclude: ["browser-test/**", "dist/**", "node_modules/**"],
    environment: "jsdom",
    coverage: {
      include: ["src/**/*.ts"],
      provider: "v8",
      reporter: ["text", "html"]
    }
  }
});
