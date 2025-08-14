"use client";

import { ReactNode } from "react";

import type * as FernNavigation from "@fern-api/fdr-sdk/navigation";

import { SidebarNavigationChildWithDelete } from "./SidebarNavigationChildWithDelete";

interface SidebarGroupNodeWithDeleteProps {
  node: FernNavigation.SidebarGroupNode;
}

export function SidebarGroupNodeWithDelete({ node }: SidebarGroupNodeWithDeleteProps): ReactNode {
  return (
    <ul className="fern-sidebar-group">
      {node.children.map((child) => (
        <li key={child.id}>
          <SidebarNavigationChildWithDelete node={child} depth={1} root />
        </li>
      ))}
    </ul>
  );
}