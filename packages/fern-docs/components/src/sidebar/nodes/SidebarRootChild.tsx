import type { ApiPackageNode, SidebarRootChild as SidebarRootChildType } from "@fern-api/fdr-sdk/navigation";
import { UnreachableCaseError } from "ts-essentials";

import { processIcon } from "../../processIcon";
import { SidebarGroupNode } from "./SidebarGroupNode";
import { SidebarRootApiPackageNode } from "./SidebarRootApiPackageNode";
import { SidebarRootSectionNode } from "./SidebarRootSectionNode";

export function SidebarRootChild({ node }: { node: SidebarRootChildType | ApiPackageNode }) {
    switch (node.type) {
        case "sidebarGroup":
            return <SidebarGroupNode node={node} />;
        case "apiReference":
        case "apiPackage":
            return <SidebarRootApiPackageNode node={node} icon={processIcon(node)} />;
        case "section":
            return <SidebarRootSectionNode node={node} icon={processIcon(node)} />;
        default:
            throw new UnreachableCaseError(node);
    }
}
