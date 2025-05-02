import { HttpMethod } from "@fern-docs/components";

/**
 * Extracts the method and path from an endpoint string. Returns undefined if
 * the endpoint string is not valid.
 *
 * @param endpoint - The endpoint string to extract from. (e.g. "GET /api/v1/users")
 * @returns { { method: HttpMethod; path: string } | undefined } (e.g. { method: "GET", path: "/api/v1/users" })
 */
export function extractMethodAndPath(
  endpoint: string
): { method: HttpMethod; path: string } | undefined {
  const [maybeMethod, path] = endpoint.trim().split(" ");

  // parse method into APIV1Read.HttpMethod
  let method: HttpMethod | undefined;

  if (maybeMethod != null) {
    method = maybeMethod.toUpperCase() as HttpMethod;
  }

  // ensure that method is a valid HTTP method
  if (method == null || !HttpMethod[method] || path == null) {
    return undefined;
  }

  return { method, path };
}
