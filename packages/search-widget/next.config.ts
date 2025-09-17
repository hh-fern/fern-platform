/** @type {import('next').NextConfig} */
const nextConfig = {
  serverExternalPackages: ["@fern-docs/search-ask-fern"],
  transpilePackages: [
    "@fern-docs/search-ui",
    "@fern-docs/search-keyword",
    "@fern-docs/search-utils",
    "@fern-docs/components",
    "@fern-api/ui-core-utils",
    "@fern-ui/react-commons",
  ],
};

export default nextConfig;
