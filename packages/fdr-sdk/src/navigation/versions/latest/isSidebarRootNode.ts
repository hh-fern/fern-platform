import type { SidebarRootNode } from "../../../client/generated/api/resources/navigation/resources/latest";
import type { NavigationNode } from "./NavigationNode";

export function isSidebarRootNode(
  node: NavigationNode
): node is SidebarRootNode {
  return node.type === "sidebarRoot";
}
