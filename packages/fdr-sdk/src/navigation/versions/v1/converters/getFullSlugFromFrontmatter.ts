import type { Slug } from "../../../../client/generated/api/resources/navigation/resources/v1";
import { slugjoin } from "../slugjoin";

/**
 * As as temporary workaround, we'll use a simple regex to extract the frontmatter and check for
 * `slug: a/b/c` or `slug: /a/b/c` or `slug: "a/b/c"` or `slug: "/a/b/c/"`.
 */
export function getFullSlugFromFrontmatter(
  frontmatter: string
): Slug | undefined {
  const match = frontmatter.match(/slug:\s*"?([^"\n\s]+)"?/);
  if (match?.[1] != null) {
    return slugjoin(match[1]);
  }
  return undefined;
}
