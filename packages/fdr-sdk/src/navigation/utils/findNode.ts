import { escapeRegExp } from "es-toolkit/string";

import { NodeCollector } from "../NodeCollector";
import {
  type ApiReferenceNode,
  type BreadcrumbItem,
  type ChangelogNode,
  type LandingPageNode,
  type NavigationNodeNeighbor,
  type NavigationNodePage,
  type NavigationNodeParent,
  type ProductNode,
  type RootNode,
  type SidebarRootNode,
  Slug,
  type TabChild,
  type TabNode,
  type VersionNode,
  hasRedirect,
  isPage,
} from "../versions/latest";
import { isApiReferenceNode } from "../versions/latest/isApiReferenceNode";
import { isProductGroupNode } from "../versions/latest/isProductGroupNode";
import { isProductNode } from "../versions/latest/isProductNode";
import { isSidebarRootNode } from "../versions/latest/isSidebarRootNode";
import { isTabbedNode } from "../versions/latest/isTabbedNode";
import { isUnversionedNode } from "../versions/latest/isUnversionedNode";
import { isVersionNode } from "../versions/latest/isVersionNode";
import { createBreadcrumb } from "./createBreadcrumb";

export type Node = Node.Found | Node.Redirect | Node.NotFound;

export declare namespace Node {
  interface Found {
    type: "found";
    node: NavigationNodePage;
    parents: readonly NavigationNodeParent[];
    breadcrumb: readonly BreadcrumbItem[];
    root: RootNode;
    products: readonly ProductNode[];
    currentProduct: ProductNode | undefined;
    /**
     * This is true if the current product is the default product node (without the product slug prefix)
     */
    isCurrentProductDefault: boolean;
    versions: readonly VersionNode[];
    currentVersion: VersionNode | undefined;
    /**
     * This is true if the current version is the default version node (without the version slug prefix)
     */
    isCurrentVersionDefault: boolean;
    currentTab: TabNode | ChangelogNode | undefined;
    tabs: readonly TabChild[];
    sidebar: SidebarRootNode | undefined;
    apiReference: ApiReferenceNode | undefined;
    next: NavigationNodeNeighbor | undefined;
    prev: NavigationNodeNeighbor | undefined;
    collector: NodeCollector;
    landingPage: LandingPageNode | undefined;

    /**
     * This is the part of the slug after the version (or basepath) prefix.
     *
     * For example, if the original slug is "docs/v1.0.0/foo/bar", the unversionedSlug is "foo/bar".
     */
    unversionedSlug: Slug;
  }

  interface Redirect {
    type: "redirect";
    redirect: Slug;
  }

  interface NotFound {
    type: "notFound";
    redirect: Slug | undefined;
    authed: boolean | undefined;
  }
}

export function findNode(root: RootNode, slug: Slug): Node {
  const collector = NodeCollector.collect(root);
  const found = collector.getSlugMapWithParents().get(slug);

  // if the slug points to a node that doesn't exist, we should redirect to the first likely node
  if (found == null) {
    let maybeProductOrVersionNode: RootNode | ProductNode | VersionNode = root;
    let foundProductNode = false;

    // the 404 behavior should be product-aware
    for (const productNode of collector.getProductNodes()) {
      if (slug.startsWith(productNode.slug)) {
        maybeProductOrVersionNode = productNode;
        foundProductNode = true;
        break;
      }
    }

    // if we didn't find a product node, try to find a version node
    if (!foundProductNode) {
      // the 404 behavior should be version-aware
      for (const versionNode of collector.getVersionNodes()) {
        if (slug.startsWith(versionNode.slug)) {
          maybeProductOrVersionNode = versionNode;
          break;
        }
      }
    }

    return {
      type: "notFound",
      redirect: maybeProductOrVersionNode.pointsTo,
      authed: maybeProductOrVersionNode.authed,
    };
  }

  let sidebar = found.parents.find(isSidebarRootNode);
  const currentProductGroup = found.parents.find(isProductGroupNode);
  const currentProduct = found.parents.find(isProductNode);

  const currentVersion = found.parents.find(isVersionNode);
  const unversionedNode = found.parents.find(isUnversionedNode);
  const versionChild = (currentVersion ?? unversionedNode)?.child;

  if (!sidebar && currentVersion != null) {
    if (isSidebarRootNode(currentVersion.child)) {
      sidebar = currentVersion.child;
    }
  }

  const landingPage = (currentProductGroup ?? currentVersion ?? unversionedNode)
    ?.landingPage;

  const tabbedNode =
    found.parents.find(isTabbedNode) ??
    // fallback to the version child because the current node may be a landing page
    (versionChild != null && isTabbedNode(versionChild)
      ? versionChild
      : undefined);

  const apiReference =
    found.parents.find(isApiReferenceNode) ??
    (found.node.type === "apiReference" ? found.node : undefined);

  // if the node is visible (because it's a page), return it as "found"
  if (isPage(found.node)) {
    const parentsAndNode = [...found.parents, found.node];
    const tabbedNodeIndex = parentsAndNode.findIndex(
      (node) => node === tabbedNode
    );
    const currentTabNode =
      tabbedNodeIndex !== -1 ? parentsAndNode[tabbedNodeIndex + 1] : undefined;

    const products = collector.getProductNodes().map((node) => {
      if (node.default) {
        // if we're currently viewing the default product, we may be viewing the non-pruned product node
        if (node.id === currentProduct?.id) {
          return currentProduct;
        }
        // otherwise, we should always use the pruned product node
        return collector.defaultProductNode ?? node;
      }
      return node;
    });

    const versions = collector.getVersionNodes().map((node) => {
      if (node.default) {
        // if we're currently viewing the default version, we may be viewing the non-pruned version
        if (node.id === currentVersion?.id) {
          return currentVersion;
        }
        // otherwise, we should always use the pruned version node
        return collector.defaultVersionNode ?? node;
      }
      return node;
    });
    const currentTab =
      currentTabNode?.type === "tab" || currentTabNode?.type === "changelog"
        ? currentTabNode
        : undefined;
    const slugPrefix =
      currentProduct?.slug ?? currentVersion?.slug ?? root.slug;
    const unversionedSlug = Slug(
      found.node.slug.replace(new RegExp(`^${escapeRegExp(slugPrefix)}/`), "")
    );
    return {
      type: "found",
      node: found.node,
      breadcrumb: createBreadcrumb(found.parents),
      parents: found.parents,
      root,
      versions, // this is used to render the version switcher
      tabs: tabbedNode?.children ?? [],
      products,
      currentProduct,
      currentVersion,
      isCurrentProductDefault: currentProduct?.default
        ? currentProduct === collector.defaultProductNode
        : false,
      isCurrentVersionDefault: currentVersion?.default
        ? currentVersion === collector.defaultVersionNode
        : false,

      currentTab,
      sidebar,
      apiReference,
      landingPage,
      next: found.next,
      prev: found.prev,
      collector,
      unversionedSlug,
    };
  }

  // if the slug points matches the root node, redirect to the root node's pointsTo
  if (root.type === "root" && root.slug === slug && root.pointsTo != null) {
    return { type: "redirect", redirect: root.pointsTo };
  }

  // if the node has a redirect, return it
  if (hasRedirect(found.node) && found.node.pointsTo != null) {
    return { type: "redirect", redirect: found.node.pointsTo };
  }

  // if the node does not have a redirect, return a 404
  return {
    type: "notFound",
    redirect: currentVersion?.pointsTo ?? root.pointsTo,
    authed: found.node.authed,
  };
}
