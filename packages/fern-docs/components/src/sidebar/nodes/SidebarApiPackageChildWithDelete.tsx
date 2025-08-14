"use client";

import { ReactNode } from "react";

import { UnreachableCaseError } from "ts-essentials";

import type * as FernNavigation from "@fern-api/fdr-sdk/navigation";

import { processIcon } from "../../processIcon";
import { SidebarApiLeafNode } from "./SidebarApiLeafNode";
import { SidebarApiPackageNodeWithDelete } from "./SidebarApiPackageNodeWithDelete";
import { SidebarChangelogNode } from "./SidebarChangelogNode";
import { SidebarEndpointPairNode } from "./SidebarEndpointPairNode";
import { SidebarLinkNode } from "./SidebarLinkNode";
import { SidebarPageNode } from "./SidebarPageNode";
import { useSidebarDelete } from "./SidebarDeleteProvider";

interface SidebarApiPackageChildWithDeleteProps {
  node: FernNavigation.ApiPackageChild | FernNavigation.ChangelogNode;
  depth: number;
  shallow: boolean;
}

export function SidebarApiPackageChildWithDelete({
  node,
  depth,
  shallow,
}: SidebarApiPackageChildWithDeleteProps): ReactNode {
  const { deleteServerPage } = useSidebarDelete();

  switch (node.type) {
    case "page":
      return (
        <SidebarPageNode
          icon={processIcon(node)}
          node={node}
          depth={depth}
          shallow={shallow}
          onDelete={deleteServerPage}
        />
      );
    case "link":
      return (
        <SidebarLinkNode icon={processIcon(node)} node={node} depth={depth} />
      );
    case "endpoint":
    case "webSocket":
    case "webhook":
    case "grpc":
      return <SidebarApiLeafNode node={node} depth={depth} shallow={shallow} />;
    case "endpointPair":
      return (
        <SidebarEndpointPairNode node={node} depth={depth} shallow={shallow} />
      );
    case "apiPackage":
      {
        (() => {
          if (node.children.every((child) => child.type === "grpc")) {
            node.icon = "fa-regular fa-layer-group";
          }
        })();
      }
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
              shallow={shallow}
            />
          ))}
        </SidebarApiPackageNodeWithDelete>
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