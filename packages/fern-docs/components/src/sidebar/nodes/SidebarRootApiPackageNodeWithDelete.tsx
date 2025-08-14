"use client";

import * as FernNavigation from "@fern-api/fdr-sdk/navigation";

import { cn } from "../../cn";
import { WithFeatureFlags } from "../../feature-flags/WithFeatureFlags";
import { SidebarApiPackageChildWithDelete } from "./SidebarApiPackageChildWithDelete";
import { SidebarPageNode } from "./SidebarPageNode";
import { SidebarRootHeading } from "./SidebarRootHeading";
import { useSidebarDelete } from "./SidebarDeleteProvider";

export interface SidebarRootApiPackageNodeWithDeleteProps {
  node: FernNavigation.ApiReferenceNode | FernNavigation.ApiPackageNode;
  icon: React.ReactNode;
  className?: string;
}

export function SidebarRootApiPackageNodeWithDelete({
  node,
  icon,
  className,
}: SidebarRootApiPackageNodeWithDeleteProps) {
  const { deleteServerPage } = useSidebarDelete();
  const shallow = false;

  if (node.children.length === 0 && FernNavigation.hasMarkdown(node)) {
    return (
      <SidebarPageNode
        node={node}
        depth={0}
        className={cn(className, "!text-body font-semibold")}
        shallow={shallow}
        icon={icon}
        onDelete={deleteServerPage}
      />
    );
  }

  if (node.children.length === 0) {
    return null;
  }

  return (
    <WithFeatureFlags featureFlags={node.featureFlags}>
      <SidebarRootHeading
        node={node}
        className={className}
        shallow={shallow}
        icon={icon}
      />

      <ul className="fern-sidebar-group">
        {node.children.map((child) => (
          <li key={child.id}>
            <SidebarApiPackageChildWithDelete node={child} depth={1} shallow={shallow} />
          </li>
        ))}
        {node.type === "apiReference" && node.changelog != null && (
          <li>
            <SidebarApiPackageChildWithDelete
              node={node.changelog}
              depth={1}
              shallow={shallow}
            />
          </li>
        )}
      </ul>
    </WithFeatureFlags>
  );
}