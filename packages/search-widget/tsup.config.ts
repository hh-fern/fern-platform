import { sassPlugin } from "esbuild-sass-plugin";
import { defineConfig } from "tsup";

export default defineConfig({
  entry: ["src/components/search.tsx"],
  format: ["esm", "cjs"],
  external: ["react", "react-dom", "next"],
  esbuildPlugins: [sassPlugin()],
});
