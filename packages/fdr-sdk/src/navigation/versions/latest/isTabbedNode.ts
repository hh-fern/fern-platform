import type { TabbedNode } from "../../../client/generated/api/resources/navigation/resources/latest";
import type { NavigationNode } from "./NavigationNode";

export function isTabbedNode(node: NavigationNode): node is TabbedNode {
  return node.type === "tabbed";
}
