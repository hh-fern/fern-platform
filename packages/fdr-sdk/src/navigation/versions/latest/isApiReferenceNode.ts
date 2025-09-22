import type { ApiReferenceNode } from "../../../client/generated/api/resources/navigation/resources/latest";
import type { NavigationNode } from "./NavigationNode";

export function isApiReferenceNode(
  node: NavigationNode
): node is ApiReferenceNode {
  return node.type === "apiReference";
}
