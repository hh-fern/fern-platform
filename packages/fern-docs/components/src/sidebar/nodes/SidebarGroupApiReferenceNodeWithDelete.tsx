"use client";

import { ReactNode } from "react";

import { FernNavigation } from "@fern-api/fdr-sdk";

import { WithFeatureFlags } from "../../feature-flags/WithFeatureFlags";
import { SidebarApiPackageChildWithDelete } from "./SidebarApiPackageChildWithDelete";

interface SidebarGroupApiReferenceNodeWithDeleteProps {
  node: FernNavigation.ApiReferenceNode;
  depth: number;
}

export function SidebarGroupApiReferenceNodeWithDelete({
  node,
  depth,
}: SidebarGroupApiReferenceNodeWithDeleteProps): ReactNode {
  const shallow = false;

  return (
    <WithFeatureFlags featureFlags={node.featureFlags}>
      <ul className="fern-sidebar-group">
        {node.children.map((child) => (
          <li key={child.id}>
            <SidebarApiPackageChildWithDelete
              node={child}
              depth={depth}
              shallow={shallow}
            />
          </li>
        ))}
      </ul>
    </WithFeatureFlags>
  );
}