import { ReactNode } from "react";

import { DocsLoader } from "@fern-api/docs-server/docs-loader";
import { withPrunedNavigation } from "@fern-api/docs-server/withPrunedNavigation";
import type * as FernNavigation from "@fern-api/fdr-sdk/navigation";

import { SidebarWithDeleteClient } from "./SidebarWithDeleteClient";

interface SidebarWithDeleteWrapperProps {
  root: FernNavigation.SidebarRootNode | undefined;
  visibleNodeIds: FernNavigation.NodeId[] | undefined;
  loader: DocsLoader;
}

export async function SidebarWithDeleteWrapper({
  root,
  visibleNodeIds,
  loader,
}: SidebarWithDeleteWrapperProps): Promise<ReactNode> {
  // Process async operations in Server Component
  const authState = await loader.getAuthState();
  const edgeFlags = await loader.getEdgeFlags();

  const processedRoot = withPrunedNavigation(root, {
    visibleNodeIds: visibleNodeIds,
    authed: authState.authed,
    // when true, all unauthed pages are visible, but rendered with a LOCK button
    // so they're not actually "pruned" from the sidebar
    // TODO: move this out of a feature flag and into the navigation node metadata
    discoverable: edgeFlags.isAuthenticatedPagesDiscoverable
      ? (true as const)
      : undefined,
  });

  // Pass only serializable data to Client Component
  return (
    <SidebarWithDeleteClient
      root={processedRoot}
      visibleNodeIds={visibleNodeIds}
    />
  );
}