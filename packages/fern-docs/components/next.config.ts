import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  transpilePackages: ["@fern-api/fdr-sdk", "@fern-api/ui-core-utils"],
  experimental: {
    optimizePackageImports: [
      "lucide-react",
      "@fern-api/fdr-sdk",
      "@fern-api/ui-core-utils",
      "@fern-docs/mdx",
      "@fern-docs/search-server",
      "@fern-api/docs-utils",
      "@fern-ui/react-commons",
      "@fern-ui/state",
      "@fern-ui/hooks",
    ],
    optimizeServerReact: true,
  },
};

export default nextConfig;
