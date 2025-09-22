import { once } from "es-toolkit/function";

import { EMPTY_ARRAY } from "@fern-api/ui-core-utils";

import { pruneVersionNode } from "./utils/pruneVersionNode";
import type { NodeId, ProductNode, Slug, VersionNode } from "./versions/latest";
import {
  type NavigationNode,
  type NavigationNodeNeighbor,
  type NavigationNodeParent,
  type NavigationNodeWithMetadata,
  hasMarkdown,
  hasMetadata,
  isNeighbor,
  isPage,
  isProductNode,
  traverseDF,
} from "./versions/latest";

interface NavigationNodeWithMetadataAndParents {
  node: NavigationNodeWithMetadata;
  parents: readonly NavigationNodeParent[];
  next: NavigationNodeNeighbor | undefined;
  prev: NavigationNodeNeighbor | undefined;
}

const NodeCollectorInstances = new WeakMap<NavigationNode, NodeCollector>();

export class NodeCollector {
  private static readonly EMPTY = new NodeCollector(undefined);
  private nodesInOrder: NavigationNode[] = [];
  private idToNode = new Map<NodeId, NavigationNode>();
  private idToNodeParents = new Map<NodeId, readonly NavigationNodeParent[]>();
  private slugToNode = new Map<Slug, NavigationNodeWithMetadataAndParents>();
  private orphanedNodes: NavigationNodeWithMetadata[] = [];

  public static collect(rootNode: NavigationNode | undefined): NodeCollector {
    if (rootNode == null) {
      return NodeCollector.EMPTY;
    }
    const existing = NodeCollectorInstances.get(rootNode);
    if (existing != null) {
      return existing;
    }
    const instance = new NodeCollector(rootNode);
    NodeCollectorInstances.set(rootNode, instance);
    return instance;
  }

