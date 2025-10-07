"use client";

import type { DangerousTransmittableDocsLoaderData } from "@fern-api/docs-loader";
import { getIsSidebarFixed } from "@fern-api/docs-utils";
import type * as FernNavigation from "@fern-api/fdr-sdk/navigation";
import { useNavigation } from "@fern-docs/components/navigation";
import { SidebarClientRootNode } from "@fern-docs/components/sidebar/nodes/SidebarClientRootNode";
import { SidebarClientTabsRoot } from "@fern-docs/components/sidebar/SidebarClientTabsRoot";
import { SidebarTabsList } from "@fern-docs/components/sidebar/SidebarTabsList";
import React, { useMemo } from "react";

import { CreatePageButton } from "./CreatePageButton";

interface PageSidebarProps {
    /** Maintains compat with existing docs sidebar API */
    prefetchedLoaderData: DangerousTransmittableDocsLoaderData;
}

/**
 * Merges client pages from the navigation store into the sidebar tree
 */
function mergeSidebarWithClientPages(
    baseSidebar: FernNavigation.SidebarRootNode,
    registeredPages: ReturnType<typeof useNavigation>["registeredPages"]
): FernNavigation.SidebarRootNode {
    // Clone the sidebar to avoid mutating the original
    const clonedSidebar = JSON.parse(JSON.stringify(baseSidebar)) as FernNavigation.SidebarRootNode;

    // Get all client pages that need to be added
    const clientPages = Object.values(registeredPages).filter(
        (entry) => entry.pageData.source === "client" && !entry.isMarkedForDeletion
    );

    // Insert client pages into their parent sections
    for (const clientPage of clientPages) {
        const pageNode = clientPage.pageData.foundNode?.node;
        const parentSectionId = clientPage.parentSectionId;

        if (!pageNode || pageNode.type !== "page" || !parentSectionId) {
            continue;
        }

        // Find the parent section in the cloned sidebar and add the page
        const addPageToSection = (node: FernNavigation.NavigationNode): boolean => {
            if (node.id === parentSectionId && node.type === "section") {
                // Check if page already exists
                const existingPageIndex = node.children.findIndex(
                    (child) => child.type === "page" && child.slug === pageNode.slug
                );

                if (existingPageIndex === -1) {
                    // Add the page if it doesn't exist
                    node.children.push(pageNode);
                }
                return true;
            }

            // Recursively search in children
            if ("children" in node && Array.isArray(node.children)) {
                for (const child of node.children) {
                    if (addPageToSection(child)) {
                        return true;
                    }
                }
            }

            return false;
        };

        // Try to add the page to the sidebar
        for (const child of clonedSidebar.children) {
            if (addPageToSection(child)) {
                break;
            }
        }
    }

    return clonedSidebar;
}

const PageSidebar = React.memo(function PageSidebar({ prefetchedLoaderData }: PageSidebarProps) {
    const isSidebarFixed = getIsSidebarFixed(prefetchedLoaderData.config);
    const { registeredPages, hydrated } = useNavigation();

    // Get the root sidebar from layout - memoized by ID to prevent re-renders
    const baseSidebarRoot = useMemo(() => {
        return prefetchedLoaderData.layout?.sidebarRoot;
    }, [prefetchedLoaderData.layout?.sidebarRoot?.id]);

    // Merge client pages into the sidebar tree when navigation store changes
    const sidebarRoot = useMemo(() => {
        if (!baseSidebarRoot || !hydrated) {
            return baseSidebarRoot;
        }
        return mergeSidebarWithClientPages(baseSidebarRoot, registeredPages);
    }, [baseSidebarRoot, registeredPages, hydrated]);

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
