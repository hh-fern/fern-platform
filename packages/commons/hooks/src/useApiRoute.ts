import { getApiRouteSupplier } from "@fern-api/docs-utils/component/getApiRouteSupplier";
import { useBasePath } from "@fern-ui/state/navigation";

export type FernDocsApiRoute = `/api/fern-docs/${string}`;

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
