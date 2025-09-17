import type { NextConfig } from "next";

import path from "path";

const nextConfig: NextConfig = {
  serverExternalPackages: ["@fern-docs/search-ask-fern"],
  transpilePackages: [
    "@fern-docs/search-ui",
    "@fern-docs/search-keyword",
    "@fern-docs/search-utils",
    "@fern-docs/components",
    "@fern-api/ui-core-utils",
    "@fern-ui/react-commons",
  ],
  webpack: (config) => {
    const webpack = require("webpack");

    config.plugins = config.plugins || [];
    config.plugins.push(
      new webpack.NormalModuleReplacementPlugin(
        /search\/useSearchBox$/,
        path.resolve(__dirname, "./src/hooks/useSearchBox.ts")
      ),
      new webpack.NormalModuleReplacementPlugin(
        /hooks\/use-search-hits$/,
        path.resolve(__dirname, "./src/hooks/useSearchHits.ts")
      ),
      new webpack.NormalModuleReplacementPlugin(
        /@fern-docs\/search-ask-fern$/,
        path.resolve(__dirname, "./src/utils/suggestions-schema.ts")
      )
    );
    return config;
  },
};

export default nextConfig;
