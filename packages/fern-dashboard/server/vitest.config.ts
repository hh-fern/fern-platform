import { resolve } from "path";
import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    globals: true,
    env: {
      NODE_ENV: "test",
      DATABASE_URL:
        process.env.DATABASE_URL ||
        "postgresql://runner:runner@localhost:5432/fern_dashboard_tes",
      DIRECT_URL:
        process.env.DIRECT_URL ||
        "postgresql://runner:runner@localhost:5432/fern_dashboard_tes",
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
