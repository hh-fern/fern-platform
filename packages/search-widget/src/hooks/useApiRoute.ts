import { useBasePath } from "@fern-docs/components/state/navigation";

import { getApiRouteSupplier } from "../utils/getApiRouteSupplier";

export type FernDocsApiRoute = `${string}/api/fern-docs/${string}`;

interface Options {
  includeTrailingSlash?: boolean;
  basepath?: string;
}

export function useApiRoute(
  route: FernDocsApiRoute,
  options?: Options
): string {
  const basepath = useBasePath();
  return getApiRouteSupplier({ basepath, ...options })(route);
}
