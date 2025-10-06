import type { DocsLoader } from "@fern-api/docs-server/docs-loader";
import type { NodeId, SidebarRootNode as SidebarRootNodeType } from "@fern-api/fdr-sdk/navigation";

import { SidebarRootNodeImpl } from "./SidebarRootNodeImpl";

export async function SidebarRootNode({
    root,
    visibleNodeIds,
    loader
}: {
    root: SidebarRootNodeType | undefined;
    visibleNodeIds: NodeId[] | undefined;
    loader: DocsLoader;
}) {
    const authState = await loader.getAuthState();
    const edgeFlags = await loader.getEdgeFlags();

    return (
        <SidebarRootNodeImpl root={root} visibleNodeIds={visibleNodeIds} authState={authState} edgeFlags={edgeFlags} />
    );
}
