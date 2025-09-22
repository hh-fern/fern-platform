import {
  type NavigationNode,
  type Slug,
  hasMetadata,
  hasRedirect,
  toDefaultSlug,
  traverseDF,
} from "../versions/latest";

export function pruneVersionNode<T extends NavigationNode>(
  node: T,
  rootSlug: Slug,
  versionSlug: Slug
): T;
export function pruneVersionNode<T extends NavigationNode>(
  node: T | undefined,
  rootSlug: Slug,
  versionSlug: Slug
): T | undefined;
export function pruneVersionNode<T extends NavigationNode>(
  node: T | undefined,
  rootSlug: Slug,
  versionSlug: Slug
): T | undefined {
  if (node == null) {
    return undefined;
  }
  traverseDF(node, (node) => {
    if (hasMetadata(node)) {
      const newSlug = toDefaultSlug(node.slug, rootSlug, versionSlug);
      // children of this node was already pruned
      if (node.slug === newSlug) {
        return "skip";
      }
      node.canonicalSlug = node.canonicalSlug ?? node.slug;
      node.slug = newSlug;
    }

    if (hasRedirect(node)) {
      node.pointsTo = toDefaultSlug(node.pointsTo, rootSlug, versionSlug);
    }
    return;
  });
  return node;
}
