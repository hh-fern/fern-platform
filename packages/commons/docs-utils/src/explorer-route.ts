import { removeTrailingSlash } from ".";
import { addLeadingSlash } from ".";
import { conformTrailingSlash } from "./trailing-slash";

/**
 * Conforms the slug to the explorer route.
 */
export function conformExplorerRoute(slugOrPathname: string): string {
  return conformTrailingSlash(
    addLeadingSlash(slugOrPathname) + "?explorer=true"
  );
}

export function isExplorerRoute(pathname: string): boolean {
  return removeTrailingSlash(pathname).endsWith("?explorer=true");
}
