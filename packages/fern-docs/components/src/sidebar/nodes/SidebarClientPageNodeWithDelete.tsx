"use client";

import { ReactNode, useCallback } from "react";

import type * as FernNavigation from "@fern-api/fdr-sdk/navigation";

import { SidebarClientPageNode } from "./SidebarClientPageNode";
import { useSidebarDelete } from "./SidebarDeleteProvider";
import { SidebarPageNodeProps } from "./SidebarPageNode";

interface SidebarClientPageNodeWithDeleteProps extends SidebarPageNodeProps {}

export function SidebarClientPageNodeWithDelete({
  ...pageNodeProps
}: SidebarClientPageNodeWithDeleteProps): ReactNode {
  const { deleteClientPage } = useSidebarDelete();

  const handleDelete = useCallback(
    (nodeId: FernNavigation.NodeId) => {
      deleteClientPage(nodeId);
    },
    [deleteClientPage]
  );

  return <SidebarClientPageNode {...pageNodeProps} onDelete={handleDelete} />;
}
