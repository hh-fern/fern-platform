"use client";

import { ReactNode } from "react";

import * as FernNavigation from "@fern-api/fdr-sdk/navigation";

import { WithFeatureFlags } from "../../feature-flags/WithFeatureFlags";
import { SidebarClientNavigationChildInjector } from "./SidebarClientNavigationChildInjector";
import { SidebarNavigationChildWithDelete } from "./SidebarNavigationChildWithDelete";
import { SidebarPageNode } from "./SidebarPageNode";
import { useSidebarDelete } from "./SidebarDeleteProvider";
import { SidebarRootHeading } from "./SidebarRootHeading";

interface SidebarRootSectionNodeWithDeleteProps {
  node: FernNavigation.SectionNode;
  icon: React.ReactNode;
  className?: string;
}

export function SidebarRootSectionNodeWithDelete({
  node,
  icon,
  className,
}: SidebarRootSectionNodeWithDeleteProps): ReactNode {
  const { deleteServerPage } = useSidebarDelete();

  // If the node has no children, it is a page node.
  if (node.children.length === 0 && FernNavigation.hasMarkdown(node)) {
    return (
      <SidebarPageNode
        node={node}
        depth={0}
        className={className}
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
      <SidebarRootHeading node={node} className={className} icon={icon} />

      <ul className="fern-sidebar-group">
        {/* Depends on SidebarClientNavigationProvider for client nodes, no-op when provider isn't available */}
        <SidebarClientNavigationChildInjector
          parentNodeId={node.id}
          childDepth={1}
        />
        {node.children.map((child) => (
          <li key={child.id}>
            <SidebarNavigationChildWithDelete node={child} depth={1} />
          </li>
        ))}
      </ul>
    </WithFeatureFlags>
  );
}