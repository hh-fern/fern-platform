import { NodeCollector } from "../NodeCollector";
import {
  type NavigationNode,
  hasPointsTo,
  traverseDF,
} from "../versions/latest";
import { followRedirect } from "./followRedirect";

/**
 * Uses depth-first traversal to update the pointsTo property of all nodes in the tree.
 *
 * @param input will be mutated
 */
export function mutableUpdatePointsTo(input: NavigationNode): void {
  const collector = NodeCollector.collect(input);
  const slugMap = collector.getSlugMapWithParents();

  traverseDF(input, (node) => {
    if (hasPointsTo(node)) {
      const pointsTo = followRedirect(node);
      if (pointsTo != null) {
        if (node.type === "root") {
          const targetNode = slugMap.get(pointsTo)?.node;
          // if the node we should redirect to has a canonical url, default to that
          if (targetNode != null) {
            node.pointsTo =
              targetNode.canonicalSlug ??
              (node.slug === targetNode.slug ? undefined : targetNode.slug);
          }
        } else {
          node.pointsTo = node.slug === pointsTo ? undefined : pointsTo;
        }
      } else {
        node.pointsTo = undefined;
      }
    }
  });
}
