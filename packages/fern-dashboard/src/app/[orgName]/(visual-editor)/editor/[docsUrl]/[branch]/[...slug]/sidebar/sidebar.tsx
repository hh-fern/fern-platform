"use client";

import type { DangerousTransmittableDocsLoaderData } from "@fern-api/docs-loader";
import { getIsSidebarFixed, getIsSingleOverviewPage } from "@fern-api/docs-utils";
import type { DocsV1Read } from "@fern-api/fdr-sdk/client/types";
import { type RootNode, Slug, utils } from "@fern-api/fdr-sdk/navigation";
import { getClientPageRedirectTarget } from "@fern-docs/components/navigation/pageUtils";
import { SidebarClientRootNode } from "@fern-docs/components/sidebar/nodes/SidebarClientRootNode";
import { SidebarClientTabsRoot } from "@fern-docs/components/sidebar/SidebarClientTabsRoot";
import { SidebarTabsList } from "@fern-docs/components/sidebar/SidebarTabsList";
import { HiddenSidebar } from "@fern-docs/components/theming/HiddenSidebar";
import { useSearchParams } from "next/navigation";
import { CreatePageButton } from "./CreatePageButton";

export function Sidebar({
    config,
    slug,
    root,
    prefetchedLoaderData
}: {
    config: Omit<DocsV1Read.DocsDefinition["config"], "navigation" | "root">;
    slug: Slug;
    root: RootNode;
    prefetchedLoaderData: DangerousTransmittableDocsLoaderData;
}) {
    const resolvedSearchParams = useSearchParams();
    const clientNodeId = resolvedSearchParams.get("client-node-id");

    let found = utils.findNode(root, slug);

    if (found.type !== "found") {
        // For client pages that don't exist in server navigation, we need to understand
        // the current tab context and use the default page for that tab as the foundNode
        if (found.redirect && clientNodeId) {
            const targetTabSlug = getClientPageRedirectTarget(root, slug, found.redirect);
            found = utils.findNode(root, Slug(targetTabSlug));
        } else if (found.redirect) {
            // Regular redirect logic for non-client pages
            found = utils.findNode(root, found.redirect);
        }
    }
    if (found.type !== "found") {
        return null;
    }

    // these are all the "visible" nodes to prevent pruning if any of these nodes are hidden
    const visibleNodes = [...found.parents, found.node];
    const visibleNodeIds = visibleNodes.map((node) => node.id);

    const isSingleOverviewPage = getIsSingleOverviewPage(found);
    const isSidebarFixed = getIsSidebarFixed(config);

    return (
        <>
            {found.tabs && found.tabs.length > 0 && (
                <SidebarClientTabsRoot loaderData={prefetchedLoaderData}>
                    <SidebarTabsList tabs={found.tabs} />
                </SidebarClientTabsRoot>
            )}
            {isSingleOverviewPage && !isSidebarFixed ? (
                <HiddenSidebar />
            ) : (
                <>
                    <CreatePageButton
                        root={found.sidebar}
                        navigationContext={{
                            currentProduct: found.currentProduct,
                            currentVersion: found.currentVersion,
                            currentTab: found.currentTab,
                            isCurrentVersionDefault: found.isCurrentVersionDefault,
                            isCurrentProductDefault: found.isCurrentProductDefault
                        }}
                    />
                    <SidebarClientRootNode
                        root={found.sidebar}
                        visibleNodeIds={visibleNodeIds}
                        loaderData={prefetchedLoaderData}
                    />
                </>
            )}
        </>
    );
}
