import "server-only";

import { createCachedDocsLoader } from "@fern-api/docs-loader";
import { getTabs } from "@fern-api/docs-server/handle-node-fallbacks";
import {
  getIsSidebarFixed,
  getIsSingleOverviewPage,
} from "@fern-api/docs-utils";
import { FernNavigation } from "@fern-api/fdr-sdk";
import { slugjoin } from "@fern-api/fdr-sdk/navigation";
import { SidebarTabsList } from "@fern-docs/components/sidebar/SidebarTabsList";
import { SidebarTabsRootServer } from "@fern-docs/components/sidebar/SidebarTabsRootServer";
import { SidebarRootNode } from "@fern-docs/components/sidebar/nodes/SidebarRootNode";
import { HiddenSidebar } from "@fern-docs/components/state/layout";

import { getFernToken } from "@/app/fern-token";

export default async function SidebarPage({
  params,
}: {
  params: Promise<{ host: string; domain: string; slug: string }>;
}) {
  const { host, domain, slug } = await params;
  const loader = await createCachedDocsLoader(
    host,
    domain,
    await getFernToken()
  );
  const config = await loader.getConfig();
  const isSidebarFixed = getIsSidebarFixed(config);

  const showHiddenNodes = (await loader.getEdgeFlags())
    .isAuthenticatedPagesDiscoverable;

  const root = await loader.getRoot();

  const authState = await loader.getAuthState();

  // preload:
  await loader.getLayout();

  const found = FernNavigation.utils.findNode(root, slugjoin(slug));
  if (found.type !== "found") {
    console.log("[dynamic-sidebar] not found");
    if (root.child.type === "productgroup") {
      console.log(
        "[dynamic-sidebar] root.child productgroup.length:",
        root.child.children.length
      );
    } else {
      console.log("[dynamic-sidebar] root.child.type:", root.child.type);
    }

    console.log("[dynamic-sidebar] metadata:", await loader.getMetadata());

    return null;
  }

  // these are all the "visible" nodes to prevent pruning if any of these nodes are hidden
  const visibleNodes = [...found.parents, found.node];
  const visibleNodeIds = visibleNodes.map((node) => node.id);

  const isSingleOverviewPage = getIsSingleOverviewPage(found);

  const tabs = getTabs(
    found,
    root,
    slug,
    showHiddenNodes,
    authState.authed ? (authState.user.roles ?? []) : []
  );

  const hideSidebar = isSingleOverviewPage && !isSidebarFixed;

  if (hideSidebar) {
    console.log("[dynamic-sidebar] hideSidebar:", hideSidebar);
    console.log(
      "[dynamic-sidebar] isSingleOverviewPage:",
      isSingleOverviewPage
    );
    console.log("[dynamic-sidebar] isSidebarFixed:", isSidebarFixed);
    console.log(
      "[dynamic-sidebar] found.currentProduct:",
      found.currentProduct
    );
    console.log("[dynamic-sidebar] config.layout:", config.layout);
  }

  return (
    <>
      {tabs && tabs.length > 0 && (
        <SidebarTabsRootServer loader={loader}>
          <SidebarTabsList tabs={tabs} />
        </SidebarTabsRootServer>
      )}
      {hideSidebar ? (
        <HiddenSidebar blame="dynamic-sidebar" />
      ) : (
        <SidebarRootNode
          root={found.sidebar}
          visibleNodeIds={visibleNodeIds}
          loader={loader}
        />
      )}
    </>
  );
}
