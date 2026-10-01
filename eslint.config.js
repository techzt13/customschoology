import eslint from "@eslint/js";
import security from "eslint-plugin-security";
import globals from "globals";
import tseslint from "typescript-eslint";

export default tseslint.config(
  { ignores: ["dist", "coverage", "node_modules"] },
  eslint.configs.recommended,
  ...tseslint.configs.recommendedTypeChecked.map((config) => ({
    ...config,
    files: ["src/**/*.ts", "test/**/*.ts", "vitest.config.ts"]
  })),
  security.configs.recommended,
  {
    files: ["src/**/*.ts", "test/**/*.ts", "vitest.config.ts"],
    languageOptions: {
      globals: { ...globals.browser, ...globals.webextensions },
      parserOptions: { projectService: true, tsconfigRootDir: import.meta.dirname }
    },
    rules: {
      "@typescript-eslint/consistent-type-imports": "error",
      "@typescript-eslint/no-floating-promises": "error",
      "@typescript-eslint/no-unnecessary-condition": "off",
      "security/detect-object-injection": "off"
    }
  },
  {
    files: ["scripts/**/*.mjs"],
    languageOptions: { globals: globals.node },
    rules: { "security/detect-non-literal-fs-filename": "off" }
  }
);
