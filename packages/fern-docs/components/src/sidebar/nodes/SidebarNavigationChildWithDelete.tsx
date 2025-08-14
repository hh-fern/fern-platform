"use client";

import { ReactNode } from "react";

import { UnreachableCaseError } from "ts-essentials";

import type * as FernNavigation from "@fern-api/fdr-sdk/navigation";

import { cn } from "../../cn";
import { processIcon } from "../../processIcon";
import { SidebarApiPackageChildWithDelete } from "./SidebarApiPackageChildWithDelete";
import { SidebarApiPackageNodeWithDelete } from "./SidebarApiPackageNodeWithDelete";
import { SidebarChangelogNode } from "./SidebarChangelogNode";
import { SidebarLinkNode } from "./SidebarLinkNode";
import { SidebarPageNode } from "./SidebarPageNode";
import { SidebarSectionNode } from "./SidebarSectionNode";
import { useSidebarDelete } from "./SidebarDeleteProvider";

interface SidebarNavigationChildWithDeleteProps {
  node: FernNavigation.NavigationChild;
  depth: number;
  root?: boolean;
}

export function SidebarNavigationChildWithDelete({
  node,
  depth,
  root,
}: SidebarNavigationChildWithDeleteProps): ReactNode {
  const { deleteServerPage } = useSidebarDelete();

  switch (node.type) {
    case "apiReference":
      return (
        <SidebarApiPackageNodeWithDelete
          node={node}
          depth={depth}
          icon={processIcon(node)}
        >
          {node.children.map((node: FernNavigation.ApiPackageChild) => (
            <SidebarApiPackageChildWithDelete
              key={node.id}
              node={node}
              depth={depth + 1}
              shallow={false}
            />
          ))}
        </SidebarApiPackageNodeWithDelete>
      );
    case "section":
      return (
        <SidebarSectionNode
          node={node}
          icon={processIcon(node)}
          depth={depth}
          className={cn({
            "!text-body font-semibold": root,
          })}
        >
          {node.children.map((node: FernNavigation.NavigationChild) => (
            <SidebarNavigationChildWithDelete
              key={node.id}
              node={node}
              depth={depth + 1}
            />
          ))}
        </SidebarSectionNode>
      );
    case "page":
      return (
        <SidebarPageNode 
          node={node} 
          depth={depth} 
          icon={processIcon(node)} 
          onDelete={deleteServerPage}
        />
      );
    case "link":
      return (
        <SidebarLinkNode node={node} depth={depth} icon={processIcon(node)} />
      );
    case "changelog":
      return (
        <SidebarChangelogNode
          node={node}
          depth={depth}
          icon={processIcon(node)}
        />
      );
    default:
      throw new UnreachableCaseError(node);
  }
}