import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    include: ["packages/**/*.test.ts", ".opencode/tools/**/*.test.ts"],
  },
});
