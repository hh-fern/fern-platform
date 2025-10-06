"use client";

import { type DangerousTransmittableDocsLoaderData, PrefetchedDocsLoader } from "@fern-api/docs-loader/client";
import type { NodeId, SidebarRootNode } from "@fern-api/fdr-sdk/navigation";

import { SidebarRootNodeImpl } from "./SidebarRootNodeImpl";

export function SidebarClientRootNode({
    root,
    visibleNodeIds,
    loaderData
}: {
    root: SidebarRootNode | undefined;
    visibleNodeIds: NodeId[] | undefined;
    loaderData: DangerousTransmittableDocsLoaderData;
}) {
    const loader = PrefetchedDocsLoader.fromSerializable(loaderData);
    const authState = loader.getAuthState();
    const edgeFlags = loader.getEdgeFlags();

    return (
        <SidebarRootNodeImpl root={root} visibleNodeIds={visibleNodeIds} authState={authState} edgeFlags={edgeFlags} />
    );
}
