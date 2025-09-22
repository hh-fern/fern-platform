import {
  type ApiReferenceNode,
  type NavigationNode,
  traverseDF,
} from "../versions/latest";

export function collectApiReferences(nav: NavigationNode): ApiReferenceNode[] {
  const apiReferences: ApiReferenceNode[] = [];
  traverseDF(nav, (node) => {
    if (node.type === "apiReference") {
      apiReferences.push(node);
      return "skip";
    }
    return true;
  });
  return apiReferences;
}
