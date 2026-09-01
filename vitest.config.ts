import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    include: [
      "apps/**/*.test.ts",
      "apps/**/*.test.tsx",
      "packages/**/*.test.ts",
    ],
    coverage: {
      provider: "v8",
      reporter: ["text", "json-summary", "html"],
      thresholds: { lines: 80, functions: 80, statements: 80, branches: 75 },
      exclude: [
        "**/coverage/**",
        "**/node_modules/**",
        "**/*.config.*",
        "**/main.tsx",
        "**/server.ts",
        "**/dist/**",
        "**/*.d.ts",
        "**/types.ts",
      ],
    },
  },
});
