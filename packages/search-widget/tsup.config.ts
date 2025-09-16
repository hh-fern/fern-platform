import { defineConfig } from "tsup";

export default defineConfig({
  entry: ["src/components/SearchButton.tsx"],
  format: ["esm", "cjs"],
  external: ["react", "react-dom", "next"],
});
