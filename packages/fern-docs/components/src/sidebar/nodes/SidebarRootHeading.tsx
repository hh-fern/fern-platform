import { hasMarkdown, type NavigationNodeSection } from "@fern-api/fdr-sdk/navigation";
import type { ReactElement } from "react";

import { cn } from "../../cn";
import { SidebarPageNode } from "./SidebarPageNode";

interface SidebarRootHeadingProps {
    node: NavigationNodeSection;
    icon: React.ReactNode;
    className: string | undefined;
    shallow?: boolean;
}

export function SidebarRootHeading({ node, icon, className, shallow }: SidebarRootHeadingProps): ReactElement<any> {
    if (hasMarkdown(node)) {
        return (
            <SidebarPageNode
                node={node}
                depth={0}
                className={cn(className, "!text-body font-semibold")}
                shallow={shallow}
                icon={icon}
            />
        );
    }

    return (
        <div className={cn("fern-sidebar-heading", className)}>
            {icon}
            <span className="fern-sidebar-heading-content">{node.title}</span>
        </div>
    );
}
