import structuredClone from "@ungap/structured-clone";

import { prunetree } from "../../utils/traversers/prunetree";
import {
  type NavigationNode,
  type NavigationNodeParent,
  type NavigationNodeWithMetadata,
  getChildren,
  hasMetadata,
  isPage,
  traverseBF,
} from "../versions/latest";
import { mutableDeleteChild } from "./deleteChild";
import { mutableUpdatePointsTo } from "./updatePointsTo";

type Predicate<T extends NavigationNode = NavigationNode> = (
  node: T,
  parents: readonly NavigationNodeParent[]
) => boolean;

export class Pruner<ROOT extends NavigationNode> {
  public static from<ROOT extends NavigationNode>(tree: ROOT): Pruner<ROOT> {
    return new Pruner(tree);
  }

  private tree: ROOT | undefined;
  private constructor(tree: ROOT) {
    this.tree = structuredClone(tree) as ROOT;
  }

  public keep(predicate: Predicate): this {
    if (this.tree == null) {
      return this;
    }
    const [result] = prunetree(this.tree, {
      predicate,
      getChildren: getChildren,
      getPointer: (node) => node.id,
      deleter: mutableDeleteChild,
    });
    this.tree = result;
    return this;
  }

  public remove(predicate: Predicate): this {
    return this.keep((node, parents) => !predicate(node, parents));
  }

  public hide(predicate: Predicate<NavigationNodeWithMetadata>): this {
    if (this.tree == null) {
      return this;
    }
    traverseBF(this.tree, (node, parents) => {
      if (hasMetadata(node)) {
        node.hidden = predicate(node, parents);
      }
    });
    return this;
  }

  public authed(predicate: Predicate): this {
    if (this.tree == null) {
      return this;
    }

    const unauthedParents = new Set<NavigationNodeParent>();

    // step 1. mark nodes as authed if the match the predicate
    traverseBF(this.tree, (node, parents) => {
      if (hasMetadata(node)) {
        node.authed = predicate(node, parents) ? true : undefined;
        if (!node.authed) {
          for (const parent of parents) {
            unauthedParents.add(parent);
          }
        }
      }
    });

    // step 2. remove auth flag on edge nodes that contain children that are unauthed
    // this helps us improve the rendering of the navigation tree and avoid deleting nodes that contain
    // children that can be visited.
    // Note: sections with overview pages are skipped here because the pages need to be filtered out
    // by the mutableDeleteChild function, which relies on the authed flag in a separate pass.
    for (const parent of unauthedParents) {
      if (hasMetadata(parent) && !isPage(parent)) {
        parent.authed = undefined;
      }
    }

    return this;
  }

  public get(): ROOT | undefined {
    if (this.tree == null) {
      return undefined;
    }
    mutableUpdatePointsTo(this.tree);
    return this.tree;
  }
}
