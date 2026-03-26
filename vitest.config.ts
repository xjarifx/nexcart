import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    globals: true,
    environment: "node",
    fileParallelism: false, // run test files sequentially — shared DB
    testTimeout: 30000,
    hookTimeout: 30000,
  },
});
