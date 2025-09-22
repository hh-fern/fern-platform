import type { UnversionedNode } from "../../../client/generated/api/resources/navigation/resources/latest";
import type { NavigationNode } from "./NavigationNode";

export function isUnversionedNode(
  node: NavigationNode
): node is UnversionedNode {
  return node.type === "unversioned";
}
