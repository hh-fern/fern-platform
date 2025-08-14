import { htmlToMdx } from "@fern-docs/mdx";
import type { PageData } from "./types";

/**
 * Utility function to generate page filename from slug
 * @param slug - The page slug
 * @returns The filename for the MDX file
 */
export function getPageFilename(slug: string): string {
  // Ensure we have a valid slug
  const normalizedSlug = slug || "untitled";
  
  // Add .mdx extension if not present
  if (normalizedSlug.endsWith(".mdx")) {
    return normalizedSlug;
  }
  
  return `${normalizedSlug}.mdx`;
}

/**
 * Converts page data to MDX string
 * @param pageData - The page data containing HTML, frontmatter, and original elements
 * @returns The MDX string representation
 */
export function pageDataToMdx(pageData: PageData): string {
  const { html, frontmatter, originalElements } = pageData;
  
  if (!html || !frontmatter || !originalElements) {
    throw new Error("Invalid page data: missing required fields");
  }

  // Use the htmlToMdx utility from the mdx package
  return htmlToMdx(
    html,
    frontmatter,
    originalElements,
    undefined, // originalFrontmatter - not available in PageData
    {}, // changedNodes - empty for conversion
    true // changedFrontmatter - assume changed when converting
  ).mdx;
}