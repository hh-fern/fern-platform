"use client";

import { ReactNode } from "react";

import { UnreachableCaseError } from "ts-essentials";

import type * as FernNavigation from "@fern-api/fdr-sdk/navigation";

import { processIcon } from "../../processIcon";
import { SidebarClientPageNodeWithDelete } from "./SidebarClientPageNodeWithDelete";

interface SidebarClientNavigationChildProps {
  node: FernNavigation.NavigationChild;
  depth: number;
  root?: boolean;
}

export function SidebarClientNavigationChild({
  node,
  depth,
}: SidebarClientNavigationChildProps): ReactNode {
  switch (node.type) {
    case "page":
      return (
        <SidebarClientPageNodeWithDelete
          className="cursor-pointer"
          node={node}
          depth={depth}
          icon={processIcon(node)}
        />
      );
    case "apiReference":
    case "section":
    case "link":
    case "changelog":
      throw new Error(
        "Client navigation children cannot be of type " + node.type
      );
    default:
      throw new UnreachableCaseError(node);
  }
}
