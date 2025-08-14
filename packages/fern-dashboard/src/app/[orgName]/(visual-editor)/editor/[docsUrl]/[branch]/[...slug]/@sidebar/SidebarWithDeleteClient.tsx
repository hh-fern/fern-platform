"use client";

import { ReactNode } from "react";

import type * as FernNavigation from "@fern-api/fdr-sdk/navigation";
import { SidebarDeleteProvider } from "@fern-docs/components/sidebar/nodes/SidebarDeleteProvider";
import { SidebarRootNodeWithDeleteClient } from "@fern-docs/components/sidebar/nodes/SidebarRootNodeWithDeleteClient";

import { useMdxState } from "@/providers/MdxStateContext";

interface SidebarWithDeleteClientProps {
  root: FernNavigation.SidebarRootNode | undefined;
  visibleNodeIds: FernNavigation.NodeId[] | undefined;
}

export function SidebarWithDeleteClient({
  root,
  visibleNodeIds,
}: SidebarWithDeleteClientProps): ReactNode {
  const { stageDeletion } = useMdxState();

  return (
    <SidebarDeleteProvider root={root} stageDeletion={stageDeletion}>
      <SidebarRootNodeWithDeleteClient node={root} />
    </SidebarDeleteProvider>
  );
}