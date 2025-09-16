import { defineConfig } from "tsup";

export default defineConfig({
  entry: ["src/components/SearchWidget.tsx"],
  format: ["esm", "cjs"],
  external: ["react", "react-dom", "next"],
});
