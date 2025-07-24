import { resolve } from "path";
import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    globals: true,
    env: {
      NODE_ENV: "test",
    },
    setupFiles: [],
    exclude: ["prisma/**/*", "dist/**/*", "generated/**/*"],
  },
  resolve: {
    alias: {
      "@": resolve(__dirname, "./src"),
    },
  },
});
