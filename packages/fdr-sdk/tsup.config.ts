import { defineConfig } from "tsup";

export default defineConfig({
  entry: {
    index: "src/index.ts",
    "client/types": "src/client/types.ts",
    "navigation/index": "src/navigation/index.ts",
    "docs/index": "src/docs/index.ts",
    "api-definition/index": "src/api-definition/index.ts",
    "client/index": "src/client/index.ts",
    "utils/traversers/index": "src/utils/traversers/index.ts",
  },
  external: [],
  noExternal: [],
  dts: false,
  splitting: false,
  sourcemap: false,
});
