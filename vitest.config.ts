import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    include: ["**/*.test.ts", "**/*.test.js"],
    environment: "node",
    exclude: ["**/node_modules/**", "**/dist/**", "**/cypress/**"],
  },
});
