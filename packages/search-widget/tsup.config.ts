import { defineConfig } from "tsup";
import { sassPlugin } from "esbuild-sass-plugin";

export default defineConfig({
  entry: ["src/components/search.tsx"],
  format: ["esm", "cjs"],
  external: ["react", "react-dom", "next"],
  esbuildPlugins: [sassPlugin()],
});
