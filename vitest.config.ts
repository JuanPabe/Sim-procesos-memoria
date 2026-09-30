import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    coverage: {
      provider: "v8",
      include: ["src/**/*.ts"],
      all: true,
      thresholds: {
        lines: 91,
        functions: 91,
        branches: 91,
        statements: 91,
      },
      reporter: ["text", "lcov", "html"],
    },
  },
});
