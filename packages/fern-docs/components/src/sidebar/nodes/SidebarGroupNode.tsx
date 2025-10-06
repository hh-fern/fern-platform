import type { SidebarGroupNode as SidebarGroupNodeType } from "@fern-api/fdr-sdk/navigation";
import type { ReactNode } from "react";

import { SidebarClientNavigationChildInjector } from "./SidebarClientNavigationChildInjector";
import { SidebarNavigationChild } from "./SidebarNavigationChild";

interface SidebarGroupNodeProps {
    node: SidebarGroupNodeType;
}

export function SidebarGroupNode({ node }: SidebarGroupNodeProps): ReactNode {
    return (
        <ul className="fern-sidebar-group">
            {/* Inject client nodes for this group */}
            <SidebarClientNavigationChildInjector parentNodeId={node.id} childDepth={1} />
            {node.children.map((child) => (
                <li key={child.id}>
                    <SidebarNavigationChild node={child} depth={1} root />
                </li>
            ))}
        </ul>
    );
}
