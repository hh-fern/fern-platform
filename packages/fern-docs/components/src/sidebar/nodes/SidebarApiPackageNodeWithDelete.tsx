"use client";

import React, { ReactNode } from "react";

import * as FernNavigation from "@fern-api/fdr-sdk/navigation";

import { SidebarCollapseGroup } from "./SidebarCollapseGroup";
import { SidebarGroupApiReferenceNodeWithDelete } from "./SidebarGroupApiReferenceNodeWithDelete";
import { SidebarPageNode } from "./SidebarPageNode";
import { useSidebarDelete } from "./SidebarDeleteProvider";

export interface SidebarApiPackageNodeWithDeleteProps {
  node: FernNavigation.ApiReferenceNode | FernNavigation.ApiPackageNode;
  icon: React.ReactNode;
  depth: number;
  className?: string;
  children: ReactNode;
}

export function SidebarApiPackageNodeWithDelete({
  node,
  icon,
  depth,
  className,
  children,
}: SidebarApiPackageNodeWithDeleteProps): ReactNode {
  const { deleteServerPage } = useSidebarDelete();

  if (
    React.Children.count(children) === 0 &&
    FernNavigation.hasMarkdown(node)
  ) {
    return (
      <SidebarPageNode
        node={node}
        depth={depth}
        className={className}
        shallow={false}
        icon={icon}
        onDelete={deleteServerPage}
      />
    );
  }

  if (React.Children.count(children) === 0) {
    return null;
  }

  if (node.type === "apiReference" && node.hideTitle) {
    return <SidebarGroupApiReferenceNodeWithDelete node={node} depth={depth} />;
  }

  return (
    <SidebarCollapseGroup
      node={node}
      icon={icon}
      depth={depth}
      className={className}
    >
      {children}
    </SidebarCollapseGroup>
  );
}