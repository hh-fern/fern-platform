import {
    type ApiDefinitionId,
    isApiLeaf,
    type NavigationNode,
    type NavigationNodeApiLeaf,
    type NodeId,
    traverseDF,
    utils
} from "@fern-api/fdr-sdk/navigation";

import { createBreadcrumbSlicer } from "./breadcrumb";

export interface ApiGroup {
    api: ApiDefinitionId;
    id: NodeId;
    breadcrumb: readonly string[];
    items: NavigationNodeApiLeaf[];
}

const trimBreadcrumbs = createBreadcrumbSlicer<ApiGroup>({
    selectBreadcrumb: (apiGroup) => apiGroup.breadcrumb,
    updateBreadcrumb: (apiGroup, breadcrumb) => ({ ...apiGroup, breadcrumb })
});

export function flattenApiSection(root: NavigationNode | undefined): ApiGroup[] {
    if (root == null) {
        return [];
    }
    const result: ApiGroup[] = [];
    traverseDF(root, (node, parents) => {
        if (node.type === "changelog") {
            return "skip";
        }
        if (node.type === "apiReference" || node.type === "apiPackage") {
            // webhooks are not supported in the playground
            const items = node.children.filter(isApiLeaf).filter((item) => item.type !== "webhook");
            if (items.length === 0) {
                return;
            }

            // current node should be included in the breadcrumb
            const breadcrumb = utils.createBreadcrumb([...parents, node]).map((breadcrumb) => breadcrumb.title);

            result.push({
                api: node.apiDefinitionId,
                id: node.id,
                breadcrumb,
                items
            });
        }
        return;
    });

    return trimBreadcrumbs(result);
}
