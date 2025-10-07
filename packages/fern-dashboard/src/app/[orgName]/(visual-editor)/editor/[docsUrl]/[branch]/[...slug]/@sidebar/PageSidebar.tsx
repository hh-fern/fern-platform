"use client";

import type { DangerousTransmittableDocsLoaderData } from "@fern-api/docs-loader";
import { getIsSidebarFixed } from "@fern-api/docs-utils";
import { SidebarClientRootNode } from "@fern-docs/components/sidebar/nodes/SidebarClientRootNode";
import { SidebarClientTabsRoot } from "@fern-docs/components/sidebar/SidebarClientTabsRoot";
import { SidebarTabsList } from "@fern-docs/components/sidebar/SidebarTabsList";
import React, { useMemo } from "react";

import { CreatePageButton } from "./CreatePageButton";

interface PageSidebarProps {
    /** Maintains compat with existing docs sidebar API */
    prefetchedLoaderData: DangerousTransmittableDocsLoaderData;
}

const PageSidebar = React.memo(function PageSidebar({ prefetchedLoaderData }: PageSidebarProps) {
    const isSidebarFixed = getIsSidebarFixed(prefetchedLoaderData.config);

    // Get the root sidebar from layout - memoized by ID to prevent re-renders
    const sidebarRoot = useMemo(() => {
        return prefetchedLoaderData.layout?.sidebarRoot;
    }, [prefetchedLoaderData.layout?.sidebarRoot?.id]);

    // Get tabs from layout - memoized to prevent re-renders
    const tabs = useMemo(() => {
        return prefetchedLoaderData.layout?.tabs;
    }, [prefetchedLoaderData.layout?.tabs]);

    if (!sidebarRoot) {
        return null;
    }

    // Render the full navigation tree - selection state comes from global atoms
    // No need for visibleNodeIds or baseFoundNode - selection is managed by navigation state
    return (
        <>
            {tabs && tabs.length > 0 && (
                <SidebarClientTabsRoot loaderData={prefetchedLoaderData}>
                    <SidebarTabsList tabs={tabs} forceClientRender={true} />
                </SidebarClientTabsRoot>
            )}
            <CreatePageButton sidebarRoot={sidebarRoot} />
            <SidebarClientRootNode
                root={sidebarRoot}
                visibleNodeIds={undefined}
                loaderData={prefetchedLoaderData}
                forceClientRender={true}
            />
        </>
    );
});

export default PageSidebar;
