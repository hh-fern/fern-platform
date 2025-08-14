"use client";

import { UnreachableCaseError } from "ts-essentials";

import type * as FernNavigation from "@fern-api/fdr-sdk/navigation";

import { processIcon } from "../../processIcon";
import { SidebarGroupNodeWithDelete } from "./SidebarGroupNodeWithDelete";
import { SidebarRootApiPackageNodeWithDelete } from "./SidebarRootApiPackageNodeWithDelete";
import { SidebarRootSectionNodeWithDelete } from "./SidebarRootSectionNodeWithDelete";

export function SidebarRootChildWithDelete({
  node,
}: {
  node: FernNavigation.SidebarRootChild | FernNavigation.ApiPackageNode;
}) {
  switch (node.type) {
    case "sidebarGroup":
      return <SidebarGroupNodeWithDelete node={node} />;
    case "apiReference":
    case "apiPackage":
      return <SidebarRootApiPackageNodeWithDelete node={node} icon={processIcon(node)} />;
    case "section":
      return <SidebarRootSectionNodeWithDelete node={node} icon={processIcon(node)} />;
    default:
      throw new UnreachableCaseError(node);
  }
}