  #last: NavigationNodeWithMetadataAndParents | undefined;
  #lastNeighboringNode: NavigationNodeNeighbor | undefined;
  #setNode(
    slug: Slug,
    node: NavigationNodeWithMetadata,
    parents: readonly NavigationNodeParent[]
  ) {
    const toSet = {
      node,
      parents,
      prev: this.#lastNeighboringNode,
      next: undefined,
    };
    this.slugToNode.set(slug, toSet);

    if (isNeighbor(node)) {
      this.#lastNeighboringNode = node;
      if (this.#last != null) {
        this.#last.next = node;
      }
      this.#last = toSet;
    }
  }

  private versionNodes: VersionNode[] = [];
  private defaultVersion: VersionNode | undefined;

  private productNodes: ProductNode[] = [];
  private defaultProduct: ProductNode | undefined;

  constructor(rootNode: NavigationNode | undefined) {
    if (rootNode == null) {
      return;
    }
    traverseDF(rootNode, (node, parents) => {
      if (node.type === "product") {
        this.productNodes.push(node);
      }

      // if the node is the default version, make a copy of it and "prune" the version slug from all children nodes
      if (node.type === "version") {
        this.versionNodes.push(node);
      }

      if (node.type === "version" && node.default && rootNode.type === "root") {
        // if the node is the default version OF a product, we want to prune using the product slug, not the root slug.
        const productNode = parents.find(isProductNode);
        const copy = JSON.parse(JSON.stringify(node)) as VersionNode;
        this.defaultVersion = pruneVersionNode(
          copy,
          productNode?.slug ?? rootNode.slug,
          node.slug
        );
        traverseDF(this.defaultVersion, (node, innerParents) => {
          this.visitNode(node, [...parents, ...innerParents], true);
        });
      }

      this.visitNode(node, parents);
    });
  }

  private visitNode(
    node: NavigationNode,
    parents: readonly NavigationNodeParent[],
    isDefaultVersion = false
  ): void {
    if (!this.idToNode.has(node.id) || isDefaultVersion) {
      this.idToNode.set(node.id, node);
      this.idToNodeParents.set(node.id, parents);
      this.nodesInOrder.push(node);
    }

    if (node.type === "sidebarRoot") {
      this.#last = undefined;
      this.#lastNeighboringNode = undefined;
    }

    // there's currently no visitable page for changelog months and years
    if (
      !hasMetadata(node) ||
      node.type === "changelogMonth" ||
      node.type === "changelogYear"
    ) {
      return;
    }

    const existing = this.slugToNode.get(node.slug);
    if (existing == null) {
      this.#setNode(node.slug, node, parents);
    } else if (
      !node.hidden &&
      isPage(node) &&
      (existing.node.hidden || !isPage(existing.node))
    ) {
      this.orphanedNodes.push(existing.node);
      this.#setNode(node.slug, node, parents);
    } else {
      this.orphanedNodes.push(node);
    }
  }

  public getOrphanedNodes(): NavigationNodeWithMetadata[] {
    return this.orphanedNodes;
  }

  public getOrphanedPages: () => NavigationNodeWithMetadata[] = once(
    (): NavigationNodeWithMetadata[] => {
      return this.orphanedNodes.filter(isPage);
    }
  );

  private getSlugMap = once((): Map<string, NavigationNodeWithMetadata> => {
    return new Map(
      [...this.slugToNode.entries()].map(([slug, { node }]) => [slug, node])
    );
  });

  get slugMap(): Map<string, NavigationNodeWithMetadata> {
    return this.getSlugMap();
  }

  get defaultVersionNode(): VersionNode | undefined {
    return this.defaultVersion;
  }

  get defaultProductNode(): ProductNode | undefined {
    return this.defaultProduct;
  }

  public get(id: NodeId): NavigationNode | undefined {
    return this.idToNode.get(id);
  }

  public getParents(id: NodeId): readonly NavigationNodeParent[] {
    return this.idToNodeParents.get(id) ?? EMPTY_ARRAY;
  }

  public getSlugMapWithParents = (): ReadonlyMap<
    Slug,
    NavigationNodeWithMetadataAndParents
  > => {
    return this.slugToNode;
  };

  #getSlugs = once((): string[] => {
    return [...this.slugToNode.keys()];
  });
  get slugs(): string[] {
    return this.#getSlugs();
  }

  /**
   * Returns a list of slugs for all pages in the navigation tree.
   *
   * This includes hidden pages and noindex pages, but not authed pages, and is intended for revalidation purposes.
   *
   * @returns {string[]} A list of slugs for all canonical pages in the navigation tree.
   */
  #getStaticPageSlugs = once((): string[] => {
    return Array.from(
      new Set(
        [...this.slugToNode.values()]
          .filter(({ node }) => isPage(node))
          .filter(({ node }) => !node.authed)
          .map(({ node }) => node.slug)
      )
    );
  });
  get staticPageSlugs(): string[] {
    return this.#getStaticPageSlugs();
  }

  /**
   * Returns a list of slugs for pages that should be indexed by search engines, and by algolia.
   *
   * This excludes hidden pages and noindex pages, and uses the canonical slug if it exists.
   */
  #getIndexablePageSlugs = once((): string[] => {
    return Array.from(
      new Set(
        [...this.slugToNode.values()]
          .filter(({ node }) => isPage(node))
          .filter(({ node }) => !node.hidden && !node.authed)
          .filter(({ node }) => (hasMarkdown(node) ? !node.noindex : true))
          .map(({ node }) => node.canonicalSlug ?? node.slug)
      )
    );
  });
  get indexablePageSlugs(): string[] {
    return this.#getIndexablePageSlugs();
  }

  #getIndexablePageNodesWithAuth = once((): NavigationNodeWithMetadata[] => {
    const slugRecord: Record<string, NavigationNodeWithMetadata> = {};

    [...this.slugToNode.values()]
      .filter(({ node }) => isPage(node))
      .filter(({ node }) => !node.hidden)
      .filter(({ node }) => (hasMarkdown(node) ? !node.noindex : true))
      .forEach((node) => {
        const canonicalSlug = node.node.canonicalSlug ?? node.node.slug;
        // Only keep the first node we see for each canonical slug
        if (!(canonicalSlug in slugRecord)) {
          slugRecord[canonicalSlug] = node.node;
        }
      });

    return Object.values(slugRecord);
  });
  get indexablePageNodesWithAuth(): NavigationNodeWithMetadata[] {
    return this.#getIndexablePageNodesWithAuth();
  }

  public getProductNodes = (): ProductNode[] => {
    return this.productNodes;
  };

  public getVersionNodes = (): VersionNode[] => {
    return this.versionNodes;
  };

  public getNodesInOrder = (): NavigationNode[] => {
    return this.nodesInOrder;
  };
}
