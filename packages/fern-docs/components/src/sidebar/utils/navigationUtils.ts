import * as FernNavigation from "@fern-api/fdr-sdk/navigation";

/**
 * Flattens a sidebar tree into a list of navigable items (pages only)
 */
export function flattenSidebarTree(
  root: FernNavigation.SidebarRootNode | undefined
): FernNavigation.NavigationNodeWithMarkdown[] {
  if (!root) return [];

  const items: FernNavigation.NavigationNodeWithMarkdown[] = [];

  function collectFromSidebarRoot(children: FernNavigation.SidebarRootChild[]) {
    children.forEach((child) => {
      switch (child.type) {
        case "section":
          // If section has markdown, it's a page
          if (FernNavigation.hasMarkdown(child)) {
            items.push(child);
          }
          // Always collect children
          collectFromNavigationChildren(child.children);
          break;
        case "apiReference":
          // Handle nested structures if needed
          if ("children" in child && child.children) {
            // apiReference children are of type ApiPackageChild[]
            collectFromApiPackageChildren(child.children);
          }
          break;
        case "sidebarGroup":
          // Handle nested structures if needed
          if ("children" in child && child.children) {
            // sidebarGroup children are of type SidebarRootChild[]
            // We need to cast this properly since the type system can't infer it
            collectFromSidebarRoot(
              child.children as FernNavigation.SidebarRootChild[]
            );
          }
          break;
      }
    });
  }

  function collectFromNavigationChildren(
    children: FernNavigation.NavigationChild[]
  ) {
    children.forEach((child) => {
      if (FernNavigation.hasMarkdown(child)) {
        items.push(child);
      }
      if ("children" in child && child.children) {
        // Handle different child types based on the parent type
        if (child.type === "section") {
          collectFromNavigationChildren(child.children);
        } else if (child.type === "apiReference") {
          collectFromApiPackageChildren(child.children);
        }
      }
    });
  }

  function collectFromApiPackageChildren(
    children: FernNavigation.ApiPackageChild[]
  ) {
    children.forEach((child) => {
      if (FernNavigation.hasMarkdown(child)) {
        items.push(child);
      }
      if ("children" in child && child.children) {
        // Recursively collect from the same type
        collectFromApiPackageChildren(child.children);
      }
    });
  }

  if (root.children) {
    collectFromSidebarRoot(root.children);
  }

  return items;
}

/**
 * Finds the next navigable item after a deleted item
 * @param currentNodeId - The ID of the item being deleted
 * @param root - The sidebar root
 * @param clientNodes - Client nodes from the provider
 * @returns The next item to navigate to, or null if none found
 */
export function findNextNavigableItem(
  currentNodeId: FernNavigation.NodeId,
  root: FernNavigation.SidebarRootNode | undefined,
  clientNodes: Record<FernNavigation.NodeId, FernNavigation.PageNode[]> = {}
): FernNavigation.NavigationNodeWithMarkdown | FernNavigation.PageNode | null {
  // Get all navigable items including server pages
  const serverItems = flattenSidebarTree(root);

  // Get all client pages flattened
  const clientItems: FernNavigation.PageNode[] = [];
  Object.values(clientNodes).forEach((nodes) => {
    clientItems.push(...nodes);
  });

  // Combine and sort all items (this is a simplified approach - in a real implementation
  // we'd want to maintain the actual sidebar order)
  const allItems = [...serverItems, ...clientItems];

  // Find the current item index
  const currentIndex = allItems.findIndex((item) => item.id === currentNodeId);

  if (currentIndex === -1) {
    // Item not found, return first available item
    const firstItem = allItems[0];
    return firstItem || null;
  }

  // Try to find the next item (after current)
  if (currentIndex < allItems.length - 1) {
    const nextItem = allItems[currentIndex + 1];
    return nextItem || null;
  }

  // Try to find the previous item (before current)
  if (currentIndex > 0) {
    const prevItem = allItems[currentIndex - 1];
    return prevItem || null;
  }

  // No other items available
  return null;
}

/**
 * Builds navigation URL for a given navigation node
 */
export function buildNavigationUrl(
  item: FernNavigation.NavigationNodeWithMarkdown | FernNavigation.PageNode,
  orgName: string,
  docsUrl: string,
  branch: string,
  isClientNode = false
): string {
  const slug = item.slug || "root";
  const baseUrl = `/${orgName}/editor/${docsUrl}/${branch}/${slug}`;

  if (isClientNode) {
    return `${baseUrl}?client-node-id=${item.id}`;
  }

  return baseUrl;
}
